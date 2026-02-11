'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface DiceProps {
  onRoll: () => void;
  disabled?: boolean;
}

export function Dice({ onRoll, disabled }: DiceProps) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs text-[#8B6914]">
        Lanza el dado para mover a Assam
      </p>
      <motion.button
        whileHover={!disabled ? { scale: 1.03, y: -1 } : {}}
        whileTap={!disabled ? { scale: 0.97 } : {}}
        className={cn(
          'w-full py-3.5 rounded-xl font-semibold text-sm',
          'transition-all flex items-center justify-center gap-2.5',
          !disabled
            ? 'bg-gradient-to-b from-[#FFF8E7] to-[#F4E8C1] text-[#2C1810] cursor-pointer shadow-sm hover:shadow-md'
            : 'bg-gray-50 text-gray-400 cursor-not-allowed',
        )}
        style={{
          border: !disabled ? '1.5px solid #C19A3E' : '1px solid #e5e7eb',
        }}
        onClick={onRoll}
        disabled={disabled}
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <rect x="1" y="1" width="18" height="18" rx="3" fill="#C19A3E" stroke="#8B6914" strokeWidth="0.8" />
          <circle cx="6" cy="6" r="1.5" fill="#FFF8E7" />
          <circle cx="14" cy="6" r="1.5" fill="#FFF8E7" />
          <circle cx="10" cy="10" r="1.5" fill="#FFF8E7" />
          <circle cx="6" cy="14" r="1.5" fill="#FFF8E7" />
          <circle cx="14" cy="14" r="1.5" fill="#FFF8E7" />
        </svg>
        Lanzar Dado
      </motion.button>
    </div>
  );
}
