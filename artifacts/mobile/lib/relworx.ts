import { apiFetch, jsonBody } from "./api";

export interface ChoiceListItem {
  id: string;
  name: string;
}

export interface ValidateProductInput {
  msisdn: string;
  amount: number;
  product_code: string;
  contact_phone: string;
  location_id?: string;
}

export interface ValidateProductResponse {
  success: boolean;
  customer_name: string;
  validation_reference: string;
}

export interface PurchaseProductResponse {
  success: boolean;
  message: string;
  internal_reference: string;
}

export interface SendPaymentInput {
  msisdn: string;
  currency: string;
  amount: number;
  description?: string;
}

export interface RequestStatus {
  success: boolean;
  status: string;
  message: string;
  internal_reference: string;
  msisdn?: string;
  amount?: number;
  currency?: string;
  provider?: string;
  charge?: number;
  request_status?: string;
  completed_at?: string;
}

export interface WalletBalance {
  success: boolean;
  balance: number;
}

export const relworxApi = {
  choiceList: (code: string) =>
    apiFetch<{ success: boolean; choice_list: ChoiceListItem[] }>(
      `/relworx/products/choice-list?code=${encodeURIComponent(code)}`,
    ),

  validateProduct: (input: ValidateProductInput) =>
    apiFetch<ValidateProductResponse>(
      `/relworx/products/validate`,
      jsonBody(input),
    ),

  purchaseProduct: (validation_reference: string) =>
    apiFetch<PurchaseProductResponse>(
      `/relworx/products/purchase`,
      jsonBody({ validation_reference }),
    ),

  validateMobileNumber: (msisdn: string) =>
    apiFetch<{ success: boolean; message: string; customer_name: string }>(
      `/relworx/mobile-money/validate`,
      jsonBody({ msisdn }),
    ),

  sendPayment: (input: SendPaymentInput) =>
    apiFetch<{ success: boolean; message: string; internal_reference: string }>(
      `/relworx/mobile-money/send-payment`,
      jsonBody(input),
    ),

  walletBalance: (currency = "UGX") =>
    apiFetch<WalletBalance>(
      `/relworx/mobile-money/wallet-balance?currency=${encodeURIComponent(
        currency,
      )}`,
    ),

  requestStatus: (internal_reference: string) =>
    apiFetch<RequestStatus>(
      `/relworx/request-status?internal_reference=${encodeURIComponent(
        internal_reference,
      )}`,
    ),
};

/**
 * Format a Ugandan phone number into Relworx's preferred international form:
 *   +256XXXXXXXXX
 * Accepts inputs like "0701454887", "256701454887", "+256701454887".
 */
export function formatMsisdn(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";
  if (digits.startsWith("256")) return `+${digits}`;
  if (digits.startsWith("0")) return `+256${digits.slice(1)}`;
  return `+${digits}`;
}

/**
 * Poll Relworx for a final transaction status. Resolves when the request
 * leaves the "pending" state or after the timeout (whichever comes first).
 */
export async function pollRequestStatus(
  internal_reference: string,
  opts: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<RequestStatus> {
  const interval = opts.intervalMs ?? 3000;
  const timeout = opts.timeoutMs ?? 60000;
  const start = Date.now();
  // small initial wait before the first poll
  await new Promise((r) => setTimeout(r, 1500));
  while (Date.now() - start < timeout) {
    try {
      const s = await relworxApi.requestStatus(internal_reference);
      const status = (s.status ?? s.request_status ?? "").toLowerCase();
      if (status && status !== "pending" && status !== "processing") {
        return s;
      }
    } catch {
      // ignore intermediate errors and keep polling
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  // timed out — caller should treat as still pending
  return {
    success: true,
    status: "pending",
    message: "Transaction is still processing. We'll update you shortly.",
    internal_reference,
  };
}
