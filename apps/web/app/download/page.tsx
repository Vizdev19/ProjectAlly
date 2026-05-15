import Link from "next/link";
import Image from "next/image";
import { getLatestRelease } from "@/lib/data/releases";
import DownloadButtons from "./DownloadButtons";

export const metadata = {
  title: "Download AllyTracker Desktop",
};

export default async function DownloadPage() {
  const release = await getLatestRelease();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* Top nav */}
      <header style={{ padding: "20px 28px", borderBottom: "1px solid var(--line)" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <Image src="/logo.jpg" alt="AllyTracker" width={28} height={28} style={{ borderRadius: 6 }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>AllyTracker</span>
        </Link>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ maxWidth: 640, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--g-magenta)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              Desktop agent
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ink)", marginBottom: 10, lineHeight: 1.15 }}>
              Install <em className="font-serif" style={{ fontStyle: "italic" }}>AllyTracker</em> on your computer
            </h1>
            <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.55, maxWidth: 480, margin: "0 auto" }}>
              The desktop app runs quietly in the background and captures a screenshot every 10 minutes — but only while <em>you</em> have tracking turned on. You always review screenshots before they leave your machine.
            </p>
          </div>

          {release ? (
            <>
              <DownloadButtons release={release} />
              <p style={{ marginTop: 22, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
                Latest version <strong style={{ color: "var(--ink-2)" }}>{release.tag}</strong> ·
                {" "}released {formatDate(release.publishedAt)} ·
                {" "}<a href={release.htmlUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--g-magenta)" }}>see all files</a>
              </p>
            </>
          ) : (
            <NoReleaseYet />
          )}

          {/* Notes */}
          <div style={{ marginTop: 44, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Note
              title="First-launch warning"
              body="The app isn't code-signed yet. macOS will say 'cannot verify developer' — right-click the app and choose Open. Windows shows SmartScreen — click More info → Run anyway."
            />
            <Note
              title="Permissions on macOS"
              body="On first capture, macOS asks for Screen Recording permission. Open System Settings → Privacy & Security → Screen Recording → toggle AllyTracker on, then restart the app."
            />
          </div>

          <p style={{ marginTop: 40, fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
            Already have it installed? <Link href="/app" style={{ color: "var(--ink)", fontWeight: 500 }}>Open your dashboard →</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function NoReleaseYet() {
  return (
    <div style={{ padding: 28, borderRadius: 14, background: "var(--surface)", border: "1px dashed var(--line-2)", textAlign: "center" }}>
      <p style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>
        The first release is being prepared
      </p>
      <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.55 }}>
        We&apos;re still cooking — the desktop app installers will appear here once the first version ships. Check back shortly, or use the web app for now.
      </p>
      <Link
        href="/app"
        style={{ display: "inline-block", marginTop: 18, padding: "10px 22px", background: "var(--brand-grad)", color: "#fff", borderRadius: 100, fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}
      >
        Open the web app →
      </Link>
    </div>
  );
}

function Note({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: 11, background: "var(--surface)", border: "1px solid var(--line)" }}>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>{title}</p>
      <p style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55 }}>{body}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}
