'use client';

import { motion } from 'framer-motion';
import type { FinalScore, Player } from '@/lib/game/types';

interface GameOverScreenProps {
  finalScores: FinalScore[];
  players: Player[];
  winner: number | null;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function GameOverScreen({
  finalScores,
  players,
  winner,
  onPlayAgain,
  onBackToMenu,
}: GameOverScreenProps) {
  const winnerPlayer = players.find((p) => p.id === winner);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-[#FFF8E7] rounded-2xl shadow-2xl max-w-lg w-full p-8"
      >
        {/* Trophy and Winner */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="text-6xl mb-3"
          >
            🏆
          </motion.div>
          <h2 className="font-display text-2xl font-bold text-[#2C1810]">
            ¡Fin de la Partida!
          </h2>
          {winnerPlayer && (
            <p className="mt-2 text-lg">
              <span
                className="font-bold"
                style={{ color: winnerPlayer.color.primary }}
              >
                {winnerPlayer.name}
              </span>{' '}
              <span className="text-[#8B6914]">
                es el mejor mercader de Marrakech
              </span>
            </p>
          )}
        </div>

        {/* Scores Table */}
        <div className="mb-6 rounded-lg overflow-hidden border border-[#E8D5A3]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#4A154B] text-white">
                <th className="py-2 px-3 text-left">#</th>
                <th className="py-2 px-3 text-left">Jugador</th>
                <th className="py-2 px-3 text-right">💰</th>
                <th className="py-2 px-3 text-right">🟨</th>
                <th className="py-2 px-3 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {finalScores.map((score, index) => {
                const player = players.find((p) => p.id === score.playerId);
                return (
                  <motion.tr
                    key={score.playerId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={
                      index === 0
                        ? 'bg-[#C19A3E]/10 font-semibold'
                        : index % 2 === 0
                          ? 'bg-white'
                          : 'bg-[#FFF8E7]'
                    }
                  >
                    <td className="py-2 px-3">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: player?.color.primary }}
                        />
                        {score.name}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">{score.dirhams}</td>
                    <td className="py-2 px-3 text-right">{score.visibleCells}</td>
                    <td className="py-2 px-3 text-right font-bold text-[#C19A3E]">
                      {score.total}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 rounded-lg bg-[#C19A3E] text-white font-medium hover:bg-[#A67C2E] transition-colors"
          >
            Jugar de Nuevo
          </button>
          <button
            onClick={onBackToMenu}
            className="flex-1 py-3 rounded-lg border-2 border-[#E8D5A3] text-[#2C1810] font-medium hover:bg-[#F4E8C1] transition-colors"
          >
            Volver al Menú
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
