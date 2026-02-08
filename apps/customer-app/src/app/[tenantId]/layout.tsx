'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CUSTOMER_TENANT } from '@/config/tenant';

/**
 * Guard: redirect to correct tenant if URL has a different tenant.
 * Middleware does the main redirect; this catches any client-side edge cases.
 */
export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const urlTenantId = params?.tenantId as string;

  useEffect(() => {
    if (urlTenantId && urlTenantId !== CUSTOMER_TENANT) {
      const pathname = window.location.pathname;
      const segments = pathname.split('/').filter(Boolean);
      const rest = segments.slice(1).join('/');
      const correctPath = rest ? `/${CUSTOMER_TENANT}/${rest}` : `/${CUSTOMER_TENANT}`;
      router.replace(correctPath);
    }
  }, [urlTenantId, router]);

  return <>{children}</>;
}
