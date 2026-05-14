use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use once_cell::sync::Lazy;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TrackingState {
    Idle,
    Tracking,
    Paused,
    Ended,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackingSession {
    pub id: String,
    pub project: String,
    pub state: TrackingState,
    pub started_at: Option<DateTime<Utc>>,
    pub paused_at: Option<DateTime<Utc>>,
    pub ended_at: Option<DateTime<Utc>>,
    pub elapsed_seconds: u64,
}

static SESSION: Lazy<Mutex<Option<TrackingSession>>> = Lazy::new(|| Mutex::new(None));

pub async fn start(session_id: String, project: String) -> anyhow::Result<()> {
    let mut session = SESSION.lock().unwrap();
    *session = Some(TrackingSession {
        id: session_id,
        project,
        state: TrackingState::Tracking,
        started_at: Some(Utc::now()),
        paused_at: None,
        ended_at: None,
        elapsed_seconds: 0,
    });
    Ok(())
}

pub async fn pause() -> anyhow::Result<()> {
    let mut session = SESSION.lock().unwrap();
    if let Some(s) = session.as_mut() {
        s.state = TrackingState::Paused;
        s.paused_at = Some(Utc::now());
    }
    Ok(())
}

pub async fn end() -> anyhow::Result<TrackingSession> {
    let mut session = SESSION.lock().unwrap();
    if let Some(s) = session.as_mut() {
        s.state = TrackingState::Ended;
        s.ended_at = Some(Utc::now());
        Ok(s.clone())
    } else {
        Err(anyhow::anyhow!("No active session"))
    }
}

pub fn is_tracking() -> bool {
    let session = SESSION.lock().unwrap();
    matches!(session.as_ref().map(|s| &s.state), Some(TrackingState::Tracking))
}
