'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import type { Player } from '@/lib/game/types';

interface PlayerCardProps {
  player: Player;
  isActive: boolean;
  isCurrentTurn: boolean;
  isMe?: boolean;
}

function CoinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="7" fill="#C19A3E" stroke="#8B6914" strokeWidth="1" />
      <circle cx="8" cy="8" r="5" fill="none" stroke="#E8D5A3" strokeWidth="0.5" />
      <text x="8" y="11" textAnchor="middle" fontSize="7" fill="#5C3A1E" fontWeight="bold">D</text>
    </svg>
  );
}

function CarpetIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <rect x="2" y="3" width="12" height="10" rx="1" fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
      <rect x="4" y="5" width="8" height="6" rx="0.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
      <circle cx="8" cy="8" r="1.5" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
}

export function PlayerCard({ player, isCurrentTurn, isMe }: PlayerCardProps) {
  return (
    <motion.div
      layout
      className={cn(
        'relative rounded-xl transition-all overflow-hidden',
        player.eliminated
          ? 'opacity-45'
          : isCurrentTurn
            ? 'shadow-md'
            : '',
      )}
      style={{
        background: player.eliminated
          ? '#f3f4f6'
          : isCurrentTurn
            ? `linear-gradient(135deg, ${player.color.light} 0%, white 70%)`
            : 'white',
        border: isCurrentTurn
          ? `2px solid ${player.color.primary}`
          : '1px solid #E8D5A3',
      }}
    >
      {/* Active turn glow accent */}
      {isCurrentTurn && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ backgroundColor: player.color.primary }}
        />
      )}

      <div className="px-3 py-2.5 flex items-center gap-2.5">
        {/* Color dot with glow */}
        <div className="relative shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm"
            style={{
              backgroundColor: player.color.primary,
              boxShadow: isCurrentTurn
                ? `0 0 8px ${player.color.primary}50, inset 0 1px 2px rgba(255,255,255,0.2)`
                : 'inset 0 1px 2px rgba(255,255,255,0.2)',
            }}
          >
            {player.name.charAt(0).toUpperCase()}
          </div>
          {isCurrentTurn && (
            <motion.div
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#C19A3E] border-2 border-white"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </div>

        {/* Name + stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'font-semibold text-sm truncate leading-tight',
                player.eliminated ? 'text-gray-400 line-through' : 'text-[#2C1810]',
              )}
            >
              {player.name}
            </span>
            {isMe && !player.eliminated && (
              <span className="text-[10px] bg-[#C19A3E] text-white px-1.5 py-0.5 rounded-full leading-none font-semibold">
                Tu
              </span>
            )}
            {player.eliminated && player.connected === false && (
              <span className="text-[10px] bg-red-400 text-white px-1.5 py-0.5 rounded-full leading-none">
                Desconectado
              </span>
            )}
            {player.eliminated && player.connected !== false && (
              <span className="text-[10px] bg-gray-400 text-white px-1.5 py-0.5 rounded-full leading-none">
                Eliminado
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1" title="Dirhams">
              <CoinIcon size={13} />
              <span className="text-xs font-semibold text-[#8B6914]">{player.dirhams}</span>
            </div>
            <div className="flex items-center gap-1" title="Alfombras restantes">
              <CarpetIcon color={player.color.primary} size={13} />
              <span className="text-xs font-medium text-[#8B6914]/70">{player.carpetsRemaining}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
