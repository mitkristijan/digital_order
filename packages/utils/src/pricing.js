"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundToTwoDecimals = exports.calculateDiscount = exports.calculateTotal = exports.calculateTax = exports.calculateSubtotal = void 0;
const calculateSubtotal = (items) => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
};
exports.calculateSubtotal = calculateSubtotal;
const calculateTax = (subtotal, taxRate) => {
    return subtotal * taxRate;
};
exports.calculateTax = calculateTax;
const calculateTotal = (subtotal, tax, tip = 0, deliveryFee = 0) => {
    return subtotal + tax + tip + deliveryFee;
};
exports.calculateTotal = calculateTotal;
const calculateDiscount = (amount, discountType, discountValue) => {
    if (discountType === 'percentage') {
        return amount * (discountValue / 100);
    }
    return Math.min(discountValue, amount);
};
exports.calculateDiscount = calculateDiscount;
const roundToTwoDecimals = (value) => {
    return Math.round(value * 100) / 100;
};
exports.roundToTwoDecimals = roundToTwoDecimals;
//# sourceMappingURL=pricing.js.map