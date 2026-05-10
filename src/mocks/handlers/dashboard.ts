import { http, HttpResponse } from 'msw';
import type { PaymentChannel, PaymentStatus } from '@/types/domain';

type Granularity = 'daily' | 'weekly' | 'monthly';
type RevenueMetric = 'amount' | 'count';

// Deterministic PRNG so fixtures are stable across reloads (mulberry32).
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

const channelMix: { channel: PaymentChannel; weight: number }[] = [
  { channel: 'payme', weight: 35 },
  { channel: 'click', weight: 20 },
  { channel: 'uzum', weight: 12 },
  { channel: 'apelsin', weight: 10 },
  { channel: 'tezpay', weight: 8 },
  { channel: 'mpay', weight: 7 },
  { channel: 'cash', weight: 5 },
  { channel: 'manual', weight: 3 },
];

function pickChannel(rng: () => number): PaymentChannel {
  const total = channelMix.reduce((sum, c) => sum + c.weight, 0);
  let pick = rng() * total;
  for (const { channel, weight } of channelMix) {
    pick -= weight;
    if (pick <= 0) return channel;
  }
  return 'payme';
}

const firstNamesRu = [
  'Алишер', 'Бекзод', 'Шохрух', 'Дилшод', 'Жасур', 'Феруза', 'Зарина', 'Малика',
  'Нодира', 'Гулнара', 'Севара', 'Хуршид', 'Рустам', 'Тимур', 'Шахзода',
  'Камола', 'Дилнура', 'Анвар', 'Илхом', 'Сардор', 'Дилфуза', 'Лола',
];
const lastNamesRu = [
  'Каримов', 'Юсупов', 'Тургунов', 'Рахимов', 'Алимов', 'Хамидов', 'Ибрагимов',
  'Назаров', 'Усманов', 'Хасанов', 'Рашидов', 'Махмудов', 'Кулиев', 'Бабаев',
  'Эргашев', 'Холматов', 'Каюмов', 'Ражабов',
];

const departments = [
  { id: 'fac-eng', name: 'Инженерный факультет' },
  { id: 'fac-econ', name: 'Экономический факультет' },
  { id: 'fac-hum', name: 'Гуманитарный факультет' },
  { id: 'fac-med', name: 'Медицинский факультет' },
  { id: 'fac-law', name: 'Юридический факультет' },
];

interface SeedStudent {
  id: string;
  fullName: string;
  departmentId: string;
  departmentName: string;
  tuition: number; // tiyins
  status: PaymentStatus;
  daysOverdue: number; // 0 if not overdue
  channel: PaymentChannel;
  lastPaymentAt: string; // ISO
}

function buildStudents(count = 240): SeedStudent[] {
  const rng = makeRng(0x1558b0); // brand-600 seed
  const out: SeedStudent[] = [];
  for (let i = 0; i < count; i++) {
    const tuitionUzs = Math.round((3 + rng() * 5) * 1_000_000); // 3M–8M UZS
    const tuition = tuitionUzs * 100; // to tiyins
    const r = rng();
    let status: PaymentStatus;
    let daysOverdue = 0;
    if (r < 0.65) status = 'paid';
    else if (r < 0.85) status = 'pending';
    else {
      status = 'overdue';
      daysOverdue = 3 + Math.floor(rng() * 85); // 3–87 days
    }
    const firstName = firstNamesRu[Math.floor(rng() * firstNamesRu.length)] ?? 'Алишер';
    const lastName = lastNamesRu[Math.floor(rng() * lastNamesRu.length)] ?? 'Каримов';
    const dept = departments[Math.floor(rng() * departments.length)] ?? departments[0]!;
    const hoursAgo = Math.floor(rng() * 24 * 30); // up to 30 days
    const lastPaymentAt = new Date(Date.now() - hoursAgo * 3_600_000).toISOString();
    out.push({
      id: `stu-${i.toString().padStart(4, '0')}`,
      fullName: `${lastName} ${firstName.charAt(0)}.`,
      departmentId: dept.id,
      departmentName: dept.name,
      tuition,
      status,
      daysOverdue,
      channel: pickChannel(rng),
      lastPaymentAt,
    });
  }
  return out;
}

const studentsSeed = buildStudents();

function sumTiyins(students: SeedStudent[], statuses: PaymentStatus[]): number {
  return students
    .filter((s) => statuses.includes(s.status))
    .reduce((sum, s) => sum + s.tuition, 0);
}

function inDateRange(_iso: string, _from?: string, _to?: string): boolean {
  // Fixtures already span the last 30 days; ignore filter for now but keep API shape.
  return true;
}

// ---------- summary ----------

function buildSparkline(rng: () => number, base: number, length = 7): number[] {
  const out: number[] = [];
  let prev = base;
  for (let i = 0; i < length; i++) {
    const drift = (rng() - 0.45) * 0.3 * base;
    prev = Math.max(0, prev + drift);
    out.push(Math.round(prev));
  }
  return out;
}

