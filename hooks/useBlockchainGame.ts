'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { keccak256, encodePacked } from 'viem';
import { useGameStore } from '@/lib/store/gameStore';
import { useLobbyStore } from '@/lib/store/lobbyStore';
import { MarrakechGameABI } from '@/lib/blockchain/abis/MarrakechGame';
import { DIRECTION_TO_UINT8, CONTRACT_PHASE } from '@/lib/blockchain/config';
import { convertOnChainToGameState } from '@/lib/blockchain/stateConverter';
import { getValidPlacements } from '@/lib/game/carpet';
import type { Direction, CarpetPlacement } from '@/lib/game/types';

type TxStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

export function useBlockchainGame() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const syncState = useGameStore((s) => s.syncState);
  const gameContractAddress = useLobbyStore((s) => s.gameContractAddress) as `0x${string}`;

  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txMessage, setTxMessage] = useState('');
  const [txError, setTxError] = useState('');

  // Salt for commit-reveal dice
  const saltRef = useRef<bigint | null>(null);
  // Guard against concurrent writes
  const writingRef = useRef(false);
  // Contract phase (raw, not mapped)
  const [contractPhase, setContractPhase] = useState<number>(0);

  // Fetch and sync state from contract
  const refreshState = useCallback(async () => {
    if (!publicClient || !gameContractAddress) return;

    try {
      const [fullState, playersData, tributeData, borderData] = await Promise.all([
        publicClient.readContract({
          address: gameContractAddress,
          abi: MarrakechGameABI,
          functionName: 'getFullState',
        }),
        publicClient.readContract({
          address: gameContractAddress,
          abi: MarrakechGameABI,
          functionName: 'getPlayers',
        }),
        publicClient.readContract({
          address: gameContractAddress,
          abi: MarrakechGameABI,
          functionName: 'getTributeInfo',
        }),
        publicClient.readContract({
          address: gameContractAddress,
          abi: MarrakechGameABI,
          functionName: 'getBorderChoiceInfo',
        }),
      ]);

      const phase = Number(fullState[1]);
      setContractPhase(phase);

      const gameState = convertOnChainToGameState(
        {
          status: Number(fullState[0]),
          phase,
          currentPlayerIndex: Number(fullState[2]),
          turnNumber: Number(fullState[3]),
          numPlayers: Number(fullState[4]),
          joinedCount: Number(fullState[5]),
          lastDiceValue: Number(fullState[6]),
          assamRow: Number(fullState[7]),
          assamCol: Number(fullState[8]),
          assamDir: Number(fullState[9]),
          boardPlayerIds: (fullState[10] as readonly number[]).map(Number),
          boardCarpetIds: (fullState[11] as readonly number[]).map(Number),
        },
        {
          wallets: playersData[0] as readonly string[],
          dirhamsArr: (playersData[1] as readonly number[]).map(Number),
          carpetsArr: (playersData[2] as readonly number[]).map(Number),
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
        gameContractAddress,
      );

      // Compute valid placements if in Place phase
      if (phase === CONTRACT_PHASE.Place) {
        gameState.validPlacements = getValidPlacements(
          gameState.board,
          gameState.assam.position,
          gameState.currentPlayerIndex
        );
      }

      syncState(gameState);
    } catch (err) {
      console.error('Failed to refresh state:', err);
    }
  }, [publicClient, gameContractAddress, syncState]);

  // Poll for state changes
  useEffect(() => {
    refreshState();
    const interval = setInterval(refreshState, 4000);
    return () => clearInterval(interval);
  }, [refreshState]);

  // Watch for contract events to trigger faster refresh
  useEffect(() => {
    if (!publicClient || !gameContractAddress) return;

    const unwatch = publicClient.watchContractEvent({
      address: gameContractAddress,
      abi: MarrakechGameABI,
      onLogs: () => {
        // Refresh state whenever any event fires
        refreshState();
      },
    });

    return () => unwatch();
  }, [publicClient, gameContractAddress, refreshState]);

  // Helper to execute a contract write with status tracking
  const executeWrite = useCallback(
    async (
      functionName: string,
      args: any[],
      message: string,
    ) => {
      // Guard: skip if already writing
      if (writingRef.current) return;
      writingRef.current = true;

      setTxStatus('pending');
      setTxMessage(message);
      setTxError('');

      try {
        const hash = await writeContractAsync({
          address: gameContractAddress,
          abi: MarrakechGameABI,
          functionName: functionName as any,
          args: args as any,
          gas: BigInt(500_000),
        });

        setTxStatus('confirming');
        setTxMessage('Confirmando transaccion...');

        await publicClient!.waitForTransactionReceipt({ hash });

        setTxStatus('success');
        setTxMessage('');

        // Refresh state after confirmation
        await refreshState();

        // Reset status after brief delay
        setTimeout(() => setTxStatus('idle'), 1500);
      } catch (err: any) {
        setTxStatus('error');
        setTxError(err.shortMessage || err.message || 'Transaction failed');
        setTimeout(() => {
          setTxStatus('idle');
          setTxError('');
        }, 5000);
      } finally {
        writingRef.current = false;
      }
    },
    [writeContractAsync, gameContractAddress, publicClient, refreshState],
  );

  // ── Game Actions ──

  const orientAssam = useCallback(
    (direction: Direction) => {
      const dirUint8 = DIRECTION_TO_UINT8[direction];
      executeWrite('orientAssam', [dirUint8], 'Orientando Assam...');
    },
    [executeWrite],
  );

  const commitDice = useCallback(async () => {
    // Generate random salt
    const saltBytes = crypto.getRandomValues(new Uint8Array(32));
    const salt = BigInt('0x' + Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    saltRef.current = salt;

    const commitHash = keccak256(encodePacked(['uint256'], [salt]));
    await executeWrite('commitDice', [commitHash], 'Lanzando dado (commit)...');
  }, [executeWrite]);

  const revealDice = useCallback(async () => {
    if (!saltRef.current) {
      setTxError('No salt found — commit first');
      return;
    }
    await executeWrite('revealDice', [saltRef.current], 'Revelando dado...');
    saltRef.current = null;
  }, [executeWrite]);

  const chooseBorderDirection = useCallback(
    (direction: Direction) => {
      const dirUint8 = DIRECTION_TO_UINT8[direction];
      executeWrite('chooseBorderDirection', [dirUint8], 'Eligiendo direccion...');
    },
    [executeWrite],
  );

  const acknowledgeTribute = useCallback(() => {
    executeWrite('acknowledgeTribute', [], 'Procesando tributo...');
  }, [executeWrite]);

  const placeCarpet = useCallback(
    (placement: CarpetPlacement) => {
      executeWrite(
        'placeCarpet',
        [placement.cell1.row, placement.cell1.col, placement.cell2.row, placement.cell2.col],
        'Colocando alfombra...',
      );
    },
    [executeWrite],
  );

  // Determine if the dice flow needs commit or reveal
  const isDiceCommitPhase = contractPhase === CONTRACT_PHASE.CommitDice;
  const isDiceRevealPhase = contractPhase === CONTRACT_PHASE.RevealDice;

  return {
    txStatus,
    txMessage,
    txError,
    contractPhase,
    isDiceCommitPhase,
    isDiceRevealPhase,
    orientAssam,
    commitDice,
    revealDice,
    chooseBorderDirection,
    acknowledgeTribute,
    placeCarpet,
    refreshState,
  };
}
