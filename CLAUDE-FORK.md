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

### 4a — Supabase project + migrations

1. Create a new Supabase project.
2. Run all four migrations in order against the new database:
   ```bash
   cd supabase && supabase link --project-ref <new-project-ref>
   supabase db push
   ```
   (Or paste them into the SQL editor.)
3. Verify storage buckets `private-screenshots` and `submitted-screenshots`
   were created (migration 001 inserts them).
4. Verify the security-definer helpers exist: `auth_member()`,
   `auth_org_id()`, `auth_is_admin()`. RLS policies depend on them.
5. Verify the realtime publication has both tables — the dashboard's live
   updates need them:
   ```sql
   select pubname, tablename from pg_publication_tables
   where pubname = 'supabase_realtime';
   -- expect rows for tracking_sessions and screenshots
   ```
6. Grab the project URL + anon key from Settings → API.

### 4b — Supabase Auth URL configuration (CRITICAL — easy to miss)

The web app uses `emailRedirectTo: ${NEXT_PUBLIC_APP_URL}/auth/callback` for
sign-up confirmation emails and the same URL for OAuth redirects. If the new
Supabase project doesn't know about the new Vercel URL, **every email
confirmation link redirects to localhost and every OAuth flow fails with
`redirect_uri_mismatch`**.

Supabase dashboard → Authentication → URL Configuration:

| Field | Value |
|---|---|
| Site URL | `https://<your-app>.vercel.app` (the new Vercel production URL) |
| Redirect URLs | Add `https://<your-app>.vercel.app/auth/callback` AND `http://localhost:3000/auth/callback` (for local dev) |

If you skip this, sign-up appears to work locally but breaks in production
the first time a user clicks a confirmation email.

### 4c — Supabase OAuth providers (optional, but the UI shows the buttons)

The sign-in and sign-up pages render Google and Microsoft (Azure) SSO buttons
unconditionally — `apps/web/app/(auth)/sign-in/page.tsx` and the matching
sign-up page. If the providers aren't configured in Supabase, clicking the
button surfaces a vague error and the user is stuck.

Two options:

**A. Configure the providers** — Supabase dashboard → Authentication →
Providers → enable Google + Azure. Each needs:
- A Google Cloud / Azure AD app registration on your account
- Client ID + Client Secret pasted into Supabase
- Authorized redirect URI on the provider side: `https://<supabase-project-ref>.supabase.co/auth/v1/callback`

**B. Hide the buttons** — if you don't want SSO, remove the `<SSOButton>`
blocks from both pages. Don't leave them as dead UI.

### 4d — GitHub repo configuration

**Repository Variables** (Settings → Secrets and variables → Actions → Variables):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | From Section 4a |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Section 4a |
| `NEXT_PUBLIC_APP_URL` | New Vercel production URL (Section 4e) |

**Repository Secrets** (same screen, Secrets tab):

| Name | Value |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | Base64 of the file from Section 3a |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Whatever password they set during keygen (omit secret entirely if no password) |

Heads up: the workflow reads `NEXT_PUBLIC_*` from **`vars.`** not `secrets.`
([desktop-build.yml](.github/workflows/desktop-build.yml) explicitly uses
`${{ vars.X }}`). It's easy to put values in the wrong store.

### 4e — Vercel

1. Import the new GitHub repo.
2. Root directory: `.` (the monorepo root). `vercel.json` already tells Vercel
   to install from the root and build from `apps/web`.
3. Set the same `NEXT_PUBLIC_*` env vars in the Vercel dashboard (Settings →
   Environment Variables). Optionally `RESEND_API_KEY` and `GITHUB_API_TOKEN`.
4. Deploy. The URL becomes the new `NEXT_PUBLIC_APP_URL` — go back to
   Section 4b and add it to Supabase Auth's Site URL + Redirect URLs.

### 4f — Resend (invite emails)

The `createInvite` flow sends an email via Resend. Without an API key, the
invite is still created and the admin can copy the link manually from the
team page, but no email goes out. To wire it up:

