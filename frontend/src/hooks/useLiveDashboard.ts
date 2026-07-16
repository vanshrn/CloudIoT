import { useEffect } from 'react';

// A simple global event bus for live updates
export const LiveEvents = new EventTarget();

export function useLiveDashboard() {
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL;
    if (!wsUrl) return;

    let ws: WebSocket;
    let reconnectTimer: number;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'batch' && Array.isArray(message.payloads)) {
            message.payloads.forEach((payload: any) => {
              LiveEvents.dispatchEvent(new CustomEvent(`live_${payload.type}`, { detail: payload.data }));
            });
          }
        } catch (err) {
          console.error('Failed to parse websocket message', err);
        }
      };

      ws.onclose = () => {
        // Reconnect after 5 seconds
        reconnectTimer = window.setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null; // Prevent reconnect
        ws.close();
      }
    };
  }, []);
}
