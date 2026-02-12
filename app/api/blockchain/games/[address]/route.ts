import { NextRequest, NextResponse } from 'next/server';
import { publicClient } from '@/lib/blockchain/config';
import { MarrakechGameABI } from '@/lib/blockchain/abis/MarrakechGame';
import { convertOnChainToGameState } from '@/lib/blockchain/stateConverter';

type RouteContext = { params: Promise<{ address: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { address } = await context.params;
    const gameAddress = address as `0x${string}`;

    const [fullState, playersData, tributeData, borderData] = await Promise.all([
      publicClient.readContract({
        address: gameAddress,
        abi: MarrakechGameABI,
        functionName: 'getFullState',
      }),
      publicClient.readContract({
        address: gameAddress,
        abi: MarrakechGameABI,
        functionName: 'getPlayers',
      }),
      publicClient.readContract({
        address: gameAddress,
        abi: MarrakechGameABI,
        functionName: 'getTributeInfo',
      }),
      publicClient.readContract({
        address: gameAddress,
        abi: MarrakechGameABI,
        functionName: 'getBorderChoiceInfo',
      }),
    ]);

    const state = convertOnChainToGameState(
      {
        status: Number(fullState[0]),
        phase: Number(fullState[1]),
        currentPlayerIndex: Number(fullState[2]),
        turnNumber: Number(fullState[3]),
        numPlayers: Number(fullState[4]),
        joinedCount: Number(fullState[5]),
        lastDiceValue: Number(fullState[6]),
        assamRow: Number(fullState[7]),
        assamCol: Number(fullState[8]),
        assamDir: Number(fullState[9]),
        boardPlayerIds: fullState[10].map(Number),
        boardCarpetIds: fullState[11].map(Number),
      },
      {
        wallets: playersData[0] as readonly string[],
        dirhamsArr: playersData[1].map(Number),
        carpetsArr: playersData[2].map(Number),
        eliminatedArr: playersData[3] as readonly boolean[],
        joinedArr: playersData[4] as readonly boolean[],
      },
      {
        fromPlayer: Number(tributeData[0]),
        toPlayer: Number(tributeData[1]),
        amount: Number(tributeData[2]),
      },
      {
        row: Number(borderData[0]),
        col: Number(borderData[1]),
        exitDirection: Number(borderData[2]),
        remainingSteps: Number(borderData[3]),
      },
      address,
    );

    return NextResponse.json({ state, contractAddress: address });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read game state' }, { status: 500 });
  }
}
