// Typed fetch wrappers for the Payouts module. Wire shape is `MoneyJson` (amount: number)
// because the global BigInt.prototype.toJSON patch in src/main.tsx collapses bigint → number
// on serialize. Consumers should treat `money.amount` as a number at runtime and never
// arithmetically mix it with `100n`.
import type {
  BankAccount,
  PaymentChannel,
  PaymentStatus,
  PayoutPlan,
  PayoutStatus,
} from '@/types/domain';

interface ApiResponse<T> {
  data: T;
}

interface MoneyJson {
  amount: number; // tiyins
  currency: 'UZS' | 'USD';
}

export interface ResponseMeta {
  partial?: boolean;
  shown?: number;
  total?: number;
}

export interface PayoutJson {
  id: string;
  periodFrom: string;
  periodTo: string;
  transactionsCount: number;
  gross: MoneyJson;
  commission: MoneyJson;
  net: MoneyJson;
  bankAccountId: string;
  bankRef?: string;
  status: PayoutStatus;
  completedAt?: string;
}

export interface PayoutBreakdownRowJson {
  transactionId: string;
  studentId: string;
  studentName: string;
  channel: PaymentChannel;
  status: PaymentStatus;
  amount: MoneyJson;
  commission: MoneyJson;
  net: MoneyJson;
  createdAt: string;
}

export interface PayoutBalanceJson {
  available: MoneyJson;
  plan: PayoutPlan;
  nextExpectedAt?: string;
}

export interface PayoutsListParams {
  page?: number;
  pageSize?: number;
}

export interface PayoutsListResponse {
  items: PayoutJson[];
  total: number;
  _meta?: ResponseMeta;
}

export interface PayoutBreakdownParams {
  page?: number;
  pageSize?: number;
}

export interface PayoutBreakdownResponse {
  items: PayoutBreakdownRowJson[];
  total: number;
  _meta?: ResponseMeta;
}

export interface BankAccountsResponse {
  items: BankAccount[];
}

export interface RequestPayoutBody {
  bankAccountId: string;
  amount: number; // UZS major units
  note?: string;
}

export interface ConfirmPayoutBody {
  amount: number; // UZS major units — must match Payout.net for the server-side equality check
  reason: string;
}

export interface CancelPayoutBody {
  reason: string;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(
      (errBody as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`,
    ) as Error & { status?: number; body?: unknown };
    err.status = res.status;
    err.body = errBody;
    throw err;
  }
  const body = (await res.json()) as ApiResponse<T>;
  return body.data;
}

function qs(params: Record<string, string | number | undefined | null> | object): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export const payoutsApi = {
  list(params: PayoutsListParams): Promise<PayoutsListResponse> {
    return fetchJson<PayoutsListResponse>(`/api/payouts${qs(params)}`);
  },
  get(id: string): Promise<PayoutJson> {
    return fetchJson<PayoutJson>(`/api/payouts/${encodeURIComponent(id)}`);
  },
  breakdown(id: string, params: PayoutBreakdownParams): Promise<PayoutBreakdownResponse> {
    return fetchJson<PayoutBreakdownResponse>(
      `/api/payouts/${encodeURIComponent(id)}/breakdown${qs(params)}`,
    );
  },
  statementUrl(id: string): string {
    return `/api/payouts/${encodeURIComponent(id)}/breakdown.xlsx`;
  },
  balance(): Promise<PayoutBalanceJson> {
    return fetchJson<PayoutBalanceJson>(`/api/payouts/balance`);
  },
  bankAccounts(): Promise<BankAccountsResponse> {
    return fetchJson<BankAccountsResponse>(`/api/payouts/bank-accounts`);
  },
  request(body: RequestPayoutBody): Promise<PayoutJson> {
    return fetchJson<PayoutJson>(`/api/payouts/request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  },
  confirm(id: string, body: ConfirmPayoutBody): Promise<PayoutJson> {
    return fetchJson<PayoutJson>(`/api/payouts/${encodeURIComponent(id)}/confirm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  },
  cancel(id: string, body: CancelPayoutBody): Promise<PayoutJson> {
    return fetchJson<PayoutJson>(`/api/payouts/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  },
};

export const MIN_PAYOUT_UZS = 100_000;
export const REASON_MIN_LENGTH = 20;
