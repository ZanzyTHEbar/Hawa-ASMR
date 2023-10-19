#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

// TODO: Implement Resources and asset protocol tauri api for loading sound files
// TODO: Implement support for local media server
// TODO: Move system tray logic to menu module
// TODO: Implement context menu for setting debug mode

#[cfg(target_os = "linux")]
use std::fs::metadata;
#[cfg(target_os = "linux")]
use std::path::PathBuf;
use std::time::Duration;

use std::env;
use tauri::{
  self,
  http::{header::*, status::StatusCode, HttpRange, ResponseBuilder},
  ipc::RemoteDomainAccessScope,
  CustomMenuItem, Manager, RunEvent, SystemTray, SystemTrayEvent, SystemTrayMenu, WindowEvent,
};
use tauri_plugin_positioner::{Position, WindowExt};

use serde::Serialize;
use tokio::time::sleep;

use std::sync::{Arc, Mutex};
use std::{
  io::{Read, Seek, SeekFrom, Write},
  path::PathBuf,
  process::{Command, Stdio},
};

mod modules;
//use modules::menu;
use modules::tauri_commands;

#[derive(Clone, Serialize)]
struct SingleInstancePayload {
  args: Vec<String>,
  cwd: String,
}

#[tokio::main]
async fn main() -> tauri::Result<()> {
  // NOTE: for production use `rand` crate to generate a random boundary
  let boundary_id = Arc::new(Mutex::new(0));

  let mut system_tray_menu = SystemTrayMenu::new();

  if cfg!(target_os = "linux") {
    let open = CustomMenuItem::new("open".to_string(), "Open");
    system_tray_menu = system_tray_menu.clone().add_item(open);
  }

  let quit = CustomMenuItem::new("quit".to_string(), "Quit").accelerator("Cmd+Q");
  system_tray_menu = system_tray_menu.clone().add_item(quit);

  let app = tauri::Builder::default();

  let app = app.on_window_event(|e| {
    if let WindowEvent::Resized(_) = e.event() {
      std::thread::sleep(std::time::Duration::from_nanos(1));
    }
  });

  let app = app
    .invoke_handler(tauri::generate_handler![
      tauri_commands::get_user,
      tauri_commands::handle_save_window_state,
      tauri_commands::handle_load_window_state,
      tauri_commands::video_uri,
    ])
    .plugin(tauri_plugin_positioner::init())
    .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
      app
        .emit_all("new-instance", Some(SingleInstancePayload { args, cwd }))
        .unwrap_or_else(|e| {
          eprintln!("Failed to emit new-instance event: {}", e);
        });
    }))
    // persistent storage with file system
    .plugin(tauri_plugin_store::Builder::default().build())
    // save window position and size between sessions
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .setup(move |app| {
      //#[cfg(feature = "updater")]
      //tauri::updater::builder(app.handle()).should_install(|_current, _latest| true);

      let app_handle = app.handle();

      app.windows().iter().for_each(|(_, window)| {
        tokio::spawn({
          async move {
            sleep(Duration::from_secs(3)).await;
          }
        });

        window.set_decorations(false).unwrap();
      });

      // Configure IPC for custom protocol
      app.ipc_scope().configure_remote_access(
        RemoteDomainAccessScope::new("localhost")
          .allow_on_scheme("vibin")
          .add_window("main"),
      );

      // log to file, stdout and webview console support
      app_handle
        .plugin(
          tauri_plugin_log::Builder::default()
            .targets([
              tauri_plugin_log::LogTarget::LogDir,
              tauri_plugin_log::LogTarget::Stdout,
              tauri_plugin_log::LogTarget::Webview,
            ])
            .filter(|metadata| metadata.target() != "polling::iocp")
            .level(tauri_commands::handle_debug(app_handle.clone()).unwrap())
            .build(),
        )
        .expect("Failed to initialize logger");

      Ok(())
    })
    .system_tray(SystemTray::new().with_menu(system_tray_menu))
    .on_system_tray_event(|app, event| {
      tauri_plugin_positioner::on_tray_event(app, &event);
      match event {
        SystemTrayEvent::LeftClick {
          position: _,
          size: _,
          ..
        } => {
          let window = app.get_window("main").unwrap();
          let _ = window.move_window(Position::TrayCenter);

          if window.is_visible().unwrap() {
            window.hide().unwrap();
          } else {
            window.show().unwrap();
            window.set_focus().unwrap();
          }
        }
        SystemTrayEvent::RightClick {
          position: _,
          size: _,
          ..
        } => {
          println!("system tray received a right click");
        }
        SystemTrayEvent::DoubleClick {
          position: _,
          size: _,
          ..
        } => {
          println!("system tray received a double click");
        }
        SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
          "open" => {
            let window = app.get_window("main").unwrap();
            window.show().unwrap();
            window.set_focus().unwrap();
          }
          "quit" => {
            std::process::exit(0);
          }
          "hide" => {
            let window = app.get_window("main").unwrap();
            window.hide().unwrap();
          }
          _ => {}
        },
        _ => {}
      }
    })
    .on_window_event(|event| match event.event() {
      tauri::WindowEvent::Focused(is_focused) => {
        if !is_focused {
          event.window().hide().unwrap();
        }
      }
      WindowEvent::ThemeChanged(_) => todo!(),
      _ => {}
    })
    .register_uri_scheme_protocol("stream", move |_app, request| {
      // get the file path
      let path = request.uri().strip_prefix("stream://localhost/").unwrap();
      let path = percent_encoding::percent_decode(path.as_bytes())
        .decode_utf8_lossy()
        .to_string();

      //if path != "test_video.mp4" {
      //  // return error 404 if it's not our video
      //  return ResponseBuilder::new().status(404).body(Vec::new());
      //}

      let mut file = std::fs::File::open(&path)?;

      // get file length
      let len = {
        let old_pos = file.stream_position()?;
        let len = file.seek(SeekFrom::End(0))?;
        file.seek(SeekFrom::Start(old_pos))?;
        len
      };

      let mut resp = ResponseBuilder::new().header(CONTENT_TYPE, "video/mp4");

      // if the webview sent a range header, we need to send a 206 in return
      // Actually only macOS and Windows are supported. Linux will ALWAYS return empty headers.
      let response = if let Some(range_header) = request.headers().get("range") {
        let not_satisfiable = || {
          ResponseBuilder::new()
            .status(StatusCode::RANGE_NOT_SATISFIABLE)
            .header(CONTENT_RANGE, format!("bytes */{len}"))
            .body(vec![])
        };

        // parse range header
        let ranges = if let Ok(ranges) = HttpRange::parse(range_header.to_str()?, len) {
          ranges
            .iter()
            // map the output back to spec range <start-end>, example: 0-499
            .map(|r| (r.start, r.start + r.length - 1))
            .collect::<Vec<_>>()
        } else {
          return not_satisfiable();
        };

        /// The Maximum bytes we send in one range
        const MAX_LEN: u64 = 1000 * 1024;

        if ranges.len() == 1 {
          let &(start, mut end) = ranges.first().unwrap();

          // check if a range is not satisfiable
          //
          // this should be already taken care of by HttpRange::parse
          // but checking here again for extra assurance
          if start >= len || end >= len || end < start {
            return not_satisfiable();
          }

          // adjust end byte for MAX_LEN
          end = start + (end - start).min(len - start).min(MAX_LEN - 1);

          // calculate number of bytes needed to be read
          let bytes_to_read = end + 1 - start;

          // allocate a buf with a suitable capacity
          let mut buf = Vec::with_capacity(bytes_to_read as usize);
          // seek the file to the starting byte
          file.seek(SeekFrom::Start(start))?;
          // read the needed bytes
          file.take(bytes_to_read).read_to_end(&mut buf)?;

          resp = resp.header(CONTENT_RANGE, format!("bytes {start}-{end}/{len}"));
          resp = resp.header(CONTENT_LENGTH, end + 1 - start);
          resp = resp.status(StatusCode::PARTIAL_CONTENT);
          resp.body(buf)
        } else {
          let mut buf = Vec::new();
          let ranges = ranges
            .iter()
            .filter_map(|&(start, mut end)| {
              // filter out unsatisfiable ranges
              //
              // this should be already taken care of by HttpRange::parse
              // but checking here again for extra assurance
              if start >= len || end >= len || end < start {
                None
              } else {
                // adjust end byte for MAX_LEN
                end = start + (end - start).min(len - start).min(MAX_LEN - 1);
                Some((start, end))
              }
            })
            .collect::<Vec<_>>();

          let mut id = boundary_id.lock().unwrap();
          *id += 1;
          let boundary = format!("sadasq2e{id}");
          let boundary_sep = format!("\r\n--{boundary}\r\n");
          let boundary_closer = format!("\r\n--{boundary}\r\n");

          resp = resp.header(
            CONTENT_TYPE,
            format!("multipart/byteranges; boundary={boundary}"),
          );

          for (end, start) in ranges {
            // a new range is being written, write the range boundary
            buf.write_all(boundary_sep.as_bytes())?;

            // write the needed headers `Content-Type` and `Content-Range`
            buf.write_all(format!("{CONTENT_TYPE}: video/mp4\r\n").as_bytes())?;
            buf.write_all(format!("{CONTENT_RANGE}: bytes {start}-{end}/{len}\r\n").as_bytes())?;

            // write the separator to indicate the start of the range body
            buf.write_all("\r\n".as_bytes())?;

            // calculate number of bytes needed to be read
            let bytes_to_read = end + 1 - start;

            let mut local_buf = vec![0_u8; bytes_to_read as usize];
            file.seek(SeekFrom::Start(start))?;
            file.read_exact(&mut local_buf)?;
            buf.extend_from_slice(&local_buf);
          }
          // all ranges have been written, write the closing boundary
          buf.write_all(boundary_closer.as_bytes())?;

          resp.body(buf)
        }
      } else {
        resp = resp.header(CONTENT_LENGTH, len);
        let mut buf = Vec::with_capacity(len as usize);
        file.read_to_end(&mut buf)?;
        resp.body(buf)
      };
      response
    })
    .build(tauri::generate_context!())?;
  app.run(move |_app, event| match event {
    RunEvent::Ready => {}
    RunEvent::ExitRequested { .. } => {}
    _ => {}
  });
  Ok(())
}
