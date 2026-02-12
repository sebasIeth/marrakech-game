import { NextRequest } from 'next/server';
import { publicClient } from '@/lib/blockchain/config';
import { MarrakechGameABI } from '@/lib/blockchain/abis/MarrakechGame';

type RouteContext = { params: Promise<{ address: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { address } = await context.params;
  const gameAddress = address as `0x${string}`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Watch for all game events
      const unwatch = publicClient.watchContractEvent({
        address: gameAddress,
        abi: MarrakechGameABI,
        onLogs: (logs) => {
          for (const log of logs) {
            send(log.eventName || 'unknown', {
              eventName: log.eventName,
              args: log.args,
              blockNumber: log.blockNumber?.toString(),
              transactionHash: log.transactionHash,
            });
          }
        },
      });

      // Send heartbeat every 30s
      const heartbeat = setInterval(() => {
        try {
          send('heartbeat', { timestamp: Date.now() });
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        unwatch();
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
