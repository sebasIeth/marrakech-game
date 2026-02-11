'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import type { PlayerColor } from '@/lib/game/types';

interface PlayerConfigProps {
  index: number;
  name: string;
  onNameChange: (value: string) => void;
  color: PlayerColor;
  disabled?: boolean;
}

export default function PlayerConfig({
  index,
  name,
  onNameChange,
  color,
  disabled = false,
}: PlayerConfigProps) {
  return (
    <div
      className={cn(
        'relative flex items-center gap-3 rounded-2xl px-4 py-3 transition-all',
        disabled ? 'opacity-50' : 'hover:shadow-md',
      )}
      style={{
        background: `linear-gradient(135deg, ${color.light}40 0%, ${color.light}20 100%)`,
        border: `1.5px solid ${color.primary}30`,
        boxShadow: `0 2px 8px ${color.primary}10`,
      }}
    >
      {/* Player number badge */}
      <div
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
        style={{
          background: `linear-gradient(135deg, ${color.primary}, ${color.dark})`,
          boxShadow: `0 2px 8px ${color.primary}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
        }}
      >
        {index + 1}
      </div>

      {/* Name input */}
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        disabled={disabled}
        maxLength={16}
        placeholder={`Jugador ${index + 1}`}
        className={cn(
          'flex-1 rounded-xl border bg-white/80 px-3 py-2 text-sm text-[#2C1810] placeholder-[#C19A3E]/40 backdrop-blur-sm transition-all',
          'focus:outline-none focus:ring-2',
          disabled && 'cursor-not-allowed bg-gray-50',
        )}
        style={{
          borderColor: `${color.primary}25`,
          ...(disabled ? {} : {}),
        }}
        onFocus={(e) => {
          e.target.style.borderColor = color.primary;
          e.target.style.boxShadow = `0 0 0 3px ${color.primary}20`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = `${color.primary}25`;
          e.target.style.boxShadow = 'none';
        }}
      />

      {/* Color name chip */}
      <span
        className="hidden rounded-lg px-2 py-0.5 text-xs font-semibold sm:inline"
        style={{
          color: color.dark,
          background: `${color.light}80`,
        }}
      >
        {color.name}
      </span>
    </div>
  );
}
