use log::debug;
use log::{error, info};
use tauri::{self, api::path::config_dir, api::shell::open, Manager};

use tauri_plugin_store::with_store;

//use specta::collect_types;
//use tauri_specta::ts;
use tauri_plugin_window_state::{AppHandleExt, StateFlags, WindowExt};
use whoami::username;

/// A command to get the user name from the system
/// ## Returns
/// - `user_name`: String - The user name of the current user
#[tauri::command]
#[specta::specta]
pub async fn get_user() -> Result<String, String> {
  let user_name: String = username();
  info!("User name: {}", user_name);
  Ok(user_name)
}

#[tauri::command]
#[specta::specta]
pub async fn handle_save_window_state<R: tauri::Runtime>(
  app: tauri::AppHandle<R>,
) -> Result<(), String> {
  app
    .save_window_state(StateFlags::all())
    .expect("[Window State]: Failed to save window state");

  Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn handle_load_window_state<R: tauri::Runtime>(
  window: tauri::Window<R>,
) -> Result<(), String> {
  window
    .restore_state(StateFlags::all())
    .expect("[Window State]: Failed to restore window state");

  Ok(())
}

pub fn handle_debug<R: tauri::Runtime>(
  app: tauri::AppHandle<R>,
) -> Result<log::LevelFilter, String> {
  // read the Store file
  let stores = app.state::<tauri_plugin_store::StoreCollection<R>>();
  let path = std::path::PathBuf::from(".app-settings.bin");
  // match the store value to a LogFilter
  let mut debug_state: String = String::new();
  with_store(app.clone(), stores, path, |store| {
    let settings = store.get("settings");
    debug!("Settings: {:?}", settings);
    if let Some(json) = settings {
      let _serde_json = serde_json::from_value::<serde_json::Value>(json.clone());
      debug!("Serde JSON: {:?}", _serde_json);
      let serde_json_result = match _serde_json {
        Ok(serde_json) => serde_json,
        Err(err) => {
          error!("Error configuring JSON config file: {}", err);
          return Err(tauri_plugin_store::Error::Json(err));
        }
      };
      let temp = &serde_json_result["debugMode"];
      debug!("Debug: {:?}", temp);
      debug_state = serde_json::from_value::<String>(temp.clone()).unwrap();
    } else {
      debug_state = serde_json::json!({}).to_string();
    }
    info!("Debug state: {}", debug_state);
    Ok(())
  })
  .expect("Failed to get store");
  // set the log level
  let log_level = match debug_state.as_str() {
    "off" => log::LevelFilter::Off,
    "error" => log::LevelFilter::Error,
    "warn" => log::LevelFilter::Warn,
    "info" => log::LevelFilter::Info,
    "debug" => log::LevelFilter::Debug,
    "trace" => log::LevelFilter::Trace,
    _ => log::LevelFilter::Info,
  };
  // return the result
  Ok(log_level)
}

// returns the scheme and the path of the video file
// we're using this just to allow using the custom `stream` protocol or tauri built-in `asset` protocol
#[tauri::command]
pub fn video_uri(path: std::path::PathBuf) -> (&'static str, std::path::PathBuf) {
  #[cfg(feature = "protocol-asset")]
  {
    //let mut path = std::env::current_dir().unwrap();

    //path.push("test_video.mp4");
    ("asset", path)
  }

  #[cfg(not(feature = "protocol-asset"))]
  ("stream", path)
}
