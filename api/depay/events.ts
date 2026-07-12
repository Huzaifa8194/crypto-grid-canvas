import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyDepaySignature } from "./_lib/crypto";
import { appendPaymentEvent } from "./_lib/buyRequests";

const getRawBody = (req: VercelRequest): string => {
  if (typeof req.body === "string") {
    return req.body;
  }
  return JSON.stringify(req.body ?? {});
};

interface EventBody {
  status: string;
  blockchain?: string;
  transaction?: string;
  payload?: { requestId?: string } | null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = getRawBody(req);
  const signature = req.headers["x-signature"];

  try {
    const verified = await verifyDepaySignature(signature, rawBody);
    if (!verified) {
      return res.status(401).json({ error: "Invalid signature" });
    }
  } catch (error) {
    console.error("DePay events signature verification failed", error);
    return res.status(401).json({ error: "Signature verification failed" });
  }

  let body: EventBody;
  try {
    body = JSON.parse(rawBody) as EventBody;
  } catch {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  const requestId = body.payload?.requestId;
  if (requestId) {
    try {
      await appendPaymentEvent(requestId, {
        status: body.status,
        blockchain: body.blockchain,
        transaction: body.transaction,
      });
    } catch (error) {
      console.error("Failed to append DePay payment event", error);
      return res.status(500).json({ error: "Failed to record payment event" });
    }
  }

  return res.status(200).json({ received: true });
}
