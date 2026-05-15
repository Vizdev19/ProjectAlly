import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";
import { destinationForMember } from "@/lib/auth/redirect";

const AUTH_REQUIRED = ["/dashboard", "/app", "/auth/onboarding"];
const ADMIN_ONLY    = ["/dashboard"];
const AUTH_PAGES    = ["/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — keeps it alive on every request
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const isAuthRequired = AUTH_REQUIRED.some((p) => pathname.startsWith(p));
  const isAdminOnly    = ADMIN_ONLY.some((p) => pathname.startsWith(p));
  const isAuthPage     = AUTH_PAGES.some((p) => pathname.startsWith(p));
  const isInvitePage   = pathname.startsWith("/invite/");

  // Unauthenticated user hitting a protected route → sign in
  if (isAuthRequired && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // For everything else we need the member row to route correctly.
  // Skip the DB lookup for unauthenticated requests to public routes.
  if (!user || (!isAuthRequired && !isAuthPage)) {
    return response;
  }

  const { data: member } = await supabase
    .from("members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  // Authenticated user with no member row → must finish onboarding
  // (unless they're already on onboarding or accepting an invite)
  if (!member && !pathname.startsWith("/auth/onboarding") && !isInvitePage) {
    return NextResponse.redirect(new URL("/auth/onboarding", request.url));
  }

  // Employee trying to access an admin-only route → bounce to /app
  if (isAdminOnly && member && member.role !== "admin") {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  // Authenticated user on sign-in/sign-up → send them to their app
  if (isAuthPage && member) {
    return NextResponse.redirect(new URL(destinationForMember(member.role), request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
