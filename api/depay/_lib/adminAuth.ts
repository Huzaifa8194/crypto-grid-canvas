import type { VercelRequest } from "@vercel/node";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getAdminDb } from "./firebase";

export const verifyAdminRequest = async (req: VercelRequest): Promise<boolean> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return false;
  }

  try {
    getAdminDb();
    const app = getApps()[0];
    if (!app) {
      return false;
    }
    await getAuth(app).verifyIdToken(token);
    return true;
  } catch {
    return false;
  }
};
