'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  useAnalyticsDashboard,
  usePopularItems,
  useOrdersByHour,
  useRevenueByDay,
} from '@/hooks/useAnalytics';
import { RevenueChart } from '@/components/RevenueChart';
import { OrdersByHourChart } from '@/components/OrdersByHourChart';
import { PopularItemsList } from '@/components/PopularItemsList';
import { OrdersTab } from '@/components/OrdersTab';
import { Spinner } from '@digital-order/ui';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';

type TabId = 'overview' | 'orders';

export default function AnalyticsPage() {
  const params = useParams();
  const urlTenantId = params?.tenantId as string;
  const { tenantId: authTenantId, user } = useAuth();
  const tenantId = urlTenantId || authTenantId || (user?.role === 'SUPER_ADMIN' ? 'demo-tenant' : null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const { data: dashboard, isLoading: dashboardLoading } = useAnalyticsDashboard(tenantId);
  const { data: popularItems, isLoading: popularLoading } = usePopularItems(tenantId, 10);
  const { data: ordersByHour, isLoading: ordersLoading } = useOrdersByHour(tenantId);
  const { data: revenueByDay, isLoading: revenueLoading } = useRevenueByDay(tenantId, 7);

  if (!tenantId || dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Orders' },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50/80">
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/80 shadow-soft sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track your performance</p>
            <div className="flex gap-1 mt-4 border-b border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === tab.id
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {activeTab === 'orders' ? (
            <OrdersTab tenantId={tenantId} />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl px-5 py-5 bg-gradient-to-br from-brand-50 to-brand-100/60 border border-brand-100/80 shadow-card">
                  <p className="text-xs text-brand-700/80 uppercase tracking-wider font-medium">Total Orders (Today)</p>
                  <p className="text-3xl font-bold text-brand-700 mt-1">{dashboard?.totalOrders || 0}</p>
                  {dashboard?.ordersChangePercent !== undefined && (
                    <p className={`text-sm mt-1 font-medium ${Number(dashboard.ordersChangePercent) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {Number(dashboard.ordersChangePercent) >= 0 ? '+' : ''}
                      {Number(dashboard.ordersChangePercent).toFixed(1)}% vs yesterday
                    </p>
                  )}
                </div>

                <div className="rounded-xl px-5 py-5 bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-100/80 shadow-card">
                  <p className="text-xs text-emerald-700/80 uppercase tracking-wider font-medium">Revenue (Today)</p>
                  <p className="text-3xl font-bold text-emerald-700 mt-1">
                    ${dashboard?.totalRevenue != null ? Number(dashboard.totalRevenue).toFixed(2) : '0.00'}
                  </p>
                  {dashboard?.revenueChangePercent !== undefined && (
                    <p className={`text-sm mt-1 font-medium ${Number(dashboard.revenueChangePercent) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {Number(dashboard.revenueChangePercent) >= 0 ? '+' : ''}
                      {Number(dashboard.revenueChangePercent).toFixed(1)}% vs yesterday
                    </p>
                  )}
                </div>

                <div className="rounded-xl px-5 py-5 bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-100/80 shadow-card">
                  <p className="text-xs text-indigo-700/80 uppercase tracking-wider font-medium">Average Order Value</p>
                  <p className="text-3xl font-bold text-indigo-700 mt-1">
                    ${dashboard?.averageOrderValue != null ? Number(dashboard.averageOrderValue).toFixed(2) : '0.00'}
                  </p>
                </div>

                <div className="rounded-xl px-5 py-5 bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-100/80 shadow-card">
                  <p className="text-xs text-amber-700/80 uppercase tracking-wider font-medium">Peak Hour</p>
                  <p className="text-3xl font-bold text-amber-700 mt-1">
                    {dashboard?.peakHour !== undefined ? `${dashboard.peakHour}:00` : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {!revenueLoading && revenueByDay && <RevenueChart data={revenueByDay} />}
                {!ordersLoading && ordersByHour && <OrdersByHourChart data={ordersByHour} />}
              </div>

              {!popularLoading && popularItems && <PopularItemsList items={popularItems} />}
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
