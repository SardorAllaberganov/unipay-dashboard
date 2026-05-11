import { http, HttpResponse } from 'msw';
import type { PaymentChannel } from '@/types/domain';

// Deterministic PRNG so fixtures stay stable across reloads (mulberry32).
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Granularity = 'daily' | 'weekly' | 'monthly';
type RevenueMetric = 'amount' | 'count';
type ForcedState = 'partial' | 'empty' | 'error' | null;

function forcedState(req: Request): ForcedState {
  const url = new URL(req.url);
  const v = url.searchParams.get('_state');
  if (v === 'partial' || v === 'empty' || v === 'error') return v;
  return null;
}

const CHANNEL_MIX: { channel: PaymentChannel; weight: number }[] = [
  { channel: 'payme', weight: 35 },
  { channel: 'click', weight: 20 },
  { channel: 'uzum', weight: 12 },
  { channel: 'apelsin', weight: 10 },
  { channel: 'tezpay', weight: 8 },
  { channel: 'mpay', weight: 7 },
  { channel: 'cash', weight: 5 },
  { channel: 'manual', weight: 3 },
];

const DEPARTMENTS = [
  { id: 'fac-eng', name: 'Инженерный факультет' },
  { id: 'fac-econ', name: 'Экономический факультет' },
  { id: 'fac-hum', name: 'Гуманитарный факультет' },
  { id: 'fac-med', name: 'Медицинский факультет' },
  { id: 'fac-law', name: 'Юридический факультет' },
];

// ---------- per-day fixture (90 days, deterministic) ----------

