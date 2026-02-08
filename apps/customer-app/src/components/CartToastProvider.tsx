'use client';

import React, { useEffect } from 'react';
import { setOnItemAdded, setOnItemRemoved } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { Toast } from './Toast';

export const CartToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    setOnItemAdded((item) => {
      const msg = item.quantity > 1
        ? `${item.quantity}× ${item.name} added to cart`
        : `${item.name} added to cart`;
      showToast(msg, 'success');
    });
    setOnItemRemoved((item) => {
      const msg = item.quantity > 1
        ? `${item.quantity}× ${item.name} removed from cart`
        : `${item.name} removed from cart`;
      showToast(msg, 'error');
    });
    return () => {
      setOnItemAdded(null);
      setOnItemRemoved(null);
    };
  }, [showToast]);

  return (
    <>
      {children}
      <Toast />
    </>
  );
};
