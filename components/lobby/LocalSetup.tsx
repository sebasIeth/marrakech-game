'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLobbyStore } from '@/lib/store/lobbyStore';
import { useGameStore } from '@/lib/store/gameStore';
import { PLAYER_COLORS } from '@/lib/game/constants';
import PlayerConfig from '@/components/lobby/PlayerConfig';

export default function LocalSetup() {
  const router = useRouter();
  const numPlayers = useLobbyStore((s) => s.numPlayers);
  const setNumPlayers = useLobbyStore((s) => s.setNumPlayers);
  const playerNames = useLobbyStore((s) => s.playerNames);
  const setPlayerName = useLobbyStore((s) => s.setPlayerName);
  const setScreen = useLobbyStore((s) => s.setScreen);
  const initGame = useGameStore((s) => s.initGame);

  const handleStart = () => {
    const names = playerNames.slice(0, numPlayers);
    initGame(numPlayers, 'local', names);
    router.push('/game');
  };

  const handleBack = () => {
    setScreen('menu');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-6">
      <motion.div
        className="relative z-10 w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,248,231,0.94) 50%, rgba(255,255,255,0.9) 100%)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 40px rgba(139,105,20,0.12), 0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
            border: '1px solid rgba(193,154,62,0.2)',
          }}
        >
          {/* Gold shimmer top */}
          <div
            className="h-0.5 w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, #C19A3E 30%, #E8D5A3 50%, #C19A3E 70%, transparent)',
              opacity: 0.5,
            }}
          />

          <div className="px-6 pt-6 pb-5">
            {/* Header */}
            <motion.div
              className="mb-5 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              {/* Icon */}
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #4A154B, #6B2A6E)',
                  boxShadow: '0 3px 12px rgba(74,21,75,0.25)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.5" opacity="0.8" />
                  <rect x="12" y="3" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.5" opacity="0.8" />
                  <rect x="3" y="12" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.5" opacity="0.8" />
                  <rect x="12" y="12" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.5" opacity="0.8" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-bold text-[#2C1810]">
                Partida Local
              </h2>
              <div className="mx-auto mt-1.5 flex items-center justify-center gap-2">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#C19A3E]/40" />
                <div className="h-1 w-1 rounded-full bg-[#C19A3E]/30" />
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#C19A3E]/40" />
              </div>
            </motion.div>

            {/* Number of players - custom segmented control */}
            <motion.div
              className="mb-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#8B6914]/70">
                Jugadores
              </label>
              <div
                className="flex gap-1.5 rounded-2xl p-1"
                style={{
                  background: 'linear-gradient(135deg, #FFF8E7, #F4E8C1)',
                  border: '1px solid rgba(193,154,62,0.15)',
                }}
              >
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNumPlayers(n)}
                    className="flex-1 rounded-xl py-2 text-center text-sm font-bold transition-all"
                    style={
                      numPlayers === n
                        ? {
                            background: 'linear-gradient(135deg, #C19A3E, #A67C2E)',
                            color: 'white',
                            boxShadow: '0 2px 8px rgba(193,154,62,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                          }
                        : {
                            background: 'transparent',
                            color: '#8B6914',
                          }
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Player configs */}
            <motion.div className="mb-5 flex flex-col gap-2.5" layout>
              {Array.from({ length: numPlayers }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <PlayerConfig
                    index={i}
                    name={playerNames[i]}
                    onNameChange={(value) => setPlayerName(i, value)}
                    color={PLAYER_COLORS[i]}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Actions */}
            <motion.div
              className="flex gap-2.5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleBack}
                className="flex-1 rounded-2xl py-2.5 text-sm font-semibold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  border: '1.5px solid rgba(193,154,62,0.2)',
                  color: '#8B6914',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                }}
              >
                Volver
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleStart}
                className="relative flex-1 overflow-hidden rounded-2xl py-2.5 text-sm font-bold text-white transition-all"
                style={{
                  background: 'linear-gradient(135deg, #4A154B 0%, #6B2A6E 50%, #4A154B 100%)',
                  boxShadow: '0 4px 16px rgba(74,21,75,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                Comenzar
                <div className="absolute inset-0 opacity-[0.04]" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 8px)',
                }} />
              </motion.button>
            </motion.div>
          </div>

          {/* Gold shimmer bottom */}
          <div
            className="h-px w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, #C19A3E 30%, #E8D5A3 50%, #C19A3E 70%, transparent)',
              opacity: 0.3,
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
