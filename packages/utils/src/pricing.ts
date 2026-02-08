export const calculateSubtotal = (items: Array<{ unitPrice: number; quantity: number }>): number => {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
};

export const calculateTax = (subtotal: number, taxRate: number): number => {
  return subtotal * taxRate;
};

export const calculateTotal = (
  subtotal: number,
  tax: number,
  tip: number = 0,
  deliveryFee: number = 0
): number => {
  return subtotal + tax + tip + deliveryFee;
};

export const calculateDiscount = (
  amount: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number
): number => {
  if (discountType === 'percentage') {
    return amount * (discountValue / 100);
  }
  return Math.min(discountValue, amount);
};

export const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};