interface DayBucket {
  date: string; // YYYY-MM-DD
  count: number; // transactions
  charged: number; // tiyins
  commission: number; // tiyins
  net: number; // tiyins
  byChannel: Record<PaymentChannel, number>; // tiyins
  byDepartment: Record<string, number>; // tiyins
  payoutId?: string; // payouts settle ~every 7 days
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfDayUtc(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

const TODAY = startOfDayUtc(new Date());
const WINDOW_DAYS = 90;

function buildBuckets(): DayBucket[] {
  const rng = makeRng(0x1558b0); // brand-600 seed — matches dashboard for visual consistency
  const out: DayBucket[] = [];
  let payoutCounter = 0;

  for (let i = 0; i < WINDOW_DAYS; i++) {
    const d = new Date(TODAY.getTime() - (WINDOW_DAYS - 1 - i) * 86_400_000);
    // Seasonality (sin), slight upward trend, weekend dip, ±15% noise.
    const seasonality = 1 + 0.25 * Math.sin((i / 30) * Math.PI * 2);
    const trend = 0.92 + (i / WINDOW_DAYS) * 0.35;
    const weekday = d.getUTCDay();
    const weekend = weekday === 0 || weekday === 6 ? 0.55 : 1.0;
    const noise = 0.85 + rng() * 0.3;

    const baseTiyins = 2_800_000_000; // 28M UZS/day baseline (in tiyins)
    const charged = Math.round(baseTiyins * seasonality * trend * weekend * noise);
    const count = Math.max(1, Math.round(12 * seasonality * trend * weekend * noise));
    const commissionRate = 0.012 + rng() * 0.006; // 1.2–1.8% blended
    const commission = Math.round(charged * commissionRate);
    const net = charged - commission;

    // Allocate to channels by mix weights with daily jitter.
    const byChannel = {} as Record<PaymentChannel, number>;
    let remaining = charged;
    const totalWeight = CHANNEL_MIX.reduce((s, c) => s + c.weight, 0);
    CHANNEL_MIX.forEach((c, idx) => {
      const jitter = 0.85 + rng() * 0.3;
      const share = (c.weight / totalWeight) * jitter;
      const value = idx === CHANNEL_MIX.length - 1 ? remaining : Math.round(charged * share);
      byChannel[c.channel] = Math.max(0, value);
      remaining -= value;
    });

    // Allocate to departments.
    const byDepartment: Record<string, number> = {};
    let deptRemaining = charged;
    DEPARTMENTS.forEach((dept, idx) => {
      if (idx === DEPARTMENTS.length - 1) {
        byDepartment[dept.id] = Math.max(0, deptRemaining);
        return;
      }
      const jitter = 0.7 + rng() * 0.6;
      const value = Math.round((charged / DEPARTMENTS.length) * jitter);
      byDepartment[dept.id] = value;
      deptRemaining -= value;
    });

    // Payout every ~7 days (Tuesday).
    let payoutId: string | undefined;
    if (weekday === 2) {
      payoutCounter += 1;
      payoutId = `pay-${String(payoutCounter).padStart(4, '0')}`;
    }

    out.push({ date: isoDay(d), count, charged, commission, net, byChannel, byDepartment, payoutId });
  }
  return out;
}

const BUCKETS = buildBuckets();

function bucketsInRange(from?: string, to?: string): DayBucket[] {
  const earliest = BUCKETS[0]!.date;
  const latest = BUCKETS[BUCKETS.length - 1]!.date;
  const fromKey = from && from > earliest ? from : earliest;
  const toKey = to && to < latest ? to : latest;
  return BUCKETS.filter((b) => b.date >= fromKey && b.date <= toKey);
}

function previousWindowBuckets(fromIso?: string, toIso?: string): DayBucket[] {
  if (!fromIso || !toIso) return [];
  const from = new Date(`${fromIso}T00:00:00Z`);
  const to = new Date(`${toIso}T00:00:00Z`);
  const lenDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1);
  const prevTo = new Date(from.getTime() - 86_400_000);
  const prevFrom = new Date(prevTo.getTime() - (lenDays - 1) * 86_400_000);
  return bucketsInRange(isoDay(prevFrom), isoDay(prevTo));
}

// ---------- summary ----------

function sum<T>(arr: T[], pick: (x: T) => number): number {
  return arr.reduce((s, x) => s + pick(x), 0);
}

function sparkOver(buckets: DayBucket[], pick: (b: DayBucket) => number, slices = 7): number[] {
  if (buckets.length === 0) return [];
  const out: number[] = [];
  const sliceLen = Math.max(1, Math.floor(buckets.length / slices));
  for (let i = 0; i < slices; i++) {
    const start = i * sliceLen;
    const end = i === slices - 1 ? buckets.length : start + sliceLen;
    const window = buckets.slice(start, end);
    out.push(window.reduce((s, b) => s + pick(b), 0));
  }
  return out;
}

function buildSummary(from?: string, to?: string) {
  const inRange = bucketsInRange(from, to);
  const prev = previousWindowBuckets(from, to);

  const totalReceived = sum(inRange, (b) => b.charged);
  const totalCommission = sum(inRange, (b) => b.commission);
  const totalNet = sum(inRange, (b) => b.net);
  const payoutCount = inRange.filter((b) => b.payoutId).length;

  const prevReceived = sum(prev, (b) => b.charged) || 1;
  const prevCommission = sum(prev, (b) => b.commission) || 1;
  const prevNet = sum(prev, (b) => b.net) || 1;
  const prevPayouts = prev.filter((b) => b.payoutId).length || 1;

  return {
    totalReceived: {
      amount: totalReceived,
      currency: 'UZS' as const,
      deltaPct: Math.round(((totalReceived - prevReceived) / prevReceived) * 1000) / 10,
      spark: sparkOver(inRange, (b) => b.charged),
    },
    totalCommission: {
      amount: totalCommission,
      currency: 'UZS' as const,
      deltaPct: Math.round(((totalCommission - prevCommission) / prevCommission) * 1000) / 10,
      spark: sparkOver(inRange, (b) => b.commission),
    },
    totalNet: {
      amount: totalNet,
      currency: 'UZS' as const,
      deltaPct: Math.round(((totalNet - prevNet) / prevNet) * 1000) / 10,
      spark: sparkOver(inRange, (b) => b.net),
    },
    payoutCount: {
      count: payoutCount,
      deltaPct: Math.round(((payoutCount - prevPayouts) / prevPayouts) * 1000) / 10,
    },
  };
}

// ---------- revenue series ----------

function bucketLabel(date: string, granularity: Granularity): string {
  const d = new Date(`${date}T00:00:00Z`);
  if (granularity === 'daily') return date;
  if (granularity === 'weekly') {
    const week = Math.ceil(d.getUTCDate() / 7);
    return `W${week} ${d.toLocaleString('ru-RU', { month: 'short', timeZone: 'UTC' })}`;
  }
  return d.toLocaleString('ru-RU', { month: 'short', year: '2-digit', timeZone: 'UTC' });
}

function buildRevenueSeries(
  inRange: DayBucket[],
  granularity: Granularity,
  metric: RevenueMetric,
): { label: string; value: number }[] {
  if (inRange.length === 0) return [];
  if (granularity === 'daily') {
    return inRange.map((b) => ({
      label: bucketLabel(b.date, 'daily'),
      value: metric === 'amount' ? b.charged : b.count,
    }));
  }
  // Group weekly/monthly.
  const groups = new Map<string, { label: string; value: number }>();
  for (const b of inRange) {
    const label = bucketLabel(b.date, granularity);
    const prev = groups.get(label);
    const add = metric === 'amount' ? b.charged : b.count;
    if (prev) prev.value += add;
    else groups.set(label, { label, value: add });
  }
  return [...groups.values()];
}

function buildChannelBreakdown(inRange: DayBucket[]) {
  const totals = new Map<PaymentChannel, number>();
  for (const b of inRange) {
    for (const c of Object.keys(b.byChannel) as PaymentChannel[]) {
      totals.set(c, (totals.get(c) ?? 0) + b.byChannel[c]);
    }
  }
  return [...totals.entries()]
    .map(([channel, amount]) => ({ channel, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function buildDepartmentBreakdown(inRange: DayBucket[]) {
  const totals = new Map<string, number>();
  for (const b of inRange) {
    for (const dId of Object.keys(b.byDepartment)) {
      totals.set(dId, (totals.get(dId) ?? 0) + b.byDepartment[dId]!);
    }
  }
  return [...totals.entries()]
    .map(([id, amount]) => {
      const dept = DEPARTMENTS.find((d) => d.id === id);
      return { id, name: dept?.name ?? id, amount };
    })
    .sort((a, b) => b.amount - a.amount);
}

// ---------- by-day rows ----------

function buildByDayRows(inRange: DayBucket[]) {
  return inRange.map((b) => ({
    date: b.date,
    transactions: b.count,
    totalCharged: { amount: b.charged, currency: 'UZS' as const },
    commission: { amount: b.commission, currency: 'UZS' as const },
    net: { amount: b.net, currency: 'UZS' as const },
    payoutId: b.payoutId ?? null,
  }));
}

// ---------- exports ----------

type ExportStatus = 'processing' | 'ready' | 'failed';
type ExportDataType = 'transactions' | 'students' | 'overdue' | 'payouts';
type ExportFormat = 'csv' | 'ndjson';
type ExportGrouping = 'none' | 'student' | 'department' | 'day';

interface ExportRecord {
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
  createdAt: string; // ISO
  expiresAt: string; // ISO (createdAt + 7d)
  startedAt: number; // ms epoch — drives etaSeconds while processing
  url?: string;
}

const EXPORT_TTL_MS = 7 * 86_400_000;
const PROCESSING_MS = 3000;

const exports = new Map<string, ExportRecord>();

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
}

function fileExtFor(format: ExportFormat): string {
  return format === 'csv' ? 'csv' : 'ndjson';
}

function seedExports() {
  const now = Date.now();
  const samples: Array<Omit<ExportRecord, 'id' | 'createdAt' | 'expiresAt' | 'fileName' | 'startedAt' | 'url'>> = [
    {
      dataType: 'transactions',
      format: 'csv',
      grouping: 'day',
      includeContext: true,
      rows: 1452,
      rangeFrom: isoDay(new Date(now - 30 * 86_400_000)),
      rangeTo: isoDay(new Date(now - 1 * 86_400_000)),
      status: 'ready',
    },
    {
      dataType: 'students',
      format: 'csv',
      grouping: 'department',
      includeContext: false,
      rows: 240,
      rangeFrom: isoDay(new Date(now - 60 * 86_400_000)),
      rangeTo: isoDay(new Date(now - 1 * 86_400_000)),
      status: 'ready',
    },
    {
      dataType: 'overdue',
      format: 'ndjson',
      grouping: 'none',
      includeContext: false,
      rows: 38,
      rangeFrom: isoDay(new Date(now - 30 * 86_400_000)),
      rangeTo: isoDay(new Date(now - 1 * 86_400_000)),
      status: 'ready',
    },
    {
      dataType: 'payouts',
      format: 'csv',
      grouping: 'none',
      includeContext: true,
      rows: 12,
      rangeFrom: isoDay(new Date(now - 90 * 86_400_000)),
      rangeTo: isoDay(new Date(now - 1 * 86_400_000)),
      status: 'ready',
    },
  ];
  samples.forEach((s, i) => {
    const id = `exp-seed-${i + 1}`;
    const createdAt = new Date(now - (i + 1) * 86_400_000 * 0.5);
    const expiresAt = new Date(createdAt.getTime() + EXPORT_TTL_MS);
    const fileName = `unipay-${s.dataType}-${s.rangeFrom}_${s.rangeTo}.${fileExtFor(s.format)}`;
    exports.set(id, {
      ...s,
      id,
      fileName,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      startedAt: createdAt.getTime(),
      url: `/mock-downloads/${fileName}`,
    });
  });
}
seedExports();

function snapshotExport(rec: ExportRecord) {
  // Auto-flip processing → ready after PROCESSING_MS so the polling endpoint can observe it.
  if (rec.status === 'processing' && Date.now() - rec.startedAt >= PROCESSING_MS) {
    rec.status = 'ready';
    rec.url = `/mock-downloads/${rec.fileName}`;
  }
  const etaSeconds =
    rec.status === 'processing'
      ? Math.max(1, Math.ceil((PROCESSING_MS - (Date.now() - rec.startedAt)) / 1000))
      : undefined;
  return {
    id: rec.id,
    fileName: rec.fileName,
    dataType: rec.dataType,
    format: rec.format,
    grouping: rec.grouping,
    includeContext: rec.includeContext,
    rows: rec.rows,
    rangeFrom: rec.rangeFrom,
    rangeTo: rec.rangeTo,
    status: rec.status,
    createdAt: rec.createdAt,
    expiresAt: rec.expiresAt,
    url: rec.url,
    etaSeconds,
  };
}

interface GenerateBody {
  dateRange: { from: string; to: string };
  dataType: ExportDataType;
  format: ExportFormat;
  grouping: ExportGrouping;
  includeContext: boolean;
}

function estimateRows(body: GenerateBody): number {
  const inRange = bucketsInRange(body.dateRange.from, body.dateRange.to);
  if (body.dataType === 'transactions') return sum(inRange, (b) => b.count);
  if (body.dataType === 'students') return 240;
  if (body.dataType === 'overdue') return Math.max(0, Math.round(38 + Math.random() * 12));
  return inRange.filter((b) => b.payoutId).length;
}

// ---------- handlers ----------

export const reportsHandlers = [
  http.get('/api/reports/summary', ({ request }) => {
    const forced = forcedState(request);
    if (forced === 'error') {
      return HttpResponse.json({ error: { code: 'FORCED' } }, { status: 500 });
    }
    const url = new URL(request.url);
    const from = url.searchParams.get('from') ?? undefined;
    const to = url.searchParams.get('to') ?? undefined;

    const inRange = bucketsInRange(from, to);
    if (forced === 'empty' || inRange.length === 0) {
      return HttpResponse.json({
        data: {
          totalReceived: { amount: 0, currency: 'UZS', deltaPct: 0, spark: [] },
          totalCommission: { amount: 0, currency: 'UZS', deltaPct: 0, spark: [] },
          totalNet: { amount: 0, currency: 'UZS', deltaPct: 0, spark: [] },
          payoutCount: { count: 0, deltaPct: 0 },
          channels: [],
          departments: [],
          revenueDaily: [],
          revenueWeekly: [],
          revenueMonthly: [],
        },
      });
    }

    const summary = buildSummary(from, to);
    const channels = buildChannelBreakdown(inRange);
    const departments = buildDepartmentBreakdown(inRange);
    const revenueDaily = buildRevenueSeries(inRange, 'daily', 'amount');
    const revenueWeekly = buildRevenueSeries(inRange, 'weekly', 'amount');
    const revenueMonthly = buildRevenueSeries(inRange, 'monthly', 'amount');

    const payload = {
      ...summary,
      channels,
      departments,
      revenueDaily,
      revenueWeekly,
      revenueMonthly,
    };

    if (forced === 'partial') {
      return HttpResponse.json({
        data: { ...payload, _meta: { partial: true, shown: 3, total: 4 } },
      });
    }
    return HttpResponse.json({ data: payload });
  }),

  http.get('/api/reports/by-day', ({ request }) => {
    const forced = forcedState(request);
    if (forced === 'error') {
      return HttpResponse.json({ error: { code: 'FORCED' } }, { status: 500 });
    }
    const url = new URL(request.url);
    const from = url.searchParams.get('from') ?? undefined;
    const to = url.searchParams.get('to') ?? undefined;
    const inRange = bucketsInRange(from, to);

    if (forced === 'empty' || inRange.length === 0) {
      return HttpResponse.json({ data: { items: [] } });
    }
    const items = buildByDayRows(inRange);
    if (forced === 'partial') {
      return HttpResponse.json({
        data: { items, _meta: { partial: true, shown: items.length - 1, total: items.length } },
      });
    }
    return HttpResponse.json({ data: { items } });
  }),

  http.get('/api/exports', ({ request }) => {
    const forced = forcedState(request);
    if (forced === 'error') {
      return HttpResponse.json({ error: { code: 'FORCED' } }, { status: 500 });
    }
    if (forced === 'empty') {
      return HttpResponse.json({ data: { items: [] } });
    }
    const items = [...exports.values()]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map(snapshotExport);
    if (forced === 'partial') {
      return HttpResponse.json({
        data: { items, _meta: { partial: true, shown: items.length - 1, total: items.length } },
      });
    }
    return HttpResponse.json({ data: { items } });
  }),

  http.post('/api/exports', async ({ request }) => {
    const body = (await request.json()) as GenerateBody;
    if (!body.dateRange?.from || !body.dateRange?.to) {
      return HttpResponse.json(
        { error: { code: 'invalid_input', message: 'dateRange.from and dateRange.to are required' } },
        { status: 400 },
      );
    }
    const id = makeId('exp');
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + EXPORT_TTL_MS);
    const fileName = `unipay-${body.dataType}-${body.dateRange.from}_${body.dateRange.to}.${fileExtFor(body.format)}`;
    const record: ExportRecord = {
      id,
      fileName,
      dataType: body.dataType,
      format: body.format,
      grouping: body.grouping,
      includeContext: body.includeContext,
      rows: estimateRows(body),
      rangeFrom: body.dateRange.from,
      rangeTo: body.dateRange.to,
      status: 'processing',
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      startedAt: Date.now(),
    };
    exports.set(id, record);
    return HttpResponse.json({ data: { jobId: id } }, { status: 201 });
  }),

  http.get('/api/exports/:id', ({ params }) => {
    const id = params.id as string;
    const rec = exports.get(id);
    if (!rec) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    return HttpResponse.json({ data: snapshotExport(rec) });
  }),

  http.delete('/api/exports/:id', ({ params }) => {
    const id = params.id as string;
    if (!exports.delete(id)) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    return HttpResponse.json({ data: { id } });
  }),
];
