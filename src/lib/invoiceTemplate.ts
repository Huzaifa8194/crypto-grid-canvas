import type { BuyRequest } from "@/types/buy";
import { calculateOrderTotalUsd, formatUsd } from "@/lib/pricing";

export const INVOICE_PLACEHOLDERS = [
  "companyName",
  "email",
  "selectedBlocks",
  "selectedPixels",
  "total",
] as const;

export const renderInvoiceTemplate = (template: string, request: BuyRequest): string => {
  const tokenMap: Record<string, string> = {
    companyName: request.companyName ?? "",
    email: request.email ?? "",
    selectedBlocks: request.selectedBlocks.toString(),
    selectedPixels: request.selectedPixels.toString(),
    total: formatUsd(calculateOrderTotalUsd(request.selectedBlocks)),
  };

  return template.replace(/{{\s*(\w+)\s*}}/g, (_, token) => tokenMap[token] ?? "");
};
