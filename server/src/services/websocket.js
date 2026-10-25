/**
 * WebSocket Live Alerts Service
 * Meets Gap 3 requirement: connected NGOs see new listings and status changes immediately (< 50ms)
 * without needing to refresh their browsers.
 */

import { WebSocketServer, WebSocket } from 'ws';

let wss = null;

export function initWebSocketServer(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Send immediate confirmation of live connection
    ws.send(
      JSON.stringify({
        type: 'CONNECTED',
        payload: {
          message: 'Connected to Kind Table live alert stream',
          connectedAt: new Date().toISOString(),
        },
      })
    );

    ws.on('error', (err) => {
      // Clean handling of client connection drops
      console.warn('WebSocket client error:', err.message);
    });
  });

  return wss;
}

export function broadcast(type, payload) {
  if (!wss) return;

  const message = JSON.stringify({
    type,
    payload,
    timestamp: new Date().toISOString(),
  });

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        console.warn('Error broadcasting to client:', err.message);
      }
    }
  }
}

export function broadcastBatchCreated(batch) {
  broadcast('BATCH_CREATED', { batch });
}

export function broadcastBatchClaimed(batch) {
  broadcast('BATCH_CLAIMED', { batch });
}

export function broadcastBatchExpired(batch) {
  broadcast('BATCH_EXPIRED', { batch });
}

export function broadcastStateReset(action) {
  broadcast('STATE_RESET', { action });
}

export function closeWebSocketServer() {
  if (wss) {
    for (const client of wss.clients) {
      try {
        client.terminate();
      } catch (_) {}
    }
    wss.close();
    wss = null;
  }
}
