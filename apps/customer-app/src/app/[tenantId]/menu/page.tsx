'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMenu } from '@/hooks/useMenu';
import { useBranding } from '@/hooks/useBranding';
import { useCartStore } from '@/store/cartStore';
import { CategoryTabs } from '@/components/CategoryTabs';
import { MenuItemCard } from '@/components/MenuItemCard';
import { Cart } from '@/components/Cart';
import { ActiveOrderBanner } from '@/components/ActiveOrderBanner';
import { Spinner, Badge } from '@digital-order/ui';

export default function MenuPage() {
  const params = useParams();
  const tenantId = params?.tenantId as string;
  const { data: categories, isLoading, error } = useMenu(tenantId);
  const branding = useBranding(tenantId);
  const cartItemCount = useCartStore((state) => state.getTotalItems());
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (categories && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (tenantId) {
      useCartStore.getState().setTenantId(tenantId);
    }
  }, [tenantId]);

  // Remove stale cart items when menu loads (e.g. after DB reset/re-seed)
  useEffect(() => {
    if (categories && categories.length > 0) {
      const validIds = categories.flatMap((c) => c.menuItems.map((m) => m.id));
      useCartStore.getState().removeItemsNotInMenu(validIds);
    }
  }, [categories]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    const is404 = (error as any)?.response?.status === 404;
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50 p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-stone-900 mb-2">Could not load menu</h2>
          <p className="text-stone-600 text-sm mb-4">
            {is404
              ? `Restaurant "${tenantId}" was not found. If you're running locally, seed the database first.`
              : 'Could not connect to the server. Please check your connection and try again.'}
          </p>
          <Link
            href={`/${tenantId}/dashboard`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium text-sm"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="min-h-screen min-h-dvh bg-stone-50 flex flex-col items-center justify-center p-6">
        <Link href={`/${tenantId}/dashboard`} className="absolute top-4 left-4 p-2 -ml-2 rounded-full text-stone-600 hover:bg-stone-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-stone-100 mb-6">
            <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-stone-900 mb-2">No menu items available</h2>
          <p className="text-stone-600 text-sm mb-6">
            This restaurant has not added any menu items yet. Check back later or browse other options.
          </p>
          <Link
            href={`/${tenantId}/dashboard`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-colors"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const activeItems = categories.find((cat) => cat.id === activeCategory)?.menuItems || [];
  const bgImage = branding.heroBackgroundImage;

  return (
    <div className="min-h-screen min-h-dvh relative" style={{ background: bgImage ? undefined : '#fafaf9' }}>
      {/* Background image */}
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
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-stone-100 pt-[env(safe-area-inset-top,0px)] shadow-soft">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href={`/${tenantId}/dashboard`} className="p-2 -ml-2 rounded-full text-stone-600 hover:bg-stone-100 active:bg-stone-200 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold text-stone-900">Menu</h1>
          <button
            onClick={() => setIsCartOpen(!isCartOpen)}
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

      {/* Active order banner - shown until order is completed */}
      <ActiveOrderBanner tenantId={tenantId} />

      {/* Category Tabs */}
      <div className="relative z-10">
      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Menu Items Grid */}
      <div className="relative z-10 p-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {activeItems.map((item) => (
            <MenuItemCard key={item.id} item={item} tenantId={tenantId} />
          ))}
        </div>
      </div>
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
