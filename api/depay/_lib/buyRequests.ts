import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "./firebase";

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
  const snapshot = await getAdminDb().collection("buyRequests").doc(requestId).get();
  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<ServerBuyRequest, "id">),
  };
};

export const assertPayableRequest = (request: ServerBuyRequest): string | null => {
  if (request.paid || request.invoiceStatus === "paid") {
    return "This order has already been paid.";
  }

  if (request.invoiceStatus !== "invoice_sent") {
    return "Payment is not available until your application has been approved and an invoice is sent.";
  }

  if (!request.selectedBlocks || request.selectedBlocks < 1) {
    return "Invalid order amount.";
  }

  return null;
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
  const docRef = getAdminDb().collection("buyRequests").doc(requestId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return false;
  }

  const data = snapshot.data();
  if (data?.paid || data?.invoiceStatus === "paid") {
    return true;
  }

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
  const docRef = getAdminDb().collection("buyRequests").doc(requestId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    return;
  }

  await docRef.update({
    paymentEvents: FieldValue.arrayUnion({
      status: event.status,
      blockchain: event.blockchain ?? null,
      transaction: event.transaction ?? null,
      createdAt: Date.now(),
    }),
  });
};
