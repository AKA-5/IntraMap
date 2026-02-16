// IntraMap - Viewer Logic
// Handles floor plan viewing and navigation

let canvas;
let buildingData = null;
let currentFloor = 'ground';
let allObjects = [];
let youAreHereMarker = null;
let youAreHereMode = false;
let selectedObject = null;
let highlightedObjects = [];

// Initialize viewer on page load
document.addEventListener('DOMContentLoaded', async () => {
    initializeCanvas();
    initializeControls();
    await loadBuildingData();
});

// Initialize Fabric.js canvas (read-only mode)
function initializeCanvas() {
    canvas = new fabric.Canvas('viewerCanvas', {
        backgroundColor: '#FFFFFF',
        selection: false,
        interactive: true
    });

    // Handle object clicks
    canvas.on('mouse:down', (e) => {
        if (youAreHereMode) {
            placeYouAreHere(e.pointer.x, e.pointer.y);
        } else if (e.target && e.target.objectLabel) {
            showObjectPopup(e.target);
        }
    });

    // Responsive canvas sizing
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

// Resize canvas to fit container
function resizeCanvas() {
    const container = document.querySelector('.viewer-canvas-wrapper');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const scale = Math.min(
        containerWidth / 800,
        containerHeight / 600
    ) * 0.9; // 90% of available space

    canvas.setWidth(800 * scale);
    canvas.setHeight(600 * scale);
    canvas.setZoom(scale);
    canvas.renderAll();
}

// Initialize controls
function initializeControls() {
    // Floor selector
    document.getElementById('floorSelector').addEventListener('change', (e) => {
        switchFloor(e.target.value);
    });

    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('focus', handleSearch);

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-bar')) {
            document.getElementById('searchResults').classList.remove('visible');
        }
    });
}

// Load building data from API
async function loadBuildingData() {
    const buildingId = api.getBuildingIdFromURL();

    if (!buildingId) {
        showError('No building ID provided in URL');
        return;
    }

    try {
        // Show loading
        document.getElementById('loadingOverlay').classList.remove('hidden');

        // Load from API
        buildingData = await api.loadBuilding(buildingId);

        // Update UI
        document.getElementById('buildingName').textContent = buildingData.name;
        document.title = `${buildingData.name} - IntraMap`;

        // Populate floor selector dynamically
        populateFloorSelector();

        // Load initial floor
        loadFloorToCanvas(currentFloor);

        // Hide loading
        document.getElementById('loadingOverlay').classList.add('hidden');

        // Cache for offline use
        cacheBuilding(buildingData);

    } catch (error) {
        console.error('Failed to load building:', error);

        // Try to load from cache
        const cached = getCachedBuilding(buildingId);
        if (cached) {
            buildingData = cached;
            document.getElementById('buildingName').textContent = buildingData.name;
            loadFloorToCanvas(currentFloor);
            document.getElementById('loadingOverlay').classList.add('hidden');
            showToast('Loaded from offline cache', 'info');
        } else {
            showError('Failed to load building: ' + error.message);
        }
    }
}

// Populate floor selector dynamically
function populateFloorSelector() {
    const selector = document.getElementById('floorSelector');
    selector.innerHTML = '';

    // Get first floor as default if currentFloor doesn't exist
    const floorKeys = Object.keys(buildingData.floors);
    if (!buildingData.floors[currentFloor]) {
        currentFloor = floorKeys[0];
    }

    floorKeys.forEach(floorId => {
        const floor = buildingData.floors[floorId];
        const option = document.createElement('option');
        option.value = floorId;
        option.textContent = floor.name;
        if (floorId === currentFloor) {
            option.selected = true;
        }
        selector.appendChild(option);
    });
}

