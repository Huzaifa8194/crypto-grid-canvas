import type { Firestore } from "firebase-admin/firestore";

let db: Firestore | undefined;

const getServiceAccount = () => {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      return JSON.parse(json) as {
        project_id: string;
        client_email: string;
        private_key: string;
      };
    } catch {
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  };
};

export const getAdminDb = async (): Promise<Firestore> => {
  if (db) {
    return db;
  }

  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    throw new Error("Firebase Admin credentials are not configured");
  }

  const { cert, getApps, initializeApp } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");

  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId: serviceAccount.project_id,
            clientEmail: serviceAccount.client_email,
            privateKey: serviceAccount.private_key,
          }),
        });

  db = getFirestore(app);
  return db;
};
