import { NextRequest, NextResponse } from 'next/server';
import { encodeFunctionData } from 'viem';
import { MarrakechGameABI } from '@/lib/blockchain/abis/MarrakechGame';

type RouteContext = { params: Promise<{ address: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { address } = await context.params;
    const { r1, c1, r2, c2 } = await request.json();

    if (r1 === undefined || c1 === undefined || r2 === undefined || c2 === undefined) {
      return NextResponse.json({ error: 'r1, c1, r2, c2 are required' }, { status: 400 });
    }

    const data = encodeFunctionData({
      abi: MarrakechGameABI,
      functionName: 'placeCarpet',
      args: [r1, c1, r2, c2],
    });

    return NextResponse.json({
      transaction: { to: address, data, description: 'Place Carpet' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to encode place carpet' }, { status: 500 });
  }
}
