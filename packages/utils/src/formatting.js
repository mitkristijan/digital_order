"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.truncateString = exports.formatPercentage = exports.formatPhone = exports.formatCurrency = void 0;
const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
const formatPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{1,3})(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return `+${match[1]} ${match[2]}-${match[3]}-${match[4]}`;
    }
    return phone;
};
exports.formatPhone = formatPhone;
const formatPercentage = (value, decimals = 0) => {
    return `${(value * 100).toFixed(decimals)}%`;
};
exports.formatPercentage = formatPercentage;
const truncateString = (str, maxLength) => {
    if (str.length <= maxLength)
        return str;
    return str.substring(0, maxLength - 3) + '...';
};
exports.truncateString = truncateString;
//# sourceMappingURL=formatting.js.map