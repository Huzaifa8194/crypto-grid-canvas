import { auth } from "@/lib/firebase";

const getAdminAuthHeader = async (): Promise<HeadersInit> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be signed in as admin.");
  }

  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export interface DepayHealthResponse {
  ok: boolean;
  checks: Record<string, { ok: boolean; detail?: string }>;
  callbackUrl: string;
  eventsUrl: string;
}

export const fetchDepayHealth = async (): Promise<DepayHealthResponse> => {
  const headers = await getAdminAuthHeader();
  const response = await fetch("/api/depay/health", { headers });
  const data = (await response.json()) as DepayHealthResponse & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to check DePay health");
  }
  return data;
};

export interface TestCallbackResponse {
  success: boolean;
  message: string;
  requestId: string;
  payment: {
    blockchain: string;
    transaction: string;
    amount: string;
  };
}

export const simulateDepayCallback = async (requestId: string): Promise<TestCallbackResponse> => {
  const headers = await getAdminAuthHeader();
  const response = await fetch("/api/depay/test-callback", {
    method: "POST",
    headers,
    body: JSON.stringify({ requestId }),
  });
  const data = (await response.json()) as TestCallbackResponse & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to simulate callback");
  }
  return data;
};
