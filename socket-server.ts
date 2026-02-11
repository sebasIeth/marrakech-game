/**
 * Standalone Socket.IO server for deployment on Render (or any Node.js host).
 * The Next.js frontend on Vercel connects to this server for online multiplayer.
 */
import { createServer } from 'http';
import { initSocketServer } from './lib/socket/server';

const port = parseInt(process.env.PORT || '3001', 10);

const httpServer = createServer((_req, res) => {
  // Health check endpoint
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', service: 'marrakech-socket' }));
});

initSocketServer(httpServer);

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`> Socket.IO server listening on port ${port}`);
});
