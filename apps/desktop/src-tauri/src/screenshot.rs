// ============================================================
// Screenshot capture + upload to Supabase
// ============================================================
// Capture loop wakes every CAPTURE_INTERVAL_SECS while a session is active.
// On each tick:
//   1. Capture the primary screen as PNG bytes
//   2. Upload to private-screenshots/{org_id}/{member_id}/{uuid}.png
//   3. INSERT a row into the `screenshots` table (status='pending')
// Failures are logged to stderr and queued (in-memory) for retry. The local
// PNG is held in app data dir until upload succeeds, then deleted.

use anyhow::Context;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::VecDeque;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};
use uuid::Uuid;

use crate::session;

const CAPTURE_INTERVAL_SECS: u64 = 600; // 10 minutes

/// A capture that couldn't be uploaded yet — held on disk + in memory until
/// the next successful upload run flushes the queue.
#[derive(Debug, Clone, Serialize, Deserialize)]
struct PendingUpload {
    id:           String,
    local_path:   PathBuf,
    captured_at:  String,
}

static QUEUE: once_cell::sync::Lazy<Mutex<VecDeque<PendingUpload>>> =
    once_cell::sync::Lazy::new(|| Mutex::new(VecDeque::new()));

pub async fn capture_loop(app: AppHandle) {
    // Pick up any PNGs left over from a previous run (crash, force-quit, etc.)
    // so they don't sit forever in pending/. Then take a shot at flushing —
    // it's a no-op when the queue is empty or auth isn't ready yet.
    if let Err(e) = recover_pending(&app).await {
        eprintln!("[screenshot] recover_pending: {e:#}");
    }
    if let Err(e) = flush_queue(&app).await {
        eprintln!("[screenshot] flush_queue (startup): {e:#}");
    }

    loop {
        tokio::time::sleep(tokio::time::Duration::from_secs(CAPTURE_INTERVAL_SECS)).await;

        // Always try to flush the retry queue, regardless of tracking state —
        // if a previous upload failed and we paused, we still want to drain
        // it once we're back online.
        if let Err(e) = flush_queue(&app).await {
            eprintln!("[screenshot] flush_queue: {e:#}");
        }

        if !session::is_capturing() {
            continue;
        }

        if let Err(e) = capture_and_upload(&app).await {
            eprintln!("[screenshot] capture_and_upload: {e:#}");
        }
    }
}

/// Walk the pending dir and re-enqueue any orphaned PNGs from prior runs.
/// Filename stem is the UUID; mtime is treated as captured_at (we write the
/// file once right after capture, so mtime is within milliseconds of the
/// true capture moment). Zero-byte files are skipped — almost certainly the
/// result of a crash during write, and uploading them would just block the
/// queue forever on the inevitable Supabase rejection.
async fn recover_pending(app: &AppHandle) -> anyhow::Result<()> {
    let data_dir = app.path().app_data_dir()?;
    let dir = data_dir.join("screenshots").join("pending");
    if !tokio::fs::try_exists(&dir).await.unwrap_or(false) {
        return Ok(());
    }

    let mut entries = tokio::fs::read_dir(&dir).await
        .with_context(|| format!("read_dir {:?}", dir))?;
    let mut recovered = 0;
    while let Some(entry) = entries.next_entry().await? {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("png") {
            continue;
        }
        let Some(id) = path.file_stem().and_then(|s| s.to_str()).map(String::from) else {
            continue;
        };

        let metadata = match entry.metadata().await {
            Ok(m) => m,
            Err(e) => {
                eprintln!("[screenshot] skip {:?}: metadata: {e:#}", path);
                continue;
            }
        };
        if metadata.len() == 0 {
            eprintln!("[screenshot] skip {:?}: zero bytes (likely crash mid-write)", path);
            continue;
        }

        let captured_at = metadata.modified()
            .ok()
            .map(|t| chrono::DateTime::<chrono::Utc>::from(t).to_rfc3339())
            .unwrap_or_else(|| Utc::now().to_rfc3339());

        QUEUE.lock().expect("queue").push_back(PendingUpload {
            id,
            local_path: path,
            captured_at,
        });
        recovered += 1;
    }

    if recovered > 0 {
        eprintln!("[screenshot] recovered {recovered} pending upload(s) from disk");
    }
    Ok(())
}

/// Force a single capture+upload outside of the periodic loop. Useful for a
/// "capture now" tray action or to test the pipeline.
pub async fn capture_now(app: &AppHandle) -> anyhow::Result<()> {
    capture_and_upload(app).await
}

