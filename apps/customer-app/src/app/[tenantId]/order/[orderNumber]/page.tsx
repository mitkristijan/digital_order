'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useOrderByNumber } from '@/hooks/useOrder';
import { Spinner, Badge } from '@digital-order/ui';

const statusConfig = {
  PENDING: { label: 'New', variant: 'warning' as const, color: 'bg-yellow-100' },
  CONFIRMED: { label: 'Preparing', variant: 'info' as const, color: 'bg-blue-100' },
  PREPARING: { label: 'Preparing', variant: 'info' as const, color: 'bg-blue-100' },
  READY: { label: 'Ready', variant: 'success' as const, color: 'bg-green-100' },
  COMPLETED: { label: 'Completed', variant: 'success' as const, color: 'bg-green-100' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' as const, color: 'bg-red-100' },
};

export default function OrderTrackingPage() {
  const params = useParams();
  const tenantId = params?.tenantId as string;
  const orderNumber = params?.orderNumber as string;

  const { data: order, isLoading, error } = useOrderByNumber(tenantId, orderNumber);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <p className="text-red-600 mb-4">Order not found</p>
      </div>
    );
  }

  const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.PENDING;

  return (
    <div className="min-h-screen min-h-dvh bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center justify-center p-4">
          <h1 className="text-xl font-semibold text-stone-900">Order Status</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {/* Order Number */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-6 text-center">
          <p className="text-sm text-stone-500 mb-2">Order Number</p>
          <p className="text-3xl font-bold text-orange-600 mb-4">{order.orderNumber}</p>
          <Badge variant={status.variant} className="text-base px-4 py-2">
            {status.label}
          </Badge>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-6">
          <h2 className="font-semibold mb-4 text-stone-900">Order Progress</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status !== 'CANCELLED' ? 'bg-orange-500' : 'bg-stone-200'}`}>
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="font-medium text-stone-900">Order Placed</p>
                <p className="text-sm text-stone-500">Your order has been received</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['PREPARING', 'READY', 'COMPLETED'].includes(order.status) ? 'bg-orange-500' : 'bg-stone-200'}`}>
                {['PREPARING', 'READY', 'COMPLETED'].includes(order.status) ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-white text-xs">2</span>
                )}
              </div>
              <div className="ml-4">
                <p className="font-medium text-stone-900">Preparing</p>
                <p className="text-sm text-stone-500">We're making your order</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['READY', 'COMPLETED'].includes(order.status) ? 'bg-orange-500' : 'bg-stone-200'}`}>
                {['READY', 'COMPLETED'].includes(order.status) ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-white text-xs">3</span>
                )}
              </div>
              <div className="ml-4">
                <p className="font-medium text-stone-900">Ready for Pickup</p>
                <p className="text-sm text-stone-500">Your order is ready at the counter</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-6">
          <h2 className="font-semibold mb-4 text-stone-900">Order Items</h2>
          <div className="space-y-3">
            {order.items?.map((item: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.menuItemName || item.menuItem?.name || 'Item'}
                </span>
                <span className="font-medium">${(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-blue-600">${Number(order.total ?? 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {order.specialRequests && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm font-medium text-amber-900 mb-1">Special Requests</p>
            <p className="text-sm text-amber-800">{order.specialRequests}</p>
          </div>
        )}
      </div>
    </div>
  );
}
