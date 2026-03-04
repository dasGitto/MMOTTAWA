'use client';

import { useState, useRef, useMemo } from 'react';
import useSWR from 'swr';
import Map, { Marker, NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import hubsData from '../data/hubs.json';
import Sidebar from './Sidebar';
import RACentreModal from './RACentreModal';
import GlebeModal from './GlebeModal';

export default function OttawaMap() {
    const mapRef = useRef<any>(null);
    const [activeHub, setActiveHub] = useState<any | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('All');

    // The Anti-Flicker Handshake: SWR handles caching, revalidation, and loading states automatically
    const fetcher = (url: string) => fetch(url).then((res) => res.json());
    const { data: liveEvents, error, isLoading } = useSWR('/api/meetups', fetcher, {
        fallbackData: [], // Fallback ensures `liveEvents` is always an array initially, stopping crashes
        revalidateOnFocus: false
    });

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
        mapRef.current?.flyTo({
            center: [-75.6972, 45.4215],
            zoom: 12,
            duration: 1500,
            essential: true
        });
    };

    // Determine marker color by category
    const getMarkerColor = (category: string) => {
        switch (category) {
            case 'Wellness':
            case 'Outdoor Adventure': return 'bg-emerald-400 border-emerald-200';
            case 'Studio Fitness': return 'bg-purple-500 border-purple-300';
            case 'Team Sports': return 'bg-orange-500 border-orange-300';
            case 'Live Event': return 'bg-red-500 border-red-300';
            default: return 'bg-blue-500 border-blue-300';
        }
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
            >
                <NavigationControl position="bottom-right" />

                {/* Neighborhood Highlights Layer */}
                {!activeHub && filterCategory === 'All' && (
                    <Source id="neighborhoods" type="geojson" data="/neighborhoods.geojson">
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
                                'text-field': ['get', 'name'],
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

                {visibleHubs.map((hub) => (
                    <Marker
                        key={hub.id}
                        longitude={hub.lng}
                        latitude={hub.lat}
                        anchor="bottom"
                        onClick={(e) => {
                            e.originalEvent.stopPropagation();
                            onHubClick(hub);
                        }}
                    >
                        {hub.id === 'billings-ra-centre' ? (
                            <div className="flex flex-col items-center cursor-pointer transition-transform hover:scale-110">
                                <div className={`cursor-pointer rounded-full h-4 w-4 border-2 shadow-[0_0_15px_rgba(255,255,255,0.5)] ${getMarkerColor(hub.category)}`} />
                                <span className="mt-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/20 text-white font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">RA Centre</span>
                            </div>
                        ) : hub.id === 'lansdowne-glebe-dows' ? (
                            <div className="flex flex-col items-center cursor-pointer transition-transform hover:scale-110">
                                <div className={`cursor-pointer rounded-full h-5 w-5 border-2 shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-pulse ${getMarkerColor(hub.category)}`} />
                                <span className="mt-1 bg-emerald-500/20 backdrop-blur-md px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap text-shadow">Glebe & Dow's</span>
                            </div>
                        ) : (
                            <div className={`cursor-pointer rounded-full h-5 w-5 border-2 shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-transform hover:scale-125 ${getMarkerColor(hub.category)}`} />
                        )}
                    </Marker>
                ))}

                {/* SWR Loading Indicator (Optional UI feedback while live data arrives) */}
                {isLoading && (
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white/50 px-3 py-1.5 rounded-full text-xs animate-pulse backdrop-blur-md border border-white/5">
                        Syncing live events...
                    </div>
                )}
            </Map>
        </div>
    );
}
