"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Start a new tracking session for the current employee. */
export async function startSession(project?: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: me, error: meErr } = await supabase
    .from("members")
    .select("id, org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (meErr) return { error: meErr.message };
  if (!me) return { error: "No member record." };

  // Close any existing active session (defensive)
  await supabase
    .from("tracking_sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("member_id", me.id)
    .is("ended_at", null);

  const { data: session, error } = await supabase
    .from("tracking_sessions")
    .insert({
      org_id:    me.org_id,
      member_id: me.id,
      project:   project?.trim() || null,
      status:    "tracking",
      started_at: new Date().toISOString(),
      paused_at: null,
      ended_at:  null,
      elapsed_seconds: 0,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/app");
  return { session };
}

/** Pause the active tracking session. */
export async function pauseSession(sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tracking_sessions")
    .update({ status: "paused", paused_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("status", "tracking");
  if (error) return { error: error.message };
  revalidatePath("/app");
  return { success: true };
}

/** Resume a paused tracking session. */
export async function resumeSession(sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tracking_sessions")
    .update({ status: "tracking", paused_at: null })
    .eq("id", sessionId)
    .eq("status", "paused");
  if (error) return { error: error.message };
  revalidatePath("/app");
  return { success: true };
}

/** End the tracking session and record elapsed_seconds. */
export async function endSession(sessionId: string) {
  const supabase = await createClient();

  const { data: session, error: getErr } = await supabase
    .from("tracking_sessions")
    .select("started_at, elapsed_seconds, status")
    .eq("id", sessionId)
    .maybeSingle();
  if (getErr) return { error: getErr.message };
  if (!session) return { error: "Session not found." };
  if (session.status === "ended") return { success: true };

  const elapsed =
    Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);

  const { error } = await supabase
    .from("tracking_sessions")
    .update({
      status: "ended",
      ended_at: new Date().toISOString(),
      elapsed_seconds: elapsed,
    })
    .eq("id", sessionId);
  if (error) return { error: error.message };
  revalidatePath("/app");
  return { success: true };
}
