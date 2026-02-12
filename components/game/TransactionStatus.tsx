'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface TransactionStatusProps {
  status: 'idle' | 'pending' | 'confirming' | 'success' | 'error';
  message: string;
  error: string;
}

export function TransactionStatus({ status, message, error }: TransactionStatusProps) {
  if (status === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="rounded-xl px-4 py-3 text-center"
        style={{
          background:
            status === 'error'
              ? 'linear-gradient(135deg, #FEE2E2, #FECACA)'
              : status === 'success'
              ? 'linear-gradient(135deg, #D1FAE5, #A7F3D0)'
              : 'linear-gradient(135deg, #FFF8E7, #F4E8C1)',
          border: `1px solid ${
            status === 'error' ? '#FCA5A5' : status === 'success' ? '#6EE7B7' : '#E8D5A3'
          }`,
        }}
      >
        {(status === 'pending' || status === 'confirming') && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-[#C19A3E] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-[#8B6914]">{message}</span>
          </div>
        )}
        {status === 'success' && (
          <span className="text-sm font-medium text-green-700">Confirmado</span>
        )}
        {status === 'error' && (
          <span className="text-sm font-medium text-red-600">{error}</span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
