'use client';
import { useState } from 'react';
import { X, Activity, ChevronDown, MapPin } from 'lucide-react';
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

                    {hub.imageAttribution && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] text-white/70 border border-white/10 z-10">
                            {hub.imageAttribution}
                        </div>
                    )}

                    <div className="absolute bottom-4 left-6">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border mb-2 bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                            {hub.category || 'Movement Hub'}
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg tracking-tight">
                            {hub.name?.toUpperCase() || 'HUB PROFILE'}
                        </h2>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6">
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
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${activeTab ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="bg-black/40 border border-white/5 rounded-xl p-5 mb-2">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                                        Features & Activities
                                    </h3>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                                        {activeTab && catalog[activeTab] && catalog[activeTab].map((item: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-neutral-300">
                                                <div className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 bg-indigo-500" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
