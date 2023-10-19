use std::env::consts;

use tauri::{
  api::dialog::ask, AboutMetadata, CustomMenuItem, Manager, SystemTray, SystemTrayEvent,
  SystemTrayMenu, SystemTrayMenuItem, SystemTraySubmenu,
};

use tauri_plugin_positioner::{Position, WindowExt};

pub(crate) fn get_menu() -> SystemTrayMenu {
  match consts::OS {
    "linux" => custom_menu_bar(),
    "macos" => custom_menu_bar(),
    "windows" => custom_menu_bar(),
    _ => SystemTrayMenu::new(),
  }
}

fn custom_menu_bar() -> SystemTrayMenu {
  let about_menu_data = AboutMetadata::new()
    .version(env!("CARGO_PKG_VERSION").to_string())
    .authors(vec!["ZanzyTHEBar".to_string()])
    .license("MIT");

  // iterate through authors and create a string of authors
  let authors = about_menu_data
    .authors
    .unwrap_or(vec!["".to_string()])
    .iter()
    .map(|author| format!("{} ", author))
    .collect::<Vec<String>>();

  if authors.len() > 1 {
    authors.join(", \n");
  }

  let authors = authors.join("\n");

  let about_menu = SystemTrayMenu::new()
    .add_item(CustomMenuItem::new("about".to_string(), "About").accelerator("CmdOrCtrl+I"))
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(CustomMenuItem::new(
      "version",
      format!(
        "Version: {}",
        about_menu_data.version.unwrap_or("".to_string())
      ),
    ))
    .add_item(CustomMenuItem::new(
      "authors",
      format!("Authors: \n{}", authors),
    ))
    .add_item(CustomMenuItem::new(
      "license",
      format!(
        "License: {}",
        about_menu_data.license.unwrap_or("".to_string())
      ),
    ));

  let about_sub_menu = SystemTraySubmenu::new("About", about_menu);

  let mut app_menu = SystemTrayMenu::new()
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(CustomMenuItem::new("quit".to_string(), "Quit").accelerator("CmdOrCtrl+Q"))
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(CustomMenuItem::new("hide".to_string(), "Hide").accelerator("CmdOrCtrl+H"))
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(CustomMenuItem::new("show".to_string(), "Show").accelerator("CmdOrCtrl+Shift+H"))
    .add_submenu(about_sub_menu);

  if cfg!(target_os = "linux") {
    let open = CustomMenuItem::new("open".to_string(), "Open");
    app_menu = app_menu.clone().add_item(open);
  }

  app_menu
}

pub(crate) fn create_system_tray() -> SystemTray {
  SystemTray::new().with_menu(get_menu())
}

pub(crate) fn handle_menu_event<R: tauri::Runtime>(
  app: &tauri::AppHandle<R>,
  event: SystemTrayEvent,
) {
  let window = app.get_window("main").expect("failed to get window");
  tauri_plugin_positioner::on_tray_event(app, &event);
  match event {
    SystemTrayEvent::LeftClick {
      position: _,
      size: _,
      ..
    } => {
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
      dbg!("system tray received a right click");
    }
    SystemTrayEvent::DoubleClick {
      position: _,
      size: _,
      ..
    } => {
      dbg!("system tray received a double click");
    }
    SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
      "open" => {
        window.show().unwrap();
        window.set_focus().unwrap();
      }
      "quit" => {
        let app_clone = app.clone();

        // ask the user if they want to quit
        ask(
          Some(&window),
          "EyeTrackVR",
          "Are you sure that you want to close this window?",
          move |answer| {
            if answer {
              // .close() cannot be called on the main thread
              app_clone.get_window("main").unwrap().close().unwrap();
            }
          },
        );
      }
      "hide" => {
        window.hide().unwrap();
      }
      "show" => {
        window.show().unwrap();
      }
      _ => {}
    },
    _ => {}
  }
}
