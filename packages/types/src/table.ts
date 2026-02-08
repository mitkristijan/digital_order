import { TableStatus } from './index';

export interface Table {
  id: string;
  tenantId: string;
  tableNumber: string;
  capacity: number;
  location: string | null;
  qrCode: string;
  status: TableStatus;
  currentOrderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reservation {
  id: string;
  tenantId: string;
  customerId: string | null;
  tableId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  dateTime: Date;
  partySize: number;
  status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  specialRequests: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTableRequest {
  tableNumber: string;
  capacity: number;
  location?: string;
}

export interface CreateReservationRequest {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  dateTime: Date;
  partySize: number;
  specialRequests?: string;
  tableId?: string;
}
