import { BOARD_SIZE } from './constants';
import type { FinalScore, GameState } from './types';

export function calculateFinalScores(state: GameState): FinalScore[] {
  return state.players
    .map((player) => {
      let visibleCells = 0;

      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const cell = state.board[row][col];
          if (cell && cell.playerId === player.id) {
            visibleCells++;
          }
        }
      }

      return {
        playerId: player.id,
        name: player.name,
        dirhams: player.dirhams,
        visibleCells,
        total: player.dirhams + visibleCells,
      };
    })
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return b.dirhams - a.dirhams;
    });
}
