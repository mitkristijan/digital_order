import { OrderStatus, OrderType, PaymentStatus, PaymentMethod } from './index';
export interface Order {
    id: string;
    tenantId: string;
    customerId: string | null;
    orderNumber: string;
    tableNumber: string | null;
    status: OrderStatus;
    orderType: OrderType;
    subtotal: number;
    tax: number;
    tip: number;
    deliveryFee: number;
    total: number;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod | null;
    specialInstructions: string | null;
    customerName: string | null;
    customerPhone: string | null;
    customerEmail: string | null;
    deliveryAddress: string | null;
    orderedAt: Date;
    confirmedAt: Date | null;
    preparingAt: Date | null;
    readyAt: Date | null;
    deliveredAt: Date | null;
    cancelledAt: Date | null;
    cancellationReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    items: OrderItem[];
}
export interface OrderItem {
    id: string;
    orderId: string;
    menuItemId: string;
    variantId: string | null;
    quantity: number;
    unitPrice: number;
    modifiers: OrderItemModifier[];
    specialInstructions: string | null;
    status: OrderStatus;
    menuItemName: string;
    variantName: string | null;
}
export interface OrderItemModifier {
    modifierId: string;
    name: string;
    price: number;
}
export interface CreateOrderRequest {
    orderType: OrderType;
    tableNumber?: string;
    items: CreateOrderItemRequest[];
    specialInstructions?: string;
    tip?: number;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    deliveryAddress?: string;
}
export interface CreateOrderItemRequest {
    menuItemId: string;
    variantId?: string;
    quantity: number;
    modifiers?: string[];
    specialInstructions?: string;
}
export interface UpdateOrderStatusRequest {
    status: OrderStatus;
    reason?: string;
}
