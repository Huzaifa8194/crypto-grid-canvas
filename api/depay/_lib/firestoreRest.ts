export interface ServerBuyRequest {
  id: string;
  companyName: string;
  email: string;
  selectedBlocks: number;
  selectedPixels: number;
  invoiceStatus?: "pending" | "invoice_sent" | "paid";
  paid?: boolean;
}

type FirestoreValue =
  | { stringValue?: string }
  | { integerValue?: string }
  | { booleanValue?: boolean }
  | { nullValue?: null };

const getFirebaseConfig = () => {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID;
  const apiKey = process.env.VITE_FIREBASE_API_KEY ?? process.env.FIREBASE_API_KEY;

  if (!projectId || !apiKey) {
    throw new Error("Firebase project ID or API key is not configured");
  }

  return { projectId, apiKey };
};

const readField = (fields: Record<string, FirestoreValue> | undefined, key: string): string | undefined => {
  const value = fields?.[key];
  if (!value) return undefined;
  if ("stringValue" in value && value.stringValue !== undefined) return value.stringValue;
  if ("integerValue" in value && value.integerValue !== undefined) return value.integerValue;
  if ("booleanValue" in value && value.booleanValue !== undefined) return value.booleanValue ? "true" : "false";
  return undefined;
};

const parseBuyRequest = (requestId: string, doc: { fields?: Record<string, FirestoreValue> }): ServerBuyRequest => {
  const fields = doc.fields ?? {};

  return {
    id: requestId,
    companyName: readField(fields, "companyName") ?? "",
    email: readField(fields, "email") ?? "",
    selectedBlocks: Number(readField(fields, "selectedBlocks") ?? 0),
    selectedPixels: Number(readField(fields, "selectedPixels") ?? 0),
    invoiceStatus: readField(fields, "invoiceStatus") as ServerBuyRequest["invoiceStatus"],
    paid: readField(fields, "paid") === "true",
  };
};

export const getBuyRequest = async (requestId: string): Promise<ServerBuyRequest | null> => {
  const { projectId, apiKey } = getFirebaseConfig();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/buyRequests/${encodeURIComponent(requestId)}?key=${apiKey}`;

  const response = await fetch(url);
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore read failed (${response.status}): ${errorText}`);
  }

  const doc = (await response.json()) as { fields?: Record<string, FirestoreValue> };
  return parseBuyRequest(requestId, doc);
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
