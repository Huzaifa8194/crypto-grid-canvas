import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyDepaySignature } from "./_lib/crypto";
import { markRequestPaidFromCallback } from "./_lib/firestoreRest";
import { depayApiConfig, readRawBody } from "./_lib/requestBody";

export { depayApiConfig as config };

const getSiteOrigin = (): string =>
  process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? "https://www.themilliondollarcryptopage.com";

interface CallbackBody {
  blockchain: string;
  transaction: string;
  sender: string;
  receiver: string;
  token: string;
  amount: string;
  payload?: { requestId?: string } | null;
  commitment?: string;
  sent_token?: string;
  sent_amount?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let rawBody = "";
  try {
    rawBody = await readRawBody(req);
  } catch (error) {
    console.error("Failed to read DePay callback request body", error);
    return res.status(400).json({ error: "Invalid request body" });
  }

  const signature = req.headers["x-signature"];

  try {
    const verified = await verifyDepaySignature(signature, rawBody);
    if (!verified) {
      return res.status(401).json({ error: "Invalid signature" });
    }
  } catch (error) {
    console.error("DePay callback signature verification failed", error);
    return res.status(401).json({ error: "Signature verification failed" });
  }

  let body: CallbackBody;
  try {
    body = JSON.parse(rawBody) as CallbackBody;
  } catch {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  const requestId = body.payload?.requestId;
  if (!requestId) {
    console.error("DePay callback missing requestId in payload", body.transaction);
    return res.status(400).json({ error: "Missing requestId in payment payload" });
  }

  try {
    const updated = await markRequestPaidFromCallback(requestId, {
      blockchain: body.blockchain,
      transaction: body.transaction,
      sender: body.sender,
      receiver: body.receiver,
      token: body.token,
      amount: body.amount,
      sentToken: body.sent_token,
      sentAmount: body.sent_amount,
      commitment: body.commitment,
    });

    if (!updated) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json({
      forward_to: `${getSiteOrigin()}/buy`,
    });
  } catch (error) {
    console.error("Failed to process DePay callback", error);
    const message = error instanceof Error ? error.message : "Failed to process payment callback";
    return res.status(500).json({ error: message });
  }
}
