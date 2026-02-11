'use client';

import { motion } from 'framer-motion';
import type { Phase, Player } from '@/lib/game/types';

interface GameHeaderProps {
  currentPlayer: Player | undefined;
  phase: Phase;
  turnNumber: number;
}

const PHASE_STEPS: { key: Phase; label: string; icon: string }[] = [
  { key: 'orient', label: 'Orientar', icon: '🧭' },
  { key: 'roll', label: 'Dado', icon: '🎲' },
  { key: 'tribute', label: 'Tributo', icon: '💰' },
  { key: 'place', label: 'Alfombra', icon: '🪄' },
];

function getPhaseIndex(phase: Phase): number {
  if (phase === 'orient') return 0;
  if (phase === 'roll' || phase === 'moving' || phase === 'borderChoice') return 1;
  if (phase === 'tribute') return 2;
  if (phase === 'place') return 3;
  return -1;
}

export function GameHeader({ currentPlayer, phase, turnNumber }: GameHeaderProps) {
  const activeIdx = getPhaseIndex(phase);

  return (
    <header className="bg-gradient-to-r from-[#3A1040] via-[#4A154B] to-[#3A1040] text-white px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <h1 className="font-display text-lg font-bold tracking-wide text-[#E8D5A3] whitespace-nowrap shrink-0">
          Marrakech
        </h1>

        {/* Phase stepper */}
        {phase !== 'gameOver' && (
          <div className="hidden sm:flex items-center gap-1">
            {PHASE_STEPS.map((step, i) => {
              const isActive = i === activeIdx;
              const isDone = i < activeIdx;
              return (
                <div key={step.key} className="flex items-center">
                  {i > 0 && (
                    <div
                      className="w-6 h-px mx-0.5"
                      style={{
                        backgroundColor: isDone ? '#C19A3E' : 'rgba(255,255,255,0.15)',
                      }}
                    />
                  )}
                  <motion.div
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                    animate={{
                      backgroundColor: isActive
                        ? 'rgba(193,154,62,0.25)'
                        : 'rgba(0,0,0,0)',
                      scale: isActive ? 1 : 0.95,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-xs">{step.icon}</span>
                    <span
                      className="font-medium"
                      style={{
                        color: isActive ? '#E8D5A3' : isDone ? '#C19A3E' : 'rgba(255,255,255,0.35)',
                      }}
                    >
                      {step.label}
                    </span>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}

        {/* Right info */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-white/50 font-medium">
            Turno {turnNumber}
          </span>
          {currentPlayer && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-sm shadow-sm"
                style={{
                  backgroundColor: currentPlayer.color.primary,
                  boxShadow: `0 0 6px ${currentPlayer.color.primary}60`,
                }}
              />
              <span className="text-sm font-semibold text-white/90">
                {currentPlayer.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
