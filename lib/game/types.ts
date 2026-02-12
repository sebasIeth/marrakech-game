export type Direction = 'N' | 'S' | 'E' | 'W';
export type Phase = 'orient' | 'roll' | 'moving' | 'borderChoice' | 'tribute' | 'place' | 'gameOver';
export type GameMode = 'local' | 'online' | 'blockchain';

export interface Position {
  row: number;
  col: number;
}

export interface Assam {
  position: Position;
  direction: Direction;
}

export interface CarpetCell {
  playerId: number;
  carpetId: string;
}

export interface Player {
  id: number;
  name: string;
  color: PlayerColor;
  dirhams: number;
  carpetsRemaining: number;
  eliminated: boolean;
  connected?: boolean;
  socketId?: string;
}

export interface PlayerColor {
  primary: string;
  light: string;
  dark: string;
  name: string;
  tailwind: string;
}

export interface CarpetPlacement {
  cell1: Position;
  cell2: Position;
  playerId: number;
  carpetId: string;
}

export interface TributeInfo {
  fromPlayerId: number;
  toPlayerId: number;
  amount: number;
  connectedCells: Position[];
}

export interface DiceResult {
  value: number;
  faces: number[];
}

export interface GameAction {
  type: 'orient' | 'roll' | 'move' | 'tribute' | 'place' | 'eliminate' | 'disconnect' | 'gameOver';
  playerId: number;
  description: string;
  timestamp: number;
}

export interface BorderChoiceInfo {
  position: Position;
  currentDirection: Direction;
  remainingSteps: number;
  options: BorderOption[];
  pathSoFar: Position[];
  diceResult: DiceResult;
}

export interface BorderOption {
  direction: Direction;
  label: string;
}

export interface FinalScore {
  playerId: number;
  name: string;
  dirhams: number;
  visibleCells: number;
  total: number;
}

export interface GameState {
  mode: GameMode;
  numPlayers: number;
  roomId?: string;
  board: (CarpetCell | null)[][];
  assam: Assam;
  players: Player[];
  currentPlayerIndex: number;
  phase: Phase;
  lastDiceRoll: DiceResult | null;
  currentTribute: TributeInfo | null;
  validPlacements: CarpetPlacement[];
  selectedPlacement: CarpetPlacement | null;
  borderChoiceInfo: BorderChoiceInfo | null;
  movePath: Position[];
  actionLog: GameAction[];
  gameOver: boolean;
  winner: number | null;
  finalScores: FinalScore[];
  turnNumber: number;
}

export interface SocketEvents {
  'room:create': { playerName: string; numPlayers: number };
  'room:join': { roomId: string; playerName: string };
  'room:ready': Record<string, never>;
  'room:start': Record<string, never>;
  'game:orient': { direction: Direction };
  'game:roll': Record<string, never>;
  'game:place': { placement: CarpetPlacement };
  'game:rematch': Record<string, never>;
  'room:created': { roomId: string; playerId: number };
  'room:joined': { playerId: number; players: Player[] };
  'room:playerJoined': { player: Player };
  'room:playerLeft': { playerId: number };
  'room:allReady': Record<string, never>;
  'game:started': { state: GameState };
  'game:stateUpdate': { state: GameState };
  'game:yourTurn': { playerId: number };
  'game:error': { message: string };
  'game:over': { state: GameState };
}
