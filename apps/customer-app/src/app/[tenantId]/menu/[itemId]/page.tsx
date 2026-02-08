'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMenu, useMenuItem } from '@/hooks/useMenu';
import { useCartStore } from '@/store/cartStore';
import { useBranding } from '@/hooks/useBranding';
import { Badge } from '@digital-order/ui';
import { Spinner } from '@digital-order/ui';
import { Cart } from '@/components/Cart';

export default function MenuItemDetailsPage() {
  const params = useParams();
  const tenantId = params?.tenantId as string;
  const itemId = params?.itemId as string;
  const { data: item, isLoading, error } = useMenuItem(tenantId, itemId);
  const { data: menu } = useMenu(tenantId);
  const branding = useBranding(tenantId);
  const addItem = useCartStore((state) => state.addItem);
  const cartItemCount = useCartStore((state) => state.getTotalItems());

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (tenantId) {
      useCartStore.getState().setTenantId(tenantId);
    }
  }, [tenantId]);

  // Curated suggested items from admin (or fallback to category-based)
  const suggestedItems = useMemo(() => {
    if (!item) return [];
    const curated = (item as any).suggestedItems?.map((s: any) => s.suggestedItem).filter(Boolean) ?? [];
    if (curated.length > 0) return curated;
    // Fallback: items from same category
    if (!menu) return [];
    const category = menu.find((c) => c.id === item.categoryId);
    return (category?.menuItems ?? []).filter((i) => i.id !== item.id).slice(0, 4);
  }, [menu, item]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-stone-600 mb-4">Item not found</p>
        <Link
          href={`/${tenantId}/menu`}
          className="px-4 py-2 rounded-xl text-white font-medium"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          Back to Menu
        </Link>
      </div>
    );
  }

  const images = item.imageUrl ? [item.imageUrl] : [];

  const handleAddToCart = () => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      basePrice: item.basePrice,
      quantity: 1,
      imageUrl: item.imageUrl,
    });
  };

  const bgImage = branding.heroBackgroundImage;

  return (
    <div className="min-h-screen min-h-dvh relative flex flex-col" style={{ background: bgImage ? undefined : '#fafaf9' }}>
      {bgImage && (
        <div
          aria-hidden
          className="absolute inset-0 z-0"
          style={{
            background: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-stone-100 pt-[env(safe-area-inset-top,0px)] relative z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <Link
            href={`/${tenantId}/menu`}
            className="p-2 -ml-2 rounded-full text-stone-600 hover:bg-stone-100 active:bg-stone-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-stone-900 truncate max-w-[50%]">{item.name}</h1>
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-full hover:bg-stone-100 active:bg-stone-200 transition-colors"
            aria-label="Cart"
          >
            <svg className="w-6 h-6 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {cartItemCount > 0 && (
              <Badge variant="danger" className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 flex items-center justify-center text-xs">
                {cartItemCount}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* Image carousel */}
      <div className="relative z-10 w-full aspect-[4/3] bg-stone-100 flex-shrink-0">
        {images.length > 0 ? (
          <>
            <img
              src={images[currentImageIndex]}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                    aria-label={`View image ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-20 h-20 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Item details */}
      <div className="relative z-10 flex-1 p-4 pb-6 bg-white rounded-t-2xl -mt-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="text-xl font-bold text-stone-900">{item.name}</h2>
          <span className="text-xl font-bold flex-shrink-0" style={{ color: 'var(--brand-primary)' }}>
            ${Number(item.basePrice).toFixed(2)}
          </span>
        </div>
        {item.description && (
          <p className="text-stone-600 text-sm mb-3">{item.description}</p>
        )}
        {item.dietaryTags && item.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.dietaryTags.map((tag) => (
              <Badge key={tag} variant="info" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {item.allergens && item.allergens.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-stone-500 mb-1.5">Allergens</p>
            <div className="flex flex-wrap gap-1">
              {item.allergens.map((allergen) => (
                <Badge key={allergen} variant="warning" className="text-xs">
                  {allergen}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleAddToCart}
          disabled={!item.availability}
          className={`
            w-full py-3.5 rounded-xl text-base font-semibold transition-colors
            ${item.availability ? 'text-white' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}
          `}
          style={
            item.availability
              ? { backgroundColor: 'var(--brand-primary)' }
              : undefined
          }
        >
          {item.availability ? 'Add to Cart' : 'Sold Out'}
        </button>

        {/* Related / suggested items */}
        {suggestedItems.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-sm font-semibold text-stone-700">You might also like</h3>
            <div className="space-y-2">
              {suggestedItems.map((menuItem: any) => (
                <SuggestedItemCard
                  key={menuItem.id}
                  item={{
                    menuItemId: menuItem.id,
                    name: menuItem.name,
                    basePrice: menuItem.basePrice,
                    imageUrl: menuItem.imageUrl,
                  }}
                  tenantId={tenantId}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-30 backdrop-blur-sm animate-cart-fade-in"
            onClick={() => setIsCartOpen(false)}
            aria-hidden
          />
          <div
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-40 shadow-elevated flex flex-col animate-cart-slide-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-dialog-title"
          >
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-stone-100 pt-[max(1.25rem,env(safe-area-inset-top))]">
              <div className="flex items-center gap-2">
                <h2 id="cart-dialog-title" className="text-lg font-semibold text-stone-900">Your Cart</h2>
                {cartItemCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
                    {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2.5 -mr-1 rounded-full hover:bg-stone-100 active:bg-stone-200 transition-colors text-stone-500 hover:text-stone-700"
                aria-label="Close cart"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <Cart onClose={() => setIsCartOpen(false)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SuggestedItemCard({
  item,
  tenantId,
}: {
  item: { menuItemId: string; name: string; basePrice: number; imageUrl?: string | null };
  tenantId: string;
}) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      menuItemId: item.menuItemId,
      name: item.name,
      basePrice: item.basePrice,
      quantity: 1,
      imageUrl: item.imageUrl ?? undefined,
    });
  };

  return (
    <Link
      href={`/${tenantId}/menu/${item.menuItemId}`}
      className="flex items-center gap-3 bg-stone-50 border border-stone-100 rounded-xl p-3 hover:bg-stone-100 transition-colors"
    >
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
      ) : (
        <div className="w-14 h-14 bg-stone-200 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-stone-900">{item.name}</p>
        <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--brand-primary)' }}>
          ${Number(item.basePrice).toFixed(2)}
        </p>
      </div>
      <button
        onClick={handleAdd}
        className="flex-shrink-0 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
        style={{ backgroundColor: 'var(--brand-primary)' }}
      >
        Add
      </button>
    </Link>
  );
}
