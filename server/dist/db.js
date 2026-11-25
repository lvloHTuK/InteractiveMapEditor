import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "data.sqlite");
export const db = new DatabaseSync(dbPath);
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image_filename TEXT NOT NULL,
    image_width INTEGER NOT NULL,
    image_height INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    locked INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS roads (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    points TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#e2b93b',
    width REAL NOT NULL DEFAULT 4,
    label TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS markers (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    color TEXT,
    image_filename TEXT
  );
`);
function ensureColumn(table, column, ddl) {
    try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
    }
    catch {
        // column already exists
    }
}
ensureColumn("markers", "color", "TEXT");
ensureColumn("markers", "image_filename", "TEXT");
ensureColumn("projects", "locked", "INTEGER NOT NULL DEFAULT 0");
