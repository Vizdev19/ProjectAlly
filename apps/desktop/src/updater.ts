import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

/**
 * Fire once on app boot. Asks the updater endpoint
 * (configured in tauri.conf.json) whether a newer signed release is
 * available; if so, prompts the user, downloads + verifies + installs,
 * then relaunches.
 *
 * Failures are swallowed (network down, endpoint 404, signature mismatch)
 * because none of them should block the user from using the app.
 *
 * Skipped in `tauri dev` so we don't prompt every restart while the
 * local version is presumed to be the "newest" anyway.
 */
export async function checkForUpdates(): Promise<void> {
  if (import.meta.env.DEV) return;

  try {
    const update = await check();
    if (!update?.available) return;

    const proceed = window.confirm(
      `AllyTracker ${update.version} is available ` +
      `(you're on ${update.currentVersion}).\n\nInstall now?`,
    );
    if (!proceed) return;

    await update.downloadAndInstall();
    await relaunch();
  } catch (err) {
    console.warn("[updater] check failed:", err);
  }
}