1. Sign up at [resend.com](https://resend.com), grab an API key.
2. Set `RESEND_API_KEY` in Vercel env vars.
3. Optionally set `RESEND_FROM`. Default is `AllyTracker <onboarding@resend.dev>`
   — **change this** to your product name + a verified sending domain
   (e.g. `Acme Tracker <invites@acmetracker.com>`). Sending from
   `@resend.dev` works for testing but recipients see "via resend.dev" and
   inboxes treat it as suspicious at scale.
4. Update the invite email subject + body if needed:
   `apps/web/lib/email/templates/invite.ts`. The default mentions
   "AllyTracker"; brand it for the new product.

### 4g — Optional: Apple / Windows code signing

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

## Section 6 — How releases work once the fork is set up

The release pipeline (`.github/workflows/desktop-build.yml`) uses
`${{ github }}` context variables, so it auto-targets whichever repo it runs
in. Nothing in the workflow needs editing for the fork — Sections 1–4 above
are enough.

### The flow, end to end

1. **Bump version** in all four files (this thread had a v0.1.3 incident
   from forgetting one):
   - `apps/desktop/package.json`
   - `apps/desktop/src-tauri/Cargo.toml`
   - `apps/desktop/src-tauri/tauri.conf.json`
   - `apps/desktop/src-tauri/Cargo.lock` (the `[[package]] name = "<crate>"` block)
2. **Commit + push** to `main`.
3. **Tag and push the tag:**
   ```bash
   git tag v0.1.X
   git push origin v0.1.X
   ```
4. ~5–8 minutes later, GitHub Actions has published a release containing
   `.app.tar.gz` (macOS arm + x64), `.msi` + `.exe` (Windows), matching `.sig`
   files for each, and a `latest.json` manifest.

### First release vs everything after

| | First release (v0.1.0) | Every later release |
|---|---|---|
| How users get it | Manually from the `/download` page | Auto-update prompt on app launch |
| macOS Gatekeeper | Requires `xattr -dr com.apple.quarantine` on first install | Bypassed — auto-update fetches in-process, no Chrome quarantine flag |
| Windows SmartScreen | "More info → Run anyway" | Bypassed for the same reason |
| Signature verification | None (this *is* the trust anchor) | Verified against the pubkey embedded at install time |

### The one rule that cannot be broken

**The Tauri signing keypair must stay stable across every release of the
same product.** The pubkey baked into v0.1.0 installs is what those installs
use to verify every future update. If the key is regenerated mid-life:

- Every previously-installed copy will silently refuse updates (signature
  mismatch) and stay stuck on whatever version they had
- There is no recovery path without each user manually reinstalling

If a key ever needs to be rotated: stash the old key, generate the new one,
ship a transition release built with the OLD key that swaps in the new
pubkey (so existing installs accept it), then switch to signing with the new
key. In practice nobody does this — back up the key file the moment you
generate it.

### Verifying a release actually shipped correctly

```bash
curl -sL https://api.github.com/repos/<owner>/<repo>/releases/latest \
  | python3 -c "import json,sys; r=json.load(sys.stdin); \
print('tag:', r['tag_name']); print('draft:', r['draft']); \
[print(' -', a['name']) for a in r['assets']]"
```

Healthy output includes **one `.sig` file per artifact** plus a `latest.json`.
If `latest.json` is missing, signing silently failed during the build — the
diagnostic step pattern from this thread is:

```yaml
- name: Diagnose signing secrets
  env:
    TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
  run: echo "key length=${#TAURI_SIGNING_PRIVATE_KEY}"
```

A length of 0 means the secret isn't reaching the workflow (check spelling
in the secret name). A length matching the raw key file but no signing in
the logs usually means newline mangling — base64-encode the key file
(`base64 -i ~/.tauri/key.key | pbcopy`) and re-paste.

### Common first-release mistakes

- **Filename version drift**: tag is `v0.1.0` but artifacts show `_0.0.1_`
  because someone forgot to update one of the four version files. Tauri uses
  `tauri.conf.json`'s `version` for filenames; Git uses the tag. They must
  match.
- **Pubkey not yet set when tagging**: the workflow builds and signs, but
  the updater plugin loads with an empty pubkey at install time, so every
  later release will fail verification on these installs. Always paste the
  pubkey into `tauri.conf.json` before the first tag push.
- **Releasing as a draft**: `releaseDraft: false` is set in the workflow.
  If someone flips it to `true`, the GitHub Releases redirect for
  `/releases/latest/download/latest.json` will skip drafts → updater
  endpoint returns 404 → no auto-update for anyone.

---

## What does NOT need to change

For reassurance — these are stable across forks:

- **Database schema** (`supabase/migrations/*.sql`) — the structure is generic.
  The RLS policies key off `org_id` which is per-tenant, not per-fork.
- **Workflow logic** (`.github/workflows/*.yml`) — uses `${{ github }}` context
  variables that automatically reflect the current repo. Don't hand-edit URLs.
- **Tauri plugin set** — updater, notification, shell, autostart, process. All
  generic.
- **App architecture** — `proxy.ts` routing, server/client split, RLS model.
  Read `CLAUDE.md` and `README.md` for these.
- **`apps/web/CLAUDE.md` and `apps/web/AGENTS.md`** — the Next.js 16 warning
  ("This is NOT the Next.js you know" → read the bundled docs). **Preserve
  these on fork.** Future AI agents hitting the new repo need that hint or
  they'll happily try to rename `proxy.ts` to `middleware.ts` and break
  routing.
- **Migration 004**'s `paused_total_seconds` column and the elapsed-time logic
  that depends on it.
- **`apps/desktop/src/updater.ts`** — the `import.meta.env.DEV` skip makes
  `tauri dev` not nag for updates. Works on any repo.
- **Git commit conventions** — but update the git identity to the new
  project's owner.

---

## Quick mental model for the agent

The codebase has three layers of "old-project-ness":

1. **Functional references** (Sections 2a, 2b, 3a, 4b) — break things if
   not changed. Updater hits wrong endpoint, bundle identifier collides,
   signature verification fails, OAuth redirects to wrong URL.
   **Fix these first.**
2. **Cosmetic references** (Sections 2c, 2d, 2e) — work technically but show
   the wrong brand. Fix in a second pass.
3. **External state** (Section 4) — not in the code at all. Surface to the
   user as prerequisites; don't assume.

Minimum viable fork to ship a working signed release:
**2a + 2b + 3a + 4a + 4b + 4d + Section 6**. That gets you a fork that builds,
signs, releases, and serves auth correctly. Everything else is brand polish or
optional features (OAuth, custom email).
