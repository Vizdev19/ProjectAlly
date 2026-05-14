"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    .single();

  redirect(member?.role === "admin" ? "/dashboard" : "/app");
}

export async function signUpWithEmail(formData: FormData) {
  const supabase = await createClient();

  const email       = formData.get("email") as string;
  const password    = formData.get("password") as string;
  const fullName    = `${formData.get("first_name")} ${formData.get("last_name")}`.trim();
  const companyName = formData.get("company") as string;
  const teamSize    = formData.get("team_size") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: {
        full_name:    fullName,
        company_name: companyName,
        team_size:    teamSize,
        // new sign-ups are always org admins
        role: "admin",
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
