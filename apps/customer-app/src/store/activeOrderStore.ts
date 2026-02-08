'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ActiveOrder {
  orderNumber: string;
  tenantId: string;
}

interface ActiveOrderStore {
  activeOrder: ActiveOrder | null;
  setActiveOrder: (orderNumber: string, tenantId: string) => void;
  clearActiveOrder: () => void;
}

export const useActiveOrderStore = create<ActiveOrderStore>()(
  persist(
    (set) => ({
      activeOrder: null,
      setActiveOrder: (orderNumber, tenantId) =>
        set({ activeOrder: { orderNumber, tenantId } }),
      clearActiveOrder: () => set({ activeOrder: null }),
    }),
    { name: 'active-order-storage' }
  )
);
