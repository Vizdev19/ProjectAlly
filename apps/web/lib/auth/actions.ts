"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { destinationForMember, safeNext } from "@/lib/auth/redirect";
import { sendEmail } from "@/lib/email/resend";
import { inviteEmail } from "@/lib/email/templates/invite";

export async function signInWithEmail(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) return { error: error.message };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication failed." };

  const { data: member } = await supabase
    .from("members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const next = safeNext(formData.get("next") as string | null);
  redirect(next ?? destinationForMember(member?.role));
}

export async function signUpWithEmail(formData: FormData) {
  const supabase = await createClient();

  const email       = formData.get("email") as string;
  const password    = formData.get("password") as string;
  const fullName    = `${formData.get("first_name")} ${formData.get("last_name")}`.trim();
  const companyName = formData.get("company") as string;
  const teamSize    = formData.get("team_size") as string;
  const inviteToken = formData.get("invite_token") as string | null;

  // Server-side password policy
  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: {
        full_name: fullName,
        team_size: teamSize,
        // company_name only set when NOT joining via an invite — the auth
        // trigger uses this to decide between new-org and invite paths
        ...(inviteToken ? {} : { company_name: companyName }),
      },
    },
  });

  if (error) return { error: error.message };

  return { success: "Check your email to confirm your account." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export async function getOAuthUrl(provider: "google" | "azure") {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      scopes: provider === "azure" ? "email profile openid" : undefined,
    },
  });

  if (error) return { error: error.message };
  return { url: data.url };
}

// ── Invite actions ──────────────────────────────────────────────

export async function createInvite(formData: FormData) {
  const supabase = await createClient();
  const email    = formData.get("email") as string;
  const role     = (formData.get("role") as string) || "employee";
  const fullName = formData.get("full_name") as string | null;

  const { data, error } = await supabase.rpc("create_invite", {
    p_email:     email,
    p_role:      role,
    p_full_name: fullName || null,
  });

  if (error) return { error: error.message };
  if (!data || !data.token) return { error: "Failed to create invite." };

  // Fetch context for the email — inviter name and org name
  const { data: { user } } = await supabase.auth.getUser();
  let inviterName = "A teammate";
  let orgName     = "AllyTracker";

  if (user) {
    const { data: me } = await supabase
      .from("members")
      .select("full_name, org_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (me) {
      inviterName = me.full_name || inviterName;
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", me.org_id)
        .maybeSingle();
      if (org?.name) orgName = org.name;
    }
  }

  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const acceptUrl = `${appUrl}/invite/${data.token}`;

  const { subject, html, text } = inviteEmail({
    orgName,
    inviterName,
    role:      role === "admin" ? "admin" : "employee",
    acceptUrl,
  });

  const send = await sendEmail({
    to:      email,
    subject,
    html,
    text,
    replyTo: user?.email,
  });

  // The invite row still exists either way — the admin can copy the link from
  // the team page as a fallback if email failed.
  return { invite: data, emailSent: send.ok, emailError: send.ok ? undefined : send.error };
}

export async function revokeInvite(inviteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_invite", { p_invite_id: inviteId });
  if (error) return { error: error.message };
  return { success: true };
}

export async function acceptInvite(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error) return { error: error.message };
  // data is the created member row; redirect based on role
  const role = (data as { role?: string } | null)?.role;
  return { role, member: data };
}
