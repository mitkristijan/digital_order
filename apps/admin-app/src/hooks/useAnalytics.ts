'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export function useAnalyticsDashboard(tenantId: string | null) {
  return useQuery({
    queryKey: ['analytics', 'dashboard', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('tenantId required');
      const { data } = await apiClient.get(`/analytics/dashboard?tenantId=${tenantId}`);
      return data;
    },
    enabled: !!tenantId,
    refetchInterval: 15000, // Fallback refresh every 15s; WebSocket triggers immediate update on status change
  });
}

export function usePopularItems(tenantId: string | null, limit: number = 10) {
  return useQuery({
    queryKey: ['analytics', 'popular-items', tenantId, limit],
    queryFn: async () => {
      if (!tenantId) throw new Error('tenantId required');
      const { data } = await apiClient.get(
        `/analytics/popular-items?tenantId=${tenantId}&limit=${limit}`
      );
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useOrdersByHour(tenantId: string | null) {
  return useQuery({
    queryKey: ['analytics', 'orders-by-hour', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('tenantId required');
      const { data } = await apiClient.get(`/analytics/orders-by-hour?tenantId=${tenantId}`);
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useRevenueByDay(tenantId: string | null, days: number = 7) {
  return useQuery({
    queryKey: ['analytics', 'revenue-by-day', tenantId, days],
    queryFn: async () => {
      if (!tenantId) throw new Error('tenantId required');
      const { data } = await apiClient.get(
        `/analytics/revenue-by-day?tenantId=${tenantId}&days=${days}`
      );
      return data;
    },
    enabled: !!tenantId,
  });
}

export type AnalyticsOrdersPeriod = 'day' | 'week' | 'month' | 'year' | 'all';

export function useAnalyticsOrders(
  tenantId: string | null,
  period: AnalyticsOrdersPeriod = 'all',
  skip?: number,
  take?: number
) {
  return useQuery({
    queryKey: ['analytics', 'orders', tenantId, period, skip, take],
    queryFn: async () => {
      if (!tenantId) throw new Error('tenantId required');
      const params = new URLSearchParams();
      params.append('tenantId', tenantId);
      params.append('period', period);
      if (skip !== undefined) params.append('skip', String(skip));
      if (take !== undefined) params.append('take', String(take));
      const { data } = await apiClient.get(`/analytics/orders?${params.toString()}`);
      return data;
    },
    enabled: !!tenantId,
  });
}
