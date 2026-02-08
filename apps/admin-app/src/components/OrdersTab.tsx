'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { OrderStatusBadge } from './OrderStatusBadge';
import { Button, Select, Spinner } from '@digital-order/ui';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  menuItemName: string;
  variantName?: string | null;
  specialInstructions?: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  orderType: string;
  orderedAt: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  tableNumber?: string | null;
  deliveryAddress?: string | null;
  subtotal: number;
  tax: number;
  tip: number;
  deliveryFee: number;
  total: number;
  paymentStatus: string;
  paymentMethod?: string | null;
  specialInstructions?: string | null;
  items: OrderItem[];
}

interface OrdersTabProps {
  tenantId: string;
}

type PeriodValue = 'all' | 'day' | 'week' | 'month' | 'year';

const PERIOD_OPTIONS: { value: PeriodValue; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'year', label: 'Last 12 months' },
];

function filterOrdersByPeriod(orders: Order[], period: PeriodValue): Order[] {
  if (period === 'all') return orders;
  const now = new Date();
  let start: Date;
  switch (period) {
    case 'day':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      return orders;
  }
  return orders.filter((o) => new Date(o.orderedAt) >= start && new Date(o.orderedAt) <= now);
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function OrdersTab({ tenantId }: OrdersTabProps) {
  const [period, setPeriod] = useState<PeriodValue>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useOrders(tenantId, { take: 500 });
  const allOrders = (data?.orders ?? []) as Order[];
  const orders = useMemo(() => filterOrdersByPeriod(allOrders, period), [allOrders, period]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  }, [orders, selectedIds.size]);

  const handleExport = useCallback(() => {
    const toExport = selectedIds.size > 0
      ? orders.filter((o) => selectedIds.has(o.id))
      : orders;

    if (toExport.length === 0) return;

    const filename =
      toExport.length === 1
        ? `order-${toExport[0].orderNumber}.json`
        : `orders-export-${new Date().toISOString().slice(0, 10)}.json`;

    downloadJson(toExport, filename);
  }, [orders, selectedIds]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    });

  const formatCurrency = (n: number) => `$${Number(n).toFixed(2)}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select
            label="Period"
            options={PERIOD_OPTIONS}
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value as PeriodValue);
              setSelectedIds(new Set());
            }}
            className="w-40"
          />
          <span className="text-sm text-gray-500 mt-6">
            {orders.length} order{orders.length !== 1 ? 's' : ''} found
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {selectedIds.size > 0 && `${selectedIds.size} selected`}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={orders.length === 0}
          >
            Export {selectedIds.size > 0 ? `(${selectedIds.size})` : 'All'} as JSON
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selectedIds.size === orders.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr
                    className="hover:bg-gray-50/80 cursor-pointer"
                    onClick={() => setExpandedId((prev) => (prev === order.id ? null : order.id))}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">#{order.orderNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.orderedAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.customerName || order.customerEmail || order.customerPhone || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.orderType}</td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.items?.reduce((acc, i) => acc + i.quantity, 0) ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400">
                        {expandedId === order.id ? '▼' : '▶'}
                      </span>
                    </td>
                  </tr>
                  {expandedId === order.id && (
                    <tr className="bg-gray-50/60">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="space-y-3 text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <p className="font-medium text-gray-500 text-xs uppercase">Items</p>
                              <ul className="mt-1 space-y-1">
                                {order.items?.map((item) => (
                                  <li key={item.id} className="text-gray-700">
                                    {item.quantity}x {item.menuItemName}
                                    {item.variantName && ` (${item.variantName})`} —{' '}
                                    {formatCurrency(Number(item.unitPrice) * item.quantity)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="font-medium text-gray-500 text-xs uppercase">Amounts</p>
                              <p className="mt-1 text-gray-700">Subtotal: {formatCurrency(order.subtotal)}</p>
                              <p className="text-gray-700">Tax: {formatCurrency(order.tax)}</p>
                              <p className="text-gray-700">Tip: {formatCurrency(order.tip)}</p>
                              <p className="text-gray-700">Delivery: {formatCurrency(order.deliveryFee)}</p>
                              <p className="font-medium text-gray-900">Total: {formatCurrency(order.total)}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-500 text-xs uppercase">Details</p>
                              {order.tableNumber && (
                                <p className="mt-1 text-gray-700">Table: {order.tableNumber}</p>
                              )}
                              {order.deliveryAddress && (
                                <p className="text-gray-700">Address: {order.deliveryAddress}</p>
                              )}
                              {order.paymentMethod && (
                                <p className="text-gray-700">Payment: {order.paymentMethod}</p>
                              )}
                              {order.specialInstructions && (
                                <p className="text-gray-700">Notes: {order.specialInstructions}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="py-12 text-center text-gray-500">No orders found for this period.</div>
        )}
      </div>
    </div>
  );
}
