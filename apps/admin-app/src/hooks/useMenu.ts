'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export function useMenuItems(tenantId: string | null) {
  return useQuery({
    queryKey: ['menuItems', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('tenantId required');
      const { data } = await apiClient.get(`/menu/items?tenantId=${tenantId}`);
      return data;
    },
    enabled: !!tenantId,
    staleTime: 0, // Always treat data as stale
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useCategories(tenantId: string | null) {
  return useQuery({
    queryKey: ['categories', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('tenantId required');
      const { data } = await apiClient.get(`/menu/categories?tenantId=${tenantId}`);
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useCreateCategory(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData: { name: string; description?: string }) => {
      const { data } = await apiClient.post(`/menu/categories?tenantId=${tenantId}`, categoryData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', tenantId] });
    },
  });
}

export function useCreateMenuItem(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemData: any) => {
      const { data } = await apiClient.post(`/menu/items?tenantId=${tenantId}`, itemData);
      return data;
    },
    onSuccess: (newItem) => {
      // Optimistically update the cache
      queryClient.setQueryData(['menuItems', tenantId], (old: any[] = []) => {
        return [...old, newItem];
      });
      // Then refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['menuItems', tenantId] });
    },
  });
}

export function useUpdateMenuItem(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, itemData }: { itemId: string; itemData: any }) => {
      const { data } = await apiClient.put(`/menu/items/${itemId}?tenantId=${tenantId}`, itemData);
      return data;
    },
    onSuccess: (updatedItem) => {
      // Optimistically update the cache
      queryClient.setQueryData(['menuItems', tenantId], (old: any[] = []) => {
        return old.map(item => item.id === updatedItem.id ? updatedItem : item);
      });
      // Then refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['menuItems', tenantId] });
    },
  });
}

export function useDeleteMenuItem(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { data } = await apiClient.delete(`/menu/items/${itemId}?tenantId=${tenantId}`);
      return data;
    },
    onMutate: async (itemId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['menuItems', tenantId] });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData(['menuItems', tenantId]);

      // Optimistically remove the item
      queryClient.setQueryData(['menuItems', tenantId], (old: any[] = []) => {
        return old.filter(item => item.id !== itemId);
      });

      // Return context with the snapshotted value
      return { previousItems };
    },
    onError: (_err, _itemId, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(['menuItems', tenantId], context.previousItems);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['menuItems', tenantId] });
    },
  });
}

export function useUpdateItemAvailability(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, availability }: { itemId: string; availability: boolean }) => {
      const { data } = await apiClient.patch(
        `/menu/items/${itemId}/availability?tenantId=${tenantId}`,
        { availability }
      );
      return data;
    },
    onMutate: async ({ itemId, availability }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['menuItems', tenantId] });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData(['menuItems', tenantId]);

      // Optimistically update
      queryClient.setQueryData(['menuItems', tenantId], (old: any[] = []) => {
        return old.map(item => 
          item.id === itemId ? { ...item, availability } : item
        );
      });

      return { previousItems };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(['menuItems', tenantId], context.previousItems);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['menuItems', tenantId] });
    },
  });
}
