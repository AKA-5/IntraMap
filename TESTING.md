# 🧪 IntraMap Testing Checklist

## Quick Testing Guide

### Prerequisites
✅ All files are in place (17 files in public directory)  
✅ Local server running (or deployed to hosting)

---

## 1️⃣ Landing Page Test (index.html)

Visit: `http://localhost:8000` or your deployed URL

**Expected Results:**
- [ ] Page loads without errors
- [ ] Hero section displays "🗺️ IntraMap"
- [ ] Two buttons visible: "✨ Create Floor Plan" and "🏢 View Live Demo"
- [ ] Subtitle mentions "Centaurus Shopping Mall demo with 3 floors and 30+ locations"
- [ ] Features section shows 6 feature cards
- [ ] QR generator section loads
- [ ] Footer displays copyright

**Test Actions:**
- [ ] Click "Create Floor Plan" → Should go to admin.html
- [ ] Click "View Live Demo" → Should go to viewer.html?building=sample
- [ ] Enter "sample" in QR generator → Should generate QR code
- [ ] Download QR code → Should save PNG file

---

## 2️⃣ Viewer Test (viewer.html?building=sample)

Visit: `http://localhost:8000/viewer.html?building=sample`

### Initial Load
- [ ] Loading overlay appears with "Loading floor plan..."
- [ ] Loading overlay disappears after data loads
- [ ] Welcome overlay appears (first visit only)
- [ ] Welcome overlay shows 4 instruction cards
- [ ] "Got it, let's explore!" button works
- [ ] Welcome overlay doesn't appear on second visit

### Header Elements
- [ ] Building title: "Centaurus Shopping Mall"
- [ ] Floor selector shows: "Ground Floor", "First Floor", "Second Floor - Entertainment"
- [ ] Search bar is visible
- [ ] Back button (top-left) is visible and clickable

### Floor Navigation
**Ground Floor:**
- [ ] Main building outline visible
- [ ] Main Entrance (teal) at bottom
- [ ] Food Court (blue) visible
- [ ] Restrooms (green) visible
- [ ] Information Desk (orange) visible
- [ ] ATM (orange) visible
- [ ] Multiple shops (gray/purple) visible
- [ ] Elevator and Stairs visible
- [ ] Emergency Exit (red) visible
- [ ] Total: ~13 locations

**First Floor:**
- [ ] Switch to "First Floor" in dropdown
- [ ] Cafe Corner (blue) visible
- [ ] Jewelry Store visible
- [ ] Premium Fashion Store (purple) visible
- [ ] Customer Service (orange) visible
- [ ] Total: ~10 locations

**Second Floor - Entertainment:**
- [ ] Switch to "Second Floor - Entertainment"
- [ ] Cinema Hall 1 (pink) visible
- [ ] Cinema Hall 2 (pink) visible
- [ ] Game Zone (orange) visible
- [ ] Snack Bar (blue) visible
- [ ] First Aid (red) visible
- [ ] Security Office (gray) visible
- [ ] Total: ~10 locations

### Search Functionality
Test these searches:
- [ ] "food" → Should find Food Court, Snack Bar
- [ ] "restroom" → Should find Restrooms on all floors
- [ ] "cinema" → Should find Cinema Hall 1 and 2
- [ ] "emergency" → Should find Emergency Exits and First Aid
- [ ] "shop" → Should find all store locations
- [ ] "coffee" → Should find Cafe Corner
- [ ] "game" → Should find Game Zone

### Interactive Features
- [ ] Click any location → Info popup appears
- [ ] Info popup shows location name
- [ ] Info popup shows floor badge
- [ ] Info popup shows tags
- [ ] "Get Directions" button visible
- [ ] Click "×" → Popup closes
- [ ] Click "You Are Here" → Activates placement mode
- [ ] Click canvas → Places marker
- [ ] Marker appears on canvas

### Controls
- [ ] Zoom In button works
- [ ] Zoom Out button works
- [ ] Reset View button works
- [ ] Canvas is draggable (pan)

