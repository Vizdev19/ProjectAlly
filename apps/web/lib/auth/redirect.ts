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
 * Routes the user is allowed to be redirected to via the `?next=` param.
 * Anything not in this list is treated as untrusted (typo or attacker-
 * crafted) and the caller falls back to the role-based destination.
 */
const ALLOWED_NEXT_PREFIXES = [
  "/app",
  "/dashboard",
  "/auth/onboarding",
  "/invite/",
];

/**
 * Sanitize a user-supplied `next` redirect.
 * Defends against:
 *   - open redirects (protocol-relative `//evil.com`, backslash `/\evil`)
 *   - non-same-origin URLs (anything not starting with "/")
 *   - redirects to unintended routes (whitelist of known prefixes)
 */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || typeof next !== "string") return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//")) return null;
  if (next.startsWith("/\\")) return null;

  // Strip any query string / fragment before matching the path.
  const path = next.split(/[?#]/, 1)[0];
  const allowed = ALLOWED_NEXT_PREFIXES.some((p) =>
    p.endsWith("/")
      ? path.startsWith(p)              // prefix match (e.g. /invite/*)
      : path === p || path.startsWith(p + "/"),  // exact or sub-route
  );
  return allowed ? next : null;
}
