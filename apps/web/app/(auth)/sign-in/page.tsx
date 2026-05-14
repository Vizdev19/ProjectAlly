"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInWithEmail, getOAuthUrl } from "@/lib/auth/actions";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const urlError = searchParams.get("error");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(urlError);
  const [isPending, startTransition] = useTransition();
  const [oauthLoading, setOauthLoading] = useState<"google" | "azure" | null>(null);

  async function handleEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (next) fd.set("next", next);
    startTransition(async () => {
      const result = await signInWithEmail(fd);
      if (result?.error) setError(result.error);
    });
  }

  async function handleOAuth(provider: "google" | "azure") {
    setOauthLoading(provider);
    setError(null);
    const result = await getOAuthUrl(provider);
    if (result.error) { setError(result.error); setOauthLoading(null); return; }
    window.location.href = result.url!;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "48px 40px", background: "var(--bg)" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 40, textDecoration: "none" }}>
            <Image src="/logo.jpg" alt="AllyTracker" width={30} height={30} style={{ borderRadius: 6 }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>AllyTracker</span>
          </Link>

          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 6 }}>
            Welcome <span className="font-serif" style={{ fontStyle: "italic" }}>back</span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>Sign in to your workspace</p>

          {error && (
            <div style={{ marginBottom: 20, padding: "12px 14px", borderRadius: 10, background: "var(--danger-bg)", border: "1px solid rgba(196,28,60,0.2)", fontSize: 13.5, color: "var(--danger)" }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            <SSOButton onClick={() => handleOAuth("google")} loading={oauthLoading === "google"} icon={<GoogleIcon />} label="Google" />
            <SSOButton onClick={() => handleOAuth("azure")} loading={oauthLoading === "azure"} icon={<MicrosoftIcon />} label="Microsoft" />
          </div>

          <Divider />

          <form onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Work email">
              <input name="email" type="email" required autoComplete="email" placeholder="you@company.com" style={inputStyle} />
            </Field>
            <Field label="Password">
              <div style={{ position: "relative" }}>
                <input name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" placeholder="••••••••" style={{ ...inputStyle, paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </Field>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--ink-2)", cursor: "pointer" }}>
                <input type="checkbox" name="remember" style={{ accentColor: "var(--g-magenta)" }} />
                Keep me signed in
              </label>
              <a href="#" style={{ fontSize: 13, color: "var(--g-magenta)", textDecoration: "none" }}>Sign in with SSO →</a>
            </div>
            <button type="submit" disabled={isPending} style={gradBtnStyle}>
              {isPending ? "Signing in…" : "Sign in to AllyTracker"}
            </button>
          </form>

          <p style={{ marginTop: 24, textAlign: "center", fontSize: 13.5, color: "var(--muted)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" style={{ color: "var(--ink)", fontWeight: 500, textDecoration: "none" }}>Start a 14-day trial →</Link>
          </p>
        </div>
      </div>

      <div style={{ width: 480, flexShrink: 0, background: "#1A1424", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 48, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, background: "var(--brand-grad)", filter: "blur(130px)", opacity: 0.3, pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 52, lineHeight: 0.6, fontFamily: "Instrument Serif, serif", color: "var(--g-pink)", marginBottom: 16 }}>&ldquo;</div>
          <p style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.35, letterSpacing: "-0.01em", marginBottom: 28 }}>
            Our engineering team voted to <em style={{ fontFamily: "Instrument Serif, serif" }}>keep</em> AllyTracker after the trial — the first time-tracker where screenshots feel like notes to self.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--g-magenta)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>ML</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Maya Lindqvist</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>VP People Ops · Northwind (480 employees)</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.7 }}>
            {(["EM","JR","TK","SA","LW"] as const).map((initials, idx) => (
              <div key={initials} style={{ width: 28, height: 28, borderRadius: "50%", background: ["#FF8A4C","#FF4A8E","#B254E8","#5B6CFF","#3DC9B3"][idx], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, color: "#fff", marginLeft: idx > 0 ? -8 : 0, border: "2px solid #1A1424" }}>{initials}</div>
            ))}
            <span style={{ fontSize: 12 }}>+34k teammates</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SSOButton({ onClick, loading, icon, label }: { onClick: () => void; loading: boolean; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--line)", fontSize: 14, fontWeight: 500, color: "var(--ink)", cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}>
      {loading ? <Spinner /> : icon}
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)" }}>{label}</label>
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
      <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
      <span style={{ fontSize: 12, color: "var(--muted)" }}>or continue with email</span>
      <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
    </div>
  );
}

function Spinner() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 0.8s linear infinite" }}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>;
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--surface)", fontSize: 14, color: "var(--ink)", outline: "none" };
const gradBtnStyle: React.CSSProperties = { padding: "13px", borderRadius: 12, background: "var(--brand-grad)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", border: "none", marginTop: 4, boxShadow: "0 6px 20px -4px rgba(178,84,232,0.4)" };

function Eye() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EyeOff() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }
function GoogleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>; }
function MicrosoftIcon() { return <svg width="16" height="16" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>; }
