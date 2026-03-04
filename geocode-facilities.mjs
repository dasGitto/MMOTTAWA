import fs from 'fs';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
    console.log("Fetching City Facilities from ArcGIS...");
    const apiUrl = "https://opendata.arcgis.com/datasets/3b4603ab240f46339b3de6c4ad285c3e_0/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json";

    const response = await fetch(apiUrl);
    const data = await response.json();

    const features = data.features;
    console.log(`Found ${features.length} facilities. Beginning geocoding process (approx 3-5 mins due to strict 1 req/sec Rate Limit on Nominatim)...`);

    const geojsonFeatures = [];

    // Process one by one with 1s delay to respect Nominatim limits
    for (let i = 0; i < features.length; i++) {
        const item = features[i].attributes;
        const address = `${item.Address}, ${item.City}, ${item.Province}`;

        try {
            // Encode the URI and request JSON format
            const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

            const geoRes = await fetch(geocodeUrl, {
                headers: {
                    'User-Agent': 'Antigravity-Ottawa-Hubs/1.0'
                }
            });
            const geoData = await geoRes.json();

            if (geoData && geoData.length > 0) {
                const { lat, lon } = geoData[0];
                geojsonFeatures.push({
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lon), parseFloat(lat)]
                    },
                    properties: {
                        id: item.OBJECTID,
                        name: item.Complex || "City Facility",
                        address: item.Address,
                        phone: item.Business_Phone,
                        category: "Facility"
                    }
                });
                console.log(`[${i + 1}/${features.length}] Success: ${item.Complex}`);
            } else {
                console.log(`[${i + 1}/${features.length}] Failed: ${item.Complex} (${address})`);
            }
        } catch (error) {
            console.error(`[${i + 1}/${features.length}] Error on: ${item.Complex}`, error.message);
        }

        // Wait 1200ms to stay safely under 1 RPS
        await delay(1200);
    }

    const output = {
        type: "FeatureCollection",
        features: geojsonFeatures
    };

    fs.writeFileSync('public/city_facilities.geojson', JSON.stringify(output, null, 2));
    console.log(`Geocoding Complete! Saved ${geojsonFeatures.length} valid features to public/city_facilities.geojson`);
}

run();
