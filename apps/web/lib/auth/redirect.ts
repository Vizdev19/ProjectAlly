import type { Role } from "@/lib/types/database";

/**
 * Where to send an authenticated user based on whether they have a member row.
 *   - no member → /auth/onboarding (must create or join an org first)
 *   - admin     → /dashboard
 *   - employee  → /app
 */
export function destinationForMember(role: Role | null | undefined): string {
  if (!role) return "/auth/onboarding";
  return role === "admin" ? "/dashboard" : "/app";
}

/**
 * Sanitize a user-supplied `next` redirect to avoid open-redirect attacks.
 * Only same-origin paths are allowed — must start with "/" and not "//"
 * (which is a protocol-relative URL).
 */
export function safeNext(next: string | null | undefined): string | null {
  if (!next) return null;
  if (typeof next !== "string") return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//")) return null;
  if (next.startsWith("/\\")) return null;
  return next;
}
