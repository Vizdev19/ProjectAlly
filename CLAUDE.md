# Working in this repo (notes for AI assistants)

See [README.md](README.md) for the full project overview, tech stack, setup, and
data flow. This file is the opinionated, action-oriented complement — what to do,
what not to do, and which traps already bit us once.

## The non-obvious essentials

- **Next.js 16, not what you trained on.** The framework renamed `middleware.ts`
  to `proxy.ts` (root file, exports a function named `proxy`). Read
  `apps/web/AGENTS.md` and consult `node_modules/next/dist/docs/` before assuming
  any v13–v15 pattern still works. The folder structure, server/client component
  rules, and config helpers all have subtle v16 differences.
- **Server vs Client split:**
  - `apps/web/lib/actions/*.ts` → Server Actions (`"use server"` at top)
  - `apps/web/lib/data/*.ts` → read paths used from server components
  - `apps/web/lib/supabase/server.ts` vs `client.ts` — pick the right one
- **Desktop is two languages.** TS/React under `apps/desktop/src/`, Rust under
  `apps/desktop/src-tauri/src/`. They talk via `invoke()` (JS → Rust commands)
  and `app.emit()` / event listeners (Rust → JS). The `register_session` command
  pattern is how Rust gets the Supabase tokens.

## Commits + releases

- Conventional commit format: `fix(scope): ...`, `feat(scope): ...`,
  `chore(scope): ...`. One logical change per commit. Co-author trailer is fine.
- Git identity for this repo: **Vishnu Prasath <vishnuprasath100@gmail.com>**.
  Pass it explicitly: `git -c user.name="Vishnu Prasath" -c user.email="vishnuprasath100@gmail.com" commit -m "..."`
- **Desktop version bump means FOUR files** (it has burned us — v0.1.3 shipped
  with 0.1.2 filenames):
  1. `apps/desktop/package.json`
  2. `apps/desktop/src-tauri/Cargo.toml`
  3. `apps/desktop/src-tauri/tauri.conf.json`
  4. `apps/desktop/src-tauri/Cargo.lock` (the `name = "ally-tracker-desktop"` block)
- Tags trigger releases. `git tag v0.1.X && git push origin v0.1.X` kicks off the
  full cross-platform build + sign + publish workflow.

## Things that have specifically bitten us — don't redo them

| Trap | Where it lives | Right move |
|---|---|---|
| Reading `${{ secrets.NEXT_PUBLIC_X }}` instead of `${{ vars.X }}` | `.github/workflows/desktop-build.yml` | These are Variables (public client values), not Secrets |
| `bundle.createUpdaterArtifacts` missing → no `.sig` files generated | `tauri.conf.json` | Must be `true` for signing pipeline to work |
| Invalid plugin config under `plugins.X` in `tauri.conf.json` | e.g., `plugins.autostart.args` | Most Tauri plugins take **no** JSON config; pass args via Rust `init()` |
| `TrayIconBuilder::new()` without `.icon(...)` panics on launch | `apps/desktop/src-tauri/src/tray.rs` | Always `.icon(Image::from_bytes(include_bytes!(...)))` |
| `.expect()` at the top-level `.run()` swallows real error → opaque `SIGABRT` | `lib.rs` | Use `.unwrap_or_else(\|e\| { eprintln!("[fatal] ..."); exit(1) })` |
| Closing the Tauri window on Windows kills the whole app | `lib.rs` setup | Intercept `WindowEvent::CloseRequested` → `prevent_close` + `hide` |
| `strings binary | grep` to verify env vars baked in | (manual debug) | Tauri compresses bundled JS — `strings` won't see URLs. Use a workflow diagnostic step that prints `${#VAR}` instead |
| `createClient("", "")` from supabase-js throws on module load → blank window | `apps/desktop/src/supabase.ts` | Already wrapped in try/catch + Proxy stub. Don't unwrap it. |

## RLS + privacy model (critical to preserve)

- Every screenshot lives in **two states**:
  - `pending` in `private-screenshots` bucket — only the employee sees it
  - `approved` in `submitted-screenshots` bucket — admin can also see it
- RLS policy `"admins read approved screenshots"` explicitly requires
  `status = 'approved'`. Admins should **never** be able to see `pending` or
  `removed` rows. If you're writing a query or RPC that reads `screenshots`
  for an admin context, double-check this isn't accidentally relaxed.
- The `members_prevent_self_escalation` trigger blocks any user from changing
  their own role/org_id/user_id. Don't bypass it with a security-definer RPC
  without thinking hard.
- Migration 003 added `auth_member()`, `auth_org_id()`, `auth_is_admin()` as
  **SECURITY DEFINER** with `set search_path`. Don't drop those flags.

## When the user asks for an audit / bug fix

1. **Verify before claiming.** The Explore agent reads excerpts and confidently
   states wrong things. Always re-read the actual file before reporting an
   issue exists. This thread previously had three "CRITICAL RLS bypass" claims
   that were false on inspection.
2. **Diagnostic over speculation.** When a Tauri app crashed at startup, an
   `eprintln` in the right place answered in one cycle what three hours of
   hypothesizing couldn't. Add stderr/log diagnostics liberally; remove once
   the cause is known.
3. **Multi-file fixes go in one commit if they're logically one change**
   (e.g., a schema addition + the code that uses it). Otherwise prefer
   one-commit-per-fix.

## Quick context loaders

If a fresh agent needs to get up to speed:

- `README.md` → full system overview
- `supabase/migrations/` (in order) → data model + security model
- `apps/web/proxy.ts` → all routing/auth redirects
- `apps/web/lib/auth/actions.ts` → sign-in/up, invite, OAuth flows
- `apps/desktop/src-tauri/src/lib.rs` → Tauri setup, plugins, window lifecycle
- `apps/desktop/src-tauri/src/screenshot.rs` → capture + upload pipeline
- `.github/workflows/desktop-build.yml` → release pipeline

## Scenario-specific playbooks

- **User is cloning this repo to push to their own new GitHub remote** →
  `CLAUDE-FORK.md`. Exhaustive checklist of code-level changes (repo URL,
  bundle identifier, signing key regeneration, brand strings) + external
  setup (Supabase, Vercel, GitHub variables). Read it before editing
  anything if the scenario applies.

## Don't do

- Don't add a `middleware.ts` file — it's `proxy.ts` in Next.js 16.
- Don't store `NEXT_PUBLIC_*` values as GitHub Secrets — they're Variables.
- Don't add `--no-verify` to git commits unless the user explicitly asks.
- Don't run destructive git commands (`reset --hard`, `push --force`,
  `branch -D`) without explicit instruction.
- Don't bump only `package.json` for a desktop release — check all four version
  files.
- Don't trust an Explore agent's "this is broken" without reading the file.
