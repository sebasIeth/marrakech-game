import { PLAYER_COLORS, BOARD_SIZE, CARPETS_PER_PLAYER } from '@/lib/game/constants';
import type {
  GameState,
  CarpetCell,
  Player,
  Direction,
  Phase,
  Assam,
  TributeInfo,
  BorderChoiceInfo,
  DiceResult,
} from '@/lib/game/types';
import { UINT8_TO_DIRECTION, PHASE_MAP, EMPTY_CELL, NEUTRALIZED_CELL, CONTRACT_PHASE } from './config';

// Direction labels for border choice options
const DIRECTION_LABELS: Record<Direction, string> = {
  N: 'Subir ↑',
  S: 'Bajar ↓',
  E: 'Derecha →',
  W: 'Izquierda ←',
};

interface OnChainFullState {
  status: number;
  phase: number;
  currentPlayerIndex: number;
  turnNumber: number;
  numPlayers: number;
  joinedCount: number;
  lastDiceValue: number;
  assamRow: number;
  assamCol: number;
  assamDir: number;
  boardPlayerIds: readonly number[];
  boardCarpetIds: readonly number[];
}

interface OnChainPlayers {
  wallets: readonly string[];
  dirhamsArr: readonly number[];
  carpetsArr: readonly number[];
  eliminatedArr: readonly boolean[];
  joinedArr: readonly boolean[];
}

interface OnChainTribute {
  fromPlayer: number;
  toPlayer: number;
  amount: number;
}

interface OnChainBorderChoice {
  row: number;
  col: number;
  exitDirection: number;
  remainingSteps: number;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function convertOnChainToGameState(
  fullState: OnChainFullState,
  playersData: OnChainPlayers,
  tributeData?: OnChainTribute,
  borderData?: OnChainBorderChoice,
  gameAddress?: string,
): GameState {
  const numPlayers = Number(fullState.numPlayers);

  // Convert board
  const board: (CarpetCell | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );

  for (let i = 0; i < 49; i++) {
    const playerId = Number(fullState.boardPlayerIds[i]);
    const carpetId = Number(fullState.boardCarpetIds[i]);
    const row = Math.floor(i / BOARD_SIZE);
    const col = i % BOARD_SIZE;

    if (playerId !== EMPTY_CELL && playerId !== NEUTRALIZED_CELL) {
      board[row][col] = {
        playerId: playerId,
        carpetId: `p${playerId}_c${String(carpetId).padStart(2, '0')}`,
      };
    } else if (playerId === NEUTRALIZED_CELL) {
      board[row][col] = {
        playerId: -1,
        carpetId: `neutralized_${carpetId}`,
      };
    }
  }

  // Convert Assam
  const assamDir = UINT8_TO_DIRECTION[fullState.assamDir as keyof typeof UINT8_TO_DIRECTION] || 'N';
  const assam: Assam = {
    position: { row: Number(fullState.assamRow), col: Number(fullState.assamCol) },
    direction: assamDir as Direction,
  };

  // Convert Players
  const players: Player[] = [];
  for (let i = 0; i < numPlayers; i++) {
    const wallet = playersData.wallets[i] as string;
    players.push({
      id: i,
      name: playersData.joinedArr[i] ? truncateAddress(wallet) : `Jugador ${i + 1}`,
      color: PLAYER_COLORS[i],
      dirhams: Number(playersData.dirhamsArr[i]),
      carpetsRemaining: Number(playersData.carpetsArr[i]),
      eliminated: playersData.eliminatedArr[i],
    });
  }

  // Convert phase
  const contractPhase = Number(fullState.phase);
  const uiPhase = PHASE_MAP[contractPhase as keyof typeof PHASE_MAP] as Phase || 'orient';

  // Handle waiting state
  if (contractPhase === CONTRACT_PHASE.WaitingForPlayers) {
    return {
      mode: 'blockchain',
      numPlayers,
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

  // Convert dice result
  const lastDiceValue = Number(fullState.lastDiceValue);
  const lastDiceRoll: DiceResult | null = lastDiceValue > 0
    ? { value: lastDiceValue, faces: [lastDiceValue] }
    : null;

  // Convert tribute info
  let currentTribute: TributeInfo | null = null;
  if (tributeData && contractPhase === CONTRACT_PHASE.Tribute) {
    const fromIdx = Number(tributeData.fromPlayer);
    const toIdx = Number(tributeData.toPlayer);
    const amount = Number(tributeData.amount);

    if (amount > 0 && fromIdx !== toIdx) {
      currentTribute = {
        fromPlayerId: fromIdx,
        toPlayerId: toIdx,
        amount,
        connectedCells: [], // BFS is on-chain, we don't need cells for display
      };
    }
  }

  // Convert border choice info
  let borderChoiceInfo: BorderChoiceInfo | null = null;
  if (borderData && contractPhase === CONTRACT_PHASE.BorderChoice) {
    const exitDir = UINT8_TO_DIRECTION[Number(borderData.exitDirection) as keyof typeof UINT8_TO_DIRECTION] as Direction;
    const perpDirs: Direction[] =
      exitDir === 'N' || exitDir === 'S' ? ['W', 'E'] : ['N', 'S'];

    const row = Number(borderData.row);
    const col = Number(borderData.col);
    const options = perpDirs
      .filter((d) => {
        const vec = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] }[d];
        const nr = row + vec[0];
        const nc = col + vec[1];
        return nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE;
      })
      .map((d) => ({ direction: d, label: DIRECTION_LABELS[d] }));

    borderChoiceInfo = {
      position: { row, col },
      currentDirection: exitDir,
      remainingSteps: Number(borderData.remainingSteps),
      options,
      pathSoFar: [],
      diceResult: lastDiceRoll || { value: 0, faces: [0] },
    };
  }

  // Check game over
  const isGameOver = contractPhase === CONTRACT_PHASE.GameOver;

  // Calculate final scores if game over
  let finalScores: GameState['finalScores'] = [];
  let winner: number | null = null;
  if (isGameOver) {
    finalScores = players
      .filter((p) => !p.eliminated)
      .map((p) => {
        let visibleCells = 0;
        for (let i = 0; i < 49; i++) {
          if (Number(fullState.boardPlayerIds[i]) === p.id) visibleCells++;
        }
        return {
          playerId: p.id,
          name: p.name,
          dirhams: p.dirhams,
          visibleCells,
          total: p.dirhams + visibleCells,
        };
      })
      .sort((a, b) => b.total - a.total);

    winner = finalScores[0]?.playerId ?? null;
  }

  return {
    mode: 'blockchain',
    numPlayers,
    board,
    assam,
    players,
    currentPlayerIndex: Number(fullState.currentPlayerIndex),
    phase: uiPhase,
    lastDiceRoll,
    currentTribute,
    validPlacements: [],
    selectedPlacement: null,
    borderChoiceInfo,
    movePath: [],
    actionLog: [],
    gameOver: isGameOver,
    winner,
    finalScores,
    turnNumber: Number(fullState.turnNumber),
  };
}
