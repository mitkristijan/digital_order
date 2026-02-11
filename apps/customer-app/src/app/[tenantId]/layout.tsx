'use client';

/**
 * Layout for tenant-scoped routes: /[tenantId]/menu, /[tenantId]/checkout, etc.
 * Each tenant has their own menu at /{slug}/menu.
 */
export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
