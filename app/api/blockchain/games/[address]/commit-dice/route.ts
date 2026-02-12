import { NextRequest, NextResponse } from 'next/server';
import { encodeFunctionData, keccak256, encodePacked } from 'viem';
import { MarrakechGameABI } from '@/lib/blockchain/abis/MarrakechGame';

type RouteContext = { params: Promise<{ address: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { address } = await context.params;

    // Generate a random salt
    const saltBytes = crypto.getRandomValues(new Uint8Array(32));
    const salt = BigInt('0x' + Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    const commitHash = keccak256(encodePacked(['uint256'], [salt]));

    const data = encodeFunctionData({
      abi: MarrakechGameABI,
      functionName: 'commitDice',
      args: [commitHash],
    });

    return NextResponse.json({
      transaction: { to: address, data, description: 'Commit Dice Roll' },
      salt: salt.toString(),
      commitHash,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to encode commit dice' }, { status: 500 });
  }
}
