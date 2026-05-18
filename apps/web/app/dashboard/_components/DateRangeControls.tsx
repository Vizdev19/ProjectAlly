"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Date-range picker shared by the dashboard roster and the per-member detail
 * page. Updates the URL with ?from / ?to so the server component can re-render
 * with the new range. Quick buttons (Today / 7d / 30d) for the common cases.
 *
 * `basePath` is the page to navigate to (e.g., "/dashboard" or
 * "/dashboard/members/abc-123") — kept as a prop so the same component works
 * across routes without needing to know the current pathname.
 */
export default function DateRangeControls({
  range,
  basePath,
}: {
  range: { from: string; to: string };
  basePath: string;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);

  function apply(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams();
    params.set("from", nextFrom);
    params.set("to", nextTo);
    router.push(`${basePath}?${params.toString()}`);
  }

  function quickRange(daysBack: number) {
    const now = new Date();
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - daysBack);
    const startYmd = start.toISOString().slice(0, 10);
    const endYmd = now.toISOString().slice(0, 10);
    setFrom(startYmd);
    setTo(endYmd);
    apply(startYmd, endYmd);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "5px 10px" }}>
        <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>From</span>
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => {
            setFrom(e.target.value);
            if (e.target.value) apply(e.target.value, to);
          }}
          style={{ border: "none", background: "transparent", fontSize: 13, color: "var(--ink)", outline: "none", fontFamily: "inherit" }}
        />
        <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 4 }}>To</span>
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => {
            setTo(e.target.value);
            if (e.target.value) apply(from, e.target.value);
          }}
          style={{ border: "none", background: "transparent", fontSize: 13, color: "var(--ink)", outline: "none", fontFamily: "inherit" }}
        />
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        {[
          { label: "Today", days: 0 },
          { label: "7d",    days: 6 },
          { label: "30d",   days: 29 },
        ].map((q) => (
          <button
            key={q.label}
            onClick={() => quickRange(q.days)}
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 12, fontWeight: 600, color: "var(--ink-2)", cursor: "pointer" }}
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
}
