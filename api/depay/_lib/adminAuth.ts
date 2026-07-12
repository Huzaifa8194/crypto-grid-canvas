import type { VercelRequest } from "@vercel/node";
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
    await getAuth().verifyIdToken(token);
    return true;
  } catch {
    return false;
  }
};
