import { TenantStatus } from './index';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  domain: string | null;
  ownerId: string;
  subscriptionTier: string;
  settings: TenantSettings;
  billingInfo: BillingInfo | null;
  stripeCustomerId: string | null;
  status: TenantStatus;
  trialEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  theme: {
    primaryColor: string;
    logo: string | null;
    favicon: string | null;
  };
  features: {
    tableOrdering: boolean;
    deliveryOrdering: boolean;
    takeawayOrdering: boolean;
    reservations: boolean;
    inventory: boolean;
    loyaltyProgram: boolean;
  };
  limits: {
    maxMenuItems: number;
    maxTables: number;
    maxStaff: number;
    maxOrders: number;
  };
  business: {
    address: string;
    phone: string;
    email: string;
    taxId: string | null;
    currency: string;
    timezone: string;
  };
}

export interface BillingInfo {
  companyName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  taxId: string | null;
}

export interface CreateTenantRequest {
  name: string;
  subdomain: string;
  ownerEmail: string;
  ownerPhone: string;
  subscriptionTier: string;
}
