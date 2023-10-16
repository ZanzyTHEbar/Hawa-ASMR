#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[cfg(target_os = "linux")]
use std::fs::metadata;
#[cfg(target_os = "linux")]
use std::path::PathBuf;
use std::time::Duration;

use std::env;
use tauri::{
  self, ipc::RemoteDomainAccessScope, CustomMenuItem, Manager, RunEvent, SystemTray,
  SystemTrayEvent, SystemTrayMenu, WindowEvent,
};
use tauri_plugin_positioner::{Position, WindowExt};

use log::error;
use serde::Serialize;
use tokio::time::sleep;

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
          let window = window.clone();

          async move {
            sleep(Duration::from_secs(3)).await;
            /* if !window.is_visible().unwrap_or(true) {
              error!("[]:  Window did not emit `app_ready` event in time, showing it now.");

              window.show().expect("Main window failed to show");
            } */
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
        // detect click outside of the focused window and hide the app
        if !is_focused {
          event.window().hide().unwrap();
        }
      }
      _ => {}
    })
    .build(tauri::generate_context!())?;
  app.run(move |_app, event| match event {
    RunEvent::Ready => {}
    RunEvent::ExitRequested { .. } => {}
    _ => {}
  });
  Ok(())
}
