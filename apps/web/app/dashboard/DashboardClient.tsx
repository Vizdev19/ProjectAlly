"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import type { MemberStats, ApprovedShot } from "@/lib/data/dashboard";

export type DashboardData = {
  me: { id: string; full_name: string; avatar_color: string };
  org: { id: string; name: string; slug: string; plan: string };
  range: { from: string; to: string };
  roster: MemberStats[];
  shotsByMember: Record<string, ApprovedShot[]>;
  totals: { approved: number; removed: number; tracking: number; hours_seconds: number };
};

type SelectedShot = ApprovedShot & { member: MemberStats };

const STATUS_COLOR: Record<string, string> = {
  tracking: "#3DC9B3",
  paused:   "#F4B740",
  ended:    "var(--muted)",
};

function initialsOf(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function timeOfDay(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** "3h 25m" / "47m" / "0m" — compact tracked-time formatting. */
function formatHours(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0m";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** "May 17" or "May 17 → May 23" depending on whether the range is one day. */
function formatRangeLabel(from: string, to: string): string {
  const fmt = (ymd: string) =>
    new Date(`${ymd}T00:00:00.000Z`).toLocaleDateString([], {
      month: "short", day: "numeric", timeZone: "UTC",
    });
  if (from === to) return fmt(from);
  return `${fmt(from)} → ${fmt(to)}`;
}

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

function Sidebar({ org, memberCount, me }: { org: DashboardData["org"]; memberCount: number; me: DashboardData["me"] }) {
  const navItems = [
    { label: "Screenshots", href: "/dashboard", active: true },
    { label: "Team",        href: "/dashboard/team", badge: memberCount },
  ];

  return (
    <aside style={{ width: 232, background: "var(--surface)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", height: "100vh", flexShrink: 0 }}>
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
          <span style={{ width: 24, height: 24, borderRadius: 5, background: "var(--brand-grad)", display: "inline-block" }} />
          AllyTracker
        </div>
      </div>

      <div style={{ padding: "12px 10px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--surface-2)", borderRadius: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--brand-grad)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>
            {org.name[0]?.toUpperCase() ?? "?"}
          </div>
          <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{org.name}</p>
            <p style={{ fontSize: 11, color: "var(--muted)" }}>
              {memberCount} {memberCount === 1 ? "teammate" : "teammates"}
            </p>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "10px 10px" }}>
        {navItems.map((item) => (
          <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>
            <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: item.active ? "var(--surface-2)" : "transparent", borderRadius: 9, marginBottom: 2 }}>
              <span style={{ flex: 1, textAlign: "left", fontSize: 14, fontWeight: item.active ? 600 : 500, color: item.active ? "var(--ink)" : "var(--ink-2)" }}>{item.label}</span>
              {item.badge !== undefined && (
                <span style={{ background: "var(--surface-2)", color: "var(--muted)", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 100 }}>{item.badge}</span>
              )}
            </div>
          </Link>
        ))}
      </nav>

      <div style={{ padding: "12px 10px", borderTop: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9 }}>
          <Avatar initials={initialsOf(me.full_name)} color={me.avatar_color} size={26} />
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {me.full_name}
          </span>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ me }: { me: DashboardData["me"] }) {
  return (
    <div style={{ height: 58, borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", padding: "0 24px", gap: 16, background: "var(--bg)" }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>Workspace</span>
        <span style={{ fontSize: 13, color: "var(--muted)", margin: "0 6px" }}>›</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Screenshots</span>
      </div>
      <Avatar initials={initialsOf(me.full_name)} color={me.avatar_color} size={34} />
    </div>
  );
}

function KPIStrip({ totals, totalMembers }: { totals: DashboardData["totals"]; totalMembers: number }) {
  const kpis = [
    { label: "Hours tracked",     value: formatHours(totals.hours_seconds) },
    { label: "Approved",          value: totals.approved.toString() },
    { label: "Removed",           value: totals.removed.toString() },
    { label: "Tracking now",      value: `${totals.tracking} of ${totalMembers}` },
  ];
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {kpis.map((k) => (
        <div key={k.label} style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4, fontWeight: 500 }}>{k.label}</p>
          <span style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)" }}>{k.value}</span>
        </div>
      ))}
    </div>
  );
}

function Controls({
  range,
  search,
  onSearchChange,
}: {
  range: { from: string; to: string };
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const router = useRouter();
  // Local controlled state for the date pickers so we can validate before pushing
  // a new URL (avoids a re-render mid-keystroke as the user types into the input).
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);

  function apply(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams();
    params.set("from", nextFrom);
    params.set("to", nextTo);
    router.push(`/dashboard?${params.toString()}`);
  }

  function quickRange(daysBack: number) {
    const now = new Date();
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - daysBack);
    const startYmd = start.toISOString().slice(0, 10);
    const endYmd = now.toISOString().slice(0, 10);
    setFrom(startYmd);
    setTo(endYmd);
    apply(startYmd, endYmd);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "5px 10px" }}>
        <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>From</span>
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => {
            setFrom(e.target.value);
            if (e.target.value) apply(e.target.value, to);
          }}
          style={{ border: "none", background: "transparent", fontSize: 13, color: "var(--ink)", outline: "none", fontFamily: "inherit" }}
        />
        <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 4 }}>To</span>
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => {
            setTo(e.target.value);
            if (e.target.value) apply(from, e.target.value);
          }}
          style={{ border: "none", background: "transparent", fontSize: 13, color: "var(--ink)", outline: "none", fontFamily: "inherit" }}
        />
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        {[
          { label: "Today", days: 0 },
          { label: "7d",    days: 6 },
          { label: "30d",   days: 29 },
        ].map((q) => (
          <button
            key={q.label}
            onClick={() => quickRange(q.days)}
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 12, fontWeight: 600, color: "var(--ink-2)", cursor: "pointer" }}
          >
            {q.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "6px 12px", minWidth: 240 }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by name"
          style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: "var(--ink)", outline: "none", fontFamily: "inherit" }}
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            style={{ width: 18, height: 18, borderRadius: 9, border: "none", background: "var(--surface-2)", color: "var(--muted)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            aria-label="Clear search"
          >×</button>
        )}
      </div>
    </div>
  );
}

