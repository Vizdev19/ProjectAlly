import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";
import { supabase } from "./supabase";
import type { Member } from "./App";

type Session = {
  id: string;
  project: string | null;
  status: "tracking" | "paused" | "ended";
  started_at: string;
  paused_at: string | null;
  ended_at:  string | null;
};

type RustStatus = {
  authenticated:    boolean;
  email:            string | null;
  capture_state:    "Idle" | "Capturing" | "Paused";
  active_session_id: string | null;
  queue_depth:      number;
};

const WEB_APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? "";

export default function Tracker({
  member,
  onSignedOut,
}: {
  member: Member;
  onSignedOut: () => void;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [rust,    setRust]    = useState<RustStatus | null>(null);
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [now,     setNow]     = useState(() => Date.now());
  const lastSessionId = useRef<string | null>(null);

  // 1. Load the current active session from Supabase on mount + on a refresh
  const reloadSession = useCallback(async () => {
    setError(null);
    const { data, error: e } = await supabase
      .from("tracking_sessions")
      .select("id, project, status, started_at, paused_at, ended_at")
      .eq("member_id", member.id)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .maybeSingle();

    if (e) { setError(e.message); return; }
    setSession((data as Session | null) ?? null);
  }, [member.id]);

  useEffect(() => { void reloadSession(); }, [reloadSession]);

  // 2. Mirror the active session to Rust so its capture loop knows what to do
  useEffect(() => {
    if (!session) {
      if (lastSessionId.current !== null) {
        void invoke("stop_capture").catch(() => {});
        lastSessionId.current = null;
      }
      return;
    }
    if (session.status === "tracking") {
      // start_capture is idempotent — calling on every render is fine
      void invoke("start_capture", { sessionId: session.id }).catch(() => {});
      lastSessionId.current = session.id;
    } else if (session.status === "paused") {
      void invoke("pause_capture").catch(() => {});
    } else {
      void invoke("stop_capture").catch(() => {});
      lastSessionId.current = null;
    }
  }, [session]);

  // 3. Poll Rust status for queue depth + state display
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const s = await invoke<RustStatus>("session_status");
        if (!cancelled) setRust(s);
      } catch { /* ignore */ }
    }
    void tick();
    const t = setInterval(tick, 4000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  // 4. Ticking clock for the timer (only re-renders while tracking)
  useEffect(() => {
    if (session?.status !== "tracking") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [session?.status]);

  // ── Actions ────────────────────────────────────────────────────

  async function action(fn: () => Promise<{ error?: string } | void>) {
    setError(null);
    setBusy(true);
    try {
      const r = await fn();
      if (r && "error" in r && r.error) setError(r.error);
      await reloadSession();
    } finally {
      setBusy(false);
    }
  }

  async function onStart() {
    await action(async () => {
      const { error } = await supabase
        .from("tracking_sessions")
        .insert({
          org_id:    member.org_id,
          member_id: member.id,
          project:   null,
          status:    "tracking",
          started_at: new Date().toISOString(),
          paused_at: null,
          ended_at:  null,
          elapsed_seconds: 0,
        });
      return { error: error?.message };
    });
  }

  async function onPause() {
    if (!session) return;
    await action(async () => {
      const { error } = await supabase
        .from("tracking_sessions")
        .update({ status: "paused", paused_at: new Date().toISOString() })
        .eq("id", session.id);
      return { error: error?.message };
    });
  }

  async function onResume() {
    if (!session) return;
    await action(async () => {
      const { error } = await supabase
        .from("tracking_sessions")
        .update({ status: "tracking", paused_at: null })
        .eq("id", session.id);
      return { error: error?.message };
    });
  }

  async function onEnd() {
    if (!session) return;
    await action(async () => {
      const elapsed = Math.floor(
        (Date.now() - new Date(session.started_at).getTime()) / 1000,
      );
      const { error } = await supabase
        .from("tracking_sessions")
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
          elapsed_seconds: elapsed,
        })
        .eq("id", session.id);
      return { error: error?.message };
    });
  }

  async function onCaptureNow() {
    setError(null);
    setBusy(true);
    try {
      await invoke("capture_now");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onOpenWeb() {
    const url = WEB_APP_URL ? `${WEB_APP_URL}/app` : null;
    if (url) await open(url);
  }

  async function onSignOut() {
    await supabase.auth.signOut();
    await invoke("clear_session").catch(() => {});
    onSignedOut();
  }

  // ── Render ─────────────────────────────────────────────────────

  const elapsedSec = session
    ? Math.max(0, Math.floor((now - new Date(session.started_at).getTime()) / 1000))
    : 0;
  const status: "idle" | "tracking" | "paused" = session?.status === "tracking"
    ? "tracking"
    : session?.status === "paused" ? "paused" : "idle";

  return (
    <div style={{ minHeight: "100vh", padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--brand-grad)" }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{member.full_name}</p>
          <p style={{ fontSize: 11, color: "var(--muted)" }}>{member.email}</p>
        </div>
        <button onClick={onSignOut} style={ghostBtnStyle}>Sign out</button>
      </div>

      {error && <div style={errStyle}>{error}</div>}

      {/* Timer card */}
      <div style={{ background: "#1A1424", color: "#fff", borderRadius: 18, padding: 22, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(178,84,232,0.25), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: status === "tracking" ? "#FF4A8E" : status === "paused" ? "#F4B740" : "rgba(255,255,255,0.4)",
            }} />
            <span style={{ fontSize: 12, color: "rgba(240,237,246,0.6)" }}>
              {status === "tracking" ? "Tracking" : status === "paused" ? "Paused" : "Ready to track"}
            </span>
          </div>
          <div style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 44, fontWeight: 700, letterSpacing: "0.04em" }}>
            {formatHMS(elapsedSec)}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {status === "idle" && (
              <button onClick={onStart} disabled={busy} style={primaryDarkBtn}>
                {busy ? "…" : "Start tracking"}
              </button>
            )}
            {status === "tracking" && (
              <>
                <button onClick={onPause} disabled={busy} style={whiteBtn}>Pause</button>
                <button onClick={onEnd}   disabled={busy} style={ghostDarkBtn}>End session</button>
              </>
            )}
            {status === "paused" && (
              <>
                <button onClick={onResume} disabled={busy} style={primaryDarkBtn}>Resume</button>
                <button onClick={onEnd}    disabled={busy} style={ghostDarkBtn}>End session</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card title="Capture state" value={rust?.capture_state ?? "—"} />
        <Card title="Upload queue"  value={(rust?.queue_depth ?? 0).toString()} />
      </div>

      {/* Footer actions */}
      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <button onClick={onCaptureNow} disabled={busy || !session} style={ghostBtnStyle}>
          Capture now
        </button>
        {WEB_APP_URL && (
          <button onClick={onOpenWeb} style={ghostBtnStyle}>
            Review screenshots in browser →
          </button>
        )}
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px" }}>
      <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 500 }}>{title}</p>
      <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>{value}</p>
    </div>
  );
}

function pad(n: number) { return n.toString().padStart(2, "0"); }
function formatHMS(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

const primaryDarkBtn: React.CSSProperties = {
  padding: "9px 18px", background: "var(--brand-grad)", color: "#fff",
  border: "none", borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: "pointer",
};
const whiteBtn: React.CSSProperties = {
  padding: "9px 18px", background: "#fff", color: "#1A1424",
  border: "none", borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: "pointer",
};
const ghostDarkBtn: React.CSSProperties = {
  padding: "9px 18px", background: "transparent", color: "rgba(240,237,246,0.55)",
  border: "1px solid rgba(240,237,246,0.15)", borderRadius: 100,
  fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const ghostBtnStyle: React.CSSProperties = {
  padding: "7px 14px", background: "var(--surface)", color: "var(--ink-2)",
  border: "1px solid var(--line)", borderRadius: 8,
  fontSize: 12, fontWeight: 600, cursor: "pointer",
};
const errStyle: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 10,
  background: "rgba(196,28,60,0.08)", border: "1px solid rgba(196,28,60,0.2)",
  fontSize: 13, color: "var(--danger)",
};
