'use client';

import { motion } from 'framer-motion';

interface DiceResultProps {
  value: number;
}

export function DiceResult({ value }: DiceResultProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-1"
    >
      {Array.from({ length: value }, (_, i) => (
        <motion.span
          key={i}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.15 }}
          className="text-lg"
        >
          🥿
        </motion.span>
      ))}
    </motion.div>
  );
}
