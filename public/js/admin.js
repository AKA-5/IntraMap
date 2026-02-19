// IntraMap - Admin Editor Logic
// Handles floor plan creation and editing with Fabric.js

// Global state
let canvas;
let buildingData = {
    version: '1.0',
    buildingId: '',
    name: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    floors: {
        floor_1: {
            name: 'Ground Floor',
            objects: []
        }
    }
};
let currentFloor = 'floor_1';
let currentTool = 'select';
let currentColor = '#3B82F6';
let copiedObject = null; // For copy/paste functionality
let autoSaveTimer;
let selectedObject = null;
let floorCounter = 2; // For generating unique floor IDs
let undoStack = [];
let redoStack = [];
let isDrawingLine = false;
let lineStartPoint = null;

// Initialize editor on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeCanvas();
    initializeToolbar();
    initializeIconGrid();
    initializeColorPickers();
    initializeKeyboardShortcuts();
    renderFloorTabs();
    loadDraftFromLocalStorage();
    startAutoSave();
});

// Initialize Fabric.js canvas
function initializeCanvas() {
    canvas = new fabric.Canvas('floorPlanCanvas', {
        backgroundColor: '#FFFFFF',
        selection: true,
        preserveObjectStacking: true
    });

    // Mouse wheel: Ctrl = Zoom, Shift = Horizontal scroll, Default = Vertical/Horizontal scroll
    canvas.on('mouse:wheel', function (opt) {
        const evt = opt.e;
        const deltaY = evt.deltaY;
        const deltaX = evt.deltaX;
        
        if (evt.ctrlKey) {
            // Ctrl + Wheel = Zoom
            let zoom = canvas.getZoom();
            zoom *= 0.999 ** deltaY;
            if (zoom > 5) zoom = 5;
            if (zoom < 0.1) zoom = 0.1;
            canvas.zoomToPoint({ x: evt.offsetX, y: evt.offsetY }, zoom);
        } else if (evt.shiftKey) {
            // Shift + Wheel = Horizontal scroll
            const vpt = canvas.viewportTransform;
            vpt[4] -= deltaY * 0.5;
            canvas.requestRenderAll();
        } else {
            // Default Wheel = Vertical and Horizontal scroll (trackpad support)
            const vpt = canvas.viewportTransform;
            if (deltaY !== 0) {
                vpt[5] -= deltaY * 0.5; // Vertical pan
            }
            if (deltaX !== 0) {
                vpt[4] -= deltaX * 0.5; // Horizontal pan
            }
            canvas.requestRenderAll();
        }
        
        opt.e.preventDefault();
        opt.e.stopPropagation();
    });

    // Handle object selection
    canvas.on('selection:created', handleObjectSelection);
    canvas.on('selection:updated', handleObjectSelection);
    canvas.on('selection:cleared', clearPropertiesPanel);

    // Save state before object modification for undo
    canvas.on('object:moving', () => {
        // This fires once when movement starts
        if (!canvas._undoSavedForCurrentAction) {
            saveState();
            canvas._undoSavedForCurrentAction = true;
        }
    });
    
    canvas.on('object:scaling', (e) => {
        if (!canvas._undoSavedForCurrentAction) {
            saveState();
            canvas._undoSavedForCurrentAction = true;
        }
    });
    
    canvas.on('object:rotating', (e) => {
        if (!canvas._undoSavedForCurrentAction) {
            saveState();
            canvas._undoSavedForCurrentAction = true;
        }
    });

    // Handle object modifications (after modification completes)
    canvas.on('object:modified', () => {
        canvas._undoSavedForCurrentAction = false; // Reset flag
        saveCurrentFloorToData();
        triggerAutoSave();
    });

    // Handle double-click for quick edit
    canvas.on('mouse:dblclick', (e) => {
        if (e.target) {
            showPropertiesPanel(e.target);
        }
    });
}

// Initialize toolbar event listeners
function initializeToolbar() {
    // Floor tabs will be handled by renderFloorTabs() function

    // Shape tools
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectTool(btn.dataset.tool);
        });
    });

    // Building name input
    document.getElementById('buildingName').addEventListener('input', (e) => {
        buildingData.name = e.target.value;
        triggerAutoSave();
    });

    // Canvas click for adding shapes and line drawing
    canvas.on('mouse:down', (e) => {
        if (currentTool === 'line') {
            handleLineDrawing(e);
        } else if (!e.target && currentTool !== 'select') {
            addShapeAtPosition(e.pointer.x, e.pointer.y);
        }
    });
}

