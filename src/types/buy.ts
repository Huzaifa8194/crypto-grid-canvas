import { type SelectionRect } from "@/types/pixels";

export type InvoiceStatus = "pending" | "invoice_sent" | "paid";

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
}

export interface BuyRequest extends BuyRequestPayload {
  id: string;
}

