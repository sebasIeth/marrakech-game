'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLobbyStore } from '@/lib/store/lobbyStore';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { cn } from '@/lib/utils/cn';

type Tab = 'create' | 'join';

export default function OnlineSetup() {
  const setScreen = useLobbyStore((s) => s.setScreen);
  const numPlayers = useLobbyStore((s) => s.numPlayers);
  const setNumPlayers = useLobbyStore((s) => s.setNumPlayers);

  const { connect, createRoom, joinRoom, connected, error } = useMultiplayer();

  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Track pending action to execute once connected
  const pendingAction = useRef<(() => void) | null>(null);

  // When socket connects and there's a pending action, execute it
  useEffect(() => {
    if (connected && pendingAction.current) {
      pendingAction.current();
      pendingAction.current = null;
      setLoading(false);
    }
  }, [connected]);

  const handleCreate = useCallback(() => {
    if (!playerName.trim()) return;
    setLoading(true);

    if (connected) {
      createRoom(playerName.trim(), numPlayers);
      setLoading(false);
    } else {
      pendingAction.current = () => createRoom(playerName.trim(), numPlayers);
      connect();
    }
  }, [playerName, numPlayers, connected, connect, createRoom]);

  const handleJoin = useCallback(() => {
    if (!playerName.trim() || !joinCode.trim()) return;
    setLoading(true);

    if (connected) {
      joinRoom(joinCode.trim().toUpperCase(), playerName.trim());
      setLoading(false);
    } else {
      pendingAction.current = () => joinRoom(joinCode.trim().toUpperCase(), playerName.trim());
      connect();
    }
  }, [playerName, joinCode, connected, connect, joinRoom]);

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
                  background: 'linear-gradient(135deg, #8B6914, #C19A3E)',
                  boxShadow: '0 3px 12px rgba(193,154,62,0.3)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="1.5" opacity="0.8" />
                  <path d="M11 3 Q11 11 11 19" stroke="white" strokeWidth="1" opacity="0.5" />
                  <path d="M3 11 Q11 11 19 11" stroke="white" strokeWidth="1" opacity="0.5" />
                  <path d="M4 6 Q11 8 18 6" stroke="white" strokeWidth="0.8" opacity="0.35" />
                  <path d="M4 16 Q11 14 18 16" stroke="white" strokeWidth="0.8" opacity="0.35" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-bold text-[#2C1810]">
                Jugar Online
              </h2>
              <div className="mx-auto mt-1.5 flex items-center justify-center gap-2">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#C19A3E]/40" />
                <div className="h-1 w-1 rounded-full bg-[#C19A3E]/30" />
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#C19A3E]/40" />
              </div>
            </motion.div>

            {/* Tabs */}
            <motion.div
              className="mb-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div
                className="flex gap-1 rounded-2xl p-1"
                style={{
                  background: 'linear-gradient(135deg, #FFF8E7, #F4E8C1)',
                  border: '1px solid rgba(193,154,62,0.15)',
                }}
              >
                {(['create', 'join'] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all"
                    style={
                      activeTab === tab
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
                    {tab === 'create' ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" opacity="0.7" />
                          <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
                        </svg>
                        Crear Sala
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8h7M7 5l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                          <path d="M10 3h2a1 1 0 011 1v8a1 1 0 01-1 1h-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
                        </svg>
                        Unirse
                      </>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="mb-4 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-medium"
                  style={{
                    background: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#991B1B',
                  }}
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M8 5v4M8 10.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === 'create' ? (
                <motion.div
                  className="space-y-4"
                  key="create"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Player name */}
                  <InputField
                    label="Tu nombre"
                    icon={
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    }
                    value={playerName}
                    onChange={setPlayerName}
                    maxLength={16}
                    placeholder="Ingresa tu nombre"
                  />

                  {/* Number of players */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#8B6914]/70">
                      Jugadores
                    </label>
                    <div
                      className="flex gap-1.5 rounded-2xl p-1"
                      style={{
                        background: 'rgba(255,248,231,0.8)',
                        border: '1px solid rgba(193,154,62,0.12)',
                      }}
                    >
                      {[2, 3, 4].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setNumPlayers(n)}
                          className="flex-1 rounded-xl py-1.5 text-center text-sm font-bold transition-all"
                          style={
                            numPlayers === n
                              ? {
                                  background: 'linear-gradient(135deg, #C19A3E, #A67C2E)',
                                  color: 'white',
                                  boxShadow: '0 2px 6px rgba(193,154,62,0.3)',
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
                  </div>

                  {/* Create button */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCreate}
                    disabled={!playerName.trim() || loading}
                    className={cn(
                      'relative w-full overflow-hidden rounded-2xl py-3 text-sm font-bold text-white transition-all',
                      (!playerName.trim() || loading) && 'opacity-50 cursor-not-allowed',
                    )}
                    style={{
                      background: 'linear-gradient(135deg, #8B6914 0%, #C19A3E 50%, #8B6914 100%)',
                      boxShadow: '0 4px 16px rgba(193,154,62,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Conectando...
                      </span>
                    ) : (
                      'Crear Sala'
                    )}
                    <div className="absolute inset-0 opacity-[0.04]" style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 8px)',
                    }} />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  className="space-y-4"
                  key="join"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Room code */}
                  <div>
                    <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8B6914]/70">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M5 6h6M5 8h6M5 10h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                      </svg>
                      Codigo de sala
                    </label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                      maxLength={6}
                      placeholder="ABCDEF"
                      className="w-full rounded-2xl border bg-white/80 px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.3em] text-[#2C1810] uppercase placeholder-[#C19A3E]/30 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#C19A3E]/30"
                      style={{
                        borderColor: 'rgba(193,154,62,0.2)',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#C19A3E';
                        e.target.style.boxShadow = '0 0 0 3px rgba(193,154,62,0.15), inset 0 1px 3px rgba(0,0,0,0.04)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(193,154,62,0.2)';
                        e.target.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.04)';
                      }}
                    />
                    {/* Code length indicator */}
                    <div className="mt-1.5 flex justify-center gap-1">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-1 w-4 rounded-full transition-colors"
                          style={{
                            background: i < joinCode.length
                              ? 'linear-gradient(135deg, #C19A3E, #A67C2E)'
                              : 'rgba(193,154,62,0.15)',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Player name */}
                  <InputField
                    label="Tu nombre"
                    icon={
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    }
                    value={playerName}
                    onChange={setPlayerName}
                    maxLength={16}
                    placeholder="Ingresa tu nombre"
                  />

                  {/* Join button */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleJoin}
                    disabled={!playerName.trim() || joinCode.trim().length < 6 || loading}
                    className={cn(
                      'relative w-full overflow-hidden rounded-2xl py-3 text-sm font-bold text-white transition-all',
                      (!playerName.trim() || joinCode.trim().length < 6 || loading) && 'opacity-50 cursor-not-allowed',
                    )}
                    style={{
                      background: 'linear-gradient(135deg, #8B6914 0%, #C19A3E 50%, #8B6914 100%)',
                      boxShadow: '0 4px 16px rgba(193,154,62,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Conectando...
                      </span>
                    ) : (
                      'Unirse a Sala'
                    )}
                    <div className="absolute inset-0 opacity-[0.04]" style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 8px)',
                    }} />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Back button */}
            <motion.div
              className="mt-4 border-t pt-3"
              style={{ borderColor: 'rgba(193,154,62,0.12)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleBack}
                className="w-full rounded-2xl py-2.5 text-sm font-semibold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  border: '1.5px solid rgba(193,154,62,0.2)',
                  color: '#8B6914',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                }}
              >
                Volver
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

/* ── Reusable styled input field ── */
function InputField({
  label,
  icon,
  value,
  onChange,
  maxLength,
  placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8B6914]/70">
        {icon}
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          className="w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-sm text-[#2C1810] placeholder-[#C19A3E]/30 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#C19A3E]/30"
          style={{
            borderColor: 'rgba(193,154,62,0.2)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#C19A3E';
            e.target.style.boxShadow = '0 0 0 3px rgba(193,154,62,0.15), inset 0 1px 3px rgba(0,0,0,0.04)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(193,154,62,0.2)';
            e.target.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.04)';
          }}
        />
        {/* Character count */}
        {value.length > 0 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#C19A3E]/40">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
