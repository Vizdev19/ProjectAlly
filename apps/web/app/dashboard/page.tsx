"use client";

import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import FakeScreen from "@/components/ui/FakeScreen";

const TEAM = [
  { id: "em", name: "Elena Mendoza", role: "Senior Designer", initials: "EM", color: "#FF8A4C", status: "tracking", sessionStart: "9:02 AM", elapsed: "3h 17m", project: "Q3 Launch · Mockups", today: { approved: 18, removed: 2, pending: 0, hours: 5.4 } },
  { id: "jr", name: "Jordan Reyes", role: "Staff Engineer", initials: "JR", color: "#FF4A8E", status: "tracking", sessionStart: "8:45 AM", elapsed: "4h 02m", project: "Q3 Launch · API", today: { approved: 22, removed: 1, pending: 0, hours: 6.8 } },
  { id: "tk", name: "Tomás Kowal", role: "Frontend Engineer", initials: "TK", color: "#B254E8", status: "paused", sessionStart: "9:15 AM", elapsed: "2h 41m", project: "Q3 Launch · Frontend", today: { approved: 14, removed: 4, pending: 0, hours: 4.2 } },
  { id: "sa", name: "Sahar Amin", role: "Product Manager", initials: "SA", color: "#5B6CFF", status: "reviewing", sessionStart: "8:30 AM", elapsed: "4h 18m", project: "Q3 Launch · Coordination", today: { approved: 11, removed: 3, pending: 6, hours: 4.0 } },
  { id: "lw", name: "Lin Wu", role: "Content Strategist", initials: "LW", color: "#3DC9B3", status: "tracking", sessionStart: "10:08 AM", elapsed: "1h 49m", project: "Q3 Launch · Copy", today: { approved: 9, removed: 1, pending: 0, hours: 2.9 } },
];

type ScreenKind = "figma" | "linear" | "email" | "bank" | "code" | "slack" | "sheet" | "terminal" | "notion" | "doc" | "photo";


const STATUS_COLOR: Record<string, string> = {
  tracking: "#3DC9B3",
  paused: "#F4B740",
  reviewing: "#B254E8",
  ended: "var(--muted)",
};

function StatusDot({ status }: { status: string }) {
  return (
    <div style={{ position: "relative", width: 9, height: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {status === "tracking" && (
        <div style={{ position: "absolute", width: 9, height: 9, borderRadius: "50%", background: STATUS_COLOR.tracking, opacity: 0.3, animation: "pulse-dot 2s ease-in-out infinite" }} />
      )}
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLOR[status] ?? "var(--muted)", flexShrink: 0 }} />
    </div>
  );
}

function Sidebar() {
  const navItems = [
    { label: "Overview", icon: "◻" },
    { label: "Team", icon: "◈", badge: "6" },
    { label: "Screenshots", icon: "◧", active: true },
    { label: "Timesheets", icon: "◫" },
    { label: "Projects", icon: "◩" },
    { label: "Reports", icon: "◰" },
  ];

  return (
    <aside style={{ width: 232, background: "var(--surface)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", height: "100vh", flexShrink: 0 }}>
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
          <img src="/logo.jpg" alt="" style={{ width: 24, height: 24, borderRadius: 5, objectFit: "cover" }} />
          AllyTracker
        </div>
      </div>

      <div style={{ padding: "12px 10px", borderBottom: "1px solid var(--line)" }}>
        <button style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--surface-2)", borderRadius: 10, border: "none", cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--brand-grad)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>N</div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Northwind</p>
            <p style={{ fontSize: 11, color: "var(--muted)" }}>34 teammates</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--muted)" }}>
            <path d="M3.5 5.5L7 9l3.5-3.5"/>
          </svg>
        </button>
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

      <div style={{ padding: "12px 10px", borderTop: "1px solid var(--line)" }}>
        <div style={{ background: "linear-gradient(135deg, rgba(255,138,76,0.12), rgba(178,84,232,0.12))", border: "1px solid rgba(178,84,232,0.2)", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>Trial · 8 days left</p>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Upgrade to keep full history.</p>
          <button style={{ width: "100%", padding: "7px 0", background: "var(--brand-grad)", color: "#fff", border: "none", borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Upgrade →</button>
        </div>
        <button style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "transparent", borderRadius: 9, border: "none", cursor: "pointer" }}>
          <Avatar initials="DK" color="#5B6CFF" size={26} />
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)" }}>Settings</span>
        </button>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <div style={{ height: 58, borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", padding: "0 24px", gap: 16, background: "var(--bg)" }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>Workspace</span>
        <span style={{ fontSize: 13, color: "var(--muted)", margin: "0 6px" }}>›</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Screenshots</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "7px 14px", flex: "0 1 280px" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--muted)" }}>
          <circle cx="6" cy="6" r="4.5"/><path d="M10.5 10.5l2 2"/>
        </svg>
        <span style={{ flex: 1, fontSize: 13, color: "var(--muted)" }}>Search teammates…</span>
        <span style={{ fontSize: 11, background: "var(--surface-2)", color: "var(--muted)", padding: "2px 6px", borderRadius: 5, fontWeight: 600 }}>⌘K</span>
      </div>
      <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 9, fontSize: 13, fontWeight: 600, color: "var(--ink-2)", cursor: "pointer" }}>
        Export
      </button>
      <button style={{ position: "relative", width: 36, height: 36, borderRadius: 9, background: "var(--surface)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 1.5a5 5 0 015 5v2l1.5 3h-13L3 8.5v-2a5 5 0 015-5zM6 12.5a2 2 0 004 0"/>
        </svg>
        <div style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: "var(--g-pink)", border: "1.5px solid var(--bg)" }} />
      </button>
      <Avatar initials="DK" color="#5B6CFF" size={34} />
    </div>
  );
}

