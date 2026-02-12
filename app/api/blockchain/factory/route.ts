import { NextResponse } from 'next/server';
import { publicClient, FACTORY_ADDRESS } from '@/lib/blockchain/config';
import { MarrakechFactoryABI } from '@/lib/blockchain/abis/MarrakechFactory';

export async function GET() {
  try {
    const info = await publicClient.readContract({
      address: FACTORY_ADDRESS,
      abi: MarrakechFactoryABI,
      functionName: 'getFactoryInfo',
    });

    return NextResponse.json({
      address: FACTORY_ADDRESS,
      usdc: info[0],
      stakeAmount: info[1].toString(),
      platformFeeBps: Number(info[2]),
      platformWallet: info[3],
      gamesCount: Number(info[4]),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read factory info' },
      { status: 500 }
    );
  }
}
