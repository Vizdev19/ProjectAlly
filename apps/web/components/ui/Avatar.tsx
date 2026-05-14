"use client";

interface AvatarProps {
  initials: string;
  color: string;
  size?: number;
  ring?: string;
}

export default function Avatar({ initials, color, size = 36, ring }: AvatarProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 600,
        fontSize: size * 0.38,
        letterSpacing: "0.01em",
        flexShrink: 0,
        border: ring ? `2px solid ${ring}` : "none",
        boxSizing: "border-box",
      }}
    >
      {initials}
    </div>
  );
}
