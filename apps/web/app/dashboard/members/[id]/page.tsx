import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { destinationForMember } from "@/lib/auth/redirect";
import {
  parseRange,
  loadMemberSessions,
  loadMemberReviewCounts,
  loadApprovedShotsForMember,
  totalTrackedSeconds,
  projectBreakdown,
} from "@/lib/data/dashboard";
import MemberDetailClient, { type MemberDetailData } from "./MemberDetailClient";

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/dashboard");

  const { data: me } = await supabase
    .from("members")
    .select("id, full_name, email, role, avatar_color, org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!me) redirect("/auth/onboarding");
  if (me.role !== "admin") redirect(destinationForMember(me.role));

  const { id } = await params;

  // Load the target member, scoped to the caller's org. RLS would also block
  // cross-org reads, but matching org_id explicitly here gives a clean 404
  // for "not found / not yours" instead of an empty result downstream.
  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .eq("org_id", me.org_id)
    .maybeSingle();
  if (!member) notFound();

  const { from, to } = await searchParams;
  const range = parseRange(from, to);

  const [sessions, reviewCounts, approvedShots, activeSession] = await Promise.all([
    loadMemberSessions(supabase, member.id, range, 100),
    loadMemberReviewCounts(supabase, member.id, range),
    loadApprovedShotsForMember(supabase, member.id, range, 60),
    supabase
      .from("tracking_sessions")
      .select("*")
      .eq("member_id", member.id)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .maybeSingle()
      .then(({ data }) => data),
  ]);

  const data: MemberDetailData = {
    me: { id: me.id, full_name: me.full_name, avatar_color: me.avatar_color },
    member,
    range: { from: range.from, to: range.to },
    activeSession,
    sessions,
    approvedShots,
    totals: {
      approved: reviewCounts.approved,
      removed:  reviewCounts.removed,
      hours_seconds: totalTrackedSeconds(sessions),
      session_count: sessions.length,
    },
    projects: projectBreakdown(sessions),
  };

  return <MemberDetailClient data={data} />;
}
