'use client';

import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { TributeInfo, Player } from '@/lib/game/types';

interface TributeDisplayProps {
  tribute: TributeInfo | null;
  players: Player[];
  onContinue: () => void;
}

export function TributeDisplay({ tribute, players, onContinue }: TributeDisplayProps) {
  const fromPlayer = tribute ? players.find((p) => p.id === tribute.fromPlayerId) : null;
  const toPlayer = tribute ? players.find((p) => p.id === tribute.toPlayerId) : null;
  const hasTribute = tribute && tribute.amount > 0;

  const stableOnContinue = useCallback(onContinue, [onContinue]);

  useEffect(() => {
    const delay = hasTribute ? 2400 : 1200;
    const timer = setTimeout(stableOnContinue, delay);
    return () => clearTimeout(timer);
  }, [stableOnContinue, hasTribute]);

  if (hasTribute) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="rounded-xl p-4 text-center"
        style={{
          background: 'linear-gradient(135deg, #FFF8E7 0%, #F4E8C1 100%)',
          border: '1.5px solid #C19A3E',
        }}
      >
        {/* Coin stack */}
        <motion.div
          className="flex justify-center mb-3"
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 250 }}
        >
          <div className="relative">
            {Array.from({ length: Math.min(tribute!.amount, 5) }, (_, i) => (
              <motion.svg
                key={i}
                width="32"
                height="32"
                viewBox="0 0 32 32"
                className="absolute"
                style={{ top: -i * 3, left: i * 2 - 4 }}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 300 }}
              >
                <circle cx="16" cy="16" r="14" fill="#C19A3E" stroke="#8B6914" strokeWidth="1.2" />
                <circle cx="16" cy="16" r="10" fill="none" stroke="#E8D5A3" strokeWidth="0.6" />
                <text x="16" y="20.5" textAnchor="middle" fontSize="12" fill="#5C3A1E" fontWeight="bold">D</text>
              </motion.svg>
            ))}
            <div style={{ width: 32, height: 32 }} />
          </div>
        </motion.div>

        <motion.div
          className="space-y-1.5"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm text-[#2C1810]">
            <span className="font-bold" style={{ color: fromPlayer?.color.primary }}>
              {fromPlayer?.name}
            </span>
            {' pagó '}
            <motion.span
              className="font-bold text-[#C19A3E] inline-block"
              style={{ fontSize: 20 }}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
            >
              {tribute!.amount}
            </motion.span>
            {' a '}
            <span className="font-bold" style={{ color: toPlayer?.color.primary }}>
              {toPlayer?.name}
            </span>
          </p>
          <p className="text-[11px] text-[#8B6914]/60">
            {tribute!.connectedCells.length} casillas conectadas
          </p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          className="mt-3 h-0.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(193,154,62,0.15)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: '#C19A3E' }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.4, ease: 'linear' }}
          />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl py-3 px-4 text-center"
      style={{
        background: 'white',
        border: '1px solid #E8D5A3',
      }}
    >
      <p className="text-sm text-[#8B6914]">Casilla libre — sin tributo</p>
      <motion.div
        className="mt-2 h-0.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'rgba(193,154,62,0.1)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: '#C19A3E' }}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.2, ease: 'linear' }}
        />
      </motion.div>
    </motion.div>
  );
}
