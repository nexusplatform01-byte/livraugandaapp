import { logger } from "./logger";

const BASE_URL =
  process.env["RELWORX_BASE_URL"] ?? "https://payments.relworx.com/api";

function getApiKey(): string {
  const key = process.env["RELWORX_API_KEY"];
  if (!key) {
    throw new Error(
      "RELWORX_API_KEY is not set. Configure it in the project secrets.",
    );
  }
  return key;
}

export function getAccountNo(): string {
  const acc = process.env["RELWORX_ACCOUNT_NO"];
  if (!acc) {
    throw new Error(
      "RELWORX_ACCOUNT_NO is not set. Configure it in the project secrets.",
    );
  }
  return acc;
}

export interface RelworxResult<T> {
  ok: boolean;
  status: number;
  data: T & { success?: boolean; message?: string };
}

async function request<T = Record<string, unknown>>(
  path: string,
  init: RequestInit = {},
): Promise<RelworxResult<T>> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.relworx.v2",
    "Content-Type": "application/json",
    Authorization: `Bearer ${getApiKey()}`,
    ...((init.headers as Record<string, string>) ?? {}),
  };

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (err) {
    logger.error({ err, url }, "Relworx network error");
    throw new Error("Failed to reach Relworx. Please try again.");
  }

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { success: false, message: text };
    }
  }

  if (!res.ok) {
    logger.warn({ status: res.status, url, body }, "Relworx non-2xx response");
  }

  return {
    ok: res.ok,
    status: res.status,
    data: (body ?? {}) as T & { success?: boolean; message?: string },
  };
}

export interface ChoiceListItem {
  id: string;
  name: string;
}

export const relworx = {
  choiceList: (code: string) =>
    request<{ choice_list: ChoiceListItem[] }>(
      `/products/choice-list?code=${encodeURIComponent(code)}`,
    ),

  validateProduct: (input: {
    reference: string;
    msisdn: string;
    amount: number;
    product_code: string;
    contact_phone: string;
    location_id?: string;
  }) =>
    request<{ customer_name: string; validation_reference: string }>(
      "/products/validate",
      {
        method: "POST",
        body: JSON.stringify({
          account_no: getAccountNo(),
          ...input,
        }),
      },
    ),

  purchaseProduct: (input: { validation_reference: string }) =>
    request<{ message: string; internal_reference: string }>(
      "/products/purchase",
      {
        method: "POST",
        body: JSON.stringify({
          account_no: getAccountNo(),
          ...input,
        }),
      },
    ),

  validateMobileNumber: (msisdn: string) =>
    request<{ message: string; customer_name: string }>(
      "/mobile-money/validate",
      {
        method: "POST",
        body: JSON.stringify({ msisdn }),
      },
    ),

  sendPayment: (input: {
    reference: string;
    msisdn: string;
    currency: string;
    amount: number;
    description?: string;
  }) =>
    request<{ message: string; internal_reference: string }>(
      "/mobile-money/send-payment",
      {
        method: "POST",
        body: JSON.stringify({
          account_no: getAccountNo(),
          ...input,
        }),
      },
    ),

  checkWalletBalance: (currency: string) =>
    request<{ balance: number }>(
      `/mobile-money/check-wallet-balance?account_no=${encodeURIComponent(
        getAccountNo(),
      )}&currency=${encodeURIComponent(currency)}`,
    ),

  checkRequestStatus: (internal_reference: string) =>
    request<{
      status: string;
      message: string;
      customer_reference?: string;
      internal_reference: string;
      msisdn?: string;
      amount?: number;
      currency?: string;
      provider?: string;
      charge?: number;
      provider_transaction_id?: string;
      completed_at?: string;
      request_status?: string;
    }>(
      `/mobile-money/check-request-status?account_no=${encodeURIComponent(
        getAccountNo(),
      )}&internal_reference=${encodeURIComponent(internal_reference)}`,
    ),

  transactions: () =>
    request<{
      transactions: Array<{
        customer_reference: string;
        provider: string;
        msisdn: string;
        transaction_type: string;
        currency: string;
        amount: number;
        status: string;
        created_at: string;
      }>;
    }>(`/payment-requests/transactions?account_no=${encodeURIComponent(getAccountNo())}`),
};

export function generateReference(): string {
  // 16-byte hex = 32 chars (within 8–36 char Relworx limit)
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