// Load floor data to canvas
function loadFloorToCanvas(floor) {
    canvas.clear();
    canvas.backgroundColor = '#FFFFFF';
    allObjects = [];

    if (!buildingData || !buildingData.floors[floor]) {
        return;
    }

    const floorData = buildingData.floors[floor];
    document.getElementById('buildingFloor').textContent = floorData.name;

    if (!floorData.objects) return;

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
                obj = new fabric.IText(objData.text, {
                    ...objData,
                    selectable: false,
                    editable: false
                });
                break;
            default:
                if (objData.objectIcon) {
                    // Recreate icon from SVG
                    fabric.loadSVGFromString(Icons[objData.objectIcon], (objects, options) => {
                        obj = fabric.util.groupSVGElements(objects, options);
                        obj.set({
                            ...objData,
                            selectable: false,
                            objectLabel: objData.objectLabel,
                            objectTags: objData.objectTags,
                            objectIcon: objData.objectIcon,
                            hoverCursor: 'pointer'
                        });
                        canvas.add(obj);
                        allObjects.push(obj);
                    });
                    return;
                }
        }

        if (obj) {
            obj.set({
                selectable: false,
                objectLabel: objData.objectLabel,
                objectTags: objData.objectTags,
                hoverCursor: objData.objectLabel ? 'pointer' : 'default'
            });
            canvas.add(obj);
            allObjects.push(obj);
        }
    });

    canvas.renderAll();

    // Re-add "You Are Here" marker if it exists
    if (youAreHereMarker) {
        canvas.add(youAreHereMarker);
        canvas.bringToFront(youAreHereMarker);
    }
}

// Switch floor
function switchFloor(floor) {
    currentFloor = floor;
    loadFloorToCanvas(floor);
    closePopup();
    clearHighlights();
}

// Handle search
function handleSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    const resultsContainer = document.getElementById('searchResults');

    if (!query || !buildingData) {
        resultsContainer.classList.remove('visible');
        return;
    }

    // Search across all floors
    const results = [];

    Object.keys(buildingData.floors).forEach(floorKey => {
        const floor = buildingData.floors[floorKey];
        if (!floor.objects) return;

        floor.objects.forEach((obj, index) => {
            const label = (obj.objectLabel || '').toLowerCase();
            const tags = (obj.objectTags || '').toLowerCase();

            if (label.includes(query) || tags.includes(query)) {
                results.push({
                    name: obj.objectLabel || 'Unnamed',
                    tags: obj.objectTags || '',
                    floor: floorKey,
                    floorName: floor.name,
                    object: obj,
                    index: index
                });
            }
        });
    });

    // Display results
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="search-result-item">No results found</div>';
    } else {
        resultsContainer.innerHTML = results.map(result => `
      <div class="search-result-item" onclick="selectSearchResult('${result.floor}', ${result.index})">
        <div class="search-result-name">${result.name}</div>
        <div class="search-result-tags">${result.tags}</div>
        <div class="search-result-floor">${result.floorName}</div>
      </div>
    `).join('');
    }

    resultsContainer.classList.add('visible');
}

// Select search result
function selectSearchResult(floor, objectIndex) {
    // Switch to floor if needed
    if (floor !== currentFloor) {
        currentFloor = floor;
        document.getElementById('floorSelector').value = floor;
        loadFloorToCanvas(floor);
    }

    // Highlight object
    setTimeout(() => {
        const obj = allObjects[objectIndex];
        if (obj) {
            highlightObject(obj);
            showObjectPopup(obj);
        }
    }, 100);

    // Close search results
    document.getElementById('searchResults').classList.remove('visible');
    document.getElementById('searchInput').blur();
}

// Highlight object
function highlightObject(obj) {
    clearHighlights();

    // Create highlight overlay
    const highlight = new fabric.Rect({
        left: obj.left - 10,
        top: obj.top - 10,
        width: (obj.width || obj.radius * 2) + 20,
        height: (obj.height || obj.radius * 2) + 20,
        fill: 'transparent',
        stroke: '#3B82F6',
        strokeWidth: 4,
        selectable: false,
        evented: false,
        opacity: 0.8
    });

    canvas.add(highlight);
    canvas.bringToFront(highlight);
    highlightedObjects.push(highlight);

    // Animate highlight
    let opacity = 0.8;
    let direction = -1;
    const animate = () => {
        opacity += direction * 0.05;
        if (opacity <= 0.3) direction = 1;
        if (opacity >= 0.8) direction = -1;
        highlight.set('opacity', opacity);
        canvas.renderAll();
    };

    const interval = setInterval(animate, 50);
    setTimeout(() => {
        clearInterval(interval);
    }, 3000);

    canvas.renderAll();
}

// Clear highlights
function clearHighlights() {
    highlightedObjects.forEach(obj => canvas.remove(obj));
    highlightedObjects = [];
    canvas.renderAll();
}

