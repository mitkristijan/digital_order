'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export function useTables(tenantId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tables', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('tenantId required');
      const { data } = await apiClient.get(`/tables?tenantId=${encodeURIComponent(tenantId)}`);
      return data;
    },
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: async (tableData: { tableNumber: string; capacity: number; location?: string }) => {
      const { data } = await apiClient.post(`/tables?tenantId=${encodeURIComponent(tenantId!)}`, tableData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', tenantId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (tableId: string) => {
      await apiClient.delete(`/tables/${tableId}?tenantId=${encodeURIComponent(tenantId!)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', tenantId] });
    },
  });

  const regenerateQrMutation = useMutation({
    mutationFn: async (tableId: string) => {
      const { data } = await apiClient.patch(
        `/tables/${tableId}/regenerate-qr?tenantId=${encodeURIComponent(tenantId!)}`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', tenantId] });
    },
  });

  return {
    ...query,
    createTable: createMutation.mutateAsync,
    deleteTable: deleteMutation.mutateAsync,
    regenerateQrCode: regenerateQrMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isRegenerating: regenerateQrMutation.isPending,
  };
}
