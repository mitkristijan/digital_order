import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface Branding {
  primaryColor: string;
  accentColor: string;
  heroGradientStart: string;
  heroGradientMid: string;
  heroGradientEnd: string;
  appName: string;
  heroBackgroundImage?: string | null;
}

const defaultBranding: Branding = {
  primaryColor: '#ea580c',
  accentColor: '#e11d48',
  heroGradientStart: '#f97316',
  heroGradientMid: '#f59e0b',
  heroGradientEnd: '#f43f5e',
  appName: 'Digital Order',
  heroBackgroundImage: null,
};

export function useBranding(tenantId: string | null) {
  const { data } = useQuery({
    queryKey: ['branding', tenantId],
    queryFn: async () => {
      const { data } = await axios.get<Branding>(`${apiBase}/public/branding/${tenantId}`);
      return data;
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
    placeholderData: defaultBranding,
  });

  return data ?? defaultBranding;
}
