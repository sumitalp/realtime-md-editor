// hooks/useYjsProvider.ts
import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import io, { Socket } from 'socket.io-client';

export function useYjsProvider(documentId: string | null, token: string | null) {
  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!documentId || !token) {
      return;
    }

    // Create socket connection
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001', {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Join document room
      socket.emit('join-document', { documentId, userId: getUserIdFromToken(token) });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('document-state', (data: { state: number[] }) => {
      const state = new Uint8Array(data.state);
      Y.applyUpdate(ydoc, state);
    });

    socket.on('document-update', (data: { update: number[] }) => {
      const update = new Uint8Array(data.update);
      Y.applyUpdate(ydoc, update);
    });

    // Set up Yjs update handler
    const updateHandler = (update: Uint8Array) => {
      if (socket.connected) {
        socket.emit('document-update', { update: Array.from(update) });
      }
    };

    ydoc.on('update', updateHandler);

    return () => {
      ydoc.off('update', updateHandler);
      socket.disconnect();
      setProvider(null);
      setIsConnected(false);
    };
  }, [documentId, token, ydoc]);

  return { ydoc, isConnected };
}

function getUserIdFromToken(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub;
  } catch {
    return '';
  }
}