// Initialize icon grid
function initializeIconGrid() {
    const iconGrid = document.getElementById('iconGrid');

    Object.keys(IconMetadata).forEach(iconName => {
        const meta = IconMetadata[iconName];
        const btn = document.createElement('button');
        btn.className = 'icon-btn';
        btn.dataset.icon = iconName;
        btn.title = meta.label;

        const iconSvg = createIconElement(iconName, 24);
        btn.appendChild(iconSvg);

        const label = document.createElement('span');
        label.textContent = meta.label.split(' ')[0]; // First word only
        btn.appendChild(label);

        btn.addEventListener('click', () => {
            addIcon(iconName);
        });

        iconGrid.appendChild(btn);
    });
}

// Initialize color pickers
function initializeColorPickers() {
    // Color presets
    document.querySelectorAll('.color-preset').forEach(preset => {
        preset.addEventListener('click', () => {
            currentColor = preset.dataset.color;
            updateColorPresetSelection();
            if (selectedObject) {
                selectedObject.set('fill', currentColor);
                canvas.renderAll();
                saveCurrentFloorToData();
            }
        });
    });

    // Custom color picker
    document.getElementById('customColorPicker').addEventListener('input', (e) => {
        currentColor = e.target.value;
        if (selectedObject) {
            selectedObject.set('fill', currentColor);
            canvas.renderAll();
            saveCurrentFloorToData();
        }
    });
}

// Select a tool
function selectTool(tool) {
    currentTool = tool;

    // Update UI
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });

    // Update cursor and selection mode
    if (tool === 'select') {
        canvas.defaultCursor = 'default';
        canvas.selection = true;
        canvas.forEachObject(obj => {
            obj.selectable = true;
        });
    } else {
        canvas.defaultCursor = 'crosshair';
        canvas.selection = false;
        // Deselect any active objects when switching to non-select tool
        canvas.discardActiveObject();
        canvas.renderAll();
    }
}

// Add shape at position
function addShapeAtPosition(x, y) {
    let shape;

    switch (currentTool) {
        case 'rect':
            shape = new fabric.Rect({
                left: x - 50,
                top: y - 30,
                width: 100,
                height: 60,
                fill: currentColor,
                stroke: darkenColor(currentColor, 20),
                strokeWidth: 2,
                rx: 4,
                ry: 4
            });
            break;

        case 'circle':
            shape = new fabric.Circle({
                left: x - 40,
                top: y - 40,
                radius: 40,
                fill: currentColor,
                stroke: darkenColor(currentColor, 20),
                strokeWidth: 2
            });
            break;

        case 'text':
            shape = new fabric.IText('Label', {
                left: x - 25,
                top: y - 10,
                fontSize: 16,
                fontFamily: 'Inter, sans-serif',
                fill: '#1F2937'
            });
            break;
    }

    if (shape) {
        // Save state BEFORE adding shape for undo
        saveState();
        
        // Add custom properties
        shape.set({
            objectLabel: '',
            objectTags: '',
            objectLocked: false
        });

        canvas.add(shape);
        canvas.setActiveObject(shape);
        canvas.renderAll();
        saveCurrentFloorToData();
        triggerAutoSave();
        
        // Auto-switch back to select mode after creating shape
        selectTool('select');
    }
}

// Add icon to canvas
function addIcon(iconName) {
    console.log('addIcon called with:', iconName);
    
    if (!Icons[iconName]) {
        showToast(`Icon "${iconName}" not found`, 'error');
        console.error('Icon not found:', iconName);
        return;
    }

    if (!IconMetadata[iconName]) {
        showToast(`Icon metadata for "${iconName}" not found`, 'error');
        console.error('Icon metadata not found:', iconName);
        return;
    }

    const meta = IconMetadata[iconName];
    console.log('Icon metadata:', meta);
    
    // Save state BEFORE adding icon for undo
    saveState();

    // Replace "currentColor" with actual color for Fabric.js compatibility
    const svgString = Icons[iconName].replace(/currentColor/g, meta.color);
    console.log('SVG string after color replacement:', svgString.substring(0, 100));
    
    // Create icon as SVG path
    fabric.loadSVGFromString(svgString, (objects, options) => {
        console.log('fabric.loadSVGFromString callback fired');
        console.log('Loaded objects:', objects);
        console.log('Options:', options);
        
        if (!objects || objects.length === 0) {
            showToast('Failed to load icon SVG', 'error');
            console.error('No SVG objects loaded for icon:', iconName);
            console.error('SVG String was:', svgString);
            return;
        }

        const icon = fabric.util.groupSVGElements(objects, options);
        console.log('Created icon group:', icon);
        
        // Ensure color is applied to all paths in the icon
        // Single path SVGs return a Path object, multiple paths return a Group
        if (icon.forEachObject) {
            // It's a group with multiple paths
            icon.forEachObject((obj) => {
                if (obj.type === 'path' || obj.type === 'circle') {
                    obj.set({ fill: meta.color });
                }
            });
        } else {
            // It's a single path object
            icon.set({ fill: meta.color });
        }

        icon.set({
            left: 400,
            top: 300,
            scaleX: 2,
            scaleY: 2,
            objectLabel: meta.label,
            objectTags: meta.category,
            objectIcon: iconName,
            objectLocked: false
        });

        console.log('Adding icon to canvas at position:', icon.left, icon.top);
        canvas.add(icon);
        canvas.setActiveObject(icon);
        canvas.renderAll();
        console.log('Canvas rendered, total objects:', canvas.getObjects().length);
        
        saveCurrentFloorToData();
        triggerAutoSave();
        
        showToast(`Added ${meta.label}`, 'success');
        
        // Auto-switch back to select mode after adding icon
        selectTool('select');
    });
}

