import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFromEmail = process.env.RESEND_FROM_EMAIL || "invoices@crypto-grid-canvas.com";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!resend) {
    return res.status(500).json({ error: "Resend API key is not configured" });
  }

  const { to, subject, html } = req.body as { to?: string; subject?: string; html?: string };

  if (!to || !subject || !html) {
    return res.status(400).json({ error: "Missing required fields (to, subject, html)" });
  }

  try {
    await resend.emails.send({
      from: defaultFromEmail,
      to,
      subject,
      html,
    });
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Failed to send invoice email", error);
    return res.status(500).json({ error: error?.message || "Failed to send invoice email" });
  }
}



