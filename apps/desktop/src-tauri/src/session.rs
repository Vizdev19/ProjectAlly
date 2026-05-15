// ============================================================
// Session + auth state (in-process only)
// ============================================================
// The desktop's job is to capture and upload when *the web app says* a
// session is active. Web app authenticates via Supabase, hands us the
// tokens + member/org IDs once at sign-in, then tells us which session
// is active via start_capture / stop_capture.
//
// We deliberately do NOT persist auth to disk in this first cut — re-login
// on app restart is the safer default until we wire up tauri-plugin-stronghold
// for OS keychain storage.

use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthContext {
    pub supabase_url:  String,
    pub anon_key:      String,
    pub access_token:  String,
    pub refresh_token: String,
    pub member_id:     String,
    pub org_id:        String,
    pub email:         String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CaptureState {
    Idle,
    Capturing,
    Paused,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionStatus {
    pub authenticated:    bool,
    pub email:            Option<String>,
    pub capture_state:    CaptureState,
    pub active_session_id: Option<String>,
    pub queue_depth:      usize,
}

static AUTH:      once_cell::sync::Lazy<Mutex<Option<AuthContext>>> =
    once_cell::sync::Lazy::new(|| Mutex::new(None));
static STATE:     once_cell::sync::Lazy<Mutex<CaptureState>> =
    once_cell::sync::Lazy::new(|| Mutex::new(CaptureState::Idle));
static SESSION_ID: once_cell::sync::Lazy<Mutex<Option<String>>> =
    once_cell::sync::Lazy::new(|| Mutex::new(None));

pub fn register(ctx: AuthContext) {
    *AUTH.lock().expect("auth") = Some(ctx);
}

pub fn clear() {
    *AUTH.lock().expect("auth") = None;
    *STATE.lock().expect("state") = CaptureState::Idle;
    *SESSION_ID.lock().expect("session_id") = None;
}

pub fn current() -> Option<AuthContext> {
    AUTH.lock().expect("auth").clone()
}

pub fn start_capture(session_id: String) {
    *STATE.lock().expect("state") = CaptureState::Capturing;
    *SESSION_ID.lock().expect("session_id") = Some(session_id);
}

pub fn pause_capture() {
    let mut s = STATE.lock().expect("state");
    if *s == CaptureState::Capturing {
        *s = CaptureState::Paused;
    }
}

pub fn resume_capture() {
    let mut s = STATE.lock().expect("state");
    if *s == CaptureState::Paused {
        *s = CaptureState::Capturing;
    }
}

pub fn stop_capture() {
    *STATE.lock().expect("state") = CaptureState::Idle;
    *SESSION_ID.lock().expect("session_id") = None;
}

pub fn is_capturing() -> bool {
    *STATE.lock().expect("state") == CaptureState::Capturing
}

pub fn active_session_id() -> Option<String> {
    SESSION_ID.lock().expect("session_id").clone()
}

pub fn status() -> SessionStatus {
    let auth = AUTH.lock().expect("auth").clone();
    SessionStatus {
        authenticated:     auth.is_some(),
        email:             auth.as_ref().map(|a| a.email.clone()),
        capture_state:     *STATE.lock().expect("state"),
        active_session_id: SESSION_ID.lock().expect("session_id").clone(),
        queue_depth:       crate::screenshot::queue_depth(),
    }
}
