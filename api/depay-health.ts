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

const hasServiceAccount = (): boolean =>
  Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      (process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY) ||
      (process.env.VITE_FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY)
  );

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const isAdmin = await isAdminRequest(req);
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
        ok: Boolean(getFirebaseProjectId()),
        detail: getFirebaseProjectId() ?? "Add FIREBASE_PROJECT_ID in Vercel (same as VITE_FIREBASE_PROJECT_ID)",
      },
      firebaseApiKey: {
        ok: Boolean(getFirebaseApiKey()),
        detail: getFirebaseApiKey()
          ? "Configured"
          : "Add FIREBASE_API_KEY in Vercel (same value as VITE_FIREBASE_API_KEY)",
      },
      firebaseAdmin: {
        ok: hasServiceAccount(),
        detail: hasServiceAccount()
          ? "Service account credentials present"
          : "Add FIREBASE_SERVICE_ACCOUNT_JSON in Vercel → Settings → Environment Variables (Production)",
      },
      siteUrl: {
        ok: Boolean(SITE_ORIGIN),
        detail: SITE_ORIGIN,
      },
    };

    const projectId = getFirebaseProjectId();
    const apiKey = getFirebaseApiKey();
    if (projectId && apiKey) {
      try {
        const response = await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/buyRequests/__health_check__?key=${encodeURIComponent(apiKey)}`
        );
        checks.firestoreRead = {
          ok: response.status === 404 || response.ok,
          detail:
            response.status === 404
              ? "Firestore REST read reachable"
              : `Unexpected Firestore status ${response.status}`,
        };
      } catch (error) {
        checks.firestoreRead = {
          ok: false,
          detail: error instanceof Error ? error.message : "Firestore read failed",
        };
      }
    } else {
      checks.firestoreRead = { ok: false, detail: "Missing Firebase project ID or API key" };
    }

    if (hasServiceAccount()) {
      try {
        const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        const serviceAccount = json
          ? (JSON.parse(json) as { project_id: string; client_email: string; private_key: string })
          : {
              project_id: process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID ?? "",
              client_email: process.env.FIREBASE_CLIENT_EMAIL ?? "",
              private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "",
            };

        const { cert, getApps, initializeApp } = await import("firebase-admin/app");
        const { getFirestore } = await import("firebase-admin/firestore");

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

        getFirestore(app);
        checks.firebaseAdminInit = { ok: true, detail: "Firebase Admin SDK initialized" };
      } catch (error) {
        checks.firebaseAdminInit = {
          ok: false,
          detail: error instanceof Error ? error.message : "Firebase Admin init failed",
        };
      }
    } else {
      checks.firebaseAdminInit = { ok: false, detail: "Skipped — no service account configured" };
    }

    const allOk = Object.values(checks).every((check) => check.ok);
    const failedChecks = Object.entries(checks)
      .filter(([, check]) => !check.ok)
      .map(([name]) => name);

    return res.status(200).json({
      ok: allOk,
      failedChecks,
      checks,
      callbackUrl: `${SITE_ORIGIN}/api/depay/callback`,
      eventsUrl: `${SITE_ORIGIN}/api/depay/events`,
    });
  } catch (error) {
    console.error("DePay health check crashed", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Health check failed",
    });
  }
}
