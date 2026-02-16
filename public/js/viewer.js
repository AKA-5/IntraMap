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
            showObjectDetails(e.target); // Fixed function name
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
// Load building data
const urlParams = new URLSearchParams(window.location.search);
const buildingId = urlParams.get('building');

// DEBUG: FORCE UNREGISTER SERVICE WORKERS to solve caching issues
if (navigator.serviceWorker) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
            console.log('Unregistering Service Worker:', registration);
            registration.unregister();
        }
    });
}
// END DEBUG

// Initialize API
const api = new IntraMapAPI();
async function loadBuildingData() {
    // The original line `const buildingId = api.getBuildingIdFromURL();` is replaced by the global `buildingId`
    // and the `api` initialization is moved outside the function.

    if (!buildingId) {
        showError('No building ID provided in URL');
        return;
    }

    try {
        // Show loading
        document.getElementById('loadingOverlay').classList.remove('hidden');

        // FORCE RELOAD for demo/sample to ensure fresh data
        if (buildingId === 'sample') {
            console.log('Forcing fresh load for sample...');
            localStorage.removeItem(`intramap_building_${buildingId}`);
        }

        // Load from API
        buildingData = await api.loadBuilding(buildingId);

        // ... rest of function ...

        // ... inside showObjectDetails ...

        // Smart positioning
        const canvasRect = canvas.getElement().getBoundingClientRect();
        const objCenter = obj.getCenterPoint();
        const zoom = canvas.getZoom();

        const objViewportX = canvasRect.left + objCenter.x * zoom;
        const objViewportY = canvasRect.top + objCenter.y * zoom;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Make visible but transparent to measure dimensions
        popup.style.opacity = '0';
        popup.classList.add('visible');

        // Get precise dimensions
        const popupRect = popup.getBoundingClientRect();
        const popupWidth = popupRect.width || 300;
        const popupHeight = popupRect.height || 200;

        // Restore opacity
        popup.style.opacity = '1';

        // 1. Start with preferred position: To the RIGHT of the object, Centered Vertically
        let left = objViewportX + (obj.width * zoom / 2) + 15;
        let top = objViewportY - (popupHeight / 2);

        // 2. Check Right Edge: If it doesn't fit on right, try LEFT
        if (left + popupWidth > viewportWidth - 20) {
            left = objViewportX - (obj.width * zoom / 2) - popupWidth - 15;
        }

        // 3. Check Bottom Edge: If it goes off bottom, push it UP
        if (top + popupHeight > viewportHeight - 20) {
            top = viewportHeight - popupHeight - 20;
        }

        // 4. Check Top Edge: If it goes off top, push it DOWN
        if (top < 20) {
            top = 20;
        }

        // 5. Special Case: Small Screens / Mobile
        if (viewportWidth < 768) {
            // Center on screen or stick to bottom
            left = (viewportWidth - popupWidth) / 2;
            top = (viewportHeight - popupHeight) / 2;
        }

        // Apply computed positions
        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
        popup.classList.add('visible');

        selectedObject = obj;
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
        console.error('Floor data not found:', floor);
        return;
    }

    const floorData = buildingData.floors[floor];
    document.getElementById('buildingFloor').textContent = floorData.name;

    if (!floorData.objects || floorData.objects.length === 0) {
        console.log('No objects in floor');
        canvas.renderAll();
        return;
    }

    // Track SVG loading
    let totalSvgObjects = 0;
    let svgLoadCount = 0;

    floorData.objects.forEach(objData => {
        let obj;

        switch (objData.type) {
            case 'rect':
                obj = new fabric.Rect(objData);
                break;
            case 'circle':
                obj = new fabric.Circle(objData);
                break;
            case 'i-text':
                obj = new fabric.IText(objData.text || '', objData);
                break;
            case 'line':
                obj = new fabric.Line([objData.x1, objData.y1, objData.x2, objData.y2], objData);
                break;
            default:
                if (objData.objectIcon) {
                    // SVG Icon handling
                    if (Icons[objData.objectIcon]) {
                        totalSvgObjects++;
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
                            svgLoadCount++;
                            if (svgLoadCount === totalSvgObjects) {
                                // Re-order: Bring all strings/text to front to ensure not hidden by icons
                                canvas.getObjects().forEach(o => {
                                    if (o.type === 'i-text') {
                                        o.bringToFront();
                                    }
                                });
                                canvas.renderAll();
                            }
                        });
                        return; // Async handling, skip synchronous add
                    }
                }
                // Default/Fallback: Rect
                obj = new fabric.Rect(objData);
                break;
        }

        // Add non-SVG object to canvas
        if (obj) {
            obj.set({
                selectable: false,
                hoverCursor: objData.objectLabel ? 'pointer' : 'default'
            });
            canvas.add(obj);
            allObjects.push(obj);
        }
    });

    // IMPORTANT: Render canvas after loading objects
    if (totalSvgObjects === 0) {
        canvas.renderAll();
    }

    // SAFETY: Force render after a short delay
    setTimeout(() => canvas.renderAll(), 100);
    setTimeout(() => canvas.requestRenderAll(), 500);

    // Re-add "You Are Here" marker
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
            showObjectDetails(obj);
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

