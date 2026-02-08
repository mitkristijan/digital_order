'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useBranding } from '@/hooks/useBranding';
import { CUSTOMER_TENANT } from '@/config/tenant';

const NON_TENANT_ROUTES = ['track-order'];

function getTenantIdFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return CUSTOMER_TENANT;
  const first = segments[0];
  if (NON_TENANT_ROUTES.includes(first)) return CUSTOMER_TENANT;
  return first;
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tenantId = pathname ? getTenantIdFromPath(pathname) : CUSTOMER_TENANT;
  const branding = useBranding(tenantId);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', branding.primaryColor);
    }
  }, [branding.primaryColor]);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --brand-primary: ${branding.primaryColor};
              --brand-accent: ${branding.accentColor};
              --brand-hero-start: ${branding.heroGradientStart};
              --brand-hero-mid: ${branding.heroGradientMid};
              --brand-hero-end: ${branding.heroGradientEnd};
            }
          `,
        }}
      />
      {children}
    </>
  );
}
