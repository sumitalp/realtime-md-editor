import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

export const useWebSocket = (documentId: string) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (!token || !user) return;

    const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}`, {
      auth: {
        token: token,
      },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      setError('Connection failed');
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  return { socket: socketRef.current, isConnected, error };
};