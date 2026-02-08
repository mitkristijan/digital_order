// User Roles
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  KITCHEN = 'KITCHEN',
  WAITER = 'WAITER',
  CUSTOMER = 'CUSTOMER',
}

// Order Status
export enum OrderStatus {
  PENDING = 'PENDING',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Order Type
export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY',
}

// Payment Status
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// Payment Method
export enum PaymentMethod {
  CARD = 'CARD',
  CASH = 'CASH',
  UPI = 'UPI',
  WALLET = 'WALLET',
}

// Table Status
export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
}

// Tenant Status
export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
  CANCELLED = 'CANCELLED',
}

// Invoice Status
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  VOID = 'VOID',
  OVERDUE = 'OVERDUE',
}

// Stock Movement Type
export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export * from './user';
export * from './tenant';
export * from './menu';
export * from './order';
export * from './payment';
export * from './table';
export * from './inventory';
export * from './analytics';
