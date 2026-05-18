import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { destinationForMember } from "@/lib/auth/redirect";
import TeamClient from "./TeamClient";

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/dashboard/team");

  const { data: me } = await supabase
    .from("members")
    .select("id, full_name, role, org_id, avatar_color")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!me) redirect("/auth/onboarding");
  if (me.role !== "admin") redirect(destinationForMember(me.role));

  // Capture "now" once outside render-pure paths so lint stays happy and the
  // expiry filter runs at the DB level.
  const nowIso = new Date().toISOString();

  // Load members + active pending invites for this org (RLS restricts to org)
  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase
      .from("members")
      .select("id, full_name, email, role, avatar_color, created_at")
      .eq("org_id", me.org_id)
      .order("created_at", { ascending: true }),
    supabase
      .from("invites")
      .select("id, email, role, full_name, token, expires_at, accepted_at, created_at")
      .is("accepted_at", null)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false }),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <TeamClient
      me={{ full_name: me.full_name, avatar_color: me.avatar_color }}
      members={members ?? []}
      invites={invites ?? []}
      appUrl={appUrl}
      currentMemberId={me.id}
    />
  );
}
