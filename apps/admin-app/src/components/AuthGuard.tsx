'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Spinner } from '@digital-order/ui';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const params = useParams();
  const urlTenantId = params?.tenantId as string | undefined;
  const { user, tenantId, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!localStorage.getItem('accessToken')) {
      router.push('/login');
    }
  }, [isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!localStorage.getItem('accessToken')) {
    return null;
  }

  // TENANT_ADMIN must have a tenant (from auth or URL); SUPER_ADMIN can use tenant from URL
  const hasTenant = tenantId || user?.subdomain || user?.tenantId || urlTenantId;
  if (user?.role === 'TENANT_ADMIN' && !hasTenant) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md p-6">
          <p className="text-red-600 font-medium">No restaurant associated with your account.</p>
          <p className="text-gray-600 text-sm mt-2">Please contact support.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
