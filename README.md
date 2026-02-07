# 🗺️ IntraMap - Indoor Floor Plan Navigation System

A production-ready web application for creating and sharing interactive indoor floor plans with QR code navigation. Built entirely on **100% free services** (Cloudflare Workers + Vercel).

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Free](https://img.shields.io/badge/cost-$0%2Fmonth-brightgreen)

## ✨ Features

### For Building Owners (Admin)
- 🎨 **Drag-and-drop floor plan editor** with Fabric.js
- 🏢 **Multi-floor support** (Ground, First, Second floors)
- 🎯 **Pre-made icons** for common places (restaurants, restrooms, exits, etc.)
- 🎨 **Color-coded categories** (Blue=Food, Green=Restrooms, Red=Exits, etc.)
- 💾 **Auto-save** to localStorage every 10 seconds
- ☁️ **Cloud sync** with Cloudflare KV storage
- 📱 **QR code generation** for instant sharing
- 🔒 **Lock/unlock objects** to prevent accidental edits
- 📐 **Layer controls** (bring to front, send to back)

### For Visitors (Viewer)
- 📱 **Mobile-first responsive design**
- 🔍 **Smart search** by name or tags
- 📍 **"You Are Here" marker** placement
- 🧭 **Visual navigation** with path highlighting
- 🌐 **Works offline** after first load (PWA)
- ⚡ **Lightning fast** - loads in seconds on 3G
- 🎯 **Click objects** to see details and get directions

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

## 🎯 Usage

### Creating a Floor Plan

1. Open `admin.html`
2. Enter your building name (e.g., "Centaurus Mall")
3. Select a floor tab (Ground, First, Second)
4. Use shape tools or icon library to draw your floor plan
5. Click objects to edit properties:
   - Name (e.g., "Food Court")
   - Tags (e.g., "food, restaurant, pizza")
   - Color
6. Click "Save to Cloud" to store your floor plan
7. Click "Generate QR" to create a shareable QR code

### Viewing a Floor Plan

1. Scan the QR code or visit `viewer.html?building=your-building-id`
2. Search for places using the search bar
3. Click "You Are Here" and tap on the map to mark your location
4. Click any object to see details
5. Click "Get Directions" to see a visual path

## 🎨 Icon Library

Pre-made icons included:
- 🍴 Restaurant/Food
- 🚻 Restroom
- 🚪 Exit
- 🪜 Stairs
- 🛗 Elevator
- 🏧 ATM
- 🅿️ Parking
- ℹ️ Information
- 🛒 Shop
- ☕ Cafe
- 🏥 Medical
- 🔒 Security
- ❓ Help Desk

## 🎨 Color Scheme

**Category Colors:**
- Blue `#3B82F6` - Food/Restaurant
- Green `#10B981` - Restrooms
- Red `#EF4444` - Exits/Emergency
- Gray `#6B7280` - Shops/Retail
- Yellow `#F59E0B` - Services/Info

## 🔧 Configuration

### Update API URL

After deploying your Cloudflare Worker, update the API URL in `public/js/api.js`:

```javascript
// Option 1: Set global variable in HTML
<script>
  window.INTRAMAP_API_URL = 'https://your-worker.workers.dev';
</script>

// Option 2: Edit api.js directly
this.baseURL = baseURL || 'https://your-worker.workers.dev';
```

## 💰 Cost Breakdown

**100% FREE** with these limits:

| Service | Free Tier | Limit |
|---------|-----------|-------|
| Cloudflare Workers | ✅ Free | 100,000 requests/day |
| Cloudflare KV | ✅ Free | 100,000 reads/day, 1,000 writes/day |
| Vercel Hosting | ✅ Free | 100 GB bandwidth/month |

**Total Monthly Cost: $0** 🎉

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## 📱 PWA Features

- ✅ Installable on mobile devices
- ✅ Works offline after first load
- ✅ Caches static assets
- ✅ Fast load times

## 🔒 Security Notes

**Current MVP has no authentication.** Anyone with the building ID can:
- View the floor plan (intended)
- Edit the floor plan (if they know the admin URL)

For production use, consider adding:
- Simple password protection per building
- Admin authentication
- Rate limiting

## 🐛 Troubleshooting

### Admin editor doesn't save to cloud
- Check browser console for errors
- Verify Cloudflare Worker is deployed
- Check API URL in `api.js`
- Verify KV namespace is bound in `wrangler.toml`

### Viewer shows "Building not found"
- Ensure building was saved to cloud (not just localStorage)
- Check building ID in URL matches saved ID
- Verify Cloudflare Worker is accessible

### QR code doesn't work
- Ensure building is saved to cloud first
- Check QR code URL is correct
- Test viewer URL in browser before generating QR

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🙏 Credits

Built with:
- [Fabric.js](http://fabricjs.com/) - Canvas manipulation
- [QRCode.js](https://davidshimjs.github.io/qrcodejs/) - QR code generation
- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless backend
- [Vercel](https://vercel.com/) - Frontend hosting

## 📧 Support

For issues and questions, please open a GitHub issue.

---

**Made with ❤️ for better indoor navigation**
