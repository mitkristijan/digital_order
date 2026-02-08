'use client';

import React from 'react';
import { Switch } from '@digital-order/ui';
import { useUpdateItemAvailability } from '@/hooks/useMenu';

interface AvailabilityToggleProps {
  itemId: string;
  tenantId: string;
  availability: boolean;
}

export const AvailabilityToggle: React.FC<AvailabilityToggleProps> = ({
  itemId,
  tenantId,
  availability,
}) => {
  const updateAvailability = useUpdateItemAvailability(tenantId);

  const handleToggle = async (checked: boolean) => {
    try {
      await updateAvailability.mutateAsync({ itemId, availability: checked });
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Switch
        checked={availability}
        onCheckedChange={handleToggle}
        disabled={updateAvailability.isPending}
        className="data-[state=checked]:bg-green-500"
      />
      <span className={`text-sm font-medium ${
        availability 
          ? 'text-green-600' 
          : 'text-red-600'
      }`}>
        {availability ? 'Available' : 'Sold Out'}
      </span>
    </div>
  );
};
