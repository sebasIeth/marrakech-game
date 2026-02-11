'use client';

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import type { CarpetCell } from '@/lib/game/types';
import { PLAYER_COLORS } from '@/lib/game/constants';

export interface EdgeInfo {
  type: 'same' | 'different' | 'empty';
  color: string | null;
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

/** Simple deterministic hash from a string → [0,1) */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return ((h & 0x7fffffff) % 1000) / 1000;
}

const NEUTRAL_COLOR = { primary: '#9CA3AF', light: '#E5E7EB', dark: '#6B7280', name: 'Neutral', tailwind: 'gray' };

function BoardCellComponent({
  row,
  col,
  cell,
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
      ? NEUTRAL_COLOR
      : PLAYER_COLORS[cell.playerId]
    : null;

  const hasCarpet = !!cell;

  // Per-carpet random values (stable across renders)
  const carpetRandom = useMemo(() => {
    if (!cell) return null;
    const h = hashStr(cell.carpetId);
    const h2 = hashStr(cell.carpetId + '_2');
    return {
      rotation: (h - 0.5) * 3.0,   // ±1.5 deg
      offsetX: (h2 - 0.5) * 1.6,   // ±0.8px
      offsetY: (h - 0.3) * 1.2,    // slight Y shift
    };
  }, [cell]);

  // Determine which corners to round (corner is rounded if both adjacent edges are NOT 'same')
  const sameTop = neighborEdges.top.type === 'same';
  const sameBottom = neighborEdges.bottom.type === 'same';
  const sameLeft = neighborEdges.left.type === 'same';
  const sameRight = neighborEdges.right.type === 'same';

  const borderRadius = hasCarpet
    ? [
        !sameTop && !sameLeft ? 5 : 0,
        !sameTop && !sameRight ? 5 : 0,
        !sameBottom && !sameRight ? 5 : 0,
        !sameBottom && !sameLeft ? 5 : 0,
      ]
        .map((v) => `${v}px`)
        .join(' ')
    : '0';

  // Inset: small gap on exposed edges so the carpet "floats"
  const inset = {
    top: sameTop ? 0 : 2,
    bottom: sameBottom ? 0 : 2,
    left: sameLeft ? 0 : 2,
    right: sameRight ? 0 : 2,
  };

  // Where carpet meets a different carpet: overlapping shadow
  const hasDifferentNeighbor =
    neighborEdges.top.type === 'different' ||
    neighborEdges.bottom.type === 'different' ||
    neighborEdges.left.type === 'different' ||
    neighborEdges.right.type === 'different';

  // Build shadow for carpet elevation
  const shadow = hasCarpet
    ? hasDifferentNeighbor
      ? '0 2px 6px rgba(0,0,0,0.28), 0 1px 2px rgba(0,0,0,0.18)'
      : '0 1px 3px rgba(0,0,0,0.18), 0 0.5px 1px rgba(0,0,0,0.12)'
    : undefined;

  const bgColor = previewColor || playerColor?.primary;

  return (
    <div
      className={cn(
        'aspect-square relative cursor-default',
        isValidPlacement && 'cursor-pointer',
        isTributeHighlight && 'z-20',
      )}
      style={{
        boxShadow: 'inset 0 0 0 0.5px rgba(139,105,20,0.18)',
      }}
      onClick={() => onClick(row, col)}
      onMouseEnter={() => onHover(row, col)}
      onMouseLeave={onHoverEnd}
    >
      {/* Empty cell dot */}
      {!cell && !previewColor && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full opacity-15"
            style={{ width: 3, height: 3, backgroundColor: '#8B6914' }}
          />
        </div>
      )}

      {/* Valid placement indicator (before carpet) */}
      {isValidPlacement && !isSelected && !previewColor && (
        <div
          className="absolute inset-1 rounded-md pointer-events-none"
          style={{
            border: '2px dashed rgba(193,154,62,0.45)',
            background: 'rgba(193,154,62,0.06)',
          }}
        />
      )}

      {/* Hover highlight */}
      {isHovered && isValidPlacement && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ background: 'rgba(193,154,62,0.12)' }}
        />
      )}

      {/* Selected cell ring */}
      {isSelected && (
        <div
          className="absolute inset-0.5 rounded-md pointer-events-none z-10"
          style={{ border: '2px solid rgba(250,204,21,0.8)' }}
        />
      )}

      {/* Tribute pulse */}
      {isTributeHighlight && (
        <div
          className="absolute inset-0 pointer-events-none z-10 animate-pulse"
          style={{
            boxShadow: 'inset 0 0 0 2px rgba(250,204,21,0.7)',
            borderRadius,
          }}
        />
      )}

      {/* Preview carpet (semi-transparent) */}
      {previewColor && !cell && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: 2, left: 2, right: 2, bottom: 2,
            borderRadius: '4px',
            backgroundColor: previewColor,
            opacity: 0.55,
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}
        />
      )}

      {/* ── Underlying carpet peek-through strips ── */}
      {hasCarpet && (
        <>
          {neighborEdges.top.type === 'different' && neighborEdges.top.color && (
            <div
              className="absolute pointer-events-none"
              style={{
                top: 0, left: sameLeft ? 0 : 1, right: sameRight ? 0 : 1, height: 3,
                backgroundColor: neighborEdges.top.color,
                borderRadius: `${!sameLeft ? 3 : 0}px ${!sameRight ? 3 : 0}px 0 0`,
                zIndex: 1,
                filter: 'brightness(0.85)',
              }}
            />
          )}
          {neighborEdges.bottom.type === 'different' && neighborEdges.bottom.color && (
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: 0, left: sameLeft ? 0 : 1, right: sameRight ? 0 : 1, height: 3,
                backgroundColor: neighborEdges.bottom.color,
                borderRadius: `0 0 ${!sameRight ? 3 : 0}px ${!sameLeft ? 3 : 0}px`,
                zIndex: 1,
                filter: 'brightness(0.85)',
              }}
            />
          )}
          {neighborEdges.left.type === 'different' && neighborEdges.left.color && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: 0, top: sameTop ? 0 : 1, bottom: sameBottom ? 0 : 1, width: 3,
                backgroundColor: neighborEdges.left.color,
                borderRadius: `${!sameTop ? 3 : 0}px 0 0 ${!sameBottom ? 3 : 0}px`,
                zIndex: 1,
                filter: 'brightness(0.85)',
              }}
            />
          )}
          {neighborEdges.right.type === 'different' && neighborEdges.right.color && (
            <div
              className="absolute pointer-events-none"
              style={{
                right: 0, top: sameTop ? 0 : 1, bottom: sameBottom ? 0 : 1, width: 3,
                backgroundColor: neighborEdges.right.color,
                borderRadius: `0 ${!sameTop ? 3 : 0}px ${!sameBottom ? 3 : 0}px 0`,
                zIndex: 1,
                filter: 'brightness(0.85)',
              }}
            />
          )}
        </>
      )}

      {/* ── The actual carpet piece ── */}
      {hasCarpet && playerColor && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: inset.top,
            left: inset.left,
            right: inset.right,
            bottom: inset.bottom,
            borderRadius,
            backgroundColor: bgColor,
            boxShadow: shadow,
            transform: carpetRandom
              ? `rotate(${carpetRandom.rotation}deg) translate(${carpetRandom.offsetX}px, ${carpetRandom.offsetY}px)`
              : undefined,
            zIndex: hasDifferentNeighbor ? 5 : 2,
          }}
        >
          {/* Fabric weave texture */}
          <svg
            className="absolute inset-0"
            width="100%"
            height="100%"
            style={{ borderRadius }}
            preserveAspectRatio="none"
          >
            <defs>
              <pattern
                id={`w-${row}-${col}`}
                patternUnits="userSpaceOnUse"
                width="6"
                height="6"
              >
                <rect x="0" y="0" width="3" height="3" fill="rgba(255,255,255,0.06)" />
                <rect x="3" y="3" width="3" height="3" fill="rgba(255,255,255,0.06)" />
                <rect x="0" y="3" width="3" height="3" fill="rgba(0,0,0,0.04)" />
                <rect x="3" y="0" width="3" height="3" fill="rgba(0,0,0,0.04)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#w-${row}-${col})`} rx="0" />
          </svg>

          {/* Moroccan geometric motif */}
          <svg
            className="absolute inset-0"
            width="100%"
            height="100%"
            viewBox="0 0 40 40"
            style={{ borderRadius }}
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern
                id={`m-${row}-${col}`}
                patternUnits="userSpaceOnUse"
                width="20"
                height="20"
              >
                {/* 8-pointed star */}
                <path d="M10 1L12.5 7.5L19 10L12.5 12.5L10 19L7.5 12.5L1 10L7.5 7.5Z" fill="rgba(255,255,255,0.12)" />
                {/* Inner diamond */}
                <path d="M10 5L15 10L10 15L5 10Z" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
                {/* Center dot */}
                <circle cx="10" cy="10" r="1.4" fill="rgba(255,255,255,0.16)" />
                {/* Corner arcs */}
                <path d="M0 3 A3 3 0 0 1 3 0" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
                <path d="M17 0 A3 3 0 0 1 20 3" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
                <path d="M20 17 A3 3 0 0 1 17 20" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
                <path d="M3 20 A3 3 0 0 1 0 17" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="40" height="40" fill={`url(#m-${row}-${col})`} />
          </svg>

          {/* Cloth sheen gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius,
              background: `linear-gradient(145deg, rgba(255,255,255,0.10) 0%, transparent 40%, rgba(0,0,0,0.10) 100%)`,
            }}
          />

          {/* Top-left cloth highlight */}
          {!sameTop && !sameLeft && (
            <div
              className="absolute pointer-events-none"
              style={{
                top: 0, left: 0,
                width: '50%', height: '50%',
                borderRadius: `${!sameTop && !sameLeft ? 5 : 0}px 0 0 0`,
                background: 'radial-gradient(ellipse at 15% 15%, rgba(255,255,255,0.12), transparent 70%)',
              }}
            />
          )}

          {/* Fringe on exposed edges */}
          {!sameTop && (
            <div
              className="absolute top-0 left-1 right-1 pointer-events-none"
              style={{
                height: 2,
                background: `repeating-linear-gradient(90deg, ${playerColor.dark} 0px, ${playerColor.dark} 1.5px, transparent 1.5px, transparent 4px)`,
                opacity: 0.25,
                borderRadius: `${!sameLeft ? 5 : 0}px ${!sameRight ? 5 : 0}px 0 0`,
              }}
            />
          )}
          {!sameBottom && (
            <div
              className="absolute bottom-0 left-1 right-1 pointer-events-none"
              style={{
                height: 2,
                background: `repeating-linear-gradient(90deg, ${playerColor.dark} 0px, ${playerColor.dark} 1.5px, transparent 1.5px, transparent 4px)`,
                opacity: 0.25,
                borderRadius: `0 0 ${!sameRight ? 5 : 0}px ${!sameLeft ? 5 : 0}px`,
              }}
            />
          )}
          {!sameLeft && (
            <div
              className="absolute left-0 top-1 bottom-1 pointer-events-none"
              style={{
                width: 2,
                background: `repeating-linear-gradient(180deg, ${playerColor.dark} 0px, ${playerColor.dark} 1.5px, transparent 1.5px, transparent 4px)`,
                opacity: 0.25,
                borderRadius: `${!sameTop ? 5 : 0}px 0 0 ${!sameBottom ? 5 : 0}px`,
              }}
            />
          )}
          {!sameRight && (
            <div
              className="absolute right-0 top-1 bottom-1 pointer-events-none"
              style={{
                width: 2,
                background: `repeating-linear-gradient(180deg, ${playerColor.dark} 0px, ${playerColor.dark} 1.5px, transparent 1.5px, transparent 4px)`,
                opacity: 0.25,
                borderRadius: `0 ${!sameTop ? 5 : 0}px ${!sameBottom ? 5 : 0}px 0`,
              }}
            />
          )}

          {/* Inner border stitch effect */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: 3, left: 3, right: 3, bottom: 3,
              borderRadius: `${!sameTop && !sameLeft ? 3 : 0}px ${!sameTop && !sameRight ? 3 : 0}px ${!sameBottom && !sameRight ? 3 : 0}px ${!sameBottom && !sameLeft ? 3 : 0}px`,
              border: '1px dashed rgba(255,255,255,0.10)',
            }}
          />
        </div>
      )}
    </div>
  );
}

export const BoardCell = memo(BoardCellComponent);
