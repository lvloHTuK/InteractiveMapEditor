import { Router } from "express";
import crypto from "node:crypto";
import { db } from "../db.js";
export function toRoadDto(row) {
    return {
        id: row.id,
        points: JSON.parse(row.points),
        color: row.color,
        width: row.width,
        label: row.label,
    };
}
// Mounted at /api/projects/:projectId/roads — creation only.
export const roadsForProject = Router({ mergeParams: true });
roadsForProject.post("/", (req, res) => {
    const project = db
        .prepare("SELECT id FROM projects WHERE id = ?")
        .get(req.params.projectId);
    if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
    }
    const { points, color, width, label } = req.body ?? {};
    if (!Array.isArray(points) || points.length < 2) {
        res.status(400).json({ error: "points must be an array of at least 2 {x,y} pairs" });
        return;
    }
    const id = crypto.randomUUID();
    db.prepare(`INSERT INTO roads (id, project_id, points, color, width, label)
     VALUES (?, ?, ?, ?, ?, ?)`).run(id, req.params.projectId, JSON.stringify(points), color ?? "#e2b93b", width ?? 4, label ?? "");
    const row = db.prepare("SELECT * FROM roads WHERE id = ?").get(id);
    res.status(201).json(toRoadDto(row));
});
// Mounted at /api/roads — update/delete by id.
export const roadsById = Router();
roadsById.put("/:id", (req, res) => {
    const existing = db.prepare("SELECT * FROM roads WHERE id = ?").get(req.params.id);
    if (!existing) {
        res.status(404).json({ error: "Road not found" });
        return;
    }
    const points = req.body.points ?? JSON.parse(existing.points);
    const color = req.body.color ?? existing.color;
    const width = req.body.width ?? existing.width;
    const label = req.body.label ?? existing.label;
    db.prepare("UPDATE roads SET points = ?, color = ?, width = ?, label = ? WHERE id = ?").run(JSON.stringify(points), color, width, label, req.params.id);
    const row = db.prepare("SELECT * FROM roads WHERE id = ?").get(req.params.id);
    res.json(toRoadDto(row));
});
roadsById.delete("/:id", (req, res) => {
    const existing = db.prepare("SELECT id FROM roads WHERE id = ?").get(req.params.id);
    if (!existing) {
        res.status(404).json({ error: "Road not found" });
        return;
    }
    db.prepare("DELETE FROM roads WHERE id = ?").run(req.params.id);
    res.status(204).end();
});
