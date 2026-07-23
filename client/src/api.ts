import type { MarkerDto, MarkerType, Point, ProjectDetail, ProjectSummary, RoadDto } from "./types";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function listProjects(): Promise<ProjectSummary[]> {
  return fetch("/api/projects").then((r) => handle(r));
}

export function createProject(name: string, file: File): Promise<ProjectSummary> {
  const form = new FormData();
  form.set("name", name);
  form.set("image", file);
  return fetch("/api/projects", { method: "POST", body: form }).then((r) => handle(r));
}

export function getProject(id: string): Promise<ProjectDetail> {
  return fetch(`/api/projects/${id}`).then((r) => handle(r));
}

export function renameProject(id: string, name: string): Promise<ProjectSummary> {
  return fetch(`/api/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  }).then((r) => handle(r));
}

export function deleteProject(id: string): Promise<void> {
  return fetch(`/api/projects/${id}`, { method: "DELETE" }).then((r) => handle(r));
}

export function setProjectLocked(id: string, locked: boolean): Promise<ProjectSummary> {
  return fetch(`/api/projects/${id}/lock`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locked }),
  }).then((r) => handle(r));
}

export function createRoad(
  projectId: string,
  data: { points: Point[]; color: string; width: number; label?: string }
): Promise<RoadDto> {
  return fetch(`/api/projects/${projectId}/roads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => handle(r));
}

export function updateRoad(
  id: string,
  data: Partial<{ points: Point[]; color: string; width: number; label: string }>
): Promise<RoadDto> {
  return fetch(`/api/roads/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => handle(r));
}

export function deleteRoad(id: string): Promise<void> {
  return fetch(`/api/roads/${id}`, { method: "DELETE" }).then((r) => handle(r));
}

export function createMarker(
  projectId: string,
  data: { type: MarkerType; x: number; y: number; name?: string; notes?: string }
): Promise<MarkerDto> {
  return fetch(`/api/projects/${projectId}/markers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => handle(r));
}

export function updateMarker(
  id: string,
  data: Partial<{
    x: number;
    y: number;
    name: string;
    notes: string;
    type: MarkerType;
    color: string | null;
  }>
): Promise<MarkerDto> {
  return fetch(`/api/markers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => handle(r));
}

export function deleteMarker(id: string): Promise<void> {
  return fetch(`/api/markers/${id}`, { method: "DELETE" }).then((r) => handle(r));
}

export function uploadMarkerImage(id: string, file: File): Promise<MarkerDto> {
  const form = new FormData();
  form.set("image", file);
  return fetch(`/api/markers/${id}/image`, { method: "POST", body: form }).then((r) => handle(r));
}

export function deleteMarkerImage(id: string): Promise<MarkerDto> {
  return fetch(`/api/markers/${id}/image`, { method: "DELETE" }).then((r) => handle(r));
}
