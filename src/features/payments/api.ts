import type {
  ManualPaymentMethod,
  Money,
  PaymentChannel,
  PaymentStatus,
  Refund,
  RefundReason,
  Transaction,
} from '@/types/domain';

interface ApiResponse<T> {
  data: T;
}

export interface ResponseMeta {
  partial?: boolean;
  shown?: number;
  total?: number;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`request_failed:${res.status}`);
  const body = (await res.json()) as ApiResponse<T>;
  return body.data;
}

async function send<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let code = `request_failed:${res.status}`;
    try {
      const parsed = (await res.json()) as { error?: { code?: string } };
      if (parsed?.error?.code) code = parsed.error.code;
    } catch {
      // ignore
    }
    throw new Error(code);
  }
  const parsed = (await res.json()) as ApiResponse<T>;
  return parsed.data;
}

// -------- transaction list --------

export interface TransactionsListParams {
  search?: string;
  statuses?: PaymentStatus[];
  channels?: PaymentChannel[];
  departmentIds?: string[];
  studentIds?: string[];
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

function buildTxQuery(p: TransactionsListParams): string {
  const q = new URLSearchParams();
  if (p.search) q.set('search', p.search);
  for (const s of p.statuses ?? []) q.append('status', s);
  for (const c of p.channels ?? []) q.append('channel', c);
  for (const d of p.departmentIds ?? []) q.append('departmentId', d);
  for (const s of p.studentIds ?? []) q.append('studentId', s);
  if (p.from) q.set('from', p.from);
  if (p.to) q.set('to', p.to);
  if (p.page) q.set('page', String(p.page));
  if (p.pageSize) q.set('pageSize', String(p.pageSize));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export interface TransactionsListResponse {
  items: Transaction[];
  page: number;
  pageSize: number;
  total: number;
  totals: {
    charged: Money;
    commission: Money;
    net: Money;
  };
  _meta?: ResponseMeta;
}

// -------- pending --------

export interface PendingRow {
  studentId: string;
  studentName: string;
  departmentId: string;
  year: number;
  educationType: string;
  scheduleId: string;
  period: string;
  due: Money;
  paid: Money;
  remaining: Money;
  dueDate: string;
  daysOverdue: number;
}

export interface PendingListResponse {
  items: PendingRow[];
  page: number;
  pageSize: number;
  total: number;
  stats: {
    studentsWithDebt: number;
    totalAmount: Money;
    overdueOver30: number;
  };
}

export interface PendingListParams {
  tab?: 'pending' | 'overdue';
  search?: string;
  page?: number;
  pageSize?: number;
}

function buildPendingQuery(p: PendingListParams): string {
  const q = new URLSearchParams();
  if (p.tab) q.set('tab', p.tab);
  if (p.search) q.set('search', p.search);
  if (p.page) q.set('page', String(p.page));
  if (p.pageSize) q.set('pageSize', String(p.pageSize));
  const s = q.toString();
  return s ? `?${s}` : '';
}

// -------- refunds --------

export interface RefundsListResponse {
  items: Refund[];
  total: number;
}

// -------- input types --------

export interface ManualPaymentInput {
  studentId: string;
  amountUzs: number;
  scheduleId: string;
  paymentMethod: ManualPaymentMethod;
  paymentDate: string;
  receiptNumber?: string;
  note: string;
}

export interface InitiateRefundInput {
  amountUzs: number;
  reason: RefundReason;
  note: string;
  typePhrase: 'REFUND';
}

export interface BulkRemindInput {
  studentIds: string[];
  reason?: string;
}

export const EXPORT_FORMATS = ['csv', 'xlsx', 'pdf'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const paymentsApi = {
  listTransactions: (params: TransactionsListParams) =>
    getJson<TransactionsListResponse>(`/api/transactions${buildTxQuery(params)}`),
  getTransaction: (id: string) =>
    getJson<Transaction>(`/api/transactions/${encodeURIComponent(id)}`),
  manualPayment: (input: ManualPaymentInput) =>
    send<Transaction>('/api/transactions/manual', 'POST', input),
  initiateRefund: (txId: string, input: InitiateRefundInput) =>
    send<Refund>(`/api/transactions/${encodeURIComponent(txId)}/refund`, 'POST', input),
  listPending: (params: PendingListParams) =>
    getJson<PendingListResponse>(`/api/payments/pending${buildPendingQuery(params)}`),
  listRefunds: (status: 'pending' | 'history') =>
    getJson<RefundsListResponse>(`/api/refunds?status=${status}`),
  approveRefund: (id: string) =>
    send<Refund>(`/api/refunds/${encodeURIComponent(id)}/approve`, 'POST'),
  rejectRefund: (id: string, reason: string) =>
    send<Refund>(`/api/refunds/${encodeURIComponent(id)}/reject`, 'POST', { reason }),
  bulkRemind: (input: BulkRemindInput) =>
    send<{ sent: number; jobId: string }>('/api/payments/bulk-remind', 'POST', input),
  bulkExport: (input: {
    studentIds?: string[];
    from?: string;
    to?: string;
    format?: ExportFormat;
  }) => send<{ jobId: string; format: ExportFormat }>(
    '/api/payments/bulk-export',
    'POST',
    input,
  ),
};
