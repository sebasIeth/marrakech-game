'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEventLogs } from 'viem';
import { useLobbyStore } from '@/lib/store/lobbyStore';
import Button from '@/components/ui/Button';
import { MarrakechFactoryABI } from '@/lib/blockchain/abis/MarrakechFactory';
import { MarrakechGameABI, ERC20ABI } from '@/lib/blockchain/abis/MarrakechGame';
import { FACTORY_ADDRESS, USDC_ADDRESS } from '@/lib/blockchain/config';

export default function BlockchainSetup() {
  const lobby = useLobbyStore();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [numPlayers, setNumPlayers] = useState(2);
  const [joinAddress, setJoinAddress] = useState('');
  const [step, setStep] = useState<'menu' | 'create' | 'join'>('menu');
  const [error, setError] = useState('');
  const [txPending, setTxPending] = useState(false);
  const [txStep, setTxStep] = useState('');

  const { writeContractAsync } = useWriteContract();

  const { data: stakeAmount } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: MarrakechFactoryABI,
    functionName: 'stakeAmount',
  });

  const handleCreateGame = async () => {
    if (!address || !stakeAmount || !publicClient) return;
    setError('');
    setTxPending(true);

    try {
      // Pre-check: Verify USDC balance
      setTxStep('Verificando balance...');
      const usdcBalance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: [address],
      });

      if ((usdcBalance as bigint) < (stakeAmount as bigint)) {
        const needed = Number(stakeAmount as bigint) / 1_000_000;
        const have = Number(usdcBalance as bigint) / 1_000_000;
        throw new Error(`USDC insuficiente. Necesitas ${needed} USDC, tienes ${have} USDC`);
      }

      // Step 1: Approve USDC
      setTxStep('Aprobando USDC...');
      const approveHash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [FACTORY_ADDRESS, stakeAmount],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // Step 2: Create game (explicit gas — deployment is heavy)
      setTxStep('Creando partida...');
      const createHash = await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: MarrakechFactoryABI,
        functionName: 'createGame',
        args: [numPlayers],
        gas: BigInt(5_000_000),
      });

      // Wait for confirmation and get the receipt
      setTxStep('Confirmando...');
      const receipt = await publicClient.waitForTransactionReceipt({ hash: createHash });

      // Parse the GameCreated event from receipt logs
      let gameAddr: string | null = null;

      // Method 1: Use viem's parseEventLogs for type-safe event parsing
      try {
        const parsedLogs = parseEventLogs({
          abi: MarrakechFactoryABI,
          logs: receipt.logs,
          eventName: 'GameCreated',
        });
        if (parsedLogs.length > 0) {
          gameAddr = (parsedLogs[0].args as any).game;
        }
      } catch (e) {
        console.warn('Failed to parse GameCreated event:', e);
      }

      // Method 2: Manually extract from indexed topic
      // GameCreated has game (indexed) as topics[1]
      if (!gameAddr) {
        for (const log of receipt.logs) {
          if (log.address.toLowerCase() === FACTORY_ADDRESS.toLowerCase() && log.topics.length >= 2) {
            // topics[1] is the indexed `game` address, padded to 32 bytes
            const rawAddr = log.topics[1];
            if (rawAddr) {
              gameAddr = ('0x' + rawAddr.slice(26)) as string;
              break;
            }
          }
        }
      }

      // Method 3: Fallback — read from factory contract
      if (!gameAddr) {
        setTxStep('Obteniendo direccion...');
        const games = await publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: MarrakechFactoryABI,
          functionName: 'getGames',
        });
        const gamesArr = games as readonly string[];
        if (gamesArr.length > 0) {
          gameAddr = gamesArr[gamesArr.length - 1];
        }
      }

      if (!gameAddr) {
        throw new Error('No se pudo obtener la direccion del contrato del juego');
      }

      console.log('Game contract created at:', gameAddr);

      lobby.setMode('blockchain');
      lobby.setNumPlayers(numPlayers);
      lobby.setIsCreator(true);
      lobby.setWalletAddress(address);
      lobby.setGameContractAddress(gameAddr);
      lobby.setScreen('blockchainWaiting');
    } catch (err: any) {
      console.error('Create game error:', err);
      setError(err.shortMessage || err.message || 'Transaction failed');
    } finally {
      setTxPending(false);
      setTxStep('');
    }
  };

  const handleJoinGame = async () => {
    if (!address || !joinAddress || !publicClient) return;
    setError('');
    setTxPending(true);

    try {
      const gameAddress = joinAddress.trim() as `0x${string}`;

      // Step 1: Validate the contract exists
      setTxStep('Verificando contrato...');
      const code = await publicClient.getCode({ address: gameAddress });
      if (!code || code === '0x') {
        throw new Error('No se encontro un contrato en esa direccion');
      }

      // Step 2: Read game state to validate
      const [numP, gameStake, gamePhase, joinedCountRaw] = await Promise.all([
        publicClient.readContract({
          address: gameAddress,
          abi: MarrakechGameABI,
          functionName: 'numPlayers',
        }),
        publicClient.readContract({
          address: gameAddress,
          abi: MarrakechGameABI,
          functionName: 'stakeAmount',
        }),
        publicClient.readContract({
          address: gameAddress,
          abi: MarrakechGameABI,
          functionName: 'phase',
        }),
        publicClient.readContract({
          address: gameAddress,
          abi: MarrakechGameABI,
          functionName: 'getGameState',
        }),
      ]);

      // Validate game is in WaitingForPlayers phase
      if (Number(gamePhase) !== 0) {
        throw new Error('La partida ya comenzo o termino');
      }

      // Validate game is not full
      const joinedCount = Number((joinedCountRaw as any)[5]);
      const totalPlayers = Number(numP);
      if (joinedCount >= totalPlayers) {
        throw new Error('La partida esta llena');
      }

      // Step 3: Check USDC balance
      const usdcBalance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: [address],
      });

      if ((usdcBalance as bigint) < (gameStake as bigint)) {
        const needed = Number(gameStake as bigint) / 1_000_000;
        const have = Number(usdcBalance as bigint) / 1_000_000;
        throw new Error(`USDC insuficiente. Necesitas ${needed} USDC, tienes ${have} USDC`);
      }

      // Check if already joined
      const playerIdx = await publicClient.readContract({
        address: gameAddress,
        abi: MarrakechGameABI,
        functionName: 'getPlayerIndex',
        args: [address],
      });
      if (Number(playerIdx as unknown as bigint) >= 0) {
        throw new Error('Ya estas en esta partida');
      }

      // Step 4: Approve USDC
      setTxStep('Aprobando USDC...');
      const approveHash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [gameAddress, gameStake as bigint],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // Step 5: Join game with explicit gas to avoid estimation issues
      setTxStep('Uniendose a la partida...');
      const joinHash = await writeContractAsync({
        address: gameAddress,
        abi: MarrakechGameABI,
        functionName: 'joinGame',
        gas: BigInt(300_000),
      });

      setTxStep('Confirmando...');
      await publicClient.waitForTransactionReceipt({ hash: joinHash });

      lobby.setMode('blockchain');
      lobby.setNumPlayers(totalPlayers);
      lobby.setIsCreator(false);
      lobby.setWalletAddress(address);
      lobby.setGameContractAddress(gameAddress);
      lobby.setScreen('blockchainWaiting');
    } catch (err: any) {
      console.error('Join game error:', err);
      setError(err.shortMessage || err.message || 'Transaction failed');
    } finally {
      setTxPending(false);
      setTxStep('');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <motion.div
        className="relative z-10 rounded-2xl shadow-lg p-8 max-w-md w-full space-y-6"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #E8D5A3',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="font-display text-2xl font-bold text-[#2C1810] text-center">
          Jugar On-Chain
        </h2>

        {/* Wallet Connection */}
        <div className="flex justify-center">
          <ConnectButton />
        </div>

        {isConnected && (
          <>
            {step === 'menu' && (
              <div className="space-y-3">
                <p className="text-sm text-center text-[#8B6914]">
                  Apuesta: {stakeAmount ? `${Number(stakeAmount) / 1_000_000} USDC` : '...'} por jugador
                </p>
                <p className="text-xs text-center text-[#8B6914]/60">
                  80% al ganador, 20% plataforma
                </p>

                <Button
                  className="w-full"
                  onClick={() => setStep('create')}
                >
                  Crear Partida
                </Button>

                <Button
                  className="w-full"
                  onClick={() => setStep('join')}
                  variant="secondary"
                >
                  Unirse a Partida
                </Button>
              </div>
            )}

            {step === 'create' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2C1810] mb-2">
                    Numero de jugadores
                  </label>
                  <div className="flex gap-2">
                    {[2, 3, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => setNumPlayers(n)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                          numPlayers === n
                            ? 'bg-[#C19A3E] text-white shadow-md'
                            : 'bg-[#FFF8E7] text-[#8B6914] border border-[#E8D5A3]'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleCreateGame}
                  disabled={txPending}
                >
                  {txPending ? txStep || 'Confirmando...' : 'Crear Partida'}
                </Button>
              </div>
            )}

            {step === 'join' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2C1810] mb-2">
                    Direccion del contrato
                  </label>
                  <input
                    type="text"
                    value={joinAddress}
                    onChange={(e) => setJoinAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8D5A3] bg-[#FFF8E7] text-sm text-[#2C1810] font-mono placeholder:text-[#C19A3E]/40"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleJoinGame}
                  disabled={txPending || !joinAddress}
                >
                  {txPending ? txStep || 'Confirmando...' : 'Unirse'}
                </Button>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}
          </>
        )}

        <button
          onClick={() => {
            if (step !== 'menu') {
              setStep('menu');
              setError('');
            } else {
              lobby.reset();
            }
          }}
          className="block mx-auto text-sm text-[#8B6914] hover:text-[#C19A3E] transition-colors"
        >
          {step !== 'menu' ? 'Volver' : 'Volver al Menu'}
        </button>
      </motion.div>
    </div>
  );
}
