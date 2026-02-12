'use client';

import { useAccount, useBalance } from 'wagmi';
import { USDC_ADDRESS, baseSepolia } from '@/lib/blockchain/config';

export function WalletBadge() {
  const { address, isConnected } = useAccount();
  const { data: usdcBalance } = useBalance({
    address,
    token: USDC_ADDRESS,
    chainId: baseSepolia.id,
  });

  if (!isConnected || !address) return null;

  const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const balance = usdcBalance ? (Number(usdcBalance.value) / 1_000_000).toFixed(2) : '...';

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
      style={{
        background: 'rgba(255,248,231,0.9)',
        border: '1px solid #E8D5A3',
      }}
    >
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <span className="font-mono text-[#2C1810]">{truncated}</span>
      <span className="text-[#C19A3E] font-semibold">{balance} USDC</span>
    </div>
  );
}
