'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { CartItem } from '@/store/cartStore';

export interface RecommendationItem {
  menuItemId: string;
  name: string;
  basePrice: number;
  imageUrl?: string;
  reason: string;
  confidence: number;
}

export function useRecommendations(tenantId: string, cartItems: CartItem[]) {
  return useQuery({
    queryKey: ['recommendations', tenantId, cartItems.map((i) => i.menuItemId).join(',')],
    queryFn: async () => {
      if (cartItems.length === 0) return [];
      
      const { data } = await apiClient.post(`/recommendations/suggest?tenantId=${tenantId}`, {
        cartItems: cartItems.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      });
      return data as RecommendationItem[];
    },
    enabled: cartItems.length > 0,
  });
}
