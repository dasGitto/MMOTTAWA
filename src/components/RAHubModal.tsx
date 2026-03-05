'use client';
import { X, ExternalLink, CalendarDays } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface RAHubModalProps {
    hub: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function RAHubModal({ hub, isOpen, onClose }: RAHubModalProps) {
    if (!hub || hub.id !== 'billings-ra-centre') return null;

    const catalog = hub.catalog || {};

    const getPillColor = (category: string) => {
        switch (category) {
            case 'Court Sports': return 'border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20';
            case 'Field & Leagues': return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20';
            case 'Specialized Clubs': return 'border-purple-500/30 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20';
            case 'Fitness & Wellness': return 'border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20';
            case 'Youth & Junior': return 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20';
            case 'Aquatics (Summer)': return 'border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20';
            case 'Social & Hobby': return 'border-orange-500/30 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20';
            case 'Facilities': return 'border-neutral-500/30 text-neutral-400 bg-neutral-500/10 hover:bg-neutral-500/20';
            default: return 'border-white/20 text-white bg-white/5 hover:bg-white/10';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-md">

                    {/* Click-away backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-3xl max-h-[90vh] sm:max-h-[85vh] bg-[#0A0A0A] border border-white/10 shadow-2xl sm:rounded-2xl rounded-t-3xl overflow-hidden flex flex-col"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/80 text-white/70 hover:text-white rounded-full transition-colors backdrop-blur-xl border border-white/10"
                        >
                            <X size={20} />
                        </button>

                        {/* Glassmorphic Header & Hero Image */}
                        <div className="relative shrink-0 w-full h-48 sm:h-64 bg-neutral-900 border-b border-white/10">
                            {hub.imageUrl && (
                                <Image
                                    src={hub.imageUrl}
                                    alt="RA Centre Hero"
                                    fill
                                    className="object-cover opacity-70 mix-blend-screen"
                                    sizes="(max-width: 768px) 100vw, 800px"
                                    priority
                                />
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />

                            <div className="absolute top-4 left-4 z-10">
                                <span className="px-3 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-[10px] uppercase font-bold text-white/70 tracking-widest">
                                    Official Hub Profile
                                </span>
                            </div>

                            <div className="absolute bottom-6 left-6 sm:left-8 z-10 w-full pr-12">
                                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tighter drop-shadow-xl flex items-center gap-3">
                                    RA CENTRE
                                </h2>
                                <p className="text-sm font-medium text-emerald-400 mt-1 drop-shadow-md">
                                    Ottawa's Largest Multi-Sport Destination
                                </p>
                            </div>
                        </div>

                        {/* Scrollable Content Body */}
                        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-grow">
                            <p className="text-sm text-neutral-400 mb-8 leading-relaxed max-w-2xl">
                                {hub.description}
                            </p>

                            <div className="space-y-8">
                                {Object.entries(catalog).map(([category, items]: [string, any]) => (
                                    <div key={category} className="mb-6">
                                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            {category}
                                            <div className="h-px bg-white/10 flex-grow" />
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {items.map((item: string, idx: number) => {
                                                const isNew = item.includes('(New 2026)');
                                                const cleanItem = item.replace('(New 2026)', '').trim();

                                                return (
                                                    <span
                                                        key={idx}
                                                        className={`px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-medium transition-colors cursor-default flex items-center gap-2 ${getPillColor(category)} relative group`}
                                                    >
                                                        {cleanItem}
                                                        {isNew && (
                                                            <span className="flex h-2 w-2 relative">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                            </span>
                                                        )}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Footer Actions */}
                        <div className="shrink-0 p-5 sm:p-6 bg-[#050505] border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 pb-safe">
                            <a
                                href="https://www.racentre.com/playra"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]"
                            >
                                <CalendarDays size={18} className="group-hover:scale-110 transition-transform" />
                                Check Live Schedule
                            </a>
                            <a
                                href="https://www.racentre.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all"
                            >
                                <ExternalLink size={18} className="text-white/50 group-hover:text-white transition-colors" />
                                Join a Club
                            </a>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
