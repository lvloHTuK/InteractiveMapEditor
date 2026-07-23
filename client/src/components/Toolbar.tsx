import type { Tool } from "../types";

const TOOLS: { id: Tool; label: string; hint: string }[] = [
  { id: "select", label: "🖱 Select / Pan", hint: "Click to select, drag to pan, scroll to zoom" },
  { id: "road", label: "🛣 Draw Road", hint: "Click to add points, double-click or Enter to finish, Esc to cancel" },
  { id: "base", label: "★ Base", hint: "Click on the map to place a base" },
  { id: "warehouse", label: "▲ Warehouse", hint: "Click on the map to place a warehouse" },
  { id: "village", label: "● Village", hint: "Click on the map to place a village" },
  { id: "poi", label: "◆ Point of Interest", hint: "Click on the map to place a point of interest" },
];

export default function Toolbar({
  tool,
  onChange,
  readOnly,
}: {
  tool: Tool;
  onChange: (t: Tool) => void;
  readOnly: boolean;
}) {
  const visibleTools = readOnly ? TOOLS.filter((t) => t.id === "select") : TOOLS;
  const active = visibleTools.find((t) => t.id === tool);
  return (
    <div
      style={{
        width: 190,
        borderRight: "1px solid var(--border)",
        background: "var(--panel)",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {visibleTools.map((t) => (
        <button
          key={t.id}
          className={tool === t.id ? "active" : ""}
          onClick={() => onChange(t.id)}
          style={{ textAlign: "left" }}
        >
          {t.label}
        </button>
      ))}
      <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 8 }}>
        {readOnly ? "View only — editing is disabled for this map/device." : active?.hint}
      </p>
    </div>
  );
}