async fn capture_and_upload(app: &AppHandle) -> anyhow::Result<()> {
    let id        = Uuid::new_v4().to_string();
    let captured  = Utc::now().to_rfc3339();

    let data_dir = app.path().app_data_dir()?;
    let dir = data_dir.join("screenshots").join("pending");
    tokio::fs::create_dir_all(&dir).await?;
    let local = dir.join(format!("{id}.png"));

    capture_primary_to(&local).await?;

    // Push first so a panic mid-upload doesn't lose the file
    QUEUE.lock().expect("queue").push_back(PendingUpload {
        id:          id.clone(),
        local_path:  local,
        captured_at: captured,
    });

    flush_queue(app).await
}

/// Capture the primary monitor and save as PNG at the given path. The
/// screenshots crate's `save()` writes PNG based on the .png extension.
async fn capture_primary_to(path: &PathBuf) -> anyhow::Result<()> {
    let path = path.clone();
    tokio::task::spawn_blocking(move || -> anyhow::Result<()> {
        use screenshots::Screen;
        let screens = Screen::all().context("enumerate screens")?;
        let primary = screens
            .into_iter()
            .next()
            .ok_or_else(|| anyhow::anyhow!("no screen found"))?;
        let img = primary.capture().context("capture primary")?;
        img.save(&path).context("save PNG")?;
        Ok(())
    })
    .await?
}

/// Drain the in-memory queue, uploading each item. Items that fail are
/// re-queued for the next tick. Stops on the first failure to avoid
/// hammering Supabase when the network is down.
async fn flush_queue(app: &AppHandle) -> anyhow::Result<()> {
    loop {
        let item = QUEUE.lock().expect("queue").pop_front();
        let Some(item) = item else { return Ok(()); };

        match upload_one(&item).await {
            Ok(()) => {
                let _ = tokio::fs::remove_file(&item.local_path).await;
                let _ = app.emit("screenshot-uploaded", &item.id);
            }
            Err(e) => {
                eprintln!("[screenshot] upload {} failed: {e:#}", item.id);
                QUEUE.lock().expect("queue").push_front(item);
                return Err(e);
            }
        }
    }
}

async fn upload_one(item: &PendingUpload) -> anyhow::Result<()> {
    let ctx = session::current()
        .ok_or_else(|| anyhow::anyhow!("not authenticated"))?;
    let session_id = session::active_session_id();

    let bytes = tokio::fs::read(&item.local_path).await
        .with_context(|| format!("read {:?}", item.local_path))?;

    let storage_path = format!(
        "{org_id}/{member_id}/{id}.png",
        org_id    = ctx.org_id,
        member_id = ctx.member_id,
        id        = item.id,
    );

    // 1. Upload to Supabase Storage
    let upload_url = format!(
        "{base}/storage/v1/object/private-screenshots/{path}",
        base = ctx.supabase_url.trim_end_matches('/'),
        path = storage_path,
    );

    let client = reqwest::Client::new();
    let res = client
        .post(&upload_url)
        .bearer_auth(&ctx.access_token)
        .header("apikey", &ctx.anon_key)
        .header("Content-Type", "image/png")
        .header("x-upsert", "false")
        .body(bytes)
        .send()
        .await
        .context("storage upload request")?;

    if !res.status().is_success() {
        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        anyhow::bail!("storage upload {status}: {body}");
    }

    // 2. INSERT screenshots row
    let insert_url = format!(
        "{base}/rest/v1/screenshots",
        base = ctx.supabase_url.trim_end_matches('/'),
    );

    let body = json!({
        "id":           item.id,
        "org_id":       ctx.org_id,
        "member_id":    ctx.member_id,
        "session_id":   session_id,
        "private_path": storage_path,
        "captured_at":  item.captured_at,
        "status":       "pending",
    });

    let res = client
        .post(&insert_url)
        .bearer_auth(&ctx.access_token)
        .header("apikey", &ctx.anon_key)
        .header("Content-Type", "application/json")
        .header("Prefer", "return=minimal")
        .json(&body)
        .send()
        .await
        .context("screenshots insert request")?;

    if !res.status().is_success() {
        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        anyhow::bail!("screenshots insert {status}: {body}");
    }

    Ok(())
}

/// Snapshot the queue depth for the UI (returned by a Tauri command).
pub fn queue_depth() -> usize {
    QUEUE.lock().expect("queue").len()
}
