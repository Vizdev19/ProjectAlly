# Forking this repo to a new GitHub remote

**When to use this guide:** the user has cloned this codebase and wants to push
it to a *different* GitHub repo as the start of their own project. Many things
in the source are hardcoded to `Vizdev19/ProjectAlly` and the "AllyTracker"
brand — this file is the exhaustive checklist of what an AI agent must change
at the codebase level so the fork actually works (signed releases find the
right URL, the desktop app installs with a non-colliding bundle ID, etc.).

Read end-to-end before touching anything. The order matters — secrets get
regenerated *before* code references the new pubkey, etc.

---

## Pre-flight — confirm the human has these ready

Before you start editing files, ask the user to confirm:

1. **New empty GitHub repo URL** — e.g. `https://github.com/newowner/newrepo.git`
2. **New product name + bundle identifier** — e.g. "Acme Tracker" and `com.acme.tracker`. Identifier must be reverse-DNS, lowercase, no spaces.
3. **New Supabase project** — URL + anon key. If they reuse the old one, data leaks between projects.
4. **New Vercel project** — production URL (e.g. `https://acme-tracker.vercel.app`)
5. **Decision on signing**: regenerate Tauri minisign keys (mandatory — see Section 3) and decide whether to wire up Apple Developer ID + Authenticode (optional, costs money).
6. **Git identity** — the existing repo has `Vishnu Prasath <vishnuprasath100@gmail.com>` baked into user-level memory. Confirm whose name should be on new commits.

If any of these are missing, stop and surface what's needed instead of guessing.

---

## Section 1 — Repoint the git remote

```bash
git remote set-url origin <NEW_REMOTE_URL>
git remote -v   # verify
```

If they want to preserve history, they'll push as-is. If they want a clean
slate, `rm -rf .git && git init && git remote add origin <NEW>` resets history.

---

## Section 2 — Hardcoded references the codebase carries

### 2a — GitHub repo URL ("Vizdev19/ProjectAlly")

Two places matter functionally; the rest are docs.

| File | What | Replace with |
|---|---|---|
| `apps/web/lib/data/releases.ts:6` | `const GITHUB_REPO = "Vizdev19/ProjectAlly";` — used by the `/download` page to fetch latest release assets | `"<owner>/<repo>"` |
| `apps/desktop/src-tauri/tauri.conf.json` (updater endpoint URL) | Updater plugin hits `releases/latest/download/latest.json` on the OLD repo. If you forget this, the desktop app will check the old project for updates forever. | `https://github.com/<owner>/<repo>/releases/latest/download/latest.json` |
| `README.md`, `CLAUDE.md`, `apps/desktop/.env.local.example` (in `VITE_APP_URL`) | Docs / examples | Update for consistency |

**Find-all grep** (run from repo root):
```bash
grep -rln "Vizdev19/ProjectAlly\|Vizdev19" --include="*.ts" --include="*.tsx" \
  --include="*.toml" --include="*.json" --include="*.md" --include="*.html" \
  --include="*.rs" --include="*.yml" | grep -v node_modules | grep -v .next \
  | grep -v Cargo.lock | grep -v tsbuildinfo
```

There should be **zero** matches when you're done.

### 2b — Bundle identifier and package names

These collide across forks if not changed — macOS + Windows treat the bundle
identifier as the app's identity. An unchanged ID means installing the fork
overwrites the original on the same machine.

| File | Field | Notes |
|---|---|---|
| `apps/desktop/src-tauri/tauri.conf.json` | `identifier: "com.allytracker.desktop"` | Reverse-DNS unique to the new product, e.g. `com.acme.tracker` |
| `apps/desktop/src-tauri/Cargo.toml` | `name = "ally-tracker-desktop"` (top-level + `[[bin]] name`) | Crate name, kebab-case |
| `apps/desktop/src-tauri/Cargo.toml` | `[lib] name = "ally_tracker_desktop_lib"` | Library name, snake_case (Rust convention — kebab not allowed for lib names) |
| `apps/desktop/src-tauri/src/main.rs` | `ally_tracker_desktop_lib::run();` | Must match the new `[lib] name` |
| `apps/desktop/package.json` | `name: "ally-tracker-desktop"` | npm workspace name |
| Root `package.json` | `name: "ally-tracker"` | Monorepo name |
| `apps/desktop/src-tauri/Cargo.lock` | `[[package]] name = "ally-tracker-desktop"` block | Updates automatically next `cargo check` after Cargo.toml change, but commit the result |

After renaming, run `cd apps/desktop/src-tauri && cargo check` so Cargo.lock
regenerates cleanly.

### 2c — Product name, copyright, branding strings