---

## 3️⃣ Admin Panel Test (admin.html)

Visit: `http://localhost:8000/admin.html`

### Initial State
- [ ] Empty canvas with Grid Floor
- [ ] Toolbar visible at top
- [ ] Left sidebar with tools visible
- [ ] Right sidebar with properties visible
- [ ] Floor tabs container visible

### Load Demo Feature
- [ ] Click "📂 Load Demo" button
- [ ] Confirmation dialog appears
- [ ] Click OK
- [ ] Toast shows "Loading demo data..."
- [ ] Building name changes to "Centaurus Shopping Mall"
- [ ] 3 floor tabs appear: "Ground Floor", "First Floor", "Second Floor - Entertainment"
- [ ] Canvas shows Ground Floor with all locations
- [ ] Toast shows "Demo data loaded! Explore Centaurus Shopping Mall"

### Demo Data Verification
**Ground Floor Tab:**
- [ ] All 13 locations visible
- [ ] Icons displayed correctly
- [ ] Labels readable
- [ ] Colors match categories

**First Floor Tab:**
- [ ] Click "First Floor" tab
- [ ] Canvas clears and loads First Floor
- [ ] All 10 locations visible
- [ ] Layout looks professional

**Second Floor Tab:**
- [ ] Click "Second Floor - Entertainment" tab
- [ ] Canvas loads Second Floor
- [ ] Cinema halls visible
- [ ] Game Zone visible
- [ ] All 10 locations present

### Icon Library
Check that all icons are available in the sidebar:
- [ ] Restaurant icon
- [ ] Restroom icon
- [ ] Exit icon
- [ ] Stairs icon
- [ ] Elevator icon
- [ ] ATM icon
- [ ] Parking icon
- [ ] Info icon
- [ ] Shop icon
- [ ] Cafe icon
- [ ] Medical icon
- [ ] Security icon
- [ ] Help icon

### Editing Tools
- [ ] Select tool works
- [ ] Rectangle tool works
- [ ] Circle tool works
- [ ] Line/Wall tool works
- [ ] Text tool works
- [ ] Can select and move objects
- [ ] Can resize objects
- [ ] Can delete objects (Delete key)
- [ ] Undo works (Ctrl+Z)
- [ ] Redo works (Ctrl+Y)

### Properties Panel
- [ ] Click an object → Properties appear
- [ ] Object Label field editable
- [ ] Object Tags field editable
- [ ] Border Width slider works
- [ ] Border Style dropdown works
- [ ] Opacity slider works
- [ ] Fill color picker works
- [ ] Border color picker works
- [ ] Lock/Unlock button works
- [ ] Delete button works
- [ ] Bring to Front works
- [ ] Send to Back works

### Floor Management
- [ ] Click "+ Floor" button
- [ ] New floor tab appears
- [ ] Can rename floor (right-click → Rename)
- [ ] Can delete floor (right-click → Delete)
- [ ] Cannot delete last floor

### Save/Load Functions
- [ ] Click "💾 Save Draft" → LocalStorage saved
- [ ] Refresh page → Draft restored
- [ ] Click "☁️ Save to Cloud" → Opens modal (may fail without API)
- [ ] Click "📥 Load" → Prompts for ID
- [ ] Click "📱 Generate QR" → QR modal appears

### QR Generation
- [ ] QR modal shows QR code
- [ ] URL displayed correctly
- [ ] Can close modal
- [ ] Can download QR code

---

## 4️⃣ Mobile Responsiveness Test

### On Mobile Device (or Chrome DevTools Mobile View)

**Viewer:**
- [ ] Layout adapts to mobile screen
- [ ] Search bar is usable
- [ ] Floor selector is accessible
- [ ] Canvas fits screen
- [ ] Zoom controls are reachable
- [ ] "You Are Here" button visible
- [ ] Popup doesn't overflow screen

