// Minimal online server: plain node:http (no Express/Fastify needed) with
// Socket.IO attached directly. No database - everything lives in
// roomManager's in-memory Map and is lost on restart (see README.md).
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './socketHandlers';
import { getRoomCountForDebug, startCleanupInterval } from './roomManager';

const PORT = Number(process.env.PORT) || 3001;

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: getRoomCountForDebug() }));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

const io = new Server(httpServer, {
  cors: {
    // Wide open on purpose: this is a local-only dev prototype (never
    // deployed publicly per project constraints), and the Vite dev server's
    // port can vary, plus LAN testing needs arbitrary origins to work.
    origin: '*',
  },
});

registerSocketHandlers(io);
startCleanupInterval();

httpServer.listen(PORT, () => {
  console.log(`[online server] listening on http://localhost:${PORT} (health check: /health)`);
});
