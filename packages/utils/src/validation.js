"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePassword = exports.sanitizePhone = exports.isValidUrl = exports.isValidSubdomain = exports.isValidPhone = exports.isValidEmail = void 0;
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const isValidPhone = (phone) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s|-/g, ''));
};
exports.isValidPhone = isValidPhone;
const isValidSubdomain = (subdomain) => {
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
    return subdomainRegex.test(subdomain);
};
exports.isValidSubdomain = isValidSubdomain;
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
};
exports.isValidUrl = isValidUrl;
const sanitizePhone = (phone) => {
    return phone.replace(/\s|-|\(|\)/g, '');
};
exports.sanitizePhone = sanitizePhone;
const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    return { valid: errors.length === 0, errors };
};
exports.validatePassword = validatePassword;
//# sourceMappingURL=validation.js.map