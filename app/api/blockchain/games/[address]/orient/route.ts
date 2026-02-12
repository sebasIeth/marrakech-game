import { NextRequest, NextResponse } from 'next/server';
import { encodeFunctionData } from 'viem';
import { MarrakechGameABI } from '@/lib/blockchain/abis/MarrakechGame';
import { DIRECTION_TO_UINT8 } from '@/lib/blockchain/config';
import type { Direction } from '@/lib/game/types';

type RouteContext = { params: Promise<{ address: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { address } = await context.params;
    const { direction } = await request.json();

    if (!direction || !(direction in DIRECTION_TO_UINT8)) {
      return NextResponse.json({ error: 'Invalid direction (N/S/E/W)' }, { status: 400 });
    }

    const dirUint8 = DIRECTION_TO_UINT8[direction as Direction];
    const data = encodeFunctionData({
      abi: MarrakechGameABI,
      functionName: 'orientAssam',
      args: [dirUint8],
    });

    return NextResponse.json({
      transaction: { to: address, data, description: 'Orient Assam' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to encode orient' }, { status: 500 });
  }
}
