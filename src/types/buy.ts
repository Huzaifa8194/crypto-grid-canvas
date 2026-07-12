import { type SelectionRect } from "@/types/pixels";

export type InvoiceStatus = "pending" | "invoice_sent" | "paid";

export interface PaymentRecord {
  blockchain: string;
  transaction: string;
  sender: string;
  receiver: string;
  token: string;
  amount: string;
  sentToken?: string;
  sentAmount?: string;
  commitment?: string;
  paidAt: number;
}

export interface PaymentEventRecord {
  status: string;
  blockchain?: string;
  transaction?: string;
  createdAt: number;
}

export interface BuyRequestPayload {
  companyName: string;
  email: string;
  logoUrl?: string;
  targetUrl?: string;
  logoFileUrl?: string;
  logoStoragePath?: string;
  telegram?: string;
  promoCode?: string | null;
  selectedPixels: number;
  selectedBlocks: number;
  selectionRect?: SelectionRect | null;
  createdAt: number;
  paid?: boolean;
  invoiceStatus?: InvoiceStatus;
  payment?: PaymentRecord;
  paymentEvents?: PaymentEventRecord[];
}

export interface BuyRequest extends BuyRequestPayload {
  id: string;
}

