'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiceOverlayProps {
  value: number;
  onDone: () => void;
}

const CUBE_SIZE = 130;
const HALF = CUBE_SIZE / 2;

/* ── Babucha (Moroccan slipper) SVG ── */
function Babucha({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 26 18" width={size} height={size * 18 / 26}>
      {/* Sole */}
      <path
        d="M4 13 C3 11,3 9,5 7 L10 4 C14 2,19 3,21 5 L22 8 C23 10,22 12,20 13 L14 14 C10 15,6 14,4 13Z"
        fill="#5C2E0E"
      />
      {/* Upper */}
      <path
        d="M5 11 C5 9,7 7,11 5 C15 4,19 5,21 7 L20 10 C18 12,12 13,7 12Z"
        fill="#C19A3E"
      />
      {/* Pointed toe curl */}
      <path
        d="M5 9 L3 7 C2 5.5,3 4.5,5 5.5 L7 7"
        fill="#C19A3E"
        stroke="#A07830"
        strokeWidth="0.4"
      />
      {/* Toe highlight */}
      <path
        d="M5 9 L3 7"
        stroke="#DEB887"
        strokeWidth="0.5"
        fill="none"
      />
      {/* Decorative stitch */}
      <path
        d="M8 9.5 Q14 7,19 8.5"
        fill="none"
        stroke="#E8D5A3"
        strokeWidth="0.6"
        strokeDasharray="1.5 1"
      />
      {/* Shine */}
      <ellipse cx="14" cy="7" rx="4" ry="2" fill="rgba(255,255,255,0.12)" />
    </svg>
  );
}

/* ── Dice face with babuchas arranged like pips ── */
function DiceFace({ value, size }: { value: number; size: number }) {
  const babuchaSize = size * 0.26;

  // Pip positions (% of face) for each value
  const layouts: Record<number, { x: number; y: number }[]> = {
    1: [{ x: 50, y: 50 }],
    2: [{ x: 30, y: 30 }, { x: 70, y: 70 }],
    3: [{ x: 30, y: 28 }, { x: 50, y: 50 }, { x: 70, y: 72 }],
    4: [{ x: 30, y: 30 }, { x: 70, y: 30 }, { x: 30, y: 70 }, { x: 70, y: 70 }],
  };

  const positions = layouts[value] || layouts[1];

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.12,
        background: 'linear-gradient(145deg, #FFF8E7 0%, #F0E4C8 40%, #E0D0A8 100%)',
        border: `${size * 0.025}px solid #B8942E`,
        boxShadow:
          'inset 0 2px 6px rgba(255,255,255,0.4), inset 0 -2px 6px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {/* Corner dots (decorative) */}
      {[
        { top: '8%', left: '8%' },
        { top: '8%', right: '8%' },
        { bottom: '8%', left: '8%' },
        { bottom: '8%', right: '8%' },
      ].map((pos, i) => (
        <div
          key={`dot-${i}`}
          className="absolute rounded-full"
          style={{
            ...pos,
            width: size * 0.035,
            height: size * 0.035,
            backgroundColor: 'rgba(193,154,62,0.25)',
          }}
        />
      ))}

      {/* Babuchas as pips */}
      {positions.map((pos, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Babucha size={babuchaSize} />
        </div>
      ))}
    </div>
  );
}

/* ── Rotation targets per value ──
 * Face mapping: Front=1, Right=2, Back=2, Left=3, Top=3, Bottom=4
 */
const VALUE_ROTATION: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: 90, y: 0 },
  4: { x: -90, y: 0 },
};

