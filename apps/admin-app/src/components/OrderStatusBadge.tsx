'use client';

import React from 'react';
import { Badge } from '@digital-order/ui';

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  PENDING: { label: 'New', variant: 'warning' },
  PENDING_PAYMENT: { label: 'New', variant: 'warning' },
  CONFIRMED: { label: 'Confirmed', variant: 'info' },
  PREPARING: { label: 'Preparing', variant: 'info' },
  READY: { label: 'Ready', variant: 'success' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  COMPLETED: { label: 'Completed', variant: 'default' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' },
};

interface OrderStatusBadgeProps {
  status: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
};
