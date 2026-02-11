'use client';

import { useState, useCallback, useMemo } from 'react';
import type { CarpetPlacement, Position } from '@/lib/game/types';

export function useCarpetPlacement(validPlacements: CarpetPlacement[]) {
  const [hoveredPlacement, setHoveredPlacement] =
    useState<CarpetPlacement | null>(null);
  const [selectedPlacement, setSelectedPlacement] =
    useState<CarpetPlacement | null>(null);

  const validCellSet = useMemo(() => {
    const set = new Set<string>();
    for (const p of validPlacements) {
      set.add(`${p.cell1.row},${p.cell1.col}`);
      set.add(`${p.cell2.row},${p.cell2.col}`);
    }
    return set;
  }, [validPlacements]);

  const isValidCell = useCallback(
    (row: number, col: number) => validCellSet.has(`${row},${col}`),
    [validCellSet]
  );

  const getPlacementsForCell = useCallback(
    (row: number, col: number): CarpetPlacement[] => {
      return validPlacements.filter(
        (p) =>
          (p.cell1.row === row && p.cell1.col === col) ||
          (p.cell2.row === row && p.cell2.col === col)
      );
    },
    [validPlacements]
  );

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      const placements = getPlacementsForCell(row, col);
      if (placements.length === 0) return;

      if (selectedPlacement) {
        // Check if click completes a placement
        const matching = validPlacements.find(
          (p) =>
            ((p.cell1.row === selectedPlacement.cell1.row &&
              p.cell1.col === selectedPlacement.cell1.col &&
              p.cell2.row === row &&
              p.cell2.col === col) ||
              (p.cell2.row === selectedPlacement.cell1.row &&
                p.cell2.col === selectedPlacement.cell1.col &&
                p.cell1.row === row &&
                p.cell1.col === col))
        );
        if (matching) {
          setSelectedPlacement(matching);
          return matching;
        }
      }

      // Start new selection
      setSelectedPlacement({
        cell1: { row, col },
        cell2: { row, col },
        playerId: -1,
        carpetId: '',
      });
      return null;
    },
    [selectedPlacement, validPlacements, getPlacementsForCell]
  );

  const handleCellHover = useCallback(
    (row: number, col: number) => {
      if (!selectedPlacement) return;
      const matching = validPlacements.find(
        (p) =>
          (p.cell1.row === selectedPlacement.cell1.row &&
            p.cell1.col === selectedPlacement.cell1.col &&
            p.cell2.row === row &&
            p.cell2.col === col) ||
          (p.cell2.row === selectedPlacement.cell1.row &&
            p.cell2.col === selectedPlacement.cell1.col &&
            p.cell1.row === row &&
            p.cell1.col === col)
      );
      setHoveredPlacement(matching || null);
    },
    [selectedPlacement, validPlacements]
  );

  const reset = useCallback(() => {
    setHoveredPlacement(null);
    setSelectedPlacement(null);
  }, []);

  return {
    hoveredPlacement,
    selectedPlacement,
    isValidCell,
    getPlacementsForCell,
    handleCellClick,
    handleCellHover,
    reset,
    setSelectedPlacement,
    setHoveredPlacement,
  };
}
