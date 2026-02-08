export const DIETARY_TAGS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'halal',
  'kosher',
  'organic',
  'low-calorie',
  'keto',
];

export const COMMON_ALLERGENS = [
  'milk',
  'eggs',
  'fish',
  'shellfish',
  'tree nuts',
  'peanuts',
  'wheat',
  'soybeans',
  'sesame',
];

export const DEFAULT_TAX_RATES = {
  USD: 0.08, // 8%
  EUR: 0.20, // 20% VAT
  GBP: 0.20, // 20% VAT
  INR: 0.18, // 18% GST
};

export const SUBSCRIPTION_TIERS = {
  TRIAL: {
    name: 'Trial',
    price: 0,
    limits: {
      maxMenuItems: 50,
      maxTables: 10,
      maxStaff: 5,
      maxOrders: 100,
    },
  },
  STARTER: {
    name: 'Starter',
    price: 49,
    limits: {
      maxMenuItems: 200,
      maxTables: 25,
      maxStaff: 10,
      maxOrders: 1000,
    },
  },
  PROFESSIONAL: {
    name: 'Professional',
    price: 99,
    limits: {
      maxMenuItems: 500,
      maxTables: 50,
      maxStaff: 25,
      maxOrders: 5000,
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 199,
    limits: {
      maxMenuItems: -1, // unlimited
      maxTables: -1,
      maxStaff: -1,
      maxOrders: -1,
    },
  },
};

export const WEBHOOK_EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_COMPLETED: 'order.completed',
  ORDER_CANCELLED: 'order.cancelled',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  RESERVATION_CREATED: 'reservation.created',
  RESERVATION_CONFIRMED: 'reservation.confirmed',
  LOW_STOCK: 'inventory.low_stock',
};
