import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { calculateOrderTotalUsd, formatUsd } from "@/lib/pricing";

interface DePayPaymentButtonProps {
  requestId: string;
  selectedBlocks: number;
  disabled?: boolean;
  disabledReason?: string;
  onPaymentOpened?: () => void;
  onPaymentSucceeded?: () => void;
  onPaymentFailed?: (error: unknown) => void;
  className?: string;
}

const integrationId = import.meta.env.VITE_DEPAY_INTEGRATION_ID;

const DePayPaymentButton = ({
  requestId,
  selectedBlocks,
  disabled = false,
  disabledReason,
  onPaymentOpened,
  onPaymentSucceeded,
  onPaymentFailed,
  className,
}: DePayPaymentButtonProps) => {
  const [opening, setOpening] = useState(false);
  const totalUsd = calculateOrderTotalUsd(selectedBlocks);

  const openPayment = useCallback(async () => {
    if (disabled || !integrationId) {
      return;
    }

    setOpening(true);
    onPaymentOpened?.();
    document.body.classList.add("depay-payment-open");

    try {
      const DePayWidgets = (await import("@depay/widgets")).default;
      await DePayWidgets.Payment({
        integration: integrationId,
        amount: {
          currency: "USD",
          fix: totalUsd,
        },
        payload: { requestId },
        succeeded: () => {
          onPaymentSucceeded?.();
        },
        failed: (error: unknown) => {
          console.error("DePay payment failed", error);
          onPaymentFailed?.(error);
        },
        closed: () => {
          document.body.classList.remove("depay-payment-open");
          setOpening(false);
        },
      });
    } catch (error) {
      console.error("Failed to open DePay payment widget", error);
      document.body.classList.remove("depay-payment-open");
      onPaymentFailed?.(error);
      setOpening(false);
    }
  }, [disabled, onPaymentFailed, onPaymentOpened, onPaymentSucceeded, requestId, totalUsd]);

  if (!integrationId) {
    return (
      <p className="text-xs text-muted-foreground">
        Crypto payments are not configured yet. Please contact support.
      </p>
    );
  }

  return (
    <div className={className}>
      <Button
        type="button"
        className="w-full h-12 text-base font-semibold gap-2"
        disabled={disabled || opening}
        onClick={openPayment}
      >
        <Wallet className="h-4 w-4" />
        {opening ? "Opening Wallet..." : `Pay ${formatUsd(totalUsd)} with Crypto`}
      </Button>
      {disabled && disabledReason ? (
        <p className="mt-2 text-xs text-muted-foreground">{disabledReason}</p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Pay with USDT, USDC, ETH, and more. DePay converts your selected token to the invoice amount in real time.
        </p>
      )}
    </div>
  );
};

export default DePayPaymentButton;
