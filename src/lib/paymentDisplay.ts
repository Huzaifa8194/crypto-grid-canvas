import { type PaymentEventRecord, type PaymentRecord } from "@/types/buy";

const EXPLORER_BASE_URLS: Record<string, string> = {
  ethereum: "https://etherscan.io/tx/",
  polygon: "https://polygonscan.com/tx/",
  base: "https://basescan.org/tx/",
  bsc: "https://bscscan.com/tx/",
  gnosis: "https://gnosisscan.io/tx/",
  optimism: "https://optimistic.etherscan.io/tx/",
  arbitrum: "https://arbiscan.io/tx/",
  avalanche: "https://snowtrace.io/tx/",
  solana: "https://solscan.io/tx/",
};

export const getTransactionExplorerUrl = (blockchain: string, transaction: string): string | null => {
  const base = EXPLORER_BASE_URLS[blockchain.toLowerCase()];
  if (!base || !transaction) {
    return null;
  }
  return `${base}${transaction}`;
};

export const formatPaymentTimestamp = (timestamp: number): string =>
  new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const isTestPayment = (payment: PaymentRecord): boolean =>
  payment.transaction.startsWith("0xTEST") || payment.transaction.startsWith("TEST_");

export const getPaymentStatusLabel = (payment: PaymentRecord): string => {
  if (isTestPayment(payment)) {
    return "Test payment (simulated callback)";
  }
  return payment.commitment ? `Confirmed (${payment.commitment})` : "Confirmed";
};

export const sortPaymentEvents = (events: PaymentEventRecord[] | undefined): PaymentEventRecord[] =>
  [...(events ?? [])].sort((a, b) => a.createdAt - b.createdAt);

export const getEventStatusColor = (status: string): string => {
  switch (status) {
    case "succeeded":
      return "text-emerald-300";
    case "failed":
      return "text-red-300";
    case "processing":
      return "text-yellow-300";
    case "attempt":
      return "text-blue-300";
    default:
      return "text-muted-foreground";
  }
};
