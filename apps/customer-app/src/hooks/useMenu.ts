'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string | null;
  categoryId: string;
  variants?: MenuVariant[];
  modifierGroups?: any[];
  availability: boolean;
  dietaryTags?: string[];
  allergens?: string[];
}

export interface MenuVariant {
  id: string;
  name: string;
  priceModifier: number;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  menuItems: MenuItem[];
}

export function useMenu(tenantId: string) {
  return useQuery({
    queryKey: ['menu', tenantId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/menu/full?tenantId=${tenantId}`);
      return data as Category[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!tenantId,
  });
}

export function useMenuItem(tenantId: string, itemId: string) {
  return useQuery({
    queryKey: ['menuItem', tenantId, itemId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/menu/items/${itemId}?tenantId=${tenantId}`);
      return data as MenuItem;
    },
    enabled: !!tenantId && !!itemId,
  });
}
