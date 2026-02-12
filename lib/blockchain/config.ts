import { createPublicClient, http, type Chain } from 'viem';

export const baseSepolia: Chain = {
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://sepolia.base.org'] },
  },
  blockExplorers: {
    default: { name: 'Basescan', url: 'https://sepolia.basescan.org' },
  },
  testnet: true,
};

// USDC on Base Sepolia
export const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;

// Factory address — update after deployment
export const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Direction enum mapping (contract uses uint8)
export const DIRECTION_TO_UINT8 = {
  N: 0,
  S: 1,
  E: 2,
  W: 3,
} as const;

export const UINT8_TO_DIRECTION = {
  0: 'N',
  1: 'S',
  2: 'E',
  3: 'W',
} as const;

// Phase enum mapping
export const PHASE_MAP = {
  0: 'orient',    // WaitingForPlayers → show as orient for UI
  1: 'orient',    // Orient
  2: 'roll',      // CommitDice → mapped to roll for UI
  3: 'roll',      // RevealDice → mapped to roll for UI
  4: 'borderChoice', // BorderChoice
  5: 'tribute',   // Tribute
  6: 'place',     // Place
  7: 'gameOver',  // GameOver
} as const;

// Contract phase enum (for raw contract interaction)
export const CONTRACT_PHASE = {
  WaitingForPlayers: 0,
  Orient: 1,
  CommitDice: 2,
  RevealDice: 3,
  BorderChoice: 4,
  Tribute: 5,
  Place: 6,
  GameOver: 7,
} as const;

export const EMPTY_CELL = 0xFF;
export const NEUTRALIZED_CELL = 0xFE;
