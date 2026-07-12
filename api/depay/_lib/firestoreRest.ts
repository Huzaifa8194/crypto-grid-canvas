export interface ServerBuyRequest {
  id: string;
  companyName: string;
  email: string;
  selectedBlocks: number;
  selectedPixels: number;
  invoiceStatus?: "pending" | "invoice_sent" | "paid";
  paid?: boolean;
}

export const getBuyRequest = async (requestId: string): Promise<ServerBuyRequest | null> => {
  const { getAdminDb } = await import("./firebase");
  const snapshot = await (await getAdminDb()).collection("buyRequests").doc(requestId).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data();
  if (!data) {
    return null;
  }

  return {
    id: requestId,
    companyName: typeof data.companyName === "string" ? data.companyName : "",
    email: typeof data.email === "string" ? data.email : "",
    selectedBlocks: Number(data.selectedBlocks ?? 0),
    selectedPixels: Number(data.selectedPixels ?? 0),
    invoiceStatus: data.invoiceStatus as ServerBuyRequest["invoiceStatus"],
    paid: Boolean(data.paid),
  };
};

export interface PaymentUpdateInput {
  blockchain: string;
  transaction: string;
  sender: string;
  receiver: string;
  token: string;
  amount: string;
  sentToken?: string;
  sentAmount?: string;
  commitment?: string;
}

export const markRequestPaidFromCallback = async (
  requestId: string,
  payment: PaymentUpdateInput
): Promise<boolean> => {
  const existing = await getBuyRequest(requestId);
  if (!existing) {
    return false;
  }

  if (existing.paid || existing.invoiceStatus === "paid") {
    return true;
  }

  const { getAdminDb } = await import("./firebase");
  const docRef = (await getAdminDb()).collection("buyRequests").doc(requestId);

  await docRef.update({
    paid: true,
    invoiceStatus: "paid",
    payment: {
      blockchain: payment.blockchain,
      transaction: payment.transaction,
      sender: payment.sender,
      receiver: payment.receiver,
      token: payment.token,
      amount: payment.amount,
      sentToken: payment.sentToken ?? null,
      sentAmount: payment.sentAmount ?? null,
      commitment: payment.commitment ?? null,
      paidAt: Date.now(),
    },
  });

  return true;
};

export const appendPaymentEvent = async (
  requestId: string,
  event: {
    status: string;
    blockchain?: string;
    transaction?: string;
  }
): Promise<void> => {
  const existing = await getBuyRequest(requestId);
  if (!existing) {
    return;
  }

  const { FieldValue } = await import("firebase-admin/firestore");
  const { getAdminDb } = await import("./firebase");
  const docRef = (await getAdminDb()).collection("buyRequests").doc(requestId);

  await docRef.update({
    paymentEvents: FieldValue.arrayUnion({
      status: event.status,
      blockchain: event.blockchain ?? null,
      transaction: event.transaction ?? null,
      createdAt: Date.now(),
    }),
  });
};

export const assertPayableRequest = (request: ServerBuyRequest): string | null => {
  if (request.paid || request.invoiceStatus === "paid") {
    return "This order has already been paid.";
  }

  if (!request.selectedBlocks || request.selectedBlocks < 1) {
    return "Invalid order amount.";
  }

  return null;
};
