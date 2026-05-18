"use client";

import { useState } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import DateRangeControls from "../../_components/DateRangeControls";
import { useDashboardRealtime } from "../../_components/useDashboardRealtime";
import type { Member, TrackingSession } from "@/lib/types/database";
import type { ApprovedShot, ProjectBreakdown } from "@/lib/data/dashboard";

export type MemberDetailData = {
  me: { id: string; full_name: string; avatar_color: string };
  member: Member;
  range: { from: string; to: string };
  activeSession: TrackingSession | null;
  sessions: TrackingSession[];
  approvedShots: ApprovedShot[];
  totals: { approved: number; removed: number; hours_seconds: number; session_count: number };
  projects: ProjectBreakdown[];
};

function initialsOf(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function formatHours(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0m";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Hours-only, for KPIs where the time is the headline. */
function formatHMS(totalSeconds: number): string {
  if (totalSeconds <= 0) return "—";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function SessionRow({ session }: { session: TrackingSession }) {
  const duration = session.elapsed_seconds ?? 0;
  const project = session.project?.trim() || "Untitled";
  const statusColor =
    session.status === "tracking" ? "var(--good)" :
    session.status === "paused"   ? "#9a7300"     :
    "var(--muted)";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "150px 1fr 120px 100px", gap: 12, alignItems: "center", padding: "12px 14px", borderBottom: "1px solid var(--line)", fontSize: 13 }}>
      <span style={{ color: "var(--ink-2)", fontVariantNumeric: "tabular-nums" }}>
        {formatDateTime(session.started_at)}
      </span>
      <span style={{ color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {project}
      </span>
      <span style={{ color: "var(--ink)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
        {session.ended_at ? formatHMS(duration) : <span style={{ color: statusColor }}>{session.status}…</span>}
      </span>
      <span style={{ color: "var(--muted)", textAlign: "right" }}>
        {session.ended_at ? formatTime(session.ended_at) : "—"}
      </span>
    </div>
  );
}

function ShotThumb({ shot, onClick }: { shot: ApprovedShot; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ width: 168, height: 110, borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)", cursor: "pointer", position: "relative", background: "var(--surface-2)" }}>
      {shot.signed_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shot.signed_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "var(--muted)" }}>📷</div>
      )}
      <div style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(26,20,36,0.75)", borderRadius: 5, padding: "2px 7px", fontSize: 10, color: "#fff", fontWeight: 600 }}>
        {formatDateTime(shot.captured_at)}
      </div>
    </div>
  );
}

