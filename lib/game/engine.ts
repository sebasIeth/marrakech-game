import {
  BOARD_SIZE,
  CARPETS_PER_PLAYER,
  OPPOSITE_DIRECTION,
  PLAYER_COLORS,
  STARTING_DIRHAMS,
  TURNS,
} from './constants';
import { moveAssamUntilBorderOrDone, continueAfterBorderChoice } from './assam';
import { getValidPlacements } from './carpet';
import { rollDice } from './dice';
import { calculateFinalScores } from './scoring';
import { calculateTribute } from './tribute';
import type {
  Assam,
  CarpetPlacement,
  DiceResult,
  Direction,
  GameAction,
  GameMode,
  GameState,
  Player,
} from './types';

export function createInitialState(
  numPlayers: number,
  mode: GameMode,
  playerNames?: string[],
  roomId?: string
): GameState {
  const board: (null)[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );

  const assam: Assam = {
    position: { row: 3, col: 3 },
    direction: 'N',
  };

  const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
    id: i,
    name: playerNames?.[i] || `Jugador ${i + 1}`,
    color: PLAYER_COLORS[i],
    dirhams: STARTING_DIRHAMS,
    carpetsRemaining: CARPETS_PER_PLAYER[numPlayers],
    eliminated: false,
  }));

  return {
    mode,
    numPlayers,
    roomId,
    board,
    assam,
    players,
    currentPlayerIndex: 0,
    phase: 'orient',
    lastDiceRoll: null,
    currentTribute: null,
    validPlacements: [],
    selectedPlacement: null,
    borderChoiceInfo: null,
    movePath: [],
    actionLog: [],
    gameOver: false,
    winner: null,
    finalScores: [],
    turnNumber: 1,
  };
}

export function getValidDirections(currentDirection: Direction): Direction[] {
  const opposite = OPPOSITE_DIRECTION[currentDirection];
  const turns = TURNS[currentDirection];
  return [turns.straight, turns.left, turns.right].filter((d) => d !== opposite);
}

export function orientAssam(state: GameState, direction: Direction): GameState {
  const validDirs = getValidDirections(state.assam.direction);
  if (!validDirs.includes(direction)) return state;

  const player = state.players[state.currentPlayerIndex];
  const newAction: GameAction = {
    type: 'orient',
    playerId: player.id,
    description: `${player.name} orientó a Assam hacia el ${directionName(direction)}`,
    timestamp: Date.now(),
  };

  return {
    ...state,
    assam: { ...state.assam, direction },
    phase: 'roll',
    actionLog: [...state.actionLog, newAction],
  };
}

export function rollAndMoveAssam(state: GameState, preRolledDice?: DiceResult): GameState {
  const diceResult = preRolledDice ?? rollDice();
  const result = moveAssamUntilBorderOrDone(state.assam, diceResult.value, diceResult);

  const player = state.players[state.currentPlayerIndex];
  const rollAction: GameAction = {
    type: 'roll',
    playerId: player.id,
    description: `${player.name} lanzó el dado: ${diceResult.value} ${diceResult.value === 1 ? 'babucha' : 'babuchas'}`,
    timestamp: Date.now(),
  };

  if (result.hitBorder) {
    // Assam hit the border — pause for player to choose direction
    return {
      ...state,
      assam: result.newAssam,
      lastDiceRoll: diceResult,
      movePath: result.path,
      borderChoiceInfo: result.borderInfo,
      phase: 'borderChoice',
      actionLog: [...state.actionLog, rollAction],
    };
  }

  // Movement completed without hitting border
  const moveAction: GameAction = {
    type: 'move',
    playerId: player.id,
    description: `Assam se movió a (${result.newAssam.position.row}, ${result.newAssam.position.col})`,
    timestamp: Date.now(),
  };

  const tribute = calculateTribute(
    state.board,
    result.newAssam.position,
    player.id
  );

  return {
    ...state,
    assam: result.newAssam,
    lastDiceRoll: diceResult,
    movePath: result.path,
    currentTribute: tribute,
    borderChoiceInfo: null,
    phase: 'tribute',
    actionLog: [...state.actionLog, rollAction, moveAction],
  };
}

