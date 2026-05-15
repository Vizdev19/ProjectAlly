"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInvite } from "@/lib/auth/actions";
import { destinationForMember } from "@/lib/auth/redirect";

export default function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await acceptInvite(token);
      if (result.error) { setError(result.error); return; }
      router.push(destinationForMember(result.role as "admin" | "employee" | undefined));
      router.refresh();
    });
  }

  return (
    <>
      {error && (
        <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "var(--danger-bg)", border: "1px solid rgba(196,28,60,0.2)", fontSize: 13, color: "var(--danger)" }}>
          {error}
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={isPending}
        style={{
          width: "100%", padding: "13px", borderRadius: 12, background: "var(--brand-grad)",
          color: "#fff", fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer",
          boxShadow: "0 6px 20px -4px rgba(178,84,232,0.4)",
        }}
      >
        {isPending ? "Joining…" : "Accept invitation →"}
      </button>
    </>
  );
}
