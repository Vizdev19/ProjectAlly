"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const companyName = (fd.get("company") as string)?.trim();
    const fullName    = (fd.get("full_name") as string)?.trim();

    startTransition(async () => {
      const supabase = createClient();
      const { error: rpcErr } = await supabase.rpc("create_org_for_user", {
        p_company_name: companyName,
        p_full_name:    fullName || null,
      });

      if (rpcErr) { setError(rpcErr.message); return; }

      router.push("/dashboard");
    });
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Image src="/logo.jpg" alt="AllyTracker" width={44} height={44} style={{ borderRadius: 10, marginBottom: 16 }} />
          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 8 }}>
            Set up your <em className="font-serif" style={{ fontStyle: "italic" }}>workspace</em>
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>One last step before you&apos;re in.</p>
        </div>

        {error && (
          <div style={{ marginBottom: 18, padding: "12px 14px", borderRadius: 10, background: "var(--danger-bg)", border: "1px solid rgba(196,28,60,0.2)", fontSize: 13.5, color: "var(--danger)" }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, padding: 28, borderRadius: 18, background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
          <Field label="Your name">
            <input name="full_name" type="text" required autoComplete="name" placeholder="Elena Mendoza" style={inputStyle} />
          </Field>
          <Field label="Company name">
            <input name="company" type="text" required autoComplete="organization" placeholder="Northwind Inc." style={inputStyle} />
          </Field>
          <button type="submit" disabled={isPending} style={gradBtnStyle}>
            {isPending ? "Creating workspace…" : "Create workspace →"}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
          You&apos;ll be set as the workspace admin. Invite teammates from your dashboard.
        </p>
      </div>
    </div>
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

const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--bg)", fontSize: 14, color: "var(--ink)", outline: "none" };
const gradBtnStyle: React.CSSProperties = { padding: "13px", borderRadius: 12, background: "var(--brand-grad)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", border: "none", boxShadow: "0 6px 20px -4px rgba(178,84,232,0.4)" };
