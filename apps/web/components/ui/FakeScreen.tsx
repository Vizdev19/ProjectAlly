"use client";

type ScreenKind = "figma" | "linear" | "email" | "bank" | "code" | "slack" | "sheet" | "terminal" | "notion" | "doc" | "photo";

interface FakeScreenProps {
  kind: ScreenKind;
  style?: React.CSSProperties;
}

const TrafficLights = ({ bg }: { bg: string }) => (
  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF5F57" }} />
    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#FEBC2E" }} />
    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#28C840" }} />
  </div>
);

function FigmaScreen() {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#F4F0FA", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 18, background: "#E8E2F0", display: "flex", alignItems: "center", paddingLeft: 6, gap: 8 }}>
        <TrafficLights bg="#E8E2F0" />
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#D8D0EC" }} />
      </div>
      <div style={{ display: "flex", flex: 1 }}>
        <div style={{ width: 28, background: "#2C2438", display: "flex", flexDirection: "column", gap: 6, padding: "6px 4px" }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ width: 20, height: 20, borderRadius: 4, background: i === 0 ? "linear-gradient(135deg,#FF8A4C,#FF4A8E)" : "rgba(255,255,255,0.12)" }} />
          ))}
        </div>
        <div style={{ width: 36, background: "#1F1830", padding: "4px 2px", display: "flex", flexDirection: "column", gap: 3 }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ height: 10, borderRadius: 3, background: i === 1 ? "rgba(91,108,255,0.4)" : "rgba(255,255,255,0.08)", margin: "0 2px" }} />
          ))}
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: 6 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ borderRadius: 4, background: i % 2 === 0 ? "#EBE5F8" : "#F8F4FF", border: "1px solid rgba(178,84,232,0.15)" }} />
          ))}
        </div>
        <div style={{ width: 40, background: "#F0EDE8", padding: "4px 2px", display: "flex", flexDirection: "column", gap: 3 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ height: 8, borderRadius: 3, background: "rgba(26,20,36,0.12)", margin: "0 2px" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LinearScreen() {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#1F1B2E", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 18, background: "#2A2440", display: "flex", alignItems: "center", paddingLeft: 6, gap: 8 }}>
        <TrafficLights bg="#2A2440" />
        <div style={{ flex: 1, height: 7, borderRadius: 4, background: "#3A3054" }} />
      </div>
      <div style={{ display: "flex", flex: 1 }}>
        <div style={{ width: 40, background: "#16122A", display: "flex", flexDirection: "column", gap: 2, padding: "6px 4px" }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 9, borderRadius: 3, background: i === 1 ? "rgba(91,108,255,0.5)" : "rgba(255,255,255,0.08)", margin: "0 2px" }} />
          ))}
        </div>
        <div style={{ flex: 1, padding: "4px 6px", display: "flex", flexDirection: "column", gap: 3 }}>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ height: 9, borderRadius: 3, background: i === 2 ? "rgba(91,108,255,0.2)" : "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", paddingLeft: 4, gap: 3 }}>
              <div style={{ width: 5, height: 5, borderRadius: 2, background: ["#FF4A8E", "#5B6CFF", "#3DC9B3", "#F4B740", "#B254E8", "#FF8A4C", "#5B6CFF"][i], flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmailScreen() {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 18, background: "#F0EDE6", display: "flex", alignItems: "center", paddingLeft: 6, gap: 8 }}>
        <TrafficLights bg="#F0EDE6" />
        <div style={{ flex: 1, height: 7, borderRadius: 4, background: "#E0DDD8" }} />
      </div>
      <div style={{ display: "flex", flex: 1 }}>
        <div style={{ width: 40, background: "#F7F5F0", borderRight: "1px solid #EDE8E0", display: "flex", flexDirection: "column", gap: 2, padding: "4px 2px" }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ height: 8, borderRadius: 3, background: i === 0 ? "rgba(61,201,179,0.3)" : "rgba(26,20,36,0.08)", margin: "0 2px" }} />
          ))}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ height: 14, background: "#F7F5F0", borderBottom: "1px solid #EDE8E0", display: "flex", alignItems: "center", paddingLeft: 4, gap: 4 }}>
            <div style={{ width: 28, height: 7, borderRadius: 3, background: "#3DC9B3", opacity: 0.7 }} />
          </div>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ height: 14, borderBottom: "1px solid rgba(26,20,36,0.06)", display: "flex", alignItems: "center", paddingLeft: 4, gap: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: ["#3DC9B3", "#5B6CFF", "#FF8A4C", "#B254E8"][i], flexShrink: 0 }} />
              <div style={{ height: 5, flex: 1, borderRadius: 3, background: "rgba(26,20,36,0.1)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BankScreen() {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 22, background: "#0B7B3A", display: "flex", alignItems: "center", paddingLeft: 6, gap: 8 }}>
        <TrafficLights bg="#0B7B3A" />
        <div style={{ flex: 1, height: 7, borderRadius: 4, background: "rgba(255,255,255,0.2)" }} />
      </div>
      <div style={{ padding: "6px 8px", display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ height: 12, width: 60, borderRadius: 3, background: "rgba(11,123,58,0.15)" }} />
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, height: 12, borderBottom: "1px solid rgba(26,20,36,0.06)", paddingBottom: 3 }}>
            <div style={{ height: 7, flex: 1, borderRadius: 3, background: "rgba(26,20,36,0.08)" }} />
            <div style={{ height: 7, width: 24, borderRadius: 3, background: i % 2 === 0 ? "rgba(11,123,58,0.25)" : "rgba(196,28,60,0.15)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CodeScreen() {
  const colors = ["#FF4A8E", "#5B6CFF", "#3DC9B3", "#FF8A4C", "#B254E8", "#F4B740", "#3DC9B3", "#FF4A8E"];
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0F0B17", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 18, background: "#1E1830", display: "flex", alignItems: "center", paddingLeft: 6, gap: 8 }}>
        <TrafficLights bg="#1E1830" />
        <div style={{ flex: 1, height: 7, borderRadius: 4, background: "#2E2840" }} />
      </div>
      <div style={{ flex: 1, padding: "4px 6px", display: "flex", flexDirection: "column", gap: 2 }}>
        {colors.map((c, i) => (
          <div key={i} style={{ height: 7, borderRadius: 3, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 3 }}>
            <div style={{ width: Math.random() * 20 + 8, height: 4, borderRadius: 2, background: c, opacity: 0.7, flexShrink: 0 }} />
            <div style={{ height: 4, flex: 1, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SlackScreen() {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 18, background: "#F0EDE6", display: "flex", alignItems: "center", paddingLeft: 6, gap: 8 }}>
        <TrafficLights bg="#F0EDE6" />
        <div style={{ flex: 1, height: 7, borderRadius: 4, background: "#E0DDD8" }} />
      </div>
      <div style={{ display: "flex", flex: 1 }}>
        <div style={{ width: 38, background: "#3D1A50", display: "flex", flexDirection: "column", gap: 2, padding: "4px 3px" }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 8, borderRadius: 3, background: i === 1 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)", margin: "0 2px" }} />
          ))}
        </div>
        <div style={{ flex: 1, padding: "4px 6px", display: "flex", flexDirection: "column", gap: 5 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: ["#FF8A4C", "#5B6CFF", "#3DC9B3"][i], flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ height: 5, width: 24, borderRadius: 2, background: "rgba(26,20,36,0.2)" }} />
                <div style={{ height: 5, borderRadius: 2, background: "rgba(26,20,36,0.08)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SheetScreen() {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 18, background: "#E8F5EE", display: "flex", alignItems: "center", paddingLeft: 6, gap: 8 }}>
        <TrafficLights bg="#E8F5EE" />
        <div style={{ height: 7, width: 50, borderRadius: 4, background: "rgba(11,123,58,0.2)" }} />
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gridTemplateRows: "repeat(6, 1fr)", gap: 1, padding: 2, background: "#E0E0E0" }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{ background: i < 5 ? "rgba(11,123,58,0.12)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ height: 4, width: "65%", borderRadius: 2, background: i < 5 ? "rgba(11,123,58,0.3)" : "rgba(26,20,36,0.1)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TerminalScreen() {
  const lines = ["#3DC9B3", "#5B6CFF", "#fff", "#FF4A8E", "#3DC9B3", "#B254E8", "#fff", "#3DC9B3"];
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0B0915", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 18, background: "#1E1830", display: "flex", alignItems: "center", paddingLeft: 6, gap: 8 }}>
        <TrafficLights bg="#1E1830" />
        <div style={{ flex: 1, height: 7, borderRadius: 4, background: "#2E2840" }} />
      </div>
      <div style={{ flex: 1, padding: "4px 6px", display: "flex", flexDirection: "column", gap: 3 }}>
        {lines.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ height: 4, width: 8, borderRadius: 2, background: "#3DC9B3", opacity: 0.6, flexShrink: 0 }} />
            <div style={{ height: 4, flex: 1, borderRadius: 2, background: c, opacity: 0.35 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function NotionScreen() {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FBFAF7", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 18, background: "#F0EDE6", display: "flex", alignItems: "center", paddingLeft: 6, gap: 8 }}>
        <TrafficLights bg="#F0EDE6" />
        <div style={{ flex: 1, height: 7, borderRadius: 4, background: "#E0DDD8" }} />
      </div>
      <div style={{ display: "flex", flex: 1 }}>
        <div style={{ width: 40, background: "#F0EDE6", borderRight: "1px solid #E0DDD8", display: "flex", flexDirection: "column", gap: 2, padding: "4px 2px" }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 7, borderRadius: 3, background: i === 1 ? "rgba(26,20,36,0.2)" : "rgba(26,20,36,0.08)", margin: "0 2px" }} />
          ))}
        </div>
        <div style={{ flex: 1, padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ height: 12, width: "70%", borderRadius: 3, background: "rgba(26,20,36,0.18)" }} />
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ height: 6, borderRadius: 2, background: "rgba(26,20,36,0.08)", width: i === 2 ? "55%" : "90%" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DocScreen() {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FBF7EE", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 18, background: "#EEE8DC", display: "flex", alignItems: "center", paddingLeft: 6, gap: 8 }}>
        <TrafficLights bg="#EEE8DC" />
        <div style={{ flex: 1, height: 7, borderRadius: 4, background: "#DDD8CC" }} />
      </div>
      <div style={{ flex: 1, padding: "8px 16px", display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ height: 10, width: "60%", borderRadius: 3, background: "rgba(26,20,36,0.2)" }} />
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ height: 5, borderRadius: 2, background: "rgba(26,20,36,0.1)", width: [92, 85, 78, 90, 60, 82][i] + "%" }} />
        ))}
      </div>
    </div>
  );
}

function PhotoScreen() {
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #FF8A4C 0%, #FF4A8E 50%, #B254E8 100%)", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 18, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", paddingLeft: 6, gap: 8 }}>
        <TrafficLights bg="transparent" />
      </div>
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.3)" }} />
        <div style={{ position: "absolute", bottom: 12, right: 16, width: 30, height: 25, borderRadius: 6, background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.3)" }} />
        <div style={{ position: "absolute", top: 10, left: 10, width: 25, height: 20, borderRadius: 5, background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.25)" }} />
      </div>
    </div>
  );
}

export default function FakeScreen({ kind, style }: FakeScreenProps) {
  const map: Record<ScreenKind, React.ReactNode> = {
    figma: <FigmaScreen />,
    linear: <LinearScreen />,
    email: <EmailScreen />,
    bank: <BankScreen />,
    code: <CodeScreen />,
    slack: <SlackScreen />,
    sheet: <SheetScreen />,
    terminal: <TerminalScreen />,
    notion: <NotionScreen />,
    doc: <DocScreen />,
    photo: <PhotoScreen />,
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: "inherit", ...style }}>
      {map[kind]}
    </div>
  );
}
