'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

function MapContent() {
  const searchParams = useSearchParams();
  const hubId = searchParams.get('hub') || undefined;

  return <Map initialHubId={hubId} />;
}

export default function MapPage() {
  return (
    <main className="min-h-screen bg-black overflow-hidden relative selection:bg-emerald-500/30">
      {/* Back Button Container */}
      <div className="absolute top-4 right-4 z-[100]">
        <Link 
          href="/" 
          className="flex items-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Hub
        </Link>
      </div>

      <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white">Loading map...</div>}>
         <MapContent />
      </Suspense>
    </main>
  );
}
