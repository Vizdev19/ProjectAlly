import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get("code");
  const next  = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/sign-in?error=no_user`);
  }

  // Check if this user already has a member record
  const { data: member } = await supabase
    .from("members")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    // New OAuth user — send to onboarding to create their org
    return NextResponse.redirect(`${origin}/auth/onboarding`);
  }

  // Existing user — redirect based on role
  const destination = next !== "/" ? next : member.role === "admin" ? "/dashboard" : "/app";
  return NextResponse.redirect(`${origin}${destination}`);
}
