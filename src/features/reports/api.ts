import type { PaymentChannel } from '@/types/domain';

interface ApiResponse<T> {
  data: T;
}

interface ApiError {
  error?: { code?: string; message?: string };
}

export interface ResponseMeta {
  partial?: boolean;
  shown?: number;
  total?: number;
}

interface MoneyJson {
  // MSW patches BigInt.prototype.toJSON → Number, so on the wire Money.amount is a number
  // (minor units / tiyins). Divide by 100 only at display time.
  amount: number;
  currency: 'UZS' | 'USD';
}

export interface ReportDateRange {
  from?: string;
  to?: string;
}

export type ExportDataType = 'transactions' | 'students' | 'overdue' | 'payouts';
export type ExportFormat = 'csv' | 'ndjson';
export type ExportGrouping = 'none' | 'student' | 'department' | 'day';
export type ExportStatus = 'processing' | 'ready' | 'failed';

export const EXPORT_DATA_TYPES: ExportDataType[] = [
  'transactions',
  'students',
  'overdue',
  'payouts',
];
export const EXPORT_FORMATS: ExportFormat[] = ['csv', 'ndjson'];
export const EXPORT_GROUPINGS: ExportGrouping[] = ['none', 'student', 'department', 'day'];

export interface ReportSummary {
  totalReceived: MoneyJson & { deltaPct: number; spark: number[] };
  totalCommission: MoneyJson & { deltaPct: number; spark: number[] };
  totalNet: MoneyJson & { deltaPct: number; spark: number[] };
  payoutCount: { count: number; deltaPct: number };
  channels: { channel: PaymentChannel; amount: number }[];
  departments: { id: string; name: string; amount: number }[];
  revenueDaily: { label: string; value: number }[];
  revenueWeekly: { label: string; value: number }[];
  revenueMonthly: { label: string; value: number }[];
  _meta?: ResponseMeta;
}

export interface ByDayRow {
  date: string; // YYYY-MM-DD
  transactions: number;
  totalCharged: MoneyJson;
  commission: MoneyJson;
  net: MoneyJson;
  payoutId: string | null;
}

export interface ByDayResponse {
  items: ByDayRow[];
  _meta?: ResponseMeta;
}

export interface ExportJobSnapshot {
  id: string;
  fileName: string;
  dataType: ExportDataType;
  format: ExportFormat;
  grouping: ExportGrouping;
  includeContext: boolean;
  rows: number;
  rangeFrom: string;
  rangeTo: string;
  status: ExportStatus;
  createdAt: string;
  expiresAt: string;
  url?: string;
  etaSeconds?: number;
}

export interface ExportsListResponse {
  items: ExportJobSnapshot[];
  _meta?: ResponseMeta;
}

export interface GenerateExportRequest {
  dateRange: { from: string; to: string };
  dataType: ExportDataType;
  format: ExportFormat;
  grouping: ExportGrouping;
  includeContext: boolean;
}

function rangeQuery(range?: ReportDateRange): string {
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

async function send<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let code = `request_failed:${res.status}`;
    try {
      const parsed = (await res.json()) as ApiError;
      if (parsed.error?.code) code = parsed.error.code;
    } catch {
      // ignore parse failures — fall back to status-coded error
    }
    throw new Error(code);
  }
  const parsed = (await res.json()) as ApiResponse<T>;
  return parsed.data;
}

export const reportsApi = {
  summary: (range?: ReportDateRange) =>
    getJson<ReportSummary>(`/api/reports/summary${rangeQuery(range)}`),

  byDay: (range?: ReportDateRange) =>
    getJson<ByDayResponse>(`/api/reports/by-day${rangeQuery(range)}`),

  exportsList: () => getJson<ExportsListResponse>('/api/exports'),

  generateExport: (body: GenerateExportRequest) =>
    send<{ jobId: string }>('/api/exports', 'POST', body),

  pollExport: (jobId: string) =>
    getJson<ExportJobSnapshot>(`/api/exports/${encodeURIComponent(jobId)}`),

  deleteExport: (jobId: string) =>
    send<{ id: string }>(`/api/exports/${encodeURIComponent(jobId)}`, 'DELETE'),
};
