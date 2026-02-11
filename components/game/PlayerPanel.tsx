'use client';

import type { Player } from '@/lib/game/types';
import { PlayerCard } from './PlayerCard';

interface PlayerPanelProps {
  players: Player[];
  currentPlayerIndex: number;
  myPlayerId?: number | null;
}

export function PlayerPanel({ players, currentPlayerIndex, myPlayerId }: PlayerPanelProps) {
  return (
    <div className="space-y-2">
      {players.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
          isActive={!player.eliminated}
          isCurrentTurn={player.id === players[currentPlayerIndex]?.id}
          isMe={myPlayerId != null && player.id === myPlayerId}
        />
      ))}
    </div>
  );
}
