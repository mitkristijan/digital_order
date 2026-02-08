export declare const calculateSubtotal: (items: Array<{
    unitPrice: number;
    quantity: number;
}>) => number;
export declare const calculateTax: (subtotal: number, taxRate: number) => number;
export declare const calculateTotal: (subtotal: number, tax: number, tip?: number, deliveryFee?: number) => number;
export declare const calculateDiscount: (amount: number, discountType: "percentage" | "fixed", discountValue: number) => number;
export declare const roundToTwoDecimals: (value: number) => number;
