import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge'; // Zero cold starts

export async function GET() {
    // These remain hidden from the browser/frontend
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetching from your "Pantry"
    const { data: meetups, error } = await supabase
        .from('meetups')
        .select('*')
        .eq('is_live', true);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const formattedMeetups = (meetups || []).map((m: any) => ({
        ...m,
        imageUrl: m.imageUrl || null,
        imageAttribution: m.imageAttribution || null
    }));

    return NextResponse.json(formattedMeetups);
}
