// IntraMap - Viewer Logic
// Handles floor plan viewing and search

let canvas;
let buildingData = null;
let currentFloor = 'ground';
let allObjects = [];
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
        enableRetinaScaling: true,
        allowTouchScrolling: false, // Disable to allow scroll container to handle
        stopContextMenu: false,
        renderOnAddRemove: true,
        hoverCursor: 'default',
        moveCursor: 'default'
    });

    // Handle object clicks
    canvas.on('mouse:down', (e) => {
        if (e.target && e.target.objectLabel) {
            showObjectDetails(e.target);
        }
    });

    // Update cursor on mouse move
    canvas.on('mouse:move', (e) => {
        if (e.target && e.target.objectLabel) {
            canvas.defaultCursor = 'pointer';
        } else {
            canvas.defaultCursor = 'default';
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

    // Mouse wheel: Ctrl = Zoom, Shift = Horizontal scroll, Default = Vertical/Horizontal scroll
    canvas.on('mouse:wheel', function(opt) {
        const evt = opt.e;
        const deltaY = evt.deltaY;
        const deltaX = evt.deltaX;
        
        if (evt.ctrlKey) {
            // Ctrl + Wheel = Zoom
            let zoom = canvas.getZoom();
            zoom *= 0.999 ** deltaY;
            
            // Limit zoom range
            if (zoom > 4) zoom = 4;
            if (zoom < 0.3) zoom = 0.3;
            
            canvas.zoomToPoint({ x: evt.offsetX, y: evt.offsetY }, zoom);
        } else if (evt.shiftKey) {
            // Shift + Wheel = Horizontal scroll
            const vpt = canvas.viewportTransform;
            vpt[4] -= deltaY * 0.5; // Horizontal pan
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
        
        evt.preventDefault();
        evt.stopPropagation();
    });

    // Touch gesture support for mobile
    let touchStartDistance = 0;
    let touchStartZoom = 1;
    let touchStartCenter = null;
    
    canvas.on('touch:gesture', function(e) {
        if (e.e.touches && e.e.touches.length === 2) {
            // Pinch zoom
            const point1 = { x: e.e.touches[0].clientX, y: e.e.touches[0].clientY };
            const point2 = { x: e.e.touches[1].clientX, y: e.e.touches[1].clientY };
            
            const currentDistance = Math.sqrt(
                Math.pow(point2.x - point1.x, 2) + 
                Math.pow(point2.y - point1.y, 2)
            );
            
            if (touchStartDistance === 0) {
                touchStartDistance = currentDistance;
                touchStartZoom = canvas.getZoom();
                touchStartCenter = {
                    x: (point1.x + point2.x) / 2,
                    y: (point1.y + point2.y) / 2
                };
            }
            
            const scale = currentDistance / touchStartDistance;
            let newZoom = touchStartZoom * scale;
            
            // Limit zoom
            if (newZoom > 4) newZoom = 4;
            if (newZoom < 0.3) newZoom = 0.3;
            
            if (touchStartCenter) {
                canvas.zoomToPoint(
                    new fabric.Point(touchStartCenter.x, touchStartCenter.y),
                    newZoom
                );
            }
            
            e.e.preventDefault();
            e.e.stopPropagation();
        }
    });
    
    canvas.on('touch:drag', function(e) {
        // Enable panning with single finger drag when zoomed
        if (canvas.getZoom() > 1 && e.e.touches && e.e.touches.length === 1) {
            const vpt = canvas.viewportTransform;
            vpt[4] += e.self.x - e.self.lastX;
            vpt[5] += e.self.y - e.self.lastY;
            canvas.requestRenderAll();
        }
    });
    
    // Reset touch tracking when gesture ends
    canvas.upperCanvasEl.addEventListener('touchend', function() {
        touchStartDistance = 0;
        touchStartZoom = 1;
        touchStartCenter = null;
    });

    // Responsive canvas sizing
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Keyboard shortcuts
    initializeKeyboardShortcuts();
}

// Fit canvas to actual content bounds (like draw.io)
function fitCanvasToContent() {
    const objects = canvas.getObjects();
    
    if (objects.length === 0) {
        // Default size if no objects
        canvas.baseWidth = 600;
        canvas.baseHeight = 600;
        resizeCanvas();
        return;
    }

    // Calculate bounding box of all objects
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    objects.forEach(obj => {
        const bound = obj.getBoundingRect();
        minX = Math.min(minX, bound.left);
        minY = Math.min(minY, bound.top);
        maxX = Math.max(maxX, bound.left + bound.width);
        maxY = Math.max(maxY, bound.top + bound.height);
    });

    // Calculate content dimensions with padding
    const padding = 100; // Padding around content
    const contentWidth = (maxX - minX) + (padding * 2);
    const contentHeight = (maxY - minY) + (padding * 2);

    // Make it square - use the larger dimension
    const size = Math.max(contentWidth, contentHeight, 400); // Minimum 400px

    // Store base dimensions
    canvas.baseWidth = size;
    canvas.baseHeight = size;

    // Adjust object positions to account for padding and centering
    const offsetX = padding - minX + (size - contentWidth) / 2;
    const offsetY = padding - minY + (size - contentHeight) / 2;

    // Move all objects to centered position
    objects.forEach(obj => {
        obj.set({
            left: obj.left + offsetX,
            top: obj.top + offsetY
        });
        obj.setCoords();
    });

    resizeCanvas();
}

// Resize canvas to fit container while maintaining content aspect ratio
function resizeCanvas() {
    const container = document.querySelector('.viewer-canvas-wrapper');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Use base dimensions if set, otherwise default
    const baseWidth = canvas.baseWidth || 600;
    const baseHeight = canvas.baseHeight || 600;

    // Detect mobile device
    const isMobile = window.innerWidth <= 768;

    // Calculate scale to fit container
    let scale;
    if (isMobile) {
        // On mobile: fit to width with small margin for better visibility
        scale = Math.min(
            (containerWidth - 32) / baseWidth,  // 32px total horizontal margin
            (containerHeight - 32) / baseHeight  // 32px total vertical margin
        );
        // Ensure minimum scale on mobile for readability
        scale = Math.max(scale, 0.5);
    } else {
        // On desktop: fit with 95% of available space
        scale = Math.min(
            containerWidth / baseWidth,
            containerHeight / baseHeight
        ) * 0.95;
    }

    canvas.setWidth(baseWidth * scale);
    canvas.setHeight(baseHeight * scale);
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
                        hoverCursor: 'pointer',
                        moveCursor: 'pointer'
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
                        const iconMeta = IconMetadata[objData.objectIcon];
                        const iconColor = objData.fill || (iconMeta ? iconMeta.color : '#000000');
                        
                        fabric.loadSVGFromString(Icons[objData.objectIcon], (objects, options) => {
                            obj = fabric.util.groupSVGElements(objects, options);
                            // Apply color to all paths in the group
                            obj.forEachObject((o) => {
                                o.set({ fill: iconColor });
                            });
                            obj.set({
                                ...objData,
                                fill: iconColor,
                                selectable: false,
                                evented: true,
                                objectLabel: objData.objectLabel,
                                objectTags: objData.objectTags,
                                objectIcon: objData.objectIcon,
                                hoverCursor: 'pointer',
                                moveCursor: 'pointer'
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
                evented: objData.objectLabel ? true : false,
                hoverCursor: objData.objectLabel ? 'pointer' : 'default',
                moveCursor: objData.objectLabel ? 'pointer' : 'default'
            });
            canvas.add(obj);
            allObjects.push(obj);
        }
    });

    // IMPORTANT: Render canvas after loading objects
    if (totalSvgObjects === 0) {
        canvas.renderAll();
        // Fit canvas to content after loading
        setTimeout(() => fitCanvasToContent(), 50);
    } else {
        // Wait for SVG loading to complete, then fit
        const checkSvgLoaded = setInterval(() => {
            if (svgLoadCount === totalSvgObjects) {
                clearInterval(checkSvgLoaded);
                setTimeout(() => fitCanvasToContent(), 50);
            }
        }, 100);
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

// Disabled: You Are Here feature removed for simplicity
// Users can simply search and view locations
function toggleYouAreHere() {
    // Feature disabled
}

function placeYouAreHere(x, y) {
    // Feature disabled
}

function clearMarker() {
    // Feature disabled
}

function getDirections() {
    // Feature disabled
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