Cosmetic but everywhere. Decide on a new product name, then do a project-wide
search & replace. The most impactful spots:

| File | What |
|---|---|
| `apps/desktop/src-tauri/tauri.conf.json` | `productName`, `publisher`, `copyright`, window `title` |
| `apps/desktop/src-tauri/Cargo.toml` | `description`, `authors` |
| `apps/desktop/index.html` | `<title>` |
| `apps/desktop/src/SignIn.tsx`, `Tracker.tsx`, `updater.ts`, `App.tsx` | UI strings ("AllyTracker", "Sign in to AllyTracker", etc.) |
| `apps/desktop/src-tauri/src/lib.rs` and `tray.rs` | Tray menu items ("Quit AllyTracker", "Open AllyTracker"); stderr label in `unwrap_or_else` |
| `apps/web/app/layout.tsx`, `apps/web/app/page.tsx` | Landing page, `<title>`, marketing copy |
| `apps/web/app/dashboard/DashboardClient.tsx` and `app/app/EmployeeAppClient.tsx` | Sidebar brand text |
| `apps/web/app/(auth)/sign-in/page.tsx`, `(auth)/sign-up/page.tsx`, `auth/onboarding/page.tsx`, `invite/[token]/page.tsx` | All sign-in / sign-up / invite copy |
| `apps/web/lib/email/templates/invite.ts` and `lib/email/resend.ts` | Invite email subject + body + default `RESEND_FROM` |
| `apps/web/app/download/page.tsx` | `/download` page copy |

**Find-all grep:**
```bash
grep -rln "AllyTracker\|ally-tracker\|allytracker\|ally_tracker" \
  --include="*.ts" --include="*.tsx" --include="*.toml" --include="*.json" \
  --include="*.md" --include="*.html" --include="*.rs" \
  | grep -v node_modules | grep -v .next | grep -v Cargo.lock
```

### 2d — Web app URL (`project-ally-web.vercel.app`)

| File | Field |
|---|---|
| `apps/desktop/.env.local.example` | `VITE_APP_URL=https://project-ally-web.vercel.app` (just a hint for new desktop builds) |
| README.md and CLAUDE.md | Mentioned in docs |

The runtime URLs come from env vars (`NEXT_PUBLIC_APP_URL` for web, `VITE_APP_URL` for desktop), so this is documentation hygiene. The variables themselves get set in Section 4.

### 2e — Icons and logo files

Replace the binaries; don't leave the AllyTracker brand mark on the new
product. The agent can't generate these — surface them to the user.

| Path | What |
|---|---|
| `apps/web/public/logo.jpg` (and any other branded assets in `public/`) | Web logo |
| `apps/desktop/src-tauri/icons/*` | `icon.png` (512), `128x128.png`, `128x128@2x.png`, `32x32.png`, `icon.icns` (macOS), `icon.ico` (Windows) |

Tauri can regenerate the platform-specific icons from a single 1024×1024 PNG:
`cd apps/desktop && npx @tauri-apps/cli icon path/to/icon.png`.

---

## Section 3 — Things that must be regenerated, never reused

### 3a — Tauri signing key (MANDATORY)

The pubkey in the old `tauri.conf.json` is paired with the private key in the
old repo's GitHub secrets. If you reuse the pubkey:
- Future releases from the new repo will fail signature verification because
  the new GitHub secret has a different private key
- Or, if the user uploads the OLD private key to the new repo's secrets,
  whoever owns the old repo can sign updates that the new fork's updater will
  trust → silent supply-chain compromise

**Always regenerate:**
```bash
npx @tauri-apps/cli signer generate -w ~/.tauri/newproject.key
```

Then base64-encode the contents and set as `TAURI_SIGNING_PRIVATE_KEY` repo
secret on the **new** repo. Paste the printed pubkey into the new
`tauri.conf.json` under `plugins.updater.pubkey`. (Section 4b.)

### 3b — Any tokens stored in `.env.local` files

If the user copied `apps/web/.env.local` from the old project, it points at
the old Supabase project and may carry the old Resend API key. Walk them
through deleting the local file and re-creating from `.env.local.example`
with the new project's values.

---

## Section 4 — External-service setup the AI should remind the human about

You can't do these — the user must, but warn them before you make code changes
that depend on them existing.

### 4a — Supabase

1. Create a new Supabase project.
2. Run all four migrations in order against the new database:
   ```bash
   cd supabase && supabase link --project-ref <new-project-ref>
   supabase db push
   ```
   (Or paste them into the SQL editor.)
3. Verify storage buckets `private-screenshots` and `submitted-screenshots`
   were created (migration 001 inserts them).
