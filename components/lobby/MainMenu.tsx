'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLobbyStore } from '@/lib/store/lobbyStore';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

/* ── Decorative Moroccan arch frame around the card ── */
function ArchFrame() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 400 480"
      preserveAspectRatio="none"
      fill="none"
    >
      {/* Outer arch */}
      <path
        d="M20 480 L20 160 Q20 35 200 18 Q380 35 380 160 L380 480"
        stroke="#C19A3E"
        strokeWidth="1.5"
        opacity="0.25"
      />
      {/* Inner arch */}
      <path
        d="M35 480 L35 165 Q35 55 200 38 Q365 55 365 165 L365 480"
        stroke="#C19A3E"
        strokeWidth="0.6"
        opacity="0.15"
      />
      {/* Keystone ornament at top */}
      <polygon points="200,10 208,24 200,20 192,24" fill="#C19A3E" opacity="0.2" />
      {/* Corner flourishes */}
      <circle cx="35" cy="468" r="4" fill="#C19A3E" opacity="0.1" />
      <circle cx="365" cy="468" r="4" fill="#C19A3E" opacity="0.1" />
    </svg>
  );
}

/* ── Babucha (slipper) icon for buttons ── */
function BabuchaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 26 18" width={20} height={14} className={className}>
      <path d="M4 13 C3 11,3 9,5 7 L10 4 C14 2,19 3,21 5 L22 8 C23 10,22 12,20 13 L14 14 C10 15,6 14,4 13Z" fill="currentColor" opacity="0.3" />
      <path d="M5 11 C5 9,7 7,11 5 C15 4,19 5,21 7 L20 10 C18 12,12 13,7 12Z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export default function MainMenu() {
  const setScreen = useLobbyStore((s) => s.setScreen);
  const setMode = useLobbyStore((s) => s.setMode);
  const [showRules, setShowRules] = useState(false);

  const handleLocal = () => {
    setMode('local');
    setScreen('localSetup');
  };

  const handleOnline = () => {
    setMode('online');
    setScreen('onlineSetup');
  };

  const handleBlockchain = () => {
    setMode('blockchain');
    setScreen('blockchainSetup');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-6">
      <motion.div
        className="relative z-10 w-full max-w-xs sm:max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* ── Glass card with arch frame ── */}
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,248,231,0.92) 50%, rgba(255,255,255,0.88) 100%)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 40px rgba(139,105,20,0.12), 0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
            border: '1px solid rgba(193,154,62,0.2)',
          }}
        >
          <ArchFrame />

          {/* Gold shimmer line at top */}
          <div
            className="h-0.5 w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, #C19A3E 30%, #E8D5A3 50%, #C19A3E 70%, transparent)',
              opacity: 0.5,
            }}
          />

          <div className="relative px-6 sm:px-8 pt-6 pb-5">
            {/* ── Title section ── */}
            <motion.div
              className="text-center mb-5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              {/* Mosque silhouette */}
              <motion.svg
                width="56"
                height="34"
                viewBox="0 0 72 44"
                className="mx-auto mb-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Central dome */}
                <path d="M24 28 Q36 6 48 28" fill="rgba(193,154,62,0.08)" stroke="#C19A3E" strokeWidth="1" opacity="0.5" />
                {/* Minaret left */}
                <rect x="12" y="18" width="6" height="22" rx="1.5" fill="#C19A3E" opacity="0.1" />
                <path d="M12 18 Q15 12 18 18" fill="#C19A3E" opacity="0.15" />
                <circle cx="15" cy="14" r="1" fill="#C19A3E" opacity="0.25" />
                {/* Minaret right */}
                <rect x="54" y="18" width="6" height="22" rx="1.5" fill="#C19A3E" opacity="0.1" />
                <path d="M54 18 Q57 12 60 18" fill="#C19A3E" opacity="0.15" />
                <circle cx="57" cy="14" r="1" fill="#C19A3E" opacity="0.25" />
                {/* Base */}
                <rect x="20" y="28" width="32" height="12" rx="1" fill="#C19A3E" opacity="0.05" />
                {/* Door arch */}
                <path d="M32 40 L32 33 Q36 29 40 33 L40 40" fill="none" stroke="#C19A3E" strokeWidth="0.8" opacity="0.2" />
                {/* Crescent */}
                <path d="M35 9 A3 3 0 1 1 37 9 A2 2 0 1 0 35 9" fill="#C19A3E" opacity="0.35" />
              </motion.svg>

              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-wider text-[#2C1810]">
                MARRAKECH
              </h1>

              {/* Ornamental divider */}
              <div className="flex items-center justify-center gap-2 mt-2 mb-1">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#C19A3E]/40" />
                <svg width="14" height="14" viewBox="0 0 16 16">
                  <polygon points="8,1 11,5 15,8 11,11 8,15 5,11 1,8 5,5" fill="none" stroke="#C19A3E" strokeWidth="0.8" opacity="0.5" />
                  <polygon points="8,4 10,7 8,10 6,7" fill="#C19A3E" opacity="0.15" />
                  <circle cx="8" cy="7.5" r="1" fill="#C19A3E" opacity="0.3" />
                </svg>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#C19A3E]/40" />
              </div>

              <p className="text-xs italic text-[#C19A3E]/70 font-medium">
                El juego de alfombras del zoco
              </p>
            </motion.div>

            {/* ── Menu buttons ── */}
            <motion.div
              className="flex flex-col gap-2.5 mb-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              {/* Partida Local */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLocal}
                className="relative w-full py-3 rounded-2xl font-bold text-sm text-white overflow-hidden transition-shadow hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #4A154B 0%, #6B2A6E 50%, #4A154B 100%)',
                  boxShadow: '0 4px 16px rgba(74,21,75,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                <div className="relative flex items-center justify-center gap-2.5">
                  <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.5" opacity="0.7" />
                    <rect x="12" y="3" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.5" opacity="0.7" />
                    <rect x="3" y="12" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.5" opacity="0.7" />
                    <rect x="12" y="12" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.5" opacity="0.7" />
                  </svg>
                  Partida Local
                </div>
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-[0.04]" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 8px)',
                }} />
              </motion.button>

              {/* Jugar Online */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOnline}
                className="relative w-full py-3 rounded-2xl font-bold text-sm text-white overflow-hidden transition-shadow hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #8B6914 0%, #C19A3E 50%, #8B6914 100%)',
                  boxShadow: '0 4px 16px rgba(193,154,62,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                <div className="relative flex items-center justify-center gap-2.5">
                  <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="1.5" opacity="0.7" />
                    <path d="M11 3 Q11 11 11 19" stroke="white" strokeWidth="1" opacity="0.4" />
                    <path d="M3 11 Q11 11 19 11" stroke="white" strokeWidth="1" opacity="0.4" />
                    <path d="M4 6 Q11 8 18 6" stroke="white" strokeWidth="0.8" opacity="0.3" />
                    <path d="M4 16 Q11 14 18 16" stroke="white" strokeWidth="0.8" opacity="0.3" />
                  </svg>
                  Jugar Online
                </div>
                <div className="absolute inset-0 opacity-[0.04]" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 8px)',
                }} />
              </motion.button>

              {/* Jugar On-Chain */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBlockchain}
                className="relative w-full py-3 rounded-2xl font-bold text-sm text-white overflow-hidden transition-shadow hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #1A8A7D 0%, #2ECC71 50%, #1A8A7D 100%)',
                  boxShadow: '0 4px 16px rgba(26,138,125,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                <div className="relative flex items-center justify-center gap-2.5">
                  <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                    <rect x="3" y="7" width="16" height="8" rx="2" stroke="white" strokeWidth="1.5" opacity="0.7" />
                    <path d="M7 7V5a4 4 0 018 0v2" stroke="white" strokeWidth="1.5" opacity="0.7" strokeLinecap="round" />
                    <circle cx="11" cy="11" r="1.5" fill="white" opacity="0.8" />
                  </svg>
                  Jugar On-Chain
                </div>
                <div className="absolute inset-0 opacity-[0.04]" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 8px)',
                }} />
              </motion.button>

              {/* Cómo Jugar */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowRules(true)}
                className="w-full py-2.5 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2"
                style={{
                  background: 'rgba(255,255,255,0.6)',
                  border: '1.5px solid rgba(193,154,62,0.25)',
                  color: '#5C4A1E',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7.5" stroke="#C19A3E" strokeWidth="1.2" opacity="0.5" />
                  <path d="M7 7 Q7 5 9 5 Q11 5 11 7 Q11 8.5 9 9 L9 10.5" stroke="#C19A3E" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
                  <circle cx="9" cy="12.5" r="0.7" fill="#C19A3E" opacity="0.5" />
                </svg>
                Cómo Jugar
              </motion.button>
            </motion.div>

            {/* ── Carpet color preview ── */}
            <motion.div
              className="flex items-center justify-center gap-2 mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {['#C0392B', '#2874A6', '#1E8449', '#7D3C98'].map((color, i) => (
                <motion.div
                  key={color}
                  className="flex items-center gap-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.55 + i * 0.07, type: 'spring', stiffness: 300 }}
                >
                  <div
                    className="w-4 h-3 rounded-sm"
                    style={{
                      backgroundColor: color,
                      boxShadow: `inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 1px rgba(0,0,0,0.15)`,
                    }}
                  />
                </motion.div>
              ))}
              <BabuchaIcon className="text-[#C19A3E] ml-1 opacity-40" />
            </motion.div>

            {/* ── Footer ── */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
            >
              <div className="flex items-center justify-center gap-2 text-[10px] text-[#C19A3E]/35 uppercase tracking-widest">
                <div className="h-px w-5 bg-[#C19A3E]/15" />
                Dominique Ehrhard
                <div className="h-px w-5 bg-[#C19A3E]/15" />
              </div>
            </motion.div>
          </div>

          {/* Gold shimmer line at bottom */}
          <div
            className="h-px w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, #C19A3E 30%, #E8D5A3 50%, #C19A3E 70%, transparent)',
              opacity: 0.3,
            }}
          />
        </div>
      </motion.div>

      {/* ── Rules Modal ── */}
      <Modal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        title="Cómo Jugar"
      >
        <div className="space-y-4 text-sm text-[#2C1810]">
          <p>
            <strong className="text-[#C19A3E]">Marrakech</strong> es un juego
            de estrategia para 2 a 4 jugadores ambientado en el zoco de
            Marrakech.
          </p>

          <div>
            <h3 className="mb-1 font-semibold text-[#C19A3E]">Objetivo</h3>
            <p>
              Ser el jugador con más dirhams al final. Tu puntuación es
              tus dirhams + celdas visibles de tus alfombras.
            </p>
          </div>

          <div>
            <h3 className="mb-1 font-semibold text-[#C19A3E]">Turno de juego</h3>
            <ol className="list-inside list-decimal space-y-1.5 pl-2">
              <li>
                <strong>Orientar a Assam:</strong> gíralo izquierda, derecha o recto.
              </li>
              <li>
                <strong>Lanzar el dado:</strong> Assam avanza 1-4 casillas.
              </li>
              <li>
                <strong>Tributo:</strong> si cae en alfombra rival, pagas según
                el tamaño del grupo conectado.
              </li>
              <li>
                <strong>Colocar alfombra:</strong> coloca una alfombra (2 celdas)
                adyacente a Assam.
              </li>
            </ol>
          </div>

          <div>
            <h3 className="mb-1 font-semibold text-[#C19A3E]">Fin del juego</h3>
            <p>
              Cuando todos colocan todas sus alfombras, gana quien tenga más dirhams.
            </p>
          </div>

          <div className="pt-2 text-center">
            <Button size="sm" onClick={() => setShowRules(false)}>
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
