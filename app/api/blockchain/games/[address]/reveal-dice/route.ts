import { NextRequest, NextResponse } from 'next/server';
import { encodeFunctionData } from 'viem';
import { MarrakechGameABI } from '@/lib/blockchain/abis/MarrakechGame';

type RouteContext = { params: Promise<{ address: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { address } = await context.params;
    const { salt } = await request.json();

    if (!salt) {
      return NextResponse.json({ error: 'Salt is required' }, { status: 400 });
    }

    const data = encodeFunctionData({
      abi: MarrakechGameABI,
      functionName: 'revealDice',
      args: [BigInt(salt)],
    });

    return NextResponse.json({
      transaction: { to: address, data, description: 'Reveal Dice Roll' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to encode reveal dice' }, { status: 500 });
  }
}