// Switch floor
function switchFloor(floor) {
    // Save current floor only if it exists in buildingData
    if (buildingData.floors[currentFloor]) {
        saveCurrentFloorToData();
    }

    // Update current floor
    currentFloor = floor;

    // Update UI
    document.querySelectorAll('.floor-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.floor === floor);
    });

    // Load floor data
    loadFloorToCanvas(floor);
}

// Save current floor to data structure
function saveCurrentFloorToData() {
    const objects = canvas.getObjects().map(obj => {
        const data = {
            type: obj.type,
            left: obj.left,
            top: obj.top,
            width: obj.width || obj.radius * 2,
            height: obj.height || obj.radius * 2,
            scaleX: obj.scaleX,
            scaleY: obj.scaleY,
            angle: obj.angle,
            fill: obj.fill,
            stroke: obj.stroke,
            strokeWidth: obj.strokeWidth,
            objectLabel: obj.objectLabel || '',
            objectTags: obj.objectTags || '',
            objectIcon: obj.objectIcon || null,
            objectLocked: obj.objectLocked || false
        };

        if (obj.type === 'i-text') {
            data.text = obj.text;
            data.fontSize = obj.fontSize;
            data.fontFamily = obj.fontFamily;
        }

        return data;
    });

    buildingData.floors[currentFloor].objects = objects;
    buildingData.updatedAt = new Date().toISOString();
}

// Load floor data to canvas
function loadFloorToCanvas(floor) {
    canvas.clear();
    canvas.backgroundColor = '#FFFFFF';

    const floorData = buildingData.floors[floor];
    if (!floorData || !floorData.objects) return;

    floorData.objects.forEach(objData => {
        let obj;

        switch (objData.type) {
            case 'rect':
                obj = new fabric.Rect(objData);
                break;
            case 'circle':
                obj = new fabric.Circle({
                    ...objData,
                    radius: objData.width / 2
                });
                break;
            case 'i-text':
                obj = new fabric.IText(objData.text, objData);
                break;
            default:
                if (objData.objectIcon) {
                    // Recreate icon from SVG with proper color
                    const iconMeta = IconMetadata[objData.objectIcon];
                    const iconColor = objData.fill || (iconMeta ? iconMeta.color : '#000000');
                    
                    // Replace "currentColor" with actual color for Fabric.js compatibility
                    const svgString = Icons[objData.objectIcon].replace(/currentColor/g, iconColor);
                    
                    fabric.loadSVGFromString(svgString, (objects, options) => {
                        obj = fabric.util.groupSVGElements(objects, options);
                        
                        // Apply color to all paths (handle both single path and group)
                        if (obj.forEachObject) {
                            // It's a group with multiple paths
                            obj.forEachObject((o) => {
                                if (o.type === 'path' || o.type === 'circle') {
                                    o.set({ fill: iconColor });
                                }
                            });
                        } else {
                            // It's a single path object
                            obj.set({ fill: iconColor });
                        }
                        
                        obj.set({
                            ...objData,
                            fill: iconColor
                        });
                        canvas.add(obj);
                    });
                    return;
                }
        }

        if (obj) {
            obj.set({
                objectLabel: objData.objectLabel,
                objectTags: objData.objectTags,
                objectLocked: objData.objectLocked,
                selectable: !objData.objectLocked
            });
            canvas.add(obj);
        }
    });

    canvas.renderAll();
}

