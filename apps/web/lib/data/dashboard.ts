import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Member, TrackingSession, Screenshot } from "@/lib/types/database";

type SB = SupabaseClient<Database>;

export type DateRange = {
  /** ISO timestamp at 00:00 UTC of the first day in the range (inclusive). */
  fromIso: string;
  /** ISO timestamp at 00:00 UTC of the day AFTER the last day (exclusive). */
  toIso: string;
  /** The original from/to YYYY-MM-DD strings echoed back, for the UI to pin its date picker. */
  from: string;
  to: string;
};

export type MemberStats = Member & {
  active_session: TrackingSession | null;
  approved: number;
  removed: number;
  /** Total tracked time in seconds across all sessions started in the range, excluding paused intervals. */
  hours_seconds: number;
  /**
   * ISO timestamp of the most recent tracking session this member ever started,
   * or null if they've never tracked. Independent of the date range — answers
   * "is this person actually using the product?" even when they have zero
   * activity in the selected window.
   */
  last_active_at: string | null;
};

export type ApprovedShot = Screenshot & {
  signed_url: string | null;
};

/** Start of "today" in UTC, as YYYY-MM-DD. */
function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Strict YYYY-MM-DD validator so bad query strings can't poison the date math. */
function isYmd(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/** Start of "today" in UTC, as an ISO timestamp. Used by the employee-side
 * (/app) loaders which haven't been generalized to date ranges yet. */
function startOfTodayIso(): string {
  return `${todayYmd()}T00:00:00.000Z`;
}

/**
 * Resolve the `?from=` and `?to=` URL params (both YYYY-MM-DD, inclusive) into
 * the ISO timestamps the queries need. Missing/invalid input defaults the range
 * to today.
 */
export function parseRange(from: string | undefined, to: string | undefined): DateRange {
  const safeFrom = isYmd(from) ? from : todayYmd();
  const safeTo   = isYmd(to)   ? to   : safeFrom;

  // If the user inverted them (to < from), swap.
  const [lo, hi] = safeFrom <= safeTo ? [safeFrom, safeTo] : [safeTo, safeFrom];

  // toIso is the start of the day AFTER `hi`, so range filters can use `< toIso`.
  const hiDate = new Date(`${hi}T00:00:00.000Z`);
  hiDate.setUTCDate(hiDate.getUTCDate() + 1);

  return {
    fromIso: `${lo}T00:00:00.000Z`,
    toIso:   hiDate.toISOString(),
    from:    lo,
    to:      hi,
  };
}

/**
 * Returns all members in the org, each annotated with:
 *   - active_session: their currently-open tracking session (always "now", not range-scoped)
 *   - approved / removed: screenshot counts within the date range
 *   - hours_seconds: total tracked time in the range, excluding paused intervals
 *
 * Four parallel queries stitched in JS — no joins, no N+1.
 */
export async function loadOrgRoster(
  supabase: SB,
  orgId: string,
  range: DateRange,
): Promise<MemberStats[]> {
  const [
    { data: members },
    { data: activeSessions },
    { data: rangeSessions },
    { data: shots },
    { data: lastActiveRows },
  ] = await Promise.all([
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
      .from("tracking_sessions")
      .select("member_id, status, started_at, ended_at, elapsed_seconds, paused_at, paused_total_seconds")
      .eq("org_id", orgId)
      .gte("started_at", range.fromIso)
      .lt("started_at", range.toIso),
    supabase
      .from("screenshots")
      .select("member_id, status, captured_at")
      .eq("org_id", orgId)
      .in("status", ["approved", "removed"])
      .gte("captured_at", range.fromIso)
      .lt("captured_at", range.toIso),
    // "Last active" — most recent session per member, across all time. Sorted
    // newest-first and deduped in JS. Sessions are far fewer than screenshots,
    // so a wide order-by + JS dedupe is fine until the org gets large enough
    // to warrant a stored `members.last_active_at` column updated by trigger.
    supabase
      .from("tracking_sessions")
      .select("member_id, started_at")
      .eq("org_id", orgId)
      .order("started_at", { ascending: false }),
  ]);

  if (!members) return [];

  // Build a memberId → most-recent started_at lookup once, instead of scanning
  // the sorted array for each member.
  const lastActiveByMember = new Map<string, string>();
  for (const row of lastActiveRows ?? []) {
    if (!lastActiveByMember.has(row.member_id)) {
      lastActiveByMember.set(row.member_id, row.started_at);
    }
  }

  return members.map((m) => {
    const memberSessions = (rangeSessions ?? []).filter((s) => s.member_id === m.id);
    const memberShots    = (shots ?? []).filter((s) => s.member_id === m.id);

    const hours_seconds = memberSessions.reduce((acc, s) => {
      // For ended sessions, trust the stored elapsed_seconds (already excludes pauses).
      if (s.ended_at) return acc + (s.elapsed_seconds ?? 0);

      // For in-progress sessions, derive current elapsed minus paused total
      // (plus the open pause if currently paused).
      let pausedTotal = s.paused_total_seconds ?? 0;
      if (s.status === "paused" && s.paused_at) {
        pausedTotal += Math.floor(
          (Date.now() - new Date(s.paused_at).getTime()) / 1000,
        );
      }
      const total = Math.floor(
        (Date.now() - new Date(s.started_at).getTime()) / 1000,
      );
      return acc + Math.max(0, total - pausedTotal);
    }, 0);

    return {
      ...m,
      active_session: activeSessions?.find((s) => s.member_id === m.id) ?? null,
      approved:      memberShots.filter((s) => s.status === "approved").length,
      removed:       memberShots.filter((s) => s.status === "removed").length,
      hours_seconds,
      last_active_at: lastActiveByMember.get(m.id) ?? null,
    };
  });
}

/**
 * Latest N approved screenshots for a given member within a date range, with
 * signed URLs.
 */
export async function loadApprovedShotsForMember(
  supabase: SB,
  memberId: string,
  range: DateRange,
  limit = 5,
): Promise<ApprovedShot[]> {
  const { data: shots } = await supabase
    .from("screenshots")
    .select("*")
    .eq("member_id", memberId)
    .eq("status", "approved")
    .gte("captured_at", range.fromIso)
    .lt("captured_at", range.toIso)
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

/**
 * One member's full session list within a date range, newest first. Used by
 * the per-member drill-down page.
 */
export async function loadMemberSessions(
  supabase: SB,
  memberId: string,
  range: DateRange,
  limit = 100,
): Promise<TrackingSession[]> {
  const { data } = await supabase
    .from("tracking_sessions")
    .select("*")
    .eq("member_id", memberId)
    .gte("started_at", range.fromIso)
    .lt("started_at", range.toIso)
    .order("started_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/**
 * Returns total approved + removed counts for a single member in the range.
 * Used by the per-member detail KPIs without dragging in the org-wide query.
 */
export async function loadMemberReviewCounts(
  supabase: SB,
  memberId: string,
  range: DateRange,
): Promise<{ approved: number; removed: number }> {
  const { data } = await supabase
    .from("screenshots")
    .select("status")
    .eq("member_id", memberId)
    .in("status", ["approved", "removed"])
    .gte("captured_at", range.fromIso)
    .lt("captured_at", range.toIso);
  const rows = data ?? [];
  return {
    approved: rows.filter((s) => s.status === "approved").length,
    removed:  rows.filter((s) => s.status === "removed").length,
  };
}

/**
 * Compute total tracked seconds across a session list, excluding paused
 * intervals (uses migration 004's paused_total_seconds). Mirrors the per-row
 * logic in loadOrgRoster; extracted so the detail page can reuse it.
 */
export function totalTrackedSeconds(sessions: TrackingSession[]): number {
  return sessions.reduce((acc, s) => {
    if (s.ended_at) return acc + (s.elapsed_seconds ?? 0);
    let pausedTotal = s.paused_total_seconds ?? 0;
    if (s.status === "paused" && s.paused_at) {
      pausedTotal += Math.floor((Date.now() - new Date(s.paused_at).getTime()) / 1000);
    }
    const total = Math.floor((Date.now() - new Date(s.started_at).getTime()) / 1000);
    return acc + Math.max(0, total - pausedTotal);
  }, 0);
}

export type ProjectBreakdown = {
  project: string;
  session_count: number;
  hours_seconds: number;
};

/**
 * Group a session list by `project` (null becomes "Untitled") and total the
 * tracked time per group. Sorted by hours descending so the busiest project
 * leads.
 */
export function projectBreakdown(sessions: TrackingSession[]): ProjectBreakdown[] {
  const map = new Map<string, TrackingSession[]>();
  for (const s of sessions) {
    const key = s.project?.trim() || "Untitled";
    const list = map.get(key) ?? [];
    list.push(s);
    map.set(key, list);
  }
  const out: ProjectBreakdown[] = [...map.entries()].map(([project, list]) => ({
    project,
    session_count:  list.length,
    hours_seconds:  totalTrackedSeconds(list),
  }));
  out.sort((a, b) => b.hours_seconds - a.hours_seconds);
  return out;
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
      .select("status, started_at, ended_at, elapsed_seconds, paused_at, paused_total_seconds")
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

    // In-progress: subtract paused intervals (closed + currently open).
    let pausedTotal = s.paused_total_seconds ?? 0;
    if (s.status === "paused" && s.paused_at) {
      pausedTotal += Math.floor(
        (Date.now() - new Date(s.paused_at).getTime()) / 1000,
      );
    }
    const total = Math.floor(
      (Date.now() - new Date(s.started_at).getTime()) / 1000,
    );
    return acc + Math.max(0, total - pausedTotal);
  }, 0);

  return { ...counts, seconds };
}
