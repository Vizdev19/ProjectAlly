import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { destinationForMember } from "@/lib/auth/redirect";
import AcceptInviteButton from "./AcceptInviteButton";

type Preview = {
  org_name: string;
  role: "admin" | "employee";
  email: string;
  expires_at: string;
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase  = await createClient();

  // Anyone (including anon) can preview an invite by token
  const { data: previewRows } = await supabase.rpc("preview_invite", { p_token: token });
  const preview = (previewRows as Preview[] | null)?.[0] ?? null;

  if (!preview) {
    return (
      <Shell>
        <h1 style={titleStyle}>Invite not found</h1>
        <p style={subtitleStyle}>
          This invitation has expired or already been used. Ask your admin for a new link.
        </p>
        <Link href="/sign-in" style={linkStyle}>← Back to sign in</Link>
      </Shell>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  // Case A: already signed in — match the invite email and offer to accept
  if (user) {
    const userEmail = user.email?.toLowerCase();
    if (userEmail && userEmail !== preview.email.toLowerCase()) {
      return (
        <Shell>
          <h1 style={titleStyle}>Wrong account</h1>
          <p style={subtitleStyle}>
            This invitation is for <strong>{preview.email}</strong>, but
            you&apos;re signed in as <strong>{user.email}</strong>. Sign out first
            and try again.
          </p>
          <Link href="/sign-in" style={linkStyle}>Sign in with the invited account →</Link>
        </Shell>
      );
    }

    // Already accepted (has a member row) — just send them to the app
    const { data: existing } = await supabase
      .from("members")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      redirect(destinationForMember(existing.role));
    }

    return (
      <Shell>
        <h1 style={titleStyle}>
          Join <em className="font-serif" style={{ fontStyle: "italic" }}>{preview.org_name}</em>
        </h1>
        <p style={subtitleStyle}>
          You&apos;ve been invited as a {preview.role === "admin" ? "workspace admin" : "team member"}.
        </p>
        <AcceptInviteButton token={token} />
      </Shell>
    );
  }

  // Case B: not signed in — prompt them to create an account
  const signUpUrl = `/sign-up?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(preview.email)}`;
  return (
    <Shell>
      <h1 style={titleStyle}>
        Join <em className="font-serif" style={{ fontStyle: "italic" }}>{preview.org_name}</em>
      </h1>
      <p style={subtitleStyle}>
        You&apos;ve been invited to join as a {preview.role === "admin" ? "workspace admin" : "team member"}.
        Create your account with <strong>{preview.email}</strong> to accept.
      </p>
      <Link href={signUpUrl} style={btnStyle}>Create my account →</Link>
      <p style={{ marginTop: 18, fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
        Already have an account?{" "}
        <Link href={`/sign-in?next=/invite/${token}`} style={{ color: "var(--ink)" }}>
          Sign in
        </Link>
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Image src="/logo.jpg" alt="AllyTracker" width={44} height={44} style={{ borderRadius: 10 }} />
        </div>
        <div style={{ padding: 32, borderRadius: 18, background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 10, color: "var(--ink)",
};
const subtitleStyle: React.CSSProperties = {
  fontSize: 14, color: "var(--muted)", lineHeight: 1.55, marginBottom: 22,
};
const btnStyle: React.CSSProperties = {
  display: "block", padding: "13px", borderRadius: 12, background: "var(--brand-grad)",
  color: "#fff", fontSize: 15, fontWeight: 600, textAlign: "center", textDecoration: "none",
  boxShadow: "0 6px 20px -4px rgba(178,84,232,0.4)",
};
const linkStyle: React.CSSProperties = {
  display: "inline-block", marginTop: 16, fontSize: 14, color: "var(--g-magenta)", textDecoration: "none",
};
