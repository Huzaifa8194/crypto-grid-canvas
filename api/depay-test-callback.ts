import type { VercelRequest, VercelResponse } from "@vercel/node";

const SITE_ORIGIN =
  process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? "https://www.themilliondollarcryptopage.com";

const getFirebaseProjectId = (): string | undefined =>
  process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID;

const getFirebaseApiKey = (): string | undefined =>
  process.env.FIREBASE_API_KEY ?? process.env.VITE_FIREBASE_API_KEY;

const getBearerToken = (req: VercelRequest): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token || null;
};

const verifyWithAdminSecret = (req: VercelRequest): boolean => {
  const configuredSecret = process.env.DEPAY_ADMIN_SECRET;
  if (!configuredSecret) return false;
  const headerSecret = req.headers["x-admin-secret"];
  const provided = Array.isArray(headerSecret) ? headerSecret[0] : headerSecret;
  return Boolean(provided && provided === configuredSecret);
};

const verifyWithFirebaseRest = async (idToken: string): Promise<boolean> => {
  const apiKey = getFirebaseApiKey();
  if (!apiKey) return false;

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!response.ok) return false;
  const payload = (await response.json()) as { users?: unknown[] };
  return Array.isArray(payload.users) && payload.users.length > 0;
};

const isAdminRequest = async (req: VercelRequest): Promise<boolean> => {
  if (verifyWithAdminSecret(req)) return true;
  const token = getBearerToken(req);
  if (!token) return false;
  try {
    return await verifyWithFirebaseRest(token);
  } catch {
    return false;
  }
};

const getServiceAccount = () => {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      return JSON.parse(json) as { project_id: string; client_email: string; private_key: string };
    } catch {
      return null;
    }
  }

  const projectId = getFirebaseProjectId();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) return null;

  return { project_id: projectId, client_email: clientEmail, private_key: privateKey };
};

const readBuyRequest = async (
  requestId: string
): Promise<{ id: string; selectedBlocks: number; paid?: boolean; invoiceStatus?: string } | null> => {
  const projectId = getFirebaseProjectId();
  const apiKey = getFirebaseApiKey();
  if (!projectId || !apiKey) {
    throw new Error("Firebase project ID or API key is not configured");
  }

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/buyRequests/${encodeURIComponent(requestId)}?key=${encodeURIComponent(apiKey)}`
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Firestore read failed (${response.status}): ${await response.text()}`);
  }

  const doc = (await response.json()) as {
    fields?: Record<string, { stringValue?: string; integerValue?: string; booleanValue?: boolean }>;
  };
  const fields = doc.fields ?? {};

  return {
    id: requestId,
    selectedBlocks: Number(fields.selectedBlocks?.integerValue ?? 0),
    invoiceStatus: fields.invoiceStatus?.stringValue,
    paid: fields.paid?.booleanValue === true,
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const isAdmin = await isAdminRequest(req);
    if (!isAdmin) {
      return res.status(401).json({
        error: "Admin authentication required. Sign in at /admin/login and try again.",
      });
    }

    const { requestId } = (req.body ?? {}) as { requestId?: string };
    if (!requestId) {
      return res.status(400).json({ error: "Missing requestId" });
    }

    const existing = await readBuyRequest(requestId);
    if (!existing) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (existing.paid || existing.invoiceStatus === "paid") {
      return res.status(409).json({ error: "Order is already paid. Choose a pending request to test." });
    }

    const serviceAccount = getServiceAccount();
    if (!serviceAccount) {
      return res.status(500).json({ error: "Firebase Admin credentials are not configured" });
    }

    const mockTransaction = `0xTEST${Date.now().toString(16)}`;
    const mockPayment = {
      blockchain: "polygon",
      transaction: mockTransaction,
      sender: "0x317D875cA3B9f8d14f960486C0d1D1913be74e90",
      receiver: process.env.DEPAY_RECEIVER_WALLET ?? "0x85d413831F15E30457fF255bf7d649356568c517",
      token: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      amount: String(existing.selectedBlocks * 100),
      sentToken: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      sentAmount: String(existing.selectedBlocks * 100),
      commitment: "confirmed",
      paidAt: Date.now(),
    };

    const { cert, getApps, initializeApp } = await import("firebase-admin/app");
    const { getFirestore, FieldValue } = await import("firebase-admin/firestore");

    let app = getApps()[0];
    if (!app) {
      app = initializeApp({
        credential: cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key,
        }),
      });
    }

    const docRef = getFirestore(app).collection("buyRequests").doc(requestId);

    const appendEvent = async (status: string) => {
      await docRef.update({
        paymentEvents: FieldValue.arrayUnion({
          status,
          blockchain: mockPayment.blockchain,
          transaction: mockTransaction,
          createdAt: Date.now(),
        }),
      });
    };

    await appendEvent("attempt");
    await appendEvent("processing");

    await docRef.update({
      paid: true,
      invoiceStatus: "paid",
      payment: {
        blockchain: mockPayment.blockchain,
        transaction: mockPayment.transaction,
        sender: mockPayment.sender,
        receiver: mockPayment.receiver,
        token: mockPayment.token,
        amount: mockPayment.amount,
        sentToken: mockPayment.sentToken,
        sentAmount: mockPayment.sentAmount,
        commitment: mockPayment.commitment,
        paidAt: mockPayment.paidAt,
      },
    });

    await appendEvent("succeeded");

    return res.status(200).json({
      success: true,
      message: "Test callback processed successfully",
      requestId,
      payment: mockPayment,
      forward_to: `${SITE_ORIGIN}/buy`,
    });
  } catch (error) {
    console.error("Failed to process test DePay callback", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to process test callback",
    });
  }
}
