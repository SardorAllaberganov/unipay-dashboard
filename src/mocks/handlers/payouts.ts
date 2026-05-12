// MSW handlers for the Payouts module. 8 endpoints + 24 historical weekly fixtures
// + per-payout transaction breakdown. `?_state=partial|empty|error` honored on every GET.
// Mulberry32 seeded for deterministic fixtures across reloads (matches dashboard 0x1558b0
// + payments 0xa1b2c3 conventions). One pending payout is planted near the top of the
// list for confirm/cancel QA without flipping the seed.
import { http, HttpResponse } from 'msw';
import type {
  BankAccount,
  Money,
  PaymentChannel,
  PaymentStatus,
  Payout,
  PayoutBreakdownRow,
  PayoutPlan,
  PayoutStatus,
} from '@/types/domain';

// ---------- helpers ----------

type ForcedState = 'partial' | 'empty' | 'error' | null;

function forcedState(request: Request): ForcedState {
  const v = new URL(request.url).searchParams.get('_state');
  if (v === 'partial' || v === 'empty' || v === 'error') return v;
  return null;
}

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

function uzs(amountUzs: number): Money {
  return { amount: BigInt(Math.round(amountUzs)) * 100n, currency: 'UZS' };
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function genId(prefix: string, rng: () => number): string {
  const a = Math.floor(rng() * 0xffff).toString(16).padStart(4, '0');
  const b = Math.floor(rng() * 0xffff).toString(16).padStart(4, '0');
  return `${prefix}-2026-${a}${b}`.toUpperCase();
}

// ---------- bank accounts (verified-only subset for the Request form Select) ----------

const SEED_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank-1',
    bankName: 'Hamkorbank',
    mfo: '00440',
    accountNumber: '20208000900123456789',
    holderName: 'Tashkent University of Information Technologies',
    currency: 'UZS',
    label: 'Основной счёт',
    isDefault: true,
    verification: 'verified',
  },
  {
    id: 'bank-2',
    bankName: 'Asaka Bank',
    mfo: '00081',
    accountNumber: '20208000900987654321',
    holderName: 'Tashkent University of Information Technologies',
    currency: 'UZS',
    label: 'Резервный счёт',
    isDefault: false,
    verification: 'verified',
  },
];

// ---------- channel mix (matches /payments) ----------

const CHANNEL_MIX: { channel: PaymentChannel; weight: number }[] = [
  { channel: 'payme', weight: 35 },
  { channel: 'click', weight: 25 },
  { channel: 'uzum', weight: 15 },
  { channel: 'apelsin', weight: 8 },
  { channel: 'tezpay', weight: 5 },
  { channel: 'mpay', weight: 5 },
  { channel: 'cash', weight: 2 },
  { channel: 'manual', weight: 5 },
];
const CHANNEL_TOTAL_WEIGHT = CHANNEL_MIX.reduce((s, m) => s + m.weight, 0);
function pickChannel(rng: () => number): PaymentChannel {
  let r = rng() * CHANNEL_TOTAL_WEIGHT;
  for (const entry of CHANNEL_MIX) {
    r -= entry.weight;
    if (r <= 0) return entry.channel;
  }
  return 'payme';
}

const CHANNEL_RATE: Record<PaymentChannel, number> = {
  payme: 0.015,
  click: 0.015,
  uzum: 0.018,
  apelsin: 0.015,
  tezpay: 0.02,
  mpay: 0.02,
  cash: 0,
  manual: 0,
};

// ---------- stores ----------

let payoutsStore: Payout[] = [];
// Breakdown rows live in a parallel map keyed by payout id so the Payout
// wire shape stays clean (no private `_breakdown` field bleeding through
// JSON.stringify in /api/payouts response).
const breakdownById = new Map<string, PayoutBreakdownRow[]>();

// First names + Cyrillic surnames for breakdown student labels. Kept short so we
// don't accidentally re-implement the students fixture — just enough for the
// breakdown table to feel real.
const FIRST_NAMES = ['Алишер', 'Камила', 'Бекзод', 'Нилуфар', 'Дилшод', 'Зарина', 'Тимур', 'Малика'];
const LAST_NAMES = ['Каримов', 'Хасанова', 'Юлдашев', 'Рахимова', 'Назаров', 'Алиев', 'Махмудова', 'Усманов'];

