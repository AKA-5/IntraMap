# 🚀 IntraMap Deployment Guide

Complete step-by-step guide to deploy IntraMap to production using free services.

## Prerequisites

Before you begin, make sure you have:
- ✅ A Cloudflare account (free) - [Sign up here](https://dash.cloudflare.com/sign-up)
- ✅ A Vercel account (free) - [Sign up here](https://vercel.com/signup)
- ✅ Node.js 16+ installed
- ✅ Git installed

---

## Part 1: Deploy Cloudflare Worker (Backend)

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open a browser window. Click "Allow" to authorize Wrangler.

### Step 3: Create KV Namespace

```bash
cd worker
wrangler kv namespace create BUILDINGS
```

You'll see output like:
```
🌀 Creating namespace with title "intramap-api-BUILDINGS"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "BUILDINGS", id = "abc123def456..." }
```

**Copy the ID** (e.g., `abc123def456...`)

### Step 4: Update wrangler.toml

Open `worker/wrangler.toml` and replace `YOUR_KV_NAMESPACE_ID_HERE` with the ID from Step 3:

```toml
[[kv_namespaces]]
binding = "BUILDINGS"
id = "abc123def456..."  # ← Your actual ID here
```

### Step 5: Deploy Worker

```bash
wrangler deploy
```

You'll see output like:
```
✨ Success! Uploaded 1 file
🌎 Published intramap-api
   https://intramap-api.your-subdomain.workers.dev
```

**Copy the Worker URL** (e.g., `https://intramap-api.your-subdomain.workers.dev`)

### Step 6: Test Worker API

Test that your API is working:

```bash
# Test GET (should return 404 for non-existent building)
curl https://intramap-api.your-subdomain.workers.dev/api/buildings/test

# Test POST (save a building)
curl -X POST https://intramap-api.your-subdomain.workers.dev/api/buildings/test \
  -H "Content-Type: application/json" \
  -d '{"version":"1.0","name":"Test Building","floors":{"ground":{"name":"Ground Floor","objects":[]}}}'

# Test GET again (should return the building)
curl https://intramap-api.your-subdomain.workers.dev/api/buildings/test
```

---

## Part 2: Deploy Frontend (Vercel)

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/intramap.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure:
     - **Framework Preset**: Other
     - **Root Directory**: `./` (leave as default)
     - **Build Command**: (leave empty)
     - **Output Directory**: `public`
   - Click "Deploy"

3. **Wait for deployment**
   - Vercel will deploy your site
   - You'll get a URL like `https://intramap.vercel.app`

### Option B: Deploy via CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Follow prompts**
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? **intramap** (or your choice)
   - In which directory is your code located? **./public**
   - Want to override settings? **N**

5. **Copy deployment URL**
   - You'll see: `✅ Production: https://intramap.vercel.app`

---

## Part 3: Connect Frontend to Backend

### Update API URL

You need to tell the frontend where your Cloudflare Worker is.

**Option 1: Edit api.js (Recommended)**

Open `public/js/api.js` and update line 6:

```javascript
this.baseURL = baseURL || 'https://intramap-api.your-subdomain.workers.dev';
```

Replace with your actual Worker URL from Part 1, Step 5.

**Option 2: Add script tag to HTML files**

Add this to the `<head>` section of `index.html`, `admin.html`, and `viewer.html`:

```html
<script>
  window.INTRAMAP_API_URL = 'https://intramap-api.your-subdomain.workers.dev';
</script>
```

### Redeploy Frontend

After updating the API URL:

```bash
# If using Vercel CLI
vercel --prod

# If using GitHub + Vercel dashboard
git add .
git commit -m "Update API URL"
git push
# Vercel will auto-deploy
```

---

## Part 4: Upload Sample Data (Optional)

Upload the sample building to test your deployment:

```bash
curl -X POST https://intramap-api.your-subdomain.workers.dev/api/buildings/sample-mall \
  -H "Content-Type: application/json" \
  -d @sample-data/sample-mall.json
```

Then visit: `https://intramap.vercel.app/viewer.html?building=sample-mall`

---

## Part 5: Custom Domain (Optional)

### For Vercel (Frontend)

1. Go to your project in Vercel dashboard
2. Click "Settings" → "Domains"
3. Add your domain (e.g., `intramap.yourdomain.com`)
4. Follow DNS configuration instructions

### For Cloudflare Worker (Backend)

1. Go to Cloudflare dashboard
2. Select your domain
3. Go to "Workers Routes"
4. Add route: `api.yourdomain.com/*` → `intramap-api`
5. Update API URL in frontend to `https://api.yourdomain.com`

---

## 🎉 You're Done!

Your IntraMap is now live and accessible at:
- **Frontend**: `https://intramap.vercel.app`
- **Backend**: `https://intramap-api.your-subdomain.workers.dev`

### Next Steps

1. **Create your first floor plan**
   - Visit `https://intramap.vercel.app/admin.html`
   - Draw your building's floor plan
   - Save to cloud
   - Generate QR code

2. **Share with visitors**
   - Print the QR code
   - Place it at your building entrance
   - Visitors scan and navigate!

---

## 🔧 Troubleshooting

### "Building not found" error in viewer

**Problem**: Viewer can't load building data

**Solutions**:
1. Check that building was saved to cloud (not just localStorage)
2. Verify building ID in URL matches saved ID
3. Test API directly: `curl https://your-worker.workers.dev/api/buildings/YOUR_ID`
4. Check browser console for CORS errors
5. Verify KV namespace is correctly bound in `wrangler.toml`

### CORS errors in browser console

**Problem**: Frontend can't communicate with Worker

**Solutions**:
1. Verify Worker is deployed: `wrangler deployments list`
2. Check Worker URL is correct in `api.js`
3. Test Worker directly with curl (see Part 1, Step 6)
4. Redeploy Worker: `cd worker && wrangler deploy`

### Admin editor doesn't save

**Problem**: "Save to Cloud" button doesn't work

**Solutions**:
1. Open browser console (F12) and check for errors
2. Verify API URL is set correctly
3. Test Worker API with curl
4. Check that building name is filled in
5. Try saving to a different building ID

### Vercel deployment fails

**Problem**: Deployment errors on Vercel

**Solutions**:
1. Ensure `vercel.json` is in root directory
2. Check that `public/` folder exists with all files
3. Verify no syntax errors in HTML/CSS/JS files
4. Check Vercel deployment logs for specific errors

### Worker deployment fails

**Problem**: `wrangler deploy` shows errors

**Solutions**:
1. Verify you're logged in: `wrangler whoami`
2. Check `wrangler.toml` syntax is correct
3. Ensure KV namespace ID is valid
4. Try: `wrangler logout` then `wrangler login`
5. Update Wrangler: `npm install -g wrangler@latest`

---

## 📊 Monitoring Usage

### Cloudflare Dashboard

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click "Workers & Pages"
3. Select "intramap-api"
4. View metrics:
   - Requests per day
   - Errors
   - CPU time

### Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click "Analytics"
4. View:
   - Page views
   - Bandwidth usage
   - Performance metrics

---

## 🔄 Updating Your Deployment

### Update Frontend

```bash
# Make your changes to files in public/
git add .
git commit -m "Update frontend"
git push

# Or if using CLI
vercel --prod
```

### Update Worker

```bash
cd worker
# Make your changes to index.js
wrangler deploy
```

---

## 💾 Backup Your Data

### Export all buildings from KV

```bash
# List all buildings
wrangler kv:key list --namespace-id=YOUR_KV_NAMESPACE_ID

# Get specific building
wrangler kv:key get "building:YOUR_BUILDING_ID" --namespace-id=YOUR_KV_NAMESPACE_ID > backup.json
```

### Import building to KV

```bash
wrangler kv:key put "building:YOUR_BUILDING_ID" --path=backup.json --namespace-id=YOUR_KV_NAMESPACE_ID
```

---

## 🎯 Production Checklist

Before going live:

- [ ] Worker deployed and accessible
- [ ] Frontend deployed to Vercel
- [ ] API URL updated in frontend
- [ ] Sample data uploaded and tested
- [ ] QR code generation works
- [ ] Viewer loads correctly on mobile
- [ ] Search functionality works
- [ ] "You Are Here" and directions work
- [ ] Offline mode tested (disconnect internet, reload)
- [ ] Tested on multiple browsers
- [ ] Tested on actual mobile devices

---

## 📞 Need Help?

- Check [README.md](README.md) for general usage
- Review [Cloudflare Workers docs](https://developers.cloudflare.com/workers/)
- Review [Vercel docs](https://vercel.com/docs)
- Open a GitHub issue

---

**Happy Mapping! 🗺️**
