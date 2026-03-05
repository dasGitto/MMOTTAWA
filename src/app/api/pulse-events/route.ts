import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export async function GET() {
    // These remain hidden from the browser/frontend
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:5432';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'local-key';
    const supabase = createClient(supabaseUrl, supabaseKey);

    let events: any[] = [];

    try {
        // Fetching from your "pulse_events" pantry
        const { data, error } = await supabase
            .from('pulse_events')
            .select('*')
            .eq('is_live', true);

        if (!error && data) {
            events = data;
        } else {
            throw new Error('Supabase failed');
        }
    } catch (e) {
        // Local Fallback Load!
        try {
            const rawData = fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'pulse_events.json'), 'utf8');
            events = JSON.parse(rawData);
        } catch (fileErr) {
            console.error("No local cache found either:", fileErr);
        }
    }

    // Fallback Geocoding for Ottawa
    const formattedEvents = (events || []).map((e: any) => {
        // Simple random jitter around central Ottawa if no explicit lat/lon
        const lat = 45.41 + (Math.random() * 0.04 - 0.02);
        const lng = -75.69 + (Math.random() * 0.04 - 0.02);

        return {
            ...e,
            lat: e.lat || lat,
            lng: e.lng || lng
        };
    });

    return NextResponse.json(formattedEvents);
}
