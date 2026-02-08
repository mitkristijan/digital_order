'use client';

import { create } from 'zustand';

export type ToastVariant = 'success' | 'error';

interface ToastState {
  message: string | null;
  variant: ToastVariant;
  isVisible: boolean;
  showToast: (message: string, variant?: ToastVariant) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  variant: 'success',
  isVisible: false,

  showToast: (message, variant = 'success') => {
    set({ message, variant, isVisible: true });
  },

  hideToast: () => {
    set({ isVisible: false });
    setTimeout(() => set({ message: null }), 200);
  },
}));
