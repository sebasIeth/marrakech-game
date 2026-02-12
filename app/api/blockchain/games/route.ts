import { NextRequest, NextResponse } from 'next/server';
import { encodeFunctionData } from 'viem';
import { publicClient, FACTORY_ADDRESS, USDC_ADDRESS } from '@/lib/blockchain/config';
import { MarrakechFactoryABI } from '@/lib/blockchain/abis/MarrakechFactory';
import { MarrakechGameABI } from '@/lib/blockchain/abis/MarrakechGame';
import { ERC20ABI } from '@/lib/blockchain/abis/MarrakechGame';

// GET: List all games
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const games = activeOnly
      ? await publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: MarrakechFactoryABI,
          functionName: 'getActiveGames',
        })
      : await publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: MarrakechFactoryABI,
          functionName: 'getGames',
        });

    // Get basic info for each game
    const gameInfos = await Promise.all(
      (games as string[]).map(async (address) => {
        try {
          const state = await publicClient.readContract({
            address: address as `0x${string}`,
            abi: MarrakechGameABI,
            functionName: 'getGameState',
          });
          return {
            address,
            status: Number(state[0]),
            phase: Number(state[1]),
            currentPlayerIndex: Number(state[2]),
            turnNumber: Number(state[3]),
            numPlayers: Number(state[4]),
            joinedCount: Number(state[5]),
          };
        } catch {
          return { address, error: 'Failed to read state' };
        }
      })
    );

    return NextResponse.json({ games: gameInfos });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list games' }, { status: 500 });
  }
}

// POST: Get calldata to create a game (approve USDC + createGame)
export async function POST(request: NextRequest) {
  try {
    const { numPlayers } = await request.json();

    if (!numPlayers || numPlayers < 2 || numPlayers > 4) {
      return NextResponse.json({ error: 'Invalid numPlayers (2-4)' }, { status: 400 });
    }

    // Read stake amount from factory
    const stakeAmount = await publicClient.readContract({
      address: FACTORY_ADDRESS,
      abi: MarrakechFactoryABI,
      functionName: 'stakeAmount',
    });

    // Step 1: Approve USDC
    const approveData = encodeFunctionData({
      abi: ERC20ABI,
      functionName: 'approve',
      args: [FACTORY_ADDRESS, stakeAmount],
    });

    // Step 2: Create game
    const createData = encodeFunctionData({
      abi: MarrakechFactoryABI,
      functionName: 'createGame',
      args: [numPlayers],
    });

    return NextResponse.json({
      transactions: [
        { to: USDC_ADDRESS, data: approveData, description: 'Approve USDC' },
        { to: FACTORY_ADDRESS, data: createData, description: 'Create Game' },
      ],
      stakeAmount: stakeAmount.toString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to encode create game' }, { status: 500 });
  }
}