// Handle object selection
function handleObjectSelection(e) {
    selectedObject = e.selected[0];
    showPropertiesPanel(selectedObject);
}

// Show properties panel for selected object
function showPropertiesPanel(obj) {
    const panel = document.getElementById('propertiesPanel');

    const currentStrokeWidth = obj.strokeWidth || 2;
    const currentOpacity = obj.opacity !== undefined ? obj.opacity : 1;
    const currentStrokeDashArray = obj.strokeDashArray ? 'dashed' : 'solid';

    panel.innerHTML = `
    <div class="property-group">
      <label class="property-label">Name</label>
      <input type="text" class="property-input" id="propLabel" value="${obj.objectLabel || ''}" placeholder="e.g., Food Court">
    </div>
    
    <div class="property-group">
      <label class="property-label">Tags (comma-separated)</label>
      <input type="text" class="property-input" id="propTags" value="${obj.objectTags || ''}" placeholder="e.g., food, restaurant, pizza">
    </div>
    
    <div class="property-group">
      <label class="property-label">Fill Color</label>
      <input type="color" class="property-input" id="propColor" value="${obj.fill || '#3B82F6'}">
    </div>
    
    <div class="property-group">
      <label class="property-label">Border Width: <span id="strokeWidthValue">${currentStrokeWidth}px</span></label>
      <input type="range" class="property-input" id="propStrokeWidth" min="0" max="20" step="1" value="${currentStrokeWidth}">
    </div>
    
    <div class="property-group">
      <label class="property-label">Border Style</label>
      <select class="property-input" id="propStrokeStyle">
        <option value="solid" ${currentStrokeDashArray === 'solid' ? 'selected' : ''}>Solid</option>
        <option value="dashed" ${currentStrokeDashArray === 'dashed' ? 'selected' : ''}>Dashed</option>
        <option value="dotted" ${currentStrokeDashArray === 'dotted' ? 'selected' : ''}>Dotted</option>
      </select>
    </div>
    
    <div class="property-group">
      <label class="property-label">Opacity: <span id="opacityValue">${Math.round(currentOpacity * 100)}%</span></label>
      <input type="range" class="property-input" id="propOpacity" min="0" max="100" step="5" value="${currentOpacity * 100}">
    </div>
    
    <div class="property-group">
      <label class="property-label">Lock Object</label>
      <div class="property-row">
        <input type="checkbox" id="propLocked" ${obj.objectLocked ? 'checked' : ''}>
        <span class="text-sm text-gray">Prevent accidental edits</span>
      </div>
    </div>
    
    <div class="property-group">
      <label class="property-label">Layer</label>
      <div class="layer-controls">
        <button class="btn btn-secondary btn-sm" onclick="bringToFront()">⬆ Front</button>
        <button class="btn btn-secondary btn-sm" onclick="sendToBack()">⬇ Back</button>
      </div>
    </div>
    
    <div class="delete-section">
      <button class="btn btn-danger" style="width: 100%;" onclick="deleteSelected()">🗑️ Delete Object</button>
    </div>
  `;

    // Add event listeners
    document.getElementById('propLabel').addEventListener('input', (e) => {
        obj.objectLabel = e.target.value;
        saveCurrentFloorToData();
        triggerAutoSave();
    });

    document.getElementById('propTags').addEventListener('input', (e) => {
        obj.objectTags = e.target.value;
        saveCurrentFloorToData();
        triggerAutoSave();
    });

    document.getElementById('propColor').addEventListener('input', (e) => {
        obj.set('fill', e.target.value);
        canvas.renderAll();
        saveCurrentFloorToData();
        triggerAutoSave();
    });

    document.getElementById('propStrokeWidth').addEventListener('input', (e) => {
        const width = parseInt(e.target.value);
        document.getElementById('strokeWidthValue').textContent = width + 'px';
        obj.set('strokeWidth', width);
        canvas.renderAll();
        saveCurrentFloorToData();
        triggerAutoSave();
    });

    document.getElementById('propStrokeStyle').addEventListener('change', (e) => {
        const style = e.target.value;
        if (style === 'solid') {
            obj.set('strokeDashArray', null);
        } else if (style === 'dashed') {
            obj.set('strokeDashArray', [10, 5]);
        } else if (style === 'dotted') {
            obj.set('strokeDashArray', [2, 3]);
        }
        canvas.renderAll();
        saveCurrentFloorToData();
        triggerAutoSave();
    });

    document.getElementById('propOpacity').addEventListener('input', (e) => {
        const opacity = parseInt(e.target.value) / 100;
        document.getElementById('opacityValue').textContent = Math.round(opacity * 100) + '%';
        obj.set('opacity', opacity);
        canvas.renderAll();
        saveCurrentFloorToData();
        triggerAutoSave();
    });

    document.getElementById('propLocked').addEventListener('change', (e) => {
        obj.objectLocked = e.target.checked;
        obj.selectable = !e.target.checked;
        canvas.renderAll();
        saveCurrentFloorToData();
        triggerAutoSave();
    });
}

