import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { imageSize } from "image-size";
import { db } from "../db.js";
import { uploadsDir } from "../uploads.js";
import { toRoadDto } from "./roads.js";
import { toMarkerDto } from "./markers.js";
const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => {
        const id = crypto.randomUUID();
        cb(null, `${id}${path.extname(file.originalname) || ".png"}`);
    },
});
const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        if (file.mimetype !== "image/png") {
            cb(new Error("Only PNG images are allowed"));
            return;
        }
        cb(null, true);
    },
    limits: { fileSize: 50 * 1024 * 1024 },
});
export const router = Router();
function toProjectDto(row) {
    return {
        id: row.id,
        name: row.name,
        imageUrl: `/uploads/${row.image_filename}`,
        imageWidth: row.image_width,
        imageHeight: row.image_height,
        createdAt: row.created_at,
        locked: !!row.locked,
    };
}
router.get("/", (_req, res) => {
    const rows = db
        .prepare("SELECT * FROM projects ORDER BY created_at DESC")
        .all();
    res.json(rows.map(toProjectDto));
});
router.post("/", upload.single("image"), (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: "image file is required" });
        return;
    }
    const name = (req.body.name || "Untitled map").toString().slice(0, 200);
    let dimensions;
    try {
        dimensions = imageSize(fs.readFileSync(req.file.path));
    }
    catch {
        fs.unlinkSync(req.file.path);
        res.status(400).json({ error: "Could not read image dimensions" });
        return;
    }
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(`INSERT INTO projects (id, name, image_filename, image_width, image_height, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`).run(id, name, req.file.filename, dimensions.width ?? 0, dimensions.height ?? 0, createdAt);
    const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
    res.status(201).json(toProjectDto(row));
});
router.get("/:id", (req, res) => {
    const project = db
        .prepare("SELECT * FROM projects WHERE id = ?")
        .get(req.params.id);
    if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
    }
    const roads = db
        .prepare("SELECT * FROM roads WHERE project_id = ?")
        .all(req.params.id)
        .map(toRoadDto);
    const markers = db
        .prepare("SELECT * FROM markers WHERE project_id = ?")
        .all(req.params.id)
        .map(toMarkerDto);
    res.json({ ...toProjectDto(project), roads, markers });
});
router.put("/:id", (req, res) => {
    const project = db
        .prepare("SELECT * FROM projects WHERE id = ?")
        .get(req.params.id);
    if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
    }
    const name = (req.body.name ?? project.name).toString().slice(0, 200);
    db.prepare("UPDATE projects SET name = ? WHERE id = ?").run(name, req.params.id);
    const updated = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
    res.json(toProjectDto(updated));
});
router.put("/:id/lock", (req, res) => {
    const project = db
        .prepare("SELECT id FROM projects WHERE id = ?")
        .get(req.params.id);
    if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
    }
    db.prepare("UPDATE projects SET locked = ? WHERE id = ?").run(req.body.locked ? 1 : 0, req.params.id);
    const updated = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
    res.json(toProjectDto(updated));
});
router.delete("/:id", (req, res) => {
    const project = db
        .prepare("SELECT * FROM projects WHERE id = ?")
        .get(req.params.id);
    if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
    }
    db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
    const filePath = path.join(uploadsDir, project.image_filename);
    fs.rm(filePath, { force: true }, () => { });
    res.status(204).end();
});
