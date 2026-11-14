import { NextResponse } from 'next/server';
import { getCraftDesigns, saveCraftDesign, CraftDesignPayload } from '@/services/supabaseService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const missionId = searchParams.get('missionId') || undefined;

  try {
    const designs = await getCraftDesigns(missionId);
    return NextResponse.json({
      success: true,
      count: designs.length,
      designs,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch spacecraft designs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CraftDesignPayload = await request.json();
    if (!body.callsign || !body.missionId || !body.designName || !Array.isArray(body.parts)) {
      return NextResponse.json(
        { success: false, error: 'Missing required craft blueprint fields' },
        { status: 400 }
      );
    }

    const result = await saveCraftDesign(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to save craft blueprint' },
      { status: 500 }
    );
  }
}