// Clear properties panel
function clearPropertiesPanel() {
    selectedObject = null;
    const panel = document.getElementById('propertiesPanel');
    panel.innerHTML = `
    <div class="properties-empty">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <p>Select an object to edit its properties</p>
    </div>
  `;
}

// Layer controls
function bringToFront() {
    if (selectedObject) {
        canvas.bringToFront(selectedObject);
        canvas.renderAll();
        saveCurrentFloorToData();
    }
}

function sendToBack() {
    if (selectedObject) {
        canvas.sendToBack(selectedObject);
        canvas.renderAll();
        saveCurrentFloorToData();
    }
}

function deleteSelected() {
    if (selectedObject) {
        canvas.remove(selectedObject);
        canvas.renderAll();
        clearPropertiesPanel();
        saveCurrentFloorToData();
        triggerAutoSave();
    }
}

// Zoom controls
function zoomIn() {
    const zoom = canvas.getZoom();
    canvas.setZoom(zoom * 1.1);
}

function zoomOut() {
    const zoom = canvas.getZoom();
    canvas.setZoom(zoom / 1.1);
}

function resetZoom() {
    canvas.setZoom(1);
    canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    canvas.renderAll();
}

// Clear canvas
function clearCanvas() {
    if (confirm('Are you sure you want to clear this floor? This cannot be undone.')) {
        canvas.clear();
        canvas.backgroundColor = '#FFFFFF';
        saveCurrentFloorToData();
        triggerAutoSave();
    }
}

// Auto-save to localStorage
function startAutoSave() {
    setInterval(() => {
        saveDraftToLocalStorage();
    }, 10000); // Every 10 seconds
}

function triggerAutoSave() {
    clearTimeout(autoSaveTimer);
    updateAutoSaveIndicator('saving');

    autoSaveTimer = setTimeout(() => {
        saveDraftToLocalStorage();
        updateAutoSaveIndicator('saved');
    }, 1000);
}

function saveDraftToLocalStorage() {
    saveCurrentFloorToData();
    buildingData.name = document.getElementById('buildingName').value;
    localStorage.setItem('intramap_draft', JSON.stringify(buildingData));
}

// Manual save draft (called by Save Draft button)
function saveDraft() {
    saveDraftToLocalStorage();
    showToast('Draft saved to browser', 'success');
}

function loadDraftFromLocalStorage() {
    const draft = localStorage.getItem('intramap_draft');
    if (draft) {
        try {
            buildingData = JSON.parse(draft);
            document.getElementById('buildingName').value = buildingData.name || '';
            updateFloorCounter();
            
            // Update currentFloor first, then render tabs and load
            const firstFloorKey = Object.keys(buildingData.floors)[0];
            if (firstFloorKey) {
                currentFloor = firstFloorKey;
                renderFloorTabs();
                loadFloorToCanvas(firstFloorKey);
                
                // Update active tab
                document.querySelectorAll('.floor-tab').forEach(tab => {
                    tab.classList.toggle('active', tab.dataset.floor === firstFloorKey);
                });
            }
            
            updateAutoSaveIndicator('saved');
        } catch (e) {
            console.error('Failed to load draft:', e);
        }
    }
}

