'use client';

import { create } from 'zustand';
import type { GameMode, Player } from '@/lib/game/types';

interface LobbyState {
  screen: 'menu' | 'localSetup' | 'onlineSetup' | 'waiting' | 'blockchainSetup' | 'blockchainWaiting';
  mode: GameMode;
  numPlayers: number;
  playerNames: string[];
  roomId: string;
  onlinePlayers: Player[];
  isCreator: boolean;
  myPlayerId: number | null;
  // Blockchain-specific
  gameContractAddress: string;
  walletAddress: string;

  setScreen: (screen: LobbyState['screen']) => void;
  setMode: (mode: GameMode) => void;
  setNumPlayers: (n: number) => void;
  setPlayerName: (index: number, name: string) => void;
  setRoomId: (id: string) => void;
  setOnlinePlayers: (players: Player[]) => void;
  setIsCreator: (v: boolean) => void;
  setMyPlayerId: (id: number | null) => void;
  setGameContractAddress: (address: string) => void;
  setWalletAddress: (address: string) => void;
  reset: () => void;
}

export const useLobbyStore = create<LobbyState>((set) => ({
  screen: 'menu',
  mode: 'local',
  numPlayers: 2,
  playerNames: ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4'],
  roomId: '',
  onlinePlayers: [],
  isCreator: false,
  myPlayerId: null,
  gameContractAddress: '',
  walletAddress: '',

  setScreen: (screen) => set({ screen }),
  setMode: (mode) => set({ mode }),
  setNumPlayers: (numPlayers) => set({ numPlayers }),
  setPlayerName: (index, name) =>
    set((state) => {
      const names = [...state.playerNames];
      names[index] = name;
      return { playerNames: names };
    }),
  setRoomId: (roomId) => set({ roomId }),
  setOnlinePlayers: (onlinePlayers) => set({ onlinePlayers }),
  setIsCreator: (isCreator) => set({ isCreator }),
  setMyPlayerId: (myPlayerId) => set({ myPlayerId }),
  setGameContractAddress: (gameContractAddress) => set({ gameContractAddress }),
  setWalletAddress: (walletAddress) => set({ walletAddress }),
  reset: () =>
    set({
      screen: 'menu',
      mode: 'local',
      numPlayers: 2,
      playerNames: ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4'],
      roomId: '',
      onlinePlayers: [],
      isCreator: false,
      myPlayerId: null,
      gameContractAddress: '',
      walletAddress: '',
    }),
}));
