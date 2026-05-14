"use client";

import { useState, useEffect } from "react";
import FakeScreen from "@/components/ui/FakeScreen";
import Avatar from "@/components/ui/Avatar";

function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(12px)",
      borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent",
      transition: "border-color 0.2s",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>
          <img src="/logo.jpg" alt="AllyTracker" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} />
          <span>AllyTracker</span>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center", flex: 1, marginLeft: 16 }}>
          {["Product", "Features", "Pricing", "Changelog"].map(l => (
            <a key={l} href="#" style={{ padding: "6px 12px", color: "var(--ink-2)", fontSize: 14, fontWeight: 500, textDecoration: "none", borderRadius: 8 }}>{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a href="/sign-in" style={{ padding: "8px 16px", fontSize: 14, fontWeight: 500, color: "var(--ink-2)", textDecoration: "none", border: "1px solid var(--line-2)", borderRadius: 100 }}>Sign in</a>
          <a href="/sign-up" style={{ padding: "8px 18px", fontSize: 14, fontWeight: 600, color: "#fff", background: "var(--brand-grad)", borderRadius: 100, textDecoration: "none" }}>Start free trial</a>
        </div>
      </div>
    </nav>
  );
}

function HeroTimer() {
  const [seconds, setSeconds] = useState(198);
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 28, fontWeight: 700, letterSpacing: "0.04em" }}>{h}:{m}:{s}</span>;
}

