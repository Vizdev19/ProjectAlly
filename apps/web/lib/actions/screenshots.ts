"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Employee approves a pending screenshot:
 *   1. copy the private file to the submitted-screenshots bucket
 *   2. update the row: status='approved', submitted_path, reviewed_at, submitted_at, note
 * Admins gain read access to the file via storage RLS on the submitted bucket.
 */
export async function approveScreenshot(screenshotId: string, note?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: shot, error: shotErr } = await supabase
    .from("screenshots")
    .select("id, member_id, org_id, private_path, status")
    .eq("id", screenshotId)
    .maybeSingle();
  if (shotErr) return { error: shotErr.message };
  if (!shot) return { error: "Screenshot not found." };
  if (shot.status !== "pending") return { error: "Already reviewed." };

  // Download the private file
  const { data: file, error: dlErr } = await supabase.storage
    .from("private-screenshots")
    .download(shot.private_path);
  if (dlErr || !file) return { error: dlErr?.message ?? "Could not read file." };

  // Upload to submitted bucket at the same logical path
  const submittedPath = shot.private_path;
  const { error: upErr } = await supabase.storage
    .from("submitted-screenshots")
    .upload(submittedPath, file, { contentType: "image/png", upsert: false });
  if (upErr) return { error: upErr.message };

  const now = new Date().toISOString();
  const { error: updErr } = await supabase
    .from("screenshots")
    .update({
      status: "approved",
      submitted_path: submittedPath,
      reviewed_at: now,
      submitted_at: now,
      note: note?.trim() || null,
    })
    .eq("id", screenshotId);
  if (updErr) return { error: updErr.message };

  revalidatePath("/app");
  return { success: true };
}

/**
 * Employee removes a pending screenshot.
 * The private file is deleted permanently — admin will never see it.
 * Row is kept (status='removed') so audit/counts work.
 */
export async function removeScreenshot(screenshotId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: shot, error: shotErr } = await supabase
    .from("screenshots")
    .select("id, private_path, status")
    .eq("id", screenshotId)
    .maybeSingle();
  if (shotErr) return { error: shotErr.message };
  if (!shot) return { error: "Screenshot not found." };
  if (shot.status !== "pending") return { error: "Already reviewed." };

  // Delete the actual file (no recovery)
  const { error: rmErr } = await supabase.storage
    .from("private-screenshots")
    .remove([shot.private_path]);
  // A 404 from storage means the file is already gone — that's fine, we
  // still want to mark the row removed. Anything else (auth, network,
  // permission) is a real failure and should surface to the user.
  const rmStatus = (rmErr as { statusCode?: string | number } | null)?.statusCode;
  if (rmErr && String(rmStatus) !== "404") {
    return { error: rmErr.message };
  }

  const { error: updErr } = await supabase
    .from("screenshots")
    .update({
      status: "removed",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", screenshotId);
  if (updErr) return { error: updErr.message };

  revalidatePath("/app");
  return { success: true };
}

/**
 * Approve all currently-pending screenshots for the calling employee.
 * Sequential to keep it simple and respect Storage rate limits.
 */
export async function approveAllPending() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: shots, error } = await supabase
    .from("screenshots")
    .select("id")
    .eq("status", "pending");
  if (error) return { error: error.message };
  if (!shots || shots.length === 0) return { success: true, count: 0 };

  let approved = 0;
  const failures: { id: string; error: string }[] = [];
  for (const s of shots) {
    const r = await approveScreenshot(s.id);
    if (r.error) {
      failures.push({ id: s.id, error: r.error });
    } else {
      approved++;
    }
  }

  revalidatePath("/app");
  return { success: true, count: approved, failures };
}
