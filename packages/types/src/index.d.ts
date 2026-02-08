export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    TENANT_ADMIN = "TENANT_ADMIN",
    KITCHEN = "KITCHEN",
    WAITER = "WAITER",
    CUSTOMER = "CUSTOMER"
}
export declare enum OrderStatus {
    PENDING = "PENDING",
    PENDING_PAYMENT = "PENDING_PAYMENT",
    CONFIRMED = "CONFIRMED",
    PREPARING = "PREPARING",
    READY = "READY",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED"
}
export declare enum OrderType {
    DINE_IN = "DINE_IN",
    TAKEAWAY = "TAKEAWAY",
    DELIVERY = "DELIVERY"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}
export declare enum PaymentMethod {
    CARD = "CARD",
    CASH = "CASH",
    UPI = "UPI",
    WALLET = "WALLET"
}
export declare enum TableStatus {
    AVAILABLE = "AVAILABLE",
    OCCUPIED = "OCCUPIED",
    RESERVED = "RESERVED"
}
export declare enum TenantStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    TRIAL = "TRIAL",
    CANCELLED = "CANCELLED"
}
export declare enum InvoiceStatus {
    DRAFT = "DRAFT",
    SENT = "SENT",
    PAID = "PAID",
    VOID = "VOID",
    OVERDUE = "OVERDUE"
}
export declare enum StockMovementType {
    IN = "IN",
    OUT = "OUT",
    ADJUSTMENT = "ADJUSTMENT"
}
export * from './user';
export * from './tenant';
export * from './menu';
export * from './order';
export * from './payment';
export * from './table';
export * from './inventory';
export * from './analytics';
