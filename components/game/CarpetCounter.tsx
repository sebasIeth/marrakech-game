'use client';

import type { Player } from '@/lib/game/types';

interface CarpetCounterProps {
  player: Player;
}

export function CarpetCounter({ player }: CarpetCounterProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className="w-4 h-4 rounded-sm"
        style={{ backgroundColor: player.color.primary }}
      />
      <span className="text-[#2C1810]">{player.carpetsRemaining}</span>
      <span className="text-[#8B6914] text-xs">restantes</span>
    </div>
  );
}
