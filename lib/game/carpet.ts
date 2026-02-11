import { BOARD_SIZE } from './constants';
import type { CarpetCell, CarpetPlacement, Position } from './types';

function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function getNeighbors(pos: Position): Position[] {
  return [
    { row: pos.row - 1, col: pos.col },
    { row: pos.row + 1, col: pos.col },
    { row: pos.row, col: pos.col - 1 },
    { row: pos.row, col: pos.col + 1 },
  ];
}

function isAdjacent(a: Position, b: Position): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

function placementKey(cell1: Position, cell2: Position): string {
  const [a, b] =
    cell1.row < cell2.row || (cell1.row === cell2.row && cell1.col < cell2.col)
      ? [cell1, cell2]
      : [cell2, cell1];
  return `${a.row},${a.col}-${b.row},${b.col}`;
}

export function getValidPlacements(
  board: (CarpetCell | null)[][],
  assamPosition: Position,
  currentPlayerId: number
): CarpetPlacement[] {
  const placements: CarpetPlacement[] = [];
  const seen = new Set<string>();

  const assamNeighbors = getNeighbors(assamPosition).filter(
    (n) => isInBounds(n.row, n.col)
  );

  for (const neighbor of assamNeighbors) {
    // neighbor is adjacent to Assam — try extending in all 4 directions
    const extensions = getNeighbors(neighbor).filter(
      (ext) =>
        isInBounds(ext.row, ext.col) &&
        !(ext.row === assamPosition.row && ext.col === assamPosition.col) &&
        !(ext.row === neighbor.row && ext.col === neighbor.col)
    );

    // Also consider neighbor itself as cell1, and Assam-adjacent cells as cell2
    // We need: carpet = (neighbor, ext) where at least one is adjacent to Assam
    // and neither is the Assam position

    for (const ext of extensions) {
      const cell1IsNeighborOfAssam = isAdjacent(neighbor, assamPosition);
      const cell2IsNeighborOfAssam = isAdjacent(ext, assamPosition);
      if (!cell1IsNeighborOfAssam && !cell2IsNeighborOfAssam) continue;

      // Check it doesn't fully cover a single rival carpet
      const boardCell1 = board[neighbor.row][neighbor.col];
      const boardCell2 = board[ext.row][ext.col];

      if (
        boardCell1 &&
        boardCell2 &&
        boardCell1.carpetId === boardCell2.carpetId &&
        boardCell1.playerId !== currentPlayerId
      ) {
        continue;
      }

      const key = placementKey(neighbor, ext);
      if (!seen.has(key)) {
        seen.add(key);
        placements.push({
          cell1: neighbor,
          cell2: ext,
          playerId: currentPlayerId,
          carpetId: '',
        });
      }
    }

    // Also try placement where neighbor is cell2 (and the other cell is adjacent to neighbor AND adjacent to Assam)
    // This is already covered by the above since we iterate all neighbors of Assam
  }

  // Also consider placements where cell1 is adjacent to Assam and cell2 extends from cell1
  // This may cover cases the above loop missed
  for (const n1 of assamNeighbors) {
    for (const n2 of getNeighbors(n1)) {
      if (!isInBounds(n2.row, n2.col)) continue;
      if (n2.row === assamPosition.row && n2.col === assamPosition.col) continue;
      if (n2.row === n1.row && n2.col === n1.col) continue;
      if (!isAdjacent(n1, n2)) continue;

      // At least one must be adjacent to Assam
      if (!isAdjacent(n1, assamPosition) && !isAdjacent(n2, assamPosition)) continue;

      const boardCell1 = board[n1.row][n1.col];
      const boardCell2 = board[n2.row][n2.col];
      if (
        boardCell1 &&
        boardCell2 &&
        boardCell1.carpetId === boardCell2.carpetId &&
        boardCell1.playerId !== currentPlayerId
      ) {
        continue;
      }

      const key = placementKey(n1, n2);
      if (!seen.has(key)) {
        seen.add(key);
        placements.push({
          cell1: n1,
          cell2: n2,
          playerId: currentPlayerId,
          carpetId: '',
        });
      }
    }
  }

  return placements;
}
