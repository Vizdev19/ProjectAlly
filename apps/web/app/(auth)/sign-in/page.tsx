"use client";

import { useState } from "react";
import Avatar from "@/components/ui/Avatar";

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

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/>
      <circle cx="8" cy="8" r="2"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 2l12 12M6.5 6.6A2 2 0 0010 10.5M4.3 4.4C2.7 5.5 1 8 1 8s2.5 5 7 5c1.4 0 2.7-.4 3.7-1M7 3.1c.3-.1.7-.1 1-.1 4.5 0 7 5 7 5s-.5 1-1.5 2"/>
    </svg>
  );
}

export default function SignInPage() {
  const [showPass, setShowPass] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "40px 56px", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 16, color: "var(--ink)", marginBottom: 52 }}>
          <img src="/logo.jpg" alt="" style={{ width: 26, height: 26, borderRadius: 6, objectFit: "cover" }} />
          AllyTracker
        </div>

        <div style={{ maxWidth: 380, width: "100%", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", marginBottom: 6, lineHeight: 1.2 }}>
            Welcome <em className="font-serif" style={{ fontStyle: "italic", fontWeight: 400 }}>back</em>
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 32 }}>Sign in to your AllyTracker workspace.</p>

          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            {[
              { label: "Continue with Google", Icon: GoogleIcon },
              { label: "Continue with Microsoft", Icon: MicrosoftIcon },
            ].map(({ label, Icon }) => (
              <button key={label} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 12px", background: "#fff", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "var(--ink)", cursor: "pointer" }}>
                <Icon />
                {label.split(" ")[2]}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
            <span style={{ fontSize: 13, color: "var(--muted)" }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 6 }}>Work email</label>
              <input type="email" placeholder="you@company.com" style={{ width: "100%", padding: "11px 14px", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: 15, color: "var(--ink)", background: "var(--bg)", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} placeholder="••••••••" style={{ width: "100%", padding: "11px 40px 11px 14px", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: 15, color: "var(--ink)", background: "var(--bg)", outline: "none", boxSizing: "border-box" }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center" }}>
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--ink-2)", cursor: "pointer" }}>
              <input type="checkbox" checked={keepSignedIn} onChange={e => setKeepSignedIn(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--g-pink)" }} />
              Keep me signed in
            </label>
            <a href="#" style={{ fontSize: 14, color: "var(--g-blue)", textDecoration: "none", fontWeight: 500 }}>Sign in with SSO →</a>
          </div>

          <button style={{ width: "100%", padding: "13px", background: "var(--brand-grad)", color: "#fff", border: "none", borderRadius: 100, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 20 }}>
            Sign in to AllyTracker
          </button>

          <p style={{ textAlign: "center", fontSize: 14, color: "var(--muted)" }}>
            Don't have an account?{" "}
            <a href="/sign-up" style={{ color: "var(--g-pink)", fontWeight: 600, textDecoration: "none" }}>Start a 14-day trial →</a>
          </p>
        </div>
      </div>

      <div style={{ width: "50%", background: "#1A1424", position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 52, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", left: "15%", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(178,84,232,0.35) 0%, rgba(91,108,255,0.2) 50%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "10%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,74,142,0.25) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,237,246,0.4)", marginBottom: 28 }}>What teams are saying</p>
          <blockquote className="font-serif" style={{ fontSize: 26, lineHeight: 1.5, color: "#F0EDF6", fontStyle: "italic", marginBottom: 40 }}>
            "AllyTracker is the first monitoring tool our employees actually asked us to keep."
          </blockquote>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 40 }}>
            <Avatar initials="ML" color="#FF8A4C" size={44} ring="rgba(255,138,76,0.4)" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#F0EDF6" }}>Maya Lindqvist</p>
              <p style={{ fontSize: 13, color: "rgba(240,237,246,0.5)" }}>VP People Ops · Northwind</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 28, borderTop: "1px solid rgba(240,237,246,0.1)" }}>
            <div style={{ display: "flex" }}>
              {["#FF8A4C", "#FF4A8E", "#B254E8", "#5B6CFF"].map((c, i) => (
                <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: "2px solid #1A1424", marginLeft: i === 0 ? 0 : -8 }} />
              ))}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,246,0.8)" }}>+34k teammates</p>
              <p style={{ fontSize: 12, color: "rgba(240,237,246,0.4)" }}>4.8/5 employee CSAT</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
