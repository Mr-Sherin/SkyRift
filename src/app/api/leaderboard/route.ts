import { NextResponse } from 'next/server';
import { getMissionLeaderboard } from '@/services/supabaseService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const missionId = searchParams.get('missionId') || 'mission-earth-obs';
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

  try {
    const entries = await getMissionLeaderboard(missionId, limit);
    return NextResponse.json({
      success: true,
      missionId,
      count: entries.length,
      leaderboard: entries,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
