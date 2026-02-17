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
        interactive: true,
        enableRetinaScaling: true // Better quality on high-DPI displays
    });

    // Handle object clicks
    canvas.on('mouse:down', (e) => {
        if (youAreHereMode) {
            // Get accurate canvas coordinates accounting for zoom/pan
            const pointer = canvas.getPointer(e.e);
            placeYouAreHere(pointer.x, pointer.y);
        } else if (e.target && e.target.objectLabel) {
            showObjectDetails(e.target); // Fixed function name
        }
    });

    // Enable panning with mouse drag (when zoomed)
    let isPanning = false;
    let lastPosX, lastPosY;

    canvas.on('mouse:down', function(opt) {
        const evt = opt.e;
        if (evt.altKey === true || evt.ctrlKey === true || canvas.getZoom() > 1) {
            // Enable panning mode
            if (!opt.target || evt.altKey || evt.ctrlKey) {
                isPanning = true;
                canvas.selection = false;
                lastPosX = evt.clientX;
                lastPosY = evt.clientY;
                canvas.defaultCursor = 'grabbing';
            }
        }
    });

    canvas.on('mouse:move', function(opt) {
        if (isPanning) {
            const evt = opt.e;
            const vpt = canvas.viewportTransform;
            vpt[4] += evt.clientX - lastPosX;
            vpt[5] += evt.clientY - lastPosY;
            canvas.requestRenderAll();
            lastPosX = evt.clientX;
            lastPosY = evt.clientY;
        }
    });

    canvas.on('mouse:up', function(opt) {
        if (isPanning) {
            canvas.setViewportTransform(canvas.viewportTransform);
            isPanning = false;
            canvas.defaultCursor = 'default';
        }
    });

    // Mouse wheel: Ctrl = Zoom, Shift = Horizontal scroll, Default = Vertical scroll
    canvas.on('mouse:wheel', function(opt) {
        const evt = opt.e;
        const delta = evt.deltaY;
        
        if (evt.ctrlKey) {
            // Ctrl + Wheel = Zoom
            let zoom = canvas.getZoom();
            zoom *= 0.999 ** delta;
            
            // Limit zoom range
            if (zoom > 4) zoom = 4;
            if (zoom < 0.3) zoom = 0.3;
            
            canvas.zoomToPoint({ x: evt.offsetX, y: evt.offsetY }, zoom);
        } else if (evt.shiftKey) {
            // Shift + Wheel = Horizontal scroll
            const vpt = canvas.viewportTransform;
            vpt[4] -= delta * 0.5; // Horizontal pan
            canvas.requestRenderAll();
        } else {
            // Default Wheel = Vertical scroll
            const vpt = canvas.viewportTransform;
            vpt[5] -= delta * 0.5; // Vertical pan
            canvas.requestRenderAll();
        }
        
        evt.preventDefault();
        evt.stopPropagation();
    });

    // Responsive canvas sizing
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Keyboard shortcuts
    initializeKeyboardShortcuts();
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

// Initialize keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignore if typing in input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Escape - Close popup and clear highlights
        if (e.key === 'Escape') {
            closePopup();
            clearHighlights();
            if (youAreHereMode) {
                toggleYouAreHere();
            }
            // Close keyboard help overlay if open
            const keyboardHelp = document.getElementById('keyboardHelpOverlay');
            if (keyboardHelp && keyboardHelp.style.display === 'flex') {
                dismissKeyboardHelp();
            }
            // Close welcome overlay if open
            const welcome = document.getElementById('welcomeOverlay');
            if (welcome && welcome.style.display === 'flex') {
                dismissWelcome();
            }
        }

        // Space - Toggle welcome overlay info
        if (e.key === ' ') {
            e.preventDefault();
            const welcome = document.getElementById('welcomeOverlay');
            if (welcome.style.display === 'none') {
                showWelcome();
            } else {
                dismissWelcome();
            }
        }

        // Arrow keys - Pan the canvas
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            const vpt = canvas.viewportTransform;
            const panDistance = 50;
            
            if (e.key === 'ArrowLeft') vpt[4] += panDistance;
            if (e.key === 'ArrowRight') vpt[4] -= panDistance;
            if (e.key === 'ArrowUp') vpt[5] += panDistance;
            if (e.key === 'ArrowDown') vpt[5] -= panDistance;
            
            canvas.requestRenderAll();
        }

        // Plus/Minus - Zoom
        if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            zoomIn();
        }
        if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            zoomOut();
        }

        // 0 - Reset view
        if (e.key === '0') {
            e.preventDefault();
            resetView();
        }

        // C - Clear marker (not Ctrl+C to avoid conflict)
        if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
            clearMarker();
        }

        // M - Toggle "You Are Here" mode
        if (e.key === 'm' || e.key === 'M') {
            toggleYouAreHere();
        }
    });
}

