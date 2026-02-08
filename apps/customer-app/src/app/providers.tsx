'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { BrandingProvider } from '@/components/BrandingProvider';
import { CartToastProvider } from '@/components/CartToastProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  useEffect(() => {
    // Register service worker for PWA
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered');
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrandingProvider>
        <CartToastProvider>{children}</CartToastProvider>
      </BrandingProvider>
    </QueryClientProvider>
  );
}
