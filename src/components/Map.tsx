'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import Map, { NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import hubsData from '../data/hubs.json';
import Sidebar from './Sidebar';
import RACentreModal from './RACentreModal';
import GlebeModal from './GlebeModal';

export default function OttawaMap() {
    const mapRef = useRef<any>(null);
    const [activeHub, setActiveHub] = useState<any | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('All');
    const [onsGeojson, setOnsGeojson] = useState<any>(null);
    const [activeNeighborhood, setActiveNeighborhood] = useState<any | null>(null);
    const [cityFacilities, setCityFacilities] = useState<any>(null);

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

    const onHubClick = (hub: any) => {
        setActiveHub(hub);
        mapRef.current?.flyTo({
            center: [hub.lng, hub.lat],
            zoom: hub.zoom || 14,
            duration: 1500,
            essential: true
        });
    };

    const resetView = () => {
        setActiveHub(null);
        setActiveNeighborhood(null);
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
                onReset={resetView}
            />

            {/* Special Feature Modals */}
            <RACentreModal hub={activeHub} onClose={() => setActiveHub(null)} />
            <GlebeModal hub={activeHub} onClose={() => setActiveHub(null)} />

            {/* MapLibre Map */}
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: -75.6972,
                    latitude: 45.4215,
                    zoom: 11
                }}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                style={{ width: '100%', height: '100%' }}
                interactiveLayerIds={activeNeighborhood ? ['event-dots', 'neighborhoods-fill', 'amenity-dots', 'facility-dots'] : ['event-dots', 'neighborhoods-fill', 'facility-dots']}
                onClick={(e) => {
                    const feature = e.features?.[0];
                    if (feature) {
                        if (feature.layer.id === 'event-dots' || feature.properties?.id) {
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

                {/* Neighborhood Highlights Layer */}
                {!activeHub && filterCategory === 'All' && (
                    <Source id="neighborhoods" type="geojson" data="/ons_boundaries_gen3.geojson">
                        <Layer
                            id="neighborhoods-fill"
                            type="fill"
                            paint={{
                                'fill-color': '#10b981',
                                'fill-opacity': 0.03
                            }}
                        />
                        <Layer
                            id="neighborhoods-line"
                            type="line"
                            paint={{
                                'line-color': '#10b981',
                                'line-width': 1.5,
                                'line-dasharray': [2, 2],
                                'line-opacity': 0.6
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

                {/* Amenities GeoJSON Layer */}
                {activeNeighborhood && localAmenities.length > 0 && (
                    <Source id="amenities" type="geojson" data={{ type: 'FeatureCollection', features: localAmenities }}>
                        <Layer
                            id="amenity-dots"
                            type="circle"
                            paint={{
                                'circle-radius': 5,
                                'circle-color': [
                                    'match',
                                    ['get', 'category'],
                                    'Park', '#10b981',
                                    'Basketball', '#f97316',
                                    'Tennis', '#eab308',
                                    'Gym / Fitness', '#ec4899',
                                    '#3b82f6'
                                ],
                                'circle-stroke-width': 1.5,
                                'circle-stroke-color': '#ffffff'
                            }}
                        />
                        <Layer
                            id="amenity-labels"
                            type="symbol"
                            layout={{
                                'text-field': ['get', 'name'],
                                'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                                'text-size': 10,
                                'text-offset': [0, 1],
                                'text-anchor': 'top',
                                'symbol-sort-key': 2
                            }}
                            paint={{
                                'text-color': '#ffffff',
                                'text-halo-color': 'rgba(0,0,0,0.8)',
                                'text-halo-width': 1
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
                            {['Basketball', 'Tennis', 'Gym / Fitness', 'Park'].map(cat => {
                                const items = localAmenities.filter((a: any) => a.properties.category === cat);
                                if (items.length === 0) return null;
                                return (
                                    <div key={cat}>
                                        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">{cat} ({items.length})</h3>
                                        <ul className="space-y-1">
                                            {items.map((item: any, i: number) => (
                                                <li key={i} className="text-sm truncate text-white/90">• {item.properties.name}</li>
                                            ))}
                                        </ul>
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