// Load building data - SIMPLIFIED
const urlParams = new URLSearchParams(window.location.search);
const buildingId = urlParams.get('building');

async function loadBuildingData() {
    if (!buildingId) {
        showError('No building ID provided in URL');
        return;
    }

    try {
        document.getElementById('loadingOverlay').classList.remove('hidden');

        // SIMPLE: Just load the JSON file directly
        if (buildingId === 'sample') {
            const response = await fetch('data/demo-building.json');
            if (!response.ok) throw new Error('Failed to load demo data');
            buildingData = await response.json();
        } else {
            // Load from API for other buildings
            const api = new IntraMapAPI();
            buildingData = await api.loadBuilding(buildingId);
        }

        if (!buildingData) throw new Error('No data received');

        // Initialize UI with data
        document.getElementById('buildingName').textContent = buildingData.name;
        document.title = `${buildingData.name} - IntraMap`;

        // Populate floor selector
        populateFloorSelector();

        // Load initial floor
        loadFloorToCanvas(currentFloor);

        // Hide loading
        document.getElementById('loadingOverlay').classList.add('hidden');

        // Show welcome overlay for first-time visitors
        setTimeout(() => showWelcome(), 500);

    } catch (error) {
        console.error('Error loading building:', error);
        document.getElementById('loadingOverlay').classList.add('hidden');
        showError('Failed to load building: ' + error.message);
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
    // Floor name now shown in dropdown only (removed duplicate display)

    if (!floorData.objects || floorData.objects.length === 0) {
        console.log('No objects in floor');
        canvas.renderAll();
        return;
    }

    // Track SVG loading
    let totalSvgObjects = 0;
    let svgLoadCount = 0;
    let lastRectWithLabel = null; // Track the last rectangle with a label

    floorData.objects.forEach((objData, index) => {
        let obj;

        switch (objData.type) {
            case 'rect':
                obj = new fabric.Rect(objData);
                // Track if this rect has a label for next text object
                if (objData.objectLabel) {
                    lastRectWithLabel = objData;
                }
                break;
            case 'circle':
                obj = new fabric.Circle(objData);
                if (objData.objectLabel) {
                    lastRectWithLabel = objData;
                }
                break;
            case 'i-text':
                obj = new fabric.IText(objData.text || '', objData);
                // Inherit objectLabel from previous rectangle/shape to make text clickable
                if (lastRectWithLabel && !objData.objectLabel) {
                    obj.objectLabel = lastRectWithLabel.objectLabel;
                    obj.objectTags = lastRectWithLabel.objectTags;
                    obj.objectIcon = lastRectWithLabel.objectIcon;
                    // Make the text area clickable with pointer cursor
                    obj.set({
                        selectable: false,
                        evented: true,
                        hoverCursor: 'pointer'
                    });
                }
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

    // Show clear button
    document.getElementById('clearMarkerBtn').style.display = 'flex';

    showToast('Location marked!', 'success');
}

// Clear "You Are Here" marker
function clearMarker() {
    if (youAreHereMarker) {
        canvas.remove(youAreHereMarker);
        youAreHereMarker = null;
        canvas.renderAll();
        
        // Hide clear button
        document.getElementById('clearMarkerBtn').style.display = 'none';
        
        showToast('Marker cleared', 'info');
    }
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
    let zoom = canvas.getZoom();
    zoom = zoom * 1.2;
    if (zoom > 4) zoom = 4; // Max zoom limit
    
    // Zoom to center
    const center = canvas.getCenter();
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), zoom);
    canvas.renderAll();
}

function zoomOut() {
    let zoom = canvas.getZoom();
    zoom = zoom / 1.2;
    if (zoom < 0.3) zoom = 0.3; // Min zoom limit
    
    // Zoom to center
    const center = canvas.getCenter();
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), zoom);
    canvas.renderAll();
}

function resetView() {
    // Reset viewport transform
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    
    // Reset to fit container
    resizeCanvas();
    
    showToast('View reset', 'info');
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

// Welcome overlay functions
function showWelcome() {
    const hasSeenWelcome = localStorage.getItem('intramap_welcome_seen');
    if (!hasSeenWelcome && buildingData) {
        const overlay = document.getElementById('welcomeOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }
}

function dismissWelcome() {
    const overlay = document.getElementById('welcomeOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        localStorage.setItem('intramap_welcome_seen', 'true');
    }
}

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

function dismissKeyboardHelp() {
    const overlay = document.getElementById('keyboardHelpOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.onclick = null;
    }
}

