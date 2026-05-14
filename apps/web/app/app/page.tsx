"use client";

import { useState, useEffect, useCallback } from "react";
import Avatar from "@/components/ui/Avatar";
import FakeScreen from "@/components/ui/FakeScreen";

type TimerState = "idle" | "tracking" | "paused" | "ended";
type ScreenKind = "figma" | "linear" | "email" | "bank" | "code" | "slack" | "sheet" | "terminal" | "notion" | "doc" | "photo";

const TRAY = [
  { id: "s01", time: "9:02 AM", kind: "figma" as ScreenKind, app: "Figma", project: "Q3 Launch · Hero", window: "Hero variant 3" },
  { id: "s02", time: "9:12 AM", kind: "figma" as ScreenKind, app: "Figma", project: "Q3 Launch · Hero", window: "Hero variant 4" },
  { id: "s03", time: "9:22 AM", kind: "photo" as ScreenKind, app: "Photos", project: "", window: "IMG_4821.heic", personal: true },
  { id: "s04", time: "9:32 AM", kind: "figma" as ScreenKind, app: "Figma", project: "Q3 Launch · Hero", window: "Hero variant 5" },
  { id: "s05", time: "9:42 AM", kind: "slack" as ScreenKind, app: "Slack", project: "Q3 Launch · Coordination", window: "#launch-design" },
  { id: "s06", time: "9:52 AM", kind: "bank" as ScreenKind, app: "Chase Banking", project: "", window: "Account · checking", personal: true },
  { id: "s07", time: "10:02 AM", kind: "notion" as ScreenKind, app: "Notion", project: "Q3 Launch · Brief", window: "Launch brief" },
  { id: "s08", time: "10:12 AM", kind: "figma" as ScreenKind, app: "Figma", project: "Q3 Launch · Onboarding", window: "Onboarding · screen 2" },
  { id: "s09", time: "10:22 AM", kind: "email" as ScreenKind, app: "Gmail", project: "", window: "Re: school pickup", personal: true },
  { id: "s10", time: "10:32 AM", kind: "figma" as ScreenKind, app: "Figma", project: "Q3 Launch · Onboarding", window: "Onboarding · screen 3" },
];

const APPROVED = [
  { id: "a01", time: "8:42 AM", kind: "figma" as ScreenKind, app: "Figma", window: "Brand assets" },
  { id: "a02", time: "8:52 AM", kind: "notion" as ScreenKind, app: "Notion", window: "Sprint planning" },
  { id: "a03", time: "9:00 AM", kind: "slack" as ScreenKind, app: "Slack", window: "#design-sync" },
];

function Sidebar({ timerState }: { timerState: TimerState }) {
  const navItems = [
    { label: "Today", icon: "◻", active: true },
    { label: "My screenshots", icon: "◧", badge: "10" },
    { label: "My timesheet", icon: "◫" },
    { label: "Projects", icon: "◩" },
    { label: "Insights", icon: "◰" },
  ];

  return (
    <aside style={{ width: 224, background: "var(--surface)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", height: "100vh", flexShrink: 0 }}>
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
          <img src="/logo.jpg" alt="" style={{ width: 24, height: 24, borderRadius: 5, objectFit: "cover" }} />
          AllyTracker
        </div>
      </div>

      <div style={{ padding: "12px 12px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--surface-2)", borderRadius: 12 }}>
          <Avatar initials="EM" color="#FF8A4C" size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Elena's view</p>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: timerState === "tracking" ? "#3DC9B3" : timerState === "paused" ? "#F4B740" : "var(--muted)" }} />
              <span style={{ fontSize: 11, color: timerState === "tracking" ? "#3DC9B3" : timerState === "paused" ? "#F4B740" : "var(--muted)", fontWeight: 600 }}>
                {timerState === "tracking" ? "Tracking now" : timerState === "paused" ? "Paused" : timerState === "ended" ? "Session ended" : "Not tracking"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "10px 10px" }}>
        {navItems.map(item => (
          <button key={item.label} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: item.active ? "var(--surface-2)" : "transparent", borderRadius: 9, border: "none", cursor: "pointer", marginBottom: 2 }}>
            <span style={{ fontSize: 13, color: item.active ? "var(--g-pink)" : "var(--muted)", width: 16, textAlign: "center" }}>{item.icon}</span>
            <span style={{ flex: 1, textAlign: "left", fontSize: 14, fontWeight: item.active ? 600 : 500, color: item.active ? "var(--ink)" : "var(--ink-2)" }}>{item.label}</span>
            {item.badge && <span style={{ background: "var(--danger-bg)", color: "var(--g-pink)", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 100 }}>{item.badge}</span>}
          </button>
        ))}
      </nav>

      <div style={{ padding: "12px 12px", borderTop: "1px solid var(--line)" }}>
        <div style={{ background: "rgba(91,108,255,0.07)", border: "1px solid rgba(91,108,255,0.2)", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>🛡</span>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Your data, your call</p>
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>Nothing leaves your machine until you approve it.</p>
        </div>
        <button style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "transparent", border: "none", cursor: "pointer", borderRadius: 9 }}>
          <Avatar initials="EM" color="#FF8A4C" size={26} />
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)" }}>Settings</span>
        </button>
      </div>
    </aside>
  );
}

