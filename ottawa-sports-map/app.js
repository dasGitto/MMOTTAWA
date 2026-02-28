// Ottawa Bounding Box for Overpass (South, West, North, East)
const OTTAWA_BBOX = "44.96,-76.35,45.54,-75.24";

// Overpass API Endpoint
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Query Template Function
const buildQuery = () => `
  [out:json][timeout:25];
  (
    // Tennis Courts
    nwr["leisure"="pitch"]["sport"="tennis"](${OTTAWA_BBOX});
    // Basketball Courts
    nwr["leisure"="pitch"]["sport"="basketball"](${OTTAWA_BBOX});
    // Skating Rinks
    nwr["leisure"="ice_rink"](${OTTAWA_BBOX});
    nwr["leisure"="pitch"]["sport"~"skating|ice_skating|ice_stock"](${OTTAWA_BBOX});
  );
  out center;
`;

// Map Initialization
const map = L.map('map', {
    zoomControl: false // Move to bottom right so it doesn't overlap sidebar
}).setView([45.4215, -75.6972], 12);

L.control.zoom({
    position: 'bottomright'
}).addTo(map);

// Add Dark Matter Tile Layer (CartoDB)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// Custom Icons setup
const createIcon = (sport) => {
    let iconClass = '';
    let faClass = '';

    if (sport === 'tennis') {
        iconClass = 'marker-tennis';
        faClass = 'fa-table-tennis-paddle-ball';
    } else if (sport === 'basketball') {
        iconClass = 'marker-basketball';
        faClass = 'fa-basketball';
    } else if (sport === 'rink') {
        iconClass = 'marker-rink';
        faClass = 'fa-snowflake';
    } else if (sport === 'gym') {
        iconClass = 'marker-gym';
        faClass = 'fa-dumbbell';
    }

    return L.divIcon({
        className: 'custom-icon-wrapper',
        html: `<div class="custom-marker ${iconClass}" style="width: 32px; height: 32px;"><i class="fa-solid ${faClass}"></i></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
};

// Layer Groups
const layers = {
    tennis: L.markerClusterGroup({ disableClusteringAtZoom: 14, maxClusterRadius: 40 }),
    basketball: L.markerClusterGroup({ disableClusteringAtZoom: 14, maxClusterRadius: 40 }),
    rink: L.markerClusterGroup({ disableClusteringAtZoom: 14, maxClusterRadius: 40 }),
    gym: L.markerClusterGroup({ disableClusteringAtZoom: 14, maxClusterRadius: 40 })
};

// Add layers to map initially
map.addLayer(layers.tennis);
map.addLayer(layers.basketball);
map.addLayer(layers.rink);
map.addLayer(layers.gym);

// State to keep track
const counts = { tennis: 0, basketball: 0, rink: 0, gym: 0 };
let allFacilities = [];
let currentBounds = null;
let currentSearch = "";
let currentEnvType = "all";
let neighborhoodLayer = L.layerGroup().addTo(map);

const updateMapMarkers = () => {
    layers.tennis.clearLayers();
    layers.basketball.clearLayers();
    layers.rink.clearLayers();
    layers.gym.clearLayers();

    counts.tennis = 0;
    counts.basketball = 0;
    counts.rink = 0;
    counts.gym = 0;

    allFacilities.forEach(facility => {
        let isVisible = true;

        // Bounds filter
        if (currentBounds) {
            const latLng = L.latLng(facility.lat, facility.lon);
            if (!currentBounds.contains(latLng)) {
                isVisible = false;
            }
        }

        // Search filter
        if (isVisible && currentSearch) {
            const matchName = (facility.displayName || '').toLowerCase().includes(currentSearch);
            const matchType = facility.type.replace('_', ' ').toLowerCase().includes(currentSearch);
            if (!matchName && !matchType) {
                isVisible = false;
            }
        }

        // Env Type filter
        if (isVisible && currentEnvType !== 'all') {
            if (currentEnvType === 'indoor' && facility.isOutdoor) isVisible = false;
            if (currentEnvType === 'outdoor' && !facility.isOutdoor) isVisible = false;
        }

        if (isVisible) {
            layers[facility.type].addLayer(facility.marker);
            counts[facility.type]++;
        }
    });

    document.getElementById('stat-tennis').innerText = counts.tennis;
    document.getElementById('stat-basketball').innerText = counts.basketball;
    document.getElementById('stat-rink').innerText = counts.rink;
    document.getElementById('stat-gym').innerText = counts.gym;
};

const neighborhoods = [
    { name: "Kanata", bounds: [[45.27, -75.95], [45.36, -75.87]] },
    { name: "Barrhaven", bounds: [[45.23, -75.78], [45.29, -75.70]] },
    { name: "Nepean", bounds: [[45.30, -75.81], [45.35, -75.72]] },
    { name: "Downtown", bounds: [[45.40, -75.73], [45.44, -75.67]] },
    { name: "Orleans", bounds: [[45.43, -75.56], [45.49, -75.46]] },
    { name: "Gloucester", bounds: [[45.33, -75.66], [45.40, -75.58]] }
];

const drawNeighborhoods = () => {
    neighborhoodLayer.clearLayers();
    neighborhoods.forEach(nh => {
        const bounds = L.latLngBounds(nh.bounds);
        const center = bounds.getCenter();
        const rect = L.rectangle(bounds, { color: "#4facfe", weight: 2, fillOpacity: 0.05, dashArray: "5, 10" });
        neighborhoodLayer.addLayer(rect);

        const btnIcon = L.divIcon({
            className: 'nh-btn-wrapper',
            html: `<button class="nh-btn">${nh.name}</button>`,
            iconSize: [100, 30],
            iconAnchor: [50, 15]
        });

        const btnMarker = L.marker(center, { icon: btnIcon, zIndexOffset: 500 });
        btnMarker.on('click', () => selectNeighborhood(bounds));
        neighborhoodLayer.addLayer(btnMarker);
    });
};

const selectNeighborhood = (bounds) => {
    currentBounds = bounds;
    map.fitBounds(bounds, { padding: [20, 20] });
    updateMapMarkers();
    neighborhoodLayer.clearLayers();
    document.getElementById('reset-view-btn').style.display = 'block';
};

const resetView = () => {
    currentBounds = null;
    map.setView([45.4215, -75.6972], 12);
    updateMapMarkers();
    drawNeighborhoods();
    document.getElementById('reset-view-btn').style.display = 'none';
};

// Setup UI Status
const statusContainer = document.getElementById('status-container');
const statusText = document.getElementById('status-text');

const setStatus = (msg, loading = true) => {
    statusText.innerText = msg;
    if (loading) statusContainer.classList.add('loading');
    else statusContainer.classList.remove('loading');
};

// Fetch Data
const fetchData = async () => {
    setStatus('Fetching live OSM data...', true);

    try {
        const response = await fetch(OVERPASS_URL, {
            method: 'POST',
            body: buildQuery()
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();

        if (!data.elements || data.elements.length === 0) {
            setStatus('No locations found in Ottawa area.', false);
            return;
        }

        setStatus('Processing locations...', true);
        processElements(data.elements);

        setStatus('Data loaded successfully!', false);

        // Hide success message after 3 seconds
        setTimeout(() => {
            statusContainer.style.opacity = '0';
            statusContainer.style.transition = 'opacity 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)';
            setTimeout(() => {
                statusContainer.style.display = 'none';
            }, 600);
        }, 3000);

        // Fetch Local Gyms
        fetchLocalGyms();

    } catch (error) {
        console.error('Error fetching data:', error);
        setStatus('Failed to load data. Please refresh.', false);
        statusContainer.style.background = 'rgba(255,0,0,0.1)';
        statusContainer.style.border = '1px solid rgba(255,0,0,0.3)';
    }
};

const fetchLocalGyms = async () => {
    try {
        const response = await fetch('./data/outdoor_gyms.json');
        if (!response.ok) return;
        const data = await response.json();

        data.forEach(gym => {
            const type = 'gym';
            const displayName = gym.name;
            const isOutdoor = true;

            const marker = L.marker([gym.lat, gym.lon], { icon: createIcon(type) });
            const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${gym.lat},${gym.lon}`;

            const popupContent = `
                <div class="popup-info">
                    <h3>${displayName}</h3>
                    <p style="text-transform: capitalize;"><i class="fa-solid fa-map-pin" style="width: 20px; text-align:center; margin-right:5px; opacity:0.7"></i> Outdoor Gym</p>
                    <div class="popup-badge">Free 24/7</div>
                    <a href="${directionsUrl}" target="_blank" class="popup-link"><i class="fa-solid fa-location-arrow" style="margin-right: 5px;"></i> Get Directions</a>
                </div>
            `;
            marker.bindPopup(popupContent, { offset: [0, -10] });

            allFacilities.push({ type, lat: gym.lat, lon: gym.lon, marker, displayName, isOutdoor });
        });
        updateMapMarkers();
    } catch (e) { console.error('Error fetching local gyms:', e); }
};

