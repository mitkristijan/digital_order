'use client';

import React from 'react';
import { OrderStatusBadge } from './OrderStatusBadge';
import { useUpdateOrderStatus } from '@/hooks/useOrders';
import { Button } from '@digital-order/ui';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  tableNumber?: string;
  customerName?: string;
  total?: number;
  totalAmount?: number;
  items: Array<{
    quantity: number;
    menuItem?: { name: string };
    menuItemName?: string;
    unitPrice: number;
  }>;
  specialRequests?: string;
  specialInstructions?: string;
  orderedAt?: string;
  createdAt: string;
}

interface OrderCardProps {
  order: Order;
  tenantId: string;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, tenantId }) => {
  const updateStatus = useUpdateOrderStatus(tenantId);

  const getTimeSince = (date: string) => {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ orderId: order.id, status: newStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-card hover:shadow-card-hover border border-gray-100 transition-all duration-200 hover:border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900">#{order.orderNumber}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            {order.tableNumber && <span>Table {order.tableNumber}</span>}
            {order.tableNumber && order.customerName && <span>·</span>}
            {order.customerName && <span>{order.customerName}</span>}
          </div>
        </div>
        <div className="text-right">
          <OrderStatusBadge status={order.status} />
          <p className="text-xs text-gray-400 mt-1.5">{getTimeSince(order.orderedAt || order.createdAt)}</p>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        {order.items?.map((item: any, index: number) => (
          <div key={index} className="text-sm flex items-center gap-2">
            <span className="font-medium text-gray-900 min-w-[2ch]">{item.quantity}x</span>
            <span className="text-gray-600">{item.menuItem?.name || item.menuItemName || 'Item'}</span>
          </div>
        ))}
      </div>

      {(order.specialRequests || order.specialInstructions) && (
        <div className="bg-amber-50/80 border border-amber-200/60 rounded-lg p-2.5 mb-3">
          <p className="text-xs font-medium text-amber-800">Special Requests:</p>
          <p className="text-xs text-amber-700 mt-0.5">{order.specialInstructions || order.specialRequests}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="font-bold text-lg text-brand-600">
          ${Number(order.total ?? order.totalAmount ?? 0).toFixed(2)}
        </span>
        <div className="flex gap-2">
          {['PENDING', 'PENDING_PAYMENT'].includes(order.status) && (
            <Button
              size="sm"
              variant="default"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => handleStatusChange('CONFIRMED')}
              disabled={updateStatus.isPending}
            >
              Accept
            </Button>
          )}
          {order.status === 'CONFIRMED' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleStatusChange('PREPARING')}
              disabled={updateStatus.isPending}
            >
              Start Preparing
            </Button>
          )}
          {order.status === 'PREPARING' && (
            <Button
              size="sm"
              variant="success"
              onClick={() => handleStatusChange('READY')}
              disabled={updateStatus.isPending}
            >
              Mark Ready
            </Button>
          )}
          {order.status === 'READY' && (
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400"
              onClick={() => handleStatusChange('COMPLETED')}
              disabled={updateStatus.isPending}
            >
              Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
