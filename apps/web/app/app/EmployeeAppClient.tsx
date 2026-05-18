"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import ProfileMenu from "@/components/ui/ProfileMenu";
import type { TrackingSession } from "@/lib/types/database";
import type { EmployeeShot } from "@/lib/data/dashboard";
import { startSession, pauseSession, resumeSession, endSession } from "@/lib/actions/sessions";
import { approveScreenshot, removeScreenshot, approveAllPending } from "@/lib/actions/screenshots";

export type EmployeeAppData = {
  me: { id: string; full_name: string; email: string; avatar_color: string };
  activeSession: TrackingSession | null;
  pending: EmployeeShot[];
  approved: EmployeeShot[];
  stats: { pending: number; approved: number; removed: number; seconds: number };
};

function initialsOf(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}
function pad(n: number, len = 2) { return n.toString().padStart(len, "0"); }
function formatHMS(totalSec: number) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
function timeOfDay(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// ─── Sidebar ─────────────────────────────────────────────────────

function Sidebar({ me, status }: { me: EmployeeAppData["me"]; status: TrackingSession["status"] | "idle" }) {
  const dotColor =
    status === "tracking" ? "#3DC9B3"
    : status === "paused" ? "#F4B740"
    : "var(--muted)";
  const label =
    status === "tracking" ? "Tracking now"
    : status === "paused" ? "Paused"
    : status === "ended"  ? "Session ended"
    : "Not tracking";

  return (
    <aside style={{ width: 224, background: "var(--surface)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", height: "100vh", flexShrink: 0 }}>
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
          <span style={{ width: 24, height: 24, borderRadius: 5, background: "var(--brand-grad)", display: "inline-block" }} />
          AllyTracker
        </div>
      </div>

      <div style={{ padding: 12, borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--surface-2)", borderRadius: 12 }}>
          <Avatar initials={initialsOf(me.full_name)} color={me.avatar_color} size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {me.full_name}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor }} />
              <span style={{ fontSize: 11, color: dotColor, fontWeight: 600 }}>{label}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ padding: 12, borderTop: "1px solid var(--line)" }}>
        <div style={{ background: "rgba(91,108,255,0.07)", border: "1px solid rgba(91,108,255,0.2)", borderRadius: 12, padding: "12px 14px" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
            🛡 Your data, your call
          </p>
          <p style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>
            Nothing leaves your machine until you approve it.
          </p>
        </div>
      </div>

      <div style={{ padding: "10px 12px 12px", borderTop: "1px solid var(--line)" }}>
        <ProfileMenu me={me} variant="sidebar" />
      </div>
    </aside>
  );
}

// ─── Timer card ──────────────────────────────────────────────────