export function DiceOverlay({ value, onDone }: DiceOverlayProps) {
  const [phase, setPhase] = useState<'spinning' | 'result' | 'fading'>('spinning');

  const stableOnDone = useCallback(onDone, [onDone]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('result'), 1500);
    const t2 = setTimeout(() => setPhase('fading'), 3400);
    const t3 = setTimeout(stableOnDone, 3800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [stableOnDone]);

  const target = VALUE_ROTATION[value] ?? VALUE_ROTATION[1];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === 'fading' ? 0 : 1 }}
      transition={{ duration: phase === 'fading' ? 0.4 : 0.2 }}
    >
      <div className="flex flex-col items-center gap-8">
        {/* 3D Dice cube */}
        <div style={{ perspective: 800 }}>
          <motion.div
            style={{
              width: CUBE_SIZE,
              height: CUBE_SIZE,
              transformStyle: 'preserve-3d',
              position: 'relative',
            }}
            initial={{ rotateX: 0, rotateY: 0 }}
            animate={{
              rotateX: [0, 360, 720 + target.x],
              rotateY: [0, 300, 600 + target.y],
            }}
            transition={{
              duration: 1.5,
              ease: [0.22, 0.8, 0.3, 1],
            }}
          >
            {/* Front → 1 babucha */}
            <div
              className="absolute"
              style={{
                width: CUBE_SIZE,
                height: CUBE_SIZE,
                transform: `translateZ(${HALF}px)`,
                backfaceVisibility: 'hidden',
              }}
            >
              <DiceFace value={1} size={CUBE_SIZE} />
            </div>

            {/* Back → 2 babuchas */}
            <div
              className="absolute"
              style={{
                width: CUBE_SIZE,
                height: CUBE_SIZE,
                transform: `rotateY(180deg) translateZ(${HALF}px)`,
                backfaceVisibility: 'hidden',
              }}
            >
              <DiceFace value={2} size={CUBE_SIZE} />
            </div>

            {/* Right → 2 babuchas */}
            <div
              className="absolute"
              style={{
                width: CUBE_SIZE,
                height: CUBE_SIZE,
                transform: `rotateY(90deg) translateZ(${HALF}px)`,
                backfaceVisibility: 'hidden',
              }}
            >
              <DiceFace value={2} size={CUBE_SIZE} />
            </div>

            {/* Left → 3 babuchas */}
            <div
              className="absolute"
              style={{
                width: CUBE_SIZE,
                height: CUBE_SIZE,
                transform: `rotateY(-90deg) translateZ(${HALF}px)`,
                backfaceVisibility: 'hidden',
              }}
            >
              <DiceFace value={3} size={CUBE_SIZE} />
            </div>

            {/* Top → 3 babuchas */}
            <div
              className="absolute"
              style={{
                width: CUBE_SIZE,
                height: CUBE_SIZE,
                transform: `rotateX(-90deg) translateZ(${HALF}px)`,
                backfaceVisibility: 'hidden',
              }}
            >
              <DiceFace value={3} size={CUBE_SIZE} />
            </div>

            {/* Bottom → 4 babuchas */}
            <div
              className="absolute"
              style={{
                width: CUBE_SIZE,
                height: CUBE_SIZE,
                transform: `rotateX(90deg) translateZ(${HALF}px)`,
                backfaceVisibility: 'hidden',
              }}
            >
              <DiceFace value={4} size={CUBE_SIZE} />
            </div>
          </motion.div>
        </div>

        {/* Ground shadow */}
        <motion.div
          className="rounded-full"
          style={{
            width: CUBE_SIZE * 1.2,
            height: 12,
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%)',
            marginTop: -20,
          }}
          initial={{ opacity: 0, scaleX: 0.5 }}
          animate={{
            opacity: phase === 'spinning' ? [0, 0.5, 1] : 1,
            scaleX: phase === 'spinning' ? [0.5, 1.2, 1] : 1,
          }}
          transition={{ duration: 1.5 }}
        />

        {/* Result display */}
        <AnimatePresence>
          {phase === 'result' && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div
                className="font-display font-bold text-white mb-3"
                style={{
                  fontSize: 56,
                  textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                }}
              >
                {value}
              </div>

              {/* Row of babuchas */}
              <div className="flex gap-3 justify-center mb-2">
                {Array.from({ length: value }, (_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: i * 0.12,
                      type: 'spring',
                      stiffness: 400,
                      damping: 15,
                    }}
                  >
                    <Babucha size={36} />
                  </motion.div>
                ))}
              </div>

              <div className="text-white/70 text-sm mt-1">
                {value === 1 ? '1 babucha' : `${value} babuchas`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
