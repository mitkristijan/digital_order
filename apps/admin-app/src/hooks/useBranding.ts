import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';

export interface Branding {
  primaryColor: string;
  accentColor: string;
  heroGradientStart: string;
  heroGradientMid: string;
  heroGradientEnd: string;
  appName: string;
  heroBackgroundImage?: string | null;
}

export function useBranding(tenantId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['branding', tenantId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tenants/${tenantId}`);
      const settings = data?.settings || {};
      const theme = settings?.theme || {};
      return {
        primaryColor: theme.primaryColor ?? '#ea580c',
        accentColor: theme.accentColor ?? '#e11d48',
        heroGradientStart: theme.heroGradientStart ?? '#f97316',
        heroGradientMid: theme.heroGradientMid ?? '#f59e0b',
        heroGradientEnd: theme.heroGradientEnd ?? '#f43f5e',
        appName: theme.appName ?? 'Digital Order',
        heroBackgroundImage: theme.heroBackgroundImage ?? null,
      } as Branding;
    },
    enabled: !!tenantId,
  });

  const updateMutation = useMutation({
    mutationFn: async (branding: Partial<Branding>) => {
      const { data } = await apiClient.patch(`/tenants/${tenantId}/branding`, branding);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenants', tenantId] });
    },
  });

  return { data, isLoading, updateBranding: updateMutation.mutateAsync, isUpdating: updateMutation.isPending };
}
