const PENDING_PAYMENT_KEY = "mdcp_pending_payment_request_id";

export const savePendingPaymentRequestId = (requestId: string): void => {
  try {
    localStorage.setItem(PENDING_PAYMENT_KEY, requestId);
  } catch {
    // Ignore storage errors in private browsing.
  }
};

export const getPendingPaymentRequestId = (): string | null => {
  try {
    return localStorage.getItem(PENDING_PAYMENT_KEY);
  } catch {
    return null;
  }
};

export const clearPendingPaymentRequestId = (): void => {
  try {
    localStorage.removeItem(PENDING_PAYMENT_KEY);
  } catch {
    // Ignore storage errors.
  }
};
