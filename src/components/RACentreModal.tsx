'use client';
import { useState } from 'react';
import { X, Calendar, Users, Activity, ChevronDown } from 'lucide-react';
import Image from 'next/image';

interface RACentreModalProps {
    hub: any;
    onClose: () => void;
}

const SPORTS_DATA = {
    team: ['Ball Hockey', 'Softball', 'Indoor Volleyball', 'Sand Volleyball', 'Soccer 7s'],
    other: ['Archery', 'Pickleball', 'Squash', 'Badminton', 'Table Tennis'],
    events: ['League Tournaments', 'Summer Sports Camps', 'Corporate Wellness Events']
};

export default function RACentreModal({ hub, onClose }: RACentreModalProps) {
    const [activeTab, setActiveTab] = useState<'team' | 'other' | 'events' | null>(null);

    if (!hub || hub.id !== 'billings-ra-centre') return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md transition-opacity duration-300">

            {/* Click-away backdrop */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-[#0f0f0f] border border-white/10 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white/70 hover:text-white rounded-full transition-colors backdrop-blur-sm"
                >
                    <X size={20} />
                </button>

                {/* Hero Image Area */}
                <div className="relative w-full h-48 sm:h-64 bg-neutral-900 border-b border-white/10">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/e/e3/Royal_Architectural_Institute_of_Canada_%28RAIC%29.JPG"
                        alt="The RA Centre"
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0f0f0f] to-transparent" />

                    <div className="absolute bottom-4 left-6">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border mb-2 bg-orange-500/20 text-orange-400 border-orange-500/30`}>
                            Major Hub
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg tracking-tight">
                            RA CENTRE
                        </h2>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6">
                    <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-xl mb-6">
                        {hub.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                        <button
                            onClick={() => setActiveTab(activeTab === 'team' ? null : 'team')}
                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all group ${activeTab === 'team' ? 'bg-orange-500/20 border-orange-500/50' : 'border-white/10 bg-white/5 hover:bg-orange-500/10 hover:border-orange-500/30'}`}
                        >
                            <Users size={24} className={activeTab === 'team' ? 'text-orange-400' : 'text-white/50 group-hover:text-orange-400 transition-colors'} />
                            <div className="flex items-center gap-1">
                                <span className={`font-semibold text-sm ${activeTab === 'team' ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>Team Sports</span>
                                <ChevronDown size={14} className={`transition-transform ${activeTab === 'team' ? 'rotate-180 text-orange-400' : 'text-white/30'}`} />
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveTab(activeTab === 'other' ? null : 'other')}
                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all group ${activeTab === 'other' ? 'bg-emerald-500/20 border-emerald-500/50' : 'border-white/10 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30'}`}
                        >
                            <Activity size={24} className={activeTab === 'other' ? 'text-emerald-400' : 'text-white/50 group-hover:text-emerald-400 transition-colors'} />
                            <div className="flex items-center gap-1">
                                <span className={`font-semibold text-sm ${activeTab === 'other' ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>Other Sports</span>
                                <ChevronDown size={14} className={`transition-transform ${activeTab === 'other' ? 'rotate-180 text-emerald-400' : 'text-white/30'}`} />
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveTab(activeTab === 'events' ? null : 'events')}
                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all group ${activeTab === 'events' ? 'bg-purple-500/20 border-purple-500/50' : 'border-white/10 bg-white/5 hover:bg-purple-500/10 hover:border-purple-500/30'}`}
                        >
                            <Calendar size={24} className={activeTab === 'events' ? 'text-purple-400' : 'text-white/50 group-hover:text-purple-400 transition-colors'} />
                            <div className="flex items-center gap-1">
                                <span className={`font-semibold text-sm ${activeTab === 'events' ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>Events</span>
                                <ChevronDown size={14} className={`transition-transform ${activeTab === 'events' ? 'rotate-180 text-purple-400' : 'text-white/30'}`} />
                            </div>
                        </button>
                    </div>

                    {/* Expandable Accordion View */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${activeTab ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="bg-black/40 border border-white/5 rounded-xl p-5 mb-2">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                                Currently Offered
                            </h3>
                            <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
                                {activeTab && SPORTS_DATA[activeTab].map((sport, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-neutral-300">
                                        <div className={`h-1.5 w-1.5 rounded-full ${activeTab === 'team' ? 'bg-orange-500' :
                                            activeTab === 'other' ? 'bg-emerald-500' : 'bg-purple-500'
                                            }`} />
                                        {sport}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
