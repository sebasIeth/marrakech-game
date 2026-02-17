'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import { GameBoard } from '@/components/game/GameBoard';
import { PlayerPanel } from '@/components/game/PlayerPanel';
import { GameHeader } from '@/components/game/GameHeader';
import { ActionLog } from '@/components/game/ActionLog';
import { GameOverScreen } from '@/components/game/GameOverScreen';
import type { GameState } from '@/lib/game/types';

/**
 * Arena Match Viewer - displays a live match from the AlphArena platform.
 * Connects to the AlphArena backend WebSocket for real-time updates.
 */
export default function ArenaMatchPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const store = useGameStore();

  const backendUrl = process.env.NEXT_PUBLIC_ARENA_BACKEND_URL || 'http://localhost:3000';
  const wsUrl = process.env.NEXT_PUBLIC_ARENA_WS_URL || backendUrl.replace('http', 'ws');

  // Fetch initial match state
  const fetchMatchState = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/matches/${matchId}`);
      if (!res.ok) throw new Error(`Match not found: ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch match';
      setError(msg);
      return null;
    }
  }, [backendUrl, matchId]);

  // Connect WebSocket for live updates
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const matchData = await fetchMatchState();
      if (!mounted || !matchData) return;

      // Convert backend board state to Marrakech GameState for display
      if (matchData.currentBoard) {
        const gameState = convertBackendToGameState(matchData);
        store.syncState(gameState);
      }
      setLoading(false);

      // Connect WebSocket if match is active
      if (matchData.status === 'active' || matchData.status === 'starting') {
        const ws = new WebSocket(`${wsUrl}/ws/matches/${matchId}`);
        wsRef.current = ws;

        ws.onopen = () => {
          if (mounted) setConnected(true);
        };

        ws.onmessage = (event) => {
          if (!mounted) return;
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'match:move' || msg.type === 'match:state') {
              // Refetch full state on updates
              fetchMatchState().then((data) => {
                if (data?.currentBoard && mounted) {
                  store.syncState(convertBackendToGameState(data));
                }
              });
            }
            if (msg.type === 'match:end') {
              fetchMatchState().then((data) => {
                if (data && mounted) {
                  store.syncState(convertBackendToGameState(data));
                }
              });
            }
          } catch {
            // ignore parse errors
          }
        };

        ws.onclose = () => {
          if (mounted) setConnected(false);
        };
      }
    };

    init();

    // Poll for updates as fallback
    const pollInterval = setInterval(async () => {
      if (!mounted) return;
      const data = await fetchMatchState();
      if (data?.currentBoard && mounted) {
        store.syncState(convertBackendToGameState(data));
      }
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      wsRef.current?.close();
    };
  }, [matchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8E7] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#C19A3E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#8B6914] font-medium">Loading Arena Match...</p>
          <p className="text-xs text-[#8B6914]/60">Match ID: {matchId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFF8E7] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-2xl">⚠️</p>
          <p className="text-[#C0392B] font-medium">{error}</p>
          <a href="/" className="text-sm text-[#C19A3E] hover:underline block">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7]">
      {/* Arena Header */}
      <div className="bg-gradient-to-r from-[#2C1810] to-[#4A154B] text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#C19A3E] font-bold text-lg">AlphArena</span>
          <span className="text-white/40">|</span>
          <span className="text-sm text-white/80">Live Match</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}
          />
          <span className="text-xs text-white/60">
            {connected ? 'Live' : 'Reconnecting...'}
          </span>
        </div>
      </div>

      {/* Game Display */}
      <div className="p-4">
        <GameHeader
          currentPlayer={store.players[store.currentPlayerIndex]}
          phase={store.phase}
          turnNumber={store.turnNumber}
        />
        <div className="flex flex-col lg:flex-row gap-4 max-w-7xl mx-auto">
          <PlayerPanel
            players={store.players}
            currentPlayerIndex={store.currentPlayerIndex}
          />
          <div className="flex-1">
            <GameBoard
              board={store.board}
              assam={store.assam}
              validPlacements={store.validPlacements}
              selectedPlacement={store.selectedPlacement}
              currentTribute={store.currentTribute}
              currentPlayerId={store.players[store.currentPlayerIndex]?.id ?? 0}
              phase={store.phase}
              movePath={store.movePath}
              onCellClick={() => {}}
              onPlacementSelect={() => {}}
            />
          </div>
          <ActionLog actions={store.actionLog} />
        </div>
        {store.gameOver && (
          <GameOverScreen
            finalScores={store.finalScores}
            players={store.players}
            winner={store.winner}
            onPlayAgain={() => {}}
            onBackToMenu={() => window.location.href = '/'}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Convert AlphArena backend match data to local Marrakech GameState format.
 */
function convertBackendToGameState(matchData: Record<string, unknown>): GameState {
  const PLAYER_COLORS = [
    { primary: '#E74C3C', light: '#FADBD8', dark: '#C0392B', name: 'Rojo', tailwind: 'red' },
    { primary: '#3498DB', light: '#D6EAF8', dark: '#2176AE', name: 'Azul', tailwind: 'blue' },
  ];

  const board = (matchData.currentBoard as number[][])?.map((row: number[]) =>
    row.map((cell: number) =>
      cell > 0
        ? { playerId: cell - 1, carpetId: `arena_${cell}` }
        : null,
    ),
  ) ?? Array.from({ length: 7 }, () => Array(7).fill(null));

  const agents = matchData.agents as {
    a: { name: string; eloAtStart: number };
    b: { name: string; eloAtStart: number };
  };

  const status = matchData.status as string;
  const result = matchData.result as {
    winnerId?: string;
    finalScore?: { a: number; b: number };
  } | null;

  const players = [
    {
      id: 0,
      name: agents?.a?.name ?? 'Agent A',
      color: PLAYER_COLORS[0],
      dirhams: (result?.finalScore?.a ?? 30),
      carpetsRemaining: 0,
      eliminated: false,
    },
    {
      id: 1,
      name: agents?.b?.name ?? 'Agent B',
      color: PLAYER_COLORS[1],
      dirhams: (result?.finalScore?.b ?? 30),
      carpetsRemaining: 0,
      eliminated: false,
    },
  ];

  const isOver = status === 'completed' || status === 'error';

  return {
    mode: 'online' as const,
    numPlayers: 2,
    board,
    assam: { position: { row: 3, col: 3 }, direction: 'N' as const },
    players,
    currentPlayerIndex: (matchData.currentTurn as string) === 'b' ? 1 : 0,
    phase: isOver ? 'gameOver' : 'orient',
    lastDiceRoll: null,
    currentTribute: null,
    validPlacements: [],
    selectedPlacement: null,
    borderChoiceInfo: null,
    movePath: [],
    actionLog: [],
    gameOver: isOver,
    winner: isOver && result?.winnerId ? (result.winnerId === 'a' ? 0 : 1) : null,
    finalScores: isOver
      ? players
          .map((p) => ({
            playerId: p.id,
            name: p.name,
            dirhams: p.dirhams,
            visibleCells: 0,
            total: p.dirhams,
          }))
          .sort((a, b) => b.total - a.total)
      : [],
    turnNumber: (matchData.moveCount as number) ?? 0,
  };
}
