// IntraMap - Admin Editor Logic
// Handles floor plan creation and editing with Fabric.js

let canvas;
let currentFloor = 'ground';
let currentTool = 'select';
let currentColor = '#3B82F6';
let buildingData = {
    version: '1.0',
    buildingId: '',
    name: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    floors: {
        ground: { name: 'Ground Floor', objects: [] },
        first: { name: 'First Floor', objects: [] },
        second: { name: 'Second Floor', objects: [] }
    }
};

let autoSaveTimer;
let selectedObject = null;

// Initialize editor on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeCanvas();
    initializeToolbar();
    initializeIconGrid();
    initializeColorPickers();
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

    // Handle object selection
    canvas.on('selection:created', handleObjectSelection);
    canvas.on('selection:updated', handleObjectSelection);
    canvas.on('selection:cleared', clearPropertiesPanel);

    // Handle object modifications
    canvas.on('object:modified', () => {
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
    // Floor tabs
    document.querySelectorAll('.floor-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchFloor(tab.dataset.floor);
        });
    });

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

    // Canvas click for adding shapes
    canvas.on('mouse:down', (e) => {
        if (!e.target && currentTool !== 'select') {
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

    // Update cursor
    if (tool === 'select') {
        canvas.defaultCursor = 'default';
        canvas.selection = true;
    } else {
        canvas.defaultCursor = 'crosshair';
        canvas.selection = false;
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
    }
}

// Add icon to canvas
function addIcon(iconName) {
    const meta = IconMetadata[iconName];

    // Create icon as SVG path
    fabric.loadSVGFromString(Icons[iconName], (objects, options) => {
        const icon = fabric.util.groupSVGElements(objects, options);

        icon.set({
            left: 400,
            top: 300,
            scaleX: 2,
            scaleY: 2,
            fill: meta.color,
            objectLabel: meta.label,
            objectTags: meta.category,
            objectIcon: iconName,
            objectLocked: false
        });

        canvas.add(icon);
        canvas.setActiveObject(icon);
        canvas.renderAll();
        saveCurrentFloorToData();
        triggerAutoSave();
    });
}

// Switch floor
function switchFloor(floor) {
    // Save current floor
    saveCurrentFloorToData();

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
                    // Recreate icon from SVG
                    fabric.loadSVGFromString(Icons[objData.objectIcon], (objects, options) => {
                        obj = fabric.util.groupSVGElements(objects, options);
                        obj.set(objData);
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
      <label class="property-label">Color</label>
      <input type="color" class="property-input" id="propColor" value="${obj.fill || '#3B82F6'}">
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

function loadDraftFromLocalStorage() {
    const draft = localStorage.getItem('intramap_draft');
    if (draft) {
        try {
            buildingData = JSON.parse(draft);
            document.getElementById('buildingName').value = buildingData.name || '';
            loadFloorToCanvas(currentFloor);
            updateAutoSaveIndicator('saved');
        } catch (e) {
            console.error('Failed to load draft:', e);
        }
    }
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
        loadFloorToCanvas(currentFloor);
        showToast('Building loaded successfully!', 'success');
    } catch (error) {
        showToast('Failed to load: ' + error.message, 'error');
        console.error('Load error:', error);
    }
}

// Generate QR code
function generateQRCode() {
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