function buildSummary(_from?: string, _to?: string) {
  const paid = studentsSeed.filter((s) => s.status === 'paid');
  const overdue = studentsSeed.filter((s) => s.status === 'overdue');
  const pending = studentsSeed.filter((s) => s.status === 'pending');

  const totalReceived = sumTiyins(studentsSeed, ['paid']);
  const overdueAmount = sumTiyins(studentsSeed, ['overdue']);
  const rng = makeRng(42);

  return {
    totalReceived: {
      amount: totalReceived, // tiyins
      currency: 'UZS' as const,
      deltaPct: 12.4,
      spark: buildSparkline(rng, totalReceived / 30),
    },
    pending: {
      count: pending.length,
      studentsWithDebt: pending.length + overdue.length,
      deltaPct: -3.2,
      spark: buildSparkline(rng, pending.length),
    },
    overdue: {
      count: overdue.length,
      amount: overdueAmount,
      currency: 'UZS' as const,
      deltaPct: 5.8,
      spark: buildSparkline(rng, overdueAmount / 30),
    },
    lastPayout:
      paid.length > 0
        ? {
            date: new Date(Date.now() - 2 * 86_400_000).toISOString(), // 2 days ago
            amount: Math.round(totalReceived * 0.32),
            currency: 'UZS' as const,
          }
        : null,
    nextPayout: { date: new Date(Date.now() + 5 * 86_400_000).toISOString() },
  };
}

// ---------- revenue series ----------

function buildRevenueSeries(granularity: Granularity, metric: RevenueMetric) {
  const rng = makeRng(0xdeadbeef ^ granularity.length ^ metric.length);
  let buckets: number;
  let labelOf: (i: number) => string;
  const now = Date.now();
  if (granularity === 'daily') {
    buckets = 30;
    labelOf = (i) => {
      const d = new Date(now - (buckets - 1 - i) * 86_400_000);
      return d.toISOString().slice(0, 10);
    };
  } else if (granularity === 'weekly') {
    buckets = 12;
    labelOf = (i) => {
      const d = new Date(now - (buckets - 1 - i) * 7 * 86_400_000);
      const week = Math.ceil(d.getDate() / 7);
      return `W${week} ${d.toLocaleString('ru-RU', { month: 'short' })}`;
    };
  } else {
    buckets = 12;
    labelOf = (i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (buckets - 1 - i));
      return d.toLocaleString('ru-RU', { month: 'short', year: '2-digit' });
    };
  }

  const series = [];
  for (let i = 0; i < buckets; i++) {
    const seasonality = 1 + 0.3 * Math.sin((i / buckets) * Math.PI * 2);
    const trend = 0.9 + (i / buckets) * 0.4;
    const noise = 0.85 + rng() * 0.3;
    if (metric === 'amount') {
      const base = 280_000_000; // tiyins ≈ 2.8M UZS daily baseline
      const mult = granularity === 'daily' ? 1 : granularity === 'weekly' ? 7 : 30;
      const value = Math.round(base * mult * seasonality * trend * noise);
      series.push({ label: labelOf(i), value });
    } else {
      const base = 12;
      const mult = granularity === 'daily' ? 1 : granularity === 'weekly' ? 7 : 30;
      const value = Math.round(base * mult * seasonality * trend * noise);
      series.push({ label: labelOf(i), value });
    }
  }
  return series;
}

// ---------- status breakdown ----------

function buildStatusBreakdown() {
  return {
    slices: [
      {
        status: 'paid' as const,
        count: studentsSeed.filter((s) => s.status === 'paid').length,
      },
      {
        status: 'pending' as const,
        count: studentsSeed.filter((s) => s.status === 'pending').length,
      },
      {
        status: 'overdue' as const,
        count: studentsSeed.filter((s) => s.status === 'overdue').length,
      },
    ],
    totalStudents: studentsSeed.length,
  };
}

// ---------- recent transactions ----------

function buildRecentTransactions(limit: number) {
  return studentsSeed
    .filter((s) => s.status === 'paid')
    .sort((a, b) => (a.lastPaymentAt < b.lastPaymentAt ? 1 : -1))
    .slice(0, limit)
    .map((s) => ({
      id: `tx-${s.id}`,
      studentId: s.id,
      studentName: s.fullName,
      amount: s.tuition,
      currency: 'UZS' as const,
      channel: s.channel,
      status: 'paid' as const,
      createdAt: s.lastPaymentAt,
    }));
}

// ---------- unpaid top ----------

function buildUnpaidTop(limit: number) {
  return studentsSeed
    .filter((s) => s.status === 'overdue')
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
    .slice(0, limit)
    .map((s) => ({
      id: s.id,
      studentName: s.fullName,
      departmentName: s.departmentName,
      amount: s.tuition,
      currency: 'UZS' as const,
      daysOverdue: s.daysOverdue,
    }));
}

