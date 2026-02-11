'use client';

import { motion } from 'framer-motion';
import type { BorderChoiceInfo, Direction } from '@/lib/game/types';

interface BorderChoicePickerProps {
  borderInfo: BorderChoiceInfo;
  onChoose: (direction: Direction) => void;
}

export function BorderChoicePicker({ borderInfo, onChoose }: BorderChoicePickerProps) {
  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Alert card */}
      <div
        className="rounded-xl p-3 flex items-center gap-3"
        style={{
          background: 'linear-gradient(135deg, #4A154B10 0%, #4A154B08 100%)',
          border: '1.5px solid #4A154B40',
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, #4A154B, #6B1F6E)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L15 13H1L8 1Z" stroke="#E8D5A3" strokeWidth="1.2" fill="none" />
            <path d="M8 6V9" stroke="#E8D5A3" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="8" cy="11" r="0.8" fill="#E8D5A3" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-[#4A154B]">Borde del tablero</p>
          <p className="text-[11px] text-[#4A154B]/60">
            {borderInfo.remainingSteps} {borderInfo.remainingSteps === 1 ? 'paso restante' : 'pasos restantes'}
          </p>
        </div>
      </div>

      {/* Direction buttons */}
      <div className="flex gap-2">
        {borderInfo.options.map((option) => (
          <motion.button
            key={option.direction}
            className="flex-1 py-3 px-3 rounded-xl font-semibold text-sm text-white transition-colors shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #4A154B, #6B1F6E)',
            }}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChoose(option.direction)}
          >
            {option.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
