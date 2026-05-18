# AllyTracker

A consent-first, privacy-first time tracker. Employees install a desktop agent
that captures a screenshot every 10 minutes during a tracking session — but
nothing leaves their machine until *they* approve each screenshot. Admins see
only what their team has explicitly submitted.

The web app is the admin dashboard + employee review surface. The desktop app
is the capture + upload agent. Supabase backs both.

---

## Repository layout

```
ProjectAlly/
├── apps/
│   ├── web/                Next.js 16 app — landing, auth, dashboard,
│   │                       employee review, /download, /invite
│   └── desktop/            Tauri 2 desktop agent (Vite + React 18 + Rust)
│       ├── src/            React UI (sign-in, tracker, updater)
│       ├── src-tauri/      Rust backend (capture, session, tray, plugins)
│       └── icons/
├── supabase/
│   └── migrations/         Numbered SQL migrations (001–004)
├── .github/workflows/
│   ├── ci.yml              Per-PR: typecheck + lint + build both apps
│   └── desktop-build.yml   Per-tag (v*): cross-platform Tauri release
├── package.json            npm workspaces root
├── turbo.json              Turborepo task config
└── vercel.json             Vercel deployment config (web only)
```

## Tech stack

| Layer | Choice |
|---|---|
| Web framework | Next.js 16 (App Router, server components, Server Actions, **`proxy.ts` not `middleware.ts`** — v16 renamed it) |
| Web UI | React 19, inline-styled JSX (no Tailwind yet — `@tailwindcss/postcss` is installed but not in active use) |
| Desktop shell | Tauri 2 |
| Desktop UI | React 18 + Vite 6 |
| Desktop capture | Rust [`screenshots`](https://crates.io/crates/screenshots) crate via DXGI (Windows) / CoreGraphics (macOS) |
| Auth + DB + Storage | Supabase (Postgres, RLS, Storage buckets, Auth) |
| Email | Resend (transactional invites) |
| Build orchestration | Turborepo, npm workspaces |
| Web hosting | Vercel |
| Desktop distribution | GitHub Releases (signed via Tauri minisign) |

## Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10 (uses workspaces)
- **Rust** stable (for desktop builds) — `rustup` recommended
- **Supabase CLI** (for migrations) — optional, can apply migrations via dashboard
- macOS or Windows for desktop builds (Linux works too but not in CI)

## Environment variables

### `apps/web/.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Supabase → Settings → API>
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional — for invite emails. Falls back to onboarding@resend.dev if unset.
RESEND_API_KEY=
RESEND_FROM=

# Optional — for /download page release lookups. Without it, GitHub's public
# API rate-limits at 60 req/hr per IP (shared on Vercel).
GITHUB_API_TOKEN=
```

### `apps/desktop/.env.local`

```
VITE_SUPABASE_URL=<same as NEXT_PUBLIC_SUPABASE_URL>
VITE_SUPABASE_ANON_KEY=<same as NEXT_PUBLIC_SUPABASE_ANON_KEY>
VITE_APP_URL=https://project-ally-web.vercel.app   # or http://localhost:3000 for dev
```

Without these, the desktop app shows a "Setup incomplete" message instead of
crashing — `supabase.ts` has a guard around `createClient()`.

### GitHub repository configuration

Used by `.github/workflows/desktop-build.yml`. **Variables, not Secrets**
(NEXT_PUBLIC_\* are public client values):

| Repository Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Same as the local one |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as the local one |
| `NEXT_PUBLIC_APP_URL` | `https://project-ally-web.vercel.app` |

Repository Secrets (these *are* sensitive):

| Secret | Value |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | Minisign private key — generate with `npx @tauri-apps/cli signer generate -w ~/.tauri/allytracker.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | The password you set during keygen (empty / omit secret if you pressed Enter twice) |

The matching **public** key lives in `apps/desktop/src-tauri/tauri.conf.json`
under `plugins.updater.pubkey` so the updater can verify downloaded artifacts.

## Database

Migrations live in `supabase/migrations/` and apply in order:

| File | What it does |
|---|---|
| `001_initial_schema.sql` | `organizations`, `members`, `tracking_sessions`, `screenshots` tables + RLS policies + storage buckets (`private-screenshots`, `submitted-screenshots`) |
| `002_auth_trigger.sql` | `handle_new_user` trigger — auto-creates org + member on email signup |
| `003_invites_and_security.sql` | `invites` table, security-hardening of helper fns, anti-self-escalation trigger, RPCs: `preview_invite`, `create_invite`, `revoke_invite`, `accept_invite`, `create_org_for_user` |
| `004_session_paused_seconds.sql` | Adds `paused_total_seconds` so elapsed time excludes pauses |

Apply with `supabase db push` (or run them in order against the Supabase SQL
editor).

### Multi-tenancy model

```
organizations
   └── members (1 user → 1 member → 1 org)
         ├── tracking_sessions
         └── screenshots (private-screenshots bucket → submitted-screenshots on approval)
```

Every row carries `org_id`. RLS enforces org isolation. Employees can only
see/modify their own data; admins can read approved screenshots org-wide but
**never see pending or removed ones** — that's the privacy core of the product.

## Running locally

From the repo root:

```bash
npm install              # installs both web and desktop workspaces
npm run dev              # turbo dev — starts web (3000) + desktop (Vite + Tauri)
```

Or per-app:

```bash
# Web only
cd apps/web && npm run dev
# → http://localhost:3000

# Desktop only (opens a Tauri window backed by Vite at :5173)
cd apps/desktop && npm run tauri dev
```

The desktop app needs the web app *only* for its "Review screenshots in
browser" button — sign-in and capture work standalone via Supabase.

## How the system works (data flow)

### Sign-up paths

1. **New org**: user fills the sign-up form with company name → `signUpWithEmail` Server Action sets `company_name` in user metadata → Supabase confirmation email → `handle_new_user` trigger creates org + member (role: admin).
2. **Invite**: admin sends invite → invitee clicks email link → `/invite/{token}` page previews the invite → if not signed in, redirected to `/sign-up?invite=<token>&email=<email>` → on signup, `handle_new_user` finds the pending invite, joins the existing org with the invite's role.
3. **OAuth (Google/Microsoft)**: no metadata, lands on `/auth/onboarding` → client calls `create_org_for_user` RPC.

### Tracking + capture pipeline

1. Employee signs into the desktop app (Supabase email/password).
2. App calls `register_session` Tauri command, handing the Rust backend the access token + member/org IDs.
3. Employee clicks **Start** → web inserts a `tracking_sessions` row → desktop calls `start_capture` → Rust fires an **immediate** screenshot, then every 10 min.
4. Each capture is saved to `app_data_dir/screenshots/pending/<uuid>.png`, uploaded to the `private-screenshots` Supabase Storage bucket, and inserted into `screenshots` with `status='pending'`.
5. Employee reviews their pending pile in `/app` → approves or removes each one.
   - **Approve**: file is copied to `submitted-screenshots` bucket; row updated to `status='approved'`. Admins can now see it.
   - **Remove**: file is permanently deleted from storage; row updated to `status='removed'`. Admin never sees it.
6. The Rust capture loop rescans the pending dir on each launch so a crash/quit mid-flush doesn't lose any files.

### Window lifecycle

- Window starts hidden (`visible: false` in `tauri.conf.json`) to avoid a flash when autostarting at login.
- On launch, `lib.rs` shows the window unless `--minimized` was passed.
- Clicking the X **hides** the window (intercepted via `CloseRequested`) so the capture loop keeps running. Tray icon stays. Quit explicitly via tray → Quit.
- Tray icon: single-click (macOS) or double-click (Windows) shows the window.

## Project conventions

- **Next.js 16 proxy file**: `apps/web/proxy.ts` (formerly `middleware.ts`). Routes auth-required, admin-only, and onboarding redirects.
- **Server vs Client**: server actions in `lib/actions/*.ts` (`"use server"` at top); read paths in `lib/data/*.ts`; pure utilities in `lib/auth/`, `lib/types/`, etc.
- **Supabase clients**: `lib/supabase/server.ts` (server components / actions, cookie-bound), `lib/supabase/client.ts` (browser).
- **Defensive supabase init on desktop**: `apps/desktop/src/supabase.ts` wraps `createClient()` in try/catch so missing env vars don't blow up module load — `App.tsx`'s "Setup incomplete" guard can render instead.
- **Inline styles** in React components — no styled-components or Tailwind classes in active use.
- **Commit style**: conventional commits (`fix(scope): ...`, `feat(scope): ...`, `chore(scope): ...`). One logical change per commit.

## CI/CD

### `ci.yml` — every push to `main` + every PR
- **Web job**: `tsc --noEmit`, ESLint, `next build` with placeholder env vars
- **Desktop job**: `tsc --noEmit` for the React side (Rust compile only happens in the release workflow)

### `desktop-build.yml` — every `v*` tag push
- Matrix builds: macOS arm64, macOS x64, Windows x64
- Signs artifacts with `TAURI_SIGNING_PRIVATE_KEY`
- Publishes a release containing `.app.tar.gz` (mac), `.msi` + `.exe` (Windows), matching `.sig` files, and `latest.json` for the updater

### Web deployment (Vercel)
Auto-deploys on push to `main`. Build command: `npm run build` from `apps/web`. The `vercel.json` at the root tells Vercel to install from the workspace root.

## Releasing the desktop app

1. Bump version in **four places** (must match):
   - `apps/desktop/package.json`
   - `apps/desktop/src-tauri/Cargo.toml`
   - `apps/desktop/src-tauri/tauri.conf.json`
   - `apps/desktop/src-tauri/Cargo.lock` (the `[[package]] name = "ally-tracker-desktop"` block)
2. Commit and push.
3. Tag and push the tag:
   ```bash
   git tag v0.1.X
   git push origin v0.1.X
   ```
4. Workflow runs (~5–8 min). Watch at `https://github.com/Vizdev19/ProjectAlly/actions`.
5. Once published, existing installs ≥ v0.1.11 will auto-prompt for the update on next launch (signed `.app.tar.gz` / `.msi` downloaded from the GH release and verified against the embedded pubkey).

### macOS install caveats

The app is **not** notarized (no Apple Developer ID). First install needs:
```bash
xattr -dr com.apple.quarantine /Applications/AllyTracker.app
```
Auto-updates installed by the updater plugin **don't** carry the quarantine bit so this only bites on first manual download.

### Windows install caveats

The MSI/EXE is **not** Authenticode-signed. SmartScreen warns on first install — users click "More info → Run anyway". Auto-updates have the same warning-free flow as macOS.

## Troubleshooting

### Desktop app crashes at launch with `SIGABRT` / "AllyTracker quit unexpectedly"
Run from Terminal to get the actual error:
```bash
/Applications/AllyTracker.app/Contents/MacOS/ally-tracker-desktop
```
`lib.rs` prints `[fatal] AllyTracker failed to start: <reason>` before exiting cleanly. Common past causes (all fixed): tray icon missing, invalid plugin config, malformed pubkey.

### macOS "AllyTracker is damaged and can't be opened"
That's Gatekeeper, not corruption. The bundle is ad-hoc signed (no Developer ID). Strip quarantine:
```bash
xattr -dr com.apple.quarantine /Applications/AllyTracker.app
```

### Desktop app opens to a blank white window
React app failed to mount. Usually means the Vite env vars (`VITE_SUPABASE_URL` etc.) weren't baked into the bundle. With v0.1.11+, the defensive `supabase.ts` will render "Setup incomplete" instead. For local `tauri dev`, ensure `apps/desktop/.env.local` exists.

### Tauri signing builds but no `latest.json` in the release
The signing key isn't being parsed. Most common causes:
1. `TAURI_SIGNING_PRIVATE_KEY` secret contains the *public* key by mistake
2. Multi-line key value got newlines mangled in the GitHub UI — re-paste using the base64 form: `base64 -i ~/.tauri/allytracker.key | pbcopy`
3. `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` is set but the key has no password (delete the password secret)
4. `bundle.createUpdaterArtifacts` is not `true` in `tauri.conf.json`

### CI says secret is set but build acts like it's empty
Check whether the value is in **Secrets** (`${{ secrets.X }}`) or **Variables** (`${{ vars.X }}`) — they're separate stores. The desktop workflow reads `NEXT_PUBLIC_*` from `vars` (they're public anyway).

### Web app shows "user is already a member of an org"
Stale `/auth/onboarding` page after the user already has a member row. As of recent changes, the proxy redirects them away — if you see this again, check `apps/web/proxy.ts:62-68`.

## Quick commands cheat-sheet

```bash
# Dev
npm run dev                        # turbo: web + desktop
cd apps/web && npm run dev         # web only
cd apps/desktop && npm run tauri dev   # desktop only

# Type-check / lint everything
npm run lint
cd apps/web && npx tsc --noEmit
cd apps/desktop && npx tsc --noEmit
cd apps/desktop/src-tauri && cargo check

# Build for production
npm run build                      # turbo build (both apps)

# Apply DB migrations
supabase db push

# Tag a desktop release (after bumping versions in the 4 files)
git tag v0.1.X && git push origin v0.1.X

# Verify a desktop release was signed correctly
curl -sL https://api.github.com/repos/Vizdev19/ProjectAlly/releases/latest \
  | python3 -c "import json,sys; r=json.load(sys.stdin); [print(a['name']) for a in r['assets']]"
# Should include .sig files alongside each artifact + latest.json
```
