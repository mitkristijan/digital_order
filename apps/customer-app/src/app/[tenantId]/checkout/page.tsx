'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useActiveOrderStore } from '@/store/activeOrderStore';
import { useCreateOrder } from '@/hooks/useOrder';
import { OrderType } from '@digital-order/types';
import { useMenu } from '@/hooks/useMenu';
import { Input, Textarea, Spinner } from '@digital-order/ui';
import { OrderSuccess } from '@/components/OrderSuccess';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.tenantId as string;
  
  const { items, tableNumber, getTotalPrice, clearCart, removeItemsNotInMenu } = useCartStore();
  const setActiveOrder = useActiveOrderStore((s) => s.setActiveOrder);
  const createOrder = useCreateOrder(tenantId);
  const { data: categories, isLoading: menuLoading } = useMenu(tenantId);

  // Remove stale cart items when menu loads (e.g. after DB reset/re-seed, or inactive variants)
  useEffect(() => {
    if (categories && categories.length > 0) {
      const validMenuItemIds = categories.flatMap((c) => c.menuItems.map((m) => m.id));
      const validVariantIds = categories.flatMap((c) =>
        c.menuItems.flatMap((m) =>
          (m.variants ?? []).filter((v) => v.active).map((v) => v.id)
        )
      );
      removeItemsNotInMenu(validMenuItemIds, validVariantIds);
    }
  }, [categories, removeItemsNotInMenu]);
  
  const [customerName, setCustomerName] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    try {
      const orderData = {
        orderType: OrderType.DINE_IN,
        tableNumber: tableNumber || undefined,
        customerName: customerName || 'Guest',
        specialInstructions: specialRequests || undefined,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          variantId: item.variantId,
          modifiers: item.modifiers?.map((m) => m.id) || [],
          specialInstructions: item.specialInstructions,
        })),
      };

      const response = await createOrder.mutateAsync(orderData);
      
      setOrderNumber(response.orderNumber);
      setActiveOrder(response.orderNumber, tenantId);
      clearCart();
    } catch (error: any) {
      console.error('Order submission failed:', error);
      const message = error.response?.data?.message || 'Failed to submit order. Please try again.';
      const isStaleCart = typeof message === 'string' && /not found or inactive/i.test(message);
      if (isStaleCart) {
        clearCart();
        alert(
          'Some items in your cart are no longer available. Your cart has been cleared. Please add items again from the menu.'
        );
        router.push(`/${tenantId}/menu`);
        return;
      }
      alert(message);
    }
  };

  if (orderNumber) {
    return <OrderSuccess orderNumber={orderNumber} tenantId={tenantId} />;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen min-h-dvh bg-stone-50 p-4">
        <h1 className="text-xl font-semibold text-stone-900 mb-4">Your cart is empty</h1>
        <button
          onClick={() => router.push(`/${tenantId}/menu`)}
          className="px-6 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh bg-stone-50 pb-[max(5rem,calc(2rem+env(safe-area-inset-bottom)))]">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-10 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center p-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 mr-2 rounded-full text-stone-600 hover:bg-stone-100 active:bg-stone-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-stone-900">Checkout</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-4">
          <h2 className="font-semibold mb-3 text-stone-900">Order Summary</h2>
          {tableNumber && (
            <p className="text-sm text-stone-500 mb-3">Table: {tableNumber}</p>
          )}
          <div className="space-y-2">
            {items.map((item) => {
              const variantPrice = Number(item.variantPriceModifier) || 0;
              const modifiersPrice =
                item.modifiers?.reduce((sum, mod) => sum + Number(mod.priceModifier), 0) || 0;
              const itemTotal = (Number(item.basePrice) + variantPrice + modifiersPrice) * item.quantity;

              return (
                <div key={`${item.menuItemId}-${item.variantId || ''}`} className="flex justify-between text-sm">
                  <span className="text-stone-700">
                    {item.quantity}x {item.name}
                    {item.variantName && ` (${item.variantName})`}
                  </span>
                  <span className="font-medium text-stone-900">${itemTotal.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-stone-100 mt-3 pt-3 flex justify-between font-bold text-lg">
            <span className="text-stone-900">Total</span>
            <span className="text-orange-600">${getTotalPrice().toFixed(2)}</span>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-4 space-y-4">
          <h2 className="font-semibold text-stone-900">Your Details</h2>
          <Input
            label="Name (Optional)"
            placeholder="Enter your name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <Textarea
            label="Special Requests (Optional)"
            placeholder="Any dietary requirements or special instructions?"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={3}
          />
        </div>

        {/* Payment Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-medium text-amber-800 text-center">
            💳 Payment at counter after order
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 active:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={createOrder.isPending || menuLoading}
        >
          {createOrder.isPending ? (
            <>
              <Spinner size="sm" />
              Submitting...
            </>
          ) : (
            'Submit Order'
          )}
        </button>
      </form>
    </div>
  );
}
