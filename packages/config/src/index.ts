export const API_CONFIG = {
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

export const AUTH_CONFIG = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  otpExpiry: 300, // 5 minutes in seconds
  otpLength: 6,
  maxLoginAttempts: 5,
  lockoutDuration: 900, // 15 minutes in seconds
};

export const ORDER_CONFIG = {
  maxItemsPerOrder: 50,
  orderCancellationWindow: 300, // 5 minutes in seconds
  autoCompleteAfter: 7200, // 2 hours in seconds
};

export const PAYMENT_CONFIG = {
  supportedCurrencies: ['USD', 'EUR', 'GBP', 'INR'],
  defaultCurrency: 'USD',
  minOrderValue: 1.0,
  maxOrderValue: 10000.0,
};

export const FILE_UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedDocumentTypes: ['application/pdf'],
};

export const TENANT_CONFIG = {
  defaultLimits: {
    maxMenuItems: 500,
    maxTables: 100,
    maxStaff: 50,
    maxOrders: 10000,
  },
  trialDuration: 14, // days
};

export const WEBSOCKET_CONFIG = {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  pingInterval: 25000,
  pingTimeout: 5000,
};

export const CACHE_CONFIG = {
  menuTTL: 300, // 5 minutes
  tenantSettingsTTL: 600, // 10 minutes
  userSessionTTL: 900, // 15 minutes
};

export * from './constants';
