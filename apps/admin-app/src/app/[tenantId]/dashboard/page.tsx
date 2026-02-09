'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrders } from '@/hooks/useOrders';
import { useAnalyticsDashboard } from '@/hooks/useAnalytics';
import { OrderCard } from '@/components/OrderCard';
import { Spinner } from '@digital-order/ui';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const urlTenantId = params?.tenantId as string;
  const { tenantId: authTenantId, user, isLoading: authLoading } = useAuth();
  const tenantId = urlTenantId || authTenantId || (user?.role === 'SUPER_ADMIN' ? 'demo-tenant' : null);
  const [soldTodayOpen, setSoldTodayOpen] = useState(false);
  const { data, isLoading } = useOrders(tenantId);
  const { data: analytics } = useAnalyticsDashboard(tenantId);

  useEffect(() => {
    if (authLoading) return;
    if (!urlTenantId && tenantId) {
      router.replace(`/${tenantId}/dashboard`);
    }
  }, [authLoading, urlTenantId, tenantId, router]);

  if (!tenantId || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const orders = (data as { orders?: unknown[] } | undefined)?.orders ?? [];
  const newOrders = orders.filter((o: any) => ['PENDING', 'PENDING_PAYMENT'].includes(o.status));
  const preparingOrders = orders.filter((o: any) => ['CONFIRMED', 'PREPARING'].includes(o.status));
  const readyOrders = orders.filter((o: any) => o.status === 'READY');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const soldTodayOrders = orders.filter((o: any) => {
    if (!['COMPLETED', 'DELIVERED'].includes(o.status)) return false;
    const completedDate = o.completedAt || o.deliveredAt || o.updatedAt;
    return completedDate && new Date(completedDate) >= todayStart;
  });

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const completedOrders = analytics?.completedOrders ?? 0;
  const itemsSold = analytics?.itemsSold ?? 0;
  const totalRevenue = analytics?.totalRevenue ?? 0;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50/80">
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/80 shadow-soft sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Order Dashboard</h1>
                <p className="text-sm text-gray-500 mt-0.5">Real-time order management</p>
              </div>
              <div className="flex flex-wrap items-center gap-8">
                <div className="bg-gray-50/80 rounded-xl px-4 py-3 min-w-[140px]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Date</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{today}</p>
                </div>
                <div className="bg-amber-50/80 rounded-xl px-4 py-3 min-w-[140px] border border-amber-100/50">
                  <p className="text-xs text-amber-700/80 uppercase tracking-wider font-medium">Orders completed</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">{completedOrders}</p>
                </div>
                <div className="bg-indigo-50/80 rounded-xl px-4 py-3 min-w-[140px] border border-indigo-100/50">
                  <p className="text-xs text-indigo-700/80 uppercase tracking-wider font-medium">Items sold</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">{itemsSold}</p>
                </div>
                <div className="bg-emerald-50/80 rounded-xl px-4 py-3 min-w-[140px] border border-emerald-100/50">
                  <p className="text-xs text-emerald-700/80 uppercase tracking-wider font-medium">Revenue</p>
                  <p className="text-lg font-bold text-emerald-700 mt-0.5">${totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col rounded-xl overflow-hidden shadow-card bg-white border border-gray-100">
              <div className="bg-gradient-to-r from-amber-50 to-amber-100/80 px-5 py-3.5 border-l-4 border-amber-400">
                <h2 className="font-semibold text-amber-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  New Orders ({newOrders.length})
                </h2>
              </div>
              <div className="space-y-4 p-4 bg-amber-50/30 min-h-[220px] flex-1">
                {newOrders.map((order: any) => (
                  <OrderCard key={order.id} order={order} tenantId={tenantId} />
                ))}
                {newOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">No new orders</p>
                    <p className="text-sm text-gray-400 mt-0.5">New orders will appear here</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col rounded-xl overflow-hidden shadow-card bg-white border border-gray-100">
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/80 px-5 py-3.5 border-l-4 border-indigo-400">
                <h2 className="font-semibold text-indigo-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Preparing ({preparingOrders.length})
                </h2>
              </div>
              <div className="space-y-4 p-4 bg-indigo-50/30 min-h-[220px] flex-1">
                {preparingOrders.map((order: any) => (
                  <OrderCard key={order.id} order={order} tenantId={tenantId} />
                ))}
                {preparingOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">No orders in preparation</p>
                    <p className="text-sm text-gray-400 mt-0.5">Accepted orders move here</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col rounded-xl overflow-hidden shadow-card bg-white border border-gray-100">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/80 px-5 py-3.5 border-l-4 border-emerald-400">
                <h2 className="font-semibold text-emerald-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Ready ({readyOrders.length})
                </h2>
              </div>
              <div className="space-y-4 p-4 bg-emerald-50/30 min-h-[220px] flex-1">
                {readyOrders.map((order: any) => (
                  <OrderCard key={order.id} order={order} tenantId={tenantId} />
                ))}
                {readyOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">No orders ready</p>
                    <p className="text-sm text-gray-400 mt-0.5">Ready orders appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-6 right-6 z-20 flex flex-col items-end gap-0">
          {soldTodayOpen ? (
            <div className="rounded-xl overflow-hidden shadow-lg bg-white border border-gray-200 w-[380px] max-h-[70vh] flex flex-col">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  Sold Today ({soldTodayOrders.length})
                </h2>
                <button
                  onClick={() => setSoldTodayOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-600 transition-colors"
                  aria-label="Collapse"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto p-4 space-y-4 bg-slate-50/30 max-h-[60vh]">
                {soldTodayOrders.map((order: any) => (
                  <OrderCard key={order.id} order={order} tenantId={tenantId} />
                ))}
                {soldTodayOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">No orders sold today</p>
                    <p className="text-sm text-gray-400 mt-0.5">Completed orders appear here</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
          <button
            onClick={() => setSoldTodayOpen((v) => !v)}
            className="flex items-center gap-2 px-4 py-3 rounded-full shadow-lg bg-slate-700 hover:bg-slate-800 text-white font-medium transition-colors border border-slate-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Sold Today</span>
            <span className="min-w-[1.5rem] text-center text-sm font-bold bg-slate-500/80 rounded-full px-2 py-0.5">
              {soldTodayOrders.length}
            </span>
          </button>
        </div>
      </div>
    </AuthGuard>
  );
}
