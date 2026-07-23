import { useEffect, useRef, useState } from "react";
import { createProject, deleteProject, listProjects } from "../api";
import type { ProjectSummary } from "../types";

export default function ProjectList({ onOpen }: { onOpen: (id: string) => void }) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function refresh() {
    setLoading(true);
    listProjects()
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a PNG map image first");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const project = await createProject(name || file.name.replace(/\.png$/i, ""), file);
      setName("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      refresh();
      onOpen(project.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this map and all its roads/markers? This cannot be undone.")) return;
    await deleteProject(id);
    refresh();
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, width: "100%" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Interactive Map Editor</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 24 }}>
        Upload a PNG map, then draw roads and place bases, warehouses, villages, and points of interest.
      </p>

      <form
        onSubmit={handleCreate}
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          padding: 16,
          border: "1px solid var(--border)",
          borderRadius: 8,
          background: "var(--panel)",
          marginBottom: 24,
        }}
      >
        <input
          type="text"
          placeholder="Map name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: "1 1 200px" }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button type="submit" disabled={creating}>
          {creating ? "Uploading..." : "Create map"}
        </button>
      </form>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : projects.length === 0 ? (
        <p style={{ color: "var(--text-dim)" }}>No maps yet. Upload a PNG above to get started.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {projects.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                overflow: "hidden",
                background: "var(--panel)",
                cursor: "pointer",
              }}
              onClick={() => onOpen(p.id)}
            >
              <div style={{ height: 120, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={p.imageUrl} alt={p.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
              <div style={{ padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</strong>
                <button
                  className="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