export function chooseBorderDirection(state: GameState, direction: Direction): GameState {
  if (!state.borderChoiceInfo) return state;

  const result = continueAfterBorderChoice(state.borderChoiceInfo, direction);
  const player = state.players[state.currentPlayerIndex];

  if (result.hitBorder) {
    // Hit another border — pause again
    return {
      ...state,
      assam: result.newAssam,
      movePath: result.path,
      borderChoiceInfo: result.borderInfo,
      phase: 'borderChoice',
    };
  }

  // Movement completed
  const moveAction: GameAction = {
    type: 'move',
    playerId: player.id,
    description: `Assam se movió a (${result.newAssam.position.row}, ${result.newAssam.position.col})`,
    timestamp: Date.now(),
  };

  const tribute = calculateTribute(
    state.board,
    result.newAssam.position,
    player.id
  );

  return {
    ...state,
    assam: result.newAssam,
    movePath: result.path,
    lastDiceRoll: state.lastDiceRoll,
    currentTribute: tribute,
    borderChoiceInfo: null,
    phase: 'tribute',
    actionLog: [...state.actionLog, moveAction],
  };
}

export function processTribute(state: GameState): GameState {
  const tribute = state.currentTribute;
  const newPlayers = [...state.players.map((p) => ({ ...p }))];
  const actions: GameAction[] = [];
  const currentPlayer = newPlayers[state.currentPlayerIndex];

  if (tribute && tribute.amount > 0) {
    const receiver = newPlayers.find((p) => p.id === tribute.toPlayerId)!;
    const actualPayment = Math.min(tribute.amount, currentPlayer.dirhams);

    currentPlayer.dirhams -= actualPayment;
    receiver.dirhams += actualPayment;

    actions.push({
      type: 'tribute',
      playerId: currentPlayer.id,
      description: `${currentPlayer.name} pagó ${actualPayment} dirhams a ${receiver.name}`,
      timestamp: Date.now(),
    });

    // Check elimination
    if (currentPlayer.dirhams <= 0) {
      currentPlayer.eliminated = true;
      currentPlayer.dirhams = 0;

      // Neutralize this player's carpets
      const newBoard = state.board.map((row) =>
        row.map((cell) => {
          if (cell && cell.playerId === currentPlayer.id) {
            return { ...cell, playerId: -1 };
          }
          return cell;
        })
      );

      actions.push({
        type: 'eliminate',
        playerId: currentPlayer.id,
        description: `${currentPlayer.name} fue eliminado por falta de dirhams`,
        timestamp: Date.now(),
      });

      // Check if only one player remains
      const activePlayers = newPlayers.filter((p) => !p.eliminated);
      if (activePlayers.length <= 1) {
        const winner = activePlayers[0];
        const finalState: GameState = {
          ...state,
          board: newBoard,
          players: newPlayers,
          currentTribute: null,
          phase: 'gameOver',
          gameOver: true,
          winner: winner?.id ?? null,
          actionLog: [...state.actionLog, ...actions],
        };
        finalState.finalScores = calculateFinalScores(finalState);
        return finalState;
      }

      // If eliminated player was current, skip to place phase then next turn
      return {
        ...state,
        board: newBoard,
        players: newPlayers,
        currentTribute: null,
        phase: 'place',
        validPlacements: [],
        actionLog: [...state.actionLog, ...actions],
      };
    }
  } else {
    actions.push({
      type: 'tribute',
      playerId: currentPlayer.id,
      description: tribute
        ? `${currentPlayer.name} cayó en su propia alfombra. Sin tributo`
        : `Assam cayó en casilla libre. Sin tributo`,
      timestamp: Date.now(),
    });
  }

  // Calculate valid placements for next phase
  const valid = getValidPlacements(
    state.board,
    state.assam.position,
    currentPlayer.id
  );

  return {
    ...state,
    players: newPlayers,
    currentTribute: null,
    phase: 'place',
    validPlacements: valid,
    selectedPlacement: null,
    actionLog: [...state.actionLog, ...actions],
  };
}