function Hero() {
  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px 60px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
      <div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 100, padding: "6px 14px", fontSize: 13, color: "var(--ink-2)", marginBottom: 24, fontWeight: 500 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--brand-grad)", display: "inline-block" }} />
          Time tracking that respects the person being tracked
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, color: "var(--ink)", marginBottom: 20 }}>
          The ally your team <em className="font-serif" style={{ fontStyle: "italic", fontWeight: 400, fontSize: 56 }}>actually wants</em> at work.
        </h1>
        <p style={{ fontSize: 18, color: "var(--ink-2)", lineHeight: 1.65, marginBottom: 36, maxWidth: 480 }}>
          Employees start, pause, and end their own tracking — and review every screenshot before it leaves their machine.
        </p>
        <form style={{ display: "flex", gap: 10, background: "#fff", border: "1px solid var(--line-2)", borderRadius: 100, padding: "6px 6px 6px 20px", boxShadow: "var(--shadow-sm)", maxWidth: 440 }} onSubmit={e => e.preventDefault()}>
          <input type="email" placeholder="Work email" style={{ flex: 1, border: "none", outline: "none", fontSize: 15, color: "var(--ink)", background: "transparent" }} />
          <button type="submit" style={{ padding: "10px 22px", background: "var(--brand-grad)", color: "#fff", border: "none", borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
            Start 14-day trial →
          </button>
        </form>
        <div style={{ display: "flex", gap: 20, marginTop: 20, flexWrap: "wrap" }}>
          {["No credit card", "Employee-first consent flow", "Cancel any time"].map(b => (
            <div key={b} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted)" }}>
              <span style={{ background: "var(--brand-grad)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 700 }}>✓</span>
              {b}
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", inset: -40, background: "radial-gradient(ellipse at 60% 40%, rgba(178,84,232,0.15) 0%, rgba(91,108,255,0.1) 50%, transparent 70%)", borderRadius: "50%", filter: "blur(30px)", pointerEvents: "none" }} />
        <div style={{ background: "#1A1424", borderRadius: 20, padding: 24, boxShadow: "var(--shadow-md)", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--g-pink)", animation: "pulse-dot 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 13, color: "rgba(240,237,246,0.6)", fontWeight: 500 }}>Tracking · session in progress</span>
          </div>
          <HeroTimer />
          <p style={{ color: "rgba(240,237,246,0.45)", fontSize: 12, marginTop: 6, marginBottom: 20 }}>Q3 Launch · Mockups</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
            {["Start", "Pause", "End"].map((b, i) => (
              <button key={b} style={{ flex: 1, padding: "8px 0", borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: "pointer", background: i === 0 ? "var(--brand-grad)" : "rgba(255,255,255,0.08)", color: i === 0 ? "#fff" : "rgba(240,237,246,0.7)", border: "none" }}>{b}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { name: "Elena", status: "Tracking", color: "#FF8A4C" },
              { name: "Tomás", status: "Paused", color: "#B254E8" },
              { name: "Sahar", status: "Reviewing", color: "#5B6CFF" },
            ].map(m => (
              <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.05)", borderRadius: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{m.name[0]}</div>
                <span style={{ flex: 1, fontSize: 13, color: "rgba(240,237,246,0.8)", fontWeight: 500 }}>{m.name}</span>
                <span style={{ fontSize: 12, color: m.status === "Tracking" ? "#3DC9B3" : m.status === "Paused" ? "#F4B740" : "#B254E8", fontWeight: 600 }}>{m.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoStrip() {
  const logos = [
    { name: "NORTHWIND", serif: false },
    { name: "meridian", serif: true },
    { name: "Lumen·Co", serif: false },
    { name: "PARALLAX", serif: false },
    { name: "orbital", serif: true },
    { name: "fieldnotes", serif: true },
  ];
  return (
    <section style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", background: "var(--surface)", padding: "28px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", marginBottom: 24 }}>2,400+ teams trust AllyTracker</p>
        <div style={{ display: "flex", gap: 48, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
          {logos.map(l => (
            <span key={l.name} className={l.serif ? "font-serif" : ""} style={{ fontSize: l.serif ? 20 : 15, fontWeight: l.serif ? 400 : 700, letterSpacing: l.serif ? "0.01em" : "0.08em", color: "var(--ink)", opacity: 0.55, textTransform: l.serif ? "none" : "uppercase" }}>
              {l.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureExplorer() {
  const [tab, setTab] = useState(0);
  const tabs = [
    {
      label: "Tracking controls",
      eyebrow: "Built for autonomy",
      h2: "Employees own their own time.",
      body: "No silent starts. No hidden timers. Every session begins with the employee's explicit tap — and ends when they say so.",
      bullets: ["Start, pause, and end from any device", "Idle detection with auto-pause after 5 minutes", "Session notes and project tagging"],
      mock: (
        <div style={{ background: "var(--surface)", borderRadius: 14, padding: 20, border: "1px solid var(--line)" }}>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Weekly hours</p>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 90 }}>
            {[65, 85, 50, 90, 72, 40, 30].map((h, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: i === 4 ? "var(--brand-grad)" : "var(--surface-3)", height: h + "%" }} />
                <span style={{ fontSize: 9, color: "var(--muted)" }}>{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: "Screenshot review",
      eyebrow: "Privacy first",
      h2: "Review before it leaves your machine.",
      body: "Screenshots wait in a local tray. Employees flag personal ones, add context, and only approved shots are sent to the manager.",
      bullets: ["Auto-flag personal apps by name", "Permanent deletion — no admin override", "Employee-controlled review window"],
      mock: (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {(["figma", "figma", "photo", "slack", "bank", "notion"] as const).map((k, i) => (
            <div key={i} style={{ borderRadius: 8, overflow: "hidden", aspectRatio: "16/10", position: "relative", border: [2, 5].includes(i) ? "2px solid var(--g-pink)" : "1px solid var(--line)" }}>
              <FakeScreen kind={k} />
              {[2, 5].includes(i) && (
                <div style={{ position: "absolute", top: 4, right: 4, background: "var(--g-pink)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 100 }}>Personal?</div>
              )}
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
      <div style={{ display: "flex", gap: 4, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 100, padding: 4, width: "fit-content", margin: "0 auto 56px" }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: "8px 22px", borderRadius: 100, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", background: tab === i ? "#fff" : "transparent", color: tab === i ? "var(--ink)" : "var(--muted)", boxShadow: tab === i ? "var(--shadow-xs)" : "none", transition: "all 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--g-pink)", marginBottom: 12 }}>{tabs[tab].eyebrow}</p>
          <h2 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.15, color: "var(--ink)", marginBottom: 16 }}>{tabs[tab].h2}</h2>
          <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.65, marginBottom: 28 }}>{tabs[tab].body}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {tabs[tab].bullets.map(b => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--brand-grad)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700, flexShrink: 0 }}>✓</div>
                <span style={{ fontSize: 15, color: "var(--ink-2)" }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
        <div>{tabs[tab].mock}</div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const cards = [
    { icon: "🛡", title: "100% Employee-started", body: "No session begins without the employee's explicit action." },
    { icon: "⭐", title: "4.8/5 CSAT from employees", body: "Employees rate AllyTracker higher than any other tool in the stack." },
    { icon: "👁", title: "Review first · Screenshots wait", body: "Nothing leaves the device until the employee approves it." },
  ];
  return (
    <section style={{ background: "var(--surface)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "64px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {cards.map(c => (
          <div key={c.title} style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 16, padding: 28, boxShadow: "var(--shadow-xs)" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{c.icon}</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>{c.title}</h3>
            <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6 }}>{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", position: "relative" }}>
        <div style={{ position: "absolute", inset: -60, background: "radial-gradient(ellipse at 50% 50%, rgba(178,84,232,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", background: "var(--bg)", border: "1px solid var(--line-2)", borderRadius: 24, padding: "52px 52px 44px", boxShadow: "var(--shadow-md)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 24 }}>Customer story</p>
          <blockquote className="font-serif" style={{ fontSize: 30, lineHeight: 1.45, color: "var(--ink)", fontStyle: "italic", marginBottom: 36 }}>
            &ldquo;AllyTracker is the first monitoring tool our employees actually asked us to keep. The consent flow isn&apos;t just ethical &mdash; it builds the kind of trust that makes remote work sustainable.&rdquo;
          </blockquote>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar initials="ML" color="#FF8A4C" size={44} />
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>Maya Lindqvist</p>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>VP People Ops · Northwind</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const [yearly, setYearly] = useState(true);
  const tiers = [
    {
      name: "Solo",
      price: { monthly: 0, yearly: 0 },
      description: "For individuals and freelancers.",
      highlight: false,
      badge: null,
      features: ["Start/Pause/End controls", "Screenshot review tray", "7-day history", "CSV export", "Web, Mac & Windows"],
    },
    {
      name: "Team",
      price: { monthly: 8, yearly: 6 },
      description: "Most loved by growing teams.",
      highlight: true,
      badge: "Most loved",
      features: ["Everything in Solo", "Up to 50 teammates", "Project billing codes", "Manager screenshot gallery", "Slack, Linear & Notion integrations"],
    },
    {
      name: "Org",
      price: { monthly: 16, yearly: 13 },
      description: "For large organizations.",
      highlight: false,
      badge: null,
      features: ["Everything in Team", "Unlimited teammates", "SSO + SCIM", "Role-based policies", "Priority support"],
    },
  ];

  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }} id="pricing">
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <h2 style={{ fontSize: 40, fontWeight: 800, color: "var(--ink)", marginBottom: 12 }}>Simple, honest pricing.</h2>
        <p style={{ fontSize: 17, color: "var(--ink-2)", marginBottom: 28 }}>Cancel any time. No contracts.</p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 100, padding: "4px 4px 4px 16px" }}>
          <span style={{ fontSize: 14, color: yearly ? "var(--muted)" : "var(--ink)", fontWeight: 500 }}>Monthly</span>
          <button onClick={() => setYearly(!yearly)} style={{ width: 44, height: 24, borderRadius: 100, background: yearly ? "var(--brand-grad)" : "var(--surface-3)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
            <div style={{ position: "absolute", top: 3, left: yearly ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
          </button>
          <span style={{ fontSize: 14, color: yearly ? "var(--ink)" : "var(--muted)", fontWeight: 600 }}>
            Yearly <span style={{ background: "var(--good-bg)", color: "var(--good)", padding: "2px 8px", borderRadius: 100, fontSize: 12, marginLeft: 4 }}>Save 25%</span>
          </span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {tiers.map(t => (
          <div key={t.name} style={{ background: t.highlight ? "#1A1424" : "var(--bg)", border: t.highlight ? "none" : "1px solid var(--line-2)", borderRadius: 20, padding: 32, boxShadow: t.highlight ? "var(--shadow-md)" : "var(--shadow-xs)", position: "relative" }}>
            {t.badge && (
              <div style={{ position: "absolute", top: 20, right: 20, background: "var(--brand-grad)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 100 }}>{t.badge}</div>
            )}
            <p style={{ fontSize: 13, fontWeight: 600, color: t.highlight ? "rgba(240,237,246,0.5)" : "var(--muted)", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>{t.name}</p>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 44, fontWeight: 800, color: t.highlight ? "#F0EDF6" : "var(--ink)" }}>
                ${yearly ? t.price.yearly : t.price.monthly}
              </span>
              {t.price.monthly > 0 && <span style={{ fontSize: 14, color: t.highlight ? "rgba(240,237,246,0.4)" : "var(--muted)" }}>/mo per user</span>}
              {t.price.monthly === 0 && <span style={{ fontSize: 14, color: t.highlight ? "rgba(240,237,246,0.4)" : "var(--muted)" }}> forever</span>}
            </div>
            <p style={{ fontSize: 14, color: t.highlight ? "rgba(240,237,246,0.55)" : "var(--ink-2)", marginBottom: 28 }}>{t.description}</p>
            <a href="/sign-up" style={{ display: "block", textAlign: "center", padding: "11px 0", borderRadius: 100, fontSize: 14, fontWeight: 600, textDecoration: "none", background: t.highlight ? "var(--brand-grad)" : "var(--surface-2)", color: t.highlight ? "#fff" : "var(--ink)", marginBottom: 28 }}>
              {t.price.monthly === 0 ? "Start free" : "Start 14-day trial"}
            </a>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {t.features.map(f => (
                <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 13, color: t.highlight ? "#3DC9B3" : "var(--good)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, color: t.highlight ? "rgba(240,237,246,0.7)" : "var(--ink-2)" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const items = [
    {
      q: "Is AllyTracker surveillance software?",
      a: "No. AllyTracker is designed around employee consent. Every tracking session is started explicitly by the employee, and every screenshot waits in a local review tray before being shared. We believe monitoring only works when the people being monitored trust it.",
    },
    {
      q: "Are timers running silently in the background?",
      a: "Never. AllyTracker does not run silent timers. All tracking is visible, opt-in, and can be paused or stopped by the employee at any moment. If the employee hasn't started a session, nothing is being tracked.",
    },
    {
      q: "How does the screenshot review process work?",
      a: "Screenshots are captured locally on the employee's device. Before anything is sent to the manager, the employee sees every capture in their review tray. They can remove personal or sensitive screenshots permanently — and no admin can override a removal.",
    },
    {
      q: "Which tools does AllyTracker integrate with?",
      a: "Team and Org plans include native integrations with Slack, Linear, and Notion. Webhooks and Zapier connections are available on all paid plans. We're adding Jira and GitHub integrations in Q3.",
    },
    {
      q: "What happens to removed screenshots?",
      a: "Removed screenshots are deleted permanently from the device and never transmitted. There is no administrator override, no cloud backup of removed captures, and no way to recover them. Your private moments stay private.",
    },
  ];

  return (
    <section style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px" }}>
      <h2 style={{ fontSize: 36, fontWeight: 800, color: "var(--ink)", marginBottom: 40, textAlign: "center" }}>Common questions</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", padding: "18px 20px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", textAlign: "left" }}>{item.q}</span>
              <span style={{ fontSize: 18, color: "var(--muted)", flexShrink: 0, transform: open === i ? "rotate(45deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>+</span>
            </button>
            {open === i && (
              <div style={{ padding: "0 20px 18px", fontSize: 15, color: "var(--ink-2)", lineHeight: 1.65 }}>{item.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section style={{ background: "var(--brand-grad)", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h2 style={{ fontSize: 38, fontWeight: 800, color: "#fff", marginBottom: 16 }}>Try AllyTracker with your team for 14 days.</h2>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.75)", marginBottom: 36 }}>No credit card required. Cancel any time. Setup in under 5 minutes.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/sign-up" style={{ padding: "13px 28px", background: "#fff", color: "var(--ink)", borderRadius: 100, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>Start free trial →</a>
          <a href="#" style={{ padding: "13px 28px", background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 100, fontSize: 15, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.3)" }}>Book a demo</a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { heading: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap", "Security"] },
    { heading: "Company", links: ["About", "Blog", "Careers", "Press", "Contact"] },
    { heading: "Resources", links: ["Docs", "Status", "Privacy policy", "Terms of service", "Cookie settings"] },
  ];
  return (
    <footer style={{ background: "var(--surface)", borderTop: "1px solid var(--line)", padding: "56px 24px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 16, color: "var(--ink)", marginBottom: 12 }}>
              <img src="/logo.jpg" alt="AllyTracker" style={{ width: 24, height: 24, borderRadius: 5, objectFit: "cover" }} />
              AllyTracker
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, maxWidth: 240 }}>The ally your team actually wants at work. Employee-first time tracking.</p>
          </div>
          {cols.map(c => (
            <div key={c.heading}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>{c.heading}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {c.links.map(l => (
                  <a key={l} href="#" style={{ fontSize: 14, color: "var(--ink-2)", textDecoration: "none" }}>{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>© 2025 AllyTracker, Inc. All rights reserved.</span>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>Made with care for the people being tracked.</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div>
      <TopNav />
      <Hero />
      <LogoStrip />
      <FeatureExplorer />
      <TrustStrip />
      <Testimonial />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
