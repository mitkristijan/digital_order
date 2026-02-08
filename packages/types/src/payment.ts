import { PaymentStatus, PaymentMethod, InvoiceStatus } from './index';

export interface Payment {
  id: string;
  orderId: string;
  tenantId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  providerTransactionId: string | null;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  orderId: string;
  tenantId: string;
  invoiceNumber: string;
  date: Date;
  dueDate: Date | null;
  subtotal: number;
  taxBreakdown: TaxBreakdown[];
  total: number;
  status: InvoiceStatus;
  pdfUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxBreakdown {
  name: string;
  rate: number;
  amount: number;
}

export interface CreatePaymentRequest {
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  metadata?: Record<string, any>;
}

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface PaymentWebhookEvent {
  type: string;
  data: any;
}
