import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabase } from "./supabase";
import SignIn from "./SignIn";
import Tracker from "./Tracker";

export type Member = {
  id: string;
  org_id: string;
  email: string;
  full_name: string;
  role: "admin" | "employee";
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [member,  setMember]  = useState<Member | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const hydrate = useCallback(async () => {
    setError(null);
    const { data: { session }, error: sessErr } = await supabase.auth.getSession();
    if (sessErr) { setError(sessErr.message); setLoading(false); return; }
    if (!session) { setMember(null); setLoading(false); return; }

    const { data: m, error: mErr } = await supabase
      .from("members")
      .select("id, org_id, email, full_name, role")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (mErr) { setError(mErr.message); setLoading(false); return; }
    if (!m)   {
      setError("No member record. Finish onboarding on the web first.");
      setMember(null); setLoading(false); return;
    }

    // Hand off everything Rust needs to upload screenshots
    await invoke("register_session", {
      ctx: {
        supabase_url:  SUPABASE_URL,
        anon_key:      SUPABASE_ANON_KEY,
        access_token:  session.access_token,
        refresh_token: session.refresh_token,
        member_id:     m.id,
        org_id:        m.org_id,
        email:         m.email,
      },
    });

    setMember(m as Member);
    setLoading(false);
  }, []);

  useEffect(() => { void hydrate(); }, [hydrate]);

  // Re-sync the Rust side whenever Supabase rotates the access token
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        void invoke("clear_session").catch(() => {});
        setMember(null);
        return;
      }
      // Refresh the Rust-side context with the new tokens; we already know
      // the member from the initial hydrate.
      if (member) {
        void invoke("register_session", {
          ctx: {
            supabase_url:  SUPABASE_URL,
            anon_key:      SUPABASE_ANON_KEY,
            access_token:  session.access_token,
            refresh_token: session.refresh_token,
            member_id:     member.id,
            org_id:        member.org_id,
            email:         member.email,
          },
        }).catch(() => {});
      } else {
        // Member wasn't loaded yet — re-hydrate fully
        void hydrate();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [member, hydrate]);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return (
      <Shell>
        <h1 style={titleStyle}>Setup incomplete</h1>
        <p style={subtitleStyle}>
          The desktop build is missing Supabase credentials. Create
          <code style={codeStyle}>apps/desktop/.env.local</code> with
          <code style={codeStyle}>VITE_SUPABASE_URL</code> and
          <code style={codeStyle}>VITE_SUPABASE_ANON_KEY</code>, then rebuild.
        </p>
      </Shell>
    );
  }

  if (loading) {
    return <Shell><p style={subtitleStyle}>Connecting…</p></Shell>;
  }

  if (!member) {
    return <SignIn error={error} onSignedIn={hydrate} />;
  }

  return <Tracker member={member} onSignedOut={() => setMember(null)} />;
}

// ── Shared shell + styles ────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ maxWidth: 420, width: "100%" }}>{children}</div>
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  fontSize: 22, fontWeight: 600, color: "var(--ink)", marginBottom: 10,
};
const subtitleStyle: React.CSSProperties = {
  fontSize: 14, color: "var(--muted)", lineHeight: 1.55,
};
const codeStyle: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, monospace",
  fontSize: 12, background: "var(--surface-2)",
  padding: "2px 6px", borderRadius: 5, margin: "0 2px",
};
