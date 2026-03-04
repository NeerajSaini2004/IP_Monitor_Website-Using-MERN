import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

let globalSocket = null;

export const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!globalSocket) {
      globalSocket = io('http://localhost:5001', {
        transports: ['websocket'],
        upgrade: false
      });
    }
    
    socketRef.current = globalSocket;
    
    return () => {
      // Don't disconnect on component unmount, keep global connection
    };
  }, []);

  return socketRef.current;
};

export const disconnectSocket = () => {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
};