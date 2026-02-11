'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useGameStore } from '@/lib/store/gameStore';
import GamePage from '@/app/game/page';

export default function OnlineGamePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { connected, connect } = useMultiplayer();
  const players = useGameStore((s) => s.players);

  useEffect(() => {
    if (!connected) {
      connect();
    }
  }, [connected, connect]);

  if (players.length > 0) {
    return <GamePage />;
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
        <h2 className="font-display text-xl font-bold text-[#2C1810]">
          Sala: {roomId}
        </h2>
        <p className="text-sm text-[#8B6914]">
          {connected ? 'Conectado. Esperando inicio de partida...' : 'Conectando...'}
        </p>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-[#8B6914] hover:text-[#C19A3E] transition-colors"
        >
          Volver al Menú
        </button>
      </div>
    </div>
  );
}
