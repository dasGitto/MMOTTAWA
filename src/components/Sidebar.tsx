'use client';

import { useState } from 'react';
import { Search, MapPin, X, Dumbbell, Users, Leaf, Calendar, Activity, Map } from 'lucide-react';

interface SidebarProps {
    hubs: any[];
    activeHub: any;
    onHubSelect: (hub: any) => void;
    filterCategory: string;
    setFilterCategory: (category: string) => void;
    showParks: boolean;
    setShowParks: (val: boolean) => void;
    showFacilities: boolean;
    setShowFacilities: (val: boolean) => void;
    showDanceEvents: boolean;
    setShowDanceEvents: (val: boolean) => void;
    onReset: () => void;
}

const CATEGORIES = [
    { name: 'All', icon: <MapPin size={16} /> },
    { name: 'Outdoor Adventure', icon: <Leaf size={16} /> },
    { name: 'Studio Fitness', icon: <Dumbbell size={16} /> },
    { name: 'Team Sports', icon: <Users size={16} /> },
    { name: 'Live Event', icon: <Calendar size={16} /> }
];

const TEAM_SPORTS = [
    { name: 'Soccer', icon: '⚽' },
    { name: 'Basketball', icon: '🏀' },
    { name: 'Volleyball', icon: '🏐' },
    { name: 'Badminton', icon: '🏸' },
    { name: 'Tennis', icon: '🎾' },
    { name: 'Pickleball', icon: '🏓' },
    { name: 'Hockey/Floorball', icon: '🏒' },
    { name: 'Rugby/Football', icon: '🏈' },
    { name: 'Ultimate Frisbee', icon: '🥏' },
    { name: 'Baseball/Softball', icon: '⚾' }
];

export default function Sidebar({ hubs, activeHub, onHubSelect, filterCategory, setFilterCategory, showParks, setShowParks, showFacilities, setShowFacilities, showDanceEvents, setShowDanceEvents, onReset }: SidebarProps) {

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'Outdoor Adventure': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
            case 'Studio Fitness': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
            case 'Team Sports': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
            case 'Live Event': return 'text-red-400 bg-red-400/10 border-red-400/30';
            case 'All': return 'text-white bg-white/10 border-white/30';
            default: return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
        }
    };

    return (
        <div className="absolute top-4 left-4 z-10 w-80 glass rounded-2xl p-5 flex flex-col gap-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    Movement Hubs
                </h1>
                <p className="text-sm text-neutral-400 mt-1">Ottawa&apos;s cultural & active epicentres.</p>
            </div>

            {/* Filters (Main view when no hub is selected) */}
            <div className={`flex flex-col gap-3 transition-all duration-300 overflow-hidden ${!activeHub ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 hidden'}`}>
                <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-2">Explore Activities</h2>
                <div className="flex flex-col gap-3">
                    {CATEGORIES.map(cat => (
                        <div key={cat.name} className="flex flex-col gap-2">
                            <button
                                onClick={() => {
                                    setFilterCategory(cat.name);
                                    onReset(); // Ensures the map flyTo default position when a category is clicked
                                }}
                                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 border w-full text-left group
                    ${filterCategory === cat.name
                                        ? 'bg-white/10 text-white border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                        : 'bg-black/20 text-neutral-400 border-white/5 hover:bg-white/5 hover:text-neutral-200'
                                    }
                  `}
                            >
                                <div className={`p-2.5 rounded-lg flex items-center justify-center transition-colors ${filterCategory === cat.name ? getCategoryColor(cat.name) : 'bg-white/5 text-neutral-500 group-hover:text-neutral-300'}`}>
                                    {cat.icon}
                                </div>
                                <span className="font-semibold text-[15px]">{cat.name}</span>
                            </button>

                            {/* Team Sports Expanded View */}
                            {cat.name === 'Team Sports' && filterCategory === 'Team Sports' && (
                                <div className="grid grid-cols-2 gap-2 mt-1 px-1 animate-in slide-in-from-top-2 fade-in duration-300 ease-out">
                                    {TEAM_SPORTS.map(sport => (
                                        <button 
                                            key={sport.name}
                                            className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/10 bg-black/40 hover:bg-orange-500/20 hover:border-orange-500/40 text-neutral-300 hover:text-white transition-all duration-300 group"
                                        >
                                            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{sport.icon}</span>
                                            <span className="text-[11px] font-medium text-center">{sport.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Local Layers Toggle */}
            <div className={`flex flex-col gap-3 transition-all duration-300 overflow-hidden ${!activeHub ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0 hidden'}`}>
                <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-2 mt-4">Local Data Layers</h2>

                <button
                    onClick={() => setShowParks(!showParks)}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 border w-full text-left
                        ${showParks
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-black/20 text-neutral-400 border-white/5 hover:bg-white/5'}`}
                >
                    <div className="flex items-center gap-3">
                        <Leaf size={16} />
                        <span className="font-semibold text-sm">Show Parks</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full transition-colors ${showParks ? 'bg-emerald-500' : 'bg-neutral-600'} relative`}>
                        <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${showParks ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                    </div>
                </button>

                <button
                    onClick={() => setShowFacilities(!showFacilities)}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 border w-full text-left
                        ${showFacilities
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-black/20 text-neutral-400 border-white/5 hover:bg-white/5'}`}
                >
                    <div className="flex items-center gap-3">
                        <MapPin size={16} />
                        <span className="font-semibold text-sm">Show Facilities</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full transition-colors ${showFacilities ? 'bg-blue-500' : 'bg-neutral-600'} relative`}>
                        <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${showFacilities ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                    </div>
                </button>

                <button
                    onClick={() => setShowDanceEvents(!showDanceEvents)}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 border w-full text-left
                        ${showDanceEvents
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-black/20 text-neutral-400 border-white/5 hover:bg-white/5'}`}
                >
                    <div className="flex items-center gap-3">
                        <Activity size={16} />
                        <span className="font-semibold text-sm">Show Movement Pulse</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full transition-colors ${showDanceEvents ? 'bg-rose-500' : 'bg-neutral-600'} relative`}>
                        <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${showDanceEvents ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                    </div>
                </button>
            </div>

            {/* Selected Hub Profile Card (Excluded for special modal hubs) */}
            <div className={`transition-all duration-500 overflow-hidden ${activeHub && !['billings-ra-centre', 'lansdowne-glebe-dows'].includes(activeHub.id) ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {activeHub && !['billings-ra-centre', 'lansdowne-glebe-dows'].includes(activeHub.id) && (
                    <div className="bg-black/40 border border-white/10 rounded-xl p-4 relative">
                        <button onClick={onReset} className="absolute top-3 right-3 text-neutral-400 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border mb-3 ${getCategoryColor(activeHub.category)}`}>
                            <MapPin size={12} />
                            {activeHub.category}
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">{activeHub.name}</h2>
                        <p className="text-sm text-emerald-400 font-medium mb-3">{activeHub.type}</p>
                        <div className="h-[1px] w-full bg-gradient-to-r from-white/20 to-transparent mb-3" />
                        <p className="text-sm text-neutral-300 leading-relaxed">
                            {activeHub.description}
                        </p>

                        <button className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg py-2 text-sm font-semibold transition-colors">
                            Explore Events
                        </button>
                    </div>
                )}
            </div>


        </div>
    );
}
