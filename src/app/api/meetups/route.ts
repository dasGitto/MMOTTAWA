import { NextResponse } from 'next/server';
import { fetchOttawaSportsMeetups } from '@/lib/fetchMeetups';
import { createClient } from '@supabase/supabase-js';

// The Edge Logic: 0 cold starts, runs globally on V8 isolates
export const runtime = 'edge';

export async function GET() {

    /**
     * SUPABASE SECURE EDGE FETCHING (Example Pattern)
     * Because this runs server-side (Edge), we safely use the SERVICE_ROLE_KEY
     * to bypass RLS locally (if needed) or fetch sensitive structured data 
     * without exposing the keys to the client payload.
     */
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock_service_key';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Example: const { data, error } = await supabase.from('meetups').select('*');

    // Currently fetching Meetups via GraphQL
    const meetups = await fetchOttawaSportsMeetups();

    return NextResponse.json(meetups);
}
