'use client';

import React from 'react';
import { useCartStore } from '@/store/cartStore';
import { useRouter, useParams } from 'next/navigation';
import { useRecommendations } from '@/hooks/useRecommendations';
import { UpsellCard } from './UpsellCard';

interface CartProps {
  onClose?: () => void;
}

export const Cart: React.FC<CartProps> = ({ onClose }) => {
  const router = useRouter();
  const params = useParams();
  const tenantId = params?.tenantId as string;
  const { items, getTotalPrice, getTotalItems, updateQuantity, removeItem } = useCartStore();
  const { data: recommendations } = useRecommendations(tenantId, items);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-stone-600 font-medium mb-1">Your cart is empty</p>
        <p className="text-stone-500 text-sm mb-6">Add items from the menu to get started</p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            Browse menu
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {items.map((item) => {
          const variantPrice = Number(item.variantPriceModifier) || 0;
          const modifiersPrice =
            item.modifiers?.reduce((sum, mod) => sum + Number(mod.priceModifier), 0) || 0;
          const unitPrice = Number(item.basePrice) + variantPrice + modifiersPrice;
          const itemTotal = unitPrice * item.quantity;

          return (
            <div
              key={`${item.menuItemId}-${item.variantId || ''}`}
              className="group bg-stone-50/80 rounded-2xl border border-stone-100 overflow-hidden transition-colors hover:border-stone-200/60"
            >
              <div className="flex gap-4 p-4">
                <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-stone-200/50">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-stone-900">{item.name}</h3>
                    <button
                      onClick={() => removeItem(item.menuItemId, item.variantId)}
                      className="flex-shrink-0 p-1.5 -mt-1 -mr-1 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      aria-label="Remove item"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {item.variantName && (
                    <p className="text-xs text-stone-500 mt-0.5">{item.variantName}</p>
                  )}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <p className="text-xs text-stone-500 mt-0.5">
                      + {item.modifiers.map((m) => m.name).join(', ')}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.menuItemId, item.quantity - 1, item.variantId)}
                        className="w-9 h-9 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-600 hover:bg-stone-50 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <span className="text-lg leading-none">−</span>
                      </button>
                      <span className="w-6 text-center font-semibold text-stone-900 tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItemId, item.quantity + 1, item.variantId)}
                        className="w-9 h-9 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-600 hover:bg-stone-50 active:scale-95 transition-all"
                      >
                        <span className="text-lg leading-none">+</span>
                      </button>
                    </div>
                    <p className="font-semibold text-stone-900" style={{ color: 'var(--brand-primary)' }}>
                      ${itemTotal.toFixed(2)}
                    </p>
                  </div>
                  {item.quantity > 1 && (
                    <p className="text-xs text-stone-400 mt-1">
                      ${unitPrice.toFixed(2)} each
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Upsell Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="pt-4 border-t border-stone-100">
            <h3 className="text-sm font-semibold text-stone-700 mb-3">You might also like</h3>
            <div className="space-y-2">
              {recommendations.map((rec) => (
                <UpsellCard key={rec.menuItemId} item={rec} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-stone-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex justify-between items-center mb-3">
          <span className="text-stone-600 font-medium">
            Total <span className="text-stone-400 font-normal">({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'})</span>
          </span>
          <span className="text-xl font-bold text-stone-900" style={{ color: 'var(--brand-primary)' }}>
            ${getTotalPrice().toFixed(2)}
          </span>
        </div>
        <button
          onClick={() => router.push(`/${tenantId}/checkout`)}
          className="w-full py-4 rounded-xl text-white font-semibold text-base transition-all hover:opacity-95 active:scale-[0.98] shadow-lg shadow-black/5"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          Order
        </button>
      </div>
    </div>
  );
};
