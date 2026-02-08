'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderByNumber } from '@/hooks/useOrder';
import { useActiveOrderStore } from '@/store/activeOrderStore';
import { Spinner } from '@digital-order/ui';

interface OrderSuccessProps {
  orderNumber: string;
  tenantId: string;
}

const statusLabels: Record<string, string> = {
  PENDING: 'New',
  PENDING_PAYMENT: 'Payment Pending',
  CONFIRMED: 'Preparing',
  PREPARING: 'Preparing',
  READY: 'Ready',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const OrderSuccess: React.FC<OrderSuccessProps> = ({ orderNumber, tenantId }) => {
  const router = useRouter();
  const clearActiveOrder = useActiveOrderStore((s) => s.clearActiveOrder);
  const { data: order, isLoading } = useOrderByNumber(tenantId, orderNumber);

  useEffect(() => {
    if (order && ['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(order.status)) {
      clearActiveOrder();
    }
  }, [order?.status, clearActiveOrder]);

  const statusLabel = order ? statusLabels[order.status] || order.status : '';

  return (
    <div className="flex flex-col items-center min-h-screen min-h-dvh bg-stone-50 p-4 pt-[env(safe-area-inset-top,0px)] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="bg-white rounded-2xl shadow-elevated border border-stone-100 p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 15%, white)' }}>
          <svg
            className="w-10 h-10"
            style={{ color: 'var(--brand-primary)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Order Placed!</h1>
        
        <p className="text-stone-600 mb-6">
          Your order has been submitted successfully.
        </p>
        
        <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 10%, white)' }}>
          <p className="text-sm text-stone-500 mb-1">Order Number</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--brand-primary)' }}>{orderNumber}</p>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-amber-800">
            Please pay at the counter
          </p>
        </div>
        
        <p className="text-sm text-stone-500 mb-6">
          We'll notify you when your order is ready.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => router.push(`/${tenantId}/order/${orderNumber}`)}
            className="w-full py-3.5 rounded-xl text-white font-semibold transition-colors"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            Track Order
          </button>
          <button
            onClick={() => router.push(`/${tenantId}/menu`)}
            className="w-full py-3 rounded-xl bg-white border border-stone-200 text-stone-700 font-medium hover:bg-stone-50 active:bg-stone-100 transition-colors"
          >
            Back to Menu
          </button>
        </div>

        {/* Your order - shown until completed */}
        <div className="mt-6 pt-6 border-t border-stone-100 text-left">
          <h3 className="text-sm font-semibold text-stone-700 mb-3">Your order</h3>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : order ? (
            <div className="space-y-2">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm text-stone-600">
                  <span>{item.quantity}x {item.menuItemName || item.menuItem?.name || 'Item'}{item.variantName ? ` (${item.variantName})` : ''}</span>
                  <span className="font-medium">${(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold text-stone-900 pt-2 border-t border-stone-100">
                <span>Total</span>
                <span style={{ color: 'var(--brand-primary)' }}>${Number(order.total ?? 0).toFixed(2)}</span>
              </div>
              <p className="text-xs text-stone-500 mt-2">
                Status: {statusLabel}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
