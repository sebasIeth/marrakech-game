import { NextResponse } from 'next/server';

/**
 * Arena API endpoint - provides game state for AlphArena platform integration.
 * The AlphArena backend uses this to relay match data to viewers.
 *
 * GET /api/arena?matchId=xxx&backendUrl=http://localhost:3000
 * Returns the current match state from the AlphArena backend.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');
  const backendUrl = searchParams.get('backendUrl') || process.env.ARENA_BACKEND_URL || 'http://localhost:3000';

  if (!matchId) {
    return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${backendUrl}/matches/${matchId}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch match from backend' },
        { status: response.status },
      );
    }

    const matchData = await response.json();
    return NextResponse.json(matchData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
