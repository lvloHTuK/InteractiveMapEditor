import { useState, useEffect } from "react";
import type { MarkerDto, MarkerType, ProjectDetail, RoadDto, Selection } from "../types";
import { MARKER_COLORS, MARKER_LABELS, MARKER_SYMBOLS, markerColor } from "../types";

interface Props {
  project: ProjectDetail;
  selected: Selection;
  onSelect: (s: Selection) => void;
  onRenameRoad: (id: string, label: string) => void;
  onSetRoadStyle: (id: string, patch: { color?: string; width?: number }) => void;
  onDeleteRoad: (id: string) => void;
  onRenameMarker: (id: string, name: string) => void;
  onSetMarkerNotes: (id: string, notes: string) => void;
  onSetMarkerColor: (id: string, color: string | null) => void;
  onUploadMarkerImage: (id: string, file: File) => void;
  onRemoveMarkerImage: (id: string) => void;
  onDeleteMarker: (id: string) => void;
  readOnly: boolean;
}

const MARKER_TYPES: MarkerType[] = ["base", "warehouse", "village", "poi"];

export default function Sidebar({
  project,
  selected,
  onSelect,
  onRenameRoad,
  onSetRoadStyle,
  onDeleteRoad,
  onRenameMarker,
  onSetMarkerNotes,
  onSetMarkerColor,
  onUploadMarkerImage,
  onRemoveMarkerImage,
  onDeleteMarker,
  readOnly,
}: Props) {
  const selectedRoad: RoadDto | undefined =
    selected?.kind === "road" ? project.roads.find((r) => r.id === selected.id) : undefined;
  const selectedMarker: MarkerDto | undefined =
    selected?.kind === "marker" ? project.markers.find((m) => m.id === selected.id) : undefined;

  return (
    <div
      style={{
        width: 280,
        borderLeft: "1px solid var(--border)",
        background: "var(--panel)",
        padding: 12,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {selectedRoad && (
        <RoadEditor
          road={selectedRoad}
          onRename={(label) => onRenameRoad(selectedRoad.id, label)}
          onStyle={(patch) => onSetRoadStyle(selectedRoad.id, patch)}
          onDelete={() => onDeleteRoad(selectedRoad.id)}
          readOnly={readOnly}
        />
      )}
      {selectedMarker && (
        <MarkerEditor
          marker={selectedMarker}
          onRename={(name) => onRenameMarker(selectedMarker.id, name)}
          onNotes={(notes) => onSetMarkerNotes(selectedMarker.id, notes)}
          onColor={(color) => onSetMarkerColor(selectedMarker.id, color)}
          onUploadImage={(file) => onUploadMarkerImage(selectedMarker.id, file)}
          onRemoveImage={() => onRemoveMarkerImage(selectedMarker.id)}
          onDelete={() => onDeleteMarker(selectedMarker.id)}
          readOnly={readOnly}
        />
      )}

      <section>
        <h3 style={{ fontSize: 13, textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 6 }}>
          Roads ({project.roads.length})
        </h3>
        {project.roads.length === 0 && <p style={{ color: "var(--text-dim)", fontSize: 12 }}>No roads yet.</p>}
        {project.roads.map((road, i) => (
          <ListRow
            key={road.id}
            active={selected?.kind === "road" && selected.id === road.id}
            label={road.label || `Road ${i + 1}`}
            color={road.color}
            onClick={() => onSelect({ kind: "road", id: road.id })}
          />
        ))}
      </section>

      {MARKER_TYPES.map((type) => {
        const items = project.markers.filter((m) => m.type === type);
        return (
          <section key={type}>
            <h3 style={{ fontSize: 13, textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 6 }}>
              {MARKER_LABELS[type]}s ({items.length})
            </h3>
            {items.length === 0 && <p style={{ color: "var(--text-dim)", fontSize: 12 }}>None placed yet.</p>}
            {items.map((marker, i) => (
              <ListRow
                key={marker.id}
                active={selected?.kind === "marker" && selected.id === marker.id}
                label={marker.name || `${MARKER_LABELS[type]} ${i + 1}`}
                color={markerColor(marker)}
                symbol={MARKER_SYMBOLS[type]}
                onClick={() => onSelect({ kind: "marker", id: marker.id })}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}

function ListRow({
  label,
  color,
  symbol,
  active,
  onClick,
}: {
  label: string;
  color: string;
  symbol?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 8px",
        borderRadius: 6,
        cursor: "pointer",
        background: active ? "var(--panel-2)" : "transparent",
        border: active ? "1px solid var(--accent)" : "1px solid transparent",
        fontSize: 13,
      }}
    >
      {symbol ? (
        <span style={{ color, width: 16, textAlign: "center" }}>{symbol}</span>
      ) : (
        <span style={{ width: 16, height: 3, background: color, display: "inline-block" }} />
      )}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

function RoadEditor({
  road,
  onRename,
  onStyle,
  onDelete,
  readOnly,
}: {
  road: RoadDto;
  onRename: (label: string) => void;
  onStyle: (patch: { color?: string; width?: number }) => void;
  onDelete: () => void;
  readOnly: boolean;
}) {
  const [label, setLabel] = useState(road.label);
  useEffect(() => setLabel(road.label), [road.id, road.label]);

  return (
    <section style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}>
      <h3 style={{ fontSize: 13, marginBottom: 8 }}>Selected road</h3>
      <label style={{ display: "block", fontSize: 12, color: "var(--text-dim)", marginBottom: 4 }}>Label</label>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => onRename(label)}
        disabled={readOnly}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <label style={{ fontSize: 12, color: "var(--text-dim)" }}>Color</label>
        <input
          type="color"
          value={road.color}
          disabled={readOnly}
          onChange={(e) => onStyle({ color: e.target.value })}
        />
        <label style={{ fontSize: 12, color: "var(--text-dim)" }}>Width</label>
        <input
          type="range"
          min={1}
          max={16}
          value={road.width}
          disabled={readOnly}
          onChange={(e) => onStyle({ width: Number(e.target.value) })}
        />
      </div>
      {!readOnly && (
        <button className="danger" onClick={onDelete} style={{ width: "100%" }}>
          Delete road
        </button>
      )}
    </section>
  );
}

function MarkerEditor({
  marker,
  onRename,
  onNotes,
  onColor,
  onUploadImage,
  onRemoveImage,
  onDelete,
  readOnly,
}: {
  marker: MarkerDto;
  onRename: (name: string) => void;
  onNotes: (notes: string) => void;
  onColor: (color: string | null) => void;
  onUploadImage: (file: File) => void;
  onRemoveImage: () => void;
  onDelete: () => void;
  readOnly: boolean;
}) {
  const [name, setName] = useState(marker.name);
  const [notes, setNotes] = useState(marker.notes);
  useEffect(() => {
    setName(marker.name);
    setNotes(marker.notes);
  }, [marker.id, marker.name, marker.notes]);

  return (
    <section style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}>
      <h3 style={{ fontSize: 13, marginBottom: 8 }}>
        Selected {MARKER_LABELS[marker.type].toLowerCase()}
      </h3>
      <label style={{ display: "block", fontSize: 12, color: "var(--text-dim)", marginBottom: 4 }}>Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => onRename(name)}
        disabled={readOnly}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <label style={{ display: "block", fontSize: 12, color: "var(--text-dim)", marginBottom: 4 }}>Notes</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => onNotes(notes)}
        rows={3}
        disabled={readOnly}
        style={{ width: "100%", marginBottom: 8, resize: "vertical" }}
      />

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <label style={{ fontSize: 12, color: "var(--text-dim)" }}>Color</label>
        <input
          type="color"
          value={marker.color ?? MARKER_COLORS[marker.type]}
          disabled={readOnly}
          onChange={(e) => onColor(e.target.value)}
        />
        {marker.color && !readOnly && (
          <button onClick={() => onColor(null)} style={{ fontSize: 12 }}>
            Reset to default
          </button>
        )}
      </div>

      <label style={{ display: "block", fontSize: 12, color: "var(--text-dim)", marginBottom: 4 }}>Image</label>
      {marker.imageUrl && (
        <img
          src={marker.imageUrl}
          alt=""
          style={{ maxWidth: "100%", maxHeight: 120, display: "block", borderRadius: 4, marginBottom: 6 }}
        />
      )}
      {!readOnly && (
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadImage(file);
              e.target.value = "";
            }}
          />
          {marker.imageUrl && (
            <button className="danger" onClick={onRemoveImage} style={{ fontSize: 12 }}>
              Remove image
            </button>
          )}
        </div>
      )}

      {!readOnly && (
        <button className="danger" onClick={onDelete} style={{ width: "100%" }}>
          Delete {MARKER_LABELS[marker.type].toLowerCase()}
        </button>
      )}
    </section>
  );
}
