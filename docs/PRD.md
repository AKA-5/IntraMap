# IntraMap - Product Requirements Document (PRD)

**Version:** 2.0  
**Last Updated:** February 16, 2026  
**Status:** Active Development  
**Product Owner:** M Kaleem Akhtar

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [User Personas](#user-personas)
4. [Core Features](#core-features)
5. [User Stories](#user-stories)
6. [Technical Architecture](#technical-architecture)
7. [Database Schema](#database-schema)
8. [API Specifications](#api-specifications)
9. [UI/UX Design](#uiux-design)
10. [Success Metrics](#success-metrics)
11. [Roadmap](#roadmap)
12. [Constraints & Dependencies](#constraints--dependencies)

---

## 1. Executive Summary

### Problem Statement
Large buildings (malls, hospitals, universities, corporate offices) struggle with visitor navigation. Traditional solutions are either:
- **Too expensive** ($5,000-$50,000 for commercial wayfinding systems)
- **Too complex** (require specialized hardware, installation, maintenance)
- **Not accessible** (static maps don't work for mobile users)

### Solution
**IntraMap** is a 100% free, web-based indoor floor plan navigation system that enables building owners to:
1. Create interactive floor plans using a drag-and-drop editor
2. Generate QR codes for instant visitor access
3. Provide real-time navigation on visitors' smartphones

### Value Proposition
- ✅ **$0/month** - Completely free using Cloudflare Workers + Vercel
- ✅ **5-minute setup** - No installation, no specialized hardware
- ✅ **Mobile-first** - Works on any smartphone browser
- ✅ **Offline-capable** - PWA technology for offline access
- ✅ **No coding required** - Visual editor for non-technical users

### Target Market
- Shopping malls and retail centers
- Hospitals and medical facilities
- Universities and educational campuses
- Corporate office buildings
- Convention centers and event venues
- Government buildings

---

## 2. Product Overview

### Product Vision
**"Enable every building to provide smartphone-based navigation as easily as creating a PowerPoint presentation"**

### Product Mission
Democratize indoor navigation by providing a free, easy-to-use platform that requires no technical expertise or financial investment.

### Key Differentiators

| Feature | IntraMap | Traditional Solutions | Google Indoor Maps |
|---------|----------|----------------------|-------------------|
| **Cost** | $0/month | $5K-$50K upfront | Free but limited |
| **Setup Time** | 5 minutes | Weeks/months | Days/weeks |
| **Hardware Required** | None | Beacons, sensors | None |
| **Customization** | Full control | Limited | Very limited |
| **Offline Support** | Yes (PWA) | Varies | No |
| **Real-time Updates** | Instant | Slow | Slow |

---

## 3. User Personas

### Primary Persona: Building Manager (Admin)
**Name:** Sarah Chen  
**Age:** 35  
**Role:** Facilities Manager at Centaurus Mall  
**Tech Savvy:** Moderate (uses Excel, PowerPoint, basic web apps)

**Goals:**
- Reduce visitor confusion and help desk inquiries
- Improve visitor experience
- Keep floor plans updated without IT department

**Pain Points:**
- Current printed maps are outdated
- Visitors constantly ask for directions
- Updating maps requires expensive contractors

**Success Criteria:**
- Can create floor plan in under 30 minutes
- Can update store locations instantly
- Visitors find locations without asking staff

### Secondary Persona: Visitor (End User)
**Name:** Ahmed Khan  
**Age:** 28  
**Role:** Mall visitor  
**Tech Savvy:** High (smartphone power user)

**Goals:**
- Find specific stores/facilities quickly
- Navigate unfamiliar buildings easily
- Access information offline

**Pain Points:**
- Static maps are hard to read
- Doesn't know current location
- Gets lost in large buildings

**Success Criteria:**
- Finds target location in under 30 seconds
- Can see current location on map
- Works without internet after first load

---

## 4. Core Features

### 4.1 Admin Features (Floor Plan Editor)

#### ✅ **Dynamic Floor Management** (NEW)
- Add unlimited floors with custom names
- Rename floors (e.g., "Basement", "Mezzanine", "Rooftop")
- Delete floors (with confirmation)
- Right-click context menu for floor operations

**User Flow:**
1. Click "+ Floor" button
2. Enter custom floor name
3. New floor tab appears
4. Switch between floors seamlessly

#### ✅ **Drawing Tools**
- **Shapes:** Rectangle, Circle, Text labels
- **Wall/Line Tool:** Two-click interaction for boundaries (NEW)
- **Icon Library:** 13+ pre-made icons (restaurant, restroom, exit, etc.)
- **Select Tool:** Move, resize, rotate objects

**User Flow:**
1. Select tool from left sidebar
2. Click on canvas to place object
3. Adjust properties in right sidebar

#### ✅ **Advanced Styling Controls** (NEW)
- **Border Width:** 0-20px slider with live preview
- **Border Style:** Solid, Dashed, Dotted dropdown
- **Opacity:** 0-100% transparency slider
- **Fill Color:** Color picker with presets
- **Layer Controls:** Bring to front, send to back

**User Flow:**
1. Select object on canvas
2. Properties panel appears on right
3. Adjust sliders/dropdowns
4. Changes apply in real-time

#### ✅ **Keyboard Shortcuts** (NEW)
- **Ctrl+Z:** Undo (50-state history)
- **Ctrl+Y:** Redo
- **Delete:** Remove selected object
- **Escape:** Deselect all

#### ✅ **Data Management**
- **Auto-save:** Draft saved to localStorage every 10 seconds
- **Cloud Sync:** Save to Cloudflare KV storage
- **Load from Cloud:** Retrieve saved buildings
- **QR Code Generation:** Create shareable QR codes

**User Flow:**
1. Create floor plan
2. Click "Save to Cloud"
3. Enter building name
4. Click "Generate QR"
5. Download or print QR code

### 4.2 Viewer Features (Public Navigation)

#### ✅ **Interactive Map Display**
- Responsive canvas rendering
- Pinch-to-zoom on mobile
- Pan and navigate
- Smooth animations

#### ✅ **Smart Search**
- Search by name (e.g., "Food Court")
- Search by tags (e.g., "food", "restaurant")
- Search across all floors
- Highlight search results

**User Flow:**
1. Type in search bar
2. See results dropdown
3. Click result
4. Map switches to correct floor
5. Object highlights with animation

#### ✅ **"You Are Here" Feature**
- Tap map to place location marker
- Red circular marker with shadow
- Persists across floor changes
- Visual feedback

#### ✅ **Navigation & Directions**
- Click object to see details popup
- "Get Directions" button
- Visual path line from current location
- Animated route highlighting

#### ✅ **Offline Support (PWA)**
- Service Worker caching
- Works offline after first load
- Installable on mobile home screen
- Fast load times

---

## 5. User Stories

### Admin User Stories

**Epic: Floor Plan Creation**
- As a building manager, I want to add custom floors so that I can represent my building's unique structure
- As a building manager, I want to rename floors so that I can use familiar terminology (e.g., "Lower Level" instead of "Basement")
- As a building manager, I want to draw walls and boundaries so that visitors can see room layouts
- As a building manager, I want to adjust border thickness so that I can create clear visual hierarchies

**Epic: Content Management**
- As a building manager, I want to add labeled areas so that visitors can identify locations
- As a building manager, I want to use icons so that locations are visually recognizable
- As a building manager, I want to change colors so that I can categorize different types of locations
- As a building manager, I want to undo mistakes so that I can experiment without fear

**Epic: Publishing**
- As a building manager, I want to save my floor plan to the cloud so that visitors can access it
- As a building manager, I want to generate a QR code so that visitors can scan and navigate
- As a building manager, I want to update my floor plan so that I can reflect changes in my building

### Visitor User Stories

**Epic: Discovery**
- As a visitor, I want to scan a QR code so that I can quickly access the floor plan
- As a visitor, I want to search for locations so that I can find what I'm looking for
- As a visitor, I want to see all floors so that I can understand the building layout

**Epic: Navigation**
- As a visitor, I want to mark my current location so that I know where I am
- As a visitor, I want to get directions so that I can navigate to my destination
- As a visitor, I want to see location details so that I can learn more about places

**Epic: Accessibility**
- As a visitor, I want the app to work offline so that I can navigate without internet
- As a visitor, I want the app to work on my phone so that I don't need special equipment
- As a visitor, I want the app to load quickly so that I can start navigating immediately

---

## 6. Technical Architecture

### 6.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER DEVICES                         │
│  (Smartphones, Tablets, Desktops - Any Modern Browser)      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTPS
                 │
┌────────────────▼────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  index.html  │  │  admin.html  │  │ viewer.html  │      │
│  │ (Landing)    │  │  (Editor)    │  │ (Navigation) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Static Assets (CSS, JS, Icons, Service Worker)     │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ REST API (HTTPS)
                 │
┌────────────────▼────────────────────────────────────────────┐
│              BACKEND (Cloudflare Workers)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Worker Script (index.js)                            │   │
│  │  - GET  /api/buildings/:id                           │   │
│  │  - POST /api/buildings/:id                           │   │
│  │  - CORS handling                                      │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                           │
│                   │ KV API                                    │
│                   │                                           │
│  ┌────────────────▼─────────────────────────────────────┐   │
│  │  Cloudflare KV (Key-Value Storage)                   │   │
│  │  - Key: building:{buildingId}                        │   │
│  │  - Value: JSON building data                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Technology Stack

**Frontend:**
- **HTML5** - Semantic markup
- **CSS3** - Custom styling (no frameworks)
- **JavaScript (ES6+)** - Vanilla JS, no build step
- **Fabric.js** - Canvas manipulation library
- **QRCode.js** - QR code generation

**Backend:**
- **Cloudflare Workers** - Serverless edge computing
- **Cloudflare KV** - Global key-value storage

**Hosting:**
- **Vercel** - Frontend static hosting
- **Cloudflare CDN** - Global content delivery

**PWA:**
- **Service Worker** - Offline caching
- **Web App Manifest** - Installability

### 6.3 Data Flow

**Admin Flow (Creating Floor Plan):**
```
User draws on canvas
    ↓
Fabric.js captures objects
    ↓
Auto-save to localStorage (every 10s)
    ↓
User clicks "Save to Cloud"
    ↓
admin.js serializes canvas to JSON
    ↓
api.js sends POST to Worker
    ↓
Worker saves to KV storage
    ↓
Success response to user
```

**Viewer Flow (Navigating Building):**
```
User scans QR code / visits URL
    ↓
viewer.html loads with building ID
    ↓
api.js sends GET to Worker
    ↓
Worker retrieves from KV storage
    ↓
JSON data returned to viewer
    ↓
Fabric.js renders floor plan
    ↓
User interacts (search, navigate)
    ↓
Service Worker caches for offline
```

---

## 7. Database Schema

### 7.1 Storage Technology
**Cloudflare KV (Key-Value Store)**
- Global, eventually consistent
- Low-latency reads (< 100ms globally)
- 100,000 free reads/day
- 1,000 free writes/day

### 7.2 Data Model

#### Building Document Structure

```json
{
  "version": "1.0",
  "buildingId": "string",
  "name": "string",
  "createdAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp",
  "floors": {
    "floor_1": {
      "name": "string",
      "objects": [
        {
          "type": "rect | circle | i-text | line | group",
          "left": "number",
          "top": "number",
          "width": "number",
          "height": "number",
          "scaleX": "number",
          "scaleY": "number",
          "angle": "number",
          "fill": "string (hex color)",
          "stroke": "string (hex color)",
          "strokeWidth": "number",
          "strokeDashArray": "array | null",
          "opacity": "number (0-1)",
          "objectLabel": "string",
          "objectTags": "string (comma-separated)",
          "objectIcon": "string | null",
          "objectLocked": "boolean",
          "text": "string (for i-text only)",
          "fontSize": "number (for i-text only)",
          "fontFamily": "string (for i-text only)"
        }
      ]
    }
  }
}
```

#### KV Storage Key Format
```
Key: building:{buildingId}
Value: JSON string of building document
```

#### Example Building Document

```json
{
  "version": "1.0",
  "buildingId": "centaurus-mall",
  "name": "Centaurus Mall",
  "createdAt": "2026-02-10T04:00:00.000Z",
  "updatedAt": "2026-02-16T10:30:00.000Z",
  "floors": {
    "floor_1": {
      "name": "Ground Floor",
      "objects": [
        {
          "type": "rect",
          "left": 100,
          "top": 100,
          "width": 150,
          "height": 100,
          "scaleX": 1,
          "scaleY": 1,
          "angle": 0,
          "fill": "#3B82F6",
          "stroke": "#1E40AF",
          "strokeWidth": 2,
          "strokeDashArray": null,
          "opacity": 1,
          "objectLabel": "Food Court",
          "objectTags": "food, restaurant, dining",
          "objectIcon": null,
          "objectLocked": false
        },
        {
          "type": "line",
          "left": 50,
          "top": 50,
          "width": 700,
          "height": 0,
          "scaleX": 1,
          "scaleY": 1,
          "angle": 0,
          "fill": "transparent",
          "stroke": "#1F2937",
          "strokeWidth": 4,
          "strokeDashArray": null,
          "opacity": 1,
          "objectLabel": "",
          "objectTags": "",
          "objectIcon": null,
          "objectLocked": false
        }
      ]
    },
    "floor_2": {
      "name": "First Floor",
      "objects": []
    },
    "floor_3": {
      "name": "Rooftop",
      "objects": []
    }
  }
}
```

### 7.3 Data Constraints

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `version` | string | Yes | Must be "1.0" |
| `buildingId` | string | Yes | Lowercase, alphanumeric + hyphens only |
| `name` | string | Yes | 1-100 characters |
| `createdAt` | string | Yes | ISO8601 format |
| `updatedAt` | string | Yes | ISO8601 format |
| `floors` | object | Yes | At least 1 floor |
| `floors.*.name` | string | Yes | 1-50 characters |
| `floors.*.objects` | array | Yes | Can be empty |
| `objectLabel` | string | No | 0-100 characters |
| `objectTags` | string | No | Comma-separated, 0-200 characters |

### 7.4 Building ID Generation

**Algorithm:**
```javascript
function sanitizeBuildingId(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens
}

// Examples:
// "Centaurus Mall" → "centaurus-mall"
// "St. Mary's Hospital" → "st-mary-s-hospital"
// "Building #42" → "building-42"
```

---

## 8. API Specifications

### 8.1 Base URL
```
Production: https://intramap-api.{your-subdomain}.workers.dev
```

### 8.2 Endpoints

#### GET /api/buildings/:id
**Description:** Retrieve building data by ID

**Request:**
```http
GET /api/buildings/centaurus-mall HTTP/1.1
Host: intramap-api.example.workers.dev
Accept: application/json
```

**Response (200 OK):**
```json
{
  "version": "1.0",
  "buildingId": "centaurus-mall",
  "name": "Centaurus Mall",
  "createdAt": "2026-02-10T04:00:00.000Z",
  "updatedAt": "2026-02-16T10:30:00.000Z",
  "floors": { ... }
}
```

**Response (404 Not Found):**
```json
{
  "error": "Building not found"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Failed to load building"
}
```

#### POST /api/buildings/:id
**Description:** Create or update building data

**Request:**
```http
POST /api/buildings/centaurus-mall HTTP/1.1
Host: intramap-api.example.workers.dev
Content-Type: application/json

{
  "version": "1.0",
  "buildingId": "centaurus-mall",
  "name": "Centaurus Mall",
  "createdAt": "2026-02-10T04:00:00.000Z",
  "updatedAt": "2026-02-16T10:30:00.000Z",
  "floors": { ... }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "buildingId": "centaurus-mall",
  "message": "Building saved successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid building data"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Failed to save building"
}
```

### 8.3 CORS Configuration

**Headers:**
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

**Preflight Request Handling:**
```http
OPTIONS /api/buildings/:id HTTP/1.1
→ 200 OK with CORS headers
```

---

## 9. UI/UX Design

### 9.1 Design Principles

1. **Simplicity First** - No unnecessary features or complexity
2. **Mobile-First** - Optimized for smartphone screens
3. **Professional** - Clean, modern, not overly futuristic
4. **Accessible** - High contrast, readable fonts, clear labels
5. **Fast** - Minimal animations, instant feedback

### 9.2 Color Palette

**Primary Colors:**
- Primary Blue: `#3B82F6` - Actions, links, food category
- Success Green: `#10B981` - Restrooms, success states
- Danger Red: `#EF4444` - Exits, delete actions
- Gray: `#6B7280` - Shops, neutral elements
- Warning Orange: `#F59E0B` - Services, info desks

**Neutral Colors:**
- Dark: `#1F2937` - Text, borders
- Medium: `#6B7280` - Secondary text
- Light: `#F3F4F6` - Backgrounds
- White: `#FFFFFF` - Canvas, cards

### 9.3 Typography

**Font Family:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Font Sizes:**
- Headings: 24px-32px
- Body: 16px
- Small: 14px
- Tiny: 12px

### 9.4 Layout Structure

**Admin Editor:**
```
┌─────────────────────────────────────────────────────────┐
│  Top Toolbar (Building Name, Floors, Actions)           │
├──────────┬─────────────────────────────┬────────────────┤
│  Left    │                             │  Right         │
│  Sidebar │      Canvas Area            │  Properties    │
│  (Tools) │      (800x600)              │  Panel         │
│          │                             │                │
└──────────┴─────────────────────────────┴────────────────┘
```

**Viewer:**
```
┌─────────────────────────────────────────────────────────┐
│  Header (Building Name, Floor Selector, Search)         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│              Canvas Area (Full Width)                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Controls (Zoom, Reset, You Are Here)            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 9.5 Responsive Breakpoints

- **Desktop:** > 1024px - Full 3-column layout
- **Tablet:** 768px-1024px - Collapsible sidebars
- **Mobile:** < 768px - Single column, bottom toolbar

---

## 10. Success Metrics

### 10.1 Product Metrics

**Adoption Metrics:**
- Number of buildings created
- Number of QR codes generated
- Number of floor plans published

**Engagement Metrics:**
- Average time spent in editor
- Number of objects per floor plan
- Number of floors per building

**Usage Metrics:**
- Daily active viewers
- Search queries per session
- "Get Directions" clicks

### 10.2 Technical Metrics

**Performance:**
- Page load time < 2 seconds
- Time to interactive < 3 seconds
- Canvas render time < 500ms

**Reliability:**
- API uptime > 99.9%
- Error rate < 0.1%
- Successful saves > 99%

**Scalability:**
- Support 1,000+ buildings
- Handle 10,000+ daily viewers
- Maintain performance with 100+ objects per floor

---

## 11. Roadmap

### Phase 1: MVP ✅ (Completed)
- Basic floor plan editor
- 3 hardcoded floors
- Cloud storage
- QR code generation
- Viewer with search

### Phase 2: Dynamic Enhancements ✅ (Completed)
- Dynamic floor management
- Keyboard shortcuts (Ctrl+Z, Delete, etc.)
- Wall/line drawing tool
- Advanced styling controls
- Demo building

### Phase 3: Enhanced Features (Q2 2026)
- [ ] User authentication
- [ ] Multi-building management dashboard
- [ ] Advanced icon library (50+ icons)
- [ ] Image upload for custom icons
- [ ] Polygon drawing tool
- [ ] Copy/paste objects
- [ ] Grid snap and alignment tools

### Phase 4: Collaboration (Q3 2026)
- [ ] Multi-user editing
- [ ] Version history
- [ ] Comments and annotations
- [ ] Role-based permissions
- [ ] Activity logs

### Phase 5: Analytics (Q4 2026)
- [ ] Visitor analytics dashboard
- [ ] Popular search terms
- [ ] Heatmaps of navigation
- [ ] Peak usage times
- [ ] Conversion tracking

---

## 12. Constraints & Dependencies

### 12.1 Technical Constraints

**Cloudflare Workers:**
- 10ms CPU time per request
- 128MB memory limit
- No persistent connections

**Cloudflare KV:**
- Eventually consistent (not strongly consistent)
- 1MB value size limit
- Writes may take up to 60 seconds to propagate globally

**Browser Compatibility:**
- Requires modern browser with Canvas API
- Requires JavaScript enabled
- Requires localStorage for drafts

### 12.2 Business Constraints

**Free Tier Limits:**
- 100,000 Worker requests/day
- 100,000 KV reads/day
- 1,000 KV writes/day
- 100GB Vercel bandwidth/month

**Scaling Considerations:**
- May need paid plans for high-traffic buildings
- Large buildings (100+ objects) may impact performance
- Image uploads would require additional storage solution

### 12.3 Dependencies

**External Libraries:**
- Fabric.js (v5.3.0) - Canvas manipulation
- QRCode.js (v1.0.0) - QR generation

**Services:**
- Cloudflare Workers - Backend runtime
- Cloudflare KV - Data storage
- Vercel - Frontend hosting

**Browser APIs:**
- Canvas API - Drawing
- localStorage - Draft saving
- Service Worker - Offline support
- Fetch API - HTTP requests

---

## Appendix

### A. Glossary

- **Building ID:** Unique identifier for a building (URL-safe string)
- **Floor Plan:** Visual representation of a building floor
- **Object:** Any shape, icon, or text on the canvas
- **KV:** Key-Value storage (Cloudflare's database)
- **PWA:** Progressive Web App (installable, offline-capable)
- **QR Code:** Quick Response code for instant access

### B. References

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Fabric.js Documentation](http://fabricjs.com/docs/)
- [Vercel Documentation](https://vercel.com/docs)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

---

**Document Control:**
- **Created:** February 16, 2026
- **Last Updated:** February 16, 2026
- **Next Review:** March 16, 2026
- **Owner:** M Kaleem Akhtar
- **Status:** Living Document
