import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function useSocket(ownerId: string | null) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!ownerId) return;

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem('token'),
      },
    });

    socketRef.current = socket;

    // Join owner's room
    socket.emit('join-owner-room', ownerId);

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [ownerId]);

  return socketRef.current;
}

