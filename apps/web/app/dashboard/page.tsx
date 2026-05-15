import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { destinationForMember } from "@/lib/auth/redirect";
import {
  loadOrgRoster,
  loadApprovedShotsForMember,
  type MemberStats,
  type ApprovedShot,
} from "@/lib/data/dashboard";
import DashboardClient, { type DashboardData } from "./DashboardClient";

export default async function DashboardPage() {
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

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, plan")
    .eq("id", me.org_id)
    .maybeSingle();

  const roster: MemberStats[] = await loadOrgRoster(supabase, me.org_id);

  // For each member, pull today's approved screenshots (with signed URLs).
  // Until the desktop upload pipeline lands these will all be empty.
  const shotsByMember: Record<string, ApprovedShot[]> = {};
  await Promise.all(
    roster.map(async (m) => {
      shotsByMember[m.id] = await loadApprovedShotsForMember(supabase, m.id, 5);
    }),
  );

  // KPI aggregates across the org for today
  const totals = roster.reduce(
    (acc, m) => {
      acc.approved += m.today_approved;
      acc.removed  += m.today_removed;
      if (m.active_session?.status === "tracking") acc.tracking++;
      return acc;
    },
    { approved: 0, removed: 0, tracking: 0 },
  );

  const data: DashboardData = {
    me: { id: me.id, full_name: me.full_name, avatar_color: me.avatar_color },
    org: org ?? { id: me.org_id, name: "Workspace", slug: "", plan: "team" },
    roster,
    shotsByMember,
    totals,
  };

  return <DashboardClient data={data} />;
}
