import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);
import {
  createInitialState,
  orientAssam,
  rollAndMoveAssam,
  chooseBorderDirection,
  processTribute,
  placeCarpet,
  advanceToNextPlayer,
} from '../game/engine';
import { calculateFinalScores } from '../game/scoring';
import { PLAYER_COLORS } from '../game/constants';
import type {
  CarpetPlacement,
  Direction,
  GameState,
  Player,
} from '../game/types';

export interface Room {
  id: string;
  players: Player[];
  maxPlayers: number;
  state: GameState | null;
  creatorSocketId: string;
  status: 'waiting' | 'playing' | 'finished';
  /** Maps socket IDs to player IDs for lookup */
  socketToPlayer: Map<string, number>;
}

const rooms = new Map<string, Room>();

export function createRoom(
  socketId: string,
  playerName: string,
  numPlayers: number
): Room {
  const roomId = nanoid();

  const player: Player = {
    id: 0,
    name: playerName,
    color: PLAYER_COLORS[0],
    dirhams: 0,
    carpetsRemaining: 0,
    eliminated: false,
    connected: true,
    socketId,
  };

  const socketToPlayer = new Map<string, number>();
  socketToPlayer.set(socketId, 0);

  const room: Room = {
    id: roomId,
    players: [player],
    maxPlayers: numPlayers,
    state: null,
    creatorSocketId: socketId,
    status: 'waiting',
    socketToPlayer,
  };

  rooms.set(roomId, room);
  return room;
}

export function joinRoom(
  roomId: string,
  socketId: string,
  playerName: string
): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.status !== 'waiting') return null;
  if (room.players.length >= room.maxPlayers) return null;

  // Check if this socket is already in the room
  if (room.socketToPlayer.has(socketId)) return null;

  const playerId = room.players.length;
  const player: Player = {
    id: playerId,
    name: playerName,
    color: PLAYER_COLORS[playerId],
    dirhams: 0,
    carpetsRemaining: 0,
    eliminated: false,
    connected: true,
    socketId,
  };

  room.players.push(player);
  room.socketToPlayer.set(socketId, playerId);

  return room;
}

export function leaveRoom(roomId: string, socketId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;

  const playerId = room.socketToPlayer.get(socketId);
  if (playerId === undefined) return;

  if (room.status === 'waiting') {
    // Remove the player entirely if the game hasn't started
    room.players = room.players.filter((p) => p.id !== playerId);
    room.socketToPlayer.delete(socketId);

    // If room is empty, delete it
    if (room.players.length === 0) {
      rooms.delete(roomId);
      return;
    }

    // If the creator left, assign a new creator
    if (room.creatorSocketId === socketId && room.players.length > 0) {
      const newCreator = room.players[0];
      room.creatorSocketId = newCreator.socketId ?? '';
    }
  } else if (room.status === 'playing') {
    room.socketToPlayer.delete(socketId);

    // If all players disconnected, clean up the room
    const allDisconnected = ![...room.socketToPlayer.values()].length;
    if (allDisconnected) {
      rooms.delete(roomId);
    }
  }
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function getRoomBySocketId(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.socketToPlayer.has(socketId)) {
      return room;
    }
  }
  return undefined;
}

export function startGame(roomId: string): GameState | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.status !== 'waiting') return null;
  if (room.players.length < 2) return null;

  const playerNames = room.players.map((p) => p.name);
  const state = createInitialState(
    room.players.length,
    'online',
    playerNames,
    roomId
  );

  // Attach socket IDs and connected status to the game state players
  state.players = state.players.map((p, i) => ({
    ...p,
    socketId: room.players[i].socketId,
    connected: room.players[i].connected,
  }));

  room.state = state;
  room.status = 'playing';

  return state;
}

export function handleOrient(
  roomId: string,
  socketId: string,
  direction: Direction
): GameState | null {
  const room = rooms.get(roomId);
  if (!room || !room.state) return null;
  if (room.state.phase !== 'orient') return null;

  // Verify it's this player's turn
  const playerId = room.socketToPlayer.get(socketId);
  if (playerId === undefined) return null;
  if (room.state.players[room.state.currentPlayerIndex].id !== playerId) return null;

  const newState = orientAssam(room.state, direction);
  if (newState === room.state) return null; // Invalid direction

  room.state = newState;
  return newState;
}

export function handleRoll(
  roomId: string,
  socketId: string
): GameState | null {
  const room = rooms.get(roomId);
  if (!room || !room.state) return null;
  if (room.state.phase !== 'roll') return null;

  // Verify it's this player's turn
  const playerId = room.socketToPlayer.get(socketId);
  if (playerId === undefined) return null;
  if (room.state.players[room.state.currentPlayerIndex].id !== playerId) return null;

  const newState = rollAndMoveAssam(room.state);

  // Don't auto-process tribute — let clients see it first.
  // The active player will send game:tributeContinue to proceed.
  room.state = newState;
  return newState;
}

