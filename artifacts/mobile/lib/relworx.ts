import { apiFetch } from "./api";
import { makeReference } from "./userSession";

export type Currency = "UGX" | "KES" | "TZS";

export interface ChoiceListItem {
  id: string;
  name: string;
}

export interface PriceListItem {
  code: string;
  name: string;
  price: number;
}

export interface ProductSummary {
  name: string;
  code: string;
  category: string;
  has_price_list: boolean;
  has_choice_list: boolean;
  billable: boolean;
}

export interface ValidatePhoneResponse {
  success: boolean;
  message?: string;
  customer_name?: string;
}

export interface WalletBalanceResponse {
  success: boolean;
  balance: number;
  currency?: string;
}

export interface DepositResponse {
  success: boolean;
  message?: string;
  internal_reference: string;
  customer_reference?: string;
}

export interface WithdrawResponse {
  success: boolean;
  message?: string;
  internal_reference: string;
  customer_reference?: string;
}

export interface ValidateProductResponse {
  success: boolean;
  validation_reference: string;
  charge?: number;
  customer_name?: string;
  balance?: string | number;
}

export interface PurchaseResponse {
  success: boolean;
  internal_reference: string;
  customer_reference?: string;
  message?: string;
}

export interface RequestStatusResponse {
  success: boolean;
  status?: "pending" | "success" | "failed" | string;
  message?: string;
  customer_reference?: string;
  internal_reference?: string;
  amount?: number;
  msisdn?: string;
  charge?: number;
}

export interface TransactionRecord {
  customer_reference: string;
  provider?: string;
  msisdn?: string;
  transaction_type?: "collection" | "payout" | string;
  transaction_method?: string;
  currency?: string;
  amount: number;
  status: "success" | "pending" | "failed" | string;
  created_at: string;
}

export interface TransactionsResponse {
  success: boolean;
  current_page: number;
  per_page: number;
  total_pages: number;
  total_count: number;
  next_page: number | null;
  prev_page: number | null;
  transactions: TransactionRecord[];
}

/** Format a UG mobile number to E.164 (+256...). */
export function formatMsisdn(input: string, defaultCountry = "256"): string {
  const digits = (input || "").replace(/\D/g, "");
  if (!digits) return "";
  if (input.trim().startsWith("+")) return `+${digits}`;
  if (digits.startsWith("256")) return `+${digits}`;
  if (digits.startsWith("0")) return `+${defaultCountry}${digits.slice(1)}`;
  return `+${defaultCountry}${digits}`;
}

interface ProductBaseFields {
  msisdn: string;
  amount: number;
  product_code: string;
  contact_phone?: string;
  reference?: string;
  account_no?: string;
  meter_number?: string;
  location_id?: string;
  account_number?: string;
  depositor_name?: string;
  beneficiary_name?: string;
  account_name?: string;
  description?: string;
  [k: string]: unknown;
}

export const relworxApi = {
  health: () =>
    apiFetch<{ success: boolean; service: string; hasApiKey: boolean; hasAccountNo: boolean }>(
      "/health",
    ),

  walletBalance: (currency: Currency = "UGX") =>
    apiFetch<WalletBalanceResponse>("/api/wallet/balance", { query: { currency } }),

  validatePhone: (msisdn: string) =>
    apiFetch<ValidatePhoneResponse>("/api/validate-phone", {
      method: "POST",
      body: { msisdn },
    }),

  /** Customer pays you (mobile money STK push). */
  deposit: async (input: {
    msisdn: string;
    amount: number;
    currency?: Currency;
    description?: string;
    reference?: string;
  }) => {
    const reference = input.reference ?? (await makeReference());
    return apiFetch<DepositResponse>("/api/deposit", {
      method: "POST",
      body: {
        msisdn: input.msisdn,
        amount: input.amount,
        currency: input.currency ?? "UGX",
        description: input.description,
        reference,
      },
    });
  },

  /** You pay a customer (payout / withdraw). */
  withdraw: async (input: {
    msisdn: string;
    amount: number;
    currency?: Currency;
    description?: string;
    reference?: string;
  }) => {
    const reference = input.reference ?? (await makeReference());
    return apiFetch<WithdrawResponse>("/api/withdraw", {
      method: "POST",
      body: {
        msisdn: input.msisdn,
        amount: input.amount,
        currency: input.currency ?? "UGX",
        description: input.description,
        reference,
      },
    });
  },

  requestStatus: (internalReference: string) =>
    apiFetch<RequestStatusResponse>("/api/request-status", {
      query: { internal_reference: internalReference },
    }),

  transactions: (page = 1) =>
    apiFetch<TransactionsResponse>("/api/transactions", { query: { page } }),

  products: () =>
    apiFetch<{ success: boolean; products: ProductSummary[] }>("/api/products"),

  priceList: (code: string) =>
    apiFetch<{ success: boolean; price_list: PriceListItem[] }>(
      "/api/products/price-list",
      { query: { code } },
    ),

  choiceList: (code: string) =>
    apiFetch<{ success: boolean; choice_list: ChoiceListItem[] }>(
      "/api/products/choice-list",
      { query: { code } },
    ),

  validateProduct: async (input: ProductBaseFields) => {
    const reference = input.reference ?? (await makeReference());
    return apiFetch<ValidateProductResponse>("/api/products/validate", {
      method: "POST",
      body: {
        ...input,
        contact_phone: input.contact_phone ?? input.msisdn,
        reference,
      },
    });
  },

  purchaseProduct: (validation_reference: string) =>
    apiFetch<PurchaseResponse>("/api/products/purchase", {
      method: "POST",
      body: { validation_reference },
    }),
};

const TERMINAL_STATUSES = new Set(["success", "failed", "error", "cancelled", "reversed"]);

/** Returns true if the error message indicates the record doesn't exist (treat as terminal). */
function isTerminalError(e: unknown): boolean {
  const msg = ((e as any)?.message || "").toLowerCase();
  return (
    msg.includes("record not found") ||
    msg.includes("not found") ||
    msg.includes("invalid parameter")
  );
}

/** Poll the /api/request-status endpoint until it leaves the pending state. */
export async function pollRequestStatus(
  internalReference: string,
  opts: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<RequestStatusResponse> {
  const interval = opts.intervalMs ?? 3000;
  const timeout  = opts.timeoutMs  ?? 60000;
  const started  = Date.now();
  let last: RequestStatusResponse | null = null;

  while (Date.now() - started < timeout) {
    try {
      last = await relworxApi.requestStatus(internalReference);
      const s = (last.status ?? "").toLowerCase();
      if (s && TERMINAL_STATUSES.has(s)) return last;
      // Still pending/processing — keep polling
    } catch (e) {
      // If the error means the record doesn't exist, stop polling
      if (isTerminalError(e)) {
        return { success: false, status: "pending", message: "Transaction status unavailable." };
      }
      // Other errors: wait and retry
    }
    await new Promise((r) => setTimeout(r, interval));
  }

  return last ?? { success: true, status: "pending", message: "Still processing — check Transactions." };
}
