import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  appendPaymentEvent,
  getBuyRequest,
  markRequestPaidFromCallback,
} from "./depay/_lib/firestoreRest";

const SITE_ORIGIN =
  process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? "https://www.themilliondollarcryptopage.com";

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

    const existing = await getBuyRequest(requestId);
    if (!existing) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (existing.paid || existing.invoiceStatus === "paid") {
      return res.status(409).json({ error: "Order is already paid. Choose a pending request to test." });
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
    };

    await appendPaymentEvent(requestId, {
      status: "attempt",
      blockchain: mockPayment.blockchain,
      transaction: mockTransaction,
    });
    await appendPaymentEvent(requestId, {
      status: "processing",
      blockchain: mockPayment.blockchain,
      transaction: mockTransaction,
    });

    const updated = await markRequestPaidFromCallback(requestId, mockPayment);
    if (!updated) {
      return res.status(404).json({ error: "Order not found during update" });
    }

    await appendPaymentEvent(requestId, {
      status: "succeeded",
      blockchain: mockPayment.blockchain,
      transaction: mockTransaction,
    });

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
