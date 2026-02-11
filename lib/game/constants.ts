import { type Direction, type PlayerColor, type Position } from './types';

export const BOARD_SIZE = 7;

export const PLAYER_COLORS: PlayerColor[] = [
  {
    primary: '#E74C3C',
    light: '#FADBD8',
    dark: '#C0392B',
    name: 'Rojo',
    tailwind: 'red',
  },
  {
    primary: '#3498DB',
    light: '#D6EAF8',
    dark: '#2176AE',
    name: 'Azul',
    tailwind: 'blue',
  },
  {
    primary: '#2ECC71',
    light: '#D5F5E3',
    dark: '#1E8449',
    name: 'Verde',
    tailwind: 'green',
  },
  {
    primary: '#9B59B6',
    light: '#E8DAEF',
    dark: '#7D3C98',
    name: 'Púrpura',
    tailwind: 'purple',
  },
];

export const DICE_FACES = [1, 2, 2, 3, 3, 4];

export const CARPETS_PER_PLAYER: Record<number, number> = {
  2: 24,
  3: 15,
  4: 12,
};

export const STARTING_DIRHAMS = 30;

export const DIRECTION_VECTORS: Record<Direction, Position> = {
  N: { row: -1, col: 0 },
  S: { row: 1, col: 0 },
  E: { row: 0, col: 1 },
  W: { row: 0, col: -1 },
};

export const TURNS: Record<Direction, { left: Direction; right: Direction; straight: Direction }> = {
  N: { left: 'W', right: 'E', straight: 'N' },
  S: { left: 'E', right: 'W', straight: 'S' },
  E: { left: 'N', right: 'S', straight: 'E' },
  W: { left: 'S', right: 'N', straight: 'W' },
};

export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  N: 'S',
  S: 'N',
  E: 'W',
  W: 'E',
};

export const MOROCCAN_PALETTE = {
  sand: '#F4E8C1',
  sandDark: '#E8D5A3',
  gold: '#C19A3E',
  goldDark: '#8B6914',
  purple: '#4A154B',
  purpleLight: '#6B3A6C',
  brown: '#2C1810',
  cream: '#FFF8E7',
  teal: '#1A8A7D',
  terracotta: '#C75B39',
};
