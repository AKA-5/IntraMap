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
        allowTouchScrolling: false, // Disable to allow custom touch panning
        stopContextMenu: true,
        renderOnAddRemove: true,
        hoverCursor: 'grab',
        moveCursor: 'grab',
        defaultCursor: 'grab',
        perPixelTargetFind: true,  // Precise click detection on actual shape, not bounding box
        targetFindTolerance: 4      // Small tolerance for easier clicking on thin borders
    });

    // Panning state variables (both mouse and touch)
    let isPanning = false;
    let lastPosX, lastPosY;
    let dragStartTarget = null;

    // Handle object clicks - only trigger if minimal movement (true click, not drag)
    let clickStartPos = null;
    let clickStartTarget = null;
    let hasMoved = false;

    // CONSOLIDATED MOUSE:DOWN - Handles both panning start AND click tracking
    canvas.on('mouse:down', function(opt) {
        const evt = opt.e;
        
        // Track click start position and target for click detection
        clickStartPos = { x: evt.clientX, y: evt.clientY };
        clickStartTarget = opt.target;
        dragStartTarget = opt.target;
        hasMoved = false;
        
        // Enable panning in these cases:
        // 1. Clicking on empty space (no target)
        // 2. Shift+Click anywhere (even on objects) - for easy panning
        // 3. Right-click drag (for desktop users)
        if (!opt.target || evt.shiftKey || evt.button === 2) {
            isPanning = true;
            canvas.selection = false;
            lastPosX = evt.clientX;
            lastPosY = evt.clientY;
            canvas.defaultCursor = 'grabbing';
            canvas.hoverCursor = 'grabbing';
            canvas.renderAll();
            
            // Prevent context menu on right-click
            if (evt.button === 2) {
                evt.preventDefault();
            }
        }
    });

    // CONSOLIDATED MOUSE:MOVE - Handles panning AND cursor updates
    canvas.on('mouse:move', function(opt) {
        const evt = opt.e;
        
        // Track movement for tap vs drag detection
        if (clickStartPos && !hasMoved) {
            const distance = Math.sqrt(
                Math.pow(evt.clientX - clickStartPos.x, 2) +
                Math.pow(evt.clientY - clickStartPos.y, 2)
            );
            if (distance > 5) {
                hasMoved = true;
            }
        }
        
        // Handle panning movement
        if (isPanning) {
            const deltaX = evt.clientX - lastPosX;
            const deltaY = evt.clientY - lastPosY;
            
            panCanvas(deltaX, deltaY);
            
            lastPosX = evt.clientX;
            lastPosY = evt.clientY;
        } else {
            // Update cursor when not panning
            if (opt.target && opt.target.objectLabel) {
                canvas.defaultCursor = 'pointer';
            } else {
                canvas.defaultCursor = 'grab';
            }
        }
    });

    // CONSOLIDATED MOUSE:UP - Handles panning end AND click detection
    canvas.on('mouse:up', function(opt) {
        const evt = opt.e;
        
        // Handle panning end
        if (isPanning) {
            canvas.setViewportTransform(canvas.viewportTransform);
            isPanning = false;
            canvas.selection = false;
            canvas.defaultCursor = 'grab';
            canvas.hoverCursor = 'grab';
            canvas.renderAll();
        } else {
            // Handle object click (only if minimal movement)
            if (opt.target && opt.target.objectLabel && clickStartTarget === opt.target && !hasMoved) {
                showObjectDetails(opt.target);
            }
        }
        
        // Reset click tracking
        clickStartPos = null;
        clickStartTarget = null;
        dragStartTarget = null;
        hasMoved = false;
    });

    // Cancel panning if mouse leaves canvas
    canvas.on('mouse:out', function(opt) {
        if (isPanning) {
            isPanning = false;
            canvas.selection = false;
            canvas.defaultCursor = 'grab';
            canvas.hoverCursor = 'grab';
            canvas.renderAll();
        }
    });
    
    // Prevent context menu on canvas (since we use right-click for panning)
    canvas.upperCanvasEl.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
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

    // Touch gesture support for mobile - SIMPLIFIED AND IMPROVED
    let touchStartDistance = 0;
    let touchStartZoom = 1;
    let touchStartCenter = null;
    let touchStartPos = null;
    let touchLastPos = null;
    let touchMoved = false;
    let touchTarget = null;
    
    // Use canvas element for touch capture
    const canvasTouchElement = canvas.upperCanvasEl;
    
    // Track touch start for single-finger interaction
    canvasTouchElement.addEventListener('touchstart', function(e) {
        if (e.touches && e.touches.length === 1) {
            const touch = e.touches[0];
            touchStartPos = {
                x: touch.clientX,
                y: touch.clientY
            };
            touchLastPos = {
                x: touch.clientX,
                y: touch.clientY
            };
            touchMoved = false;
            
            // Check if touch is on an object
            const pointer = canvas.getPointer(touch, true);
            const objects = canvas.getObjects();
            touchTarget = null;
            
            for (let i = objects.length - 1; i >= 0; i--) {
                const obj = objects[i];
                if (obj.containsPoint(pointer) && obj.objectLabel) {
                    touchTarget = obj;
                    break;
                }
            }
        } else if (e.touches && e.touches.length === 2) {
            // Two finger pinch - reset single touch state
            touchStartPos = null;
            touchLastPos = null;
            touchMoved = false;
            touchTarget = null;
        }
    }, { passive: true });
    
    // Native touchmove for smooth real-time panning - INSTANT, NO DELAY
    canvasTouchElement.addEventListener('touchmove', function(e) {
        if (e.touches && e.touches.length === 1 && touchStartPos && touchLastPos) {
            const touch = e.touches[0];
            const currentX = touch.clientX;
            const currentY = touch.clientY;
            
            // Calculate movement distance from start
            const totalDistance = Math.sqrt(
                Math.pow(currentX - touchStartPos.x, 2) +
                Math.pow(currentY - touchStartPos.y, 2)
            );
            
            // If movement exceeds threshold (10px), it's a drag not a tap
            if (totalDistance > 10) {
                touchMoved = true;
                
                // Calculate delta from last position
                const deltaX = currentX - touchLastPos.x;
                const deltaY = currentY - touchLastPos.y;
                
                // Apply pan movement immediately (Google Maps style)
                panCanvas(deltaX, deltaY);
                
                // Update last position for next frame
                touchLastPos = {
                    x: currentX,
                    y: currentY
                };
                
                // Prevent page scroll while panning - critical for mobile!
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }, { passive: false }); // passive: false allows preventDefault()
    
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

    // Centralized pan function with constraints
    function panCanvas(deltaX, deltaY) {
        const vpt = canvas.viewportTransform;
        vpt[4] += deltaX;
        vpt[5] += deltaY;
        
        // Apply pan constraints to prevent excessive white space
        const zoom = canvas.getZoom();
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        const wrapper = document.querySelector('.viewer-canvas-wrapper');
        const containerWidth = wrapper ? wrapper.clientWidth : window.innerWidth;
        const containerHeight = wrapper ? wrapper.clientHeight : window.innerHeight;
        
        // Allow small overscroll (100px) but keep content mostly visible
        const padding = 100;
        const scaledWidth = canvasWidth * zoom;
        const scaledHeight = canvasHeight * zoom;
        
        // If canvas smaller than container, keep centered
        if (scaledWidth <= containerWidth) {
            vpt[4] = (containerWidth - canvasWidth) / 2;
        } else {
            // Allow limited overscroll
            const maxPanX = padding;
            const minPanX = containerWidth - scaledWidth - padding;
            vpt[4] = Math.min(maxPanX, Math.max(minPanX, vpt[4]));
        }
        
        if (scaledHeight <= containerHeight) {
            vpt[5] = (containerHeight - canvasHeight) / 2;
        } else {
            const maxPanY = padding;
            const minPanY = containerHeight - scaledHeight - padding;
            vpt[5] = Math.min(maxPanY, Math.max(minPanY, vpt[5]));
        }
        
        canvas.requestRenderAll();
    }
    
    canvas.on('touch:drag', function(e) {
        // Touch dragging now handled by native touchmove event for better performance
        // This handler kept for compatibility but native events take priority
    });
    
    // Reset touch tracking when gesture ends
    canvasTouchElement.addEventListener('touchend', function(e) {
        // Handle touch end - check if it was a tap (not a drag)
        if (touchStartPos && !touchMoved && touchTarget) {
            // This was a quick tap on an object - show popup!
            setTimeout(() => {
                showObjectDetails(touchTarget);
            }, 10);
        }
        
        // Reset all touch state
        touchStartDistance = 0;
        touchStartZoom = 1;
        touchStartCenter = null;
        touchStartPos = null;
        touchLastPos = null;
        touchMoved = false;
        touchTarget = null;
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
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
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
    const padding = 80; // Larger padding for better initial view
    const contentWidth = (maxX - minX) + (padding * 2);
    const contentHeight = (maxY - minY) + (padding * 2);

    // Use actual content dimensions (don't force square)
    canvas.baseWidth = Math.max(contentWidth, 400);
    canvas.baseHeight = Math.max(contentHeight, 400);

    // Center all objects by adjusting their positions
    const offsetX = padding - minX;
    const offsetY = padding - minY;

    if (offsetX !== 0 || offsetY !== 0) {
        objects.forEach(obj => {
            obj.set({
                left: obj.left + offsetX,
                top: obj.top + offsetY
            });
            obj.setCoords();
        });
    }

    // Reset viewport to origin
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    resizeCanvas();
    
    // Center the canvas in the viewport
    centerCanvas();
}

// Center canvas in viewport
function centerCanvas() {
    const zoom = canvas.getZoom();
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const wrapper = document.querySelector('.viewer-canvas-wrapper');
    
    if (!wrapper) return;
    
    const containerWidth = wrapper.clientWidth;
    const containerHeight = wrapper.clientHeight;
    
    // Calculate how much space is left after placing the canvas
    const offsetX = (containerWidth - canvasWidth) / 2;
    const offsetY = (containerHeight - canvasHeight) / 2;
    
    // Center the canvas by adjusting viewport transform
    const vpt = canvas.viewportTransform;
    vpt[4] = offsetX;
    vpt[5] = offsetY;
    
    canvas.requestRenderAll();
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

    // Calculate scale to fit container - prioritize showing full content
    let scale;
    if (isMobile) {
        // On mobile: fit to width with margin for better visibility
        // Padding: 40px top/bottom, 20px left/right
        scale = Math.min(
            (containerWidth - 40) / baseWidth,  // Account for wrapper padding
            (containerHeight - 80) / baseHeight
        );
        // More lenient minimum scale to show larger maps
        scale = Math.max(scale, 0.2);
        // Allow up to 2x zoom
        scale = Math.min(scale, 2.0);
    } else {
        // On desktop: fit with generous padding for clean initial view
        scale = Math.min(
            (containerWidth - 120) / baseWidth,
            (containerHeight - 120) / baseHeight
        );
        // More lenient minimum to ensure full map is visible
        scale = Math.max(scale, 0.2);
        // Allow up to 1.5x zoom for close-up detail
        scale = Math.min(scale, 1.5);
    }

    canvas.setWidth(baseWidth * scale);
    canvas.setHeight(baseHeight * scale);
    canvas.setZoom(scale);
    canvas.renderAll();
    
    // Re-center canvas after resize
    centerCanvas();
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

    floorData.objects.forEach((objData, index) => {
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
                // Don't make text clickable - only shapes should be clickable
                // This prevents click conflicts when text is positioned near shapes
                obj.set({
                    selectable: false,
                    evented: false,
                    hoverCursor: 'default',
                    moveCursor: 'default'
                });
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
                                fill: iconColor,
                                selectable: false,
                                evented: false,  // Icons are not clickable - only rectangles are
                                objectLabel: objData.objectLabel,
                                objectTags: objData.objectTags,
                                objectIcon: objData.objectIcon,
                                hoverCursor: 'default',
                                moveCursor: 'default'
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
        setTimeout(() => {
            fitCanvasToContent();
            // Center after fitting
            setTimeout(() => centerCanvas(), 50);
        }, 50);
    } else {
        // Wait for SVG loading to complete, then fit
        const checkSvgLoaded = setInterval(() => {
            if (svgLoadCount === totalSvgObjects) {
                clearInterval(checkSvgLoaded);
                setTimeout(() => {
                    fitCanvasToContent();
                    // Center after fitting
                    setTimeout(() => centerCanvas(), 50);
                }, 50);
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
    
    // Check if mobile device
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Mobile: Use bottom sheet style (handled by CSS)
        popup.style.removeProperty('left');
        popup.style.removeProperty('top');
        popup.style.opacity = '1';
        popup.classList.add('visible');
    } else {
        // Desktop: Smart positioning around object
        // Make visible but transparent to measure dimensions
        popup.style.opacity = '0';
        popup.classList.add('visible');

        const popupWidth = popup.offsetWidth || 320;
        const popupHeight = popup.offsetHeight || 200;

        // Default: Position to the right of object
        let left = objViewportX + 20;
        let top = objViewportY - popupHeight / 2;

        // Adjust if popup goes off right edge
        if (left + popupWidth > viewportWidth - 20) {
            left = objViewportX - popupWidth - 20; // Position to the left instead
        }

        // Adjust if popup goes off left edge
        if (left < 20) {
            left = 20;
        }

        // Adjust if popup goes off top
        if (top < 20) {
            top = 20;
        }

        // Adjust if popup goes off bottom
        if (top + popupHeight > viewportHeight - 20) {
            top = viewportHeight - popupHeight - 20;
        }

        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
        popup.style.opacity = '1';
    }


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
    // Reset zoom to 1
    canvas.setZoom(1);
    
    // Fit canvas to content
    fitCanvasToContent();
    
    // Center the canvas
    setTimeout(() => {
        centerCanvas();
        showToast('View reset to center', 'info');
    }, 100);
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

