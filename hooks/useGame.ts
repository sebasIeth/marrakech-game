'use client';

import { useCallback } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import type { CarpetPlacement, Direction } from '@/lib/game/types';
import { getValidDirections } from '@/lib/game/engine';

export function useGame() {
  const store = useGameStore();

  const currentPlayer = store.players[store.currentPlayerIndex];

  const validDirections = store.phase === 'orient' && store.assam
    ? getValidDirections(store.assam.direction)
    : [];

  const orient = useCallback(
    (dir: Direction) => {
      store.orientAssam(dir);
    },
    [store]
  );

  const roll = useCallback(() => {
    store.rollDice();
  }, [store]);

  const tribute = useCallback(() => {
    store.processTribute();
  }, [store]);

  const place = useCallback(
    (placement: CarpetPlacement) => {
      store.placeCarpet(placement);
    },
    [store]
  );

  const select = useCallback(
    (placement: CarpetPlacement | null) => {
      store.selectPlacement(placement);
    },
    [store]
  );

  return {
    ...store,
    currentPlayer,
    validDirections,
    orient,
    roll,
    tribute,
    place,
    select,
  };
}