// Update floor counter based on existing floors
function updateFloorCounter() {
    const floorIds = Object.keys(buildingData.floors);
    const maxFloorNum = floorIds.reduce((max, floorId) => {
        const match = floorId.match(/floor_(\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            return num > max ? num : max;
        }
        return max;
    }, 0);
    floorCounter = maxFloorNum + 1;
}

function updateAutoSaveIndicator(status) {
    const indicator = document.getElementById('autoSaveIndicator');
    const text = document.getElementById('autoSaveText');
    const label = document.getElementById('autoSaveLabel');

    indicator.className = 'auto-save-indicator';

    if (status === 'saving') {
        indicator.classList.add('saving');
        text.textContent = '●';
        label.textContent = 'Saving...';
    } else if (status === 'saved') {
        indicator.classList.add('saved');
        text.textContent = '✓';
        label.textContent = 'Draft saved';
    }
}

// Save to cloud
async function saveToCloud() {
    const buildingName = document.getElementById('buildingName').value.trim();

    if (!buildingName) {
        alert('Please enter a building name before saving');
        return;
    }

    saveCurrentFloorToData();
    buildingData.name = buildingName;
    buildingData.buildingId = api._sanitizeBuildingId(buildingName);

    try {
        showToast('Saving to cloud...', 'info');
        const response = await api.saveBuilding(buildingData.buildingId, buildingData);
        showToast('Building saved successfully!', 'success');
        console.log('Saved:', response);
    } catch (error) {
        showToast('Failed to save: ' + error.message, 'error');
        console.error('Save error:', error);
    }
}

// Load from cloud
async function loadFromCloud() {
    const buildingId = prompt('Enter building ID to load:');
    if (!buildingId) return;

    try {
        showToast('Loading from cloud...', 'info');
        const data = await api.loadBuilding(buildingId);
        buildingData = data;
        document.getElementById('buildingName').value = data.name;
        
        // Update floor counter based on loaded data
        updateFloorCounter();
        
        // Update currentFloor first, then render tabs and load
        const firstFloorKey = Object.keys(buildingData.floors)[0];
        if (firstFloorKey) {
            currentFloor = firstFloorKey;
            renderFloorTabs();
            loadFloorToCanvas(firstFloorKey);
            
            // Update active tab
            document.querySelectorAll('.floor-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.floor === firstFloorKey);
            });
        }
        
        showToast('Building loaded successfully!', 'success');
    } catch (error) {
        showToast('Failed to load: ' + error.message, 'error');
        console.error('Load error:', error);
    }
}

// Load demo data
async function loadDemoData() {
    if (!confirm('Load demo building data? This will replace your current work.')) {
        return;
    }

    try {
        showToast('Loading demo data...', 'info');
        const response = await fetch('data/demo-building.json');
        if (!response.ok) {
            throw new Error('Failed to load demo data');
        }
        const data = await response.json();
        buildingData = data;
        
        // Set the building name
        document.getElementById('buildingName').value = data.name;
        
        // Update floor counter based on loaded data
        updateFloorCounter();
        
        // Update currentFloor first, then render tabs and load
        const firstFloorKey = Object.keys(buildingData.floors)[0];
        if (firstFloorKey) {
            currentFloor = firstFloorKey;
            renderFloorTabs();
            loadFloorToCanvas(firstFloorKey);
            
            // Update active tab
            document.querySelectorAll('.floor-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.floor === firstFloorKey);
            });
        }
        
        showToast('Demo data loaded! Explore Centaurus Shopping Mall', 'success');
    } catch (error) {
        showToast('Failed to load demo data: ' + error.message, 'error');
        console.error('Load demo error:', error);
    }
}

// Generate QR code
// Generate and show QR code modal
function showQRModal() {
    const buildingName = document.getElementById('buildingName').value.trim();

    if (!buildingName) {
        alert('Please enter a building name first');
        return;
    }

    const buildingId = api._sanitizeBuildingId(buildingName);
    const viewerURL = api.getViewerURL(buildingId);

    // Show modal
    const modal = document.getElementById('qrModal');
    const container = document.getElementById('qrCodeContainer');
    const urlDisplay = document.getElementById('qrURL');

    container.innerHTML = '';

    new QRCode(container, {
        text: viewerURL,
        width: 256,
        height: 256,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });

    urlDisplay.textContent = viewerURL;
    modal.classList.remove('hidden');
}

function closeQRModal(event) {
    if (!event || event.target.classList.contains('modal-overlay')) {
        document.getElementById('qrModal').classList.add('hidden');
    }
}

function downloadQRCode() {
    const canvas = document.querySelector('#qrCodeContainer canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'intramap-qr-code.png';
    link.href = canvas.toDataURL();
    link.click();
}

// Helper functions
function darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}

