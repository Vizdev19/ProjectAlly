"use client";

import { useEffect, useState } from "react";
import type { LatestRelease, ReleaseAsset } from "@/lib/data/releases";

type DetectedOS = "mac-arm" | "mac-intel" | "windows" | "linux" | "unknown";

function detectOS(): DetectedOS {
  if (typeof navigator === "undefined") return "unknown";
  const ua       = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || "").toLowerCase();

  if (ua.includes("windows") || platform.includes("win")) return "windows";
  if (ua.includes("mac") || platform.includes("mac")) {
    // navigator.userAgentData.brands is the only reliable way to detect M-series
    // vs Intel — fall back to assuming Apple Silicon since it's more common now.
    type WithUAData = Navigator & {
      userAgentData?: { getHighEntropyValues?: (k: string[]) => Promise<{ architecture?: string }> };
    };
    const nav = navigator as WithUAData;
    if (!nav.userAgentData?.getHighEntropyValues) return "mac-arm";
    return "mac-arm"; // refined async below
  }
  if (ua.includes("linux") || platform.includes("linux")) return "linux";
  return "unknown";
}

export default function DownloadButtons({ release }: { release: LatestRelease }) {
  const [os, setOs] = useState<DetectedOS>("unknown");

  useEffect(() => {
    // Client-only platform detection — navigator is undefined during SSR, so
    // this can't run as a state initializer. setState here is intentional and
    // fires exactly once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOs(detectOS());

    // Refine mac arm vs intel using high-entropy values when available
    type WithUAData = Navigator & {
      userAgentData?: { getHighEntropyValues?: (k: string[]) => Promise<{ architecture?: string }> };
    };
    const nav = navigator as WithUAData;
    if (nav.userAgentData?.getHighEntropyValues) {
      nav.userAgentData.getHighEntropyValues(["architecture"]).then((info) => {
        const arch = info.architecture?.toLowerCase();
        if (arch && (arch.includes("x86") || arch === "x64")) {
          setOs((prev) => (prev === "mac-arm" ? "mac-intel" : prev));
        }
      }).catch(() => {});
    }
  }, []);

  const primary = pickPrimary(os, release);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
      {primary ? (
        <a href={primary.asset.url} style={primaryBtnStyle}>
          <span style={{ fontSize: 20 }}>{primary.icon}</span>
          <span>Download for {primary.label}</span>
          <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.7 }}>({prettySize(primary.asset.size)})</span>
        </a>
      ) : (
        <p style={{ fontSize: 14, color: "var(--muted)" }}>
          No installer matches your platform — pick one below.
        </p>
      )}

      {/* All available downloads */}
      <details style={{ width: "100%", maxWidth: 420 }}>
        <summary style={{ fontSize: 13, color: "var(--muted)", cursor: "pointer", textAlign: "center" }}>
          Other platforms
        </summary>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {release.macArm   && <SecondaryRow icon="🍎" label="macOS (Apple Silicon)" asset={release.macArm} />}
          {release.macIntel && <SecondaryRow icon="🍎" label="macOS (Intel)"          asset={release.macIntel} />}
          {release.windows  && <SecondaryRow icon="🪟" label="Windows"                 asset={release.windows} />}
        </div>
      </details>
    </div>
  );
}

function pickPrimary(os: DetectedOS, r: LatestRelease):
  | { icon: string; label: string; asset: ReleaseAsset }
  | null
{
  switch (os) {
    case "mac-arm":   if (r.macArm)   return { icon: "🍎", label: "macOS (Apple Silicon)", asset: r.macArm };
                      if (r.macIntel) return { icon: "🍎", label: "macOS (Intel)", asset: r.macIntel };
                      return null;
    case "mac-intel": if (r.macIntel) return { icon: "🍎", label: "macOS (Intel)", asset: r.macIntel };
                      if (r.macArm)   return { icon: "🍎", label: "macOS (Apple Silicon)", asset: r.macArm };
                      return null;
    case "windows":   if (r.windows)  return { icon: "🪟", label: "Windows", asset: r.windows };
                      return null;
    default:          return null;
  }
}

function SecondaryRow({ icon, label, asset }: { icon: string; label: string; asset: ReleaseAsset }) {
  return (
    <a href={asset.url} style={secondaryRowStyle}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 12, color: "var(--muted)" }}>{prettySize(asset.size)}</span>
      <span style={{ fontSize: 12, color: "var(--g-magenta)", fontWeight: 600 }}>Download →</span>
    </a>
  );
}

function prettySize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const primaryBtnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 12,
  padding: "16px 32px",
  background: "var(--brand-grad)", color: "#fff",
  borderRadius: 100, fontSize: 16, fontWeight: 700,
  textDecoration: "none",
  boxShadow: "0 8px 24px -6px rgba(178,84,232,0.4)",
};
const secondaryRowStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10,
  padding: "10px 14px",
  border: "1px solid var(--line)", borderRadius: 10,
  background: "var(--surface)",
  textDecoration: "none",
};
