'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useGameStore } from '@/lib/store/gameStore';
import { useLobbyStore } from '@/lib/store/lobbyStore';
import type { CarpetPlacement, Direction, GameState, Player } from '@/lib/game/types';

// ── Module-level singleton socket ──
// Persists across component mounts/unmounts so it survives screen changes
let socket: Socket | null = null;
let socketInitialized = false;
let onGameStartedCallback: (() => void) | null = null;
let onDiceRolledCallback: ((value: number) => void) | null = null;

// Queue state updates while dice animation plays so Assam moves AFTER the overlay
let diceAnimationActive = false;
let pendingDiceState: GameState | null = null;

function getSocket(): Socket {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (socketUrl) {
      // External Socket.IO server (e.g. Render) — connect by URL
      socket = io(socketUrl, {
        path: '/api/socket/io',
        addTrailingSlash: false,
        autoConnect: false,
      });
    } else {
      // Same-origin (custom server.ts in dev / self-hosted)
      socket = io({
        path: '/api/socket/io',
        addTrailingSlash: false,
        autoConnect: false,
      });
    }
  }
  return socket;
}

export function useMultiplayer() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncState = useGameStore((s) => s.syncState);

  // Set up event listeners once
  useEffect(() => {
    const s = getSocket();

    if (socketInitialized) {
      // Already set up — just sync connection state
      setConnected(s.connected);
      return;
    }
    socketInitialized = true;

    s.on('connect', () => {
      setConnected(true);
    });

    s.on('disconnect', () => {
      setConnected(false);
    });

    s.on('room:created', (data: { roomId: string; playerId: number; player: Player }) => {
      const lobby = useLobbyStore.getState();
      lobby.setRoomId(data.roomId);
      lobby.setMyPlayerId(data.playerId);
      lobby.setIsCreator(true);
      lobby.setOnlinePlayers([data.player]);
      lobby.setScreen('waiting');
    });

    s.on('room:joined', (data: { playerId: number; players: Player[] }) => {
      const lobby = useLobbyStore.getState();
      lobby.setMyPlayerId(data.playerId);
      lobby.setOnlinePlayers(data.players);
      lobby.setScreen('waiting');
    });

    s.on('room:playerJoined', (data: { player: Player }) => {
      const lobby = useLobbyStore.getState();
      lobby.setOnlinePlayers([...lobby.onlinePlayers, data.player]);
    });

    s.on('room:playerLeft', (data: { playerId: number }) => {
      const lobby = useLobbyStore.getState();
      lobby.setOnlinePlayers(lobby.onlinePlayers.filter((p) => p.id !== data.playerId));
    });

    s.on('game:diceRolled', (data: { value: number }) => {
      diceAnimationActive = true;
      pendingDiceState = null;
      onDiceRolledCallback?.(data.value);
    });

    s.on('game:started', (data: { state: GameState }) => {
      syncState(data.state);
      onGameStartedCallback?.();
    });

    s.on('game:stateUpdate', (data: { state: GameState }) => {
      if (diceAnimationActive) {
        // Queue the update — it will be applied when the dice overlay finishes
        pendingDiceState = data.state;
      } else {
        syncState(data.state);
      }
    });

    s.on('game:error', (data: { message: string }) => {
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    // No cleanup — socket is intentionally kept alive across screens
  }, [syncState]);

  const connect = useCallback(() => {
    const s = getSocket();
    if (!s.connected) {
      s.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      socket = null;
      socketInitialized = false;
      setConnected(false);
    }
  }, []);

  const createRoom = useCallback(
    (playerName: string, numPlayers: number) => {
      getSocket().emit('room:create', { playerName, numPlayers });
    },
    []
  );

  const joinRoom = useCallback(
    (roomId: string, playerName: string) => {
      getSocket().emit('room:join', { roomId, playerName });
    },
    []
  );

  const startGame = useCallback(() => {
    getSocket().emit('room:start');
  }, []);

  const sendOrient = useCallback((direction: Direction) => {
    getSocket().emit('game:orient', { direction });
  }, []);

  const sendRoll = useCallback(() => {
    getSocket().emit('game:roll', {});
  }, []);

  const sendPlace = useCallback((placement: CarpetPlacement) => {
    getSocket().emit('game:place', { placement });
  }, []);

  const onGameStarted = useCallback((cb: () => void) => {
    onGameStartedCallback = cb;
  }, []);

  const onDiceRolled = useCallback((cb: (value: number) => void) => {
    onDiceRolledCallback = cb;
  }, []);

  // Call after the dice overlay animation finishes to apply the queued state
  const flushDiceState = useCallback(() => {
    diceAnimationActive = false;
    if (pendingDiceState) {
      syncState(pendingDiceState);
      pendingDiceState = null;
    }
  }, [syncState]);

  return {
    connected,
    error,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    startGame,
    sendOrient,
    sendRoll,
    sendPlace,
    onGameStarted,
    onDiceRolled,
    flushDiceState,
  };
}