export function placeCarpet(
  state: GameState,
  placement: CarpetPlacement
): GameState {
  const player = state.players[state.currentPlayerIndex];
  const carpetNumber = CARPETS_PER_PLAYER[state.numPlayers] - player.carpetsRemaining + 1;
  const carpetId = `p${player.id}_c${String(carpetNumber).padStart(2, '0')}`;

  const newBoard = state.board.map((row) => row.map((cell) => cell));
  newBoard[placement.cell1.row][placement.cell1.col] = {
    playerId: player.id,
    carpetId,
  };
  newBoard[placement.cell2.row][placement.cell2.col] = {
    playerId: player.id,
    carpetId,
  };

  const newPlayers = state.players.map((p) =>
    p.id === player.id
      ? { ...p, carpetsRemaining: p.carpetsRemaining - 1 }
      : { ...p }
  );

  const action: GameAction = {
    type: 'place',
    playerId: player.id,
    description: `${player.name} colocó una alfombra en (${placement.cell1.row},${placement.cell1.col})-(${placement.cell2.row},${placement.cell2.col})`,
    timestamp: Date.now(),
  };

  // Check game over: all players have placed all carpets
  const allCarpetsPlaced = newPlayers.every(
    (p) => p.eliminated || p.carpetsRemaining === 0
  );

  if (allCarpetsPlaced) {
    const finalState: GameState = {
      ...state,
      board: newBoard,
      players: newPlayers,
      phase: 'gameOver',
      gameOver: true,
      validPlacements: [],
      selectedPlacement: null,
      actionLog: [...state.actionLog, action],
    };
    finalState.finalScores = calculateFinalScores(finalState);
    finalState.winner = finalState.finalScores[0]?.playerId ?? null;

    finalState.actionLog.push({
      type: 'gameOver',
      playerId: finalState.winner ?? 0,
      description: `¡Fin de la partida! ${newPlayers.find((p) => p.id === finalState.winner)?.name ?? 'Empate'} gana`,
      timestamp: Date.now(),
    });

    return finalState;
  }

  // Advance to next player
  return advanceToNextPlayer({
    ...state,
    board: newBoard,
    players: newPlayers,
    validPlacements: [],
    selectedPlacement: null,
    actionLog: [...state.actionLog, action],
  });
}

export function advanceToNextPlayer(state: GameState): GameState {
  let nextIndex = (state.currentPlayerIndex + 1) % state.numPlayers;
  let checked = 0;

  // Skip eliminated players
  while (state.players[nextIndex].eliminated && checked < state.numPlayers) {
    nextIndex = (nextIndex + 1) % state.numPlayers;
    checked++;
  }

  // Also skip players with no carpets remaining
  checked = 0;
  while (
    state.players[nextIndex].carpetsRemaining === 0 &&
    !state.players[nextIndex].eliminated &&
    checked < state.numPlayers
  ) {
    nextIndex = (nextIndex + 1) % state.numPlayers;
    checked++;
  }

  // Check if game should end (no active players with carpets)
  const activePlayers = state.players.filter(
    (p) => !p.eliminated && p.carpetsRemaining > 0
  );
  if (activePlayers.length === 0) {
    const finalState: GameState = {
      ...state,
      phase: 'gameOver',
      gameOver: true,
    };
    finalState.finalScores = calculateFinalScores(finalState);
    finalState.winner = finalState.finalScores[0]?.playerId ?? null;
    return finalState;
  }

  return {
    ...state,
    currentPlayerIndex: nextIndex,
    phase: 'orient',
    lastDiceRoll: null,
    currentTribute: null,
    borderChoiceInfo: null,
    movePath: [],
    turnNumber: state.turnNumber + 1,
  };
}

function directionName(dir: Direction): string {
  const names: Record<Direction, string> = {
    N: 'Norte',
    S: 'Sur',
    E: 'Este',
    W: 'Oeste',
  };
  return names[dir];
}
