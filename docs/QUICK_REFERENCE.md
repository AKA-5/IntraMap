# IntraMap - Quick Reference Guide

**Version:** 2.0 | **Last Updated:** February 16, 2026

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Ctrl+Z** | Undo | Revert last action (50-state history) |
| **Ctrl+Y** | Redo | Re-apply undone action |
| **Ctrl+Shift+Z** | Redo | Alternative redo shortcut |
| **Delete** | Delete | Remove currently selected object |
| **Escape** | Deselect | Clear selection |

> **Note:** Shortcuts are disabled when typing in input fields

---

## 🎨 Drawing Tools

### Shape Tools

| Tool | Icon | Usage | Best For |
|------|------|-------|----------|
| **Select** | ↖️ | Click and drag to move/resize | Editing existing objects |
| **Rectangle** | ▭ | Click to place | Rooms, areas, zones |
| **Circle** | ○ | Click to place | Points of interest, markers |
| **Text** | T | Click to place, type text | Labels, descriptions |
| **Wall/Line** | ─ | Click start, click end | Boundaries, walls, paths |

### Wall/Line Tool Workflow
1. Click **Wall/Line** tool button
2. Click on canvas for **start point**
3. Click again for **end point**
4. Line is created and selected
5. Adjust properties in right panel

---

## 🏢 Floor Management

### Adding a Floor
1. Click **"+ Floor"** button in toolbar
2. Enter custom floor name (e.g., "Basement", "Rooftop")
3. New floor tab appears
4. Automatically switches to new floor

### Renaming a Floor
1. **Right-click** on floor tab
2. Select **"✏️ Rename"**
3. Enter new name
4. Press Enter or click OK

### Deleting a Floor
1. **Right-click** on floor tab
2. Select **"🗑️ Delete"**
3. Confirm deletion
4. Floor is removed (cannot delete last floor)

---

## 🎨 Styling Controls

### Border Width
- **Range:** 0-20 pixels
- **Control:** Slider
- **Live Preview:** Shows current value (e.g., "5px")
- **Use Cases:**
  - 0px: No border (filled shapes only)
  - 2-4px: Standard room outlines
  - 8-12px: Thick walls
  - 15-20px: Major boundaries

### Border Style
- **Solid:** Continuous line (default)
- **Dashed:** [10px dash, 5px gap]
- **Dotted:** [2px dot, 3px gap]
- **Use Cases:**
  - Solid: Permanent walls
  - Dashed: Temporary barriers, future construction
  - Dotted: Suggested paths, guidelines

### Opacity
- **Range:** 0-100%
- **Control:** Slider
- **Live Preview:** Shows percentage
- **Use Cases:**
  - 100%: Solid, opaque objects
  - 50-80%: Semi-transparent overlays
  - 20-40%: Background elements
  - 0%: Invisible (but still selectable)

### Fill Color
- **Control:** Color picker
- **Presets:** Category colors available
- **Recommended Colors:**
  - Blue `#3B82F6`: Food/Dining
  - Green `#10B981`: Restrooms
  - Red `#EF4444`: Exits/Emergency
  - Gray `#6B7280`: Shops/Retail
  - Orange `#F59E0B`: Services/Info

---

## 💾 Save & Load

### Auto-Save (Draft)
- **Frequency:** Every 10 seconds
- **Storage:** Browser localStorage
- **Scope:** Current device only
- **Persistence:** Until browser cache cleared

### Save to Cloud
1. Click **"☁️ Save to Cloud"** button
2. Confirm building name
3. Wait for success message
4. Building is now accessible globally

### Load from Cloud
1. Click **"📥 Load"** button
2. Enter building ID
3. Confirm load (overwrites current draft)
4. Building data loads to editor

---

## 🔍 Search (Viewer)

### Search Syntax
- **By Name:** Type exact or partial name
  - Example: "Food" finds "Food Court"
- **By Tag:** Type any tag keyword
  - Example: "restaurant" finds all tagged locations
- **Case Insensitive:** Searches ignore case

### Search Results
- Results appear in dropdown
- Shows object name and floor
- Click result to:
  - Switch to correct floor
  - Highlight object
  - Zoom to object

