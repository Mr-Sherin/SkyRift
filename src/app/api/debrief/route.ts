import { NextResponse } from 'next/server';
import { submitMissionDebrief, MissionDebriefPayload } from '@/services/supabaseService';

export async function POST(request: Request) {
  try {
    const body: MissionDebriefPayload = await request.json();

    if (!body.callsign || !body.missionId || typeof body.score !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Missing required debrief fields' },
        { status: 400 }
      );
    }

    const result = await submitMissionDebrief(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error processing debrief' },
      { status: 500 }
    );
  }
}
