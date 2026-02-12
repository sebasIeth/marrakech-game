'use client';

import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';

interface DiceCommitRevealProps {
  isDiceCommitPhase: boolean;
  isDiceRevealPhase: boolean;
  txStatus: string;
  onCommit: () => void;
  onReveal: () => void;
}

export function DiceCommitReveal({
  isDiceCommitPhase,
  isDiceRevealPhase,
  txStatus,
  onCommit,
  onReveal,
}: DiceCommitRevealProps) {
  const isPending = txStatus === 'pending' || txStatus === 'confirming';

  return (
    <div className="space-y-3">
      {isDiceCommitPhase && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-3"
        >
          <p className="text-sm text-[#8B6914]">
            Lanza el dado (paso 1 de 2)
          </p>
          <Button
            onClick={onCommit}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? 'Enviando...' : 'Lanzar Dado'}
          </Button>
          <p className="text-[10px] text-[#8B6914]/50">
            Commit-reveal: tu resultado es impredecible
          </p>
        </motion.div>
      )}

      {isDiceRevealPhase && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-3"
        >
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 border-2 border-[#C19A3E] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#8B6914]">
              Esperando bloque...
            </p>
          </div>
          <Button
            onClick={onReveal}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? 'Revelando...' : 'Revelar Dado'}
          </Button>
          <p className="text-[10px] text-[#8B6914]/50">
            Paso 2 de 2: revela tu resultado
          </p>
        </motion.div>
      )}
    </div>
  );
}
