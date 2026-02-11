'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils/cn';
import type { CarpetCell } from '@/lib/game/types';
import { PLAYER_COLORS } from '@/lib/game/constants';

export interface EdgeInfo {
  type: 'same' | 'different' | 'empty';
  color: string | null; // neighbor carpet color when type === 'different'
}

interface BoardCellProps {
  row: number;
  col: number;
  cell: CarpetCell | null;
  isAssamHere: boolean;
  isValidPlacement: boolean;
  isHovered: boolean;
  isSelected: boolean;
  isTributeHighlight: boolean;
  previewColor: string | null;
  neighborEdges: { top: EdgeInfo; bottom: EdgeInfo; left: EdgeInfo; right: EdgeInfo };
  onClick: (row: number, col: number) => void;
  onHover: (row: number, col: number) => void;
  onHoverEnd: () => void;
}

function BoardCellComponent({
  row,
  col,
  cell,
  isAssamHere,
  isValidPlacement,
  isHovered,
  isSelected,
  isTributeHighlight,
  previewColor,
  neighborEdges,
  onClick,
  onHover,
  onHoverEnd,
}: BoardCellProps) {
  const playerColor = cell
    ? cell.playerId === -1
      ? { primary: '#9CA3AF', light: '#E5E7EB', dark: '#6B7280', name: 'Neutral', tailwind: 'gray' }
      : PLAYER_COLORS[cell.playerId]
    : null;

  const bgColor = previewColor
    ? previewColor
    : playerColor
      ? playerColor.primary
      : undefined;

  const hasCarpet = !!cell;

  // Build border styles based on edge types
  const edgeBorder = (edge: EdgeInfo, side: 'top' | 'bottom' | 'left' | 'right') => {
    if (edge.type === 'same') return 'none';
    if (edge.type === 'different') {
      // Two different carpets meet → thick dark fold line
      return `2px solid rgba(0,0,0,0.3)`;
    }
    // Carpet meets empty board
    if (hasCarpet) {
      // Dark top/left, light bottom/right for depth
      if (side === 'top' || side === 'left') return '1.5px solid rgba(0,0,0,0.22)';
      return '1.5px solid rgba(255,255,255,0.12)';
    }
    // Empty cell borders
    if (side === 'top' || side === 'left') return '1px solid rgba(139,105,20,0.15)';
    return '1px solid rgba(255,255,255,0.2)';
  };

  // Compute box shadow: elevated when carpet, deeper when bordering different carpet
  const hasDifferentNeighbor =
    neighborEdges.top.type === 'different' ||
    neighborEdges.bottom.type === 'different' ||
    neighborEdges.left.type === 'different' ||
    neighborEdges.right.type === 'different';

  const carpetShadow = hasCarpet
    ? hasDifferentNeighbor
      ? 'inset 0 1px 3px rgba(0,0,0,0.2), inset 0 -1px 2px rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.1)'
      : 'inset 0 1px 2px rgba(0,0,0,0.12), inset 0 -1px 1px rgba(255,255,255,0.08)'
    : undefined;

  return (
    <div
      className={cn(
        'aspect-square relative transition-all duration-150 cursor-default',
        !cell && !previewColor && 'bg-transparent',
        isValidPlacement && !isHovered && !isSelected && 'cursor-pointer ring-2 ring-inset ring-[#C19A3E]/50',
        isValidPlacement && 'cursor-pointer',
        isHovered && 'ring-2 ring-inset ring-[#C19A3E] z-10',
        isSelected && 'ring-2 ring-inset ring-yellow-400 z-10',
        isTributeHighlight && 'ring-2 ring-inset ring-yellow-400 animate-pulse',
      )}
      style={{
        backgroundColor: bgColor,
        opacity: previewColor ? 0.6 : 1,
        borderTop: edgeBorder(neighborEdges.top, 'top'),
        borderBottom: edgeBorder(neighborEdges.bottom, 'bottom'),
        borderLeft: edgeBorder(neighborEdges.left, 'left'),
        borderRight: edgeBorder(neighborEdges.right, 'right'),
        boxShadow: carpetShadow,
      }}
      onClick={() => onClick(row, col)}
      onMouseEnter={() => onHover(row, col)}
      onMouseLeave={onHoverEnd}
    >
      {/* ── Carpet underneath peek-through strips ── */}
      {/* When this carpet borders a DIFFERENT carpet, show a thin sliver of the neighbor's color */}
      {hasCarpet && neighborEdges.top.type === 'different' && neighborEdges.top.color && (
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{ height: 3, backgroundColor: neighborEdges.top.color, opacity: 0.35 }}
        />
      )}
      {hasCarpet && neighborEdges.bottom.type === 'different' && neighborEdges.bottom.color && (
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ height: 3, backgroundColor: neighborEdges.bottom.color, opacity: 0.35 }}
        />
      )}
      {hasCarpet && neighborEdges.left.type === 'different' && neighborEdges.left.color && (
        <div
          className="absolute top-0 left-0 bottom-0 pointer-events-none"
          style={{ width: 3, backgroundColor: neighborEdges.left.color, opacity: 0.35 }}
        />
      )}
      {hasCarpet && neighborEdges.right.type === 'different' && neighborEdges.right.color && (
        <div
          className="absolute top-0 right-0 bottom-0 pointer-events-none"
          style={{ width: 3, backgroundColor: neighborEdges.right.color, opacity: 0.35 }}
        />
      )}

      {/* ── Carpet fabric pattern ── */}
      {cell && playerColor && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Woven fabric base texture */}
          <svg
            className="absolute inset-0"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern
                id={`weave-${row}-${col}`}
                patternUnits="userSpaceOnUse"
                width="4"
                height="4"
              >
                <rect x="0" y="0" width="2" height="2" fill="rgba(0,0,0,0.04)" />
                <rect x="2" y="2" width="2" height="2" fill="rgba(0,0,0,0.04)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#weave-${row}-${col})`} />
          </svg>

          {/* Moroccan geometric pattern overlay */}
          <svg
            className="absolute inset-0"
            width="100%"
            height="100%"
            viewBox="0 0 32 32"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern
                id={`rug-${row}-${col}`}
                patternUnits="userSpaceOnUse"
                width="16"
                height="16"
              >
                {/* 8-pointed star */}
                <path d="M8 0L10 6L16 8L10 10L8 16L6 10L0 8L6 6Z" fill="white" opacity="0.1" />
                {/* Inner diamond */}
                <path d="M8 4L12 8L8 12L4 8Z" fill="white" opacity="0.07" />
                {/* Center jewel */}
                <circle cx="8" cy="8" r="1.2" fill="white" opacity="0.14" />
                {/* Corner accents */}
                <circle cx="0" cy="0" r="1.5" fill="white" opacity="0.06" />
                <circle cx="16" cy="0" r="1.5" fill="white" opacity="0.06" />
                <circle cx="0" cy="16" r="1.5" fill="white" opacity="0.06" />
                <circle cx="16" cy="16" r="1.5" fill="white" opacity="0.06" />
                {/* Cross threads */}
                <line x1="0" y1="8" x2="4" y2="8" stroke="white" strokeWidth="0.4" opacity="0.07" />
                <line x1="12" y1="8" x2="16" y2="8" stroke="white" strokeWidth="0.4" opacity="0.07" />
                <line x1="8" y1="0" x2="8" y2="4" stroke="white" strokeWidth="0.4" opacity="0.07" />
                <line x1="8" y1="12" x2="8" y2="16" stroke="white" strokeWidth="0.4" opacity="0.07" />
              </pattern>
            </defs>
            <rect width="32" height="32" fill={`url(#rug-${row}-${col})`} />
          </svg>

          {/* Subtle fabric sheen gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
            }}
          />
        </div>
      )}

      {/* ── Carpet edge fringe (where carpet meets empty board) ── */}
      {hasCarpet && neighborEdges.top.type === 'empty' && (
        <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ height: 2 }}>
          <div className="w-full h-full" style={{
            background: `repeating-linear-gradient(90deg, ${playerColor?.dark || '#666'} 0px, ${playerColor?.dark || '#666'} 1px, transparent 1px, transparent 3px)`,
            opacity: 0.3,
          }} />
        </div>
      )}
      {hasCarpet && neighborEdges.bottom.type === 'empty' && (
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: 2 }}>
          <div className="w-full h-full" style={{
            background: `repeating-linear-gradient(90deg, ${playerColor?.dark || '#666'} 0px, ${playerColor?.dark || '#666'} 1px, transparent 1px, transparent 3px)`,
            opacity: 0.3,
          }} />
        </div>
      )}
      {hasCarpet && neighborEdges.left.type === 'empty' && (
        <div className="absolute top-0 left-0 bottom-0 pointer-events-none" style={{ width: 2 }}>
          <div className="w-full h-full" style={{
            background: `repeating-linear-gradient(0deg, ${playerColor?.dark || '#666'} 0px, ${playerColor?.dark || '#666'} 1px, transparent 1px, transparent 3px)`,
            opacity: 0.3,
          }} />
        </div>
      )}
      {hasCarpet && neighborEdges.right.type === 'empty' && (
        <div className="absolute top-0 right-0 bottom-0 pointer-events-none" style={{ width: 2 }}>
          <div className="w-full h-full" style={{
            background: `repeating-linear-gradient(0deg, ${playerColor?.dark || '#666'} 0px, ${playerColor?.dark || '#666'} 1px, transparent 1px, transparent 3px)`,
            opacity: 0.3,
          }} />
        </div>
      )}

      {/* ── Empty cell: subtle grid mark ── */}
      {!cell && !previewColor && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full opacity-15"
            style={{
              width: 3,
              height: 3,
              backgroundColor: '#8B6914',
            }}
          />
        </div>
      )}

      {/* Valid placement shimmer */}
      {isValidPlacement && !isSelected && (
        <div className="absolute inset-0 bg-[#C19A3E]/8 pointer-events-none" />
      )}
    </div>
  );
}

export const BoardCell = memo(BoardCellComponent);
