'use client';

import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface CoinAnimationProps {
  amount: number;
  show: boolean;
}

interface CoinData {
  id: number;
  x: number;
  delay: number;
  duration: number;
}

export default function CoinAnimation({ amount, show }: CoinAnimationProps) {
  const coins: CoinData[] = useMemo(() => {
    const count = Math.min(Math.max(amount, 1), 12);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 80,
      delay: i * 0.08,
      duration: 0.6 + Math.random() * 0.4,
    }));
  }, [amount]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Amount label */}
          <motion.div
            className="absolute text-3xl font-bold text-[#C19A3E] drop-shadow-lg"
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            +{amount}
          </motion.div>

          {/* Coins */}
          {coins.map((coin) => (
            <motion.div
              key={coin.id}
              className="absolute flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#F2D06B] to-[#C19A3E] text-sm font-bold text-[#5C4A1E] shadow-md ring-1 ring-[#A67C2E]/40"
              initial={{ opacity: 0, y: 40, x: 0, scale: 0.3 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: [40, -30, -60, -100],
                x: coin.x,
                scale: [0.3, 1, 1, 0.6],
              }}
              transition={{
                duration: coin.duration,
                delay: coin.delay,
                ease: 'easeOut',
              }}
            >
              $
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
