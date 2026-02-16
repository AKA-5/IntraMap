// Script to upload sample building data to Cloudflare Workers
const fs = require('fs');
const path = require('path');

const API_URL = 'https://intramap-api.kaleempk555.workers.dev';

async function uploadSampleData() {
    try {
        // Read sample data
        const sampleDataPath = path.join(__dirname, 'sample-data', 'demo-building.json');
        const buildingData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));

        console.log('Uploading sample building data...');
        console.log(`Building ID: ${buildingData.buildingId}`);
        console.log(`Building Name: ${buildingData.name}`);

        // Upload to API
        const response = await fetch(`${API_URL}/api/buildings/${buildingData.buildingId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(buildingData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to upload');
        }

        const result = await response.json();
        console.log('✓ Sample data uploaded successfully!');
        console.log('View at: https://your-domain.vercel.app/viewer.html?building=sample');

    } catch (error) {
        console.error('✗ Upload failed:', error.message);
        process.exit(1);
    }
}

uploadSampleData();
