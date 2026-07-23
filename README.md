# Interactive Map Editor

Upload a PNG map, draw roads on it, and place bases, warehouses, villages, and points of interest.

## Stack

- `client/` — React + TypeScript + Vite, canvas rendering via Konva (`react-konva`)
- `server/` — Node.js + Express, data stored in SQLite (`node:sqlite`), uploaded PNGs saved to `server/uploads/`

## Running

```
npm run install:all   # first time only, installs server + client deps
npm run dev           # runs both the API server (port 4000) and the client (port 5173)
```

Then open http://localhost:5173.

## Usage

1. On the home screen, name your map and choose a PNG file, then click **Create map**.
2. Use the left toolbar to switch tools:
   - **Select / Pan** — drag the canvas to pan, scroll to zoom, click a road or marker to select it, drag points/markers to move them.
   - **Draw Road** — click to add points, double-click or press Enter to finish the road, press Escape to cancel.
   - **Base / Warehouse / Village / Point of Interest** — click on the map to drop a marker of that type.
3. Selecting a road or marker in the canvas or the right sidebar shows an editor for its name/label, and for roads, its color and thickness.
4. Everything is saved to the server as you go — reloading the page reloads the same data.

## Deploying to a server (public IP)

In production the server also serves the built client, so the whole app runs behind a single port. Both options below persist `server/data.sqlite` and `server/uploads/` (or their Docker equivalents) across restarts/updates.

### Option A — Docker

```
docker compose up -d --build
```

This builds the client, compiles the server, and runs everything in one container listening on port 4000. Data persists in `./data/data.sqlite` and `./data/uploads/` on the host (see `docker-compose.yml`). Put nginx (see below) in front for a domain + HTTPS, or expose port 4000/443 directly.

### Option B — plain Node + systemd + nginx

```
npm run install:all
npm run build     # builds client/dist and server/dist
npm start         # runs node server/dist/index.js on port 4000
```

For a real deployment, run it as a service instead of a foreground process:

1. Copy the project to the server, run the two commands above.
2. Install `deploy/mapeditor.service` as a systemd unit (instructions in the file) so it survives reboots and restarts on crash.
3. Point nginx at it using `deploy/nginx.conf` (reverse proxy to `127.0.0.1:4000`), then run `certbot --nginx` for a free HTTPS certificate (requires a domain pointed at the server's public IP).
4. Only open ports 80/443 (and SSH) in the firewall — don't expose port 4000 directly.

### Environment variables

- `PORT` — port the Node process listens on (default `4000`).
- `HOST` — interface to bind to (default `0.0.0.0`, i.e. all interfaces).
