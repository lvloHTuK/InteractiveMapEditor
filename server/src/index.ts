import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { uploadsDir } from "./uploads.js";
import { router as projectsRouter } from "./routes/projects.js";
import { roadsForProject, roadsById } from "./routes/roads.js";
import { markersForProject, markersById } from "./routes/markers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const HOST = process.env.HOST ?? "0.0.0.0";

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.use("/api/projects/:projectId/roads", roadsForProject);
app.use("/api/projects/:projectId/markers", markersForProject);
app.use("/api/projects", projectsRouter);
app.use("/api/roads", roadsById);
app.use("/api/markers", markersById);

// Serve the built client (client/dist) in production so the API and the
// frontend can run behind a single port/process. In dev, Vite's own
// dev server + proxy is used instead and this directory won't exist.
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

app.listen(PORT, HOST, () => {
  console.log(`Map editor server listening on http://${HOST}:${PORT}`);
});
