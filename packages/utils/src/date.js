"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isToday = exports.addMinutes = exports.getTimeAgo = exports.formatDate = void 0;
const formatDate = (date, format = 'short') => {
    const d = typeof date === 'string' ? new Date(date) : date;
    switch (format) {
        case 'short':
            return d.toLocaleDateString();
        case 'long':
            return d.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        case 'time':
            return d.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
            });
        case 'datetime':
            return `${d.toLocaleDateString()} ${d.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
            })}`;
        default:
            return d.toISOString();
    }
};
exports.formatDate = formatDate;
const getTimeAgo = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'week', seconds: 604800 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 },
    ];
    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
        }
    }
    return 'just now';
};
exports.getTimeAgo = getTimeAgo;
const addMinutes = (date, minutes) => {
    return new Date(date.getTime() + minutes * 60000);
};
exports.addMinutes = addMinutes;
const isToday = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return d.toDateString() === today.toDateString();
};
exports.isToday = isToday;
//# sourceMappingURL=date.js.map