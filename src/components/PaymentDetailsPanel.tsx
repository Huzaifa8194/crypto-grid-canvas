import { ExternalLink } from "lucide-react";
import { type PaymentEventRecord, type PaymentRecord } from "@/types/buy";
import {
  formatPaymentTimestamp,
  getEventStatusColor,
  getPaymentStatusLabel,
  getTransactionExplorerUrl,
  isTestPayment,
  sortPaymentEvents,
} from "@/lib/paymentDisplay";

interface PaymentDetailsPanelProps {
  payment: PaymentRecord;
  events?: PaymentEventRecord[];
  compact?: boolean;
}

const PaymentDetailsPanel = ({ payment, events, compact = false }: PaymentDetailsPanelProps) => {
  const explorerUrl = getTransactionExplorerUrl(payment.blockchain, payment.transaction);
  const sortedEvents = sortPaymentEvents(events);

  return (
    <div
      className={`rounded-lg border p-3 text-xs ${
        isTestPayment(payment)
          ? "border-amber-500/40 bg-amber-500/10"
          : "border-emerald-500/30 bg-emerald-500/5"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold uppercase tracking-[0.15em] text-foreground">
          {isTestPayment(payment) ? "Test Payment" : "Crypto Payment"}
        </p>
        <span className="text-[0.65rem] text-muted-foreground">{formatPaymentTimestamp(payment.paidAt)}</span>
      </div>

      <div className={`grid gap-2 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">Blockchain</p>
          <p className="font-medium capitalize text-foreground">{payment.blockchain}</p>
        </div>
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">Amount received</p>
          <p className="font-medium text-foreground">{payment.amount}</p>
        </div>
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">Status</p>
          <p className="font-medium text-foreground">{getPaymentStatusLabel(payment)}</p>
        </div>
        {payment.sentAmount ? (
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">Sent by payer</p>
            <p className="font-medium text-foreground">{payment.sentAmount}</p>
          </div>
        ) : null}
        <div className={compact ? "sm:col-span-2" : "sm:col-span-2 lg:col-span-3"}>
          <p className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">Transaction</p>
          <p className="break-all font-mono text-[0.7rem] text-foreground">{payment.transaction}</p>
          {explorerUrl ? (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-primary underline hover:text-primary/80"
            >
              View on explorer
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
        {!compact ? (
          <>
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">Sender</p>
              <p className="break-all font-mono text-[0.7rem] text-foreground">{payment.sender}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">Receiver</p>
              <p className="break-all font-mono text-[0.7rem] text-foreground">{payment.receiver}</p>
            </div>
          </>
        ) : null}
      </div>

      {sortedEvents.length > 0 ? (
        <div className="mt-3 border-t border-border/40 pt-3">
          <p className="mb-2 text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">Payment events</p>
          <div className="space-y-1.5">
            {sortedEvents.map((event, index) => (
              <div key={`${event.status}-${event.createdAt}-${index}`} className="flex flex-wrap items-center gap-2">
                <span className={`font-semibold uppercase ${getEventStatusColor(event.status)}`}>{event.status}</span>
                <span className="text-muted-foreground">{formatPaymentTimestamp(event.createdAt)}</span>
                {event.blockchain ? <span className="capitalize text-muted-foreground">{event.blockchain}</span> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PaymentDetailsPanel;
