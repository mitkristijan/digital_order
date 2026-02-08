'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MenuItem } from '@/hooks/useMenu';
import { Badge, Spinner } from '@digital-order/ui';
import { useCartStore } from '@/store/cartStore';

interface MenuItemCardProps {
  item: MenuItem;
  tenantId: string;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, tenantId }) => {
  const addItem = useCartStore((state) => state.addItem);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.availability || isAdding) return;
    setIsAdding(true);
    addItem({
      menuItemId: item.id,
      name: item.name,
      basePrice: item.basePrice,
      quantity: 1,
      imageUrl: item.imageUrl ?? undefined,
    });
    setTimeout(() => setIsAdding(false), 400);
  };

  const detailsHref = `/${tenantId}/menu/${item.id}`;

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-card hover:shadow-soft transition-all active:scale-[0.98]">
      <Link href={detailsHref} className="flex-1 flex flex-col min-h-0">
        <div className="relative h-36 sm:h-40 w-full flex-shrink-0 bg-stone-100">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
          {!item.availability && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="danger" className="text-xs">
                Sold Out
              </Badge>
            </div>
          )}
        </div>
        <div className="p-3 flex-1 flex flex-col min-h-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm text-stone-900 line-clamp-2">{item.name}</h3>
            <span className="font-bold text-sm flex-shrink-0" style={{ color: 'var(--brand-primary)' }}>${Number(item.basePrice).toFixed(2)}</span>
          </div>
          <p className="text-xs text-stone-500 mb-2 line-clamp-2 min-h-[2.5rem]">
            {item.description || '\u00A0'}
          </p>
          <div className="min-h-6 flex flex-wrap gap-1 mb-2">
            {item.dietaryTags?.map((tag) => (
              <Badge key={tag} variant="info" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </Link>
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={handleAddClick}
          disabled={!item.availability || isAdding}
          className={`
            w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex-shrink-0 flex items-center justify-center gap-2
            ${item.availability ? 'text-white' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}
          `}
          style={
            item.availability
              ? { backgroundColor: 'var(--brand-primary)' }
              : undefined
          }
        >
          {isAdding ? (
            <>
              <Spinner size="sm" className="[&_svg]:!text-white" />
              <span>Adding...</span>
            </>
          ) : item.availability ? (
            'Add'
          ) : (
            'Sold Out'
          )}
        </button>
      </div>
    </div>
  );
};
