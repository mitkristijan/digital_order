'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@digital-order/ui';
import { CUSTOMER_TENANT } from '@/config/tenant';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect root to tenant dashboard - customers must never be routed outside their tenant
    router.replace(`/${CUSTOMER_TENANT}/dashboard`);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen min-h-dvh bg-stone-50">
      <Spinner size="lg" />
      <p className="mt-4 text-stone-600 text-sm">Loading...</p>
    </div>
  );
}
