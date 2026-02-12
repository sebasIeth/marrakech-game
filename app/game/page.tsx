'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import { useLobbyStore } from '@/lib/store/lobbyStore';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useBlockchainGame } from '@/hooks/useBlockchainGame';
import { GameBoard } from '@/components/game/GameBoard';
import { GameHeader } from '@/components/game/GameHeader';
import { PlayerPanel } from '@/components/game/PlayerPanel';
import { PhaseControls } from '@/components/game/PhaseControls';
import { ActionLog } from '@/components/game/ActionLog';
import { GameOverScreen } from '@/components/game/GameOverScreen';
import { DiceOverlay } from '@/components/game/DiceOverlay';
import { TransactionStatus } from '@/components/game/TransactionStatus';
import { DiceCommitReveal } from '@/components/game/DiceCommitReveal';
import { WalletBadge } from '@/components/game/WalletBadge';
import { getValidDirections } from '@/lib/game/engine';
import { rollDice } from '@/lib/game/dice';
import type { CarpetPlacement, DiceResult, Direction } from '@/lib/game/types';

export default function GamePage() {
  const router = useRouter();
  const store = useGameStore();
  const myPlayerId = useLobbyStore((s) => s.myPlayerId);
  const { sendOrient, sendRoll, sendBorderChoice, sendTributeContinue, sendPlace, onDiceRolled, flushDiceState } = useMultiplayer();
  const [diceOverlay, setDiceOverlay] = useState<number | null>(null);
  const pendingDiceRef = useRef<DiceResult | null>(null);

  const isOnline = store.mode === 'online';
  const isBlockchain = store.mode === 'blockchain';
  const currentPlayer = store.players[store.currentPlayerIndex];
  const isMyTurn = isOnline || isBlockchain ? currentPlayer?.id === myPlayerId : true;

  // Blockchain hook — only active when mode is blockchain
  const blockchain = useBlockchainGame();

  // In online mode, show the dice overlay when the server broadcasts a roll
  useEffect(() => {
    if (isOnline) {
      onDiceRolled((value) => {
        setDiceOverlay(value);
      });
    }
  }, [isOnline, onDiceRolled]);

  const validDirections = useMemo(
    () =>
      store.phase === 'orient' && store.assam
        ? getValidDirections(store.assam.direction)
        : [],
    [store.phase, store.assam]
  );

  const handleOrient = useCallback(
    (dir: Direction) => {
      if (isBlockchain) {
        blockchain.orientAssam(dir);
      } else if (isOnline) {
        sendOrient(dir);
      } else {
        store.orientAssam(dir);
      }
    },
    [store, isOnline, isBlockchain, sendOrient, blockchain]
  );

  const handleRoll = useCallback(() => {
    if (isBlockchain) {
      // In blockchain mode, dice is a two-step process handled by DiceCommitReveal
      if (blockchain.isDiceCommitPhase) {
        blockchain.commitDice();
      } else if (blockchain.isDiceRevealPhase) {
        blockchain.revealDice();
      }
    } else if (isOnline) {
      sendRoll();
    } else {
      const result = rollDice();
      pendingDiceRef.current = result;
      setDiceOverlay(result.value);
    }
  }, [isOnline, isBlockchain, sendRoll, blockchain]);

  const handleDiceOverlayDone = useCallback(() => {
    setDiceOverlay(null);
    if (isOnline) {
      flushDiceState();
    } else if (pendingDiceRef.current) {
      store.rollDice(pendingDiceRef.current);
      pendingDiceRef.current = null;
    }
  }, [store, isOnline, flushDiceState]);

  const handleBorderChoice = useCallback(
    (dir: Direction) => {
      if (isBlockchain) {
        blockchain.chooseBorderDirection(dir);
      } else if (isOnline) {
        sendBorderChoice(dir);
      } else {
        store.chooseBorderDirection(dir);
      }
    },
    [store, isOnline, isBlockchain, sendBorderChoice, blockchain]
  );

  const handleTributeContinue = useCallback(() => {
    if (isBlockchain) {
      blockchain.acknowledgeTribute();
    } else if (isOnline) {
      sendTributeContinue();
    } else {
      store.processTribute();
    }
  }, [store, isOnline, isBlockchain, sendTributeContinue, blockchain]);

  const handlePlacementSelect = useCallback(
    (placement: CarpetPlacement) => {
      if (isBlockchain) {
        blockchain.placeCarpet(placement);
      } else if (isOnline) {
        sendPlace(placement);
      } else {
        store.placeCarpet(placement);
      }
    },
    [store, isOnline, isBlockchain, sendPlace, blockchain]
  );

  const handleCellClick = useCallback(
    (_row: number, _col: number) => {
      // Cell clicks are handled by GameBoard for placement phase
    },
    []
  );

  const handlePlaceConfirm = useCallback(() => {
    if (store.selectedPlacement) {
      if (isBlockchain) {
        blockchain.placeCarpet(store.selectedPlacement);
      } else if (isOnline) {
        sendPlace(store.selectedPlacement);
      } else {
        store.placeCarpet(store.selectedPlacement);
      }
    }
  }, [store, isOnline, isBlockchain, sendPlace, blockchain]);

  const handlePlayAgain = useCallback(() => {
    if (isBlockchain) {
      // Go back to blockchain setup
      router.push('/');
      return;
    }
    const names = store.players.map((p) => p.name);
    store.initGame(store.numPlayers, store.mode, names);
  }, [store, isBlockchain, router]);

  const handleBackToMenu = useCallback(() => {
    store.resetGame();
    router.push('/');
  }, [store, router]);

  // Redirect if no game in progress
  if (store.players.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFF8E7] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[#2C1810] text-lg">No hay partida en curso</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 rounded-lg bg-[#C19A3E] text-white font-medium hover:bg-[#A67C2E] transition-colors"
          >
            Ir al Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex-1">
          <GameHeader
            currentPlayer={currentPlayer}
            phase={store.phase}
            turnNumber={store.turnNumber}
          />
        </div>
        {isBlockchain && <WalletBadge />}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* Board area */}
        <div className="flex-1 flex items-start justify-center">
          <GameBoard
            board={store.board}
            assam={store.assam}
            validPlacements={store.validPlacements}
            selectedPlacement={store.selectedPlacement}
            currentTribute={store.currentTribute}
            currentPlayerId={currentPlayer?.id ?? 0}
            phase={store.phase}
            movePath={store.movePath}
            onCellClick={handleCellClick}
            onPlacementSelect={handlePlacementSelect}
          />
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-80 flex flex-col gap-3">
          {/* Players */}
          <PlayerPanel
            players={store.players}
            currentPlayerIndex={store.currentPlayerIndex}
            myPlayerId={isOnline || isBlockchain ? myPlayerId : null}
          />

          {/* Transaction status for blockchain mode */}
          {isBlockchain && (
            <TransactionStatus
              status={blockchain.txStatus}
              message={blockchain.txMessage}
              error={blockchain.txError}
            />
          )}

          {/* Phase controls */}
          {isMyTurn ? (
            <>
              {/* Blockchain dice commit-reveal replaces the normal roll button */}
              {isBlockchain && (blockchain.isDiceCommitPhase || blockchain.isDiceRevealPhase) ? (
                <div
                  className="rounded-2xl overflow-hidden p-4"
                  style={{
                    background: 'linear-gradient(180deg, #FDFAF0 0%, #F8F0DC 100%)',
                    border: '1px solid #E0D0A8',
                  }}
                >
                  <DiceCommitReveal
                    isDiceCommitPhase={blockchain.isDiceCommitPhase}
                    isDiceRevealPhase={blockchain.isDiceRevealPhase}
                    txStatus={blockchain.txStatus}
                    onCommit={blockchain.commitDice}
                    onReveal={blockchain.revealDice}
                  />
                </div>
              ) : (
                <PhaseControls
                  phase={store.phase}
                  currentDirection={store.assam.direction}
                  validDirections={validDirections}
                  currentTribute={store.currentTribute}
                  borderChoiceInfo={store.borderChoiceInfo}
                  players={store.players}
                  validPlacements={store.validPlacements}
                  selectedPlacement={store.selectedPlacement}
                  onOrient={handleOrient}
                  onRoll={handleRoll}
                  onBorderChoice={handleBorderChoice}
                  onTributeContinue={handleTributeContinue}
                  onPlaceConfirm={handlePlaceConfirm}
                  disabled={isBlockchain && blockchain.txStatus !== 'idle'}
                />
              )}
            </>
          ) : (isOnline || isBlockchain) && store.phase !== 'moving' && store.phase !== 'gameOver' ? (
            <div
              className="rounded-2xl overflow-hidden text-center py-6 px-4"
              style={{
                background: 'linear-gradient(180deg, #FDFAF0 0%, #F8F0DC 100%)',
                border: '1px solid #E0D0A8',
              }}
            >
              <p className="text-sm font-semibold text-[#8B6914]">
                Turno de {currentPlayer?.name}
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C19A3E] animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#C19A3E] animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#C19A3E] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : null}

          {/* Action log - pushed to bottom */}
          <div className="mt-auto">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1 h-1 rounded-full bg-[#C19A3E]/40" />
              <span className="text-[10px] font-semibold text-[#8B6914]/50 uppercase tracking-wider">
                Historial
              </span>
            </div>
            <ActionLog actions={store.actionLog} />
          </div>
        </div>
      </div>

      {/* Dice overlay */}
      {diceOverlay !== null && (
        <DiceOverlay value={diceOverlay} onDone={handleDiceOverlayDone} />
      )}

      {/* Game Over overlay */}
      {store.gameOver && (
        <GameOverScreen
          finalScores={store.finalScores}
          players={store.players}
          winner={store.winner}
          onPlayAgain={handlePlayAgain}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}
