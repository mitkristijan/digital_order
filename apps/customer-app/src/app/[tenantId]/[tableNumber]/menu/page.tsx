'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Spinner } from '@digital-order/ui';
import apiClient from '@/lib/apiClient';
import { useCartStore } from '@/store/cartStore';
import { MenuView } from '@/components/MenuView';

/**
 * Table ordering menu.
 * Used when customer scans QR code at a table: /{tenantId}/{tableNumber}/menu
 * Validates table, sets table number in cart, then renders the menu.
 */
export default function TableMenuPage() {
  const params = useParams();
  const tenantId = params?.tenantId as string;
  const tableNumber = params?.tableNumber as string;
  const setTableNumber = useCartStore((state) => state.setTableNumber);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadTable = async () => {
      try {
        await apiClient.get(`/tables/number/${tableNumber}?tenantId=${tenantId}`);
        setTableNumber(tableNumber);
      } catch (error) {
        console.error('Error loading table:', error);
        setTableNumber(tableNumber);
      }
      setReady(true);
    };

    if (tenantId && tableNumber) {
      loadTable();
    }
  }, [tenantId, tableNumber, setTableNumber]);

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen min-h-dvh bg-gradient-to-br from-orange-50 to-amber-50">
        <Spinner size="lg" />
        <p className="mt-4 text-stone-600">Loading menu...</p>
      </div>
    );
  }

  return <MenuView tenantId={tenantId} tableNumber={tableNumber} />;
}
