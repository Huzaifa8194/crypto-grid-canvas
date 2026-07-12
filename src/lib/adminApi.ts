import { auth } from "@/lib/firebase";

const getAdminAuthHeader = async (): Promise<HeadersInit> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be signed in as admin. Go to /admin/login first.");
  }

  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const readJsonResponse = async <T>(response: Response): Promise<T & { error?: string }> => {
  const text = await response.text();
  if (!text) {
    throw new Error(`Empty response from server (${response.status})`);
  }

  try {
    return JSON.parse(text) as T & { error?: string };
  } catch {
    throw new Error(text.slice(0, 240) || `Server error (${response.status})`);
  }
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
  const data = await readJsonResponse<DepayHealthResponse>(response);
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
  const data = await readJsonResponse<TestCallbackResponse>(response);
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to simulate callback");
  }
  return data;
};
