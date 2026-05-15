-- ============================================================
-- Tracking sessions — accurate elapsed time across pauses
-- ============================================================
-- Adds paused_total_seconds so elapsed_seconds can exclude time
-- spent paused. Without this, a session paused overnight counts
-- the pause as tracked time, inflating billable hours.
--
-- Semantics:
--   pause   -> set paused_at = now()
--   resume  -> paused_total_seconds += (now() - paused_at); paused_at = null
--   end     -> if paused, finalize the open pause first; then
--              elapsed_seconds = (now() - started_at) - paused_total_seconds
-- ============================================================

alter table tracking_sessions
  add column if not exists paused_total_seconds integer not null default 0;
