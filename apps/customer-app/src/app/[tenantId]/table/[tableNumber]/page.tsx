'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spinner } from '@digital-order/ui';
import apiClient from '@/lib/apiClient';
import { useCartStore } from '@/store/cartStore';

export default function TablePage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.tenantId as string;
  const tableNumber = params?.tableNumber as string;
  const setTableNumber = useCartStore((state) => state.setTableNumber);

  useEffect(() => {
    const loadTable = async () => {
      try {
        // Verify table exists
        await apiClient.get(`/tables/number/${tableNumber}?tenantId=${tenantId}`);
        
        // Store table number in cart
        setTableNumber(tableNumber);
        
        // Redirect to menu
        router.push(`/${tenantId}/menu`);
      } catch (error) {
        console.error('Error loading table:', error);
        // Still redirect to menu even if table verification fails
        setTableNumber(tableNumber);
        router.push(`/${tenantId}/menu`);
      }
    };

    if (tenantId && tableNumber) {
      loadTable();
    }
  }, [tenantId, tableNumber, router, setTableNumber]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen min-h-dvh bg-gradient-to-br from-orange-50 to-amber-50">
      <Spinner size="lg" />
      <p className="mt-4 text-stone-600">Loading menu...</p>
    </div>
  );
}
