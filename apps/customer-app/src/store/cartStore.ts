'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  imageUrl?: string | null;
  variantId?: string;
  variantName?: string;
  variantPriceModifier?: number;
  modifiers?: {
    id: string;
    name: string;
    priceModifier: number;
  }[];
  specialInstructions?: string;
}

interface CartStore {
  items: CartItem[];
  tenantId: string | null;
  tableNumber: string | null;
  setTenantId: (tenantId: string) => void;
  setTableNumber: (tableNumber: string) => void;
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string, variantId?: string) => void;
  updateQuantity: (menuItemId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  removeItemsNotInMenu: (validMenuItemIds: string[], validVariantIds?: string[]) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const getItemKey = (menuItemId: string, variantId?: string) => {
  return variantId ? `${menuItemId}-${variantId}` : menuItemId;
};

let onItemAddedCallback: ((item: CartItem) => void) | null = null;
let onItemRemovedCallback: ((item: CartItem) => void) | null = null;

export const setOnItemAdded = (callback: ((item: CartItem) => void) | null) => {
  onItemAddedCallback = callback;
};

export const setOnItemRemoved = (callback: ((item: CartItem) => void) | null) => {
  onItemRemovedCallback = callback;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      tenantId: null,
      tableNumber: null,

      setTenantId: (tenantId) =>
        set((state) => {
          // Clear cart when switching tenants to avoid 400 from stale cross-tenant items
          if (state.tenantId != null && state.tenantId !== tenantId) {
            return { tenantId, items: [], tableNumber: null };
          }
          return { tenantId };
        }),
      
      setTableNumber: (tableNumber) => set({ tableNumber }),

      addItem: (item) =>
        set((state) => {
          const normalizedItem: CartItem = {
            ...item,
            basePrice: Number(item.basePrice),
            modifiers: item.modifiers?.map((m) => ({ ...m, priceModifier: Number(m.priceModifier) })),
            variantPriceModifier: item.variantPriceModifier != null ? Number(item.variantPriceModifier) : undefined,
          };
          const itemKey = getItemKey(item.menuItemId, item.variantId);
          const existingIndex = state.items.findIndex(
            (i) => getItemKey(i.menuItemId, i.variantId) === itemKey
          );

          if (existingIndex >= 0) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += item.quantity;
            onItemAddedCallback?.(normalizedItem);
            return { items: newItems };
          }

          onItemAddedCallback?.(normalizedItem);
          return { items: [...state.items, normalizedItem] };
        }),

      removeItem: (menuItemId, variantId) =>
        set((state) => {
          const removed = state.items.find(
            (item) => getItemKey(item.menuItemId, item.variantId) === getItemKey(menuItemId, variantId)
          );
          if (removed) onItemRemovedCallback?.(removed);
          return {
            items: state.items.filter(
              (item) => getItemKey(item.menuItemId, item.variantId) !== getItemKey(menuItemId, variantId)
            ),
          };
        }),

      updateQuantity: (menuItemId, quantity, variantId) =>
        set((state) => {
          if (quantity <= 0) {
            const removed = state.items.find(
              (item) => getItemKey(item.menuItemId, item.variantId) === getItemKey(menuItemId, variantId)
            );
            if (removed) onItemRemovedCallback?.(removed);
            return {
              items: state.items.filter(
                (item) => getItemKey(item.menuItemId, item.variantId) !== getItemKey(menuItemId, variantId)
              ),
            };
          }

          return {
            items: state.items.map((item) =>
              getItemKey(item.menuItemId, item.variantId) === getItemKey(menuItemId, variantId)
                ? { ...item, quantity }
                : item
            ),
          };
        }),

      clearCart: () => set({ items: [] }),

      removeItemsNotInMenu: (validMenuItemIds, validVariantIds) =>
        set((state) => {
          const validMenuSet = new Set(validMenuItemIds);
          const validVariantSet = validVariantIds ? new Set(validVariantIds) : null;
          const newItems = state.items.filter((item) => {
            if (!validMenuSet.has(item.menuItemId)) return false;
            if (item.variantId) {
              return validVariantSet != null && validVariantSet.has(item.variantId);
            }
            return true;
          });
          return newItems.length === state.items.length ? {} : { items: newItems };
        }),

      getTotalPrice: () => {
        const state = get();
        return state.items.reduce((total, item) => {
          const variantPrice = Number(item.variantPriceModifier) || 0;
          const modifiersPrice =
            item.modifiers?.reduce((sum, mod) => sum + Number(mod.priceModifier), 0) || 0;
          const itemPrice = Number(item.basePrice) + variantPrice + modifiersPrice;
          return total + itemPrice * item.quantity;
        }, 0);
      },

      getTotalItems: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
