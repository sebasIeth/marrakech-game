'use client';

import { motion } from 'framer-motion';
import type { Direction, Position } from '@/lib/game/types';

interface AssamProps {
  position: Position;
  direction: Direction;
  boardSize: number;
  cellSize: number;
}

const directionRotation: Record<Direction, number> = {
  N: 0,
  E: 90,
  S: 180,
  W: 270,
};

const directionLabel: Record<Direction, string> = {
  N: 'N',
  E: 'E',
  S: 'S',
  W: 'O',
};

export function Assam({ position, direction, cellSize }: AssamProps) {
  const x = position.col * cellSize + cellSize / 2;
  const y = position.row * cellSize + cellSize / 2;

  const pieceW = cellSize * 0.52;
  const pieceH = pieceW * (56 / 40);

  return (
    <motion.div
      className="absolute z-20 pointer-events-none flex items-center justify-center"
      style={{
        width: cellSize * 0.92,
        height: cellSize * 0.92,
      }}
      animate={{
        left: x - cellSize * 0.46,
        top: y - cellSize * 0.46,
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 25,
      }}
    >
      {/* Wooden pawn figure */}
      <svg
        viewBox="0 0 40 56"
        width={pieceW}
        height={pieceH}
        className="drop-shadow-lg"
        style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))' }}
      >
        <defs>
          <linearGradient id="assam-body" x1="0" y1="0" x2="1" y2="0.2">
            <stop offset="0%" stopColor="#B8864E" />
            <stop offset="35%" stopColor="#A07040" />
            <stop offset="100%" stopColor="#7A5428" />
          </linearGradient>
          <radialGradient id="assam-shine" cx="0.3" cy="0.25" r="0.6">
            <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <linearGradient id="assam-fez" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#D4623A" />
            <stop offset="100%" stopColor="#A04020" />
          </linearGradient>
          <radialGradient id="assam-fez-shine" cx="0.35" cy="0.25" r="0.5">
            <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="20" cy="54" rx="13" ry="2.5" fill="rgba(0,0,0,0.1)" />

        {/* Base platform — dark ring */}
        <ellipse cx="20" cy="49" rx="13" ry="4" fill="#5C3A1E" />
        <rect x="7" y="46" width="26" height="3" fill="#6B4425" />
        <ellipse cx="20" cy="46" rx="13" ry="4" fill="#7A5430" />
        {/* Base highlight */}
        <ellipse cx="17" cy="45" rx="5" ry="1.5" fill="rgba(255,255,255,0.08)" />

        {/* Body — tapered */}
        <path
          d="M12 46 C11 38, 14 32, 16 29 L24 29 C26 32, 29 38, 28 46 Z"
          fill="url(#assam-body)"
        />
        <path
          d="M12 46 C11 38, 14 32, 16 29 L24 29 C26 32, 29 38, 28 46 Z"
          fill="url(#assam-shine)"
        />
        {/* Body edge line */}
        <path
          d="M12 46 C11 38, 14 32, 16 29"
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="0.5"
        />

        {/* Neck ring */}
        <ellipse cx="20" cy="29" rx="8" ry="2.5" fill="#5C3A1E" />

        {/* Head */}
        <circle cx="20" cy="22" r="8" fill="url(#assam-body)" />
        <circle cx="20" cy="22" r="8" fill="url(#assam-shine)" />

        {/* Eyes */}
        <circle cx="17.5" cy="22" r="0.9" fill="#2C1810" />
        <circle cx="22.5" cy="22" r="0.9" fill="#2C1810" />
        {/* Eye shine */}
        <circle cx="17.2" cy="21.6" r="0.35" fill="rgba(255,255,255,0.5)" />
        <circle cx="22.2" cy="21.6" r="0.35" fill="rgba(255,255,255,0.5)" />

        {/* Fez / turban cap */}
        <path
          d="M14 22.5 C14 15, 17 11, 20 10 C23 11, 26 15, 26 22.5 Z"
          fill="url(#assam-fez)"
        />
        <path
          d="M14 22.5 C14 15, 17 11, 20 10 C23 11, 26 15, 26 22.5 Z"
          fill="url(#assam-fez-shine)"
        />
        {/* Fez band */}
        <path
          d="M14 22.5 Q20 24, 26 22.5"
          fill="none"
          stroke="#8B3520"
          strokeWidth="1.2"
        />

        {/* Tassel on top */}
        <line x1="20" y1="10" x2="20" y2="7" stroke="#C19A3E" strokeWidth="0.8" />
        <circle cx="20" cy="6.5" r="1.8" fill="#E8D5A3" />
        <circle cx="19.5" cy="6" r="0.6" fill="rgba(255,255,255,0.3)" />
      </svg>

      {/* Direction arrow — orbits around the pawn */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: directionRotation[direction] }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: -1 }}
        >
          <svg
            width={cellSize * 0.24}
            height={cellSize * 0.18}
            viewBox="0 0 24 16"
          >
            <defs>
              <linearGradient id="arrow-gold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FACC15" />
                <stop offset="100%" stopColor="#CA9A04" />
              </linearGradient>
            </defs>
            <polygon
              points="12,0 22,14 16,12 12,16 8,12 2,14"
              fill="url(#arrow-gold)"
              stroke="#8B6914"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </motion.div>

      {/* Direction badge */}
      <motion.div
        className="absolute bottom-0 right-0 rounded-full flex items-center justify-center"
        style={{
          width: cellSize * 0.22,
          height: cellSize * 0.22,
          background: 'radial-gradient(circle at 40% 35%, #6B2A6E, #4A154B)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}
        key={direction}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        <span
          className="font-bold text-yellow-300 leading-none"
          style={{ fontSize: cellSize * 0.11 }}
        >
          {directionLabel[direction]}
        </span>
      </motion.div>
    </motion.div>
  );
}