---

## 🧭 Navigation (Viewer)

### "You Are Here" Feature
1. Click **"📍 You Are Here"** button
2. Tap on map where you're standing
3. Red marker appears
4. Marker persists across floor changes

### Get Directions
1. Search for or click destination
2. Details popup appears
3. Click **"Get Directions"** button
4. Visual path line appears from your location
5. Follow the highlighted route

---

## 📱 QR Code Generation

### Creating QR Code
1. Save building to cloud first
2. Click **"Generate QR"** button
3. QR code appears in modal
4. Right-click to save image
5. Print and display at building entrance

### QR Code URL Format
```
https://your-domain.vercel.app/viewer.html?building=your-building-id
```

---

## 🎯 Common Workflows

### Workflow 1: Create Simple Floor Plan
1. Open admin.html
2. Enter building name
3. Draw outer boundary with Wall/Line tool
4. Add rectangles for rooms
5. Label each room with Text tool
6. Assign colors by category
7. Save to cloud
8. Generate QR code

### Workflow 2: Multi-Floor Building
1. Open admin.html
2. Rename "Ground Floor" to match your building
3. Add additional floors (+ Floor button)
4. Switch between floors using tabs
5. Draw each floor independently
6. Use consistent colors across floors
7. Save to cloud

### Workflow 3: Update Existing Building
1. Click "Load" button
2. Enter building ID
3. Make changes (add/edit/delete objects)
4. Save to cloud (overwrites previous version)
5. Changes are live immediately

### Workflow 4: Visitor Navigation
1. Scan QR code at building entrance
2. Search for destination
3. Click "You Are Here" and mark location
4. Click destination object
5. Click "Get Directions"
6. Follow visual path

---

## 🐛 Troubleshooting

### Issue: Changes not saving
**Solution:**
- Check browser console for errors
- Verify internet connection
- Try saving with different building ID
- Clear browser cache and reload

### Issue: QR code not working
**Solution:**
- Ensure building is saved to cloud first
- Test viewer URL in browser before generating QR
- Check that building ID matches

### Issue: Search not finding locations
**Solution:**
- Verify objects have labels or tags
- Check spelling in search query
- Try searching by tags instead of name

### Issue: Undo not working
**Solution:**
- Undo only works for current session
- Max 50 states in history
- Refresh page clears undo history

---

## 📊 Best Practices

### Naming Conventions
- **Buildings:** Use descriptive names (e.g., "Centaurus Mall", "City Hospital")
- **Floors:** Use familiar terms (e.g., "Ground Floor", "Basement", "Rooftop")
- **Objects:** Be specific (e.g., "Food Court - North Wing" vs. just "Food")

### Tagging Strategy
- Use multiple tags per object
- Include synonyms (e.g., "restroom, washroom, toilet")
- Add category tags (e.g., "food, dining, restaurant")
- Use lowercase for consistency

### Color Coding
- Stick to category colors for consistency
- Use high contrast for visibility
- Avoid similar colors for adjacent objects
- Consider colorblind-friendly palettes

### Performance Tips
- Keep objects under 100 per floor for best performance
- Use simple shapes when possible
- Avoid excessive text objects
- Lock objects you don't need to edit

---

## 📞 Support Resources

- **README:** [README.md](file:///d:/CodeProjects/intramap/IntraMap/README.md)
- **Deployment Guide:** [DEPLOYMENT.md](file:///d:/CodeProjects/intramap/IntraMap/DEPLOYMENT.md)
- **PRD:** [PRD.md](file:///C:/Users/M%20Kaleem%20Akhtar/.gemini/antigravity/brain/a8a9658f-1ea9-44e8-8cc8-609822704842/PRD.md)
- **Technical Architecture:** [TECHNICAL_ARCHITECTURE.md](file:///C:/Users/M%20Kaleem%20Akhtar/.gemini/antigravity/brain/a8a9658f-1ea9-44e8-8cc8-609822704842/TECHNICAL_ARCHITECTURE.md)

---

**Made with ❤️ for better indoor navigation**
