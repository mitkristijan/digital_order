export interface AnalyticsEvent {
    id: string;
    tenantId: string;
    eventType: string;
    entityId: string | null;
    metadata: Record<string, any>;
    timestamp: Date;
}
export interface DashboardMetrics {
    todayRevenue: number;
    todayOrders: number;
    activeOrders: number;
    averageOrderValue: number;
    popularItems: PopularItemMetric[];
    revenueByHour: RevenueByHour[];
    ordersByStatus: OrdersByStatus[];
    paymentMethodBreakdown: PaymentMethodBreakdown[];
}
export interface PopularItemMetric {
    menuItemId: string;
    menuItemName: string;
    orderCount: number;
    revenue: number;
}
export interface RevenueByHour {
    hour: number;
    revenue: number;
    orders: number;
}
export interface OrdersByStatus {
    status: string;
    count: number;
}
export interface PaymentMethodBreakdown {
    method: string;
    count: number;
    amount: number;
}
export interface SalesReport {
    startDate: Date;
    endDate: Date;
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    taxCollected: number;
    tipCollected: number;
    dailyBreakdown: DailySales[];
}
export interface DailySales {
    date: Date;
    revenue: number;
    orders: number;
    averageOrderValue: number;
}
