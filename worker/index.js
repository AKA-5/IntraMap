// IntraMap - Cloudflare Worker API
// Handles building data storage and retrieval using Cloudflare KV

export default {
    async fetch(request, env) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return handleCORS();
        }

        const url = new URL(request.url);
        const path = url.pathname;

        // Route requests
        if (path.startsWith('/api/buildings/')) {
            const buildingId = path.split('/api/buildings/')[1];

            if (request.method === 'POST') {
                return await saveBuilding(request, env, buildingId);
            } else if (request.method === 'GET') {
                return await getBuilding(env, buildingId);
            }
        }

        // List all buildings (optional endpoint)
        if (path === '/api/buildings' && request.method === 'GET') {
            return await listBuildings(env);
        }

        return jsonResponse({ error: 'Not found' }, 404);
    }
};

/**
 * Save building data to KV storage
 */
async function saveBuilding(request, env, buildingId) {
    try {
        // Validate building ID
        if (!buildingId || !isValidBuildingId(buildingId)) {
            return jsonResponse({
                success: false,
                error: 'Invalid building ID. Use lowercase alphanumeric characters and hyphens only.'
            }, 400);
        }

        // Parse request body
        const buildingData = await request.json();

        // Validate building data
        if (!buildingData.version || !buildingData.name || !buildingData.floors) {
            return jsonResponse({
                success: false,
                error: 'Invalid building data. Must include version, name, and floors.'
            }, 400);
        }

        // Add metadata
        buildingData.buildingId = buildingId;
        buildingData.updatedAt = new Date().toISOString();

        if (!buildingData.createdAt) {
            buildingData.createdAt = buildingData.updatedAt;
        }

        // Save to KV
        await env.BUILDINGS.put(
            `building:${buildingId}`,
            JSON.stringify(buildingData),
            {
                metadata: {
                    name: buildingData.name,
                    updatedAt: buildingData.updatedAt
                }
            }
        );

        return jsonResponse({
            success: true,
            buildingId: buildingId,
            message: 'Building saved successfully'
        });

    } catch (error) {
        console.error('Save building error:', error);
        return jsonResponse({
            success: false,
            error: 'Failed to save building: ' + error.message
        }, 500);
    }
}

/**
 * Get building data from KV storage
 */
async function getBuilding(env, buildingId) {
    try {
        // Validate building ID
        if (!buildingId || !isValidBuildingId(buildingId)) {
            return jsonResponse({
                success: false,
                error: 'Invalid building ID'
            }, 400);
        }

        // Get from KV
        const buildingData = await env.BUILDINGS.get(`building:${buildingId}`, 'json');

        if (!buildingData) {
            return jsonResponse({
                success: false,
                error: 'Building not found'
            }, 404);
        }

        return jsonResponse(buildingData);

    } catch (error) {
        console.error('Get building error:', error);
        return jsonResponse({
            success: false,
            error: 'Failed to load building: ' + error.message
        }, 500);
    }
}

/**
 * List all buildings (optional endpoint)
 */
async function listBuildings(env) {
    try {
        const list = await env.BUILDINGS.list({ prefix: 'building:' });

        const buildings = list.keys.map(key => ({
            buildingId: key.name.replace('building:', ''),
            name: key.metadata?.name || 'Unknown',
            updatedAt: key.metadata?.updatedAt || null
        }));

        return jsonResponse({
            success: true,
            count: buildings.length,
            buildings: buildings
        });

    } catch (error) {
        console.error('List buildings error:', error);
        return jsonResponse({
            success: false,
            error: 'Failed to list buildings: ' + error.message
        }, 500);
    }
}

/**
 * Validate building ID format
 */
function isValidBuildingId(buildingId) {
    // Allow lowercase alphanumeric and hyphens, 3-50 characters
    return /^[a-z0-9-]{3,50}$/.test(buildingId);
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status: status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'no-cache'
        }
    });
}

/**
 * Handle CORS preflight requests
 */
function handleCORS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        }
    });
}