function buildBreakdown(
  count: number,
  startCreated: Date,
  endCreated: Date,
  rng: () => number,
): { rows: PayoutBreakdownRow[]; gross: number; commission: number } {
  const rows: PayoutBreakdownRow[] = [];
  let grossUzs = 0;
  let commissionUzs = 0;

  const startMs = startCreated.getTime();
  const endMs = endCreated.getTime();

  for (let i = 0; i < count; i++) {
    const channel = pickChannel(rng);
    const amountUzs = 250_000 + Math.floor(rng() * 3_750_000);
    const commissionAmount = Math.floor(amountUzs * CHANNEL_RATE[channel]);
    const createdMs = startMs + Math.floor(rng() * (endMs - startMs));
    const studentFirst = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]!;
    const studentLast = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]!;

    // 95% paid, 5% refunded — payouts only settle the net of completed transactions,
    // but refunds against past payouts also surface here so finance can reconcile.
    const status: PaymentStatus = rng() < 0.05 ? 'refunded' : 'paid';

    rows.push({
      transactionId: genId('TXN', rng),
      studentId: `stu-${Math.floor(rng() * 999_999).toString().padStart(6, '0')}`,
      studentName: `${studentLast} ${studentFirst.charAt(0)}.`,
      channel,
      status,
      amount: uzs(amountUzs),
      commission: uzs(commissionAmount),
      net: uzs(amountUzs - commissionAmount),
      createdAt: new Date(createdMs).toISOString(),
    });
    grossUzs += amountUzs;
    commissionUzs += commissionAmount;
  }
  rows.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  return { rows, gross: grossUzs, commission: commissionUzs };
}

function seedPayouts() {
  if (payoutsStore.length > 0) return;
  const rng = makeRng(0xa10d05);
  const now = Date.now();

  // 24 weekly payouts — Tuesdays back from today.
  // Index 0 is the most recent; payouts older than ~6 months are still useful for the table.
  const out: Payout[] = [];

  // Plant exactly one pending payout for confirm/cancel QA — placed 7 days ago so the
  // history table still feels live (the next payout cadence). All older payouts are settled.
  const PENDING_INDEX = 0;

  for (let week = 0; week < 24; week++) {
    const periodToDate = new Date(now - week * 7 * 86_400_000);
    // Snap to last Tuesday for visual consistency (matches the dashboard fixture cadence).
    while (periodToDate.getUTCDay() !== 2) {
      periodToDate.setUTCDate(periodToDate.getUTCDate() - 1);
    }
    const periodFromDate = new Date(periodToDate.getTime() - 6 * 86_400_000);

    const txCount = 40 + Math.floor(rng() * 60);
    const { rows, gross, commission } = buildBreakdown(
      txCount,
      periodFromDate,
      periodToDate,
      rng,
    );
    const net = gross - commission;

    let status: PayoutStatus = 'settled';
    let completedAt: string | undefined = new Date(
      periodToDate.getTime() + 86_400_000 + Math.floor(rng() * 4 * 3_600_000),
    ).toISOString();
    let bankRef: string | undefined = `BR-${genId('REF', rng).slice(4)}`;

    if (week === PENDING_INDEX) {
      status = 'pending';
      completedAt = undefined;
      bankRef = undefined;
    } else if (week === 4) {
      // Plant one historical failure so the StatusBadge + acceptance copy gets exercised.
      status = 'failed';
      bankRef = undefined;
    }

    const payoutId = `PAY-${periodToDate.toISOString().slice(0, 10).replace(/-/g, '')}`;
    out.push({
      id: payoutId,
      periodFrom: isoDay(periodFromDate),
      periodTo: isoDay(periodToDate),
      transactionsCount: txCount,
      gross: uzs(gross),
      commission: uzs(commission),
      net: uzs(net),
      bankAccountId: 'bank-1',
      bankRef,
      status,
      completedAt,
    });
    breakdownById.set(payoutId, rows);
  }
  payoutsStore = out;
}
seedPayouts();

// ---------- balance ----------

