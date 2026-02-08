'use client';

import React from 'react';
import { Badge } from '@digital-order/ui';

interface PopularItemsListProps {
  items: Array<{
    name: string;
    orderCount: number;
    revenue: number;
  }>;
}

export const PopularItemsList: React.FC<PopularItemsListProps> = ({ items }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Items</h2>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50/80 hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Badge variant="info" className="text-sm font-semibold">
                #{index + 1}
              </Badge>
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500">{item.orderCount} orders</p>
              </div>
            </div>
            <p className="font-semibold text-emerald-600">${Number(item.revenue).toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
