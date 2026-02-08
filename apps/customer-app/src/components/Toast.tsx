'use client';

import React, { useEffect } from 'react';
import { useToastStore } from '@/store/toastStore';

export const Toast: React.FC = () => {
  const { message, variant, isVisible } = useToastStore();

  useEffect(() => {
    if (isVisible && message) {
      const timer = setTimeout(() => {
        useToastStore.getState().hideToast();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, message]);

  if (!message) return null;

  const variantStyles = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-[max(1rem,env(safe-area-inset-top))] left-4 z-50 min-w-[280px] max-w-[min(400px,calc(100vw-2rem))] px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all duration-300 ease-out ${variantStyles[variant]} ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
      }`}
    >
      {message}
    </div>
  );
};
