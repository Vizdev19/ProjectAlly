import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { destinationForMember, safeNext } from "@/lib/auth/redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(error.message)}`,
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/sign-in?error=no_user`);
  }

  const { data: member } = await supabase
    .from("members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  // No member row → either onboarding (will create a new org) or accept an
  // outstanding invite. handle_new_user has already accepted any invite that
  // matched at signup, so falling through to onboarding is the right default.
  const destination = next ?? destinationForMember(member?.role);
  return NextResponse.redirect(`${origin}${destination}`);
}