function buildBalance(): { available: Money; plan: PayoutPlan; nextExpectedAt?: string } {
  // "Available" balance = sum of paid-and-not-yet-settled transactions. In this fixture,
  // we model it as a small slice of the most recent week's gross so the Request form
  // surfaces a realistic non-zero amount but stays below the daily limits.
  const recent = payoutsStore[0];
  if (!recent) {
    return { available: uzs(0), plan: 'request' };
  }
  // Available = 35% of most recent net (simulates the in-flight settlement queue).
  const recentNetTiyins = Number(recent.net.amount);
  const availableUzs = Math.floor((recentNetTiyins / 100) * 0.35);

  // Next expected = next Tuesday from today.
  const now = new Date();
  const next = new Date(now);
  while (next.getUTCDay() !== 2 || next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return {
    available: uzs(availableUzs),
    plan: 'request',
    nextExpectedAt: next.toISOString(),
  };
}

function paginate<T>(rows: T[], page: number, pageSize: number): { items: T[]; total: number } {
  const start = (page - 1) * pageSize;
  return { items: rows.slice(start, start + pageSize), total: rows.length };
}

// ---------- handlers ----------

const MIN_PAYOUT_UZS = 100_000;
const REASON_MIN_LENGTH = 20;

export const payoutsHandlers = [
  // List
  http.get('/api/payouts', ({ request }) => {
    const forced = forcedState(request);
    if (forced === 'error') {
      return HttpResponse.json({ error: { code: 'FORCED' } }, { status: 500 });
    }
    if (forced === 'empty') {
      return HttpResponse.json({ data: { items: [], total: 0 } });
    }

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? '25') || 25));
    const sorted = [...payoutsStore].sort((a, b) =>
      a.periodTo > b.periodTo ? -1 : a.periodTo < b.periodTo ? 1 : 0,
    );
    const { items, total } = paginate(sorted, page, pageSize);

    if (forced === 'partial') {
      return HttpResponse.json({
        data: { items, total, _meta: { partial: true, shown: items.length, total: total + 2 } },
      });
    }
    return HttpResponse.json({ data: { items, total } });
  }),

  // Detail
  http.get('/api/payouts/:id', ({ request, params }) => {
    const forced = forcedState(request);
    if (forced === 'error') {
      return HttpResponse.json({ error: { code: 'FORCED' } }, { status: 500 });
    }
    const id = params.id as string;
    const rec = payoutsStore.find((p) => p.id === id);
    if (!rec) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    return HttpResponse.json({ data: rec });
  }),

  // Per-tx breakdown (paginated)
  http.get('/api/payouts/:id/breakdown', ({ request, params }) => {
    const forced = forcedState(request);
    if (forced === 'error') {
      return HttpResponse.json({ error: { code: 'FORCED' } }, { status: 500 });
    }
    const id = params.id as string;
    const rec = payoutsStore.find((p) => p.id === id);
    if (!rec) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    if (forced === 'empty') {
      return HttpResponse.json({ data: { items: [], total: 0 } });
    }
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? '50') || 50));
    const rows = breakdownById.get(id) ?? [];
    const { items, total } = paginate(rows, page, pageSize);

    if (forced === 'partial') {
      return HttpResponse.json({
        data: {
          items,
          total,
          _meta: { partial: true, shown: items.length, total: total + 3 },
        },
      });
    }
    return HttpResponse.json({ data: { items, total } });
  }),

  // Statement download — CSV blob with .xlsx-shaped filename. Real Excel generation
  // would land alongside a real backend; the UI just needs a clickable artifact.
  http.get('/api/payouts/:id/breakdown.xlsx', ({ params }) => {
    const id = params.id as string;
    const rec = payoutsStore.find((p) => p.id === id);
    if (!rec) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    const rows = breakdownById.get(id) ?? [];
    const header = ['transaction_id', 'student_id', 'student_name', 'channel', 'status', 'amount_uzs', 'commission_uzs', 'net_uzs', 'created_at'];
    const body = rows.map((r) =>
      [
        r.transactionId,
        r.studentId,
        r.studentName,
        r.channel,
        r.status,
        Number(r.amount.amount) / 100,
        Number(r.commission.amount) / 100,
        Number(r.net.amount) / 100,
        r.createdAt,
      ].join(','),
    );
    const csv = [header.join(','), ...body].join('\n');
    return new HttpResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': `attachment; filename="payout-${id}.xlsx"`,
      },
    });
  }),

  // Balance + plan
  http.get('/api/payouts/balance', ({ request }) => {
    const forced = forcedState(request);
    if (forced === 'error') {
      return HttpResponse.json({ error: { code: 'FORCED' } }, { status: 500 });
    }
    return HttpResponse.json({ data: buildBalance() });
  }),

  // Verified bank accounts (Select source on the request form)
  http.get('/api/payouts/bank-accounts', ({ request }) => {
    const forced = forcedState(request);
    if (forced === 'error') {
      return HttpResponse.json({ error: { code: 'FORCED' } }, { status: 500 });
    }
    if (forced === 'empty') {
      return HttpResponse.json({ data: { items: [] } });
    }
    const verified = SEED_BANK_ACCOUNTS.filter((b) => b.verification === 'verified');
    return HttpResponse.json({ data: { items: verified } });
  }),

  // Request manual payout — creates a pending entry; status flips on confirm.
  http.post('/api/payouts/request', async ({ request }) => {
    const body = (await request.json()) as {
      bankAccountId?: string;
      amount?: number;
      note?: string;
    };
    const balance = buildBalance();
    const availableUzs = Number(balance.available.amount) / 100;

    if (!body.bankAccountId) {
      return HttpResponse.json(
        { error: { code: 'invalid_input', field: 'bankAccountId', message: 'Bank account is required' } },
        { status: 400 },
      );
    }
    if (!SEED_BANK_ACCOUNTS.find((b) => b.id === body.bankAccountId && b.verification === 'verified')) {
      return HttpResponse.json(
        { error: { code: 'bank_unverified', message: 'Bank account is not verified' } },
        { status: 400 },
      );
    }
    const amountUzs = Number(body.amount ?? availableUzs);
    if (!Number.isFinite(amountUzs) || amountUzs <= 0) {
      return HttpResponse.json(
        { error: { code: 'invalid_input', field: 'amount' } },
        { status: 400 },
      );
    }
    if (amountUzs < MIN_PAYOUT_UZS) {
      return HttpResponse.json(
        {
          error: {
            code: 'AMOUNT_BELOW_MINIMUM',
            message: `Минимальная выплата ${MIN_PAYOUT_UZS} UZS`,
            min: MIN_PAYOUT_UZS,
          },
        },
        { status: 400 },
      );
    }
    if (amountUzs > availableUzs) {
      return HttpResponse.json(
        {
          error: {
            code: 'AMOUNT_EXCEEDS_BALANCE',
            available: availableUzs,
          },
        },
        { status: 400 },
      );
    }

    const rng = makeRng(Date.now() & 0xffffffff);
    const now = new Date();
    const periodFrom = new Date(now.getTime() - 7 * 86_400_000);
    const periodTo = new Date(now.getTime() - 86_400_000);
    const newPayout: Payout = {
      id: `PAY-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(rng() * 0xffff).toString(16).toUpperCase()}`,
      periodFrom: isoDay(periodFrom),
      periodTo: isoDay(periodTo),
      transactionsCount: 0,
      gross: uzs(amountUzs),
      commission: uzs(0),
      net: uzs(amountUzs),
      bankAccountId: body.bankAccountId,
      status: 'pending',
    };
    payoutsStore.unshift(newPayout);
    breakdownById.set(newPayout.id, []);
    return HttpResponse.json({ data: newPayout }, { status: 201 });
  }),

  // Confirm a pending payout — body { amount, reason }
  http.post('/api/payouts/:id/confirm', async ({ request, params }) => {
    const id = params.id as string;
    const rec = payoutsStore.find((p) => p.id === id);
    if (!rec) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    if (rec.status !== 'pending') {
      return HttpResponse.json(
        { error: { code: 'invalid_status', message: 'Only pending payouts can be confirmed' } },
        { status: 409 },
      );
    }
    const body = (await request.json()) as { amount?: number; reason?: string };
    const reason = (body.reason ?? '').trim();
    if (reason.length < REASON_MIN_LENGTH) {
      return HttpResponse.json(
        { error: { code: 'reason_too_short', min: REASON_MIN_LENGTH } },
        { status: 400 },
      );
    }
    const expectedUzs = Number(rec.net.amount) / 100;
    if (Number(body.amount) !== expectedUzs) {
      return HttpResponse.json(
        { error: { code: 'amount_mismatch', expected: expectedUzs } },
        { status: 400 },
      );
    }
    const rng = makeRng((Date.now() ^ 0xc0ffee) >>> 0);
    rec.status = 'settled';
    rec.completedAt = new Date().toISOString();
    rec.bankRef = `BR-${genId('REF', rng).slice(4)}`;
    return HttpResponse.json({ data: rec });
  }),

  // Cancel a pending payout — body { reason }
  http.post('/api/payouts/:id/cancel', async ({ request, params }) => {
    const id = params.id as string;
    const rec = payoutsStore.find((p) => p.id === id);
    if (!rec) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    if (rec.status !== 'pending') {
      return HttpResponse.json(
        { error: { code: 'invalid_status', message: 'Only pending payouts can be cancelled' } },
        { status: 409 },
      );
    }
    const body = (await request.json()) as { reason?: string };
    const reason = (body.reason ?? '').trim();
    if (reason.length < REASON_MIN_LENGTH) {
      return HttpResponse.json(
        { error: { code: 'reason_too_short', min: REASON_MIN_LENGTH } },
        { status: 400 },
      );
    }
    rec.status = 'failed';
    rec.completedAt = new Date().toISOString();
    return HttpResponse.json({ data: rec });
  }),
];

// Test-only seed reset (used by isolated unit tests if/when they land).
export function _resetPayoutsForTest() {
  payoutsStore = [];
  breakdownById.clear();
  seedPayouts();
}
