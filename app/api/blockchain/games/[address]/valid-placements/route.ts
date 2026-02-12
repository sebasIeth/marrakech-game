import { NextRequest, NextResponse } from 'next/server';
import { publicClient } from '@/lib/blockchain/config';
import { MarrakechGameABI } from '@/lib/blockchain/abis/MarrakechGame';
import { getValidPlacements } from '@/lib/game/carpet';
import { BOARD_SIZE } from '@/lib/game/constants';
import { EMPTY_CELL, NEUTRALIZED_CELL } from '@/lib/blockchain/config';
import type { CarpetCell } from '@/lib/game/types';

type RouteContext = { params: Promise<{ address: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { address } = await context.params;
    const gameAddress = address as `0x${string}`;

    const [fullState] = await Promise.all([
      publicClient.readContract({
        address: gameAddress,
        abi: MarrakechGameABI,
        functionName: 'getFullState',
      }),
    ]);

    const boardPlayerIds = fullState[10].map(Number);
    const boardCarpetIds = fullState[11].map(Number);
    const currentPlayerIndex = Number(fullState[2]);
    const assamRow = Number(fullState[7]);
    const assamCol = Number(fullState[8]);

    // Convert flat arrays to 2D board
    const board: (CarpetCell | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => null)
    );

    for (let i = 0; i < 49; i++) {
      const playerId = boardPlayerIds[i];
      const carpetId = boardCarpetIds[i];
      const row = Math.floor(i / BOARD_SIZE);
      const col = i % BOARD_SIZE;

      if (playerId !== EMPTY_CELL && playerId !== NEUTRALIZED_CELL) {
        board[row][col] = {
          playerId,
          carpetId: `p${playerId}_c${String(carpetId).padStart(2, '0')}`,
        };
      } else if (playerId === NEUTRALIZED_CELL) {
        board[row][col] = { playerId: -1, carpetId: `neutralized_${carpetId}` };
      }
    }

    const placements = getValidPlacements(
      board,
      { row: assamRow, col: assamCol },
      currentPlayerIndex
    );

    return NextResponse.json({ placements });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to compute valid placements' }, { status: 500 });
  }
}
