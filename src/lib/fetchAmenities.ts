import osmtogeojson from 'osmtogeojson';
import * as turf from '@turf/turf';

export async function fetchNeighborhoodAmenities(bbox: number[]) {
    // Overpass API expects: [minLat, minLon, maxLat, maxLon]
    // Turf bbox returns: [minLon, minLat, maxLon, maxLat]
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const bboxString = `${minLat},${minLon},${maxLat},${maxLon}`;

    // Query for parks, basketball, tennis, and new granular fitness nodes
    const query = `
    [out:json][timeout:25];
    (
      nwr["leisure"="park"](${bboxString});
      nwr["leisure"="fitness_centre"](${bboxString});
      nwr["leisure"="fitness_station"](${bboxString});
      nwr["sport"="basketball"](${bboxString});
      nwr["sport"="tennis"](${bboxString});
      nwr["amenity"="community_centre"](${bboxString});
      nwr["leisure"="dance"](${bboxString});
      nwr["sport"="martial_arts"](${bboxString});
      nwr["sport"="yoga"](${bboxString});
      nwr["sport"="crossfit"](${bboxString});
    );
    out body;
    >;
    out skel qt;
    `;

    const url = "https://overpass-api.de/api/interpreter";
    const response = await fetch(url, {
        method: "POST",
        body: "data=" + encodeURIComponent(query),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch from Overpass API");
    }

    const data = await response.json();
    const geojson = osmtogeojson(data) as any;

    // Standardize to points for efficient WebGL rendering & categorizing
    const standardizedFeatures = geojson.features.reduce((acc: any[], f: any) => {
        const props = f.properties || {};
        let category = 'Unknown';

        if (props.sport === 'basketball') category = 'Basketball';
        else if (props.sport === 'tennis') category = 'Tennis';
        else if (props.leisure === 'dance' || props.sport === 'dance') category = 'Dance';
        else if (props.sport === 'martial_arts') category = 'Martial Arts';
        else if (props.sport === 'yoga') category = 'Yoga';
        else if (props.sport === 'crossfit' || (props.sport === 'fitness' && props.name?.toLowerCase().includes('crossfit'))) category = 'Crossfit';
        else if (props.leisure === 'fitness_centre' || props.leisure === 'fitness_station') category = 'Gym / Fitness';
        else if (props.leisure === 'park') category = 'Park';
        else if (props.amenity === 'community_centre') category = 'Community Centre';

        if (category === 'Unknown') return acc;

        // Try to get a centroid if it is a polygon (e.g. a park boundary)
        let pointFeature = f;
        if (f.geometry.type !== 'Point' && f.geometry.type !== 'MultiPoint') {
            try {
                const centroid = turf.center(f);
                pointFeature = centroid;
            } catch (e) {
                return acc; // Skip un-parseable geometries
            }
        }

        pointFeature.properties = {
            id: f.id,
            name: props.name || `${category} (Unnamed)`,
            category,
            website: props.website || props['contact:website'] || null,
            sport: props.sport || null
        };

        acc.push(pointFeature);
        return acc;
    }, []);

    return {
        type: "FeatureCollection",
        features: standardizedFeatures
    };
}
