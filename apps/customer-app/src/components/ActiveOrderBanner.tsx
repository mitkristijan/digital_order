'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useOrderByNumber } from '@/hooks/useOrder';
import { useActiveOrderStore } from '@/store/activeOrderStore';
import { Spinner } from '@digital-order/ui';

interface ActiveOrderBannerProps {
  tenantId: string;
}

const statusLabels: Record<string, string> = {
  PENDING: 'New',
  PENDING_PAYMENT: 'Payment Pending',
  CONFIRMED: 'Preparing',
  PREPARING: 'Preparing',
  READY: 'Ready for pickup',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const ActiveOrderBanner: React.FC<ActiveOrderBannerProps> = ({ tenantId }) => {
  const activeOrder = useActiveOrderStore((s) => s.activeOrder);
  const clearActiveOrder = useActiveOrderStore((s) => s.clearActiveOrder);

  const orderNumber = activeOrder?.tenantId === tenantId ? activeOrder.orderNumber : null;
  const { data: order, isLoading } = useOrderByNumber(tenantId, orderNumber ?? '');

  useEffect(() => {
    if (order && ['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(order.status)) {
      clearActiveOrder();
    }
  }, [order?.status, clearActiveOrder]);

  if (!orderNumber) return null;

  if (!order) return null;

  if (['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(order.status)) {
    return null;
  }

  const statusLabel = statusLabels[order.status] || order.status;

  return (
    <Link
      href={`/${tenantId}/order/${orderNumber}`}
      className="block relative z-10 mx-4 mt-4 mb-2"
    >
      <div
        className="rounded-xl border p-4 shadow-card flex items-center justify-between gap-4"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--brand-primary) 8%, white)',
          borderColor: 'color-mix(in srgb, var(--brand-primary) 25%, transparent)',
        }}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-900 truncate">
            Order #{orderNumber}
          </p>
          <p className="text-xs text-stone-600 mt-0.5">
            {statusLabel} · ${Number(order.total ?? 0).toFixed(2)}
          </p>
        </div>
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <span className="flex-shrink-0 text-stone-500" aria-hidden>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </div>
    </Link>
  );
};
