'use client';

import { create } from 'zustand';
import type {
  CarpetPlacement,
  DiceResult,
  Direction,
  GameMode,
  GameState,
} from '@/lib/game/types';
import {
  advanceToNextPlayer,
  chooseBorderDirection,
  createInitialState,
  orientAssam,
  placeCarpet,
  processTribute,
  rollAndMoveAssam,
} from '@/lib/game/engine';

interface GameStore extends GameState {
  initGame: (numPlayers: number, mode: GameMode, playerNames?: string[]) => void;
  orientAssam: (direction: Direction) => void;
  rollDice: (preRolledDice?: DiceResult) => void;
  chooseBorderDirection: (direction: Direction) => void;
  processTribute: () => void;
  placeCarpet: (placement: CarpetPlacement) => void;
  selectPlacement: (placement: CarpetPlacement | null) => void;
  skipPlace: () => void;
  resetGame: () => void;
  syncState: (state: GameState) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial default state
  mode: 'local',
  numPlayers: 2,
  board: [],
  assam: { position: { row: 3, col: 3 }, direction: 'N' },
  players: [],
  currentPlayerIndex: 0,
  phase: 'orient',
  lastDiceRoll: null,
  currentTribute: null,
  validPlacements: [],
  selectedPlacement: null,
  borderChoiceInfo: null,
  movePath: [],
  actionLog: [],
  gameOver: false,
  winner: null,
  finalScores: [],
  turnNumber: 1,

  initGame: (numPlayers, mode, playerNames) => {
    const state = createInitialState(numPlayers, mode, playerNames);
    set(state);
  },

  orientAssam: (direction) => {
    const state = get();
    if (state.phase !== 'orient') return;
    const newState = orientAssam(state, direction);
    set(newState);
  },

  rollDice: (preRolledDice?: DiceResult) => {
    const state = get();
    if (state.phase !== 'roll') return;
    const newState = rollAndMoveAssam(state, preRolledDice);
    set(newState);
  },

  chooseBorderDirection: (direction) => {
    const state = get();
    if (state.phase !== 'borderChoice') return;
    const newState = chooseBorderDirection(state, direction);
    set(newState);
  },

  processTribute: () => {
    const state = get();
    if (state.phase !== 'tribute') return;
    const newState = processTribute(state);
    set(newState);
  },

  placeCarpet: (placement) => {
    const state = get();
    if (state.phase !== 'place') return;
    const newState = placeCarpet(state, placement);
    set(newState);
  },

  selectPlacement: (placement) => {
    set({ selectedPlacement: placement });
  },

  skipPlace: () => {
    const state = get();
    set(advanceToNextPlayer(state));
  },

  resetGame: () => {
    set({
      board: [],
      players: [],
      phase: 'orient',
      gameOver: false,
      actionLog: [],
    });
  },

  syncState: (state) => {
    set(state);
  },
}));
