import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { db } from "../db.js";
import { uploadsDir } from "../uploads.js";

const VALID_TYPES = new Set(["base", "warehouse", "village", "poi"]);

const imageStorage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const id = crypto.randomUUID();
    cb(null, `${id}${path.extname(file.originalname) || ""}`);
  },
});

const uploadMarkerImage = multer({
  storage: imageStorage,
  fileFilter: (_req, file, cb) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.mimetype)) {
      cb(new Error("Only PNG, JPEG, or WebP images are allowed"));
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: 15 * 1024 * 1024 },
});

function removeFileIfExists(filename: string | null | undefined) {
  if (!filename) return;
  fs.rm(path.join(uploadsDir, filename), { force: true }, () => {});
}

export function toMarkerDto(row: any) {
  return {
    id: row.id,
    type: row.type,
    x: row.x,
    y: row.y,
    name: row.name,
    notes: row.notes,
    color: row.color ?? null,
    imageUrl: row.image_filename ? `/uploads/${row.image_filename}` : null,
  };
}

// Mounted at /api/projects/:projectId/markers — creation only.
export const markersForProject = Router({ mergeParams: true });

markersForProject.post("/", (req, res) => {
  const project = db
    .prepare("SELECT id FROM projects WHERE id = ?")
    .get((req.params as any).projectId);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const { type, x, y, name, notes, color } = req.body ?? {};
  if (!VALID_TYPES.has(type) || typeof x !== "number" || typeof y !== "number") {
    res.status(400).json({ error: "type must be base|warehouse|village|poi, x/y must be numbers" });
    return;
  }
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO markers (id, project_id, type, x, y, name, notes, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, (req.params as any).projectId, type, x, y, name ?? "", notes ?? "", color ?? null);
  const row = db.prepare("SELECT * FROM markers WHERE id = ?").get(id);
  res.status(201).json(toMarkerDto(row));
});

// Mounted at /api/markers — update/delete by id, plus image sub-resource.
export const markersById = Router();

markersById.put("/:id", (req, res) => {
  const existing: any = db.prepare("SELECT * FROM markers WHERE id = ?").get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: "Marker not found" });
    return;
  }
  const x = req.body.x ?? existing.x;
  const y = req.body.y ?? existing.y;
  const name = req.body.name ?? existing.name;
  const notes = req.body.notes ?? existing.notes;
  const type = VALID_TYPES.has(req.body.type) ? req.body.type : existing.type;
  const color = "color" in req.body ? req.body.color : existing.color;
  db.prepare(
    "UPDATE markers SET type = ?, x = ?, y = ?, name = ?, notes = ?, color = ? WHERE id = ?"
  ).run(type, x, y, name, notes, color, req.params.id);
  const row = db.prepare("SELECT * FROM markers WHERE id = ?").get(req.params.id);
  res.json(toMarkerDto(row));
});

markersById.post("/:id/image", uploadMarkerImage.single("image"), (req, res) => {
  const existing: any = db.prepare("SELECT * FROM markers WHERE id = ?").get(req.params.id);
  if (!existing) {
    if (req.file) removeFileIfExists(req.file.filename);
    res.status(404).json({ error: "Marker not found" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "image file is required" });
    return;
  }
  removeFileIfExists(existing.image_filename);
  db.prepare("UPDATE markers SET image_filename = ? WHERE id = ?").run(req.file.filename, req.params.id);
  const row = db.prepare("SELECT * FROM markers WHERE id = ?").get(req.params.id);
  res.json(toMarkerDto(row));
});

markersById.delete("/:id/image", (req, res) => {
  const existing: any = db.prepare("SELECT * FROM markers WHERE id = ?").get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: "Marker not found" });
    return;
  }
  removeFileIfExists(existing.image_filename);
  db.prepare("UPDATE markers SET image_filename = NULL WHERE id = ?").run(req.params.id);
  const row = db.prepare("SELECT * FROM markers WHERE id = ?").get(req.params.id);
  res.json(toMarkerDto(row));
});

markersById.delete("/:id", (req, res) => {
  const existing: any = db.prepare("SELECT * FROM markers WHERE id = ?").get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: "Marker not found" });
    return;
  }
  db.prepare("DELETE FROM markers WHERE id = ?").run(req.params.id);
  removeFileIfExists(existing.image_filename);
  res.status(204).end();
});
