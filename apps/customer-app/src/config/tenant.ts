/**
 * Single tenant for the customer app. Prevents accidental switching to another tenant.
 * Set via NEXT_PUBLIC_TENANT_ID env var (e.g. in .env.local) or defaults to "testera".
 */
export const CUSTOMER_TENANT =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_TENANT_ID) || 'testera';