// Show object popup
function showObjectPopup(obj) {
    if (!obj.objectLabel) return;

    selectedObject = obj;
    const popup = document.getElementById('objectPopup');

    // Update popup content
    document.getElementById('popupName').textContent = obj.objectLabel;
    document.getElementById('popupFloor').textContent = buildingData.floors[currentFloor].name;

    // Update tags
    const tagsContainer = document.getElementById('popupTags');
    if (obj.objectTags) {
        const tags = obj.objectTags.split(',').map(tag => tag.trim()).filter(tag => tag);
        tagsContainer.innerHTML = tags.map(tag =>
            `<span class="badge">${tag}</span>`
        ).join('');
    } else {
        tagsContainer.innerHTML = '';
    }

    // Position popup
    const canvasRect = canvas.getElement().getBoundingClientRect();
    const objCenter = obj.getCenterPoint();
    const zoom = canvas.getZoom();

    popup.style.left = `${canvasRect.left + objCenter.x * zoom}px`;
    popup.style.top = `${canvasRect.top + objCenter.y * zoom}px`;
    popup.classList.add('visible');
}

// Close popup
function closePopup() {
    document.getElementById('objectPopup').classList.remove('visible');
    selectedObject = null;
}

// Toggle "You Are Here" mode
function toggleYouAreHere() {
    youAreHereMode = !youAreHereMode;
    const btn = document.getElementById('youAreHereBtn');

    if (youAreHereMode) {
        btn.classList.add('active');
        btn.textContent = '📍 Tap on map...';
        showToast('Tap on the map to place your location', 'info');
    } else {
        btn.classList.remove('active');
        btn.textContent = '📍 You Are Here';
    }
}

// Place "You Are Here" marker
function placeYouAreHere(x, y) {
    // Remove existing marker
    if (youAreHereMarker) {
        canvas.remove(youAreHereMarker);
    }

    // Create new marker
    youAreHereMarker = new fabric.Circle({
        left: x - 15,
        top: y - 15,
        radius: 15,
        fill: '#EF4444',
        stroke: '#FFFFFF',
        strokeWidth: 3,
        selectable: false,
        evented: false,
        shadow: new fabric.Shadow({
            color: 'rgba(0,0,0,0.3)',
            blur: 10,
            offsetX: 0,
            offsetY: 2
        })
    });

    canvas.add(youAreHereMarker);
    canvas.bringToFront(youAreHereMarker);
    canvas.renderAll();

    // Exit "You Are Here" mode
    youAreHereMode = false;
    const btn = document.getElementById('youAreHereBtn');
    btn.classList.remove('active');
    btn.textContent = '📍 You Are Here';

    showToast('Location marked!', 'success');
}

// Get directions
function getDirections() {
    if (!selectedObject || !youAreHereMarker) {
        if (!youAreHereMarker) {
            showToast('Please set your location first using "You Are Here"', 'info');
            toggleYouAreHere();
        }
        return;
    }

    // Simple visual highlight from current location to destination
    const start = youAreHereMarker.getCenterPoint();
    const end = selectedObject.getCenterPoint();

    // Create path line
    const line = new fabric.Line([start.x, start.y, end.x, end.y], {
        stroke: '#3B82F6',
        strokeWidth: 4,
        strokeDashArray: [10, 5],
        selectable: false,
        evented: false
    });

    canvas.add(line);
    canvas.sendToBack(line);
    canvas.renderAll();

    // Highlight destination
    highlightObject(selectedObject);

    showToast('Route highlighted on map', 'success');
    closePopup();

    // Remove line after 5 seconds
    setTimeout(() => {
        canvas.remove(line);
        canvas.renderAll();
    }, 5000);
}

// Zoom controls
function zoomIn() {
    const zoom = canvas.getZoom();
    canvas.setZoom(zoom * 1.2);
    canvas.renderAll();
}

function zoomOut() {
    const zoom = canvas.getZoom();
    canvas.setZoom(zoom / 1.2);
    canvas.renderAll();
}

function resetView() {
    resizeCanvas();
}

// Error display
function showError(message) {
    document.getElementById('loadingOverlay').innerHTML = `
    <div class="error-state">
      <h2>⚠️ Error</h2>
      <p>${message}</p>
      <a href="index.html" class="btn btn-primary mt-lg">← Back to Home</a>
    </div>
  `;
}

// Toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Offline caching
function cacheBuilding(data) {
    try {
        localStorage.setItem(`intramap_building_${data.buildingId}`, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to cache building:', e);
    }
}

function getCachedBuilding(buildingId) {
    try {
        const cached = localStorage.getItem(`intramap_building_${buildingId}`);
        return cached ? JSON.parse(cached) : null;
    } catch (e) {
        console.error('Failed to load cached building:', e);
        return null;
    }
}

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}
