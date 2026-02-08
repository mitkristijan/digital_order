"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovementType = exports.InvoiceStatus = exports.TenantStatus = exports.TableStatus = exports.PaymentMethod = exports.PaymentStatus = exports.OrderType = exports.OrderStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["TENANT_ADMIN"] = "TENANT_ADMIN";
    UserRole["KITCHEN"] = "KITCHEN";
    UserRole["WAITER"] = "WAITER";
    UserRole["CUSTOMER"] = "CUSTOMER";
})(UserRole || (exports.UserRole = UserRole = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["PENDING_PAYMENT"] = "PENDING_PAYMENT";
    OrderStatus["CONFIRMED"] = "CONFIRMED";
    OrderStatus["PREPARING"] = "PREPARING";
    OrderStatus["READY"] = "READY";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["CANCELLED"] = "CANCELLED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var OrderType;
(function (OrderType) {
    OrderType["DINE_IN"] = "DINE_IN";
    OrderType["TAKEAWAY"] = "TAKEAWAY";
    OrderType["DELIVERY"] = "DELIVERY";
})(OrderType || (exports.OrderType = OrderType = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PROCESSING"] = "PROCESSING";
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CARD"] = "CARD";
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["UPI"] = "UPI";
    PaymentMethod["WALLET"] = "WALLET";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var TableStatus;
(function (TableStatus) {
    TableStatus["AVAILABLE"] = "AVAILABLE";
    TableStatus["OCCUPIED"] = "OCCUPIED";
    TableStatus["RESERVED"] = "RESERVED";
})(TableStatus || (exports.TableStatus = TableStatus = {}));
var TenantStatus;
(function (TenantStatus) {
    TenantStatus["ACTIVE"] = "ACTIVE";
    TenantStatus["SUSPENDED"] = "SUSPENDED";
    TenantStatus["TRIAL"] = "TRIAL";
    TenantStatus["CANCELLED"] = "CANCELLED";
})(TenantStatus || (exports.TenantStatus = TenantStatus = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "DRAFT";
    InvoiceStatus["SENT"] = "SENT";
    InvoiceStatus["PAID"] = "PAID";
    InvoiceStatus["VOID"] = "VOID";
    InvoiceStatus["OVERDUE"] = "OVERDUE";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var StockMovementType;
(function (StockMovementType) {
    StockMovementType["IN"] = "IN";
    StockMovementType["OUT"] = "OUT";
    StockMovementType["ADJUSTMENT"] = "ADJUSTMENT";
})(StockMovementType || (exports.StockMovementType = StockMovementType = {}));
__exportStar(require("./user"), exports);
__exportStar(require("./tenant"), exports);
__exportStar(require("./menu"), exports);
__exportStar(require("./order"), exports);
__exportStar(require("./payment"), exports);
__exportStar(require("./table"), exports);
__exportStar(require("./inventory"), exports);
__exportStar(require("./analytics"), exports);
//# sourceMappingURL=index.js.map