"use client";

import { useState } from "react";
import FakeScreen from "@/components/ui/FakeScreen";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="1" width="7.5" height="7.5" fill="#F25022"/>
      <rect x="9.5" y="1" width="7.5" height="7.5" fill="#7FBA00"/>
      <rect x="1" y="9.5" width="7.5" height="7.5" fill="#00A4EF"/>
      <rect x="9.5" y="9.5" width="7.5" height="7.5" fill="#FFB900"/>
    </svg>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const score = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 || !/[^a-zA-Z0-9]/.test(password) ? 2 : 3;
  const labels = ["", "Weak", "Medium", "Strong"];
  const colors = ["", "var(--danger)", "var(--warn)", "var(--good)"];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: score >= i ? colors[score] : "var(--line-2)", transition: "background 0.2s" }} />
        ))}
      </div>
      {score > 0 && <p style={{ fontSize: 12, color: colors[score], fontWeight: 600 }}>{labels[score]} password</p>}
    </div>
  );
}

export default function SignUpPage() {
  const [password, setPassword] = useState("");
  const [pilotMode, setPilotMode] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "40px 56px", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 16, color: "var(--ink)", marginBottom: 44 }}>
          <img src="/logo.jpg" alt="" style={{ width: 26, height: 26, borderRadius: 6, objectFit: "cover" }} />
          AllyTracker
        </div>

        <div style={{ maxWidth: 440, width: "100%", margin: "0 auto" }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--ink)", marginBottom: 6, lineHeight: 1.2 }}>
            Start a <em className="font-serif" style={{ fontStyle: "italic", fontWeight: 400 }}>pilot</em> with your team
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 28 }}>14 days free. No card required. Cancel anytime.</p>

          <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
            {[
              { label: "Google", Icon: GoogleIcon },
              { label: "Microsoft", Icon: MicrosoftIcon },
            ].map(({ label, Icon }) => (
              <button key={label} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 12px", background: "#fff", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "var(--ink)", cursor: "pointer" }}>
                <Icon />
                Continue with {label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
            <span style={{ fontSize: 13, color: "var(--muted)" }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 6 }}>First name</label>
                <input type="text" placeholder="Elena" style={{ width: "100%", padding: "11px 14px", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: 15, color: "var(--ink)", background: "var(--bg)", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 6 }}>Last name</label>
                <input type="text" placeholder="Mendoza" style={{ width: "100%", padding: "11px 14px", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: 15, color: "var(--ink)", background: "var(--bg)", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 6 }}>Work email</label>
              <input type="email" placeholder="you@company.com" style={{ width: "100%", padding: "11px 14px", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: 15, color: "var(--ink)", background: "var(--bg)", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 6 }}>Password</label>
              <input type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%", padding: "11px 14px", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: 15, color: "var(--ink)", background: "var(--bg)", outline: "none", boxSizing: "border-box" }} />
              <PasswordStrength password={password} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 6 }}>Company name</label>
              <input type="text" placeholder="Northwind Inc." style={{ width: "100%", padding: "11px 14px", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: 15, color: "var(--ink)", background: "var(--bg)", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 6 }}>Team size</label>
              <select style={{ width: "100%", padding: "11px 14px", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: 15, color: "var(--ink)", background: "var(--bg)", outline: "none", boxSizing: "border-box", appearance: "none", cursor: "pointer" }}>
                <option value="">Select team size</option>
                <option value="1-10">1–10 people</option>
                <option value="11-50">11–50 people</option>
                <option value="51-200">51–200 people</option>
                <option value="201-1000">201–1,000 people</option>
                <option value="1000+">1,000+ people</option>
              </select>
            </div>

            <label style={{ display: "flex", gap: 12, padding: "14px 16px", background: "var(--surface)", border: pilotMode ? "1px solid var(--g-pink)" : "1px solid var(--line)", borderRadius: 12, cursor: "pointer", alignItems: "flex-start", transition: "border-color 0.2s" }}>
              <input type="checkbox" checked={pilotMode} onChange={e => setPilotMode(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: "var(--g-pink)", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>Run this as a team pilot</p>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>If less than 80% of your team votes to keep AllyTracker after 30 days, we delete everything. No questions asked.</p>
              </div>
            </label>
          </div>

          <button style={{ width: "100%", padding: "13px", background: "var(--brand-grad)", color: "#fff", border: "none", borderRadius: 100, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 22, marginBottom: 16 }}>
            Create your workspace →
          </button>

          <p style={{ textAlign: "center", fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>
            Already have an account?{" "}
            <a href="/sign-in" style={{ color: "var(--g-pink)", fontWeight: 600, textDecoration: "none" }}>Sign in</a>
          </p>
        </div>
      </div>

      <div style={{ width: "50%", background: "var(--surface)", borderLeft: "1px solid var(--line)", display: "flex", flexDirection: "column", padding: 52, overflowY: "auto", position: "relative" }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 36 }}>How it works</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 28, marginBottom: 48 }}>
          {[
            { n: "1", title: "Invite teammates", body: "Send a magic link to anyone on your team. They join in one click — no account setup required." },
            { n: "2", title: "Set capture cadence", body: "Choose how often screenshots are taken: every 5, 10, or 20 minutes. Employees always see the schedule." },
            { n: "3", title: "Day-30 vote", body: "After 30 days, every teammate votes. If less than 80% say keep — we delete everything, permanently." },
          ].map(step => (
            <div key={step.n} style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--brand-grad)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{step.n}</div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>{step.title}</p>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6 }}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ position: "relative", marginTop: "auto" }}>
          <div style={{ transform: "rotate(-3deg)", transformOrigin: "bottom right", background: "#1A1424", borderRadius: 16, padding: 20, boxShadow: "var(--shadow-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--g-pink)", animation: "pulse-dot 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 12, color: "rgba(240,237,246,0.5)", fontWeight: 500 }}>Pilot · Day 12 of 30</span>
            </div>
            <p style={{ fontSize: 11, color: "rgba(240,237,246,0.35)", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>Team vote so far</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <div style={{ flex: 9, height: 8, borderRadius: 4, background: "var(--brand-grad)" }} />
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.12)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#3DC9B3", fontWeight: 600 }}>Keep: 9 / 10</span>
              <span style={{ fontSize: 12, color: "rgba(240,237,246,0.35)" }}>18 days left</span>
            </div>
            <div style={{ marginTop: 14, borderRadius: 10, overflow: "hidden", aspectRatio: "16/9" }}>
              <FakeScreen kind="figma" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