**Landing Page:**
- [ ] Hero section stacks vertically
- [ ] Buttons stack vertically
- [ ] Features grid adapts (1-2 columns)
- [ ] QR generator is usable
- [ ] Text is readable (no overflow)

**Admin Panel:**
- [ ] Toolbar may scroll horizontally (expected)
- [ ] Canvas is usable
- [ ] Sidebars collapse or stack (depends on screen size)

---

## 5️⃣ Browser Compatibility Test

Test in multiple browsers:

**Chrome/Edge:**
- [ ] All features work
- [ ] Canvas renders correctly
- [ ] Icons display properly

**Firefox:**
- [ ] All features work
- [ ] Canvas renders correctly
- [ ] Icons display properly

**Safari:**
- [ ] All features work
- [ ] Canvas renders correctly
- [ ] Icons display properly

---

## 6️⃣ Performance Test

- [ ] Demo loads in < 3 seconds on good connection
- [ ] Canvas responds smoothly to interactions
- [ ] No errors in browser console (F12)
- [ ] No memory leaks during extended use
- [ ] Search is instant

---

## 7️⃣ API Integration Test (Optional - requires deployed backend)

If you have a Cloudflare Worker deployed:

- [ ] Click "☁️ Save to Cloud" in admin
- [ ] Enter building ID
- [ ] Building saves successfully
- [ ] Can load building from viewer
- [ ] Building data persists
- [ ] Can update existing building

---

## 🐛 Common Issues & Fixes

### Issue: Demo doesn't load in viewer
**Fix:** 
- Check browser console for errors
- Verify `public/data/demo-building.json` exists
- Clear browser cache
- Try different browser

### Issue: Welcome overlay doesn't appear
**Fix:** 
- Clear localStorage: `localStorage.removeItem('intramap_welcome_seen')`
- Refresh page

### Issue: Icons don't display
**Fix:** 
- Check `public/js/icons.js` is loaded
- Verify network tab in DevTools
- Check console for SVG errors

### Issue: Load Demo button doesn't work
**Fix:** 
- Open browser console
- Check if there's a fetch error
- Verify demo-building.json path is correct

### Issue: QR code doesn't generate
**Fix:** 
- Verify `public/lib/qrcode.min.js` is loaded
- Check if building name is entered
- Look for JavaScript errors in console

---

## ✅ Success Criteria

All tests should PASS for a successful implementation:

- ✅ Landing page loads and all links work
- ✅ Demo viewer displays Centaurus Shopping Mall
- ✅ All 30+ locations are visible across 3 floors
- ✅ Search finds locations correctly
- ✅ Welcome overlay appears on first visit
- ✅ Load Demo button works in admin
- ✅ All 13 icon types are used in demo
- ✅ Mobile responsive
- ✅ No console errors
- ✅ Professional appearance

---

## 📊 Final Verification

Run through this quick checklist:

1. [ ] Visit landing page → Looks professional
2. [ ] Click "View Live Demo" → Demo loads
3. [ ] See welcome overlay → Dismiss it
4. [ ] Search for "food" → Finds 2+ locations
5. [ ] Switch floors → All 3 floors work
6. [ ] Click location → Info popup appears
7. [ ] Go to admin → Click "Load Demo"
8. [ ] Demo data loads → 3 floors, 30+ locations
9. [ ] Edit a location → Changes save
10. [ ] Generate QR → QR code appears

If all 10 steps work → **✅ PERFECT!**

---

## 🎉 Congratulations!

If all tests pass, your IntraMap installation is working perfectly with all the improvements!

**Next Steps:**
1. Deploy to Vercel (frontend)
2. Deploy Cloudflare Worker (backend)
3. Update API URL in `public/js/api.js`
4. Share with users!

**Support:**
- Documentation: `/docs` folder
- Quick Reference: `docs/QUICK_REFERENCE.md`
- Technical Details: `docs/TECHNICAL_ARCHITECTURE.md`
- Improvements Log: `IMPROVEMENTS.md`

---

**Happy Mapping! 🗺️**
