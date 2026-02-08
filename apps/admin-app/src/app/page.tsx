'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@digital-order/ui';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { tenantId, user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    const effectiveTenant = user?.subdomain ?? user?.tenantId ?? (user?.role === 'SUPER_ADMIN' ? 'demo-tenant' : null) ?? tenantId;
    if (effectiveTenant) {
      router.push(`/${effectiveTenant}/dashboard`);
    } else {
      router.push('/login');
    }
  }, [isLoading, tenantId, user, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <Spinner size="lg" />
    </div>
  );
}
