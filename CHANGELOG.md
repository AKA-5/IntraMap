# Changelog

All notable changes to IntraMap will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-02-26

### 🎉 Major Fixes & Improvements

This release fixes critical navigation issues and adds comprehensive documentation for users.

### 🐛 Fixed

- **[CRITICAL] Panning/dragging broken on all devices** - Fixed conflicting event handlers in [viewer.js](public/js/viewer.js)
  - Mouse panning now works correctly on desktop (click and drag empty space)
  - Touch panning works smoothly on mobile devices (one-finger drag)
  - Space key + drag for temporary pan mode works as expected
  - Multiple `mouse:down` handlers were consolidated into single, properly coordinated handlers
  
- **Zoom controls visibility** - Verified zoom controls are properly displayed
  - Zoom buttons (+/-) consistently visible in bottom-right corner on all devices
  - High z-index (9999) ensures buttons stay on top
  - Responsive positioning for mobile and desktop
  - All zoom methods working: buttons, keyboard shortcuts, pinch-to-zoom, mouse wheel

### ✨ Added

- **[USER_GUIDE.md](USER_GUIDE.md)** - Comprehensive user documentation including:
  - Complete editor guide with all tools and features
  - Viewer navigation instructions
  - Hidden features section (multi-select, copy/paste, keyboard shortcuts)
  - Pro tips for efficient map creation
  - Troubleshooting section
  - Keyboard shortcuts reference
  - Search optimization strategies
  
- **Enhanced keyboard shortcuts documentation**
  - All shortcuts now documented in README
  - Multi-selection with Shift+Click highlighted
  - Copy/paste workflows explained
  - Pan and zoom shortcuts clarified

### 📝 Changed

- **Updated README.md** with version 2.0 features
  - Added "What's New" banner
  - Enhanced features section with multi-selection info
  - Expanded keyboard shortcuts table
  - Added link to USER_GUIDE.md
  - Updated troubleshooting section with fixes
  
- **Improved event handling architecture**
  - Consolidated duplicate event listeners
  - Better separation of concerns (panning vs clicking)
  - More reliable touch gesture detection
  - Cleaner code structure in viewer.js

### 🎯 Technical Details

#### Event Handler Consolidation (viewer.js)

**Before (Broken):**
- Two separate `mouse:down` handlers (lines 44 & 88)
- Two separate `mouse:move` handlers  
- Two separate `mouse:up` handlers
- Handlers conflicted, causing panning to fail

**After (Fixed):**
- Single `mouse:down` handler managing both click tracking and panning
- Single `mouse:move` handler for panning movement and cursor updates
- Single `mouse:up` handler for panning end and click detection
- Proper state management with `isPanning` flag
- Click detection only triggers when not panning (< 5px movement)

---

## [1.0.0] - 2026-02-16

### Initial Release

#### Features

**Editor (Admin)**
- Fabric.js canvas-based floor plan editor
- Drawing tools: Rectangle, Circle, Line/Wall, Text
- Icon library with 13 SVG icons
- Color picker with presets
- Properties panel for object customization
- Multi-floor support with tabs
- Undo/Redo with 50-step history
- Copy/Paste functionality
- Auto-save to localStorage (10 seconds)
- Cloud save to Cloudflare KV
- QR code generation

**Viewer**
- Mobile-first responsive design
- Smart search by name and tags
- Floor selector dropdown
- Interactive object details popup
- Zoom controls (buttons, keyboard, mouse wheel)
- PWA support with offline caching
- Touch gestures (intended, but had bugs)

**Backend**
- Cloudflare Workers serverless API
- Cloudflare KV storage
- REST endpoints for CRUD operations
- CORS support
- Data validation

**Deployment**
- Vercel hosting for frontend
- Cloudflare Workers for backend
- 100% free infrastructure
- Simple deployment process

#### Known Issues (Fixed in v2.0)

- ⚠️ Panning/dragging not working due to event handler conflicts
- ⚠️ Touch gestures unreliable on mobile
- ⚠️ No comprehensive user documentation

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 2.0.0 | 2026-02-26 | **Critical bug fixes** - Panning/zoom issues resolved + user guide |
| 1.0.0 | 2026-02-16 | Initial production release |

---

## Upgrade Notes

### From 1.0 to 2.0

**No breaking changes!** Simply update your files:

1. **Replace viewer.js** with the new version
2. **Add USER_GUIDE.md** to your repository (optional)
3. **Update README.md** with new features (optional)

**No database migrations** required - data format unchanged.

**No API changes** - all endpoints remain the same.

**Users will immediately benefit from:**
- Working panning/dragging on all devices
- More reliable touch gestures
- Better documentation

---

## Future Releases

### Planned for v2.1
- Multi-language support (i18n)
- Floor plan templates
- Bulk import/export
- Analytics dashboard
- User authentication system

### Planned for v2.2
- Real-time collaboration
- 3D floor visualization
- Voice navigation
- WCAG 2.1 AA compliance
- Native mobile apps

---

## Contributing

Found a bug or want to contribute? See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Report issues at: [GitHub Issues](../../issues)

---

**IntraMap** - Making indoor navigation simple and accessible for everyone.
