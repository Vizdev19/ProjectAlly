// ============================================================
// GitHub Releases — fetch the latest published desktop release
// ============================================================
// Used by /download to point employees at the right installer for their OS.

const GITHUB_REPO = "Vizdev19/ProjectAlly";

export type ReleaseAsset = {
  name: string;
  url:  string;
  size: number;
};

export type LatestRelease = {
  tag:         string;
  publishedAt: string;
  /** Apple Silicon (M-series) macOS .dmg */
  macArm:      ReleaseAsset | null;
  /** Intel macOS .dmg */
  macIntel:    ReleaseAsset | null;
  /** Windows installer (msi preferred, exe fallback) */
  windows:     ReleaseAsset | null;
  /** All assets if the consumer wants a full list */
  all:         ReleaseAsset[];
};

/**
 * Fetches the latest published release. Returns null if the repo has no
 * releases yet (which is what /download will show before the first tag ships).
 *
 * Cached for 5 min to amortize calls. If GITHUB_API_TOKEN is set, requests are
 * authenticated (5000 req/hr); otherwise unauthenticated (60 req/hr per IP,
 * shared across Vercel tenants — easy to exhaust).
 */
export async function getLatestRelease(): Promise<LatestRelease | null> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_API_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_API_TOKEN}`;
  }
  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      tag_name:     string;
      published_at: string;
      assets:       Array<{ name: string; browser_download_url: string; size: number }>;
    };

    const all: ReleaseAsset[] = data.assets.map((a) => ({
      name: a.name, url: a.browser_download_url, size: a.size,
    }));

    const findFirst = (pred: (n: string) => boolean) =>
      all.find((a) => pred(a.name.toLowerCase())) ?? null;

    return {
      tag:         data.tag_name,
      publishedAt: data.published_at,
      // Tauri's macOS bundles are either .dmg installers or .app.tar.gz
      // archives (the latter when DMG bundling is disabled to dodge CI flakes).
      // Match either, scoped to the right architecture.
      macArm: findFirst((n) =>
        (n.endsWith(".dmg") || n.endsWith(".app.tar.gz")) &&
        (n.includes("aarch64") || n.includes("arm64")),
      ),
      macIntel: findFirst((n) =>
        (n.endsWith(".dmg") || n.endsWith(".app.tar.gz")) &&
        (n.includes("x64") || n.includes("x86_64") || n.includes("intel")),
      ),
      // Prefer MSI over EXE
      windows: findFirst((n) => n.endsWith(".msi")) ?? findFirst((n) => n.endsWith(".exe")),
      all,
    };
  } catch {
    return null;
  }
}
