'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameAction } from '@/lib/game/types';
import { PLAYER_COLORS } from '@/lib/game/constants';

interface ActionLogProps {
  actions: GameAction[];
}

const actionIcons: Record<GameAction['type'], string> = {
  orient: '🧭',
  roll: '🎲',
  move: '👣',
  tribute: '💰',
  place: '🪄',
  eliminate: '💀',
  disconnect: '🔌',
  gameOver: '🏆',
};

export function ActionLog({ actions }: ActionLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [actions.length]);

  const recentActions = actions.slice(-12);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="h-28 overflow-y-auto rounded-xl p-2.5 space-y-0.5"
        style={{
          background: 'white',
          border: '1px solid #E8D5A3',
        }}
      >
        {/* Top fade */}
        <div
          className="sticky top-0 left-0 right-0 h-3 pointer-events-none -mt-2.5 -mx-2.5 mb-1 z-10"
          style={{
            background: 'linear-gradient(to bottom, white, transparent)',
          }}
        />

        <AnimatePresence initial={false}>
          {recentActions.map((action, i) => {
            const color = PLAYER_COLORS[action.playerId]?.primary || '#666';
            return (
              <motion.div
                key={action.timestamp + '-' + i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[11px] flex items-start gap-1.5 py-0.5 leading-relaxed"
              >
                <span className="shrink-0 text-[10px] mt-px">{actionIcons[action.type]}</span>
                <span style={{ color }} className="leading-relaxed">
                  {action.description}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {actions.length === 0 && (
          <p className="text-[11px] text-[#8B6914]/40 text-center py-6">
            Sin acciones aún
          </p>
        )}
      </div>
    </div>
  );
}
