import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = "hello@themilliondollarcryptopage.com";
const toEmail = "huzaifa8195@gmail.com";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!resend) {
    return res.status(500).json({ error: "Resend API key is not configured" });
  }

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: "Test Email from Million Dollar Crypto Page",
      html: `
        <h1>Test Email</h1>
        <p>This is a test email sent from the Million Dollar Crypto Page.</p>
        <p>If you're receiving this, the email functionality is working correctly!</p>
      `,
    });

    return res.status(200).json({ 
      success: true, 
      message: "Test email sent successfully",
      emailId: result.data?.id 
    });
  } catch (error: any) {
    console.error("Failed to send test email", error);
    return res.status(500).json({ 
      error: error?.message || "Failed to send test email",
      details: error 
    });
  }
}