function DetailDrawer({ shot, member, onClose }: { shot: ApprovedShot | null; member: Member; onClose: () => void }) {
  if (!shot) return null;
  return (
    <aside style={{ width: 380, borderLeft: "1px solid var(--line)", height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", flexShrink: 0 }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar initials={initialsOf(member.full_name)} color={member.avatar_color} size={30} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{member.full_name}</p>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>{member.email}</p>
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
        <div style={{ background: "var(--surface)", borderRadius: 12, padding: "14px 16px" }}>
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

export default function MemberDetailClient({ data }: { data: MemberDetailData }) {
  const { member } = data;
  const [selectedShot, setSelectedShot] = useState<ApprovedShot | null>(null);

  // Same realtime subscription as the dashboard — keeps the live status,
  // session list, and approved-shots grid current without manual refresh.
  useDashboardRealtime(member.org_id);

  const status: "tracking" | "paused" | "idle" =
    data.activeSession?.status === "tracking" ? "tracking" :
    data.activeSession?.status === "paused"   ? "paused"   :
    "idle";

  const statusColor =
    status === "tracking" ? "var(--good)" :
    status === "paused"   ? "#9a7300"     :
    "var(--muted)";

  const kpis = [
    { label: "Hours tracked",  value: formatHours(data.totals.hours_seconds) },
    { label: "Sessions",       value: data.totals.session_count.toString() },
    { label: "Approved",       value: data.totals.approved.toString() },
    { label: "Removed",        value: data.totals.removed.toString() },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{ height: 58, borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", padding: "0 24px", gap: 16, background: "var(--bg)" }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>← Dashboard</Link>
          <div style={{ flex: 1 }} />
          <Avatar initials={initialsOf(data.me.full_name)} color={data.me.avatar_color} size={34} />
        </div>

        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px", maxWidth: 1080, width: "100%" }}>
          {/* Member header */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <Avatar initials={initialsOf(member.full_name)} color={member.avatar_color} size={56} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)" }}>{member.full_name}</h1>
                <span style={{ fontSize: 12, color: "var(--muted)", padding: "2px 8px", background: "var(--surface-2)", borderRadius: 6, fontWeight: 600 }}>
                  {member.role === "admin" ? "Admin" : "Employee"}
                </span>
                <span style={{ fontSize: 12, color: statusColor, fontWeight: 700 }}>
                  ● {status === "tracking" ? "Tracking now" : status === "paused" ? "Paused" : "Not tracking"}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{member.email}</p>
            </div>
          </div>

          {/* Date range */}
          <div style={{ marginBottom: 18 }}>
            <DateRangeControls range={data.range} basePath={`/dashboard/members/${member.id}`} />
          </div>

          {/* KPIs */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            {kpis.map((k) => (
              <div key={k.label} style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4, fontWeight: 500 }}>{k.label}</p>
                <span style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)" }}>{k.value}</span>
              </div>
            ))}
          </div>

          {/* Projects */}
          {data.projects.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>
                Projects
              </h2>
              <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
                {data.projects.map((p, i) => {
                  const widthPct = data.totals.hours_seconds > 0
                    ? Math.round((p.hours_seconds / data.totals.hours_seconds) * 100)
                    : 0;
                  return (
                    <div key={p.project} style={{ position: "relative", padding: "12px 14px", borderBottom: i < data.projects.length - 1 ? "1px solid var(--line)" : "none" }}>
                      <div style={{ position: "absolute", inset: 0, width: `${widthPct}%`, background: "rgba(91,108,255,0.06)" }} />
                      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
                        <span style={{ flex: 1, color: "var(--ink)", fontWeight: 500 }}>{p.project}</span>
                        <span style={{ color: "var(--muted)", fontSize: 12 }}>{p.session_count} session{p.session_count === 1 ? "" : "s"}</span>
                        <span style={{ color: "var(--ink)", fontWeight: 700, fontVariantNumeric: "tabular-nums", width: 80, textAlign: "right" }}>
                          {formatHours(p.hours_seconds)}
                        </span>
                        <span style={{ color: "var(--muted)", fontSize: 12, fontVariantNumeric: "tabular-nums", width: 36, textAlign: "right" }}>
                          {widthPct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Sessions */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>
              Sessions
            </h2>
            {data.sessions.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--muted)", padding: "12px 0" }}>
                No sessions in this range.
              </p>
            ) : (
              <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "150px 1fr 120px 100px", gap: 12, padding: "10px 14px", borderBottom: "1px solid var(--line)", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <span>Started</span>
                  <span>Project</span>
                  <span>Duration</span>
                  <span style={{ textAlign: "right" }}>Ended</span>
                </div>
                {data.sessions.map((s) => <SessionRow key={s.id} session={s} />)}
              </div>
            )}
          </section>

          {/* Approved screenshots */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>
              Approved screenshots ({data.approvedShots.length})
            </h2>
            {data.approvedShots.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--muted)", padding: "12px 0" }}>
                No approved screenshots in this range.
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 10 }}>
                {data.approvedShots.map((s) => (
                  <ShotThumb key={s.id} shot={s} onClick={() => setSelectedShot(s)} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <DetailDrawer shot={selectedShot} member={member} onClose={() => setSelectedShot(null)} />
    </div>
  );
}
