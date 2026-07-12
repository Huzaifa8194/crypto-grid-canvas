import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAdminRequest } from "./_lib/adminAuth";
import { appendPaymentEvent, getBuyRequest, markRequestPaidFromCallback } from "./_lib/firestoreRest";

const getSiteOrigin = (): string =>
  process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? "https://www.themilliondollarcryptopage.com";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const isAdmin = await verifyAdminRequest(req);
    if (!isAdmin) {
      return res.status(401).json({
        error: "Admin authentication required. Sign in at /admin/login and try again.",
      });
    }

    const { requestId } = req.body as { requestId?: string };
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
      forward_to: `${getSiteOrigin()}/buy`,
    });
  } catch (error) {
    console.error("Failed to process test DePay callback", error);
    const message = error instanceof Error ? error.message : "Failed to process test callback";
    return res.status(500).json({ error: message });
  }
}
