'use client';

import type { PlayerColor } from '@/lib/game/types';

interface CarpetProps {
  color: PlayerColor;
  isHorizontal: boolean;
  className?: string;
}

export function Carpet({ color, isHorizontal, className }: CarpetProps) {
  return (
    <div
      className={`rounded-sm relative overflow-hidden ${className || ''}`}
      style={{
        backgroundColor: color.primary,
        width: isHorizontal ? '100%' : '50%',
        height: isHorizontal ? '50%' : '100%',
      }}
    >
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" viewBox="0 0 20 20">
          <pattern id="carpet-pattern" patternUnits="userSpaceOnUse" width="10" height="10">
            <path d="M5 0L10 5L5 10L0 5Z" fill="white" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#carpet-pattern)" />
        </svg>
      </div>
    </div>
  );
}
