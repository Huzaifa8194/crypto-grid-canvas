export interface DePayPaymentPayload {
  requestId: string;
}

export interface DePayCallbackBody {
  blockchain: string;
  transaction: string;
  sender: string;
  receiver: string;
  token: string;
  amount: string;
  payload: DePayPaymentPayload | null;
  after_block: string;
  commitment: string;
  confirmations: number;
  created_at: string;
  confirmed_at: string;
  sent_token?: string;
  sent_amount?: string;
}

export type DePayEventStatus = "attempt" | "processing" | "failed" | "succeeded";

export interface DePayEventBody extends DePayCallbackBody {
  status: DePayEventStatus;
}
