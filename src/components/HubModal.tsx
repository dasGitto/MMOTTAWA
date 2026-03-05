'use client';
import { useState } from 'react';
import { X, Activity, ChevronDown, MapPin, CalendarDays } from 'lucide-react';
import Image from 'next/image';

interface HubModalProps {
    hub: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function HubModal({ hub, isOpen, onClose }: HubModalProps) {
    const [activeTab, setActiveTab] = useState<string | null>(null);

    // Only render if there's a hub marked as a major modal (or if it has a catalog)
    if (!isOpen || !hub) return null;

    // Use dynamic catalog if provided by hubs.json, fallback to empty
    const catalog = hub.catalog || null;
    const tabKeys = catalog ? Object.keys(catalog) : [];

    // Is smaller hub?
    const isSmallerHub = hub.type === 'Urban Neighborhood Hub';

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-md transition-opacity duration-300">
            {/* Click-away backdrop */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-[#0f0f0f] border border-white/10 shadow-2xl rounded-t-3xl sm:rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/80 text-white/70 hover:text-white rounded-full transition-colors backdrop-blur-sm"
                >
                    <X size={20} />
                </button>

                {/* Hero Image Area */}
                <div className={`relative shrink-0 w-full ${isSmallerHub ? 'h-32 sm:h-48' : 'h-48 sm:h-64'} bg-neutral-900 border-b border-white/10`}>
                    {hub.imageUrl ? (
                        <Image
                            src={hub.imageUrl}
                            alt={hub.name || "Hub Hero Image"}
                            fill
                            className="object-cover opacity-60"
                            sizes="(max-width: 768px) 100vw, 800px"
                        />
                    ) : (
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-900/50 to-black flex items-center justify-center opacity-60">
                            <MapPin size={48} className="text-indigo-500/50" />
                        </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0f0f0f] to-transparent" />

                    {/* Dynamic Badges */}
                    {hub.id === 'hintonburg-cc' && (
                        <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-amber-500/20 backdrop-blur-md rounded-full text-[10px] uppercase text-amber-500 font-bold border border-amber-500/30">
                            NEIGHBORHOOD: HINTONBURG
                        </div>
                    )}

                    {hub.imageAttribution && hub.id !== 'hintonburg-cc' && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] text-white/70 border border-white/10 z-10">
                            {hub.imageAttribution}
                        </div>
                    )}

                    <div className="absolute bottom-4 left-6">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border mb-2 bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                            {hub.category || 'Movement Hub'}
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-white drop-shadow-lg tracking-tight">
                            {hub.name?.toUpperCase() || 'HUB PROFILE'}
                        </h2>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                    <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-xl mb-6">
                        {hub.description}
                    </p>

                    {/* Dynamic Catalog Tabs */}
                    {catalog && tabKeys.length > 0 && (
                        <>
                            <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(tabKeys.length, 3)} gap-3 mb-6`}>
                                {tabKeys.map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveTab(activeTab === key ? null : key)}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all group ${activeTab === key ? 'bg-indigo-500/20 border-indigo-500/50' : 'border-white/10 bg-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30'}`}
                                    >
                                        <Activity size={24} className={activeTab === key ? 'text-indigo-400' : 'text-white/50 group-hover:text-indigo-400 transition-colors'} />
                                        <div className="flex items-center gap-1">
                                            <span className={`font-semibold text-sm capitalize ${activeTab === key ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>{key}</span>
                                            <ChevronDown size={14} className={`transition-transform ${activeTab === key ? 'rotate-180 text-indigo-400' : 'text-white/30'}`} />
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Expandable Accordion View */}
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${activeTab ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="bg-black/40 border border-white/5 rounded-xl p-5 mb-2">
                                    <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">
                                        Features & Activities
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {activeTab && catalog[activeTab] && catalog[activeTab].map((item: string, idx: number) => {
                                            let pillStyle = "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10";
                                            let dotStyle = "bg-indigo-500";

                                            if (item.toLowerCase().includes('floorball')) {
                                                pillStyle = "bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20";
                                                dotStyle = "bg-orange-500 animate-pulse";
                                            } else if (item.toLowerCase().includes('pottery')) {
                                                pillStyle = "bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20";
                                                dotStyle = "bg-sky-500";
                                            }

                                            return (
                                                <span key={idx} className={`flex items-center gap-2 text-xs sm:text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-default ${pillStyle}`}>
                                                    <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dotStyle}`} />
                                                    {item}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Optional Action Footer */}
                {hub.id === 'hintonburg-cc' && (
                    <div className="shrink-0 p-5 sm:p-6 bg-[#050505] border-t border-white/5 pb-safe">
                        <a
                            href="https://ottawa.ca/en/recreation-and-parks/recreation-facilities/facility-listing/hintonburg-community-centre"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_25px_rgba(99,102,241,0.2)]"
                        >
                            <CalendarDays size={18} className="group-hover:scale-110 transition-transform" />
                            What's Happening Today
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
