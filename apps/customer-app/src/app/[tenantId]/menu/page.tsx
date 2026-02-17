'use client';

import { useParams } from 'next/navigation';
import { MenuView } from '@/components/MenuView';

/**
 * Pickup / direct ordering menu.
 * Used by the settings link (e.g. /{slug}/menu) for customers ordering for pickup.
 */
export default function MenuPage() {
  const params = useParams();
  const tenantId = params?.tenantId as string;

  return <MenuView tenantId={tenantId} />;
}
