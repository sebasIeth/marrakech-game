'use client';

import { motion } from 'framer-motion';
import type { CarpetPlacement } from '@/lib/game/types';
import { PLAYER_COLORS } from '@/lib/game/constants';

interface CarpetOverlayProps {
  placement: CarpetPlacement;
  cellSize: number;
  isPreview?: boolean;
}

export function CarpetOverlay({ placement, cellSize, isPreview }: CarpetOverlayProps) {
  const color = PLAYER_COLORS[placement.playerId]?.primary || '#C19A3E';
  const { cell1, cell2 } = placement;

  const minRow = Math.min(cell1.row, cell2.row);
  const minCol = Math.min(cell1.col, cell2.col);
  const isHorizontal = cell1.row === cell2.row;

  const top = minRow * cellSize;
  const left = minCol * cellSize;
  const width = isHorizontal ? cellSize * 2 : cellSize;
  const height = isHorizontal ? cellSize : cellSize * 2;

  return (
    <motion.div
      initial={isPreview ? { opacity: 0.4 } : { scale: 0.8, opacity: 0 }}
      animate={isPreview ? { opacity: 0.5 } : { scale: 1, opacity: 1 }}
      className="absolute pointer-events-none z-10 rounded-sm"
      style={{
        top,
        left,
        width,
        height,
        backgroundColor: color,
        opacity: isPreview ? 0.4 : 0.9,
        border: `2px solid ${isPreview ? color : 'rgba(255,255,255,0.3)'}`,
      }}
    />
  );
}
