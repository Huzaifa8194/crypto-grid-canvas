import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyDepaySignature, signDepayConfiguration } from "./_lib/crypto";
import { buildDepayConfiguration } from "./_lib/config";
import { assertPayableRequest, getBuyRequest } from "./_lib/buyRequests";

const getRawBody = (req: VercelRequest): string => {
  if (typeof req.body === "string") {
    return req.body;
  }
  return JSON.stringify(req.body ?? {});
};

const getSiteOrigin = (): string =>
  process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? "https://themilliondollarcryptopage.com";

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
    console.error("DePay configuration signature verification failed", error);
    return res.status(401).json({ error: "Signature verification failed" });
  }

  let payload: { requestId?: string };
  try {
    payload = JSON.parse(rawBody) as { requestId?: string };
  } catch {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  const requestId = payload.requestId;
  if (!requestId) {
    return res.status(400).json({ error: "Missing requestId in payload" });
  }

  try {
    const request = await getBuyRequest(requestId);
    if (!request) {
      return res.status(404).json({ error: "Order not found" });
    }

    const payableError = assertPayableRequest(request);
    if (payableError) {
      return res.status(403).json({ error: payableError });
    }

    const configuration = buildDepayConfiguration(
      request.selectedBlocks,
      requestId,
      getSiteOrigin()
    );
    const signedConfiguration = signDepayConfiguration(configuration);

    res.setHeader("x-signature", signedConfiguration);
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(JSON.stringify(configuration));
  } catch (error) {
    console.error("Failed to build DePay configuration", error);
    return res.status(500).json({ error: "Failed to build payment configuration" });
  }
}
