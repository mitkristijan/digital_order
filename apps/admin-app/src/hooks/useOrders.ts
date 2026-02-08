'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

export interface UseOrdersOptions {
  status?: string;
  skip?: number;
  take?: number;
}

export function useOrders(tenantId: string | null, status?: string): ReturnType<typeof useQuery>;
export function useOrders(tenantId: string | null, options?: UseOrdersOptions): ReturnType<typeof useQuery>;
export function useOrders(tenantId: string | null, statusOrOptions?: string | UseOrdersOptions) {
  const queryClient = useQueryClient();
  const { socket } = useWebSocket(tenantId);

  const status = typeof statusOrOptions === 'string' ? statusOrOptions : statusOrOptions?.status;
  const skip = typeof statusOrOptions === 'object' ? statusOrOptions?.skip : undefined;
  const take = typeof statusOrOptions === 'object' ? statusOrOptions?.take : undefined;

  const query = useQuery({
    queryKey: ['orders', tenantId, status, skip, take],
    queryFn: async () => {
      if (!tenantId) throw new Error('tenantId required');
      const params = new URLSearchParams();
      params.append('tenantId', tenantId);
      if (status) params.append('status', status);
      if (skip !== undefined) params.append('skip', String(skip));
      if (take !== undefined) params.append('take', String(take));

      const { data } = await apiClient.get(`/orders?${params.toString()}`);
      return data;
    },
    enabled: !!tenantId,
    refetchInterval: 10000, // Fallback polling
  });

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (order: any) => {
      console.log('New order received:', order);
      queryClient.invalidateQueries({ queryKey: ['orders', tenantId] });
      queryClient.refetchQueries({ queryKey: ['analytics', 'dashboard', tenantId] });
      // Play notification sound
      if (typeof Audio !== 'undefined') {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(console.error);
      }
    };

    const handleStatusChange = (order: any) => {
      console.log('Order status changed:', order);
      queryClient.invalidateQueries({ queryKey: ['orders', tenantId] });
      // Force immediate refetch so Orders Completed, Items Sold, Revenue update in realtime
      queryClient.refetchQueries({ queryKey: ['analytics', 'dashboard', tenantId] });
    };

    socket.on('order:created', handleNewOrder);
    socket.on('order:statusChanged', handleStatusChange);

    return () => {
      socket.off('order:created', handleNewOrder);
      socket.off('order:statusChanged', handleStatusChange);
    };
  }, [socket, queryClient, tenantId]);

  return query;
}

export function useUpdateOrderStatus(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { data } = await apiClient.patch(`/orders/${orderId}/status?tenantId=${tenantId}`, {
        status,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', tenantId] });
      queryClient.refetchQueries({ queryKey: ['analytics', 'dashboard', tenantId] });
    },
  });
}
