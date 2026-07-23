import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Circle, Image as KonvaImage, Label, Layer, Line, Stage, Tag, Text } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { MarkerDto, MarkerType, Point, ProjectDetail, Selection, Tool } from "../types";
import { MARKER_LABELS, MARKER_SYMBOLS, markerColor } from "../types";

interface Props {
  project: ProjectDetail;
  tool: Tool;
  selected: Selection;
  onSelect: (s: Selection) => void;
  onRoadDraftComplete: (points: Point[]) => void;
  onRoadPointsChange: (roadId: string, points: Point[], persist: boolean) => void;
  onMarkerCreate: (type: MarkerType, x: number, y: number) => void;
  onMarkerMove: (markerId: string, x: number, y: number, persist: boolean) => void;
  readOnly: boolean;
}

const MARKER_TOOLS = new Set(["base", "warehouse", "village", "poi"]);

function flatten(points: Point[]): number[] {
  return points.flatMap((p) => [p.x, p.y]);
}

export default function MapCanvas({
  project,
  tool,
  selected,
  onSelect,
  onRoadDraftComplete,
  onRoadPointsChange,
  onMarkerCreate,
  onMarkerMove,
  readOnly,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [fitted, setFitted] = useState(false);
  const [draft, setDraft] = useState<Point[]>([]);
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [hovered, setHovered] = useState<{ markerId: string; x: number; y: number } | null>(null);
  const [image] = useImage(project.imageUrl);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Fit the image to the viewport once, on first load.
  useEffect(() => {
    if (fitted || !project.imageWidth || !project.imageHeight || size.width === 0) return;
    const scaleX = size.width / project.imageWidth;
    const scaleY = size.height / project.imageHeight;
    const fit = Math.min(scaleX, scaleY, 1) * 0.95;
    setScale(fit);
    setPos({
      x: (size.width - project.imageWidth * fit) / 2,
      y: (size.height - project.imageHeight * fit) / 2,
    });
    setFitted(true);
  }, [fitted, size, project.imageWidth, project.imageHeight]);

  // Reset the draft road when the tool changes away from "road".
  useEffect(() => {
    if (tool !== "road") setDraft([]);
  }, [tool]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (tool !== "road") return;
      if (e.key === "Enter" && draft.length >= 2) {
        onRoadDraftComplete(draft);
        setDraft([]);
      } else if (e.key === "Escape") {
        setDraft([]);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [tool, draft, onRoadDraftComplete]);

  function handleWheel(e: KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - pos.x) / oldScale,
      y: (pointer.y - pos.y) / oldScale,
    };
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const scaleBy = 1.08;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clamped = Math.min(Math.max(newScale, 0.05), 8);
    setScale(clamped);
    setPos({
      x: pointer.x - mousePointTo.x * clamped,
      y: pointer.y - mousePointTo.y * clamped,
    });
  }

  function getRelativePointer(): Point | null {
    const stage = stageRef.current;
    if (!stage) return null;
    const p = stage.getRelativePointerPosition();
    if (!p) return null;
    return { x: p.x, y: p.y };
  }

  function handleStageMouseMove() {
    if (tool === "road" && draft.length > 0) {
      const p = getRelativePointer();
      setMousePos(p);
    }
  }

  function handleStageClick() {
    const p = getRelativePointer();
    if (!p) return;
    if (readOnly) {
      onSelect(null);
      setHovered(null);
      return;
    }
    if (tool === "road") {
      setDraft((prev) => [...prev, p]);
    } else if (MARKER_TOOLS.has(tool)) {
      onMarkerCreate(tool as MarkerType, p.x, p.y);
    } else if (tool === "select") {
      onSelect(null);
    }
  }

  function handleStageDblClick() {
    if (tool === "road" && draft.length >= 2) {
      onRoadDraftComplete(draft);
      setDraft([]);
    }
  }

  const cursor = tool === "select" ? "default" : "crosshair";

  const hoveredMarker: MarkerDto | undefined = hovered
    ? project.markers.find((m) => m.id === hovered.markerId)
    : undefined;
  const showTooltip =
    hoveredMarker && (hoveredMarker.name || hoveredMarker.notes || hoveredMarker.imageUrl);

  const tooltipGap = 28;
  const tooltipMargin = 12;
  let tooltipStyle: CSSProperties = {};
  if (hovered) {
    const spaceRight = size.width - hovered.x - tooltipGap - tooltipMargin;
    const spaceLeft = hovered.x - tooltipGap - tooltipMargin;
    const anchorRight = spaceRight < spaceLeft;
    const maxWidth = Math.max(160, Math.min(440, anchorRight ? spaceLeft : spaceRight));

    const spaceBelow = size.height - hovered.y - tooltipGap - tooltipMargin;
    const spaceAbove = hovered.y - tooltipGap - tooltipMargin;
    const anchorBottom = spaceBelow < spaceAbove;
    const maxHeight = Math.max(120, anchorBottom ? spaceAbove : spaceBelow);

    tooltipStyle = {
      position: "absolute",
      zIndex: 10,
      pointerEvents: "none",
      background: "var(--panel)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      maxWidth,
      maxHeight,
      overflow: "hidden",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      ...(anchorRight
        ? { right: Math.max(tooltipMargin, size.width - hovered.x + tooltipGap) }
        : { left: Math.max(tooltipMargin, hovered.x + tooltipGap) }),
      ...(anchorBottom
        ? { bottom: Math.max(tooltipMargin, size.height - hovered.y + tooltipGap) }
        : { top: Math.max(tooltipMargin, hovered.y + tooltipGap) }),
    };
  }

  return (
    <div ref={containerRef} style={{ flex: 1, minWidth: 0, background: "#111318", cursor, position: "relative" }}>
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scaleX={scale}
        scaleY={scale}
        x={pos.x}
        y={pos.y}
        draggable={tool === "select"}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setPos({ x: e.target.x(), y: e.target.y() });
          }
        }}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onDblClick={handleStageDblClick}
        onMouseMove={handleStageMouseMove}
      >
        <Layer>
          {image && (
            <KonvaImage image={image} width={project.imageWidth} height={project.imageHeight} listening={false} />
          )}

          {project.roads.map((road) => {
            const isSelected = selected?.kind === "road" && selected.id === road.id;
            const handleRoadClick = (e: KonvaEventObject<Event>) => {
              if (tool !== "select") return;
              e.cancelBubble = true;
              onSelect({ kind: "road", id: road.id });
            };
            return (
              <Line
                key={road.id}
                points={flatten(road.points)}
                stroke={isSelected ? "#ffffff" : road.color}
                strokeWidth={road.width}
                lineCap="round"
                lineJoin="round"
                hitStrokeWidth={Math.max(road.width, 16)}
                onClick={handleRoadClick}
                onTap={handleRoadClick}
              />
            );
          })}

          {selected?.kind === "road" &&
            tool === "select" &&
            !readOnly &&
            project.roads
              .find((r) => r.id === selected.id)
              ?.points.map((pt, idx) => (
                <Circle
                  key={idx}
                  x={pt.x}
                  y={pt.y}
                  radius={6 / scale}
                  fill="#fff"
                  stroke="#4f9dff"
                  strokeWidth={2 / scale}
                  draggable
                  onDragMove={(e) => {
                    const road = project.roads.find((r) => r.id === selected.id);
                    if (!road) return;
                    const newPoints = road.points.map((p, i) =>
                      i === idx ? { x: e.target.x(), y: e.target.y() } : p
                    );
                    onRoadPointsChange(selected.id, newPoints, false);
                  }}
                  onDragEnd={(e) => {
                    const road = project.roads.find((r) => r.id === selected.id);
                    if (!road) return;
                    const newPoints = road.points.map((p, i) =>
                      i === idx ? { x: e.target.x(), y: e.target.y() } : p
                    );
                    onRoadPointsChange(selected.id, newPoints, true);
                  }}
                />
              ))}

          {draft.length > 0 && (
            <Line
              points={flatten(mousePos ? [...draft, mousePos] : draft)}
              stroke="#ffffff"
              strokeWidth={3}
              dash={[8, 6]}
              listening={false}
            />
          )}
          {draft.map((p, i) => (
            <Circle key={i} x={p.x} y={p.y} radius={4} fill="#ffffff" listening={false} />
          ))}

          {project.markers.map((marker) => {
            const isSelected = selected?.kind === "marker" && selected.id === marker.id;
            const handleMarkerClick = (e: KonvaEventObject<Event>) => {
              e.cancelBubble = true;
              onSelect({ kind: "marker", id: marker.id });
              if (readOnly) {
                const stage = e.target.getStage();
                const p = stage?.getPointerPosition();
                if (p) setHovered({ markerId: marker.id, x: p.x, y: p.y });
              }
            };
            return (
              <Text
                key={marker.id}
                x={marker.x}
                y={marker.y}
                text={MARKER_SYMBOLS[marker.type]}
                fontSize={39}
                fill={markerColor(marker)}
                stroke={isSelected ? "#ffffff" : undefined}
                strokeWidth={isSelected ? 1.5 : 0}
                offsetX={19.5}
                offsetY={19.5}
                draggable={tool === "select" && !readOnly}
                onClick={handleMarkerClick}
                onTap={handleMarkerClick}
                onDragStart={() => setHovered(null)}
                onDragMove={(e) => onMarkerMove(marker.id, e.target.x(), e.target.y(), false)}
                onDragEnd={(e) => onMarkerMove(marker.id, e.target.x(), e.target.y(), true)}
                onMouseEnter={(e) => {
                  const stage = e.target.getStage();
                  const p = stage?.getPointerPosition();
                  if (stage && p) stage.container().style.cursor = "pointer";
                  if (p) setHovered({ markerId: marker.id, x: p.x, y: p.y });
                }}
                onMouseLeave={(e) => {
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = cursor;
                  setHovered(null);
                }}
              />
            );
          })}

          {project.markers
            .filter((m) => m.name)
            .map((marker) => (
              <Label
                key={`${marker.id}-label`}
                x={marker.x + 20}
                y={marker.y - 9}
                listening={false}
              >
                <Tag fill="rgba(0,0,0,0.55)" cornerRadius={3} />
                <Text text={marker.name} fontSize={13} padding={3} fill="#ffffff" />
              </Label>
            ))}
        </Layer>
      </Stage>
      {showTooltip && hovered && (
        <div style={tooltipStyle}>
          <div style={{ flexShrink: 0, fontSize: 22, color: "var(--text-dim)", textTransform: "uppercase" }}>
            {MARKER_LABELS[hoveredMarker!.type]}
          </div>
          {hoveredMarker!.name && (
            <div style={{ flexShrink: 0, fontSize: 32, fontWeight: 600, marginBottom: 8 }}>
              {hoveredMarker!.name}
            </div>
          )}
          {hoveredMarker!.imageUrl && (
            <img
              src={hoveredMarker!.imageUrl}
              alt=""
              style={{
                flex: "1 1 auto",
                minHeight: 0,
                maxWidth: "100%",
                objectFit: "contain",
                display: "block",
                borderRadius: 8,
                marginBottom: 8,
              }}
            />
          )}
          {hoveredMarker!.notes && (
            <div
              style={{
                flexShrink: 0,
                fontSize: 24,
                color: "var(--text-dim)",
                whiteSpace: "pre-wrap",
                overflow: "hidden",
              }}
            >
              {hoveredMarker!.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
