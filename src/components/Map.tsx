'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import Map, { NavigationControl, Source, Layer, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import hubsData from '../data/hubs.json';
import Sidebar from './Sidebar';
import HubModal from './HubModal';
import RAHubModal from './RAHubModal';

export default function OttawaMap() {
    const mapRef = useRef<any>(null);
    const [activeHub, setActiveHub] = useState<any | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('All');
    const [onsGeojson, setOnsGeojson] = useState<any>(null);
    const [activeNeighborhood, setActiveNeighborhood] = useState<any | null>(null);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [cityFacilities, setCityFacilities] = useState<any>(null);
    const [selectedAmenity, setSelectedAmenity] = useState<any | null>(null);
    const [showParks, setShowParks] = useState<boolean>(false);
    const [showFacilities, setShowFacilities] = useState<boolean>(false);
    const [showDanceEvents, setShowDanceEvents] = useState<boolean>(true);
    const [selectedPulseEvent, setSelectedPulseEvent] = useState<any | null>(null);

    // Pre-load full geometry for accurate bounding boxes and fetch City Facilities
    useEffect(() => {
        fetch('/ons_boundaries_gen3.geojson').then(r => r.json()).then(setOnsGeojson).catch(() => { });
        fetch('/city_facilities.geojson').then(r => r.json()).then(setCityFacilities).catch(() => { });
    }, []);

    // The Anti-Flicker Handshake for Meetups
    const fetcher = (url: string) => fetch(url).then((res) => res.json());
    const { data: liveEvents, error, isLoading } = useSWR('/api/meetups', fetcher, {
        fallbackData: [],
        revalidateOnFocus: false
    });

    // The Anti-Flicker Handshake for Daily Pulse Events
    const { data: pulseEvents } = useSWR('/api/pulse-events', fetcher, {
        fallbackData: [],
        refreshInterval: 0,
        revalidateOnFocus: false
    });

    // The Anti-Flicker Handshake for Amenities
    const neighborhoodBbox = useMemo(() => {
        if (!activeNeighborhood) return null;
        try {
            return turf.bbox(activeNeighborhood).join(',');
        } catch (e) {
            return null;
        }
    }, [activeNeighborhood]);

    const { data: rawAmenitiesData, isLoading: isLoadingAmenities } = useSWR(
        neighborhoodBbox ? `/api/amenities?bbox=${neighborhoodBbox}` : null,
        fetcher,
        { fallbackData: { type: 'FeatureCollection', features: [] }, revalidateOnFocus: false }
    );

    // Filter amenities to strictly within the active polygon
    const localAmenities = useMemo(() => {
        if (!activeNeighborhood || !rawAmenitiesData?.features?.length) return [];
        return rawAmenitiesData.features.filter((f: any) => {
            try {
                if (!f.geometry || !f.geometry.coordinates) return false;
                return turf.booleanPointInPolygon(turf.point(f.geometry.coordinates), activeNeighborhood.geometry);
            } catch (e) {
                return false;
            }
        });
    }, [rawAmenitiesData, activeNeighborhood]);

    // Filter hubs
    const visibleHubs = useMemo(() => {
        const allHubs = [...hubsData, ...(liveEvents || [])];
        if (filterCategory === 'All') return allHubs;
        return allHubs.filter(hub => hub.category === filterCategory);
    }, [filterCategory, liveEvents]);

    const onHubClick = (clickedProperties: any) => {
        // 1. Find the source-of-truth object from your JSON to get the catalog object
        const fullHubData = hubsData.find((h: any) => h.id === clickedProperties.id) || clickedProperties;

        setActiveHub(fullHubData);
        mapRef.current?.flyTo({
            center: [fullHubData.lng, fullHubData.lat],
            zoom: fullHubData.zoom || 14,
            duration: 1500,
            essential: true
        });
    };

    const resetView = () => {
        setActiveHub(null);
        setActiveNeighborhood(null);
        setExpandedCategory(null);
        setSelectedAmenity(null);
        setSelectedPulseEvent(null);
        mapRef.current?.flyTo({
            center: [-75.6972, 45.4215],
            zoom: 12,
            duration: 1500,
            essential: true
        });
    };


    return (
        <div className="w-full h-screen relative flex">
            {/* Sidebar Overlay */}
            <Sidebar
                hubs={visibleHubs}
                activeHub={activeHub}
                onHubSelect={onHubClick}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                showParks={showParks}
                setShowParks={setShowParks}
                showFacilities={showFacilities}
                setShowFacilities={setShowFacilities}
                showDanceEvents={showDanceEvents}
                setShowDanceEvents={setShowDanceEvents}
                onReset={resetView}
            />

            {/* Global Hub Modal / Specialized Overrides */}
            {activeHub?.id === 'billings-ra-centre' ? (
                <RAHubModal hub={activeHub} isOpen={!!activeHub} onClose={() => setActiveHub(null)} />
            ) : (
                <HubModal hub={activeHub} isOpen={!!activeHub} onClose={() => setActiveHub(null)} />
            )}

            {/* MapLibre Map */}
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: -75.6972,
                    latitude: 45.4215,
                    zoom: 11
                }}
                mapStyle="/map_style.json"
                style={{ width: '100%', height: '100%' }}
                interactiveLayerIds={activeNeighborhood ? ['event-dots', 'neighborhoods-fill', 'amenity-dots', 'facility-dots', 'pulse-core'] : ['event-dots', 'neighborhoods-fill', 'facility-dots', 'pulse-core']}
                onClick={(e) => {
                    const feature = e.features?.[0];
                    if (feature) {
                        if (feature.layer.id === 'amenity-dots') {
                            if (feature.properties?.category === 'Community Centre') {
                                setSelectedAmenity({
                                    ...feature.properties,
                                    lng: e.lngLat.lng,
                                    lat: e.lngLat.lat
                                });
                            }
                            return; // Do nothing for other amenities to not trigger hub modal
                        } else if (feature.layer.id === 'pulse-core') {
                            setSelectedPulseEvent({
                                ...feature.properties,
                                lng: e.lngLat.lng,
                                lat: e.lngLat.lat
                            });
                            return;
                        } else if (feature.layer.id === 'event-dots' || feature.properties?.id) {
                            onHubClick(feature.properties);
                            setActiveNeighborhood(null);
                        } else if (feature.layer.id === 'neighborhoods-fill' && onsGeojson) {
                            const fullFeature = onsGeojson.features.find((f: any) => f.properties.ONS_Name === feature.properties?.ONS_Name);
                            if (fullFeature) {
                                setActiveNeighborhood(fullFeature);
                                setActiveHub(null);
                                try {
                                    const bbox = turf.bbox(fullFeature) as [number, number, number, number];
                                    mapRef.current?.fitBounds(bbox, { padding: 80, duration: 1500 });
                                } catch (e) { }
                            }
                        }
                    } else {
                        setActiveHub(null);
                        setActiveNeighborhood(null);
                    }
                }}
            >
                <NavigationControl position="bottom-right" />

                {/* Parks Integration Layer */}
                <Source id="parks" type="geojson" data="/data/parks.geojson">
                    <Layer
                        id="parks-fill"
                        type="fill"
                        layout={{ visibility: showParks ? 'visible' : 'none' }}
                        paint={{
                            'fill-color': '#10b981', // Emerald
                            'fill-opacity': 0.4
                        }}
                    />
                </Source>

                {/* Facilities Integration Layer */}
                <Source id="user-facilities" type="geojson" data="/data/facilities.geojson">
                    <Layer
                        id="user-facilities-circle"
                        type="circle"
                        minzoom={11}
                        layout={{ visibility: showFacilities ? 'visible' : 'none' }}
                        paint={{
                            'circle-color': '#3b82f6', // Blue
                            'circle-radius': 5,
                            'circle-stroke-width': 1,
                            'circle-stroke-color': '#ffffff'
                        }}
                    />
                </Source>

                {/* Neighborhood Highlights Layer */}
                {!activeHub && filterCategory === 'All' && (
                    <Source id="neighborhoods" type="geojson" data="/ons_boundaries_gen3.geojson">
                        <Layer
                            id="neighborhoods-fill"
                            type="fill"
                            paint={{
                                'fill-color': [
                                    'match',
                                    ['get', 'ONS_Name'],
                                    'THE GLEBE - DOWS LAKE', '#3b82f6', // Blue
                                    'WESTBORO', '#ec4899', // Pink
                                    'HINTONBURG - MECHANICSVILLE', '#f59e0b', // Amber
                                    'LOWERTOWN', '#10b981', // Emerald
                                    'KANATA LAKES - ARCADIA', '#8b5cf6', // Violet
                                    'BARRHAVEN - OLD BARRHAVEN', '#f43f5e', // Rose
                                    'ORLEANS VILLAGE - CHATEAUNEUF', '#0ea5e9', // Sky
                                    'VANIER SOUTH', '#84cc16', // Lime
                                    'RIVERSIDE PARK', '#06b6d4', // Cyan
                                    'ROCKCLIFFE', '#fbbf24', // Gold
                                    '#10b981' // Default Emerald
                                ],
                                'fill-opacity': 0.08
                            }}
                        />
                        <Layer
                            id="neighborhoods-line"
                            type="line"
                            paint={{
                                'line-color': [
                                    'match',
                                    ['get', 'ONS_Name'],
                                    'THE GLEBE - DOWS LAKE', '#3b82f6', // Blue
                                    'WESTBORO', '#ec4899', // Pink
                                    'HINTONBURG - MECHANICSVILLE', '#f59e0b', // Amber
                                    'LOWERTOWN', '#10b981', // Emerald
                                    'KANATA LAKES - ARCADIA', '#8b5cf6', // Violet
                                    'BARRHAVEN - OLD BARRHAVEN', '#f43f5e', // Rose
                                    'ORLEANS VILLAGE - CHATEAUNEUF', '#0ea5e9', // Sky
                                    'VANIER SOUTH', '#84cc16', // Lime
                                    'RIVERSIDE PARK', '#06b6d4', // Cyan
                                    'ROCKCLIFFE', '#fbbf24', // Gold
                                    '#10b981' // Default Emerald
                                ],
                                'line-width': 4.5,
                                'line-dasharray': [2, 2],
                                'line-opacity': 0.8
                            }}
                        />
                        <Layer
                            id="neighborhoods-label"
                            type="symbol"
                            layout={{
                                'text-field': ['get', 'ONS_Name'],
                                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                                'text-size': 16,
                                'text-transform': 'uppercase',
                                'text-letter-spacing': 0.1,
                                'symbol-placement': 'point'
                            }}
                            paint={{
                                'text-color': '#ffffff',
                                'text-halo-color': 'rgba(0,0,0,0.8)',
                                'text-halo-width': 2
                            }}
                        />
                    </Source>
                )}

                <Source id="live-events" type="geojson" data={{
                    type: 'FeatureCollection',
                    features: visibleHubs.map((hub: any) => ({
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [hub.lng, hub.lat] },
                        properties: { ...hub }
                    }))
                }}>
                    <Layer
                        id="event-dots"
                        type="circle"
                        paint={{
                            'circle-radius': 6,
                            'circle-color': [
                                'match',
                                ['get', 'category'],
                                'Wellness', '#34d399',
                                'Outdoor Adventure', '#34d399',
                                'Studio Fitness', '#a855f7',
                                'Team Sports', '#f97316',
                                'Live Event', '#ef4444',
                                /* default */ '#3b82f6'
                            ],
                            'circle-stroke-width': 2,
                            'circle-stroke-color': '#ffffff'
                        }}
                    />
                </Source>

                {/* Eventbrite Pulse Events GeoJSON Layer */}
                {pulseEvents && pulseEvents.length > 0 && showDanceEvents && (
                    <Source
                        id="daily-pulse-events"
                        type="geojson"
                        data={{
                            type: 'FeatureCollection',
                            features: pulseEvents.map((evt: any) => ({
                                type: 'Feature',
                                geometry: { type: 'Point', coordinates: [evt.lng || -75.7, evt.lat || 45.42] }, // Fallback to central ottawa if unsaved
                                properties: { ...evt }
                            }))
                        }}
                    >
                        {/* The Animated Pulse Background */}
                        <Layer
                            id="pulse-glow"
                            type="circle"
                            paint={{
                                'circle-radius': 15,
                                'circle-color': '#fb7185', // Rose glow (dance-themed)
                                'circle-opacity': 0.4,
                                'circle-blur': 1,
                                'circle-pitch-alignment': 'map'
                            }}
                        />
                        {/* The Core Dot */}
                        <Layer
                            id="pulse-core"
                            type="circle"
                            paint={{
                                'circle-radius': 6,
                                'circle-color': '#fb7185',
                                'circle-stroke-width': 2,
                                'circle-stroke-color': '#ffffff'
                            }}
                        />
                        <Layer
                            id="pulse-icon"
                            type="symbol"
                            layout={{
                                'text-field': [
                                    'match',
                                    ['get', 'category'],
                                    'Dance', '💃',
                                    'Fitness', '🏋️',
                                    '📍'
                                ],
                                'text-size': 20,
                                'text-anchor': 'bottom',
                                'text-offset': [0, -0.3],
                                'symbol-sort-key': 2
                            }}
                            paint={{
                                'text-halo-color': 'rgba(190, 18, 60, 0.8)',
                                'text-halo-width': 2
                            }}
                        />
                        <Layer
                            id="pulse-labels"
                            type="symbol"
                            layout={{
                                'text-field': ['get', 'title'],
                                'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                                'text-size': 11,
                                'text-offset': [0, 1.2],
                                'text-anchor': 'top',
                                'symbol-sort-key': 1
                            }}
                            paint={{
                                'text-color': '#ffffff',
                                'text-halo-color': 'rgba(190, 18, 60, 0.8)', // Dark Rose halo
                                'text-halo-width': 1
                            }}
                        />
                    </Source>
                )}

                {/* Amenities GeoJSON Layer */}
                {activeNeighborhood && localAmenities.length > 0 && (
                    <Source id="amenities" type="geojson" data={{ type: 'FeatureCollection', features: localAmenities }}>
                        <Layer
                            id="amenity-dots"
                            type="circle"
                            paint={{
                                'circle-radius': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    10, // Highlighted radius
                                    5   // Default radius
                                ],
                                'circle-color': [
                                    'match',
                                    ['get', 'category'],
                                    'Park', 'transparent',
                                    'Basketball', '#f97316',
                                    'Tennis', '#eab308',
                                    'Community Centre', '#a855f7',
                                    'Gym / Fitness', 'transparent', // Handled by symbol layer
                                    'Martial Arts', 'transparent',
                                    'Yoga', 'transparent',
                                    'Dance', 'transparent',
                                    'Crossfit', 'transparent',
                                    '#3b82f6'
                                ],
                                'circle-stroke-width': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    3,
                                    1.5
                                ],
                                'circle-stroke-color': '#ffffff'
                            }}
                        />
                        <Layer
                            id="amenity-labels"
                            type="symbol"
                            layout={{
                                'text-field': ['get', 'name'],
                                'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                                'text-size': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    16, // Dramatically larger highlighted size 
                                    10  // Default size
                                ],
                                'text-offset': [0, 1.2],
                                'text-anchor': 'top',
                                'symbol-sort-key': 2
                            }}
                            paint={{
                                'text-color': '#ffffff',
                                'text-halo-color': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    'rgba(5, 27, 58, 0.9)', // Deep Blue Background Outline
                                    'rgba(0,0,0,0.8)'       // Default black halo
                                ],
                                'text-halo-width': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    4, // Thicker background outline when highlighted
                                    1
                                ]
                            }}
                        />

                        {/* Separate Symbol Layer exclusively for Parks */}
                        <Layer
                            id="amenity-parks-icon"
                            type="symbol"
                            filter={['==', ['get', 'category'], 'Park']}
                            layout={{
                                'text-field': '🌳',
                                'text-size': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    24, // Dramatically larger highlighted size 
                                    14  // Default size
                                ],
                                'text-anchor': 'bottom',
                                'symbol-sort-key': 3
                            }}
                            paint={{
                                'text-halo-color': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    'rgba(16, 185, 129, 0.4)', // Emerald Halo when highlighted
                                    'rgba(0,0,0,0)'       // No halo default
                                ],
                                'text-halo-width': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    4,
                                    0
                                ]
                            }}
                        />

                        {/* Separate Symbol Layer exclusively for Gyms */}
                        <Layer
                            id="amenity-gyms-icon"
                            type="symbol"
                            filter={['==', ['get', 'category'], 'Gym / Fitness']}
                            layout={{
                                'text-field': '🏋️',
                                'text-size': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    24, // Dramatically larger highlighted size 
                                    14  // Default size
                                ],
                                'text-anchor': 'bottom',
                                'symbol-sort-key': 3
                            }}
                            paint={{
                                'text-halo-color': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    'rgba(236, 72, 153, 0.4)', // Pink Halo when highlighted
                                    'rgba(0,0,0,0)'       // No halo default
                                ],
                                'text-halo-width': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    4,
                                    0
                                ]
                            }}
                        />

                        {/* Separate Symbol Layer exclusively for Martial Arts */}
                        <Layer
                            id="amenity-martial_arts-icon"
                            type="symbol"
                            filter={['==', ['get', 'category'], 'Martial Arts']}
                            layout={{
                                'text-field': '🥋',
                                'text-size': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    24,
                                    14
                                ],
                                'text-anchor': 'bottom',
                                'symbol-sort-key': 3
                            }}
                            paint={{
                                'text-halo-color': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    'rgba(244, 63, 94, 0.4)', // Rose Halo when highlighted
                                    'rgba(0,0,0,0)'       // No halo default
                                ],
                                'text-halo-width': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    4,
                                    0
                                ]
                            }}
                        />

                        {/* Separate Symbol Layer exclusively for Yoga */}
                        <Layer
                            id="amenity-yoga-icon"
                            type="symbol"
                            filter={['==', ['get', 'category'], 'Yoga']}
                            layout={{
                                'text-field': '🧘',
                                'text-size': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    24,
                                    14
                                ],
                                'text-anchor': 'bottom',
                                'symbol-sort-key': 3
                            }}
                            paint={{
                                'text-halo-color': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    'rgba(168, 85, 247, 0.4)', // Purple Halo when highlighted
                                    'rgba(0,0,0,0)'       // No halo default
                                ],
                                'text-halo-width': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    4,
                                    0
                                ]
                            }}
                        />

                        {/* Separate Symbol Layer exclusively for Crossfit */}
                        <Layer
                            id="amenity-crossfit-icon"
                            type="symbol"
                            filter={['==', ['get', 'category'], 'Crossfit']}
                            layout={{
                                'text-field': ' टायर', // fallback emoji or text
                                'text-size': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    24,
                                    14
                                ],
                                'text-anchor': 'bottom',
                                'symbol-sort-key': 3
                            }}
                            paint={{
                                'text-halo-color': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    'rgba(249, 115, 22, 0.4)', // Orange Halo when highlighted
                                    'rgba(0,0,0,0)'       // No halo default
                                ],
                                'text-halo-width': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    4,
                                    0
                                ]
                            }}
                        />

                        {/* Separate Symbol Layer exclusively for Dance */}
                        <Layer
                            id="amenity-dance-icon"
                            type="symbol"
                            filter={['==', ['get', 'category'], 'Dance']}
                            layout={{
                                'text-field': '💃',
                                'text-size': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    28,
                                    16
                                ],
                                'text-anchor': 'bottom',
                                'symbol-sort-key': 3
                            }}
                            paint={{
                                'text-halo-color': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    'rgba(251, 113, 133, 0.4)', // Rose/Pink Halo 
                                    'rgba(0,0,0,0)'       // No halo default
                                ],
                                'text-halo-width': [
                                    'case',
                                    ['==', ['get', 'category'], expandedCategory || 'none'],
                                    4,
                                    0
                                ]
                            }}
                        />
                    </Source>
                )}

                {/* City Facilities GeoJSON Layer */}
                {cityFacilities && filterCategory === 'All' && (
                    <Source id="city-facilities" type="geojson" data={cityFacilities}>
                        <Layer
                            id="facility-dots"
                            type="circle"
                            paint={{
                                'circle-radius': 4.5,
                                'circle-color': '#0ea5e9', // Sky Blue for City Facilities
                                'circle-stroke-width': 1.5,
                                'circle-stroke-color': '#ffffff'
                            }}
                        />
                        <Layer
                            id="facility-labels"
                            type="symbol"
                            layout={{
                                'text-field': ['get', 'name'],
                                'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                                'text-size': 11,
                                'text-offset': [0, 1.2],
                                'text-anchor': 'top',
                                'symbol-sort-key': 1
                            }}
                            paint={{
                                'text-color': '#ffffff',
                                'text-halo-color': 'rgba(0,0,0,0.8)',
                                'text-halo-width': 1
                            }}
                        />
                    </Source>
                )}

                {/* Community Centre Popup */}
                {selectedAmenity && (
                    <Popup
                        longitude={selectedAmenity.lng}
                        latitude={selectedAmenity.lat}
                        anchor="bottom"
                        onClose={() => setSelectedAmenity(null)}
                        closeOnClick={false}
                        className="community-popup"
                        maxWidth="250px"
                    >
                        <div className="p-2 text-black">
                            <h3 className="font-bold text-sm mb-1">{selectedAmenity.name}</h3>
                            <p className="text-xs text-gray-600 mb-2">{selectedAmenity.category}</p>
                            {selectedAmenity.sport && (
                                <p className="text-xs mb-1"><strong>Sports:</strong> {selectedAmenity.sport.replace(/_/g, ' ')}</p>
                            )}
                            {selectedAmenity.website && (
                                <a
                                    href={selectedAmenity.website.startsWith('http') ? selectedAmenity.website : `https://${selectedAmenity.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:text-blue-700 underline flex items-center gap-1 mt-2"
                                    onClick={(e: any) => e.originalEvent ? e.originalEvent.stopPropagation() : e.stopPropagation()}
                                >
                                    Official Site 🔗
                                </a>
                            )}
                        </div>
                    </Popup>
                )}

                {/* Eventbrite Pulse Event Popup */}
                {selectedPulseEvent && (
                    <Popup
                        longitude={selectedPulseEvent.lng}
                        latitude={selectedPulseEvent.lat}
                        anchor="bottom"
                        onClose={() => setSelectedPulseEvent(null)}
                        closeOnClick={false}
                        className="pulse-popup"
                        maxWidth="250px"
                    >
                        <div className="p-2 text-black">
                            <h3 className="font-bold text-sm mb-1">{selectedPulseEvent.title}</h3>
                            <p className="text-xs text-rose-600 font-bold mb-2">Eventbrite {selectedPulseEvent.category} Event</p>
                            {selectedPulseEvent.event_date && (
                                <p className="text-xs mb-1"><strong>Date:</strong> {new Date(selectedPulseEvent.event_date).toLocaleDateString()}</p>
                            )}
                            {selectedPulseEvent.location_name && (
                                <p className="text-xs mb-1"><strong>Venue:</strong> {selectedPulseEvent.location_name}</p>
                            )}
                            {selectedPulseEvent.event_url && (
                                <a
                                    href={selectedPulseEvent.event_url.startsWith('http') ? selectedPulseEvent.event_url : `https://${selectedPulseEvent.event_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-rose-500 hover:text-rose-700 underline flex items-center gap-1 mt-2"
                                    onClick={(e: any) => e.originalEvent ? e.originalEvent.stopPropagation() : e.stopPropagation()}
                                >
                                    Eventbrite Official Site 🔗
                                </a>
                            )}
                        </div>
                    </Popup>
                )}

                {/* SWR Loading Indicator */}
                {(isLoading || isLoadingAmenities) && (
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white/50 px-3 py-1.5 rounded-full text-xs animate-pulse backdrop-blur-md border border-white/5">
                        {isLoadingAmenities ? "Scanning OpenStreetMap..." : "Syncing live events..."}
                    </div>
                )}
            </Map>

            {/* Neighborhood Amenities Overlay */}
            {activeNeighborhood && (
                <div className="absolute top-6 right-6 w-80 bg-black/60 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl text-white z-10 transition-all pointer-events-auto max-h-[80vh] flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase tracking-widest">{activeNeighborhood.properties.ONS_Name}</h2>
                        <button onClick={() => setActiveNeighborhood(null)} className="text-white/50 hover:text-white">&times;</button>
                    </div>
                    {isLoadingAmenities ? (
                        <div className="text-white/50 text-sm animate-pulse">Scanning OpenStreetMap for local amenities...</div>
                    ) : (
                        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            {['Basketball', 'Tennis', 'Gym / Fitness', 'Community Centre', 'Park'].map(cat => {
                                const items = localAmenities.filter((a: any) => a.properties.category === cat);
                                if (items.length === 0) return null;
                                const isExpanded = expandedCategory === cat;
                                return (
                                    <div key={cat} className="border border-white/10 rounded-lg overflow-hidden transition-all">
                                        <button
                                            onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                                            className={`w-full flex items-center justify-between p-3 text-left transition-colors ${isExpanded ? 'bg-white/10' : 'hover:bg-white/5 bg-black/20'}`}
                                        >
                                            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{cat} ({items.length})</h3>
                                            <span className="text-white/50 text-lg leading-none">{isExpanded ? '−' : '+'}</span>
                                        </button>
                                        <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[300px] opacity-100 p-3' : 'max-h-0 opacity-0 px-3'}`}>
                                            <ul className="space-y-2 overflow-y-auto custom-scrollbar pr-1 max-h-[250px]">
                                                {items.map((item: any, i: number) => (
                                                    <li key={i} className="text-sm truncate text-white/90 pb-1 border-b border-white/10 last:border-0">• {item.properties.name}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )
                            })}
                            {localAmenities.length === 0 && <div className="text-white/50 italic text-sm">No mapped amenities found.</div>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
