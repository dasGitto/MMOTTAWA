import fs from 'fs';
import * as turf from '@turf/turf';

async function fetchONSData() {
    console.log("Searching for Dataset 'Ottawa Neighbourhood Study (ONS) - Neighbourhood Boundaries Gen 3' on ArcGIS Hub...");

    const searchUrl = "https://opendata.arcgis.com/api/v3/datasets?q=Ottawa%20Neighbourhood%20Study%20(ONS)%20-%20Neighbourhood%20Boundaries%20Gen%203";
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error("Search failed: " + searchRes.statusText);
    const searchData = await searchRes.json();

    // Find the exact matching dataset name usually
    const dataset = searchData.data.find(d => d.attributes.name.includes("Gen 3"));
    if (!dataset) {
        console.log(searchData.data.map(d => d.attributes.name));
        throw new Error("Dataset not found");
    }

    const datasetUrl = dataset.attributes.url;
    // Construct a direct query to the MapServer/FeatureServer layer
    const geojsonUrl = `${datasetUrl}/query?where=1%3D1&outFields=*&f=geojson`;

    console.log("Fetching GeoJSON from:", geojsonUrl);

    const res = await fetch(geojsonUrl);
    if (!res.ok) throw new Error("GeoJSON fetch failed: " + res.statusText);

    const geojson = await res.json();

    console.log(`Successfully fetched ${geojson.features.length} features.`);

    const exactMatches = ["centretown", "old ottawa south"];

    const finalFeatures = [];
    const nepeanFeatures = [];
    const gloucesterFeatures = [];
    const vanierFeatures = [];

    for (const f of geojson.features) {
        const props = f.properties || {};
        const name = props.Name || props.Name_EN || props.NAME || props.NAME_EN || props.ONS_Name || props.Name_En;

        if (!name) continue;

        const lowerName = name.toLowerCase();

        if (exactMatches.includes(lowerName)) {
            console.log(`Found exact match: ${name}`);
            f.properties = { name: lowerName === "old ottawa south" ? "Old Ottawa South" : lowerName.charAt(0).toUpperCase() + lowerName.slice(1) };
            finalFeatures.push(f);
        } else if (lowerName.includes("nepean")) {
            nepeanFeatures.push(f);
        } else if (lowerName.includes("gloucester")) {
            gloucesterFeatures.push(f);
        } else if (lowerName.includes("vanier")) {
            vanierFeatures.push(f);
        }
    }

    console.log(`Found ${vanierFeatures.length} Vanier sub-neighborhoods.`);
    console.log(`Found ${nepeanFeatures.length} Nepean sub-neighborhoods.`);
    console.log(`Found ${gloucesterFeatures.length} Gloucester sub-neighborhoods.`);

    // Union Vanier
    if (vanierFeatures.length > 0) {
        console.log("Unioning Vanier...");
        let vanierUnion = vanierFeatures[0];
        for (let i = 1; i < vanierFeatures.length; i++) {
            try {
                vanierUnion = turf.union(turf.featureCollection([vanierUnion, vanierFeatures[i]]));
            } catch (e) {
                console.log("Error unioning a Vanier part, skipping...");
            }
        }
        vanierUnion.properties = { name: "Vanier" };
        finalFeatures.push(vanierUnion);
    }

    // Union Nepean
    if (nepeanFeatures.length > 0) {
        console.log("Unioning Nepean...");
        let nepeanUnion = nepeanFeatures[0];
        for (let i = 1; i < nepeanFeatures.length; i++) {
            try {
                nepeanUnion = turf.union(turf.featureCollection([nepeanUnion, nepeanFeatures[i]]));
            } catch (e) {
                console.log("Error unioning a Nepean part, skipping...");
            }
        }
        nepeanUnion.properties = { name: "Nepean" };
        finalFeatures.push(nepeanUnion);
    }

    // Union Gloucester
    if (gloucesterFeatures.length > 0) {
        console.log("Unioning Gloucester...");
        let gloucUnion = gloucesterFeatures[0];
        for (let i = 1; i < gloucesterFeatures.length; i++) {
            try {
                gloucUnion = turf.union(turf.featureCollection([gloucUnion, gloucesterFeatures[i]]));
            } catch (e) {
                console.log("Error unioning a Gloucester part, skipping...");
            }
        }
        gloucUnion.properties = { name: "Gloucester" };
        finalFeatures.push(gloucUnion);
    }

    const finalCollection = turf.featureCollection(finalFeatures);

    const outputDir = './public/data';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = `${outputDir}/hub_boundaries.geojson`;
    fs.writeFileSync(outputPath, JSON.stringify(finalCollection));
    console.log(`Done! Saved ${finalFeatures.length} clean polygons to ${outputPath}`);
}

fetchONSData().catch(console.error);