const processElements = (elements) => {
    elements.forEach(el => {
        // Determine coordinates depending on element type
        let lat, lon;
        if (el.type === 'node') {
            lat = el.lat;
            lon = el.lon;
        } else if (el.center) {
            lat = el.center.lat;
            lon = el.center.lon;
        } else {
            return; // Skip if no valid coordinates
        }

        const tags = el.tags || {};

        // Determine sport type
        let type = null;
        let displayName = tags.name || 'Unnamed Facility';
        let isOutdoor = tags.indoor !== 'yes';

        if (tags.sport === 'tennis') {
            type = 'tennis';
            if (!tags.name) displayName = 'Tennis Court';
        } else if (tags.sport === 'basketball') {
            type = 'basketball';
            if (!tags.name) displayName = 'Basketball Court';
        } else if (tags.leisure === 'ice_rink' || (tags.sport && tags.sport.includes('skating'))) {
            type = 'rink';
            if (!tags.name) displayName = 'Skating Rink';
            if (tags.building || tags.indoor === 'yes') isOutdoor = false;
        }

        if (type) {
            const marker = L.marker([lat, lon], { icon: createIcon(type) });

            // Build Popup content
            const popupContent = `
                <div class="popup-info">
                    <h3>${displayName}</h3>
                    <p style="text-transform: capitalize;"><i class="fa-solid fa-map-pin" style="width: 20px; text-align:center; margin-right:5px; opacity:0.7"></i> ${type.replace('_', ' ')}</p>
                    ${tags.access ? `<p><i class="fa-solid fa-lock-open" style="width: 20px; text-align:center; margin-right:5px; opacity:0.7"></i> Access: ${tags.access}</p>` : ''}
                    ${tags.lit === 'yes' ? '<p><i class="fa-solid fa-lightbulb" style="width: 20px; text-align:center; margin-right:5px; color:#fbbf24;"></i> Lit at night</p>' : ''}
                </div>
            `;
            marker.bindPopup(popupContent, { offset: [0, -10] });

            allFacilities.push({ type, lat, lon, marker, displayName, isOutdoor });
        }
    });

    updateMapMarkers();
};

// Handle Filters
const handleToggles = () => {
    const filters = ['tennis', 'basketball', 'rink', 'gym'];
    filters.forEach(type => {
        const toggle = document.getElementById(`toggle-${type}`);
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    map.addLayer(layers[type]);
                } else {
                    map.removeLayer(layers[type]);
                }
            });
        }
    });

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            updateMapMarkers();
        });
    }

    const typeBtns = document.querySelectorAll('.type-btn');
    typeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            typeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentEnvType = e.target.dataset.env;
            updateMapMarkers();
        });
    });
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    handleToggles();
    drawNeighborhoods();
    fetchData();
});
