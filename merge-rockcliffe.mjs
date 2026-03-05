import fs from 'fs';
import * as turf from '@turf/turf';

const GEOJSON_PATH = './public/ons_boundaries_gen3.geojson';

function mergeRockcliffe() {
    console.log('Loading geojson dataset...');
    const rawData = fs.readFileSync(GEOJSON_PATH, 'utf8');
    const geojson = JSON.parse(rawData);

    const targetNames = [
        'VANIER NORTH',
        'NEW EDINBURGH',
        'MANOR PARK',
        'ROCKCLIFFE PARK',
        'BEECHWOOD CEMETERY'
    ];

    const toMerge = [];
    const preserved = [];

    geojson.features.forEach(f => {
        if (!f.properties || !f.properties.ONS_Name) {
            preserved.push(f);
            return;
        }

        const name = f.properties.ONS_Name.toUpperCase();
        if (targetNames.includes(name)) {
            toMerge.push(f);
        } else {
            preserved.push(f);
        }
    });

    console.log(`Found ${toMerge.length} sub-neighborhoods to merge:`, toMerge.map(f => f.properties.ONS_Name));

    if (toMerge.length === 0) {
        console.log("No neighborhoods found. Did you already merge them?");
        return;
    }

    // Merge them mathematically
    console.log('Unioning polygons mathematically...');
    let mergedPolygon = toMerge[0];

    for (let i = 1; i < toMerge.length; i++) {
        try {
            // Need to wrap in FeatureCollection for precise Turf operations occasionally
            mergedPolygon = turf.union(turf.featureCollection([mergedPolygon, toMerge[i]]));
        } catch (e) {
            console.error("Failed to union polygon for:", toMerge[i].properties.ONS_Name);
        }
    }

    // Standardize Name Property
    mergedPolygon.properties = {
        ...toMerge[0].properties, // keep baseline attributes
        Name: 'ROCKCLIFFE',
        Name_EN: 'ROCKCLIFFE',
        NAME: 'ROCKCLIFFE',
        NAME_EN: 'ROCKCLIFFE',
        ONS_Name: 'ROCKCLIFFE',
        Name_En: 'ROCKCLIFFE',
    };

    preserved.push(mergedPolygon);

    console.log(`Writing consolidated FeatureCollection back to ${GEOJSON_PATH}...`);
    const finalCollection = turf.featureCollection(preserved);
    fs.writeFileSync(GEOJSON_PATH, JSON.stringify(finalCollection));
    console.log('Done! The Rockcliffe area has been consolidated successfully.');
}

mergeRockcliffe();
