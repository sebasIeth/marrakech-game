import { NextRequest, NextResponse } from 'next/server';
import { encodeFunctionData } from 'viem';
import { publicClient } from '@/lib/blockchain/config';
import { MarrakechGameABI, ERC20ABI } from '@/lib/blockchain/abis/MarrakechGame';

type RouteContext = { params: Promise<{ address: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { address } = await context.params;
    const gameAddress = address as `0x${string}`;

    // Read stake amount and USDC address from game
    const [stakeAmount, usdcAddress] = await Promise.all([
      publicClient.readContract({
        address: gameAddress,
        abi: MarrakechGameABI,
        functionName: 'stakeAmount',
      }),
      publicClient.readContract({
        address: gameAddress,
        abi: MarrakechGameABI,
        functionName: 'usdc',
      }),
    ]);

    // Approve USDC to game contract
    const approveData = encodeFunctionData({
      abi: ERC20ABI,
      functionName: 'approve',
      args: [gameAddress, stakeAmount],
    });

    // Join game
    const joinData = encodeFunctionData({
      abi: MarrakechGameABI,
      functionName: 'joinGame',
    });

    return NextResponse.json({
      transactions: [
        { to: usdcAddress, data: approveData, description: 'Approve USDC' },
        { to: gameAddress, data: joinData, description: 'Join Game' },
      ],
      stakeAmount: stakeAmount.toString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to encode join' }, { status: 500 });
  }
}
