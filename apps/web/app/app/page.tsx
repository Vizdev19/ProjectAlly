import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loadMyActiveSession,
  loadMyPendingShots,
  loadMyApprovedShotsToday,
  loadMyTodayStats,
} from "@/lib/data/dashboard";
import EmployeeAppClient, { type EmployeeAppData } from "./EmployeeAppClient";

export default async function EmployeeAppPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/app");

  const { data: me } = await supabase
    .from("members")
    .select("id, full_name, email, role, avatar_color, org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!me) redirect("/auth/onboarding");

  const [activeSession, pending, approved, stats] = await Promise.all([
    loadMyActiveSession(supabase, me.id),
    loadMyPendingShots(supabase, me.id),
    loadMyApprovedShotsToday(supabase, me.id),
    loadMyTodayStats(supabase, me.id),
  ]);

  const data: EmployeeAppData = {
    me: {
      id:           me.id,
      full_name:    me.full_name,
      email:        me.email,
      avatar_color: me.avatar_color,
    },
    activeSession,
    pending,
    approved,
    stats,
  };

  return <EmployeeAppClient data={data} />;
}
