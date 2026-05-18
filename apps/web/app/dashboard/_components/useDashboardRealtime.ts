"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to Supabase Realtime changes for the org's tracking sessions and
 * screenshots, and triggers a server-component re-fetch (via router.refresh())
 * whenever something relevant changes. Lets the admin dashboard reflect:
 *   - employees starting / pausing / ending tracking sessions
 *   - employees approving captures (pending → approved)
 *
 * The Realtime publication is enabled in migration 001 for both tables. RLS
 * still applies on the re-fetch, so an admin only ever sees what they're
 * allowed to see — Realtime is just the "wake up, the data changed" signal.
 *
 * Cleans up on unmount and on orgId change so route navigation doesn't leak
 * a subscription.
 */
export function useDashboardRealtime(orgId: string) {
  const router = useRouter();

  useEffect(() => {
    if (!orgId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`dashboard:${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tracking_sessions",
          filter: `org_id=eq.${orgId}`,
        },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          // INSERTs on screenshots are always status='pending' which RLS hides
          // from admins. UPDATEs are the interesting case: pending → approved
          // makes a row newly visible.
          event: "UPDATE",
          schema: "public",
          table: "screenshots",
          filter: `org_id=eq.${orgId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orgId, router]);
}
