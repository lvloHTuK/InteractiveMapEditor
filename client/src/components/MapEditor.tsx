import { useEffect, useState } from "react";
import {
  createMarker,
  createRoad,
  deleteMarker,
  deleteMarkerImage,
  deleteRoad,
  getProject,
  renameProject,
  setProjectLocked,
  updateMarker,
  updateRoad,
  uploadMarkerImage,
} from "../api";
import type { MarkerType, Point, ProjectDetail, Selection, Tool } from "../types";
import { useIsMobile } from "../useIsMobile";
import Toolbar from "./Toolbar";
import MapCanvas from "./MapCanvas";
import Sidebar from "./Sidebar";

const LOCK_PASSWORD = "4562";

export default function MapEditor({ projectId, onBack }: { projectId: string; onBack: () => void }) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [selected, setSelected] = useState<Selection>(null);
  const [nameDraft, setNameDraft] = useState("");
  const isMobile = useIsMobile();
  const readOnly = (project?.locked ?? false) || isMobile;

  useEffect(() => {
    getProject(projectId)
      .then((p) => {
        setProject(p);
        setNameDraft(p.name);
      })
      .catch((e) => setError(e.message));
  }, [projectId]);

  useEffect(() => {
    if (readOnly) setTool("select");
  }, [readOnly]);

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: "var(--danger)" }}>{error}</p>
        <button onClick={onBack}>Back</button>
      </div>
    );
  }

  if (!project) {
    return <div style={{ padding: 24 }}>Loading map...</div>;
  }

  function handleToolChange(t: Tool) {
    setTool(t);
    setSelected(null);
  }

  async function handleRoadDraftComplete(points: Point[]) {
    const road = await createRoad(project!.id, { points, color: "#e2b93b", width: 4, label: "" });
    setProject((prev) => (prev ? { ...prev, roads: [...prev.roads, road] } : prev));
  }

  function handleRoadPointsChange(roadId: string, points: Point[], persist: boolean) {
    setProject((prev) =>
      prev ? { ...prev, roads: prev.roads.map((r) => (r.id === roadId ? { ...r, points } : r)) } : prev
    );
    if (persist) updateRoad(roadId, { points }).catch((e) => setError(e.message));
  }

  function handleRenameRoad(roadId: string, label: string) {
    setProject((prev) =>
      prev ? { ...prev, roads: prev.roads.map((r) => (r.id === roadId ? { ...r, label } : r)) } : prev
    );
    updateRoad(roadId, { label }).catch((e) => setError(e.message));
  }

  function handleSetRoadStyle(roadId: string, patch: { color?: string; width?: number }) {
    setProject((prev) =>
      prev ? { ...prev, roads: prev.roads.map((r) => (r.id === roadId ? { ...r, ...patch } : r)) } : prev
    );
    updateRoad(roadId, patch).catch((e) => setError(e.message));
  }

  async function handleDeleteRoad(roadId: string) {
    setSelected(null);
    setProject((prev) => (prev ? { ...prev, roads: prev.roads.filter((r) => r.id !== roadId) } : prev));
    await deleteRoad(roadId).catch((e) => setError(e.message));
  }

  async function handleMarkerCreate(type: MarkerType, x: number, y: number) {
    const marker = await createMarker(project!.id, { type, x, y, name: "" });
    setProject((prev) => (prev ? { ...prev, markers: [...prev.markers, marker] } : prev));
    setSelected({ kind: "marker", id: marker.id });
  }

  function handleMarkerMove(markerId: string, x: number, y: number, persist: boolean) {
    setProject((prev) =>
      prev ? { ...prev, markers: prev.markers.map((m) => (m.id === markerId ? { ...m, x, y } : m)) } : prev
    );
    if (persist) updateMarker(markerId, { x, y }).catch((e) => setError(e.message));
  }

  function handleRenameMarker(markerId: string, name: string) {
    setProject((prev) =>
      prev ? { ...prev, markers: prev.markers.map((m) => (m.id === markerId ? { ...m, name } : m)) } : prev
    );
    updateMarker(markerId, { name }).catch((e) => setError(e.message));
  }

  function handleSetMarkerNotes(markerId: string, notes: string) {
    setProject((prev) =>
      prev ? { ...prev, markers: prev.markers.map((m) => (m.id === markerId ? { ...m, notes } : m)) } : prev
    );
    updateMarker(markerId, { notes }).catch((e) => setError(e.message));
  }

  function handleSetMarkerColor(markerId: string, color: string | null) {
    setProject((prev) =>
      prev ? { ...prev, markers: prev.markers.map((m) => (m.id === markerId ? { ...m, color } : m)) } : prev
    );
    updateMarker(markerId, { color }).catch((e) => setError(e.message));
  }

  async function handleUploadMarkerImage(markerId: string, file: File) {
    const marker = await uploadMarkerImage(markerId, file).catch((e) => {
      setError(e.message);
      return null;
    });
    if (marker) {
      setProject((prev) =>
        prev ? { ...prev, markers: prev.markers.map((m) => (m.id === markerId ? marker : m)) } : prev
      );
    }
  }

  async function handleRemoveMarkerImage(markerId: string) {
    const marker = await deleteMarkerImage(markerId).catch((e) => {
      setError(e.message);
      return null;
    });
    if (marker) {
      setProject((prev) =>
        prev ? { ...prev, markers: prev.markers.map((m) => (m.id === markerId ? marker : m)) } : prev
      );
    }
  }

  async function handleDeleteMarker(markerId: string) {
    setSelected(null);
    setProject((prev) => (prev ? { ...prev, markers: prev.markers.filter((m) => m.id !== markerId) } : prev));
    await deleteMarker(markerId).catch((e) => setError(e.message));
  }

  async function handleRenameProject() {
    if (!project || nameDraft === project.name) return;
    const updated = await renameProject(project.id, nameDraft).catch((e) => {
      setError(e.message);
      return null;
    });
    if (updated) setProject((prev) => (prev ? { ...prev, name: updated.name } : prev));
  }

  function handleToggleLock() {
    if (!project) return;
    const password = window.prompt("Enter password to change the lock state:");
    if (password === null) return;
    if (password !== LOCK_PASSWORD) {
      window.alert("Incorrect password");
      return;
    }
    const next = !project.locked;
    setProject((prev) => (prev ? { ...prev, locked: next } : prev));
    setProjectLocked(project.id, next).catch((e) => setError(e.message));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--panel)",
        }}
      >
        <button onClick={onBack}>&larr; All maps</button>
        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={handleRenameProject}
          disabled={readOnly}
          style={{ fontSize: 16, fontWeight: 600, flex: "0 1 320px" }}
        />
        <button onClick={handleToggleLock} title={project.locked ? "Unlock editing" : "Lock editing (view only)"}>
          {project.locked ? "🔒 Locked" : "🔓 Unlocked"}
        </button>
        {isMobile && !project.locked && (
          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>View only on this screen size</span>
        )}
        {error && <span style={{ color: "var(--danger)" }}>{error}</span>}
      </header>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {!readOnly && <Toolbar tool={tool} onChange={handleToolChange} readOnly={readOnly} />}
        <MapCanvas
          project={project}
          tool={tool}
          selected={selected}
          onSelect={setSelected}
          onRoadDraftComplete={handleRoadDraftComplete}
          onRoadPointsChange={handleRoadPointsChange}
          onMarkerCreate={handleMarkerCreate}
          onMarkerMove={handleMarkerMove}
          readOnly={readOnly}
        />
        {!readOnly && (
          <Sidebar
            project={project}
            selected={selected}
            onSelect={setSelected}
            onRenameRoad={handleRenameRoad}
            onSetRoadStyle={handleSetRoadStyle}
            onDeleteRoad={handleDeleteRoad}
            onRenameMarker={handleRenameMarker}
            onSetMarkerNotes={handleSetMarkerNotes}
            onSetMarkerColor={handleSetMarkerColor}
            onUploadMarkerImage={handleUploadMarkerImage}
            onRemoveMarkerImage={handleRemoveMarkerImage}
            onDeleteMarker={handleDeleteMarker}
            readOnly={readOnly}
          />
        )}
      </div>
    </div>
  );
}
