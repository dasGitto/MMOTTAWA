'use client';

import Link from 'next/link';
import { Map as MapIcon, Leaf, Dumbbell, Users, Calendar, MapPin, Search, Music, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import danceClasses from '@/data/ottawa_dance_classes.json';

const CATEGORIES = [
  { name: 'Dance', icon: <Music size={48} />, color: 'pink', description: 'Salsa, Hip-hop & social dance' },
  { name: 'Fitness', icon: <Dumbbell size={48} />, color: 'purple', description: 'Yoga, spin & boutique classes' },
  { name: 'Sports', icon: <Users size={48} />, color: 'orange', description: 'Leagues, drop-ins & courts' },
  { name: 'Movement', icon: <Leaf size={48} />, color: 'emerald', description: 'Trails, parks & water sports' },
  { name: 'Events', icon: <Calendar size={48} />, color: 'red', description: 'Community gatherings & meets' }
];

const DANCE_STYLES = [
    { name: 'Salsa/Latin', icon: '💃' },
    { name: 'Hip Hop', icon: '👟' },
    { name: 'Ballet/Contemporary', icon: '🩰' },
    { name: 'Breakdance', icon: '🤸' },
    { name: 'Ballroom', icon: '🕴️' }
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

// Mocked data mapping sports to hubs and court counts
const SPORT_LOCATIONS: Record<string, { id: string, name: string, count: number }[]> = {
    'Soccer': [
        { id: 'lansdowne-glebe-dows', name: "The Glebe & Lansdowne", count: 2 },
        { id: 'barrhaven-central', name: 'Barrhaven Central', count: 6 },
        { id: 'billings-ra-centre', name: 'RA Centre', count: 3 }
    ],
    'Basketball': [
        { id: 'hintonburg-cc', name: 'Hintonburg CC', count: 2 },
        { id: 'nepean-sportsplex', name: 'Nepean Sportsplex', count: 4 },
        { id: 'st-laurent-vanier', name: 'St. Laurent / Vanier', count: 3 }
    ],
    'Volleyball': [
        { id: 'orleans-shenkman', name: 'Petrie Island Beach', count: 8 },
        { id: 'billings-ra-centre', name: 'RA Centre (Beach)', count: 4 },
        { id: 'hintonburg-cc', name: 'Hintonburg CC (Indoor)', count: 1 }
    ],
    'Badminton': [
        { id: 'billings-ra-centre', name: 'RA Centre', count: 12 },
        { id: 'nepean-sportsplex', name: 'Nepean Sportsplex', count: 6 },
        { id: 'hintonburg-cc', name: 'Hintonburg CC', count: 3 }
    ],
    'Tennis': [
        { id: 'barrhaven-central', name: 'Barrhaven Central', count: 4 },
        { id: 'lansdowne-glebe-dows', name: 'The Glebe', count: 2 }
    ],
    'Pickleball': [
        { id: 'billings-ra-centre', name: 'RA Centre', count: 8 },
        { id: 'hintonburg-cc', name: 'Hintonburg CC', count: 4 }
    ],
    'Hockey/Floorball': [
        { id: 'nepean-sportsplex', name: 'Nepean Sportsplex', count: 3 },
        { id: 'hintonburg-cc', name: 'Hintonburg CC (Floorball)', count: 1 }
    ],
    'Rugby/Football': [
        { id: 'lansdowne-glebe-dows', name: 'TD Place', count: 1 },
        { id: 'billings-ra-centre', name: 'RA Centre', count: 2 },
        { id: 'nepean-sportsplex', name: 'Minto Turf Field', count: 1}
    ],
    'Ultimate Frisbee': [
        { id: 'billings-ra-centre', name: 'RA Centre', count: 4 },
        { id: 'barrhaven-central', name: 'Barrhaven Parks', count: 3 }
    ],
    'Baseball/Softball': [
        { id: 'billings-ra-centre', name: 'RA Centre (Slo-Pitch)', count: 4 },
        { id: 'nepean-sportsplex', name: 'Nepean Diamonds', count: 2 }
    ],
    'Salsa/Latin': [
        { id: 'nepean', name: 'Nepean Sportsplex', count: 3 },
        { id: 'hintonburg-cc', name: 'Hintonburg Cmty Centre', count: 2 }
    ],
    'Hip Hop': [
        { id: 'orleans-shenkman', name: 'Shenkman Arts Centre', count: 4 },
        { id: 'rideauview', name: 'Rideauview Cmty Centre', count: 1 }
    ],
    'Ballet/Contemporary': [
        { id: 'walter-baker', name: 'Walter Baker Sports Centre', count: 1 },
        { id: 'greenboro', name: 'Diane Deans Greenboro Cmty Centre', count: 1 }
    ],
    'Breakdance': [
        { id: 'kanata', name: 'Old Town Hall (Kanata)', count: 3 },
        { id: 'mcnabb', name: 'McNabb Rec Centre', count: 1 }
    ],
    'Ballroom': [
        { id: 'st-laurent-vanier', name: 'St-Laurent Cplx', count: 2 },
        { id: 'bob-macquarrie', name: 'Bob MacQuarrie Rec Cplx - Orléans', count: 2 }
    ]
};

export default function Home() {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [activeSport, setActiveSport] = useState<string | null>(null);
    const [activeLocation, setActiveLocation] = useState<{id: string, name: string} | null>(null);

    const getColors = (color: string) => {
        switch(color) {
            case 'emerald': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30 hover:border-emerald-400/50 hover:bg-emerald-400/20';
            case 'purple': return 'text-purple-400 bg-purple-400/10 border-purple-400/30 hover:border-purple-400/50 hover:bg-purple-400/20';
            case 'orange': return 'text-orange-400 bg-orange-400/10 border-orange-400/30 hover:border-orange-400/50 hover:bg-orange-400/20';
            case 'pink': return 'text-pink-400 bg-pink-400/10 border-pink-400/30 hover:border-pink-400/50 hover:bg-pink-400/20';
            case 'red': return 'text-red-400 bg-red-400/10 border-red-400/30 hover:border-red-400/50 hover:bg-red-400/20';
            default: return 'text-blue-400 bg-blue-400/10 border-blue-400/30 hover:border-blue-400/50 hover:bg-blue-400/20';
        }
    };

    return (
        <main className="min-h-screen bg-black text-white selection:bg-emerald-500/30 relative overflow-hidden flex flex-col items-center">
            
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black opacity-80" />
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Top Navigation Bar */}
            <nav className="relative z-10 w-full p-6 flex justify-between items-center max-w-7xl mx-auto mb-8">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-emerald-400 to-cyan-400 p-2 rounded-xl text-black">
                        <MapPin size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Move More Ottawa</h1>
                        <p className="text-xs text-neutral-400">Ottawa's cultural & active epicentres</p>
                    </div>
                </div>

                <Link
                    href="/map"
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 rounded-full font-medium transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.05)] text-sm"
                >
                    <MapIcon size={18} className="text-emerald-400" />
                    Open Map
                </Link>
            </nav>

            <div className="relative z-10 max-w-7xl w-full mx-auto px-6 flex flex-col items-center">
                
                {/* Search Bar Placeholder */}
                <div className={`w-full max-w-2xl transition-all duration-500 overflow-hidden ${!activeCategory ? 'mb-12 max-h-32 opacity-100' : 'max-h-0 opacity-0 m-0'}`}>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                            <Search size={20} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search for sports, facilities, or hubs..." 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-lg backdrop-blur-sm"
                        />
                    </div>
                </div>

                {/* Main Titles and Back Button */}
                <div className="flex flex-col items-center w-full mb-8">
                    {activeCategory && (
                        <button 
                            onClick={() => {
                                if (activeLocation) setActiveLocation(null);
                                else if (activeSport) setActiveSport(null);
                                else setActiveCategory(null);
                            }}
                            className="mb-8 flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 px-5 py-3 rounded-full transition-all self-start ml-2 md:ml-0 group"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-semibold text-lg">Back to {activeLocation ? activeSport : (activeSport ? activeCategory : 'Categories')}</span>
                        </button>
                    )}
                    
                    {!activeCategory && (
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-center bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
                            What moves you today?
                        </h2>
                    )}
                </div>

                {/* LEVEL 0: Main Categories Grid */}
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 w-full transition-all duration-500 ease-in-out ${!activeCategory ? 'opacity-100 max-h-[2000px] translate-y-0' : 'opacity-0 max-h-0 -translate-y-8 overflow-hidden'}`}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.name}
                            onClick={() => setActiveCategory(cat.name)}
                            className={`flex flex-col items-center justify-center p-8 md:p-12 rounded-[2rem] transition-all duration-300 border bg-white/5 border-white/10 text-neutral-300 hover:text-white group
                                ${getColors(cat.color)} hover:scale-105 hover:-translate-y-2 shadow-xl hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]
                            `}
                        >
                            <div className={`p-6 rounded-3xl mb-6 transition-colors bg-white/5 group-hover:bg-white/10`}>
                                {cat.icon}
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold mb-3">{cat.name}</h3>
                            <p className="text-base text-center text-neutral-400 group-hover:text-neutral-300 leading-tight">{cat.description}</p>
                        </button>
                    ))}
                </div>

                {/* LEVEL 1 & 2: Category Details Container */}
                <div className={`w-full transition-all duration-500 ease-in-out flex flex-col items-center ${activeCategory ? 'opacity-100 translate-y-0 max-h-[5000px]' : 'opacity-0 -translate-y-8 max-h-0 overflow-hidden'}`}>
                    
                    {/* --- SPORTS VIEW --- */}
                    {activeCategory === 'Sports' && (
                         <div className="w-full max-w-5xl">
                             <div className="flex items-center gap-4 mb-8 border-b border-orange-500/20 pb-6">
                                  <Users size={40} className="text-orange-400" />
                                  <h3 className="text-4xl font-bold text-orange-400">Sports</h3>
                             </div>

                             {/* Level 1: Sub-Grid */}
                             <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 transition-all duration-500 overflow-hidden ${!activeSport ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0'}`}>
                                 {TEAM_SPORTS.map((sport, idx) => (
                                     <button 
                                         key={sport.name}
                                         onClick={() => setActiveSport(sport.name)}
                                         className="flex flex-col items-center justify-center p-8 rounded-2xl border border-white/5 bg-black/40 hover:bg-orange-500/10 hover:border-orange-500/30 text-neutral-300 hover:text-white transition-all duration-300 group shadow-lg hover:-translate-y-1 hover:scale-105"
                                         style={{ animationDelay: `${idx * 50}ms` }}
                                     >
                                         <span className="text-5xl mb-4 transition-transform block group-hover:scale-110 group-hover:rotate-6">{sport.icon}</span>
                                         <span className="text-lg font-semibold text-center leading-tight">{sport.name}</span>
                                     </button>
                                 ))}
                             </div>

                             {/* Level 2: Locations List */}
                             <div className={`transition-all duration-500 overflow-hidden ${activeSport && !activeLocation ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0'}`}>
                                 {activeSport && SPORT_LOCATIONS[activeSport] && (
                                     <div className="w-full bg-orange-500/5 border border-orange-500/20 rounded-3xl p-8 backdrop-blur-md">
                                        <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                            <span className="text-4xl">{TEAM_SPORTS.find(s => s.name === activeSport)?.icon}</span>
                                            Find {activeSport} in these neighborhoods:
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {SPORT_LOCATIONS[activeSport].map(loc => (
                                                <button
                                                    key={loc.id}
                                                    onClick={() => setActiveLocation(loc)}
                                                    className="w-full text-left flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-orange-500/40 transition-all hover:-translate-y-1 group shadow-lg"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <MapPin size={24} className="text-neutral-400 group-hover:text-orange-400 transition-colors" />
                                                        <span className="font-bold text-xl text-white">{loc.name}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end shrink-0">
                                                        <span className="text-3xl font-black text-orange-400 leading-none">{loc.count}</span>
                                                        <span className="text-xs text-neutral-400 uppercase tracking-wider font-bold mt-1">Courts</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                     </div>
                                 )}
                                 {activeSport && !SPORT_LOCATIONS[activeSport] && (
                                     <div className="p-12 text-center text-neutral-400 border border-white/10 rounded-2xl bg-white/5">
                                         No locations found for {activeSport} yet.
                                     </div>
                                 )}
                             </div>
                         </div>
                    )}

                    {/* --- DANCE VIEW --- */}
                    {activeCategory === 'Dance' && (
                         <div className="w-full max-w-5xl">
                             <div className="flex items-center gap-4 mb-8 border-b border-pink-500/20 pb-6">
                                  <Music size={40} className="text-pink-400" />
                                  <h3 className="text-4xl font-bold text-pink-400">Dance Styles</h3>
                             </div>

                             {/* Level 1: Sub-Grid */}
                             <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 transition-all duration-500 overflow-hidden ${!activeSport ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0'}`}>
                                 {DANCE_STYLES.map((sport, idx) => (
                                     <button 
                                         key={sport.name}
                                         onClick={() => setActiveSport(sport.name)}
                                         className="flex flex-col items-center justify-center p-8 rounded-2xl border border-white/5 bg-black/40 hover:bg-pink-500/10 hover:border-pink-500/30 text-neutral-300 hover:text-white transition-all duration-300 group shadow-lg hover:-translate-y-1 hover:scale-105"
                                         style={{ animationDelay: `${idx * 50}ms` }}
                                     >
                                         <span className="text-5xl mb-4 transition-transform block group-hover:scale-110 group-hover:rotate-6">{sport.icon}</span>
                                         <span className="text-lg font-semibold text-center leading-tight">{sport.name}</span>
                                     </button>
                                 ))}
                             </div>

                             {/* Level 2: Locations List */}
                             <div className={`transition-all duration-500 overflow-hidden ${activeSport && !activeLocation ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0'}`}>
                                 {activeSport && SPORT_LOCATIONS[activeSport] && (
                                     <div className="w-full bg-pink-500/5 border border-pink-500/20 rounded-3xl p-8 backdrop-blur-md">
                                        <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                            <span className="text-4xl">{DANCE_STYLES.find(s => s.name === activeSport)?.icon}</span>
                                            Find {activeSport} studios in these neighborhoods:
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {SPORT_LOCATIONS[activeSport].map(loc => (
                                                <button
                                                    key={loc.id}
                                                    onClick={() => setActiveLocation(loc)}
                                                    className="w-full text-left flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-pink-500/40 transition-all hover:-translate-y-1 group shadow-lg"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <MapPin size={24} className="text-neutral-400 group-hover:text-pink-400 transition-colors" />
                                                        <span className="font-bold text-xl text-white">{loc.name}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end shrink-0">
                                                        <span className="text-3xl font-black text-pink-400 leading-none">{loc.count}</span>
                                                        <span className="text-xs text-neutral-400 uppercase tracking-wider font-bold mt-1">Studios</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                     </div>
                                 )}
                                 {activeSport && !SPORT_LOCATIONS[activeSport] && (
                                     <div className="p-12 text-center text-neutral-400 border border-white/10 rounded-2xl bg-white/5">
                                         No locations found for {activeSport} yet.
                                     </div>
                                 )}
                             </div>
                         </div>
                    )}

                    {/* LEVEL 3: Classes / Location Details */}
                    <div className={`w-full max-w-5xl transition-all duration-500 overflow-hidden ${activeLocation ? 'opacity-100 max-h-[5000px] mt-4' : 'opacity-0 max-h-0'}`}>
                        {activeLocation && (
                            <div className={`w-full border rounded-3xl p-8 backdrop-blur-md ${activeCategory === 'Dance' ? 'bg-pink-500/5 border-pink-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b border-white/10 gap-4">
                                    <h4 className="text-3xl font-bold text-white flex items-center gap-3">
                                        <MapPin size={32} className={activeCategory === 'Dance' ? 'text-pink-400' : 'text-orange-400'}/>
                                        {activeLocation.name}
                                    </h4>
                                    <Link href={`/map?hub=${activeLocation.id}`} className={`px-6 py-2.5 rounded-full font-bold transition-colors shadow-lg flex items-center gap-2 ${activeCategory === 'Dance' ? 'bg-pink-500 hover:bg-pink-600 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}>
                                        <MapIcon size={18} />
                                        Open on Map
                                    </Link>
                                </div>
                                
                                <div className="space-y-4">
                                    {activeCategory === 'Dance' ? (
                                        danceClasses.filter(c => c.community_centre.toLowerCase().includes(activeLocation.name.toLowerCase()) || activeLocation.name.toLowerCase().includes(c.community_centre.toLowerCase())).length > 0 ? (
                                            danceClasses.filter(c => c.community_centre.toLowerCase().includes(activeLocation.name.toLowerCase()) || activeLocation.name.toLowerCase().includes(c.community_centre.toLowerCase())).map((cls, idx) => (
                                                <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/10 transition-colors group">
                                                    <div>
                                                        <h5 className="text-xl font-bold text-white mb-2 group-hover:text-pink-400 transition-colors">{cls.class_name}</h5>
                                                        <p className="text-neutral-400 text-sm flex items-center gap-2">
                                                            <Calendar size={16}/>
                                                            {cls.schedule_raw}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end shrink-0">
                                                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${cls.status === 'Full' || cls.status === 'Waitlist' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                            {cls.status || 'Available - Register Now'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-12 text-center text-neutral-400 border border-white/5 rounded-2xl bg-black/20">
                                                No upcoming classes scheduled at this location right now. Check back later!
                                            </div>
                                        )
                                    ) : (
                                        <div className="p-12 text-center text-neutral-400 border border-white/5 rounded-2xl bg-black/20">
                                            Live schedules for {activeCategory} are coming soon. The data pipeline is currently fetching live Ottawa Dance classes!
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Placeholders for others */}
                    {(activeCategory === 'Fitness' || activeCategory === 'Movement' || activeCategory === 'Events') && (
                        <div className="w-full max-w-5xl flex flex-col items-center justify-center p-20 text-center border border-white/10 rounded-3xl bg-white/5 backdrop-blur-md shadow-2xl">
                            <h3 className="text-4xl font-bold text-white mb-6">Explore {activeCategory}</h3>
                            <p className="text-lg text-neutral-400">Curated locations and classes for {activeCategory} are coming soon.</p>
                            <button onClick={() => setActiveCategory(null)} className="mt-8 bg-white/10 hover:bg-white/20 px-8 py-3 rounded-full transition-colors font-bold">
                                Go Back
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </main>
    );
}
