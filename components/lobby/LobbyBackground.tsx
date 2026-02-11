'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const GRID_COLS = 14;
const GRID_ROWS = 10;

const CARPET_PALETTE = [
  { base: '#C0392B', dark: '#962D22', light: '#E6B0AA', accent: '#F5B7B1' },
  { base: '#2874A6', dark: '#1B4F72', light: '#AED6F1', accent: '#85C1E9' },
  { base: '#1E8449', dark: '#145A32', light: '#A9DFBF', accent: '#82E0AA' },
  { base: '#7D3C98', dark: '#5B2C6F', light: '#D2B4DE', accent: '#BB8FCE' },
];

interface CarpetPair {
  r1: number; c1: number;
  r2: number; c2: number;
  colorIdx: number;
  patternSeed: number;
}

function generateCarpets(): { board: (number | null)[][]; carpets: CarpetPair[] } {
  const board: (number | null)[][] = Array.from({ length: GRID_ROWS }, () =>
    Array(GRID_COLS).fill(null)
  );
  const carpets: CarpetPair[] = [];
  let id = 0;

  for (let attempt = 0; attempt < 300; attempt++) {
    const row = Math.floor(Math.random() * GRID_ROWS);
    const col = Math.floor(Math.random() * GRID_COLS);
    if (board[row][col] !== null) continue;

    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]].sort(() => Math.random() - 0.5);
    for (const [dr, dc] of dirs) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS && board[nr][nc] === null) {
        const colorIdx = id % CARPET_PALETTE.length;
        board[row][col] = id;
        board[nr][nc] = id;
        carpets.push({
          r1: row, c1: col, r2: nr, c2: nc,
          colorIdx,
          patternSeed: Math.random(),
        });
        id++;
        break;
      }
    }
  }
  return { board, carpets };
}

