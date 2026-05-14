use tauri::Manager;

mod screenshot;
mod tracker;
mod tray;

pub use tracker::TrackingSession;

#[tauri::command]
async fn start_tracking(session_id: String, project: String) -> Result<(), String> {
    tracker::start(session_id, project).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn pause_tracking() -> Result<(), String> {
    tracker::pause().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn end_tracking() -> Result<TrackingSession, String> {
    tracker::end().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_pending_screenshots() -> Result<Vec<screenshot::Screenshot>, String> {
    screenshot::get_pending().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn approve_screenshot(id: String, note: Option<String>) -> Result<(), String> {
    screenshot::approve(id, note).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn remove_screenshot(id: String) -> Result<(), String> {
    screenshot::remove(id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn approve_all_screenshots() -> Result<(), String> {
    screenshot::approve_all().await.map_err(|e| e.to_string())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .setup(|app| {
            tray::setup_tray(app)?;
            // Start screenshot capture loop in background
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                screenshot::capture_loop(app_handle).await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_tracking,
            pause_tracking,
            end_tracking,
            get_pending_screenshots,
            approve_screenshot,
            remove_screenshot,
            approve_all_screenshots,
        ])
        .run(tauri::generate_context!())
        .expect("error while running AllyTracker");
}
