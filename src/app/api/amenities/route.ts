import { NextResponse } from 'next/server';
import { fetchNeighborhoodAmenities } from '@/lib/fetchAmenities';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const bboxParam = searchParams.get('bbox');

    if (!bboxParam) {
        return NextResponse.json({ error: "Missing bbox parameter" }, { status: 400 });
    }

    try {
        const bbox = bboxParam.split(',').map(Number);
        if (bbox.length !== 4 || bbox.some(isNaN)) {
            return NextResponse.json({ error: "Invalid bbox parameter" }, { status: 400 });
        }

        const data = await fetchNeighborhoodAmenities(bbox);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Error fetching amenities:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
