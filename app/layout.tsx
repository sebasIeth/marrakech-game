import type { Metadata } from 'next';
import './globals.css';
import WagmiProvider from '@/components/providers/WagmiProvider';

export const metadata: Metadata = {
  title: 'Marrakech - El Juego de Alfombras',
  description: 'Juega al clásico juego de mesa Marrakech online o en modo local',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Playfair+Display:wght@400..900&display=swap"
        />
      </head>
      <body className="antialiased font-body" style={{ '--font-display': "'Playfair Display', Georgia, serif", '--font-body': "'Inter', system-ui, sans-serif" } as React.CSSProperties}>
        <WagmiProvider>
          {children}
        </WagmiProvider>
      </body>
    </html>
  );
}