// Show object details popup
function showObjectDetails(obj) {
    const popup = document.getElementById('objectPopup');
    const label = obj.objectLabel || 'Unnamed';
    const tags = obj.objectTags || '';

    document.getElementById('popupName').textContent = label;
    document.getElementById('popupFloor').textContent = buildingData.floors[currentFloor].name;

    // Show tags
    const tagsContainer = document.getElementById('popupTags');
    tagsContainer.innerHTML = '';
    if (tags) {
        tags.split(',').forEach(tag => {
            const badge = document.createElement('span');
            badge.className = 'badge badge-secondary';
            badge.textContent = tag.trim();
            tagsContainer.appendChild(badge);
        });
    }

    // Smart positioning to keep popup within viewport
    const canvasRect = canvas.getElement().getBoundingClientRect();
    const objCenter = obj.getCenterPoint();
    const zoom = canvas.getZoom();

    // Calculate object position relative to viewport
    const objViewportX = canvasRect.left + objCenter.x * zoom;
    const objViewportY = canvasRect.top + objCenter.y * zoom;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Make visible but transparent to measure dimensions
    popup.style.opacity = '0';
    popup.classList.add('visible');

    const popupWidth = popup.offsetWidth || 300;
    const popupHeight = popup.offsetHeight || 200;

    // Restore opacity
    popup.style.opacity = '1';

    let left = objViewportX + 20; // Default to right of object
    let top = objViewportY - popupHeight / 2; // Default to vertically centered

    // STRATEGY: If object is in bottom half of screen, position popup ABOVE it
    if (objViewportY > viewportHeight * 0.6) {
        top = objViewportY - (obj.height * zoom / 2) - popupHeight - 10;
        left = objViewportX - (popupWidth / 2);
    }
    // Otherwise position to the RIGHT (or LEFT if no space)
    else {
        // Check right edge
        if (left + popupWidth > viewportWidth - 20) {
            left = objViewportX - popupWidth - 20; // Flip to left
        }
    }

    // Final Clamp to Viewport to ensure NO CUTOFF
    if (left < 10) left = 10;
    if (left + popupWidth > viewportWidth - 10) left = viewportWidth - popupWidth - 10;

    if (top < 10) top = 10;
    if (top + popupHeight > viewportHeight - 10) top = viewportHeight - popupHeight - 10;

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
    popup.classList.add('visible');

    selectedObject = obj;
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

// Service Worker// SERVICE WORKER KILL SWITCH
// We are intentionally removing the PWA functionality to fix severe caching issues.
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
            console.log('Unregistering Service Worker to fix cache:', registration);
            registration.unregister();
        }
    });
}
