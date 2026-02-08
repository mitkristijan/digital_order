'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { CreateOrderRequest } from '@digital-order/types';

export function useCreateOrder(tenantId: string) {
  return useMutation({
    mutationFn: async (orderData: CreateOrderRequest) => {
      const { data } = await apiClient.post(`/orders?tenantId=${tenantId}`, orderData);
      return data;
    },
  });
}

export function useOrderByNumber(tenantId: string, orderNumber: string) {
  return useQuery({
    queryKey: ['order', tenantId, orderNumber],
    queryFn: async () => {
      const { data } = await apiClient.get(`/orders/number/${orderNumber}?tenantId=${tenantId}`);
      return data;
    },
    enabled: !!tenantId && !!orderNumber,
    refetchInterval: 5000, // Poll every 5 seconds for status updates
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => {
      const { data } = await apiClient.get('/orders/my-orders');
      return data;
    },
  });
}