function updateColorPresetSelection() {
    document.querySelectorAll('.color-preset').forEach(preset => {
        preset.classList.toggle('active', preset.dataset.color === currentColor);
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ========== NEW FUNCTIONS FOR DYNAMIC FLOORS ==========

// Render floor tabs dynamically
function renderFloorTabs() {
    const container = document.getElementById('floorTabsContainer');
    container.innerHTML = '';

    Object.keys(buildingData.floors).forEach(floorId => {
        const floor = buildingData.floors[floorId];
        const tab = document.createElement('button');
        tab.className = 'floor-tab' + (floorId === currentFloor ? ' active' : '');
        tab.dataset.floor = floorId;
        tab.textContent = floor.name;

        // Click to switch floor
        tab.addEventListener('click', () => switchFloor(floorId));

        // Right-click for options
        tab.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showFloorContextMenu(floorId, e.clientX, e.clientY);
        });

        container.appendChild(tab);
    });
}

// Add new floor
function addNewFloor() {
    const floorName = prompt('Enter floor name:', `Floor ${floorCounter}`);
    if (!floorName) return;

    // Save state BEFORE adding new floor for undo
    saveState();

    const floorId = `floor_${floorCounter++}`;
    buildingData.floors[floorId] = {
        name: floorName,
        objects: []
    };

    renderFloorTabs();
    switchFloor(floorId);
    triggerAutoSave();
}

// Show floor context menu
function showFloorContextMenu(floorId, x, y) {
    // Remove existing menu if any
    const existingMenu = document.querySelector('.floor-context-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'floor-context-menu';
    menu.style.position = 'fixed';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.background = 'white';
    menu.style.border = '1px solid #ccc';
    menu.style.borderRadius = '4px';
    menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    menu.style.zIndex = '10000';
    menu.style.minWidth = '120px';

    const renameBtn = document.createElement('button');
    renameBtn.textContent = '✏️ Rename';
    renameBtn.style.cssText = 'display:block;width:100%;padding:8px 12px;border:none;background:none;text-align:left;cursor:pointer;';
    renameBtn.onmouseover = () => renameBtn.style.background = '#f3f4f6';
    renameBtn.onmouseout = () => renameBtn.style.background = 'none';
    renameBtn.onclick = () => {
        renameFloor(floorId);
        menu.remove();
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️ Delete';
    deleteBtn.style.cssText = 'display:block;width:100%;padding:8px 12px;border:none;background:none;text-align:left;cursor:pointer;color:#ef4444;';
    deleteBtn.onmouseover = () => deleteBtn.style.background = '#fef2f2';
    deleteBtn.onmouseout = () => deleteBtn.style.background = 'none';
    deleteBtn.onclick = () => {
        removeFloor(floorId);
        menu.remove();
    };

    menu.appendChild(renameBtn);

    // Only show delete if there's more than one floor
    if (Object.keys(buildingData.floors).length > 1) {
        menu.appendChild(deleteBtn);
    }

    document.body.appendChild(menu);

    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 0);
}

// Rename floor
function renameFloor(floorId) {
    const currentName = buildingData.floors[floorId].name;
    const newName = prompt('Enter new floor name:', currentName);

    if (newName && newName !== currentName) {
        buildingData.floors[floorId].name = newName;
        renderFloorTabs();
        saveState();
        triggerAutoSave();
    }
}

// Remove floor
function removeFloor(floorId) {
    if (Object.keys(buildingData.floors).length === 1) {
        alert('Cannot delete the last floor');
        return;
    }

    if (!confirm(`Delete "${buildingData.floors[floorId].name}"? This cannot be undone.`)) {
        return;
    }

    delete buildingData.floors[floorId];

    // Switch to another floor if current floor was deleted
    if (currentFloor === floorId) {
        currentFloor = Object.keys(buildingData.floors)[0];
        loadFloorToCanvas(currentFloor);
    }

    renderFloorTabs();
    saveState();
    triggerAutoSave();
}

// ========== KEYBOARD SHORTCUTS ==========

// Keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignore if typing in input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Ctrl+C - Copy
        if (e.ctrlKey && e.key === 'c' && !e.shiftKey) {
            e.preventDefault();
            copyObject();
        }
        // Ctrl+V - Paste
        else if (e.ctrlKey && e.key === 'v') {
            e.preventDefault();
            pasteObject();
        }
        // Ctrl+Z - Undo
        else if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
        // Ctrl+Y or Ctrl+Shift+Z - Redo
        else if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            redo();
        }
        // Ctrl+S - Save Draft
        else if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveDraft();
        }
        // Ctrl+0 - Fit to Screen
        else if (e.ctrlKey && e.key === '0') {
            e.preventDefault();
            fitToScreen();
        }
        // Delete - Remove selected object
        else if (e.key === 'Delete') {
            e.preventDefault();
            const activeObj = canvas.getActiveObject();
            if (activeObj) {
                // Save state BEFORE deletion for undo
                saveState();
                canvas.remove(activeObj);
                canvas.renderAll();
                clearPropertiesPanel();
                saveCurrentFloorToData();
                triggerAutoSave();
                showToast('Object deleted', 'success');
            }
        }
        // Escape - Deselect and close help
        else if (e.key === 'Escape') {
            e.preventDefault();
            const helpOverlay = document.getElementById('keyboardHelpOverlay');
            if (helpOverlay && helpOverlay.style.display === 'flex') {
                dismissKeyboardHelp();
            } else {
                canvas.discardActiveObject();
                canvas.renderAll();
                clearPropertiesPanel();
            }
        }
        // Arrow keys - Pan canvas
        else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            const vpt = canvas.viewportTransform;
            const panDistance = 30;
            
            if (e.key === 'ArrowUp') vpt[5] += panDistance;
            if (e.key === 'ArrowDown') vpt[5] -= panDistance;
            if (e.key === 'ArrowLeft') vpt[4] += panDistance;
            if (e.key === 'ArrowRight') vpt[4] -= panDistance;
            
            canvas.requestRenderAll();
        }
        // Plus/Minus - Zoom
        else if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            zoomIn();
        }
        else if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            zoomOut();
        }
    });
}

