import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

/** Same host the page was loaded from (works over LAN too), fixed server port - see README. */
function resolveServerUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const port = import.meta.env.VITE_ONLINE_SERVER_PORT ?? '3001';
  return `${protocol}//${window.location.hostname}:${port}`;
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(resolveServerUrl(), { autoConnect: true, reconnection: true, reconnectionDelay: 500 });
  }
  return socket;
}

/** Wraps a Socket.IO ack-style emit in a Promise, with a timeout so the UI never hangs forever. */
export function emitWithAck<TResponse>(event: string, payload: unknown, timeoutMs = 8000): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    const timer = setTimeout(() => reject(new Error('サーバーの応答がありません')), timeoutMs);
    s.emit(event, payload, (response: TResponse) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
}
