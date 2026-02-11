'use client';

import { motion } from 'framer-motion';
import type { Direction } from '@/lib/game/types';
import { TURNS } from '@/lib/game/constants';
import { cn } from '@/lib/utils/cn';

interface DirectionPickerProps {
  currentDirection: Direction;
  validDirections: Direction[];
  onSelect: (direction: Direction) => void;
  disabled?: boolean;
}

const directionLabels: Record<Direction, string> = {
  N: 'Norte',
  S: 'Sur',
  E: 'Este',
  W: 'Oeste',
};

// Arrow rotation based on actual compass direction
const directionRotation: Record<Direction, number> = {
  N: 0,
  E: 90,
  S: 180,
  W: 270,
};

function ArrowSvg({ rotation, className }: { rotation: number; className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      className={className}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path
        d="M10 3L15 11H12V17H8V11H5L10 3Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function DirectionPicker({
  currentDirection,
  validDirections,
  onSelect,
  disabled,
}: DirectionPickerProps) {
  const turns = TURNS[currentDirection];

  const buttons = [
    { dir: turns.left, label: 'Izquierda', sublabel: directionLabels[turns.left], rotation: directionRotation[turns.left] },
    { dir: turns.straight, label: 'Recto', sublabel: directionLabels[turns.straight], rotation: directionRotation[turns.straight] },
    { dir: turns.right, label: 'Derecha', sublabel: directionLabels[turns.right], rotation: directionRotation[turns.right] },
  ];

  return (
    <div className="space-y-2.5">
      <p className="text-xs text-[#8B6914]">
        Elige hacia dónde girar a Assam
      </p>
      <div className="flex gap-2">
        {buttons.map(({ dir, sublabel, rotation }) => {
          const isValid = validDirections.includes(dir);
          return (
            <motion.button
              key={dir}
              whileHover={isValid && !disabled ? { scale: 1.04, y: -1 } : {}}
              whileTap={isValid && !disabled ? { scale: 0.96 } : {}}
              className={cn(
                'flex-1 py-2.5 px-2 rounded-xl text-sm font-medium transition-all',
                'flex flex-col items-center gap-1',
                isValid && !disabled
                  ? 'bg-gradient-to-b from-[#FFF8E7] to-[#F4E8C1] text-[#2C1810] cursor-pointer shadow-sm hover:shadow-md'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed',
              )}
              style={{
                border: isValid && !disabled ? '1.5px solid #C19A3E' : '1px solid #e5e7eb',
              }}
              onClick={() => isValid && !disabled && onSelect(dir)}
              disabled={!isValid || disabled}
            >
              <ArrowSvg
                rotation={rotation}
                className={isValid && !disabled ? 'text-[#C19A3E]' : 'text-gray-300'}
              />
              <span className="text-[11px] font-medium opacity-70">{sublabel}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
