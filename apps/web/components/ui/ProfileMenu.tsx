"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { signOut } from "@/lib/auth/actions";

type Variant = "sidebar" | "topbar";

type Me = { full_name: string; avatar_color: string };

function initialsOf(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

/**
 * Profile button + popover menu with sign-out. Shared by:
 *   - "sidebar" variant — full-width button (avatar + name + chevron), popover
 *     opens upward. Used at the bottom of vertical sidebars (admin dashboard,
 *     employee app).
 *   - "topbar" variant — avatar-only circular button, popover opens downward
 *     and right-aligned. Used in horizontal topbars (team page, member detail).
 *
 * Closes on outside click or Escape; listeners only attach while open.
 */
export default function ProfileMenu({
  me,
  variant = "sidebar",
}: {
  me: Me;
  variant?: Variant;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isTopbar = variant === "topbar";

  const menuStyle: React.CSSProperties = {
    position: "absolute",
    background: "var(--bg)",
    border: "1px solid var(--line)",
    borderRadius: 10,
    padding: 4,
    boxShadow: "0 8px 24px -6px rgba(26,20,36,0.15)",
    zIndex: 10,
    minWidth: 160,
    ...(isTopbar
      ? { top: "calc(100% + 6px)", right: 0 }
      : { bottom: "calc(100% + 6px)", left: 0, right: 0 }),
  };

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        // Topbar variant is a discrete circular button — inline-block keeps it
        // from stretching across the topbar. Sidebar variant fills its column.
        display: isTopbar ? "inline-block" : "block",
      }}
    >
      {open && (
        <div role="menu" style={menuStyle}>
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 7,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--danger)",
                textAlign: "left",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span aria-hidden style={{ fontSize: 14 }}>↩</span>
              <span>Sign out</span>
            </button>
          </form>
        </div>
      )}

      {isTopbar ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`Profile menu for ${me.full_name}`}
          style={{
            display: "inline-flex",
            padding: 0,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            borderRadius: "50%",
            outline: open ? "2px solid var(--g-magenta)" : "none",
            outlineOffset: 2,
          }}
        >
          <Avatar initials={initialsOf(me.full_name)} color={me.avatar_color} size={34} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            borderRadius: 9,
            background: open ? "var(--surface-2)" : "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <Avatar initials={initialsOf(me.full_name)} color={me.avatar_color} size={26} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "left" }}>
            {me.full_name}
          </span>
          <span aria-hidden style={{ fontSize: 11, color: "var(--muted)" }}>{open ? "▾" : "⋯"}</span>
        </button>
      )}
    </div>
  );
}