// Copy selected object
function copyObject() {
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
        activeObj.clone((cloned) => {
            copiedObject = cloned;
            showToast('Object copied', 'info');
        }, ['objectLabel', 'objectTags', 'objectIcon', 'objectLocked']);
    } else {
        showToast('No object selected', 'warning');
    }
}

// Paste copied object
function pasteObject() {
    if (!copiedObject) {
        showToast('Nothing to paste', 'warning');
        return;
    }

    copiedObject.clone((cloned) => {
        // Offset to avoid overlap
        cloned.set({
            left: cloned.left + 20,
            top: cloned.top + 20
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
        saveState();
        saveCurrentFloorToData();
        triggerAutoSave();
        showToast('Object pasted', 'success');
    }, ['objectLabel', 'objectTags', 'objectIcon', 'objectLocked']);
}

// Fit canvas to screen
function fitToScreen() {
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.setZoom(1);
    canvas.renderAll();
    showToast('Reset to fit screen', 'info');
}

// Save state for undo/redo
function saveState() {
    saveCurrentFloorToData();
    const state = JSON.parse(JSON.stringify(buildingData));
    undoStack.push(state);

    // Limit undo stack to 50 states
    if (undoStack.length > 50) {
        undoStack.shift();
    }

    // Clear redo stack when new action is performed
    redoStack = [];
}

// Undo
function undo() {
    if (undoStack.length === 0) {
        showToast('Nothing to undo', 'info');
        return;
    }

    // Save current state to redo stack
    const currentState = JSON.parse(JSON.stringify(buildingData));
    redoStack.push(currentState);

    // Restore previous state
    buildingData = undoStack.pop();
    document.getElementById('buildingName').value = buildingData.name || '';
    renderFloorTabs();
    loadFloorToCanvas(currentFloor);
    showToast('Undo', 'success');
}

// Redo
function redo() {
    if (redoStack.length === 0) {
        showToast('Nothing to redo', 'info');
        return;
    }

    // Save current state to undo stack
    const currentState = JSON.parse(JSON.stringify(buildingData));
    undoStack.push(currentState);

    // Restore redo state
    buildingData = redoStack.pop();
    document.getElementById('buildingName').value = buildingData.name || '';
    renderFloorTabs();
    loadFloorToCanvas(currentFloor);
    showToast('Redo', 'success');
}

// Show keyboard help popup
function showKeyboardHelp() {
    const overlay = document.getElementById('keyboardHelpOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
        
        // Close when clicking outside the popup
        setTimeout(() => {
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    dismissKeyboardHelp();
                }
            };
        }, 100);
    }
}

// Dismiss keyboard help popup
function dismissKeyboardHelp() {
    const overlay = document.getElementById('keyboardHelpOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.onclick = null;
    }
}

// ========== LINE DRAWING TOOL ==========

// Handle line drawing
function handleLineDrawing(e) {
    if (!isDrawingLine) {
        // Start drawing line
        isDrawingLine = true;
        lineStartPoint = { x: e.pointer.x, y: e.pointer.y };

        // Visual feedback
        showToast('Click to set end point', 'info');
    } else {
        // Finish drawing line
        const line = new fabric.Line([
            lineStartPoint.x,
            lineStartPoint.y,
            e.pointer.x,
            e.pointer.y
        ], {
            stroke: currentColor,
            strokeWidth: 3,
            selectable: true,
            objectLabel: '',
            objectTags: '',
            objectLocked: false
        });

        canvas.add(line);
        canvas.setActiveObject(line);
        canvas.renderAll();

        // Reset line drawing state
        isDrawingLine = false;
        lineStartPoint = null;

        saveState();
        saveCurrentFloorToData();
        triggerAutoSave();
    }
}

