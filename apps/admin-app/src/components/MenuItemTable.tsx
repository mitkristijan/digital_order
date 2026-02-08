'use client';

import React, { useState } from 'react';
import { AvailabilityToggle } from './AvailabilityToggle';
import { Badge } from '@digital-order/ui';
import { useDeleteMenuItem } from '@/hooks/useMenu';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  imageUrl?: string | null;
  availability: boolean;
  category?: { name: string };
  dietaryTags?: string[];
}

interface MenuItemTableProps {
  items: MenuItem[];
  tenantId: string;
  viewMode?: 'grid' | 'list';
  onEdit?: (item: MenuItem) => void;
}

export const MenuItemTable: React.FC<MenuItemTableProps> = ({ items, tenantId, viewMode = 'list', onEdit }) => {
  const deleteMutation = useDeleteMenuItem(tenantId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (item: MenuItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      setDeletingId(item.id);
      try {
        await deleteMutation.mutateAsync(item.id);
      } catch (error) {
        console.error('Failed to delete item:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-slate-300"
          >
            <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="absolute top-3 right-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  item.availability
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}>
                  {item.availability ? 'Available' : 'Sold Out'}
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                    {item.name}
                  </h3>
                  {item.category && (
                    <span className="inline-flex items-center text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                      {item.category.name}
                    </span>
                  )}
                </div>
                <span className="text-xl font-bold text-slate-900 ml-3">
                  ${typeof item.basePrice === 'number' ? item.basePrice.toFixed(2) : Number(item.basePrice).toFixed(2)}
                </span>
              </div>
              {item.description && (
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                  {item.description}
                </p>
              )}
              {item.dietaryTags && item.dietaryTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {item.dietaryTags.map((tag) => (
                    <Badge key={tag} variant="info" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <AvailabilityToggle
                  itemId={item.id}
                  tenantId={tenantId}
                  availability={item.availability}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit?.(item)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Availability
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg border-2 border-slate-200 group-hover:border-blue-300 transition-colors"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center border-2 border-slate-200 group-hover:border-blue-300 transition-colors">
                          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-sm text-slate-600 line-clamp-1 mt-1">
                          {item.description}
                        </p>
                      )}
                      {item.dietaryTags && item.dietaryTags.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {item.dietaryTags.map((tag) => (
                            <Badge key={tag} variant="info" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  {item.category && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                      {item.category.name}
                    </span>
                  )}
                  {!item.category && (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-6 py-5">
                  <span className="text-lg font-bold text-slate-900">
                    ${typeof item.basePrice === 'number' ? item.basePrice.toFixed(2) : Number(item.basePrice).toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <AvailabilityToggle
                    itemId={item.id}
                    tenantId={tenantId}
                    availability={item.availability}
                  />
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit?.(item)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit item"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete item"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
