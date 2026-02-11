'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import type { CarpetCell, CarpetPlacement, Position, Assam as AssamType, TributeInfo } from '@/lib/game/types';
import { BOARD_SIZE, PLAYER_COLORS } from '@/lib/game/constants';
import { BoardCell } from './BoardCell';
import { Assam } from './Assam';

interface GameBoardProps {
  board: (CarpetCell | null)[][];
  assam: AssamType;
  validPlacements: CarpetPlacement[];
  selectedPlacement: CarpetPlacement | null;
  currentTribute: TributeInfo | null;
  currentPlayerId: number;
  phase: string;
  movePath: Position[];
  onCellClick: (row: number, col: number) => void;
  onPlacementSelect: (placement: CarpetPlacement) => void;
}

const FRAME_PADDING = 28;

export function GameBoard({
  board,
  assam,
  validPlacements,
  selectedPlacement,
  currentTribute,
  currentPlayerId,
  phase,
  movePath,
  onCellClick,
  onPlacementSelect,
}: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(0);
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);
  const [firstClick, setFirstClick] = useState<Position | null>(null);

  useEffect(() => {
    const updateSize = () => {
      if (boardRef.current) {
        setCellSize(boardRef.current.offsetWidth / BOARD_SIZE);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const validCellKeys = useMemo(() => {
    const set = new Set<string>();
    for (const p of validPlacements) {
      set.add(`${p.cell1.row},${p.cell1.col}`);
      set.add(`${p.cell2.row},${p.cell2.col}`);
    }
    return set;
  }, [validPlacements]);

  const tributeCellKeys = useMemo(() => {
    const set = new Set<string>();
    if (currentTribute) {
      for (const cell of currentTribute.connectedCells) {
        set.add(`${cell.row},${cell.col}`);
      }
    }
    return set;
  }, [currentTribute]);

  const hoveredPlacement = useMemo(() => {
    if (!hoveredCell || !firstClick || phase !== 'place') return null;
    return validPlacements.find(
      (p) =>
        (p.cell1.row === firstClick.row &&
          p.cell1.col === firstClick.col &&
          p.cell2.row === hoveredCell.row &&
          p.cell2.col === hoveredCell.col) ||
        (p.cell2.row === firstClick.row &&
          p.cell2.col === firstClick.col &&
          p.cell1.row === hoveredCell.row &&
          p.cell1.col === hoveredCell.col)
    ) || null;
  }, [hoveredCell, firstClick, phase, validPlacements]);

  const getNeighborEdges = useCallback(
    (row: number, col: number) => {
      const cell = board[row]?.[col];
      const empty = { type: 'empty' as const, color: null };

      if (!cell) return { top: empty, bottom: empty, left: empty, right: empty };

      const cid = cell.carpetId;
      const getEdge = (nr: number, nc: number) => {
        if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) return empty;
        const neighbor = board[nr]?.[nc];
        if (!neighbor) return empty;
        if (neighbor.carpetId === cid) return { type: 'same' as const, color: null };
        const nColor = neighbor.playerId === -1
          ? '#6B7280'
          : PLAYER_COLORS[neighbor.playerId]?.primary || null;
        return { type: 'different' as const, color: nColor };
      };

      return {
        top: getEdge(row - 1, col),
        bottom: getEdge(row + 1, col),
        left: getEdge(row, col - 1),
        right: getEdge(row, col + 1),
      };
    },
    [board]
  );

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (phase !== 'place') {
        onCellClick(row, col);
        return;
      }

      const key = `${row},${col}`;
      if (!validCellKeys.has(key)) {
        setFirstClick(null);
        return;
      }

      if (!firstClick) {
        setFirstClick({ row, col });
        return;
      }

      const placement = validPlacements.find(
        (p) =>
          (p.cell1.row === firstClick.row &&
            p.cell1.col === firstClick.col &&
            p.cell2.row === row &&
            p.cell2.col === col) ||
          (p.cell2.row === firstClick.row &&
            p.cell2.col === firstClick.col &&
            p.cell1.row === row &&
            p.cell1.col === col)
      );

      if (placement) {
        onPlacementSelect(placement);
        setFirstClick(null);
        setHoveredCell(null);
      } else {
        setFirstClick({ row, col });
      }
    },
    [phase, firstClick, validCellKeys, validPlacements, onCellClick, onPlacementSelect]
  );

  const handleCellHover = useCallback((row: number, col: number) => {
    setHoveredCell({ row, col });
  }, []);

  const handleCellHoverEnd = useCallback(() => {
    setHoveredCell(null);
  }, []);

  const previewCells = useMemo(() => {
    const map = new Map<string, string>();
    if (hoveredPlacement) {
      const color = PLAYER_COLORS[currentPlayerId]?.light || '#E8D5A3';
      map.set(`${hoveredPlacement.cell1.row},${hoveredPlacement.cell1.col}`, color);
      map.set(`${hoveredPlacement.cell2.row},${hoveredPlacement.cell2.col}`, color);
    }
    return map;
  }, [hoveredPlacement, currentPlayerId]);

  const firstClickKey = firstClick ? `${firstClick.row},${firstClick.col}` : null;

  const gridWidth = BOARD_SIZE * cellSize;
  const arrowColor = 'rgba(193,154,62,0.5)';
  const arrowStroke = 1.5;

  return (
    <div className="relative w-full max-w-[640px] mx-auto select-none">
      {/* Wooden frame */}
      <div
        className="wood-frame rounded-2xl relative"
        style={{ padding: FRAME_PADDING }}
      >
        {/* ── Corner brass studs ── */}
        {[
          { top: 5, left: 5 },
          { top: 5, right: 5 },
          { bottom: 5, left: 5 },
          { bottom: 5, right: 5 },
        ].map((pos, i) => (
          <div
            key={`corner-${i}`}
            className="absolute w-4 h-4 rounded-full pointer-events-none"
            style={{
              ...pos,
              background: 'radial-gradient(circle at 35% 35%, #F0DFA8, #C19A3E 45%, #7A5A20 100%)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
            }}
          />
        ))}

        {/* ── Mid-edge brass studs ── */}
        {[
          { top: 5, left: '50%', transform: 'translateX(-50%)' } as const,
          { bottom: 5, left: '50%', transform: 'translateX(-50%)' } as const,
          { left: 5, top: '50%', transform: 'translateY(-50%)' } as const,
          { right: 5, top: '50%', transform: 'translateY(-50%)' } as const,
        ].map((pos, i) => (
          <div
            key={`mid-${i}`}
            className="absolute w-3 h-3 rounded-full pointer-events-none"
            style={{
              ...pos,
              background: 'radial-gradient(circle at 35% 35%, #F0DFA8, #C19A3E 45%, #7A5A20 100%)',
              boxShadow: '0 1px 1px rgba(0,0,0,0.3)',
            }}
          />
        ))}

        {/* ── Inner border inlay line ── */}
        <div
          className="absolute pointer-events-none rounded-lg"
          style={{
            top: FRAME_PADDING - 4,
            left: FRAME_PADDING - 4,
            right: FRAME_PADDING - 4,
            bottom: FRAME_PADDING - 4,
            border: '1px solid rgba(193,154,62,0.35)',
            boxShadow: '0 0 2px rgba(0,0,0,0.15)',
          }}
        />

        {/* ── U-turn curves on RIGHT edge ── */}
        {cellSize > 0 && Array.from({ length: BOARD_SIZE - 1 }, (_, i) => {
          const w = FRAME_PADDING - 10;
          const h = cellSize;
          return (
            <svg
              key={`r-${i}`}
              className="absolute pointer-events-none"
              style={{
                left: FRAME_PADDING + gridWidth + 5,
                top: FRAME_PADDING + i * cellSize + cellSize / 2,
                width: w,
                height: h,
              }}
            >
              <path
                d={`M 0 0 C ${w * 0.9} 0, ${w * 0.9} ${h}, 0 ${h}`}
                stroke={arrowColor}
                strokeWidth={arrowStroke}
                fill="none"
                strokeLinecap="round"
              />
              {/* small dot at midpoint of curve */}
              <circle cx={w * 0.9} cy={h / 2} r={1.5} fill={arrowColor} />
            </svg>
          );
        })}

        {/* ── U-turn curves on LEFT edge ── */}
        {cellSize > 0 && Array.from({ length: BOARD_SIZE - 1 }, (_, i) => {
          const w = FRAME_PADDING - 10;
          const h = cellSize;
          return (
            <svg
              key={`l-${i}`}
              className="absolute pointer-events-none"
              style={{
                left: 5,
                top: FRAME_PADDING + i * cellSize + cellSize / 2,
                width: w,
                height: h,
              }}
            >
              <path
                d={`M ${w} 0 C ${w * 0.1} 0, ${w * 0.1} ${h}, ${w} ${h}`}
                stroke={arrowColor}
                strokeWidth={arrowStroke}
                fill="none"
                strokeLinecap="round"
              />
              <circle cx={w * 0.1} cy={h / 2} r={1.5} fill={arrowColor} />
            </svg>
          );
        })}

        {/* ── U-turn curves on TOP edge ── */}
        {cellSize > 0 && Array.from({ length: BOARD_SIZE - 1 }, (_, j) => {
          const w = cellSize;
          const h = FRAME_PADDING - 10;
          return (
            <svg
              key={`t-${j}`}
              className="absolute pointer-events-none"
              style={{
                left: FRAME_PADDING + j * cellSize + cellSize / 2,
                top: 5,
                width: w,
                height: h,
              }}
            >
              <path
                d={`M 0 ${h} C 0 ${h * 0.1}, ${w} ${h * 0.1}, ${w} ${h}`}
                stroke={arrowColor}
                strokeWidth={arrowStroke}
                fill="none"
                strokeLinecap="round"
              />
              <circle cx={w / 2} cy={h * 0.1} r={1.5} fill={arrowColor} />
            </svg>
          );
        })}

        {/* ── U-turn curves on BOTTOM edge ── */}
        {cellSize > 0 && Array.from({ length: BOARD_SIZE - 1 }, (_, j) => {
          const w = cellSize;
          const h = FRAME_PADDING - 10;
          return (
            <svg
              key={`b-${j}`}
              className="absolute pointer-events-none"
              style={{
                left: FRAME_PADDING + j * cellSize + cellSize / 2,
                top: FRAME_PADDING + gridWidth + 5,
                width: w,
                height: h,
              }}
            >
              <path
                d={`M 0 0 C 0 ${h * 0.9}, ${w} ${h * 0.9}, ${w} 0`}
                stroke={arrowColor}
                strokeWidth={arrowStroke}
                fill="none"
                strokeLinecap="round"
              />
              <circle cx={w / 2} cy={h * 0.9} r={1.5} fill={arrowColor} />
            </svg>
          );
        })}

        {/* ── Playing surface ── */}
        <div
          ref={boardRef}
          className="relative board-surface rounded-md overflow-hidden"
          style={{
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.25), inset 0 0 3px rgba(0,0,0,0.15)',
          }}
        >
          {/* Grid */}
          <div className="grid grid-cols-7">
            {board.length > 0 &&
              board.map((row, rowIdx) =>
                row.map((cell, colIdx) => {
                  const key = `${rowIdx},${colIdx}`;
                  const isAssam =
                    assam.position.row === rowIdx && assam.position.col === colIdx;
                  return (
                    <BoardCell
                      key={key}
                      row={rowIdx}
                      col={colIdx}
                      cell={cell}
                      isAssamHere={isAssam}
                      isValidPlacement={phase === 'place' && validCellKeys.has(key)}
                      isHovered={
                        hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx
                      }
                      isSelected={firstClickKey === key}
                      isTributeHighlight={tributeCellKeys.has(key)}
                      previewColor={previewCells.get(key) || null}
                      neighborEdges={getNeighborEdges(rowIdx, colIdx)}
                      onClick={handleCellClick}
                      onHover={handleCellHover}
                      onHoverEnd={handleCellHoverEnd}
                    />
                  );
                })
              )}
          </div>

          {/* Move path trail */}
          {cellSize > 0 && movePath.length > 1 && (
            <div className="absolute inset-0 pointer-events-none z-10">
              {movePath.slice(1, -1).map((pos, i) => {
                const x = pos.col * cellSize + cellSize / 2;
                const y = pos.row * cellSize + cellSize / 2;
                const opacity = 0.3 + (i / movePath.length) * 0.5;
                return (
                  <div
                    key={`path-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: cellSize * 0.18,
                      height: cellSize * 0.18,
                      left: x - cellSize * 0.09,
                      top: y - cellSize * 0.09,
                      backgroundColor: `rgba(250,204,21,${opacity})`,
                      boxShadow: `0 0 4px rgba(250,204,21,${opacity * 0.5})`,
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Assam overlay */}
          {cellSize > 0 && board.length > 0 && (
            <Assam
              position={assam.position}
              direction={assam.direction}
              boardSize={BOARD_SIZE}
              cellSize={cellSize}
            />
          )}
        </div>
      </div>
    </div>
  );
}