4. Grab the project URL + anon key from Settings → API.

### 4b — GitHub repo configuration

**Repository Variables** (Settings → Secrets and variables → Actions → Variables):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | From Section 4a |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Section 4a |
| `NEXT_PUBLIC_APP_URL` | New Vercel production URL (Section 4c) |

**Repository Secrets** (same screen, Secrets tab):

| Name | Value |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | Base64 of the file from Section 3a |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Whatever password they set during keygen (omit secret entirely if no password) |

Heads up: the workflow reads `NEXT_PUBLIC_*` from **`vars.`** not `secrets.`
([desktop-build.yml](.github/workflows/desktop-build.yml) explicitly uses
`${{ vars.X }}`). It's easy to put values in the wrong store.

### 4c — Vercel

1. Import the new GitHub repo.
2. Root directory: `.` (the monorepo root). `vercel.json` already tells Vercel
   to install from the root and build from `apps/web`.
3. Set the same `NEXT_PUBLIC_*` env vars in the Vercel dashboard (Settings →
   Environment Variables). Optionally `RESEND_API_KEY` and `GITHUB_API_TOKEN`.
4. Deploy. The URL becomes the new `NEXT_PUBLIC_APP_URL`.

### 4d — Optional: Apple / Windows code signing

If the new project plans to ship the desktop app to non-technical users,
unsigned macOS apps trigger Gatekeeper's misleading "damaged" message and
Windows installers trigger SmartScreen warnings. See the README's
"macOS install caveats" / "Windows install caveats" sections.

The fork inherits the same gap. Cost: Apple Developer Program ($99/yr) +
Authenticode cert ($200–400/yr). Surface this trade-off to the user rather
than deciding for them.

---

## Section 5 — Verify nothing was missed

After all replacements, these should all return **zero results**:

```bash
# No old org/repo references
grep -rln "Vizdev19" --include="*.ts" --include="*.tsx" --include="*.toml" \
  --include="*.json" --include="*.md" --include="*.html" --include="*.rs" \
  --include="*.yml" | grep -v node_modules | grep -v .next | grep -v Cargo.lock

# No old brand references
grep -rln "AllyTracker\|ally-tracker\|allytracker\|ally_tracker" \
  --include="*.ts" --include="*.tsx" --include="*.toml" --include="*.json" \
  --include="*.md" --include="*.html" --include="*.rs" \
  | grep -v node_modules | grep -v .next | grep -v Cargo.lock

# No old web URL references
grep -rln "project-ally-web" \
  --include="*.ts" --include="*.tsx" --include="*.toml" --include="*.json" \
  --include="*.md" --include="*.html" \
  | grep -v node_modules | grep -v .next
```

Compile + lint checks:
```bash
cd apps/web && npx tsc --noEmit && npx eslint .
cd apps/desktop && npx tsc --noEmit
cd apps/desktop/src-tauri && cargo check
```

End-to-end smoke test:
```bash
npm install
npm run dev                                 # web on :3000
cd apps/desktop && npm run tauri dev        # desktop window opens, sign-in works
```

Push to new remote + tag a v0.1.0 release to confirm the release workflow,
signing, and updater endpoint all wired up correctly. The first release's
`.app.tar.gz.sig` files appearing alongside the artifacts is the success
signal.

---

## What does NOT need to change

For reassurance — these are stable across forks:

- **Database schema** (`supabase/migrations/*.sql`) — the structure is generic.
  The RLS policies key off `org_id` which is per-tenant, not per-fork.
- **Workflow logic** (`.github/workflows/*.yml`) — uses `${{ github }}` context
  variables that automatically reflect the current repo. Don't hand-edit URLs.
- **Tauri plugin set** — updater, notification, shell, autostart, process. All
  generic.
- **App architecture** — proxy.ts routing, server/client split, RLS model.
  Read `CLAUDE.md` and `README.md` for these.
- **Migration 004**'s `paused_total_seconds` column and the elapsed-time logic
  that depends on it.
- **Git commit conventions** — but update the git identity to the new
  project's owner.

---

## Quick mental model for the agent

The codebase has three layers of "old-project-ness":

1. **Functional references** (Section 2a, 2b, 3a) — break things if not changed.
   Updater hits wrong endpoint, bundle identifier collides, signature
   verification fails. **Fix these first.**
2. **Cosmetic references** (Section 2c, 2d, 2e) — work technically but show
   the wrong brand. Fix in a second pass.
3. **External state** (Section 4) — not in the code at all. Surface to the
   user as prerequisites; don't assume.

If you only have time for one section: it's 2a + 2b + 3a + 4b (signing keys).
That's the minimum to ship a working signed release from the new repo.
