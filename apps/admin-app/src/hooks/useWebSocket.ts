'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket(tenantId: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!tenantId) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const token = localStorage.getItem('accessToken');
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      if (mountedRef.current) {
        console.log('WebSocket connected');
        setIsConnected(true);
        socketInstance.emit('join:tenant', tenantId);
        socketInstance.emit('join:kitchen', tenantId);
      } else {
        socketInstance.disconnect();
      }
    });

    socketInstance.on('disconnect', () => {
      if (mountedRef.current) setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      if (mountedRef.current) {
        console.error('WebSocket connection error:', error);
        setIsConnected(false);
      }
    });

    setSocket(socketInstance);

    return () => {
      mountedRef.current = false;
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    };
  }, [tenantId]);

  return { socket, isConnected };
}
