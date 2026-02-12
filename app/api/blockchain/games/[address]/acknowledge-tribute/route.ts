import { NextRequest, NextResponse } from 'next/server';
import { encodeFunctionData } from 'viem';
import { MarrakechGameABI } from '@/lib/blockchain/abis/MarrakechGame';

type RouteContext = { params: Promise<{ address: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { address } = await context.params;

    const data = encodeFunctionData({
      abi: MarrakechGameABI,
      functionName: 'acknowledgeTribute',
    });

    return NextResponse.json({
      transaction: { to: address, data, description: 'Acknowledge Tribute' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to encode acknowledge tribute' }, { status: 500 });
  }
}
