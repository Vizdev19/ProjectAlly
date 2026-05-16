use tauri::AppHandle;

mod screenshot;
mod session;
mod tray;

// Re-export type used in commands so Tauri's macro can resolve it
pub use session::{AuthContext, SessionStatus};

// ── Auth commands ────────────────────────────────────────────────

/// Web app calls this once after Supabase sign-in to hand us tokens + IDs.
/// Replaces any previously-registered session.
#[tauri::command]
fn register_session(ctx: AuthContext) -> Result<(), String> {
    session::register(ctx);
    Ok(())
}

/// Clear stored auth (called on sign-out from the web).
#[tauri::command]
fn clear_session() -> Result<(), String> {
    session::clear();
    Ok(())
}

#[tauri::command]
fn session_status() -> SessionStatus {
    session::status()
}

// ── Capture lifecycle ────────────────────────────────────────────

#[tauri::command]
fn start_capture(app: AppHandle, session_id: String) -> Result<(), String> {
    if session::current().is_none() {
        return Err("not authenticated".into());
    }
    let was_idle = session::start_capture(session_id);
    if was_idle {
        // Fresh start — fire one capture in the background so the user doesn't
        // wait a full CAPTURE_INTERVAL_SECS for the first screenshot. Spawned,
        // not awaited, so the UI returns immediately; errors are logged.
        tauri::async_runtime::spawn(async move {
            if let Err(e) = screenshot::capture_now(&app).await {
                eprintln!("[screenshot] initial capture: {e:#}");
            }
        });
    }
    Ok(())
}

#[tauri::command]
fn pause_capture() -> Result<(), String> {
    session::pause_capture();
    Ok(())
}

#[tauri::command]
fn resume_capture() -> Result<(), String> {
    session::resume_capture();
    Ok(())
}

#[tauri::command]
fn stop_capture() -> Result<(), String> {
    session::stop_capture();
    Ok(())
}

/// Manual "capture now" — useful for tray menus and as a sanity check that
/// the upload pipeline actually works on this machine.
#[tauri::command]
async fn capture_now(app: AppHandle) -> Result<(), String> {
    screenshot::capture_now(&app)
        .await
        .map_err(|e| format!("{e:#}"))
}

// ── Setup ────────────────────────────────────────────────────────

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .setup(|app| {
            if let Err(e) = tray::setup_tray(app) {
                // Print to stderr so a failure here is diagnosable when the
                // user runs the binary from Terminal — otherwise we just see
                // SIGABRT in the macOS crash dialog with no clue what failed.
                eprintln!("[setup] tray::setup_tray failed: {e:?}");
                return Err(e.into());
            }
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                screenshot::capture_loop(app_handle).await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            register_session,
            clear_session,
            session_status,
            start_capture,
            pause_capture,
            resume_capture,
            stop_capture,
            capture_now,
        ])
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            // Print + clean exit instead of panic+abort, so future failures
            // surface a readable error to anyone running from Terminal.
            eprintln!("[fatal] AllyTracker failed to start: {e:?}");
            std::process::exit(1);
        });
}
