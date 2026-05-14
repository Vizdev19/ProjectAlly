"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { signUpWithEmail, getOAuthUrl } from "@/lib/auth/actions";

type Strength = "empty" | "weak" | "medium" | "strong";

function passwordStrength(pw: string): Strength {
  if (!pw) return "empty";
  if (pw.length < 8) return "weak";
  const checks = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length;
  return checks >= 2 ? "strong" : "medium";
}

const strengthLabel: Record<Strength, string> = {
  empty: "", weak: "Too short", medium: "Could be stronger", strong: "Strong — nicely done",
};
const strengthColor: Record<Strength, string> = {
  empty: "var(--line-2)", weak: "#C41C3C", medium: "#F4B740", strong: "#0B7B3A",
};

export default function SignUpPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pilotMode, setPilotMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [oauthLoading, setOauthLoading] = useState<"google" | "azure" | null>(null);

  const strength = passwordStrength(password);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signUpWithEmail(fd);
      if (result?.error) setError(result.error);
      if (result?.success) setSuccess(result.success);
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
      {/* ── Left: form ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "48px 40px", background: "var(--bg)", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 36, textDecoration: "none" }}>
            <Image src="/logo.jpg" alt="AllyTracker" width={30} height={30} style={{ borderRadius: 6 }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>AllyTracker</span>
          </Link>

          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 6 }}>
            Start a <em className="font-serif" style={{ fontStyle: "italic" }}>pilot</em> with your team
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 24 }}>14-day free trial · no credit card needed</p>

          {error && (
            <div style={{ marginBottom: 18, padding: "12px 14px", borderRadius: 10, background: "var(--danger-bg)", border: "1px solid rgba(196,28,60,0.2)", fontSize: 13.5, color: "var(--danger)" }}>{error}</div>
          )}
          {success && (
            <div style={{ marginBottom: 18, padding: "12px 14px", borderRadius: 10, background: "var(--good-bg)", border: "1px solid rgba(11,123,58,0.2)", fontSize: 13.5, color: "var(--good)" }}>{success}</div>
          )}

          {/* SSO */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
            <SSOButton onClick={() => handleOAuth("google")} loading={oauthLoading === "google"} icon={<GoogleIcon />} label="Google" />
            <SSOButton onClick={() => handleOAuth("azure")} loading={oauthLoading === "azure"} icon={<MicrosoftIcon />} label="Microsoft" />
          </div>

          <Divider />

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Name row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="First name">
                <input name="first_name" type="text" required autoComplete="given-name" placeholder="Elena" style={inputStyle} />
              </Field>
              <Field label="Last name">
                <input name="last_name" type="text" required autoComplete="family-name" placeholder="Mendoza" style={inputStyle} />
              </Field>
            </div>

            <Field label="Work email">
              <input name="email" type="email" required autoComplete="email" placeholder="you@company.com" style={inputStyle} />
              <span style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>We&apos;ll use it for your workspace URL</span>
            </Field>

            <Field label="Password">
              <div style={{ position: "relative" }}>
                <input name="password" type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" placeholder="Min 8 characters" style={{ ...inputStyle, paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {/* Strength bar */}
              {password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                    {(["weak","medium","strong"] as Strength[]).map((level, i) => (
                      <div key={level} style={{ flex: 1, height: 3, borderRadius: 99, background: i < (["weak","medium","strong"].indexOf(strength) + 1) && strength !== "empty" ? strengthColor[strength] : "var(--line-2)", transition: "background .25s" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11.5, color: strengthColor[strength] }}>{strengthLabel[strength]}</span>
                </div>
              )}
            </Field>

            <Field label="Company name">
              <input name="company" type="text" required autoComplete="organization" placeholder="Northwind Inc." style={inputStyle} />
            </Field>

            <Field label="Team size">
              <select name="team_size" required style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                <option value="">Select team size…</option>
                <option value="1-10">1–10 people</option>
                <option value="11-50">11–50 people</option>
                <option value="51-200">51–200 people</option>
                <option value="201-1000">201–1,000 people</option>
                <option value="1000+">1,000+ people</option>
              </select>
            </Field>

            {/* Pilot card */}
            <label style={{ display: "flex", gap: 12, padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${pilotMode ? "var(--g-magenta)" : "var(--line)"}`, background: pilotMode ? "rgba(178,84,232,0.05)" : "var(--surface)", cursor: "pointer", transition: "border-color .15s, background .15s" }}>
              <input type="checkbox" name="pilot_mode" checked={pilotMode} onChange={e => setPilotMode(e.target.checked)} style={{ marginTop: 2, accentColor: "var(--g-magenta)", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>
                  Run this as a <em className="font-serif" style={{ fontStyle: "italic" }}>team pilot</em>
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 3, lineHeight: 1.5 }}>
                  If less than 80% of your team votes to keep AllyTracker on day 30, we delete everything and refund the seats.
                </div>
              </div>
            </label>

            <button type="submit" disabled={isPending} style={gradBtnStyle}>
              {isPending ? "Creating workspace…" : "Create your workspace →"}
            </button>
          </form>

          <p style={{ marginTop: 20, textAlign: "center", fontSize: 13.5, color: "var(--muted)" }}>
            Already have an account?{" "}
            <Link href="/sign-in" style={{ color: "var(--ink)", fontWeight: 500, textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>
      </div>

      {/* ── Right: light value panel ── */}
      <div style={{ width: 440, flexShrink: 0, background: "var(--surface)", display: "flex", flexDirection: "column", justifyContent: "center", padding: 48, position: "relative", overflow: "hidden", borderLeft: "1px solid var(--line)" }}>
        {/* Soft radial gradients */}
        <div style={{ position: "absolute", top: -80, left: -80, width: 320, height: 320, background: "radial-gradient(circle, rgba(255,138,76,0.12), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, right: -80, width: 320, height: 320, background: "radial-gradient(circle, rgba(91,108,255,0.10), transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative" }}>
          <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 28 }}>How it works</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 28, marginBottom: 40 }}>
            {[
              { n: "01", title: "Invite your teammates", body: "Send invites from your dashboard. Each person gets their own privacy-first account." },
              { n: "02", title: "Set the capture cadence", body: "Pick how often screenshots are taken — default is every 10 minutes. Your team can always pause." },
              { n: "03", title: "Day-30 vote", body: "Every teammate gets a say. If the team isn't on board, we refund and delete everything." },
            ].map(step => (
              <div key={step.n} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--brand-grad)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{step.n}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3, lineHeight: 1.5 }}>{step.body}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tilted dashboard preview card */}
          <div style={{ transform: "rotate(-3deg)", background: "#1A1424", borderRadius: 14, padding: 16, boxShadow: "0 16px 40px rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--brand-grad)" }} />
              <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>AllyTracker</span>
              <span style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: 99, background: "rgba(255,74,142,0.2)", color: "#FF4A8E", fontSize: 10, fontWeight: 600 }}>● Live</span>
            </div>
            {["Elena · Tracking · 3h 17m", "Jordan · Tracking · 4h 02m", "Tomás · Paused"].map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: ["#FF8A4C","#FF4A8E","#B254E8"][i], fontSize: 8, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>{["EM","JR","TK"][i]}</div>
                <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.7)" }}>{row}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SSOButton({ onClick, loading, icon, label }: { onClick: () => void; loading: boolean; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "var(--bg)", border: "1px solid var(--line)", fontSize: 14, fontWeight: 500, color: "var(--ink)", cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}>
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
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
      <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
      <span style={{ fontSize: 12, color: "var(--muted)" }}>or continue with email</span>
      <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
    </div>
  );
}

function Spinner() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 0.8s linear infinite" }}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>;
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--bg)", fontSize: 14, color: "var(--ink)", outline: "none" };
const gradBtnStyle: React.CSSProperties = { padding: "13px", borderRadius: 12, background: "var(--brand-grad)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", border: "none", marginTop: 4, boxShadow: "0 6px 20px -4px rgba(178,84,232,0.4)" };

function Eye() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EyeOff() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }
function GoogleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>; }
function MicrosoftIcon() { return <svg width="16" height="16" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>; }
