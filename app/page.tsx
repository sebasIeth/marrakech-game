'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLobbyStore } from '@/lib/store/lobbyStore';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { LobbyBackground } from '@/components/lobby/LobbyBackground';
import MainMenu from '@/components/lobby/MainMenu';
import LocalSetup from '@/components/lobby/LocalSetup';
import OnlineSetup from '@/components/lobby/OnlineSetup';

export default function HomePage() {
  const screen = useLobbyStore((s) => s.screen);

  return (
    <div className="min-h-screen bg-[#FFF8E7]">
      <LobbyBackground />
      {screen === 'menu' && <MainMenu />}
      {screen === 'localSetup' && <LocalSetup />}
      {screen === 'onlineSetup' && <OnlineSetup />}
      {screen === 'waiting' && <WaitingRoom />}
    </div>
  );
}

function WaitingRoom() {
  const lobby = useLobbyStore();
  const router = useRouter();
  const { disconnect, startGame, onGameStarted } = useMultiplayer();

  useEffect(() => {
    onGameStarted(() => {
      router.push('/game');
    });
  }, [onGameStarted, router]);

  const handleBack = () => {
    disconnect();
    lobby.reset();
  };

  const canStart = lobby.isCreator && lobby.onlinePlayers.length >= 2;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <div
        className="relative z-10 rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-6"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #E8D5A3',
        }}
      >
        <h2 className="font-display text-2xl font-bold text-[#2C1810]">
          Sala de Espera
        </h2>

        <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #FFF8E7, #F4E8C1)', border: '1px solid #E8D5A3' }}>
          <p className="text-xs text-[#8B6914] mb-1">Codigo de sala</p>
          <p className="text-3xl font-mono font-bold text-[#C19A3E] tracking-widest">
            {lobby.roomId}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-[#8B6914]">
            Jugadores ({lobby.onlinePlayers.length}/{lobby.numPlayers})
          </p>
          {lobby.onlinePlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FFF8E7]"
            >
              <div
                className="w-6 h-6 rounded-lg"
                style={{ backgroundColor: player.color.primary }}
              />
              <span className="text-sm font-medium text-[#2C1810]">{player.name}</span>
              {player.id === lobby.myPlayerId && (
                <span className="text-[10px] text-[#C19A3E] font-semibold">(Tu)</span>
              )}
              <span className="ml-auto w-2 h-2 rounded-full bg-green-500" />
            </div>
          ))}
        </div>

        {!canStart && (
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xs text-[#8B6914]/60 mr-2">Esperando jugadores</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#C19A3E] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#C19A3E] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#C19A3E] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        {canStart && (
          <button
            onClick={startGame}
            className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, #1E8449, #27AE60)',
              boxShadow: '0 4px 16px rgba(30,132,73,0.3)',
            }}
          >
            Iniciar Partida
          </button>
        )}

        <button
          onClick={handleBack}
          className="text-sm text-[#8B6914] hover:text-[#C19A3E] transition-colors"
        >
          Volver al Menu
        </button>
      </div>
    </div>
  );
}
