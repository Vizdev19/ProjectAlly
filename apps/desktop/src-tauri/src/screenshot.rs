use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use once_cell::sync::Lazy;
use tauri::AppHandle;
use uuid::Uuid;

const CAPTURE_INTERVAL_SECS: u64 = 600; // 10 minutes

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Screenshot {
    pub id: String,
    pub captured_at: String,
    pub file_path: String,
    pub app_name: Option<String>,
    pub window_title: Option<String>,
    pub status: ScreenshotStatus,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ScreenshotStatus {
    Pending,
    Approved,
    Removed,
}

static SCREENSHOTS: Lazy<Mutex<Vec<Screenshot>>> = Lazy::new(|| Mutex::new(vec![]));

pub async fn capture_loop(app: AppHandle) {
    loop {
        tokio::time::sleep(tokio::time::Duration::from_secs(CAPTURE_INTERVAL_SECS)).await;

        if !crate::tracker::is_tracking() {
            continue;
        }

        if let Err(e) = capture_one(&app).await {
            eprintln!("Screenshot capture failed: {e}");
        }
    }
}

async fn capture_one(app: &AppHandle) -> anyhow::Result<()> {
    use screenshots::Screen;

    let screens = Screen::all()?;
    let primary = screens.into_iter().next().ok_or_else(|| anyhow::anyhow!("No screen found"))?;
    let image = primary.capture()?;

    let id = Uuid::new_v4().to_string();
    let timestamp = Utc::now();
    let filename = format!("{}.png", id);

    // Save to app data dir
    let data_dir = app.path().app_data_dir()?;
    let screenshots_dir = data_dir.join("screenshots").join("pending");
    tokio::fs::create_dir_all(&screenshots_dir).await?;
    let file_path = screenshots_dir.join(&filename);
    image.save(&file_path)?;

    let shot = Screenshot {
        id: id.clone(),
        captured_at: timestamp.to_rfc3339(),
        file_path: file_path.to_string_lossy().to_string(),
        app_name: None,
        window_title: None,
        status: ScreenshotStatus::Pending,
        note: None,
    };

    SCREENSHOTS.lock().unwrap().push(shot);

    // Emit event to frontend
    let _ = app.emit("screenshot-captured", id);
    Ok(())
}

pub async fn get_pending() -> anyhow::Result<Vec<Screenshot>> {
    let shots = SCREENSHOTS.lock().unwrap();
    Ok(shots.iter().filter(|s| s.status == ScreenshotStatus::Pending).cloned().collect())
}

pub async fn approve(id: String, note: Option<String>) -> anyhow::Result<()> {
    let mut shots = SCREENSHOTS.lock().unwrap();
    if let Some(s) = shots.iter_mut().find(|s| s.id == id) {
        s.status = ScreenshotStatus::Approved;
        s.note = note;
    }
    Ok(())
}

pub async fn remove(id: String) -> anyhow::Result<()> {
    let mut shots = SCREENSHOTS.lock().unwrap();
    if let Some(pos) = shots.iter().position(|s| s.id == id) {
        let path = shots[pos].file_path.clone();
        shots.remove(pos);
        // Delete file permanently
        let _ = tokio::fs::remove_file(path).await;
    }
    Ok(())
}

pub async fn approve_all() -> anyhow::Result<()> {
    let mut shots = SCREENSHOTS.lock().unwrap();
    for s in shots.iter_mut() {
        if s.status == ScreenshotStatus::Pending {
            s.status = ScreenshotStatus::Approved;
        }
    }
    Ok(())
}