function ShotThumb({ shot, onClick }: { shot: ApprovedShot; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ width: 168, height: 110, flexShrink: 0, borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)", cursor: "pointer", position: "relative", background: "var(--surface-2)" }}>
      {shot.signed_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shot.signed_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "var(--muted)" }}>📷</div>
      )}
      <div style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(26,20,36,0.75)", borderRadius: 5, padding: "2px 7px", fontSize: 10, color: "#fff", fontWeight: 600 }}>
        {timeOfDay(shot.captured_at)}
      </div>
    </div>
  );
}

function MemberStream({
  member,
  shots,
  onSelectShot,
}: {
  member: MemberStats;
  shots: ApprovedShot[];
  onSelectShot: (s: SelectedShot) => void;
}) {
  const sessionStatus = member.active_session?.status ?? "ended";
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
        <Avatar initials={initialsOf(member.full_name)} color={member.avatar_color} size={32} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{member.full_name}</p>
            <StatusDot status={sessionStatus} />
            <span style={{ fontSize: 12, color: STATUS_COLOR[sessionStatus] ?? "var(--muted)", fontWeight: 600 }}>
              {sessionStatus === "tracking" ? "Tracking" : sessionStatus === "paused" ? "Paused" : "Not tracking"}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>{member.email}</p>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12, alignItems: "center" }}>
          <span style={{ color: "var(--ink)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {formatHours(member.hours_seconds)}
          </span>
          <span style={{ color: "var(--good)", fontWeight: 600 }}>{member.approved} approved</span>
          <span style={{ color: "var(--danger)", fontWeight: 600 }}>{member.removed} removed</span>
        </div>
      </div>
      {shots.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--muted)", padding: "10px 4px" }}>
          No approved screenshots in this range.
        </p>
      ) : (
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          {shots.map((s) => (
            <ShotThumb key={s.id} shot={s} onClick={() => onSelectShot({ ...s, member })} />
          ))}
        </div>
      )}
    </div>
  );
}

function DetailDrawer({ shot, onClose }: { shot: SelectedShot | null; onClose: () => void }) {
  if (!shot) return null;
  return (
    <aside style={{ width: 380, borderLeft: "1px solid var(--line)", height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", flexShrink: 0 }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar initials={initialsOf(shot.member.full_name)} color={shot.member.avatar_color} size={30} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{shot.member.full_name}</p>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>{shot.member.email}</p>
        </div>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: "var(--surface)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "var(--muted)" }}>×</button>
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

        <div style={{ background: "var(--surface)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
          {[
            ["Application", shot.app_name ?? "—"],
            ["Window",      shot.window_title ?? "—"],
            ["Captured",    new Date(shot.captured_at).toLocaleString()],
            ["Submitted",   shot.submitted_at ? new Date(shot.submitted_at).toLocaleString() : "—"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ width: 100, fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const [selectedShot, setSelectedShot] = useState<SelectedShot | null>(null);
  const [search, setSearch] = useState("");

  const rangeLabel = formatRangeLabel(data.range.from, data.range.to);

  // Name filter is purely client-side — the roster is already loaded, no need
  // to round-trip. Case-insensitive substring match against full_name.
  const filteredRoster = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.roster;
    return data.roster.filter((m) => m.full_name.toLowerCase().includes(q));
  }, [data.roster, search]);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar org={data.org} memberCount={data.roster.length} me={data.me} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar me={data.me} />

        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>Team activity</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--danger-bg)", border: "1px solid rgba(255,74,142,0.2)", borderRadius: 100, padding: "4px 12px" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--g-pink)", animation: "pulse-dot 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--g-pink)" }}>{rangeLabel}</span>
            </div>
          </div>

          <Controls range={data.range} search={search} onSearchChange={setSearch} />

          <div style={{ marginBottom: 24 }}>
            <KPIStrip totals={data.totals} totalMembers={data.roster.length} />
          </div>

          {data.roster.length === 0 ? (
            <div style={{ background: "var(--surface)", border: "1px dashed var(--line-2)", borderRadius: 14, padding: 40, textAlign: "center" }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>No teammates yet</p>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
                Invite your team to start tracking together.
              </p>
              <Link
                href="/dashboard/team"
                style={{ display: "inline-block", padding: "10px 22px", background: "var(--brand-grad)", color: "#fff", borderRadius: 100, fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}
              >
                Invite teammates →
              </Link>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>
                Approved by teammate
                {search && (
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: "var(--muted)", textTransform: "none", letterSpacing: 0 }}>
                    ({filteredRoster.length} of {data.roster.length} match &ldquo;{search}&rdquo;)
                  </span>
                )}
              </p>
              {filteredRoster.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--muted)", padding: "20px 4px" }}>
                  No teammates match &ldquo;{search}&rdquo;.
                </p>
              ) : (
                filteredRoster.map((m) => (
                  <MemberStream
                    key={m.id}
                    member={m}
                    shots={data.shotsByMember[m.id] ?? []}
                    onSelectShot={(s) => setSelectedShot(s)}
                  />
                ))
              )}
            </div>
          )}
        </main>
      </div>

      <DetailDrawer shot={selectedShot} onClose={() => setSelectedShot(null)} />
    </div>
  );
}
