import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants.js';
import { AuthContext } from './AuthContext.jsx';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { accessToken, isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const socketInstance = io(SOCKET_URL, {
      auth: { token: accessToken },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      console.info('WebSocket connection established.');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.info('WebSocket disconnected.');
      setConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [accessToken, isAuthenticated]);

  const joinRoom = (roomType, roomId) => {
    if (socket && connected) {
      socket.emit(`join:${roomType}`, { [`${roomType}Id` || 'Id']: roomId });
    }
  };

  const leaveRoom = (roomType, roomId) => {
    if (socket && connected) {
      socket.emit(`leave:${roomType}`, { [`${roomType}Id` || 'Id']: roomId });
    }
  };

  const value = {
    socket,
    connected,
    joinRoom,
    leaveRoom
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
