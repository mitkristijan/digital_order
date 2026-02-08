'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMenuItems } from '@/hooks/useMenu';
import { MenuItemTable } from '@/components/MenuItemTable';
import { MenuItemForm } from '@/components/MenuItemForm';
import { Spinner, Input, Button } from '@digital-order/ui';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';

export default function MenuManagementPage() {
  const params = useParams();
  const urlTenantId = params?.tenantId as string;
  const { tenantId: authTenantId, user } = useAuth();
  const tenantId = urlTenantId || authTenantId || (user?.role === 'SUPER_ADMIN' ? 'demo-tenant' : null);
  const { data: items, isLoading, error } = useMenuItems(tenantId);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  if (!tenantId || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-slate-600">Loading menu items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const is404 = (error as any)?.response?.status === 404;
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg border border-slate-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to load menu</h2>
          <p className="text-slate-600 text-sm mb-4">
            {is404
              ? `Tenant "${tenantId}" was not found. Run the database seed to create it.`
              : 'Could not connect to the API. Ensure the API is running on port 3000.'}
          </p>
          <p className="text-slate-500 text-xs mb-4">
            From the project root: <code className="bg-slate-100 px-1 rounded">cd apps/api && npx prisma db seed</code>
          </p>
        </div>
      </div>
    );
  }

  const filteredItems = items?.filter((item: any) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const stats = {
    total: items?.length || 0,
    available: items?.filter((item: any) => item.availability).length || 0,
    soldOut: items?.filter((item: any) => !item.availability).length || 0,
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Menu Management</h1>
                <p className="text-slate-600 mt-1">Manage your menu items and availability</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {viewMode === 'list' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                  {viewMode === 'grid' ? 'List View' : 'Grid View'}
                </Button>
                <Button onClick={handleAddItem}>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Item
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Items</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Available</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">{stats.available}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Sold Out</p>
                    <p className="text-2xl font-bold text-red-900 mt-1">{stats.soldOut}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Input
                className="pl-10"
                placeholder="Search by name, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {filteredItems.length > 0 ? (
            <div className="relative z-0">
              <MenuItemTable
                items={filteredItems}
                tenantId={tenantId}
                viewMode={viewMode}
                onEdit={handleEditItem}
              />
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {searchTerm ? 'No items found' : 'No menu items available'}
              </h3>
              <p className="text-slate-600">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first menu item'}
              </p>
              {!searchTerm && (
                <Button className="mt-4" onClick={handleAddItem}>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add First Item
                </Button>
              )}
            </div>
          )}
        </div>

        <MenuItemForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          tenantId={tenantId}
          item={editingItem}
          onSuccess={handleFormSuccess}
        />
      </div>
    </AuthGuard>
  );
}
