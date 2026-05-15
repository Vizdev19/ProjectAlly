import { createClient } from "@supabase/supabase-js";

const url      = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Don't throw at module-load time; show a helpful error in the UI instead.
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — set them in " +
    "apps/desktop/.env.local before building the desktop app.",
  );
}

export const SUPABASE_URL = url ?? "";
export const SUPABASE_ANON_KEY = anonKey ?? "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession:   true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
