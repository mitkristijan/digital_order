"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSubdomain = exports.capitalizeFirstLetter = exports.slugify = exports.generateInvoiceNumber = exports.generateOrderNumber = exports.generateRandomString = void 0;
const generateRandomString = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
exports.generateRandomString = generateRandomString;
const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
};
exports.generateOrderNumber = generateOrderNumber;
const generateInvoiceNumber = (tenantId) => {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `INV-${year}-${random}`;
};
exports.generateInvoiceNumber = generateInvoiceNumber;
const slugify = (text) => {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
exports.slugify = slugify;
const capitalizeFirstLetter = (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};
exports.capitalizeFirstLetter = capitalizeFirstLetter;
const extractSubdomain = (hostname) => {
    const parts = hostname.split('.');
    if (parts.length > 2) {
        return parts[0];
    }
    return null;
};
exports.extractSubdomain = extractSubdomain;
//# sourceMappingURL=string.js.map