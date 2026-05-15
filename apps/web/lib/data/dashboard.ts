import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Member, TrackingSession, Screenshot } from "@/lib/types/database";

type SB = SupabaseClient<Database>;

export type MemberStats = Member & {
  active_session: TrackingSession | null;
  today_approved: number;
  today_removed: number;
};

export type ApprovedShot = Screenshot & {
  signed_url: string | null;
};

/** Start of "today" in ISO 8601 (server-side date, UTC). */
function startOfTodayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Returns all members in the org, each annotated with their active tracking
 * session (if any) and today's approved/removed counts.
 * Three parallel queries stitched in JS — no joins, no N+1.
 */
export async function loadOrgRoster(supabase: SB, orgId: string): Promise<MemberStats[]> {
  const todayIso = startOfTodayIso();

  const [{ data: members }, { data: sessions }, { data: shots }] = await Promise.all([
    supabase
      .from("members")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true }),
    supabase
      .from("tracking_sessions")
      .select("*")
      .eq("org_id", orgId)
      .is("ended_at", null),
    supabase
      .from("screenshots")
      .select("member_id, status, captured_at")
      .eq("org_id", orgId)
      .in("status", ["approved", "removed"])
      .gte("captured_at", todayIso),
  ]);

  if (!members) return [];

  return members.map((m) => {
    const session =
      sessions?.find((s) => s.member_id === m.id) ?? null;
    const todayShots = (shots ?? []).filter((s) => s.member_id === m.id);
    return {
      ...m,
      active_session: session,
      today_approved: todayShots.filter((s) => s.status === "approved").length,
      today_removed: todayShots.filter((s) => s.status === "removed").length,
    };
  });
}

/**
 * Latest N approved screenshots for a given member, with signed URLs.
 * Returns an empty array if there are none (which is currently always true
 * until the desktop upload pipeline lands).
 */
export async function loadApprovedShotsForMember(
  supabase: SB,
  memberId: string,
  limit = 5,
): Promise<ApprovedShot[]> {
  const todayIso = startOfTodayIso();

  const { data: shots } = await supabase
    .from("screenshots")
    .select("*")
    .eq("member_id", memberId)
    .eq("status", "approved")
    .gte("captured_at", todayIso)
    .order("captured_at", { ascending: false })
    .limit(limit);

  if (!shots || shots.length === 0) return [];

  // Batch-sign URLs (one call per file is fine at this scale)
  const signed = await Promise.all(
    shots.map(async (s) => {
      if (!s.submitted_path) return { ...s, signed_url: null };
      const { data } = await supabase.storage
        .from("submitted-screenshots")
        .createSignedUrl(s.submitted_path, 60 * 30); // 30 min
      return { ...s, signed_url: data?.signedUrl ?? null };
    }),
  );

  return signed;
}

/** Active (non-ended) sessions for the org, joined with member info. */
export async function loadActiveSessions(supabase: SB, orgId: string) {
  const { data } = await supabase
    .from("tracking_sessions")
    .select("*")
    .eq("org_id", orgId)
    .is("ended_at", null)
    .order("started_at", { ascending: false });
  return data ?? [];
}

// ─── Employee app ─────────────────────────────────────────────────

export type EmployeeShot = Screenshot & { signed_url: string | null };

/** Current employee's active session (if any). */
export async function loadMyActiveSession(supabase: SB, memberId: string) {
  const { data } = await supabase
    .from("tracking_sessions")
    .select("*")
    .eq("member_id", memberId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .maybeSingle();
  return data;
}

/** Pending screenshots for the employee — private bucket, with signed URLs. */
export async function loadMyPendingShots(supabase: SB, memberId: string): Promise<EmployeeShot[]> {
  const { data: shots } = await supabase
    .from("screenshots")
    .select("*")
    .eq("member_id", memberId)
    .eq("status", "pending")
    .order("captured_at", { ascending: true });

  if (!shots || shots.length === 0) return [];

  const signed = await Promise.all(
    shots.map(async (s) => {
      const { data } = await supabase.storage
        .from("private-screenshots")
        .createSignedUrl(s.private_path, 60 * 30);
      return { ...s, signed_url: data?.signedUrl ?? null };
    }),
  );

  return signed;
}

/** Today's approved screenshots for the employee. */
export async function loadMyApprovedShotsToday(
  supabase: SB,
  memberId: string,
): Promise<EmployeeShot[]> {
  const todayIso = startOfTodayIso();
  const { data: shots } = await supabase
    .from("screenshots")
    .select("*")
    .eq("member_id", memberId)
    .eq("status", "approved")
    .gte("captured_at", todayIso)
    .order("captured_at", { ascending: false });

  if (!shots || shots.length === 0) return [];

  const signed = await Promise.all(
    shots.map(async (s) => {
      if (!s.submitted_path) return { ...s, signed_url: null };
      const { data } = await supabase.storage
        .from("submitted-screenshots")
        .createSignedUrl(s.submitted_path, 60 * 30);
      return { ...s, signed_url: data?.signedUrl ?? null };
    }),
  );

  return signed;
}

/** Today's stats for the employee. */
export async function loadMyTodayStats(supabase: SB, memberId: string) {
  const todayIso = startOfTodayIso();

  const [{ data: shots }, { data: sessions }] = await Promise.all([
    supabase
      .from("screenshots")
      .select("status")
      .eq("member_id", memberId)
      .gte("captured_at", todayIso),
    supabase
      .from("tracking_sessions")
      .select("elapsed_seconds, started_at, ended_at")
      .eq("member_id", memberId)
      .gte("started_at", todayIso),
  ]);

  const counts = {
    pending:  (shots ?? []).filter((s) => s.status === "pending").length,
    approved: (shots ?? []).filter((s) => s.status === "approved").length,
    removed:  (shots ?? []).filter((s) => s.status === "removed").length,
  };

  const seconds = (sessions ?? []).reduce((acc, s) => {
    if (s.ended_at) return acc + (s.elapsed_seconds ?? 0);
    // For an in-progress session, estimate from started_at
    const elapsed = Math.floor(
      (Date.now() - new Date(s.started_at).getTime()) / 1000,
    );
    return acc + elapsed;
  }, 0);

  return { ...counts, seconds };
}
