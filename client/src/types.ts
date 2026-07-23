export type MarkerType = "base" | "warehouse" | "village" | "poi";

export interface Point {
  x: number;
  y: number;
}

export interface RoadDto {
  id: string;
  points: Point[];
  color: string;
  width: number;
  label: string;
}

export interface MarkerDto {
  id: string;
  type: MarkerType;
  x: number;
  y: number;
  name: string;
  notes: string;
  color: string | null;
  imageUrl: string | null;
}

export interface ProjectSummary {
  id: string;
  name: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  createdAt: string;
  locked: boolean;
}

export interface ProjectDetail extends ProjectSummary {
  roads: RoadDto[];
  markers: MarkerDto[];
}

export type Tool = "select" | "road" | "base" | "warehouse" | "village" | "poi";

export type Selection = { kind: "road" | "marker"; id: string } | null;

export const MARKER_LABELS: Record<MarkerType, string> = {
  base: "Base",
  warehouse: "Warehouse",
  village: "Village",
  poi: "Point of Interest",
};

export const MARKER_COLORS: Record<MarkerType, string> = {
  base: "#e74c3c",
  warehouse: "#f39c12",
  village: "#27ae60",
  poi: "#3498db",
};

export const MARKER_SYMBOLS: Record<MarkerType, string> = {
  base: "★",
  warehouse: "▲",
  village: "●",
  poi: "◆",
};

export function markerColor(m: MarkerDto): string {
  return m.color ?? MARKER_COLORS[m.type];
}
