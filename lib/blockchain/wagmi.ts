import { http, createConfig } from 'wagmi';
import { baseSepolia } from './config';
import { injected, coinbaseWallet } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Marrakech Game' }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
  ssr: true,
});