export function LobbyBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: -1000, y: -1000 });
  const [data, setData] = useState<ReturnType<typeof generateCarpets> | null>(null);
  const rafRef = useRef<number>(0);
  const pendingMouse = useRef({ x: -1000, y: -1000 });
  const [cellSize, setCellSize] = useState(80);

  // Generate carpets and compute cellSize only on client after mount
  useEffect(() => {
    setData(generateCarpets());
    setCellSize(Math.max(window.innerWidth / GRID_COLS, window.innerHeight / GRID_ROWS, 80));
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    pendingMouse.current = { x: e.clientX, y: e.clientY };
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        setMouse(pendingMouse.current);
        rafRef.current = 0;
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [onMouseMove]);

  // Don't render the board SVG until client-side data is ready
  if (!data) {
    return <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden" />;
  }

  const totalW = cellSize * GRID_COLS;
  const totalH = cellSize * GRID_ROWS;
  const { board, carpets } = data;

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Base subtle pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="lobby-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="1" fill="#8B6914" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lobby-dots)" />
        </svg>
      </div>

      {/* Revealed board layer */}
      <div
        className="absolute inset-0"
        style={{
          WebkitMaskImage: `radial-gradient(circle 200px at ${mouse.x}px ${mouse.y}px, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.18) 45%, transparent 100%)`,
          maskImage: `radial-gradient(circle 200px at ${mouse.x}px ${mouse.y}px, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.18) 45%, transparent 100%)`,
        }}
      >
        <svg
          width={totalW}
          height={totalH}
          viewBox={`0 0 ${totalW} ${totalH}`}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ minWidth: '100vw', minHeight: '100vh' }}
        >
          <defs>
            {/* Wood grain texture for board */}
            <pattern id="bg-wood" width="200" height="200" patternUnits="userSpaceOnUse">
              <rect width="200" height="200" fill="#D4BC82" />
              {/* Fine grain lines */}
              {Array.from({ length: 20 }, (_, i) => (
                <line
                  key={`grain-${i}`}
                  x1={0}
                  y1={i * 10 + Math.sin(i * 2.3) * 3}
                  x2={200}
                  y2={i * 10 + Math.cos(i * 1.7) * 4}
                  stroke="rgba(139,105,20,0.06)"
                  strokeWidth={0.8 + Math.sin(i) * 0.4}
                />
              ))}
              {/* Wider grain bands */}
              {Array.from({ length: 5 }, (_, i) => (
                <line
                  key={`band-${i}`}
                  x1={0}
                  y1={i * 42 + 15}
                  x2={200}
                  y2={i * 42 + 18}
                  stroke="rgba(139,105,20,0.04)"
                  strokeWidth="3"
                />
              ))}
            </pattern>

            {/* Weave pattern for carpets */}
            <pattern id="bg-weave" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="3" height="3" fill="rgba(0,0,0,0.04)" />
              <rect x="3" y="3" width="3" height="3" fill="rgba(0,0,0,0.04)" />
            </pattern>

            {/* Moroccan star motif */}
            <symbol id="bg-star" viewBox="0 0 24 24">
              <path d="M12 2L14 9L20 12L14 15L12 22L10 15L4 12L10 9Z" fill="rgba(255,255,255,0.1)" />
              <path d="M12 6L16 12L12 18L8 12Z" fill="rgba(255,255,255,0.06)" />
              <circle cx="12" cy="12" r="1.8" fill="rgba(255,255,255,0.12)" />
            </symbol>

            {/* Fringe pattern */}
            <pattern id="bg-fringe-h" width="5" height="3" patternUnits="userSpaceOnUse">
              <line x1="2.5" y1="0" x2="2.5" y2="3" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
            </pattern>
            <pattern id="bg-fringe-v" width="3" height="5" patternUnits="userSpaceOnUse">
              <line x1="0" y1="2.5" x2="3" y2="2.5" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* Board surface with wood grain */}
          <rect width={totalW} height={totalH} fill="url(#bg-wood)" />

          {/* Subtle grid grooves */}
          {Array.from({ length: GRID_COLS + 1 }, (_, i) => (
            <g key={`v-${i}`}>
              <line x1={i * cellSize} y1={0} x2={i * cellSize} y2={totalH}
                stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
              <line x1={i * cellSize + 1} y1={0} x2={i * cellSize + 1} y2={totalH}
                stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            </g>
          ))}
          {Array.from({ length: GRID_ROWS + 1 }, (_, i) => (
            <g key={`h-${i}`}>
              <line x1={0} y1={i * cellSize} x2={totalW} y2={i * cellSize}
                stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
              <line x1={0} y1={i * cellSize + 1} x2={totalW} y2={i * cellSize + 1}
                stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            </g>
          ))}

          {/* Empty cell marks */}
          {board.map((row, r) =>
            row.map((val, c) => {
              if (val !== null) return null;
              const cx = c * cellSize + cellSize / 2;
              const cy = r * cellSize + cellSize / 2;
              return (
                <circle key={`dot-${r}-${c}`} cx={cx} cy={cy} r={2}
                  fill="rgba(139,105,20,0.1)" />
              );
            })
          )}

          {/* Carpets as realistic 2-cell rugs */}
          {carpets.map((carpet, idx) => {
            const palette = CARPET_PALETTE[carpet.colorIdx];
            const isHorizontal = carpet.r1 === carpet.r2;
            const minR = Math.min(carpet.r1, carpet.r2);
            const minC = Math.min(carpet.c1, carpet.c2);

            const x = minC * cellSize;
            const y = minR * cellSize;
            const w = isHorizontal ? cellSize * 2 : cellSize;
            const h = isHorizontal ? cellSize : cellSize * 2;

            const inset = 2;
            const rx = x + inset;
            const ry = y + inset;
            const rw = w - inset * 2;
            const rh = h - inset * 2;

            const starSize = cellSize * 0.55;

            return (
              <g key={`rug-${idx}`}>
                {/* Shadow underneath */}
                <rect x={rx + 2} y={ry + 2} width={rw} height={rh} rx={4}
                  fill="rgba(0,0,0,0.12)" />

                {/* Base fabric color with gradient */}
                <rect x={rx} y={ry} width={rw} height={rh} rx={4}
                  fill={palette.base} />

                {/* Fabric gradient sheen */}
                <rect x={rx} y={ry} width={rw} height={rh} rx={4}
                  fill="url(#bg-weave)" />

                {/* Directional sheen */}
                <rect x={rx} y={ry} width={rw} height={rh} rx={4}
                  fill="rgba(255,255,255,0.04)"
                  style={{ filter: 'none' }}
                />

                {/* Darker border edges — like carpet thickness */}
                <rect x={rx} y={ry} width={rw} height={rh} rx={4}
                  fill="none"
                  stroke={palette.dark}
                  strokeWidth="1.5"
                  opacity={0.6}
                />

                {/* Inner decorative border */}
                <rect
                  x={rx + rw * 0.08} y={ry + rh * 0.08}
                  width={rw * 0.84} height={rh * 0.84}
                  rx={3}
                  fill="none"
                  stroke={palette.accent}
                  strokeWidth="0.8"
                  opacity={0.35}
                />

                {/* Decorative stitching line */}
                <rect
                  x={rx + rw * 0.14} y={ry + rh * 0.14}
                  width={rw * 0.72} height={rh * 0.72}
                  rx={2}
                  fill="none"
                  stroke={palette.light}
                  strokeWidth="0.5"
                  strokeDasharray="3 2"
                  opacity={0.4}
                />

                {/* Moroccan star motifs — one per cell */}
                <use
                  href="#bg-star"
                  x={carpet.c1 * cellSize + (cellSize - starSize) / 2}
                  y={carpet.r1 * cellSize + (cellSize - starSize) / 2}
                  width={starSize} height={starSize}
                />
                <use
                  href="#bg-star"
                  x={carpet.c2 * cellSize + (cellSize - starSize) / 2}
                  y={carpet.r2 * cellSize + (cellSize - starSize) / 2}
                  width={starSize} height={starSize}
                />

                {/* Center jewel at carpet midpoint */}
                <circle
                  cx={x + w / 2} cy={y + h / 2}
                  r={cellSize * 0.06}
                  fill={palette.accent} opacity={0.5}
                />

                {/* Corner tassels / fringe marks */}
                {/* Top fringe */}
                <rect x={rx + 4} y={ry - 1} width={rw - 8} height={2.5}
                  fill={palette.dark} opacity={0.2} rx={1} />
                {/* Bottom fringe */}
                <rect x={rx + 4} y={ry + rh - 1.5} width={rw - 8} height={2.5}
                  fill={palette.dark} opacity={0.2} rx={1} />

                {/* Fabric texture overlay — subtle noise feel */}
                <rect x={rx} y={ry} width={rw} height={rh} rx={4}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="0.3"
                />
              </g>
            );
          })}

          {/* Assam figure */}
          <g transform={`translate(${totalW / 2 - 20}, ${totalH / 2 - 30})`}>
            {/* Shadow */}
            <ellipse cx="20" cy="56" rx="14" ry="3.5" fill="rgba(0,0,0,0.1)" />
            {/* Base */}
            <ellipse cx="20" cy="52" rx="12" ry="3.5" fill="#5C3A1E" />
            <ellipse cx="20" cy="49.5" rx="12" ry="3.5" fill="#7A5430" />
            {/* Body */}
            <path d="M12 49 C11 40, 14 34, 16 31 L24 31 C26 34, 29 40, 28 49 Z" fill="#A07040" />
            <path d="M12 49 C11 40, 14 34, 16 31 L24 31 C26 34, 29 40, 28 49 Z"
              fill="url(#assamShine)" />
            {/* Neck */}
            <ellipse cx="20" cy="31" rx="7" ry="2" fill="#5C3A1E" />
            {/* Head */}
            <circle cx="20" cy="24" r="7" fill="#A07040" />
            {/* Fez */}
            <path d="M14 24.5 C14 18, 17 14, 20 13 C23 14, 26 18, 26 24.5 Z" fill="#C75B39" />
            <path d="M14 24.5 Q20 26, 26 24.5" fill="none" stroke="#8B3520" strokeWidth="1" />
            {/* Tassel */}
            <line x1="20" y1="13" x2="20" y2="10" stroke="#C19A3E" strokeWidth="0.8" />
            <circle cx="20" cy="9" r="1.8" fill="#E8D5A3" />
            {/* Eyes */}
            <circle cx="17.5" cy="24" r="0.8" fill="#2C1810" />
            <circle cx="22.5" cy="24" r="0.8" fill="#2C1810" />
          </g>

          {/* Gradient defs for Assam */}
          <defs>
            <radialGradient id="assamShine" cx="0.3" cy="0.25" r="0.6">
              <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(255,248,231,0.6) 100%)',
        }}
      />
    </div>
  );
}
