'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { usePublicClient } from 'wagmi';
import { useLobbyStore } from '@/lib/store/lobbyStore';
import { useGameStore } from '@/lib/store/gameStore';
import { CONTRACT_PHASE } from '@/lib/blockchain/config';
import { MarrakechGameABI } from '@/lib/blockchain/abis/MarrakechGame';
import { convertOnChainToGameState } from '@/lib/blockchain/stateConverter';
import { PLAYER_COLORS } from '@/lib/game/constants';

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function BlockchainWaiting() {
  const lobby = useLobbyStore();
  const router = useRouter();
  const publicClient = usePublicClient();
  const syncState = useGameStore((s) => s.syncState);
  const [players, setPlayers] = useState<{ index: number; wallet: string; joined: boolean }[]>([]);
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState('');
  const validatedRef = useRef(false);

  const gameAddress = lobby.gameContractAddress as `0x${string}`;

  const fetchState = useCallback(async () => {
    if (!publicClient || !gameAddress || gameAddress === '0x0000000000000000000000000000000000000000') return;

    try {
      // Validate the contract address on first poll by checking it has code
      if (!validatedRef.current) {
        const code = await publicClient.getCode({ address: gameAddress });
        if (!code || code === '0x') {
          setError(`Contrato no encontrado en ${gameAddress}. Verifica la direccion.`);
          return;
        }
        validatedRef.current = true;
      }

      const [fullState, playersData] = await Promise.all([
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
      ]);

      setError('');

      const numP = Number(fullState[4]);
      const joinedCount = Number(fullState[5]);
      const phase = Number(fullState[1]);

      // Update player list
      const playerList = [];
      for (let i = 0; i < numP; i++) {
        playerList.push({
          index: i,
          wallet: (playersData[0] as readonly string[])[i],
          joined: (playersData[4] as readonly boolean[])[i],
        });
      }
      setPlayers(playerList);

      // Find my player ID
      const myIdx = playerList.findIndex(
        (p) => p.wallet.toLowerCase() === lobby.walletAddress.toLowerCase()
      );
      if (myIdx >= 0) {
        lobby.setMyPlayerId(myIdx);
      }

      // If game started, navigate to game
      if (phase !== CONTRACT_PHASE.WaitingForPlayers && joinedCount === numP) {
        setPolling(false);

        const [tributeData, borderData] = await Promise.all([
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

        const gameState = convertOnChainToGameState(
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
            fromPlayer: Number((tributeData as any)[0]),
            toPlayer: Number((tributeData as any)[1]),
            amount: Number((tributeData as any)[2]),
          },
          {
            row: Number((borderData as any)[0]),
            col: Number((borderData as any)[1]),
            exitDirection: Number((borderData as any)[2]),
            remainingSteps: Number((borderData as any)[3]),
          },
          lobby.gameContractAddress,
        );

        syncState(gameState);
        router.push('/game');
      }
    } catch (err: any) {
      console.error('Failed to fetch game state:', err);
      if (err.message?.includes('returned no data')) {
        setError('El contrato no responde. Puede que la direccion sea incorrecta.');
      }
    }
  }, [publicClient, gameAddress, lobby, syncState, router]);

  useEffect(() => {
    fetchState();
    if (!polling) return;
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, [fetchState, polling]);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <motion.div
        className="relative z-10 rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-6"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #E8D5A3',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="font-display text-2xl font-bold text-[#2C1810]">
          Partida On-Chain
        </h2>

        {/* Contract Address */}
        <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #FFF8E7, #F4E8C1)', border: '1px solid #E8D5A3' }}>
          <p className="text-xs text-[#8B6914] mb-1">Contrato del juego</p>
          <p className="text-xs font-mono font-bold text-[#C19A3E] break-all">
            {lobby.gameContractAddress}
          </p>
        </div>

        {/* Players */}
        <div className="space-y-2">
          <p className="text-sm text-[#8B6914]">
            Jugadores ({players.filter(p => p.joined).length}/{lobby.numPlayers})
          </p>
          {Array.from({ length: lobby.numPlayers }, (_, i) => {
            const player = players[i];
            return (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FFF8E7]"
              >
                <div
                  className="w-6 h-6 rounded-lg"
                  style={{ backgroundColor: PLAYER_COLORS[i].primary, opacity: player?.joined ? 1 : 0.3 }}
                />
                <span className="text-sm font-mono text-[#2C1810]">
                  {player?.joined ? truncateAddress(player.wallet) : 'Esperando...'}
                </span>
                {player?.wallet.toLowerCase() === lobby.walletAddress.toLowerCase() && (
                  <span className="text-[10px] text-[#C19A3E] font-semibold">(Tu)</span>
                )}
                {player?.joined && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-green-500" />
                )}
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-500 text-center">{error}</p>
        )}

        {/* Waiting indicator */}
        {!error && players.filter(p => p.joined).length < lobby.numPlayers && (
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xs text-[#8B6914]/60 mr-2">Esperando jugadores</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#C19A3E] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#C19A3E] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#C19A3E] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        <p className="text-[10px] text-[#8B6914]/40">
          Comparte la direccion del contrato con otros jugadores para que se unan
        </p>

        <button
          onClick={() => lobby.reset()}
          className="text-sm text-[#8B6914] hover:text-[#C19A3E] transition-colors"
        >
          Volver al Menu
        </button>
      </motion.div>
    </div>
  );
}