export function handleBorderChoice(
  roomId: string,
  socketId: string,
  direction: Direction
): GameState | null {
  const room = rooms.get(roomId);
  if (!room || !room.state) return null;
  if (room.state.phase !== 'borderChoice') return null;

  // Verify it's this player's turn
  const playerId = room.socketToPlayer.get(socketId);
  if (playerId === undefined) return null;
  if (room.state.players[room.state.currentPlayerIndex].id !== playerId) return null;

  const newState = chooseBorderDirection(room.state, direction);
  if (newState === room.state) return null; // Invalid

  // Don't auto-process tribute — let clients see it first.
  room.state = newState;
  return newState;
}

export function handleTributeContinue(
  roomId: string,
  socketId: string
): GameState | null {
  const room = rooms.get(roomId);
  if (!room || !room.state) return null;
  if (room.state.phase !== 'tribute') return null;

  // Verify it's this player's turn
  const playerId = room.socketToPlayer.get(socketId);
  if (playerId === undefined) return null;
  if (room.state.players[room.state.currentPlayerIndex].id !== playerId) return null;

  const newState = processTribute(room.state);
  room.state = newState;
  return newState;
}

export function handlePlace(
  roomId: string,
  socketId: string,
  placement: CarpetPlacement
): GameState | null {
  const room = rooms.get(roomId);
  if (!room || !room.state) return null;
  if (room.state.phase !== 'place') return null;

  // Verify it's this player's turn
  const playerId = room.socketToPlayer.get(socketId);
  if (playerId === undefined) return null;
  if (room.state.players[room.state.currentPlayerIndex].id !== playerId) return null;

  // Verify placement is valid
  const isValid = room.state.validPlacements.some(
    (vp) =>
      vp.cell1.row === placement.cell1.row &&
      vp.cell1.col === placement.cell1.col &&
      vp.cell2.row === placement.cell2.row &&
      vp.cell2.col === placement.cell2.col
  );

  if (!isValid) return null;

  const newState = placeCarpet(room.state, placement);
  room.state = newState;

  // Update room status if game is over
  if (newState.gameOver) {
    room.status = 'finished';
  }

  return newState;
}

/**
 * Handle a player disconnecting mid-game:
 * - Eliminate them and neutralize their carpets (gray)
 * - If it was their turn, advance to the next player
 * - If only 1 player remains, that player wins
 */
export function handlePlayerDisconnect(
  roomId: string,
  playerId: number
): GameState | null {
  const room = rooms.get(roomId);
  if (!room || !room.state || room.state.gameOver) return null;

  const state = room.state;
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.eliminated) return null;

  // 1. Eliminate the player
  const newPlayers = state.players.map((p) =>
    p.id === playerId
      ? { ...p, eliminated: true, connected: false, dirhams: 0 }
      : { ...p }
  );

  // 2. Neutralize their carpets on the board
  const newBoard = state.board.map((row) =>
    row.map((cell) => {
      if (cell && cell.playerId === playerId) {
        return { ...cell, playerId: -1 };
      }
      return cell;
    })
  );

  const actions: GameState['actionLog'] = [
    ...state.actionLog,
    {
      type: 'disconnect' as const,
      playerId,
      description: `${player.name} se desconectó y fue eliminado`,
      timestamp: Date.now(),
    },
  ];

  // 3. Check if only one player remains → they win
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
      validPlacements: [],
      selectedPlacement: null,
      borderChoiceInfo: null,
      actionLog: [
        ...actions,
        {
          type: 'gameOver',
          playerId: winner?.id ?? 0,
          description: winner
            ? `¡${winner.name} gana! Los demás jugadores se desconectaron`
            : 'Todos los jugadores se desconectaron',
          timestamp: Date.now(),
        },
      ],
    };
    finalState.finalScores = calculateFinalScores(finalState);
    room.state = finalState;
    room.status = 'finished';
    return finalState;
  }

  // 4. If it was the disconnected player's turn, advance to next player
  const wasTheirTurn =
    state.players[state.currentPlayerIndex].id === playerId;

  let newState: GameState = {
    ...state,
    board: newBoard,
    players: newPlayers,
    actionLog: actions,
  };

  if (wasTheirTurn) {
    // Reset turn state and advance
    newState = advanceToNextPlayer({
      ...newState,
      currentTribute: null,
      validPlacements: [],
      selectedPlacement: null,
      borderChoiceInfo: null,
      movePath: [],
    });
  }

  room.state = newState;
  return newState;
}
