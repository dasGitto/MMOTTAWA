'use client';

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen bg-black overflow-hidden relative selection:bg-emerald-500/30">
      <Map />
    </main>
  );
}