function TimerCard({
  session,
  onStart,
  onPause,
  onResume,
  onEnd,
  isPending,
}: {
  session: TrackingSession | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  isPending: boolean;
}) {
  const status: "idle" | TrackingSession["status"] = session?.status ?? "idle";

  // Tick a "now" reference every second while tracking; derive elapsed from
  // the session's started_at so we never need to reset state when the session
  // changes — this keeps the render pure.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (status !== "tracking") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [status]);

  // Freeze the timer at paused_at while paused; otherwise tick against `now`.
  // Subtract paused_total_seconds so accumulated pauses don't count as tracked.
  const seconds = session
    ? (() => {
        const endRef = session.status === "paused" && session.paused_at
          ? new Date(session.paused_at).getTime()
          : now;
        const total = Math.floor((endRef - new Date(session.started_at).getTime()) / 1000);
        return Math.max(0, total - (session.paused_total_seconds ?? 0));
      })()
    : 0;

  return (
    <div style={{ background: "#1A1424", borderRadius: 20, padding: 28, position: "relative", overflow: "hidden", marginBottom: 20 }}>
      <div style={{ position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(178,84,232,0.25) 0%, rgba(91,108,255,0.15) 50%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,74,142,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: status === "tracking" ? "var(--g-pink)" : status === "paused" ? "#F4B740" : "var(--muted)",
            animation: status === "tracking" ? "pulse-dot 2s ease-in-out infinite" : undefined,
          }} />
          <span style={{ fontSize: 13, color: "rgba(240,237,246,0.55)", fontWeight: 500 }}>
            {status === "tracking" ? "Tracking · session in progress"
              : status === "paused" ? "Paused · session on hold"
              : status === "ended"  ? "Session ended"
              : "Ready to track"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 52, fontWeight: 700, letterSpacing: "0.04em", color: status === "idle" ? "rgba(240,237,246,0.3)" : "#F0EDF6", marginBottom: 14 }}>
              {formatHMS(seconds)}
            </div>
            {session?.project && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.07)", borderRadius: 100, padding: "7px 14px" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand-grad)" }} />
                <span style={{ fontSize: 13, color: "rgba(240,237,246,0.7)", fontWeight: 500 }}>{session.project}</span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
            {status === "idle" || status === "ended" ? (
              <button onClick={onStart} disabled={isPending} style={primaryDarkBtn}>
                {isPending ? "…" : "Start tracking"}
              </button>
            ) : status === "tracking" ? (
              <>
                <button onClick={onPause} disabled={isPending} style={whiteBtn}>Pause</button>
                <button onClick={onEnd}   disabled={isPending} style={ghostDarkBtn}>End session</button>
              </>
            ) : (
              <>
                <button onClick={onResume} disabled={isPending} style={primaryDarkBtn}>Resume</button>
                <button onClick={onEnd}    disabled={isPending} style={ghostDarkBtn}>End session</button>
              </>
            )}
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(240,237,246,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "rgba(240,237,246,0.35)" }}>
            {status === "tracking" ? "Capture cadence: every 10 min" : "Capture paused"}
          </span>
          {session && (
            <span style={{ fontSize: 12, color: "rgba(240,237,246,0.3)" }}>
              Started {timeOfDay(session.started_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stats strip ─────────────────────────────────────────────────

function StatStrip({ stats }: { stats: EmployeeAppData["stats"] }) {
  const hours = (stats.seconds / 3600).toFixed(1);
  const cells = [
    { label: "Today",            value: `${hours}h`,                  highlight: false },
    { label: "Awaiting review",  value: stats.pending.toString(),     highlight: stats.pending > 0 },
    { label: "Approved",         value: stats.approved.toString(),    highlight: false },
    { label: "Removed by you",   value: stats.removed.toString(),     highlight: false },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
      {cells.map((c) => (
        <div key={c.label} style={{
          background: "var(--surface)",
          border: c.highlight ? "1.5px solid var(--g-pink)" : "1px solid var(--line)",
          borderRadius: 12, padding: "12px 14px",
          boxShadow: c.highlight ? "0 0 0 3px rgba(255,74,142,0.1)" : "none",
        }}>
          <p style={{ fontSize: 11, color: c.highlight ? "var(--g-pink)" : "var(--muted)", marginBottom: 4, fontWeight: 500 }}>{c.label}</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: c.highlight ? "var(--g-pink)" : "var(--ink)" }}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Review tray + drawer ────────────────────────────────────────

function ReviewTray({
  pending,
  selected,
  onSelect,
  onApproveAll,
  isPending,
}: {
  pending: EmployeeShot[];
  selected: EmployeeShot | null;
  onSelect: (s: EmployeeShot | null) => void;
  onApproveAll: () => void;
  isPending: boolean;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ background: "var(--danger-bg)", color: "var(--g-pink)", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 100 }}>
          Awaiting your review
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>
            {pending.length} screenshot{pending.length === 1 ? "" : "s"} to look at
          </h2>
          <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 2 }}>
            Remove anything personal or sensitive.
          </p>
        </div>
        <button onClick={onApproveAll} disabled={isPending} style={primaryDarkBtn}>
          {isPending ? "Sending…" : "Approve all & send"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 16 }}>
        {pending.map((shot) => (
          <div
            key={shot.id}
            onClick={() => onSelect(selected?.id === shot.id ? null : shot)}
            style={{
              borderRadius: 10, overflow: "hidden", aspectRatio: "16/10", position: "relative",
              cursor: "pointer",
              border: selected?.id === shot.id ? "2px solid var(--g-blue)" : "1px solid var(--line)",
              boxSizing: "border-box",
              background: "var(--surface-2)",
            }}
          >
            {shot.signed_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shot.signed_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "var(--muted)" }}>📷</div>
            )}
            <div style={{ position: "absolute", bottom: 5, left: 5, background: "rgba(26,20,36,0.75)", borderRadius: 5, padding: "2px 6px", fontSize: 9, color: "#fff", fontWeight: 600 }}>
              {timeOfDay(shot.captured_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApprovedRail({ shots }: { shots: EmployeeShot[] }) {
  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>
        Already approved today
      </p>
      {shots.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          You haven&apos;t approved any screenshots today yet.
        </p>
      ) : (
        <div style={{ display: "flex", gap: 10, overflowX: "auto" }}>
          {shots.map((s) => (
            <div key={s.id} style={{ width: 168, height: 110, flexShrink: 0, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(11,123,58,0.3)", position: "relative", background: "var(--surface-2)" }}>
              {s.signed_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.signed_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "var(--muted)" }}>📷</div>
              )}
              <div style={{ position: "absolute", top: 6, left: 6, background: "var(--good)", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 100 }}>✓ Approved</div>
              <div style={{ position: "absolute", bottom: 5, left: 5, background: "rgba(26,20,36,0.7)", borderRadius: 5, padding: "2px 6px", fontSize: 9, color: "#fff", fontWeight: 600 }}>
                {timeOfDay(s.captured_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailDrawer({
  shot,
  onRemove,
  onKeep,
  isPending,
}: {
  shot: EmployeeShot | null;
  onRemove: () => void;
  onKeep: (note: string) => void;
  isPending: boolean;
}) {
  // Local note state; the parent remounts this component (via key={shot.id})
  // whenever the selected screenshot changes, so we never need to reset here.
  const [note, setNote] = useState("");

  if (!shot) {
    return (
      <aside style={{ width: 400, borderLeft: "1px solid var(--line)", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)", flexShrink: 0, padding: 32 }}>
        <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.3 }}>📷</div>
        <p style={{ fontSize: 15, color: "var(--muted)", textAlign: "center" }}>Tap any screenshot to review it.</p>
      </aside>
    );
  }

  return (
    <aside style={{ width: 400, borderLeft: "1px solid var(--line)", height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", flexShrink: 0 }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
        <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 100, background: "var(--good-bg)", border: "1px solid rgba(11,123,58,0.25)", fontSize: 12, fontWeight: 700, color: "var(--good)" }}>
          ✓ Ready for your review
        </span>
      </div>

      <div style={{ overflowY: "auto", flex: 1, padding: 20 }}>
        <div style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "16/10", marginBottom: 16, background: "var(--surface-2)" }}>
          {shot.signed_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shot.signed_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "var(--muted)" }}>📷</div>
          )}
        </div>

        <div style={{ background: "var(--surface)", borderRadius: 12, padding: "12px 16px", marginBottom: 14 }}>
          {[
            ["Application", shot.app_name ?? "—"],
            ["Window",      shot.window_title ?? "—"],
            ["Captured",    new Date(shot.captured_at).toLocaleString()],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ width: 90, fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 8 }}>
            Note to future-you <span style={{ fontWeight: 400 }}>(private, not shared)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What were you working on at this moment?"
            rows={3}
            style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: 14, color: "var(--ink)", background: "var(--bg)", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <button
            onClick={() => onRemove()}
            disabled={isPending}
            style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(196,28,60,0.35)", borderRadius: 100, fontSize: 14, fontWeight: 700, color: "var(--danger)", cursor: "pointer" }}
          >
            {isPending ? "…" : "Remove"}
          </button>
          <button
            onClick={() => onKeep(note)}
            disabled={isPending}
            style={{ flex: 1, padding: "11px 0", background: "var(--brand-grad)", border: "none", borderRadius: 100, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" }}
          >
            {isPending ? "…" : "Keep & send"}
          </button>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: 10, padding: "10px 14px" }}>
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55 }}>
            🛡 Removed screenshots are deleted permanently — no admin override.
          </p>
        </div>
      </div>
    </aside>
  );
}

// ─── Top-level ────────────────────────────────────────────────────

export default function EmployeeAppClient({ data }: { data: EmployeeAppData }) {
  const router = useRouter();
  const [selected, setSelected] = useState<EmployeeShot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const session = data.activeSession;
  const status: "idle" | "tracking" | "paused" | "ended" = session?.status ?? "idle";

  function refresh() { router.refresh(); }
  function showError(e: string | undefined) {
    if (e) setError(e); else setError(null);
  }

  function onStart() {
    setError(null);
    startTransition(async () => {
      const r = await startSession(null);
      if (r.error) showError(r.error); else refresh();
    });
  }
  function onPause() {
    if (!session) return;
    setError(null);
    startTransition(async () => {
      const r = await pauseSession(session.id);
      if (r.error) showError(r.error); else refresh();
    });
  }
  function onResume() {
    if (!session) return;
    setError(null);
    startTransition(async () => {
      const r = await resumeSession(session.id);
      if (r.error) showError(r.error); else refresh();
    });
  }
  function onEnd() {
    if (!session) return;
    setError(null);
    startTransition(async () => {
      const r = await endSession(session.id);
      if (r.error) showError(r.error); else refresh();
    });
  }

  function onKeep(note: string) {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const r = await approveScreenshot(selected.id, note);
      if (r.error) showError(r.error);
      else { setSelected(null); refresh(); }
    });
  }
  function onRemove() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const r = await removeScreenshot(selected.id);
      if (r.error) showError(r.error);
      else { setSelected(null); refresh(); }
    });
  }
  function onApproveAll() {
    setError(null);
    startTransition(async () => {
      const r = await approveAllPending();
      if (r.error) {
        showError(r.error);
      } else {
        // Surface partial failures — silently dropping them previously hid
        // RLS / storage errors behind a "success" count.
        if (r.failures && r.failures.length > 0) {
          showError(`Approved ${r.count}, ${r.failures.length} failed: ${r.failures[0].error}`);
        }
        setSelected(null);
        refresh();
      }
    });
  }

  const today = new Date().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
  const firstName = data.me.full_name.split(" ")[0];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar me={data.me} status={status} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "20px 28px 0", borderBottom: "1px solid var(--line)", background: "var(--bg)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>
            {today}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", marginBottom: 16, lineHeight: 1 }}>
            Good day, <em className="font-serif" style={{ fontStyle: "italic", fontWeight: 400 }}>{firstName}</em>
          </h1>
        </div>

        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "var(--danger-bg)", border: "1px solid rgba(196,28,60,0.2)", fontSize: 13, color: "var(--danger)" }}>
              {error}
            </div>
          )}

          {/* Desktop install nudge — shown until the user has any captured shot today */}
          {data.stats.pending + data.stats.approved + data.stats.removed === 0 && (
            <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, background: "linear-gradient(115deg, rgba(255,138,76,0.10), rgba(91,108,255,0.10))", border: "1px solid rgba(178,84,232,0.25)", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18 }}>💻</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
                  Install AllyTracker Desktop to capture screenshots
                </p>
                <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                  Tracking only captures screens once the desktop agent is running.
                </p>
              </div>
              <Link href="/download" style={{ padding: "8px 16px", background: "var(--brand-grad)", color: "#fff", borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
                Download →
              </Link>
            </div>
          )}

          <TimerCard
            session={session}
            onStart={onStart}
            onPause={onPause}
            onResume={onResume}
            onEnd={onEnd}
            isPending={isPending}
          />

          <StatStrip stats={data.stats} />

          {data.pending.length > 0 ? (
            <ReviewTray
              pending={data.pending}
              selected={selected}
              onSelect={setSelected}
              onApproveAll={onApproveAll}
              isPending={isPending}
            />
          ) : (
            <div style={{ background: "var(--good-bg)", border: "1px solid rgba(11,123,58,0.2)", borderRadius: 16, padding: 28, textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>✅</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--good)", marginBottom: 4 }}>All caught up</p>
              <p style={{ fontSize: 14, color: "var(--ink-2)" }}>
                {session ? "Screenshots will appear here every 10 minutes while tracking." : "Start tracking to begin capturing screenshots."}
              </p>
            </div>
          )}

          <ApprovedRail shots={data.approved} />
        </main>
      </div>

      <DetailDrawer
        key={selected?.id ?? "empty"}
        shot={selected}
        onKeep={onKeep}
        onRemove={onRemove}
        isPending={isPending}
      />
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const primaryDarkBtn: React.CSSProperties = {
  padding: "10px 22px", background: "var(--brand-grad)", color: "#fff",
  border: "none", borderRadius: 100, fontSize: 14, fontWeight: 700,
  cursor: "pointer", whiteSpace: "nowrap",
};
const whiteBtn: React.CSSProperties = {
  padding: "10px 22px", background: "#fff", color: "#1A1424",
  border: "none", borderRadius: 100, fontSize: 14, fontWeight: 700,
  cursor: "pointer",
};
const ghostDarkBtn: React.CSSProperties = {
  padding: "10px 22px", background: "transparent", color: "rgba(240,237,246,0.55)",
  border: "1px solid rgba(240,237,246,0.15)", borderRadius: 100,
  fontSize: 14, fontWeight: 600, cursor: "pointer",
};
