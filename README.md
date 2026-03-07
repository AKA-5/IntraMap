# IntraMap

[![Version](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://intra-map-six.vercel.app)

**IntraMap** is a web-based indoor navigation platform that lets building administrators create interactive floor plans and share them with visitors via QR code. Visitors scan the code and immediately get a searchable, zoomable map of the building on their phone — no app download required.

> Live demo: [https://intra-map-six.vercel.app](https://intra-map-six.vercel.app) — preloaded with a 3-floor shopping mall example.

---

## Problem

Large indoor spaces — malls, hospitals, university campuses, convention centers — consistently fail at visitor wayfinding. Commercial wayfinding systems cost $5,000–$50,000 and require proprietary hardware. Static PDF maps don't work on mobile. IntraMap solves this with a zero-cost, browser-based alternative that any building manager can set up in minutes.

---

## How It Works

1. A building administrator opens the **editor** (`admin.html`) and draws their floor plan using a drag-and-drop canvas interface.
2. They add named locations (rooms, stores, services) with icons, colors, and searchable tags across one or more floors.
3. They save the floor plan to the cloud and generate a **QR code**.
4. Visitors scan the QR code and land on the **viewer** (`viewer.html`) — a mobile-optimized map where they can search for locations, switch floors, and tap any location for details.

---

## Features

### Editor
- Canvas-based drawing with rectangles, circles, lines, and text labels
- 13 categorized icons (restaurant, restroom, exit, elevator, ATM, shop, medical, etc.)
- Multi-floor support with custom floor names (Basement, Ground, Mezzanine, etc.)
- Object property panel: name, tags, fill color, border style, opacity, lock state
- Multi-select with Shift+Click or drag selection
- Undo/redo with 50-step history
- Copy and paste
- Auto-save to localStorage every 10 seconds
- Cloud save to Cloudflare KV with one click
- QR code generation and download

### Viewer
- Mobile-first responsive layout
- Full pan and zoom: mouse drag, touch drag, pinch-to-zoom, keyboard arrows, mouse wheel
- Smart search by location name or tags
- Floor selector dropdown
- Tap-to-detail popup with location info
- Works offline after first visit (PWA with service worker)
- Installable on mobile home screen

### Infrastructure
- 100% free hosting: Cloudflare Workers (API) + Vercel (frontend)
- No server to manage; backend is a single serverless function
- REST API with Cloudflare KV storage

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Canvas | [Fabric.js](http://fabricjs.com/) 5.x |
| QR Generation | [QRCode.js](https://davidshimjs.github.io/qrcodejs/) |
| Backend | Cloudflare Workers (serverless edge) |
| Storage | Cloudflare KV (key-value store) |
| Hosting | Vercel (static frontend CDN) |
| Offline | Progressive Web App (Service Worker) |

No build step, no framework, no dependencies beyond the two bundled libraries.

---

## Project Structure

```
IntraMap/
├── public/                 # Frontend (deployed to Vercel)
│   ├── index.html          # Landing page
│   ├── admin.html          # Floor plan editor
│   ├── viewer.html         # Map viewer for visitors
│   ├── css/
│   │   ├── common.css      # Shared styles
│   │   ├── admin.css       # Editor styles
│   │   └── viewer.css      # Viewer styles
│   ├── js/
│   │   ├── admin.js        # Editor logic
│   │   ├── viewer.js       # Viewer logic (pan/zoom/search)
│   │   ├── api.js          # API client (save/load buildings)
│   │   └── icons.js        # SVG icon definitions
│   ├── lib/
│   │   ├── fabric.min.js   # Canvas library (bundled)
│   │   └── qrcode.min.js   # QR generation (bundled)
│   ├── data/
│   │   └── demo-building.json  # Sample Centaurus Mall data
│   └── manifest.json       # PWA manifest
├── worker/
│   ├── index.js            # Cloudflare Worker API (CRUD endpoints)
│   └── wrangler.toml       # Worker configuration
├── docs/
│   ├── PRD.md              # Product requirements document
│   └── TECHNICAL_ARCHITECTURE.md  # Architecture and data models
├── DEPLOYMENT.md           # Step-by-step deployment guide
├── USER_GUIDE.md           # End-user guide for editor and viewer
└── vercel.json             # Vercel routing and headers config
```

---

## Running Locally

**Requirements:** Node.js 16+

```bash
git clone <repo-url>
cd IntraMap
npm install
npm run dev
```

Opens at `http://localhost:3000`. The app loads demo data by default so the viewer works immediately without a backend.

---

## Deployment

Full instructions are in [DEPLOYMENT.md](DEPLOYMENT.md). The short version:

**Backend (Cloudflare Worker):**
```bash
npm install -g wrangler
wrangler login
cd worker
wrangler kv namespace create BUILDINGS
# Paste the namespace ID into wrangler.toml
wrangler deploy
```

**Frontend (Vercel):**
```bash
npm install -g vercel
vercel --prod
# Set output directory to: public
```

After deploying the worker, update the API URL in `public/js/api.js` (line 6) to point to your worker subdomain.

---

## API Reference

The Cloudflare Worker exposes a simple REST API:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/buildings/:id` | Load a building |
| `POST` | `/api/buildings/:id` | Save a building |
| `DELETE` | `/api/buildings/:id` | Delete a building |
| `POST` | `/api/buildings/:id/generate-qr` | Get viewer URL |

All responses are JSON. CORS is enabled for all origins.

---

## Data Model

A building is stored as a single JSON object under its ID in Cloudflare KV:

```json
{
  "id": "building-uuid",
  "name": "Building Name",
  "floors": [
    {
      "id": "floor-uuid",
      "name": "Ground Floor",
      "canvasData": {}
    }
  ],
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

`canvasData` is the raw Fabric.js canvas JSON — serialized objects, positions, styles, and custom properties (`name`, `popupText`, `tags`, `iconType`).

---

## Keyboard Shortcuts

### Editor

| Shortcut | Action |
|---|---|
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Ctrl + C` | Copy selected |
| `Ctrl + V` | Paste |
| `Ctrl + S` | Save draft to browser |
| `Delete` | Remove selected object |
| `Shift + Click` | Multi-select |
| `Space + Drag` | Pan canvas |
| `Arrow Keys` | Pan canvas |

### Viewer

| Shortcut | Action |
|---|---|
| `Arrow Keys` | Pan map |
| `+ / -` | Zoom in/out |
| `0` | Reset view |
| `Escape` | Close popup |
| `/` | Focus search |

---

## Security Note

This is an MVP with no authentication layer. Anyone who knows the admin URL for a building can edit it. For production use, authentication (password per building or OAuth) should be added before exposing the editor publicly. The viewer is intentionally public.

---

## License

MIT — see [LICENSE](LICENSE).

---

## Author

M Kaleem Akhtar - built as a personal project demonstrating a full-stack web application with a practical indoor navigation use case.

