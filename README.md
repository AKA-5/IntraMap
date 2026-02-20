# 🗺️ IntraMap - Indoor Navigation Platform

A modern, production-ready web application for creating and sharing interactive indoor floor plans with QR code navigation. Built on **100% free cloud services** (Cloudflare Workers + Vercel).

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Cost](https://img.shields.io/badge/cost-$0%2Fmonth-brightgreen)
![Mobile](https://img.shields.io/badge/mobile-optimized-success)

---

## ✨ Features

### 🎨 For Building Administrators

**Floor Plan Editor**
- **Drag-and-drop interface** - Intuitive canvas-based editor powered by Fabric.js
- **Multiple floor support** - Create unlimited floors with custom names (Ground, Basement, Mezzanine, etc.)
- **Drawing tools** - Rectangles, circles, text labels, and wall/line tool
- **Professional icon library** - 13 SVG icons with color-coded categories:
  - 🍴 Restaurant/Cafe (Blue `#3B82F6`)
  - 🚻 Restrooms (Green `#10B981`)
  - 🚪 Exit (Red `#DC2626`)
  - 🪜 Stairs/Elevator (Gray `#6B7280`)
  - 🏧 ATM/Info (Yellow `#F59E0B`)
  - 🛒 Shop/Parking (Gray `#6B7280`)
  - 🏥 Medical/Security (Gray/Red)

**Advanced Editing**
- **Property panel** - Edit name, tags, colors, opacity, borders
- **Border customization** - Width (0-20px), style (solid/dashed/dotted)
- **Layer controls** - Bring to front, send to back
- **Lock objects** - Prevent accidental modifications
- **Keyboard shortcuts** - Undo (Ctrl+Z), Redo (Ctrl+Y), Delete, Escape

**Data Management**
- **Auto-save** - Local storage backup every 10 seconds
- **Cloud sync** - Save to Cloudflare KV storage
- **QR code generation** - Instant shareable links
- **Demo data** - Load comprehensive Centaurus Shopping Mall example

### 📱 For Visitors

**Mobile-First Design**
- **Touch-optimized scrolling** - Smooth panning like Google Maps
- **Responsive canvas** - Adapts to any screen size (phone, tablet, desktop)
- **Bottom-sheet popups** - Native mobile experience
- **Optimized layout** - Content fills screen efficiently

**Navigation Features**
- **Smart search** - Find locations by name or tags
- **Interactive floor plans** - Click locations for details
- **Floor switching** - Easy dropdown selector
- **Precise click detection** - Accurate selection of adjacent items

**Performance**
- **PWA support** - Installable, works offline
- **Fast loading** - Optimized for 3G networks
- **Smooth animations** - 60fps transitions
- **Cached assets** - Instant repeat visits

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ (for local development)
- Cloudflare account (free)
- Vercel account (free) or GitHub account

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd IntraMap
npm install
```

### 2. Test Locally

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 3. Deploy Backend (Cloudflare Worker)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

Quick version:
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create KV namespace
wrangler kv:namespace create BUILDINGS

# Update worker/wrangler.toml with the namespace ID

# Deploy
npm run deploy:worker
```

### 4. Deploy Frontend (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
npm run deploy:vercel
```

Or use the Vercel dashboard to connect your GitHub repository.

## 📁 Project Structure

```
IntraMap/
├── public/                 # Frontend files
│   ├── index.html         # Landing page
│   ├── admin.html         # Floor plan editor
│   ├── viewer.html        # Map viewer
│   ├── css/
│   │   ├── common.css     # Shared styles
│   │   ├── admin.css      # Editor styles
│   │   └── viewer.css     # Viewer styles
│   ├── js/
│   │   ├── admin.js       # Editor logic
│   │   ├── viewer.js      # Viewer logic
│   │   ├── api.js         # API client
│   │   └── icons.js       # Icon library
│   ├── lib/               # External libraries
│   ├── manifest.json      # PWA manifest
│   └── sw.js              # Service worker
├── worker/                # Cloudflare Worker
│   ├── index.js           # API endpoints
│   └── wrangler.toml      # Worker config
├── sample-data/           # Sample building data
└── README.md
```

## 🎯 Usage Guide

### Creating Your First Floor Plan

1. **Open Admin Panel**
   - Navigate to `admin.html`
   - Enter building name (e.g., "Shopping Mall", "Office Building")

2. **Design Floors**
   - Start with the default "Ground Floor"
   - Add floors using **"+ Floor"** button
   - Right-click floor tabs to rename or delete
   - Supported floor types: Basement, Ground, Mezzanine, Upper floors, Rooftop

3. **Add Elements**
   - **Shapes** - Draw rooms and areas (rectangles, circles)
   - **Lines** - Create walls and boundaries (click twice)
   - **Text** - Add labels and descriptions
   - **Icons** - Select from 13 professional icons

4. **Customize Properties**
   - Click any object to open the properties panel
   - Set **Name** (e.g., "Food Court")
   - Add **Tags** (e.g., "food, restaurant, dining")
   - Choose **Fill Color**
   - Adjust **Border** (width, style, color)
   - Set **Opacity** (0-100%)
   - **Lock/Unlock** to prevent edits

5. **Save & Share**
   - Auto-saves to browser every 10 seconds
   - Click **"Save to Cloud"** to sync
   - Click **"Generate QR Code"** for sharing
   - Download or display QR code for visitors

### Viewing Floor Plans

**Via QR Code:**
- Scan QR code with phone camera
- Browser opens viewer automatically
- Navigate and search locations

**Via URL:**
- Visit `viewer.html?building=<building-id>`
- Use search bar to find locations
- Click locations for details
- Switch floors using dropdown

**Mobile Navigation:**
- **Pan/Scroll** - Touch and drag anywhere on white canvas area
- **Search** - Type location name or tags
- **Details** - Tap any location box

---

## 🎨 Design System

### Icon Library

| Icon | Category | Color | Use Case |
|------|----------|-------|----------|
| 🍴 Restaurant | Food | Blue `#3B82F6` | Dining areas, food courts |
| ☕ Cafe | Food | Blue `#3B82F6` | Coffee shops, cafeterias |
| 🚻 Restroom | Facilities | Green `#10B981` | Bathrooms, washrooms |
| 🚪 Exit | Safety | Red `#DC2626` | Emergency exits, doors |
| 🪜 Stairs | Navigation | Gray `#6B7280` | Staircases |
| 🛗 Elevator | Navigation | Gray `#6B7280` | Lifts, elevators |
| 🏧 ATM | Services | Yellow `#F59E0B` | Cash machines |
| ℹ️ Info | Services | Yellow `#F59E0B` | Help desks, reception |
| 🛒 Shop | Retail | Gray `#6B7280` | Stores, boutiques |
| 🅿️ Parking | Services | Gray `#6B7280` | Parking areas |
| 🏥 Medical | Healthcare | Red `#DC2626` | Clinics, first aid |
| 🔒 Security | Safety | Gray `#6B7280` | Security offices |
| ❓ Help | Services | Yellow `#F59E0B` | Information counters |

### Color Palette

```css
/* Primary Colors */
--primary-blue: #3B82F6;    /* Food, navigation highlights */
--success-green: #10B981;   /* Restrooms, confirmations */
--danger-red: #DC2626;      /* Exits, emergencies, deletions */
--warning-yellow: #F59E0B;  /* Services, information */

/* Neutral Colors */
--gray-900: #111827;        /* Text, headings */
--gray-700: #374151;        /* Secondary text */
--gray-500: #6B7280;        /* Icons, borders */
--gray-300: #D1D5DB;        /* Dividers */
--gray-100: #F3F4F6;        /* Backgrounds */
```

---

## 🔧 Technical Architecture

### Frontend Stack
- **HTML5/CSS3** - Modern semantic markup
- **Vanilla JavaScript** - No framework dependencies
- **Fabric.js 5.x** - Canvas manipulation and rendering
- **QRCode.js** - QR code generation
- **PWA** - Service worker for offline support

### Backend Stack
- **Cloudflare Workers** - Serverless edge computing
- **Cloudflare KV** - Global key-value storage
- **REST API** - Simple CRUD operations

### Mobile Optimization
- **Touch scrolling** - Pan and zoom like Google Maps
- **Responsive canvas** - Adapts to screen size (320px - 2560px)
- **Bottom sheets** - Native mobile UI patterns
- **Viewport handling** - Dynamic viewport height (dvh) units
- **Touch targets** - Minimum 44px for accessibility

### Performance Features
- **Lazy loading** - Load assets on demand
- **Canvas caching** - Efficient rendering
- **Debounced auto-save** - Prevents excessive writes
- **Optimized images** - SVG icons for scalability
- **Service worker** - Cache-first strategy

---

## 🔧 Configuration

### Update API Endpoint

After deploying your Cloudflare Worker, update the API URL:

**Option 1: In HTML files** (Recommended)
```html
<!-- public/admin.html, viewer.html -->
<script>
  window.INTRAMAP_API_URL = 'https://your-worker.workers.dev';
</script>
```

**Option 2: In api.js**
```javascript
// public/js/api.js
const API = new IntraMapAPI('https://your-worker.workers.dev');
```

---

## ⌨️ Keyboard Shortcuts

### Admin Editor
| Shortcut | Action |
|----------|--------|
| `Ctrl + Z` | Undo last action (50-step history) |
| `Ctrl + Y` | Redo action |
| `Delete` | Remove selected object |
| `Escape` | Deselect object / Cancel action |
| `Ctrl + S` | Save to cloud (custom binding) |

### Viewer
| Shortcut | Action |
|----------|--------|
| `Escape` | Close popup / Clear search |
| `/` | Focus search bar |

---

## 💰 Pricing & Limits

**100% FREE** with generous limits:

| Service | Free Tier | Monthly Limit | Sufficient For |
|---------|-----------|---------------|----------------|
| **Cloudflare Workers** | ✅ | 100,000 requests/day | ~3M requests/month |
| **Cloudflare KV** | ✅ | 100,000 reads/day<br>1,000 writes/day | ~3M reads, ~30K writes |
| **Vercel Hosting** | ✅ | 100 GB bandwidth | ~100K visitors |

**Total Monthly Cost: $0** 🎉

**Upgrade only if:**
- More than 3M monthly page views
- More than 30K building updates per month
- Need custom domain SSL (Cloudflare offers free)

---

## 🌐 Browser Compatibility

### Desktop
| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome | 90+ | ✅ Fully Supported |
| Firefox | 88+ | ✅ Fully Supported |
| Safari | 14+ | ✅ Fully Supported |
| Edge | 90+ | ✅ Fully Supported |

### Mobile
| Platform | Minimum Version | Status |
|----------|----------------|--------|
| iOS Safari | 14+ | ✅ Fully Supported |
| Chrome Android | 90+ | ✅ Fully Supported |
| Samsung Internet | 15+ | ✅ Fully Supported |
| Firefox Mobile | 88+ | ✅ Fully Supported |

**Progressive Web App (PWA):**
- ✅ Installable on mobile home screen
- ✅ Offline support after first visit
- ✅ Native app-like experience
- ✅ Push notifications ready (not implemented)

---

## 🐛 Troubleshooting

### Common Issues

**Problem: Can't save building to cloud**
- ✅ Check browser console (F12) for errors
- ✅ Verify Cloudflare Worker is deployed and accessible
- ✅ Confirm API URL in HTML matches your worker URL
- ✅ Check KV namespace is bound in `wrangler.toml`
- ✅ Test worker directly: `https://your-worker.workers.dev/api/buildings/test`

**Problem: Viewer shows "Building not found"**
- ✅ Ensure building was saved to *cloud*, not just localStorage
- ✅ Verify building ID in URL matches the saved ID
- ✅ Check Cloudflare KV dashboard for stored data
- ✅ Test API endpoint with saved building ID

**Problem: QR code doesn't work**
- ✅ Save building to cloud *before* generating QR
- ✅ Verify QR code URL format: `https://your-domain.vercel.app/viewer.html?building=<id>`
- ✅ Test URL in browser before scanning

**Problem: Canvas not scrollable on mobile**
- ✅ Hard refresh browser (Ctrl+Shift+R)
- ✅ Clear browser cache
- ✅ Check for console errors
- ✅ Ensure viewport meta tag is present in HTML

**Problem: Icons not appearing in admin**
- ✅ Check `icons.js` is loaded before `admin.js` in HTML
- ✅ Open browser console, look for JavaScript errors
- ✅ Verify SVG icons have `fill="currentColor"` attribute
- ✅ Hard refresh to clear cached files

**Problem: Slow performance on mobile**
- ✅ Reduce number of objects on canvas (<100 recommended)
- ✅ Use simpler shapes instead of complex icons
- ✅ Disable unnecessary animations
- ✅ Clear browser cache and data

---

## 🔒 Security & Privacy

### Current Status (MVP)
⚠️ **No authentication implemented** - Suitable for public/internal use only

**Anyone with the URL can:**
- ✅ View floor plans (intended behavior)
- ⚠️ Edit floor plans if they access admin URL

### Recommendations for Production

**Add Authentication:**
```javascript
// Example: Simple password protection per building
const BUILDING_PASSWORDS = {
  'building-123': 'secret-password-123'
};
```

**Implement Rate Limiting:**
```javascript
// In Cloudflare Worker
if (requestsPerMinute > 100) {
  return new Response('Too many requests', { status: 429 });
}
```

**Enable CORS:**
```javascript
// Allow only your domain
headers.set('Access-Control-Allow-Origin', 'https://yourdomain.com');
```

**Use Environment Variables:**
```toml
# wrangler.toml
[env.production]
vars = { ADMIN_PASSWORD = "your-secret-password" }
```

---

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed deployment instructions
- **[QUICKSTART.md](QUICKSTART.md)** - 5-minute setup guide
- **[TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md)** - System design
- **[PRD.md](docs/PRD.md)** - Product requirements
- **[TESTING.md](TESTING.md)** - Testing procedures

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

**Bug Reports:**
- Open an issue with steps to reproduce
- Include browser/device information
- Attach screenshots if applicable

**Feature Requests:**
- Describe the use case
- Explain expected behavior
- Consider implementation complexity

**Pull Requests:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Code Style:**
- Use meaningful variable names
- Comment complex logic
- Follow existing patterns
- Test on mobile and desktop

---

## 📄 License

**MIT License** - Free for personal and commercial use

```
Copyright (c) 2026 IntraMap Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

**Built with excellent open-source tools:**

- **[Fabric.js](http://fabricjs.com/)** - Powerful canvas library for interactive graphics
- **[QRCode.js](https://davidshimjs.github.io/qrcodejs/)** - Pure JavaScript QR code generation
- **[Cloudflare Workers](https://workers.cloudflare.com/)** - Blazing fast serverless platform
- **[Vercel](https://vercel.com/)** - Premier frontend hosting and deployment
- **[Claude](https://claude.ai/)** - AI assistant for code generation and architecture

**Special thanks to:**
- All open-source contributors
- The Fabric.js community
- Cloudflare and Vercel teams

---

## 📧 Support & Contact

**Need help?**
- 📖 Read the [documentation](docs/)
- 🐛 Report bugs via [GitHub Issues](../../issues)
- 💬 Ask questions in [Discussions](../../discussions)
- 📧 Email: your-email@example.com (replace with actual)

**Professional Support:**
- Custom implementations available
- Enterprise deployment assistance
- Training and workshops
- Contact for pricing

---

## 🗺️ Roadmap

**Version 2.1 (Planned)**
- [ ] Multi-language support (i18n)
- [ ] Floor plan templates library
- [ ] Bulk import/export (JSON/CSV)
- [ ] Analytics dashboard
- [ ] User authentication

**Version 2.2 (Future)**
- [ ] Real-time collaboration
- [ ] 3D floor visualization
- [ ] Voice navigation
- [ ] Accessibility improvements (WCAG 2.1 AA)
- [ ] Native mobile apps (React Native)

**Want to contribute?** Pick an item from the roadmap and submit a PR!

---

<div align="center">

**Made with ❤️ for better indoor navigation**

[Demo](https://intra-map-six.vercel.app) · [Documentation](docs/) · [Report Bug](../../issues) · [Request Feature](../../issues)

---

**IntraMap v2.0.0** | [MIT License](LICENSE) | © 2026

</div>