// ---------- QA state override ----------

// `?_state=` is a QA hook so each panel's 6-state coverage is reproducible without
// flipping the network or breaking real data. Honored by all GET handlers below.
type ForcedState = 'partial' | 'empty' | 'error' | null;

function forcedState(request: Request): ForcedState {
  const v = new URL(request.url).searchParams.get('_state');
  if (v === 'partial' || v === 'empty' || v === 'error') return v;
  return null;
}

// ---------- handlers ----------

export const dashboardHandlers = [
  http.get('/api/dashboard/summary', ({ request }) => {
    const forced = forcedState(request);
    if (forced === 'error') {
      return HttpResponse.json({ error: { code: 'FORCED' } }, { status: 500 });
    }
    const url = new URL(request.url);
    void inDateRange('', url.searchParams.get('from') ?? undefined, url.searchParams.get('to') ?? undefined);
    const base = buildSummary(
      url.searchParams.get('from') ?? undefined,
      url.searchParams.get('to') ?? undefined,
    );
    if (forced === 'empty') {
      return HttpResponse.json({
        data: {
          ...base,
          totalReceived: { ...base.totalReceived, amount: 0, spark: [] },
          pending: { ...base.pending, count: 0, studentsWithDebt: 0, spark: [] },
          overdue: { ...base.overdue, count: 0, amount: 0, spark: [] },
          lastPayout: null,
          nextPayout: null,
        },
      });
    }
    if (forced === 'partial') {
      return HttpResponse.json({
        data: { ...base, _meta: { partial: true, shown: 3, total: 4 } },
      });
    }
    return HttpResponse.json({ data: base });
  }),

  http.get('/api/dashboard/revenue', ({ request }) => {
    const forced = forcedState(request);
    if (forced === 'error') {
      return HttpResponse.json({ error: { code: 'FORCED' } }, { status: 500 });
    }
    const url = new URL(request.url);
    const granularity = (url.searchParams.get('granularity') as Granularity) ?? 'daily';
    const metric = (url.searchParams.get('metric') as RevenueMetric) ?? 'amount';
    if (forced === 'empty') {
      return HttpResponse.json({
        data: { granularity, metric, series: [] },
      });
    }
    const series = buildRevenueSeries(granularity, metric);
    if (forced === 'partial') {
      return HttpResponse.json({
        data: {
          granularity,
          metric,
          series,
          _meta: { partial: true, shown: series.length - 2, total: series.length },
        },
      });
    }
    return HttpResponse.json({ data: { granularity, metric, series } });
  }),

  http.get('/api/dashboard/status-breakdown', ({ request }) => {
    const forced = forcedState(request);
    if (forced === 'error') {
      return HttpResponse.json({ error: { code: 'FORCED' } }, { status: 500 });
    }
    if (forced === 'empty') {
      return HttpResponse.json({
        data: { slices: [], totalStudents: 0 },
      });
    }
    const base = buildStatusBreakdown();
    if (forced === 'partial') {
      return HttpResponse.json({
        data: { ...base, _meta: { partial: true, shown: 2, total: 3 } },
      });
    }
    return HttpResponse.json({ data: base });
  }),

  http.get('/api/transactions/recent', ({ request }) => {
    const forced = forcedState(request);
    if (forced === 'error') {
      return HttpResponse.json({ error: { code: 'FORCED' } }, { status: 500 });
    }
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? '10');
    if (forced === 'empty') {
      return HttpResponse.json({ data: { items: [] } });
    }
    const items = buildRecentTransactions(limit);
    if (forced === 'partial') {
      return HttpResponse.json({
        data: { items: items.slice(0, 6), _meta: { partial: true, shown: 6, total: 10 } },
      });
    }
    return HttpResponse.json({ data: { items } });
  }),

  http.get('/api/students/unpaid-top', ({ request }) => {
    const forced = forcedState(request);
    if (forced === 'error') {
      return HttpResponse.json({ error: { code: 'FORCED' } }, { status: 500 });
    }
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? '10');
    if (forced === 'empty') {
      return HttpResponse.json({ data: { items: [] } });
    }
    const items = buildUnpaidTop(limit);
    if (forced === 'partial') {
      return HttpResponse.json({
        data: { items: items.slice(0, 7), _meta: { partial: true, shown: 7, total: 10 } },
      });
    }
    return HttpResponse.json({ data: { items } });
  }),

  http.post('/api/students/bulk-remind', async ({ request }) => {
    const body = (await request.json()) as { studentIds?: string[]; reason?: string };
    const count = body.studentIds?.length ?? 0;
    if (!body.reason || body.reason.trim().length < 20) {
      return HttpResponse.json(
        { error: { code: 'REASON_TOO_SHORT' } },
        { status: 400 },
      );
    }
    return HttpResponse.json({ data: { count } });
  }),
];
