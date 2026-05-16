import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url      = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Don't throw at module-load time; show a helpful error in the UI instead.
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — set them in " +
    "apps/desktop/.env.local (or as GitHub repo secrets for the release build) " +
    "before building the desktop app.",
  );
}

export const SUPABASE_URL = url ?? "";
export const SUPABASE_ANON_KEY = anonKey ?? "";

// createClient() throws on empty URL ("TypeError: Failed to construct 'URL'").
// In production builds with missing env vars, the throw fires at module-load
// time, the React app never mounts, and the user sees a completely blank
// window with no clue what's wrong. Catch it so App.tsx's "Setup incomplete"
// guard can render instead.
function safeCreateClient(): SupabaseClient {
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession:   true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  } catch (e) {
    console.error("[supabase] createClient failed — likely empty env vars:", e);
    // Return a Proxy stub: App.tsx's env-var guard runs before any consumer
    // touches this, so this is only here so the module finishes loading.
    // Any accidental use will throw with a clear message instead of a crypto
    // TypeError from inside supabase-js.
    return new Proxy({} as SupabaseClient, {
      get() {
        throw new Error(
          "Supabase client is not configured. Set VITE_SUPABASE_URL and " +
          "VITE_SUPABASE_ANON_KEY before building.",
        );
      },
    });
  }
}

export const supabase = safeCreateClient();
