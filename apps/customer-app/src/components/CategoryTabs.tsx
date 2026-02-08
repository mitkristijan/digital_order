'use client';

import React, { useState } from 'react';
import { Category } from '@/hooks/useMenu';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
}) => {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-stone-100">
      <div className="flex overflow-x-auto scrollbar-hide px-4 py-3 gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`
              px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors
              ${
                activeCategory === category.id
                  ? 'text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 active:bg-stone-300'
              }
            `}
            style={
              activeCategory === category.id
                ? { backgroundColor: 'var(--brand-primary)' }
                : undefined
            }
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};
