import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { CarpetPlacement, Direction } from '../game/types';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  getRoomBySocketId,
  startGame,
  handleOrient,
  handleRoll,
  handleBorderChoice,
  handleTributeContinue,
  handlePlace,
  handlePlayerDisconnect,
} from './roomManager';

let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return io;
}

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // --- Room Events ---

    socket.on(
      'room:create',
      (data: { playerName: string; numPlayers: number }) => {
        const { playerName, numPlayers } = data;

        if (numPlayers < 2 || numPlayers > 4) {
          socket.emit('game:error', {
            message: 'Number of players must be between 2 and 4',
          });
          return;
        }

        const room = createRoom(socket.id, playerName, numPlayers);
        socket.join(room.id);

        socket.emit('room:created', {
          roomId: room.id,
          playerId: 0,
          player: room.players[0],
        });

        console.log(
          `[Socket.IO] Room ${room.id} created by ${playerName} (${socket.id})`
        );
      }
    );

    socket.on(
      'room:join',
      (data: { roomId: string; playerName: string }) => {
        const { roomId, playerName } = data;

        const room = joinRoom(roomId, socket.id, playerName);
        if (!room) {
          socket.emit('game:error', {
            message: 'Unable to join room. It may be full, already started, or does not exist.',
          });
          return;
        }

        socket.join(roomId);

        const newPlayer = room.players[room.players.length - 1];

        // Notify the joining player
        socket.emit('room:joined', {
          playerId: newPlayer.id,
          players: room.players,
        });

        // Notify other players in the room
        socket.to(roomId).emit('room:playerJoined', {
          player: newPlayer,
        });

        console.log(
          `[Socket.IO] ${playerName} (${socket.id}) joined room ${roomId}`
        );
      }
    );

    socket.on('room:start', () => {
      const room = getRoomBySocketId(socket.id);
      if (!room) {
        socket.emit('game:error', { message: 'You are not in a room' });
        return;
      }

      if (room.creatorSocketId !== socket.id) {
        socket.emit('game:error', {
          message: 'Only the room creator can start the game',
        });
        return;
      }

      const state = startGame(room.id);
      if (!state) {
        socket.emit('game:error', {
          message: 'Cannot start game. Need at least 2 players.',
        });
        return;
      }

      io!.to(room.id).emit('game:started', { state });

      // Notify the first player it's their turn
      const firstPlayer = state.players[state.currentPlayerIndex];
      if (firstPlayer.socketId) {
        io!.to(firstPlayer.socketId).emit('game:yourTurn', {
          playerId: firstPlayer.id,
        });
      }

      console.log(`[Socket.IO] Game started in room ${room.id}`);
    });

    // --- Game Events ---

    socket.on('game:orient', (data: { direction: Direction }) => {
      const room = getRoomBySocketId(socket.id);
      if (!room) {
        socket.emit('game:error', { message: 'You are not in a room' });
        return;
      }

      const state = handleOrient(room.id, socket.id, data.direction);
      if (!state) {
        socket.emit('game:error', {
          message: 'Invalid orientation or not your turn',
        });
        return;
      }

      io!.to(room.id).emit('game:stateUpdate', { state });
    });

    socket.on('game:roll', () => {
      const room = getRoomBySocketId(socket.id);
      if (!room) {
        socket.emit('game:error', { message: 'You are not in a room' });
        return;
      }

      const state = handleRoll(room.id, socket.id);
      if (!state) {
        socket.emit('game:error', {
          message: 'Cannot roll right now or not your turn',
        });
        return;
      }

      // Send dice result first so clients can show the animation overlay
      if (state.lastDiceRoll) {
        io!.to(room.id).emit('game:diceRolled', {
          value: state.lastDiceRoll.value,
        });
      }

      io!.to(room.id).emit('game:stateUpdate', { state });

      // If the current player was eliminated and has no valid placements,
      // or the game is over, handle accordingly
      if (state.gameOver) {
        io!.to(room.id).emit('game:over', { state });
        return;
      }

      // Notify the current player it is their turn (for place phase)
      const currentPlayer = state.players[state.currentPlayerIndex];
      if (currentPlayer.socketId) {
        io!.to(currentPlayer.socketId).emit('game:yourTurn', {
          playerId: currentPlayer.id,
        });
      }
    });

    socket.on('game:borderChoice', (data: { direction: Direction }) => {
      const room = getRoomBySocketId(socket.id);
      if (!room) {
        socket.emit('game:error', { message: 'You are not in a room' });
        return;
      }

      const state = handleBorderChoice(room.id, socket.id, data.direction);
      if (!state) {
        socket.emit('game:error', {
          message: 'Invalid border choice or not your turn',
        });
        return;
      }

      io!.to(room.id).emit('game:stateUpdate', { state });

      if (state.gameOver) {
        io!.to(room.id).emit('game:over', { state });
        return;
      }
    });

    socket.on('game:tributeContinue', () => {
      const room = getRoomBySocketId(socket.id);
      if (!room) {
        socket.emit('game:error', { message: 'You are not in a room' });
        return;
      }

      const state = handleTributeContinue(room.id, socket.id);
      if (!state) {
        socket.emit('game:error', {
          message: 'Cannot process tribute or not your turn',
        });
        return;
      }

      io!.to(room.id).emit('game:stateUpdate', { state });

      if (state.gameOver) {
        io!.to(room.id).emit('game:over', { state });
        return;
      }
    });

    socket.on('game:place', (data: { placement: CarpetPlacement }) => {
      const room = getRoomBySocketId(socket.id);
      if (!room) {
        socket.emit('game:error', { message: 'You are not in a room' });
        return;
      }

      const state = handlePlace(room.id, socket.id, data.placement);
      if (!state) {
        socket.emit('game:error', {
          message: 'Invalid placement or not your turn',
        });
        return;
      }

      io!.to(room.id).emit('game:stateUpdate', { state });

      if (state.gameOver) {
        io!.to(room.id).emit('game:over', { state });
        return;
      }

      // Notify the next player it's their turn
      const nextPlayer = state.players[state.currentPlayerIndex];
      if (nextPlayer.socketId) {
        io!.to(nextPlayer.socketId).emit('game:yourTurn', {
          playerId: nextPlayer.id,
        });
      }
    });

    // --- Disconnection ---

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);

      const room = getRoomBySocketId(socket.id);
      if (!room) return;

      const roomId = room.id;
      const playerId = room.socketToPlayer.get(socket.id);

      if (room.status === 'playing' && playerId !== undefined) {
        // Handle mid-game disconnect: eliminate player, neutralize carpets, etc.
        const newState = handlePlayerDisconnect(roomId, playerId);
        leaveRoom(roomId, socket.id);

        const updatedRoom = getRoom(roomId);
        if (updatedRoom && newState) {
          io!.to(roomId).emit('room:playerLeft', { playerId });
          io!.to(roomId).emit('game:stateUpdate', { state: newState });

          if (newState.gameOver) {
            io!.to(roomId).emit('game:over', { state: newState });
          }
        }
      } else {
        // Waiting room disconnect
        leaveRoom(roomId, socket.id);

        const updatedRoom = getRoom(roomId);
        if (updatedRoom && playerId !== undefined) {
          io!.to(roomId).emit('room:playerLeft', { playerId });
        }
      }
    });
  });

  console.log('[Socket.IO] Server initialized');
  return io;
}
