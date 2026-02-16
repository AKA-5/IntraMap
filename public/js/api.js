// IntraMap - API Client
// Handles all communication with Cloudflare Worker backend

class IntraMapAPI {
    constructor(baseURL = '') {
        // Default to relative URLs for same-origin requests
        // Update this after deploying Cloudflare Worker
        this.baseURL = baseURL || 'https://intramap-api.kaleempk555.workers.dev';
    }

    /**
     * Save building data to cloud storage
     * @param {string} buildingId - Unique building identifier (lowercase, alphanumeric + hyphens)
     * @param {object} buildingData - Complete building JSON data
     * @returns {Promise<object>} Response with success status
     */
    async saveBuilding(buildingId, buildingData) {
        try {
            const sanitizedId = this._sanitizeBuildingId(buildingId);

            const response = await fetch(`${this.baseURL}/api/buildings/${sanitizedId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(buildingData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save building');
            }

            return await response.json();
        } catch (error) {
            console.error('Save building error:', error);
            throw error;
        }
    }

    /**
     * Load building data from cloud storage
     * @param {string} buildingId - Unique building identifier
     * @returns {Promise<object>} Building data
     */
    async loadBuilding(buildingId) {
        try {
            const sanitizedId = this._sanitizeBuildingId(buildingId);

            // SPECIAL CASE: Load demo building from local file to ensure latest version
            if (sanitizedId === 'sample') {
                console.log('Loading demo building from local file...');
                const response = await fetch('data/demo-building.json');
                if (!response.ok) {
                    throw new Error('Failed to load local demo data');
                }
                return await response.json();
            }

            const response = await fetch(`${this.baseURL}/api/buildings/${sanitizedId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Building not found');
                }
                const error = await response.json();
                throw new Error(error.error || 'Failed to load building');
            }

            return await response.json();
        } catch (error) {
            console.error('Load building error:', error);
            throw error;
        }
    }

    /**
     * Sanitize building ID to ensure it's URL-safe
     * @param {string} buildingId - Raw building ID
     * @returns {string} Sanitized building ID
     */
    _sanitizeBuildingId(buildingId) {
        return buildingId
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Generate a shareable viewer URL for a building
     * @param {string} buildingId - Building identifier
     * @returns {string} Full viewer URL
     */
    getViewerURL(buildingId) {
        const sanitizedId = this._sanitizeBuildingId(buildingId);
        const baseURL = window.location.origin;
        return `${baseURL}/viewer.html?building=${sanitizedId}`;
    }

    /**
     * Extract building ID from current URL parameters
     * @returns {string|null} Building ID or null if not found
     */
    getBuildingIdFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('building');
    }
}

// Create global API instance
const api = new IntraMapAPI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { IntraMapAPI };
}
