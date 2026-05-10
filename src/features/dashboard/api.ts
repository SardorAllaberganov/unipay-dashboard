import type { PaymentChannel, PaymentStatus } from '@/types/domain';

interface ApiResponse<T> {
  data: T;
}

interface MoneyJson {
  amount: number; // minor units (tiyins / cents)
  currency: 'UZS' | 'USD';
}

export interface ResponseMeta {
  partial?: boolean;
  shown?: number;
  total?: number;
}

export interface DashboardSummary {
  totalReceived: MoneyJson & { deltaPct: number; spark: number[] };
  pending: { count: number; studentsWithDebt: number; deltaPct: number; spark: number[] };
  overdue: MoneyJson & { count: number; deltaPct: number; spark: number[] };
  lastPayout: (MoneyJson & { date: string }) | null;
  nextPayout: { date: string } | null;
  _meta?: ResponseMeta;
}

export type Granularity = 'daily' | 'weekly' | 'monthly';
export type RevenueMetric = 'amount' | 'count';

export interface RevenueSeries {
  granularity: Granularity;
  metric: RevenueMetric;
  series: { label: string; value: number }[];
  _meta?: ResponseMeta;
}

export interface StatusBreakdown {
  slices: { status: 'paid' | 'pending' | 'overdue'; count: number }[];
  totalStudents: number;
  _meta?: ResponseMeta;
}

export interface RecentTransactionsResponse {
  items: RecentTransaction[];
  _meta?: ResponseMeta;
}

export interface UnpaidStudentsResponse {
  items: UnpaidStudent[];
  _meta?: ResponseMeta;
}

export interface RecentTransaction {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  currency: 'UZS' | 'USD';
  channel: PaymentChannel;
  status: PaymentStatus;
  createdAt: string;
}

export interface UnpaidStudent {
  id: string;
  studentName: string;
  departmentName: string;
  amount: number;
  currency: 'UZS' | 'USD';
  daysOverdue: number;
}

export interface DashboardDateRange {
  from?: string;
  to?: string;
}

function rangeQuery(range?: DashboardDateRange): string {
  const params = new URLSearchParams();
  if (range?.from) params.set('from', range.from);
  if (range?.to) params.set('to', range.to);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`request_failed:${res.status}`);
  const body = (await res.json()) as ApiResponse<T>;
  return body.data;
}

export const dashboardApi = {
  summary: (range?: DashboardDateRange) =>
    getJson<DashboardSummary>(`/api/dashboard/summary${rangeQuery(range)}`),

  revenue: (granularity: Granularity, metric: RevenueMetric, range?: DashboardDateRange) => {
    const params = new URLSearchParams({ granularity, metric });
    if (range?.from) params.set('from', range.from);
    if (range?.to) params.set('to', range.to);
    return getJson<RevenueSeries>(`/api/dashboard/revenue?${params.toString()}`);
  },

  statusBreakdown: (range?: DashboardDateRange) =>
    getJson<StatusBreakdown>(`/api/dashboard/status-breakdown${rangeQuery(range)}`),

  recentTransactions: (limit = 10) =>
    getJson<RecentTransactionsResponse>(`/api/transactions/recent?limit=${limit}`),

  unpaidTop: (limit = 10) =>
    getJson<UnpaidStudentsResponse>(`/api/students/unpaid-top?limit=${limit}`),

  bulkRemind: async (studentIds: string[], reason: string): Promise<{ count: number }> => {
    const res = await fetch('/api/students/bulk-remind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentIds, reason }),
    });
    if (!res.ok) throw new Error(`bulk_remind_failed:${res.status}`);
    const body = (await res.json()) as ApiResponse<{ count: number }>;
    return body.data;
  },
};
