import { BOARD_SIZE, DIRECTION_VECTORS, OPPOSITE_DIRECTION } from './constants';
import type { Assam, BorderChoiceInfo, BorderOption, Direction, DiceResult, Position } from './types';

function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

const DIRECTION_LABELS: Record<Direction, string> = {
  N: 'Subir ↑',
  S: 'Bajar ↓',
  E: 'Derecha →',
  W: 'Izquierda ←',
};

/**
 * When Assam would exit the board, the player chooses a perpendicular
 * direction to do a U-turn. That U-turn step moves Assam one cell
 * in the chosen perpendicular direction and costs 1 step.
 * After the turn, Assam faces the OPPOSITE of the original direction.
 *
 * Only returns options that are in-bounds (corners may have just 1).
 */
function getBorderTurnOptions(pos: Position, exitDirection: Direction): BorderOption[] {
  // Perpendicular directions
  const perpDirs: Direction[] =
    exitDirection === 'N' || exitDirection === 'S'
      ? ['W', 'E']
      : ['N', 'S'];

  const options: BorderOption[] = [];
  for (const dir of perpDirs) {
    const vec = DIRECTION_VECTORS[dir];
    if (isInBounds(pos.row + vec.row, pos.col + vec.col)) {
      options.push({ direction: dir, label: DIRECTION_LABELS[dir] });
    }
  }
  return options;
}

/**
 * Moves Assam step by step.
 *
 * When a step would go off the board, ALWAYS pause and let the player
 * choose the perpendicular direction for the U-turn (even in corners
 * where there's only 1 valid option).
 *
 * The U-turn itself consumes 1 step: Assam moves to the perpendicular
 * cell and reverses direction (faces opposite of where it was going).
 */
export function moveAssamUntilBorderOrDone(
  assam: Assam,
  steps: number,
  diceResult: DiceResult,
  pathSoFar: Position[] = [],
): {
  newAssam: Assam;
  path: Position[];
  hitBorder: boolean;
  remainingSteps: number;
  borderInfo: BorderChoiceInfo | null;
} {
  const movePath: Position[] =
    pathSoFar.length > 0 ? [...pathSoFar] : [{ ...assam.position }];
  let currentPos = { ...assam.position };
  let currentDir = assam.direction;
  let remainingSteps = steps;

  while (remainingSteps > 0) {
    const vector = DIRECTION_VECTORS[currentDir];
    const nextRow = currentPos.row + vector.row;
    const nextCol = currentPos.col + vector.col;

    if (isInBounds(nextRow, nextCol)) {
      // Normal step
      currentPos = { row: nextRow, col: nextCol };
      movePath.push({ ...currentPos });
      remainingSteps--;
    } else {
      // Hit the border — always pause and let the player choose
      const options = getBorderTurnOptions(currentPos, currentDir);
      return {
        newAssam: { position: currentPos, direction: currentDir },
        path: movePath,
        hitBorder: true,
        remainingSteps,
        borderInfo: {
          position: currentPos,
          currentDirection: currentDir,
          remainingSteps,
          options,
          pathSoFar: movePath,
          diceResult,
        },
      };
    }
  }

  return {
    newAssam: { position: currentPos, direction: currentDir },
    path: movePath,
    hitBorder: false,
    remainingSteps: 0,
    borderInfo: null,
  };
}

/**
 * After the player chooses a perpendicular direction for the U-turn:
 * 1. Move Assam one cell in the chosen direction (costs 1 step)
 * 2. Reverse Assam's facing direction (opposite of before)
 * 3. Continue movement with remaining - 1 steps
 */
export function continueAfterBorderChoice(
  borderInfo: BorderChoiceInfo,
  chosenDirection: Direction,
): {
  newAssam: Assam;
  path: Position[];
  hitBorder: boolean;
  remainingSteps: number;
  borderInfo: BorderChoiceInfo | null;
} {
  const vec = DIRECTION_VECTORS[chosenDirection];
  const newPos: Position = {
    row: borderInfo.position.row + vec.row,
    col: borderInfo.position.col + vec.col,
  };

  // After U-turn, Assam faces the opposite of the original direction
  const newDirection = OPPOSITE_DIRECTION[borderInfo.currentDirection];

  const pathSoFar = [...borderInfo.pathSoFar, { ...newPos }];
  const stepsAfterTurn = borderInfo.remainingSteps - 1; // U-turn costs 1 step

  const assam: Assam = {
    position: newPos,
    direction: newDirection,
  };

  return moveAssamUntilBorderOrDone(
    assam,
    stepsAfterTurn,
    borderInfo.diceResult,
    pathSoFar,
  );
}

/**
 * Legacy full-move function (used by online mode / server).
 * Moves all steps at once without border choice — auto-picks first option.
 */
export function moveAssam(
  assam: Assam,
  steps: number
): { newAssam: Assam; path: Position[] } {
  const movePath: Position[] = [{ ...assam.position }];
  let currentPos = { ...assam.position };
  let currentDir = assam.direction;
  let remainingSteps = steps;

  while (remainingSteps > 0) {
    const vector = DIRECTION_VECTORS[currentDir];
    const nextRow = currentPos.row + vector.row;
    const nextCol = currentPos.col + vector.col;

    if (isInBounds(nextRow, nextCol)) {
      currentPos = { row: nextRow, col: nextCol };
      movePath.push({ ...currentPos });
      remainingSteps--;
    } else {
      // U-turn: pick first perpendicular option, costs 1 step
      const options = getBorderTurnOptions(currentPos, currentDir);
      const vec = DIRECTION_VECTORS[options[0].direction];
      currentPos = { row: currentPos.row + vec.row, col: currentPos.col + vec.col };
      currentDir = OPPOSITE_DIRECTION[currentDir];
      movePath.push({ ...currentPos });
      remainingSteps--;
    }
  }

  return {
    newAssam: { position: currentPos, direction: currentDir },
    path: movePath,
  };
}
