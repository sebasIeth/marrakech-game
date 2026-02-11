'use client';

import type { Phase, Direction, CarpetPlacement, TributeInfo, Player, BorderChoiceInfo } from '@/lib/game/types';
import { DirectionPicker } from './DirectionPicker';
import { Dice } from './Dice';
import { TributeDisplay } from './TributeDisplay';
import { BorderChoicePicker } from './BorderChoicePicker';

interface PhaseControlsProps {
  phase: Phase;
  currentDirection: Direction;
  validDirections: Direction[];
  currentTribute: TributeInfo | null;
  borderChoiceInfo: BorderChoiceInfo | null;
  players: Player[];
  validPlacements: CarpetPlacement[];
  selectedPlacement: CarpetPlacement | null;
  onOrient: (dir: Direction) => void;
  onRoll: () => void;
  onBorderChoice: (dir: Direction) => void;
  onTributeContinue: () => void;
  onPlaceConfirm: () => void;
  disabled?: boolean;
}

const PHASE_TITLES: Partial<Record<Phase, string>> = {
  orient: 'Orientar Assam',
  roll: 'Lanzar Dado',
  borderChoice: 'Vuelta en borde',
  tribute: 'Tributo',
  place: 'Colocar Alfombra',
};

export function PhaseControls({
  phase,
  currentDirection,
  validDirections,
  currentTribute,
  borderChoiceInfo,
  players,
  validPlacements,
  selectedPlacement,
  onOrient,
  onRoll,
  onBorderChoice,
  onTributeContinue,
  onPlaceConfirm,
  disabled,
}: PhaseControlsProps) {
  const title = PHASE_TITLES[phase];

  // Don't show controls during moving or gameOver
  if (phase === 'moving' || phase === 'gameOver') return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #FDFAF0 0%, #F8F0DC 100%)',
        border: '1px solid #E0D0A8',
        boxShadow: '0 2px 8px rgba(139,105,20,0.08)',
      }}
    >
      {/* Section header */}
      {title && (
        <div
          className="px-4 py-2 flex items-center gap-2"
          style={{
            background: 'linear-gradient(90deg, rgba(193,154,62,0.1) 0%, transparent 100%)',
            borderBottom: '1px solid rgba(193,154,62,0.15)',
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#C19A3E]" />
          <span className="text-xs font-semibold text-[#8B6914] uppercase tracking-wider">
            {title}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {phase === 'orient' && (
          <DirectionPicker
            currentDirection={currentDirection}
            validDirections={validDirections}
            onSelect={onOrient}
            disabled={disabled}
          />
        )}

        {phase === 'roll' && (
          <Dice
            onRoll={onRoll}
            disabled={disabled}
          />
        )}

        {phase === 'borderChoice' && borderChoiceInfo && (
          <BorderChoicePicker
            borderInfo={borderChoiceInfo}
            onChoose={onBorderChoice}
          />
        )}

        {phase === 'tribute' && (
          <TributeDisplay
            tribute={currentTribute}
            players={players}
            onContinue={onTributeContinue}
          />
        )}

        {phase === 'place' && (
          <div className="space-y-3">
            {validPlacements.length > 0 ? (
              <>
                <p className="text-xs text-[#8B6914]">
                  Haz click en dos casillas adyacentes resaltadas para colocar tu alfombra
                </p>
                {selectedPlacement && (
                  <button
                    className="w-full py-3 rounded-xl bg-[#4A154B] text-white font-semibold text-sm hover:bg-[#5C1B5E] transition-colors shadow-sm"
                    onClick={onPlaceConfirm}
                  >
                    Confirmar colocación
                  </button>
                )}
              </>
            ) : (
              <p className="text-xs text-[#8B6914]/60 text-center py-2">
                No hay posiciones válidas
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
