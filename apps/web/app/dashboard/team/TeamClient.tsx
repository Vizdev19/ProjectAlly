"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInvite, revokeInvite } from "@/lib/auth/actions";

type Member = {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "employee";
  avatar_color: string;
  created_at: string;
};

type Invite = {
  id: string;
  email: string;
  role: "admin" | "employee";
  full_name: string | null;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

export default function TeamClient({
  members,
  invites,
  appUrl,
  currentMemberId,
}: {
  members: Member[];
  invites: Invite[];
  appUrl: string;
  currentMemberId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const fd = new FormData(e.currentTarget);
    const inviteEmail = String(fd.get("email") ?? "").trim();
    startTransition(async () => {
      const result = await createInvite(fd);
      if (result.error) { setError(result.error); return; }
      (e.target as HTMLFormElement).reset();
      if (result.emailSent) {
        setSuccess(`Invitation email sent to ${inviteEmail}.`);
      } else if (result.emailError) {
        setSuccess(`Invite created. Email send failed (${result.emailError}). Copy the link below to share manually.`);
      } else {
        setSuccess("Invite created. Copy the link below to share.");
      }
      router.refresh();
    });
  }

  function handleRevoke(inviteId: string) {
    setError(null);
    startTransition(async () => {
      const result = await revokeInvite(inviteId);
      if (result.error) { setError(result.error); return; }
      router.refresh();
    });
  }

  function inviteLink(token: string) {
    return `${appUrl}/invite/${token}`;
  }

  function copyLink(invite: Invite) {
    navigator.clipboard.writeText(inviteLink(invite.token));
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "48px 28px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>
          Team & invites
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)" }}>
          Invite teammates to your workspace. Each invite is a one-time link tied to a specific email.
        </p>
      </div>

      {/* Invite form */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Send an invite</h2>

        {error && (
          <div style={errorBoxStyle}>{error}</div>
        )}
        {success && (
          <div style={successBoxStyle}>{success}</div>
        )}

        <form onSubmit={handleInvite} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 160px", gap: 10, alignItems: "end", marginTop: 14 }}>
          <Field label="Email">
            <input name="email" type="email" required placeholder="teammate@company.com" style={inputStyle} />
          </Field>
          <Field label="Full name (optional)">
            <input name="full_name" type="text" placeholder="Elena Mendoza" style={inputStyle} />
          </Field>
          <Field label="Role">
            <select name="role" defaultValue="employee" style={{ ...inputStyle, cursor: "pointer", appearance: "none" }}>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={isPending} style={primaryBtnStyle}>
              {isPending ? "Creating…" : "Create invite"}
            </button>
          </div>
        </form>
      </section>

      {/* Pending invites */}
      <section style={{ ...cardStyle, marginTop: 22 }}>
        <h2 style={sectionTitleStyle}>Pending invites ({invites.length})</h2>
        {invites.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 10 }}>
            No pending invites. Send one above to get started.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
            {invites.map((inv) => (
              <div key={inv.id} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                    {inv.email}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    {inv.role === "admin" ? "Admin" : "Employee"}
                    {" · expires "}
                    {new Date(inv.expires_at).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={() => copyLink(inv)} style={secondaryBtnStyle}>
                  {copiedId === inv.id ? "Copied!" : "Copy link"}
                </button>
                <button onClick={() => handleRevoke(inv.id)} disabled={isPending} style={dangerBtnStyle}>
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active members */}
      <section style={{ ...cardStyle, marginTop: 22 }}>
        <h2 style={sectionTitleStyle}>Members ({members.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {members.map((m) => (
            <div key={m.id} style={rowStyle}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: m.avatar_color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 12, flexShrink: 0 }}>
                {m.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                  {m.full_name}{m.id === currentMemberId && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>(you)</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  {m.email} · {m.role === "admin" ? "Admin" : "Employee"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
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

const cardStyle: React.CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 24,
};
const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15, fontWeight: 600, color: "var(--ink)",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid var(--line-2)",
  background: "var(--bg)", fontSize: 13.5, color: "var(--ink)", outline: "none",
};
const primaryBtnStyle: React.CSSProperties = {
  padding: "10px 18px", borderRadius: 10, background: "var(--brand-grad)", color: "#fff",
  fontSize: 13.5, fontWeight: 600, border: "none", cursor: "pointer",
};
const secondaryBtnStyle: React.CSSProperties = {
  padding: "7px 12px", borderRadius: 8, background: "var(--surface-2)", color: "var(--ink-2)",
  fontSize: 12.5, fontWeight: 500, border: "1px solid var(--line)", cursor: "pointer",
};
const dangerBtnStyle: React.CSSProperties = {
  padding: "7px 12px", borderRadius: 8, background: "transparent", color: "var(--danger)",
  fontSize: 12.5, fontWeight: 500, border: "1px solid rgba(196,28,60,0.25)", cursor: "pointer",
};
const rowStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
  background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 10,
};
const errorBoxStyle: React.CSSProperties = {
  marginTop: 10, padding: "10px 12px", borderRadius: 9, background: "var(--danger-bg)",
  border: "1px solid rgba(196,28,60,0.2)", fontSize: 13, color: "var(--danger)",
};
const successBoxStyle: React.CSSProperties = {
  marginTop: 10, padding: "10px 12px", borderRadius: 9, background: "var(--good-bg)",
  border: "1px solid rgba(11,123,58,0.2)", fontSize: 13, color: "var(--good)",
};
