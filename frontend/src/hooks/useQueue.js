import { useState, useEffect, useCallback } from 'react';
import * as queueApi from '../api/queueApi.js';
import { useSocket } from './useSocket.js';

export const useQueue = (branchId) => {
  const [queue, setQueue] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { socket, connected } = useSocket();

  const fetchQueue = useCallback(async () => {
    if (!branchId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await queueApi.getTodayQueue(branchId);
      setQueue(response.data.queue);
    } catch (err) {
      console.error('Failed to load queue details:', err.message);
      setError('Failed to fetch today\'s queue data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Subscribe to real-time updates for the current branch
  useEffect(() => {
    if (!socket || !connected || !branchId) return;

    socket.emit('join:branch', { branchId });

    socket.on('queue:updated', () => {
      fetchQueue();
    });

    socket.on('ticket:called', () => {
      fetchQueue();
    });

    return () => {
      socket.emit('leave:branch', { branchId });
      socket.off('queue:updated');
      socket.off('ticket:called');
    };
  }, [socket, connected, branchId, fetchQueue]);

  return {
    queue,
    isLoading,
    error,
    refetch: fetchQueue
  };
};