function KPIStrip() {
  const kpis = [
    { label: "Approved", value: "86", delta: "+12%", good: true },
    { label: "Removed", value: "10", delta: "-4%", good: true },
    { label: "Awaiting review", value: "6", delta: null, good: null },
    { label: "Tracking now", value: "3 of 6", delta: null, good: null },
  ];
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {kpis.map(k => (
        <div key={k.label} style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4, fontWeight: 500 }}>{k.label}</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)" }}>{k.value}</span>
            {k.delta && <span style={{ fontSize: 12, fontWeight: 600, color: k.good ? "var(--good)" : "var(--danger)", background: k.good ? "var(--good-bg)" : "var(--danger-bg)", padding: "2px 7px", borderRadius: 100 }}>{k.delta}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function LiveStrip() {
  const screenKinds: ScreenKind[] = ["figma", "code", "notion", "slack", "figma"];
  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>Live now</p>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
        {TEAM.filter(m => m.status !== "ended").map((m, i) => (
          <div key={m.id} style={{ width: 220, flexShrink: 0, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Avatar initials={m.initials} color={m.color} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name.split(" ")[0]}</p>
              </div>
              <StatusDot status={m.status} />
            </div>
            <div style={{ borderRadius: 8, overflow: "hidden", aspectRatio: "16/10", marginBottom: 8, background: "var(--surface-2)" }}>
              <FakeScreen kind={screenKinds[i]} />
            </div>
            <p style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.project}</p>
            <p style={{ fontSize: 11, color: "var(--ink-2)", fontWeight: 600, marginTop: 2 }}>{m.elapsed}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Shot {
  kind: ScreenKind;
  time: string;
}

function MemberStream({ member, shots, onSelectShot }: { member: typeof TEAM[0], shots: Shot[], onSelectShot: (s: Shot & { member: typeof TEAM[0] }) => void }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
        <Avatar initials={member.initials} color={member.color} size={32} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{member.name}</p>
            <StatusDot status={member.status} />
            <span style={{ fontSize: 12, color: STATUS_COLOR[member.status], fontWeight: 600 }}>{member.status.charAt(0).toUpperCase() + member.status.slice(1)}</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>{member.role}</p>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
          <span style={{ color: "var(--good)", fontWeight: 600 }}>{member.today.approved} approved</span>
          <span style={{ color: "var(--danger)", fontWeight: 600 }}>{member.today.removed} removed</span>
          <span style={{ color: "var(--muted)" }}>{member.today.hours}h</span>
        </div>
        <button style={{ padding: "5px 12px", background: "transparent", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12, color: "var(--ink-2)", cursor: "pointer" }}>···</button>
      </div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        {shots.map((s, i) => (
          <div key={i} onClick={() => onSelectShot({ ...s, member })} style={{ width: 168, height: 110, flexShrink: 0, borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)", cursor: "pointer", position: "relative" }}>
            <FakeScreen kind={s.kind} />
            <div style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(26,20,36,0.75)", borderRadius: 5, padding: "2px 7px", fontSize: 10, color: "#fff", fontWeight: 600, fontFamily: "var(--font-geist-mono, monospace)" }}>{s.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DrawerShot {
  kind: ScreenKind;
  time: string;
  member: typeof TEAM[0];
}

function DetailDrawer({ shot, onClose }: { shot: DrawerShot | null, onClose: () => void }) {
  if (!shot) return null;
  return (
    <aside style={{ width: 380, borderLeft: "1px solid var(--line)", height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", flexShrink: 0 }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar initials={shot.member.initials} color={shot.member.color} size={30} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{shot.member.name}</p>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>{shot.member.role}</p>
        </div>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: "var(--surface)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "var(--muted)" }}>×</button>
      </div>

      <div style={{ overflowY: "auto", flex: 1, padding: 20 }}>
        <div style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "16/10", marginBottom: 16, position: "relative" }}>
          <FakeScreen kind={shot.kind} />
          <div style={{ position: "absolute", top: 10, left: 10, background: "var(--good)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, display: "flex", alignItems: "center", gap: 5 }}>
            <span>✓</span> Approved by {shot.member.initials}
          </div>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
          {[
            ["Project", shot.member.project],
            ["Application", shot.kind.charAt(0).toUpperCase() + shot.kind.slice(1)],
            ["Captured at", shot.time],
            ["Session", `Started ${shot.member.sessionStart} · ${shot.member.elapsed}`],
            ["Linked task", "Q3 Launch · #841"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ width: 100, fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "var(--surface)", borderRadius: 12, padding: "14px 16px", marginBottom: 16, borderLeft: "3px solid var(--g-orange)" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Employee note</p>
          <p className="font-serif" style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, fontStyle: "italic" }}>&ldquo;Iterating on the hero section &mdash; comparing variant 3 vs 4 side by side.&rdquo;</p>
        </div>

        <div style={{ background: "var(--good-bg)", border: "1px solid rgba(11,123,58,0.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--good)", marginBottom: 4 }}>Review summary</p>
          <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>Screenshot approved by {shot.member.name.split(" ")[0]} at {shot.time}. Included in today&apos;s session report.</p>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <button style={{ flex: 1, padding: "10px 0", background: "var(--surface-2)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "var(--ink-2)", cursor: "pointer" }}>Message</button>
          <button style={{ flex: 1, padding: "10px 0", background: "var(--brand-grad)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>View session</button>
        </div>
        <button style={{ width: "100%", padding: "10px 0", background: "transparent", border: "1px solid rgba(196,28,60,0.25)", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "var(--danger)", cursor: "pointer" }}>Flag for follow-up</button>
      </div>
    </aside>
  );
}

export default function DashboardPage() {
  const [selectedShot, setSelectedShot] = useState<DrawerShot | null>(null);

  const memberShots = (_memberId: string): Shot[] => {
    const kinds: ScreenKind[] = ["figma", "slack", "notion", "linear", "code", "figma", "email", "figma"];
    const times = ["9:02", "9:12", "9:22", "9:32", "9:42", "9:52", "10:02", "10:12"];
    return kinds.slice(0, 5).map((k, i) => ({ kind: k, time: times[i] + " AM" }));
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar />

        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>Today&apos;s screenshots</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--danger-bg)", border: "1px solid rgba(255,74,142,0.2)", borderRadius: 100, padding: "4px 12px" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--g-pink)", animation: "pulse-dot 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--g-pink)" }}>Wed, 14 May</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {["All teammates", "All projects", "Today"].map((f, i) => (
              <button key={f} style={{ padding: "6px 14px", background: i === 0 ? "var(--ink)" : "var(--surface)", border: "1px solid var(--line)", borderRadius: 100, fontSize: 13, fontWeight: 600, color: i === 0 ? "#fff" : "var(--ink-2)", cursor: "pointer" }}>{f}</button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              {["⊞", "≡"].map((icon, i) => (
                <button key={i} style={{ width: 34, height: 34, borderRadius: 8, background: i === 0 ? "var(--ink)" : "var(--surface)", border: "1px solid var(--line)", cursor: "pointer", fontSize: 15, color: i === 0 ? "#fff" : "var(--muted)" }}>{icon}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <KPIStrip />
          </div>

          <div style={{ marginBottom: 28 }}>
            <LiveStrip />
          </div>

          <div>
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>Approved by teammate</p>
            {TEAM.map(m => (
              <MemberStream key={m.id} member={m} shots={memberShots(m.id)} onSelectShot={s => setSelectedShot(s)} />
            ))}
          </div>
        </main>
      </div>

      <DetailDrawer shot={selectedShot} onClose={() => setSelectedShot(null)} />
    </div>
  );
}