function TimerCard({ state, setState }: { state: TimerState, setState: (s: TimerState) => void }) {
  const [seconds, setSeconds] = useState(11904);
  const [nextShot, setNextShot] = useState(262);

  useEffect(() => {
    if (state !== "tracking") return;
    const t = setInterval(() => {
      setSeconds(s => s + 1);
      setNextShot(n => {
        if (n <= 1) return 600;
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [state]);

  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  const nm = Math.floor(nextShot / 60).toString().padStart(1, "0");
  const ns = (nextShot % 60).toString().padStart(2, "0");

  return (
    <div style={{ background: "#1A1424", borderRadius: 20, padding: 28, position: "relative", overflow: "hidden", marginBottom: 20 }}>
      <div style={{ position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(178,84,232,0.25) 0%, rgba(91,108,255,0.15) 50%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,74,142,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          {state === "tracking" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--g-pink)", animation: "pulse-dot 2s ease-in-out infinite" }} />}
          {state === "paused" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F4B740" }} />}
          {state === "ended" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--muted)" }} />}
          {state === "idle" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--muted)" }} />}
          <span style={{ fontSize: 13, color: "rgba(240,237,246,0.55)", fontWeight: 500 }}>
            {state === "tracking" ? "Tracking · session in progress" : state === "paused" ? "Paused · session on hold" : state === "ended" ? "Session ended" : "Ready to track"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 52, fontWeight: 700, letterSpacing: "0.04em", color: state === "idle" ? "rgba(240,237,246,0.3)" : "#F0EDF6", marginBottom: 14 }}>
              {h}:{m}:{s}
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 100, padding: "7px 14px", cursor: "pointer" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand-grad)" }} />
              <span style={{ fontSize: 13, color: "rgba(240,237,246,0.7)", fontWeight: 500 }}>Q3 Launch · Onboarding</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="rgba(240,237,246,0.4)" strokeWidth="1.5">
                <path d="M3 4.5L6 7.5l3-3"/>
              </svg>
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
            {state === "idle" && (
              <button onClick={() => setState("tracking")} style={{ padding: "10px 22px", background: "var(--brand-grad)", color: "#fff", border: "none", borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                Start tracking
              </button>
            )}
            {state === "tracking" && (
              <>
                <button onClick={() => setState("paused")} style={{ padding: "10px 22px", background: "#fff", color: "#1A1424", border: "none", borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Pause
                </button>
                <button onClick={() => setState("ended")} style={{ padding: "10px 22px", background: "transparent", color: "rgba(240,237,246,0.55)", border: "1px solid rgba(240,237,246,0.15)", borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  End session
                </button>
              </>
            )}
            {state === "paused" && (
              <>
                <button onClick={() => setState("tracking")} style={{ padding: "10px 22px", background: "var(--brand-grad)", color: "#fff", border: "none", borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Resume
                </button>
                <button onClick={() => setState("ended")} style={{ padding: "10px 22px", background: "transparent", color: "rgba(240,237,246,0.55)", border: "1px solid rgba(240,237,246,0.15)", borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  End session
                </button>
              </>
            )}
            {state === "ended" && (
              <button onClick={() => setState("idle")} style={{ padding: "10px 22px", background: "rgba(255,255,255,0.08)", color: "rgba(240,237,246,0.6)", border: "none", borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                New session
              </button>
            )}
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(240,237,246,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "rgba(240,237,246,0.35)" }}>
            {state === "tracking" ? `Next screenshot in ${nm}:${ns} · cadence every 10 min` : "Capture paused"}
          </span>
          <span style={{ fontSize: 12, color: "rgba(240,237,246,0.3)" }}>Auto-pauses after 5 min idle · started 9:02 AM</span>
        </div>
      </div>
    </div>
  );
}

function StatStrip({ pendingCount }: { pendingCount: number }) {
  const stats = [
    { label: "Today", value: "3.3h", highlight: false },
    { label: "Awaiting review", value: pendingCount.toString(), highlight: pendingCount > 0 },
    { label: "Approved", value: "3", highlight: false },
    { label: "Removed by you", value: "2", highlight: false },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: "var(--surface)", border: s.highlight ? "1.5px solid var(--g-pink)" : "1px solid var(--line)", borderRadius: 12, padding: "12px 14px", boxShadow: s.highlight ? "0 0 0 3px rgba(255,74,142,0.1)" : "none" }}>
          <p style={{ fontSize: 11, color: s.highlight ? "var(--g-pink)" : "var(--muted)", marginBottom: 4, fontWeight: 500 }}>{s.label}</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: s.highlight ? "var(--g-pink)" : "var(--ink)" }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

type TrayItem = typeof TRAY[0];
type ApprovedItem = typeof APPROVED[0];

function ReviewTray({ tray, onSelect, selected, onApproveAll }: {
  tray: TrayItem[];
  onSelect: (s: TrayItem | null) => void;
  selected: TrayItem | null;
  onApproveAll: () => void;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ background: "var(--danger-bg)", color: "var(--g-pink)", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 100 }}>Awaiting your review</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>{tray.length} screenshots to look at</h2>
          <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 2 }}>Remove anything personal or sensitive.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--line-2)", borderRadius: 100, fontSize: 13, fontWeight: 600, color: "var(--ink-2)", cursor: "pointer" }}>
            Auto-flag personal apps
          </button>
          <button onClick={onApproveAll} style={{ padding: "8px 16px", background: "#1A1424", border: "none", borderRadius: 100, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            Approve all & send
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 16 }}>
        {tray.map(shot => (
          <div key={shot.id} onClick={() => onSelect(selected?.id === shot.id ? null : shot)} style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "16/10", position: "relative", cursor: "pointer", border: selected?.id === shot.id ? "2px solid var(--g-blue)" : shot.personal ? "2px solid rgba(255,74,142,0.5)" : "1px solid var(--line)", boxSizing: "border-box", transition: "border-color 0.15s" }}>
            <FakeScreen kind={shot.kind} />
            {shot.personal && (
              <div style={{ position: "absolute", top: 4, right: 4, background: "var(--g-pink)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 100 }}>Personal?</div>
            )}
            <div style={{ position: "absolute", bottom: 5, left: 5, background: "rgba(26,20,36,0.75)", borderRadius: 5, padding: "2px 6px", fontSize: 9, color: "#fff", fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 600 }}>{shot.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApprovedRail({ shots }: { shots: ApprovedItem[] }) {
  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>Already approved today</p>
      <div style={{ display: "flex", gap: 10, overflowX: "auto" }}>
        {shots.map(s => (
          <div key={s.id} style={{ width: 168, height: 110, flexShrink: 0, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(11,123,58,0.3)", position: "relative" }}>
            <FakeScreen kind={s.kind} />
            <div style={{ position: "absolute", inset: 0, background: "rgba(11,123,58,0.08)" }} />
            <div style={{ position: "absolute", top: 6, left: 6, background: "var(--good)", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 100, letterSpacing: "0.04em" }}>✓ Approved</div>
            <div style={{ position: "absolute", bottom: 5, left: 5, background: "rgba(26,20,36,0.7)", borderRadius: 5, padding: "2px 6px", fontSize: 9, color: "#fff", fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 600 }}>{s.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailDrawer({ shot, onRemove, onKeep }: {
  shot: TrayItem | null;
  onRemove: () => void;
  onKeep: () => void;
}) {
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
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 100, background: shot.personal ? "var(--danger-bg)" : "var(--good-bg)", border: `1px solid ${shot.personal ? "rgba(255,74,142,0.25)" : "rgba(11,123,58,0.25)"}` }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: shot.personal ? "var(--g-pink)" : "var(--good)" }}>
            {shot.personal ? "⚠ AllyTracker thinks this might be personal" : "✓ Ready for your review"}
          </span>
        </div>
      </div>

      <div style={{ overflowY: "auto", flex: 1, padding: 20 }}>
        <div style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "16/10", marginBottom: 16 }}>
          <FakeScreen kind={shot.kind} />
        </div>

        <div style={{ background: "var(--surface)", borderRadius: 12, padding: "12px 16px", marginBottom: 14 }}>
          {[
            ["Application", shot.app],
            ["Window", shot.window],
            ["Project", shot.project || "—"],
            ["Captured at", shot.time],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ width: 90, fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(91,108,255,0.07)", border: "1px solid rgba(91,108,255,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--g-blue)", marginBottom: 6 }}>If you keep this</p>
          <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>Sahar (your manager) will see this screenshot in the team gallery for Q3 Launch. It will be associated with your session started at 9:02 AM.</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 8 }}>Note to future-you <span style={{ fontWeight: 400 }}>(private, not shared)</span></label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="What were you working on at this moment?" rows={3} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: 14, color: "var(--ink)", background: "var(--bg)", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <button onClick={onRemove} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(196,28,60,0.35)", borderRadius: 100, fontSize: 14, fontWeight: 700, color: "var(--danger)", cursor: "pointer" }}>
            Remove
          </button>
          <button onClick={onKeep} style={{ flex: 1, padding: "11px 0", background: "var(--brand-grad)", border: "none", borderRadius: 100, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
            Keep & send
          </button>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8 }}>
          <span style={{ fontSize: 14 }}>🛡</span>
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55 }}>Removed screenshots are deleted permanently. No admin override — not even AllyTracker can recover them.</p>
        </div>
      </div>
    </aside>
  );
}

export default function EmployeeAppPage() {
  const [timerState, setTimerState] = useState<TimerState>("tracking");
  const [tray, setTray] = useState(TRAY);
  const [selectedShot, setSelectedShot] = useState<TrayItem | null>(null);

  const handleRemove = useCallback(() => {
    if (!selectedShot) return;
    setTray(t => t.filter(s => s.id !== selectedShot.id));
    setSelectedShot(null);
  }, [selectedShot]);

  const handleKeep = useCallback(() => {
    if (!selectedShot) return;
    setTray(t => t.filter(s => s.id !== selectedShot.id));
    setSelectedShot(null);
  }, [selectedShot]);

  const handleApproveAll = useCallback(() => {
    setTray([]);
    setSelectedShot(null);
  }, []);

  const handleSelect = useCallback((shot: TrayItem | null) => {
    setSelectedShot(shot);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar timerState={timerState} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "20px 28px 0", borderBottom: "1px solid var(--line)", background: "var(--bg)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>Wednesday · 14 May</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", marginBottom: 16, lineHeight: 1 }}>
            Good morning, <em className="font-serif" style={{ fontStyle: "italic", fontWeight: 400 }}>Elena</em>
          </h1>
        </div>

        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          <TimerCard state={timerState} setState={setTimerState} />
          <StatStrip pendingCount={tray.length} />

          {tray.length > 0 ? (
            <ReviewTray tray={tray} onSelect={handleSelect} selected={selectedShot} onApproveAll={handleApproveAll} />
          ) : (
            <div style={{ background: "var(--good-bg)", border: "1px solid rgba(11,123,58,0.2)", borderRadius: 16, padding: 28, textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>✅</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--good)", marginBottom: 4 }}>All caught up!</p>
              <p style={{ fontSize: 14, color: "var(--ink-2)" }}>All screenshots have been reviewed and sent.</p>
            </div>
          )}

          <ApprovedRail shots={APPROVED} />
        </main>
      </div>

      <DetailDrawer shot={selectedShot} onRemove={handleRemove} onKeep={handleKeep} />
    </div>
  );
}
