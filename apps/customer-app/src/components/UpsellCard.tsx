'use client';

import React from 'react';
import { useCartStore } from '@/store/cartStore';
interface UpsellCardProps {
  item: {
    menuItemId: string;
    name: string;
    basePrice: number;
    imageUrl?: string;
    reason: string;
  };
}

export const UpsellCard: React.FC<UpsellCardProps> = ({ item }) => {
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = () => {
    addItem({
      menuItemId: item.menuItemId,
      name: item.name,
      basePrice: item.basePrice,
      quantity: 1,
      imageUrl: item.imageUrl,
    });
  };

  return (
    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
      {item.imageUrl && (
        <img src={item.imageUrl} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-stone-900">{item.name}</p>
        <p className="text-xs text-amber-700">{item.reason}</p>
        <p className="text-sm font-bold mt-1" style={{ color: 'var(--brand-primary)' }}>${Number(item.basePrice).toFixed(2)}</p>
      </div>
      <button
        onClick={handleAdd}
        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-colors"
        style={{ backgroundColor: 'var(--brand-primary)' }}
      >
        Add
      </button>
    </div>
  );
};
