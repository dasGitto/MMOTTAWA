import fs from 'fs';
import osmtogeojson from 'osmtogeojson';

async function fetchBoundaries() {
    const query = `
    [out:json][timeout:60];
    (
      relation["name"~"The Glebe|Westboro|Hintonburg|Wellington|ByWard Market|Lowertown|Kanata|Little Italy|Dow|Barrhaven|Orléans|Vanier|Riverside Park|Lansdowne|Ottawa South"](45.1,-76.3,45.6,-75.2);
      way["name"~"The Glebe|Westboro|Hintonburg|Wellington|ByWard Market|Lowertown|Kanata|Little Italy|Dow|Barrhaven|Orléans|Vanier|Riverside Park|Lansdowne|Ottawa South"](45.1,-76.3,45.6,-75.2);
    );
    out body;
    >;
    out skel qt;
  `;

    console.log("Fetching bounded data from Overpass...");
    const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query
    });

    const text = await res.text();

    try {
        const data = JSON.parse(text);
        const geojson = osmtogeojson(data);

        // Filter for Polygons and MultiPolygons to ensure we have borders
        geojson.features = geojson.features.filter(f => f.geometry.type.includes('Polygon'));

        // Clean up excessive labels by blanking out the name while preserving the polygons
        let orleansFound = false;
        let glebeFound = false;

        geojson.features = geojson.features.filter(f => {
            const name = f.properties.name || '';

            // Handle Orleans Labels
            if (name.includes('Orléans') || name.includes('Orleans')) {
                if (!orleansFound) {
                    f.properties.name = 'Orléans'; // Standardize the name
                    orleansFound = true;
                } else {
                    f.properties.name = ''; // Just remove the label, keep the polygon
                }
                return true;
            }

            // Handle Glebe / Ottawa South / Dow's Lake / Lansdowne Consolidation
            if (name.includes('Glebe') || name.includes('Ottawa South') || name.includes('Dow') || name.includes('Lansdowne')) {
                if (!glebeFound) {
                    f.properties.name = 'Glebe & Ottawa South';
                    glebeFound = true;
                } else {
                    f.properties.name = ''; // Just remove the label, keep the polygon
                }
                return true;
            }

            return true;
        });

        fs.writeFileSync('./public/neighborhoods.geojson', JSON.stringify(geojson));
        console.log("Done. Saved Polygon Features count:", geojson.features.length);
    } catch (e) {
        console.error("Failed parsing JSON. Overpass Error:");
        console.error(text.slice(0, 1000));
    }
}
fetchBoundaries().catch(console.error);
