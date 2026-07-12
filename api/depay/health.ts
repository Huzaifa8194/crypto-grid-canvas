import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAdminRequest } from "./_lib/adminAuth";
import { getBuyRequest } from "./_lib/firestoreRest";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const isAdmin = await verifyAdminRequest(req);
    if (!isAdmin) {
      return res.status(401).json({
        error: "Admin authentication required. Sign in at /admin/login and try again.",
      });
    }

    const checks: Record<string, { ok: boolean; detail?: string }> = {
      depayPublicKey: {
        ok: Boolean(process.env.DEPAY_PUBLIC_KEY),
        detail: process.env.DEPAY_PUBLIC_KEY ? "Configured" : "Missing DEPAY_PUBLIC_KEY",
      },
      firebaseProject: {
        ok: Boolean(process.env.VITE_FIREBASE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID),
        detail: process.env.VITE_FIREBASE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID ?? "Missing project ID",
      },
      firebaseApiKey: {
        ok: Boolean(process.env.VITE_FIREBASE_API_KEY ?? process.env.FIREBASE_API_KEY),
        detail: process.env.VITE_FIREBASE_API_KEY ? "Configured" : "Missing Firebase API key",
      },
      firebaseAdmin: {
        ok: Boolean(
          process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
            (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY)
        ),
        detail: "Service account credentials for callback writes",
      },
      siteUrl: {
        ok: Boolean(process.env.SITE_URL ?? process.env.VITE_SITE_URL),
        detail: process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? "Missing SITE_URL",
      },
    };

    try {
      await getBuyRequest("__health_check_nonexistent__");
      checks.firestoreRead = { ok: true, detail: "Firestore REST read reachable" };
    } catch (error) {
      checks.firestoreRead = {
        ok: false,
        detail: error instanceof Error ? error.message : "Firestore read failed",
      };
    }

    try {
      const { getAdminDb } = await import("./_lib/firebase");
      getAdminDb();
      checks.firebaseAdminInit = { ok: true, detail: "Firebase Admin SDK initialized" };
    } catch (error) {
      checks.firebaseAdminInit = {
        ok: false,
        detail: error instanceof Error ? error.message : "Firebase Admin init failed",
      };
    }

    const allOk = Object.values(checks).every((check) => check.ok);
    const siteOrigin =
      process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? "https://www.themilliondollarcryptopage.com";

    return res.status(allOk ? 200 : 503).json({
      ok: allOk,
      checks,
      callbackUrl: `${siteOrigin}/api/depay/callback`,
      eventsUrl: `${siteOrigin}/api/depay/events`,
    });
  } catch (error) {
    console.error("DePay health check crashed", error);
    const message = error instanceof Error ? error.message : "Health check failed";
    return res.status(500).json({ error: message });
  }
}
