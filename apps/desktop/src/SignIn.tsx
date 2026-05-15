import { useState } from "react";
import { supabase } from "./supabase";

export default function SignIn({
  error,
  onSignedIn,
}: {
  error: string | null;
  onSignedIn: () => void;
}) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState<string | null>(error);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    onSignedIn();
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--brand-grad)", margin: "0 auto 14px" }} />
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
            Sign in to AllyTracker
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Use the email + password you registered with on the web.
          </p>
        </div>

        {err && (
          <div style={errStyle}>{err}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Email">
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="you@company.com"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              placeholder="••••••••"
            />
          </Field>
          <button type="submit" disabled={busy} style={primaryBtnStyle}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={{ marginTop: 22, fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
          Don&apos;t have an account yet? Sign up on the web first.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-2)" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1px solid var(--line-2)", background: "var(--bg)",
  fontSize: 14, color: "var(--ink)", outline: "none",
};
const primaryBtnStyle: React.CSSProperties = {
  padding: "13px", borderRadius: 12, background: "var(--brand-grad)",
  color: "#fff", fontSize: 15, fontWeight: 600, border: "none",
  cursor: "pointer", marginTop: 6,
};
const errStyle: React.CSSProperties = {
  marginBottom: 16, padding: "10px 14px", borderRadius: 10,
  background: "rgba(196,28,60,0.08)", border: "1px solid rgba(196,28,60,0.2)",
  fontSize: 13, color: "var(--danger)",
};
