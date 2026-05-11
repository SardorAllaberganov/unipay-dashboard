import { http, HttpResponse } from 'msw';
import type {
  FailureCode,
  ManualPaymentMethod,
  Money,
  PaymentChannel,
  PaymentStatus,
  Refund,
  RefundReason,
  RefundStatus,
  Transaction,
  TransactionEvent,
} from '@/types/domain';
import { FAILURE_CODES, MANUAL_PAYMENT_METHODS } from '@/types/domain';
import { getSeededScheduleRows, getSeededStudents } from './students';

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

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function genId(prefix: string, rng: () => number): string {
  const a = Math.floor(rng() * 0xffff)
    .toString(16)
    .padStart(4, '0');
  const b = Math.floor(rng() * 0xffff)
    .toString(16)
    .padStart(4, '0');
  return `${prefix}-2026-${a}${b}`.toUpperCase();
}

// ---------- channel mix (per spec §9.1) ----------

const CHANNEL_MIX: Array<{ channel: PaymentChannel; weight: number }> = [
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

let paymentsTxStore: Transaction[] = [];
let refundStore: Refund[] = [];

// ---------- seeders ----------

function buildEvents(
  status: PaymentStatus,
  createdIso: string,
  rng: () => number,
): TransactionEvent[] {
  const created = new Date(createdIso).getTime();
  const e: TransactionEvent[] = [
    { type: 'created', at: createdIso, actor: 'user' },
  ];
  if (status === 'paid' || status === 'refunded') {
    const processedAt = new Date(created + Math.floor(rng() * 5_000 + 800)).toISOString();
    const settledAt = new Date(created + Math.floor(rng() * 12_000 + 5_000)).toISOString();
    e.push({ type: 'processed', at: processedAt, actor: 'provider' });
    e.push({ type: 'settled', at: settledAt, actor: 'system' });
    if (status === 'refunded') {
      const refundedAt = new Date(
        created + 86_400_000 * (1 + Math.floor(rng() * 5)),
      ).toISOString();
      e.push({ type: 'refunded', at: refundedAt, actor: 'admin' });
    }
    return e;
  }
  if (status === 'processing') {
    const processedAt = new Date(created + Math.floor(rng() * 3_000 + 500)).toISOString();
    e.push({ type: 'processed', at: processedAt, actor: 'provider' });
    return e;
  }
  if (status === 'failed') {
    const processedAt = new Date(created + Math.floor(rng() * 3_000 + 500)).toISOString();
    const failedAt = new Date(created + Math.floor(rng() * 10_000 + 3_500)).toISOString();
    e.push({ type: 'processed', at: processedAt, actor: 'provider' });
    e.push({ type: 'failed', at: failedAt, actor: 'provider' });
    return e;
  }
  return e;
}

function buildPaymentsSeed() {
  const students = getSeededStudents();
  if (students.length === 0) return;
  // Idempotent: skip if already seeded.
  if (paymentsTxStore.length > 0) return;

  const rng = makeRng(0xa1b2c3);
  const TARGET = 820;
  const now = Date.now();

  for (let i = 0; i < TARGET; i++) {
    const student = students[Math.floor(rng() * students.length)]!;
    const channel = pickChannel(rng);

    // Time distribution: most recent 30 days densely, then 30-90 days sparsely.
    const recencyBias = rng();
    const ageMs =
      recencyBias < 0.7
        ? Math.floor(rng() * 30 * 86_400_000)
        : Math.floor(30 * 86_400_000 + rng() * 60 * 86_400_000);
    const createdMs = now - ageMs;
    const createdIso = new Date(createdMs).toISOString();

    // Status distribution.
    let status: PaymentStatus;
    const sBucket = rng();
    if (sBucket < 0.78) status = 'paid';
    else if (sBucket < 0.88) status = 'pending';
    else if (sBucket < 0.93) status = 'failed';
    else if (sBucket < 0.97) status = 'refunded';
    else status = 'overdue';

    // Push ~3 "stuck" pending older than 10 min in the recent window.
    if (i < 3) {
      status = 'pending';
      // Force createdAt to 12-30 min ago.
      const stuckAge = (12 + Math.floor(rng() * 18)) * 60_000;
      const stuckIso = new Date(now - stuckAge).toISOString();
      const amountUzs = 500_000 + Math.floor(rng() * 4_500_000);
      const commissionRate = CHANNEL_RATE[channel];
      const commission = Math.floor(amountUzs * commissionRate);
      const txId = genId('TXN', rng);
      paymentsTxStore.push({
        id: txId,
        studentId: student.id,
        studentName: `${student.lastName} ${student.firstName.charAt(0)}.`,
        departmentId: student.departmentId,
        amount: uzs(amountUzs),
        commission: uzs(commission),
        net: uzs(amountUzs - commission),
        channel,
        status,
        createdAt: stuckIso,
        events: buildEvents(status, stuckIso, rng),
        receiptNumber: `R-2026-${i.toString().padStart(6, '0')}`,
      });
      continue;
    }

    const amountUzs = 300_000 + Math.floor(rng() * 4_700_000);
    const commissionRate = CHANNEL_RATE[channel];
    const commission = Math.floor(amountUzs * commissionRate);
    const txId = genId('TXN', rng);

    // For failed transactions, pick a failure code.
    const failureCode: FailureCode | undefined =
      status === 'failed'
        ? FAILURE_CODES[Math.floor(rng() * FAILURE_CODES.length)]!
        : undefined;

    const tx: Transaction = {
      id: txId,
      studentId: student.id,
      studentName: `${student.lastName} ${student.firstName.charAt(0)}.`,
      departmentId: student.departmentId,
      amount: uzs(amountUzs),
      commission: uzs(commission),
      net: uzs(amountUzs - commission),
      channel,
      status,
      createdAt: createdIso,
      events: buildEvents(status, createdIso, rng),
    };
    if (status === 'paid' || status === 'refunded') {
      tx.receiptNumber = `R-2026-${i.toString().padStart(6, '0')}`;
      if (rng() < 0.9) tx.receiptUrl = `/api/receipts/${txId}`;
    }
    if (failureCode) tx.failureCode = failureCode;
    if (channel === 'manual') {
      tx.paymentMethod = MANUAL_PAYMENT_METHODS[
        Math.floor(rng() * MANUAL_PAYMENT_METHODS.length)
      ]!;
    }
    paymentsTxStore.push(tx);
  }

  // Seed some refund history (matching refunded transactions).
  const refundedTxs = paymentsTxStore.filter((t) => t.status === 'refunded');
  const REASONS: RefundReason[] = ['duplicate', 'wrong_amount', 'service_not_provided', 'other'];
  for (const tx of refundedTxs.slice(0, 14)) {
    const requestedAt = new Date(
      new Date(tx.createdAt).getTime() + 86_400_000 * (1 + Math.floor(rng() * 4)),
    ).toISOString();
    const resolvedAt = new Date(
      new Date(requestedAt).getTime() + 86_400_000 * (1 + Math.floor(rng() * 3)),
    ).toISOString();
    refundStore.push({
      id: genId('RF', rng),
      transactionId: tx.id,
      studentId: tx.studentId,
      studentName: tx.studentName,
      amount: tx.amount,
      reason: REASONS[Math.floor(rng() * REASONS.length)]!,
      note: 'Возврат подтверждён банком, средства зачислены.',
      status: 'completed',
      requestedAt,
      resolvedAt,
      bankRef: `BK-${Math.floor(rng() * 999_999_999)
        .toString()
        .padStart(9, '0')}`,
      refundTransactionId: genId('TXN', rng),
    });
  }
  // Seed 4 pending refund requests against paid transactions.
  const pendingCandidates = paymentsTxStore
    .filter((t) => t.status === 'paid')
    .slice(0, 4);
  for (const tx of pendingCandidates) {
    refundStore.push({
      id: genId('RF', rng),
      transactionId: tx.id,
      studentId: tx.studentId,
      studentName: tx.studentName,
      amount: tx.amount,
      reason: REASONS[Math.floor(rng() * REASONS.length)]!,
      note: 'Студент сообщил о двойном списании. Просим вернуть полную сумму.',
      status: 'pending',
      requestedAt: new Date(Date.now() - Math.floor(rng() * 6 * 3600_000)).toISOString(),
    });
  }
}

// Lazy seeding — first request triggers seed once.
function ensureSeeded() {
  if (paymentsTxStore.length === 0) buildPaymentsSeed();
}

// ---------- filtering ----------

function applyTxFilters(items: Transaction[], request: Request): Transaction[] {
  const url = new URL(request.url);
  const search = url.searchParams.get('search')?.toLowerCase() ?? '';
  const statuses = url.searchParams.getAll('status');
  const channels = url.searchParams.getAll('channel');
  const departmentIds = url.searchParams.getAll('departmentId');
  const studentIds = url.searchParams.getAll('studentId');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  let filtered = items;
  if (search) {
    filtered = filtered.filter(
      (t) =>
        t.id.toLowerCase().includes(search) ||
        t.studentName.toLowerCase().includes(search) ||
        t.studentId.toLowerCase().includes(search),
    );
  }
  if (statuses.length > 0) {
    filtered = filtered.filter((t) => statuses.includes(t.status));
  }
  if (channels.length > 0) {
    filtered = filtered.filter((t) => channels.includes(t.channel));
  }
  if (departmentIds.length > 0) {
    filtered = filtered.filter((t) => departmentIds.includes(t.departmentId));
  }
  if (studentIds.length > 0) {
    filtered = filtered.filter((t) => studentIds.includes(t.studentId));
  }
  if (from) {
    const fromMs = new Date(from).getTime();
    filtered = filtered.filter((t) => new Date(t.createdAt).getTime() >= fromMs);
  }
  if (to) {
    const toMs = new Date(to).getTime() + 86_400_000;
    filtered = filtered.filter((t) => new Date(t.createdAt).getTime() < toMs);
  }
  return filtered;
}

function sumMoney(items: Money[]): Money {
  let total = 0n;
  for (const m of items) total += m.amount;
  return { amount: total, currency: 'UZS' };
}

// ---------- handlers ----------

export const paymentsHandlers = [
  // -- GET /api/transactions --
  http.get('/api/transactions', async ({ request }) => {
    ensureSeeded();
    await delay(120);

    const state = forcedState(request);
    if (state === 'error') {
      return HttpResponse.json(
        { error: { code: 'request_failed' } },
        { status: 500 },
      );
    }
    if (state === 'empty') {
      return HttpResponse.json({
        data: {
          items: [],
          page: 1,
          pageSize: 50,
          total: 0,
          totals: {
            charged: uzs(0),
            commission: uzs(0),
            net: uzs(0),
          },
        },
      });
    }

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const pageSize = Math.min(
      200,
      Math.max(1, Number(url.searchParams.get('pageSize') ?? '50')),
    );

    const filtered = applyTxFilters(paymentsTxStore, request).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    const offset = (page - 1) * pageSize;
    const items = filtered.slice(offset, offset + pageSize);

    const totals = {
      charged: sumMoney(filtered.map((t) => t.amount)),
      commission: sumMoney(filtered.map((t) => t.commission)),
      net: sumMoney(filtered.map((t) => t.net)),
    };

    return HttpResponse.json({
      data: {
        items,
        page,
        pageSize,
        total: filtered.length,
        totals,
        _meta: state === 'partial' ? { partial: true, shown: items.length } : undefined,
      },
    });
  }),

  // -- GET /api/transactions/:id --
  http.get('/api/transactions/:id', async ({ params }) => {
    ensureSeeded();
    await delay(80);
    const tx = paymentsTxStore.find((t) => t.id === params.id);
    if (!tx) {
      return HttpResponse.json(
        { error: { code: 'not_found' } },
        { status: 404 },
      );
    }
    return HttpResponse.json({ data: tx });
  }),

  // -- GET /api/payments/pending --  (returns students + open schedule rows)
  http.get('/api/payments/pending', async ({ request }) => {
    ensureSeeded();
    await delay(140);
    const state = forcedState(request);
    if (state === 'error') {
      return HttpResponse.json(
        { error: { code: 'request_failed' } },
        { status: 500 },
      );
    }

    const url = new URL(request.url);
    const tab = url.searchParams.get('tab') === 'overdue' ? 'overdue' : 'pending';
    const search = url.searchParams.get('search')?.toLowerCase() ?? '';
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const pageSize = Math.min(
      200,
      Math.max(1, Number(url.searchParams.get('pageSize') ?? '50')),
    );

    const allRows = getSeededScheduleRows();
    const students = getSeededStudents();
    const studentById = new Map(students.map((s) => [s.id, s]));
    const NOW = Date.now();

    const targetStatus = tab === 'overdue' ? 'overdue' : 'pending';
    const candidateRows = allRows.filter((r) => r.status === targetStatus);

    interface PendingRow {
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
    const rows: PendingRow[] = [];
    for (const r of candidateRows) {
      const stu = studentById.get(r.studentId);
      if (!stu) continue;
      if (stu.year === undefined) continue;
      const dueMs = new Date(r.dueDate).getTime();
      const daysOverdue = tab === 'overdue' ? Math.max(0, Math.floor((NOW - dueMs) / 86_400_000)) : 0;
      rows.push({
        studentId: stu.id,
        studentName: `${stu.lastName} ${stu.firstName}`,
        departmentId: stu.departmentId,
        year: stu.year,
        educationType: stu.educationType,
        scheduleId: r.id,
        period: r.period,
        due: r.amount,
        paid: r.paid,
        remaining: r.remaining,
        dueDate: r.dueDate,
        daysOverdue,
      });
    }

    let filtered = rows;
    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.studentName.toLowerCase().includes(search) ||
          r.studentId.toLowerCase().includes(search),
      );
    }
    if (tab === 'overdue') {
      filtered.sort((a, b) => b.daysOverdue - a.daysOverdue);
    } else {
      filtered.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    }

    const offset = (page - 1) * pageSize;
    const items = filtered.slice(offset, offset + pageSize);

    const studentsWithDebt = new Set(filtered.map((r) => r.studentId)).size;
    const totalAmount = sumMoney(filtered.map((r) => r.remaining));
    const overdueOver30 = new Set(
      filtered.filter((r) => r.daysOverdue > 30).map((r) => r.studentId),
    ).size;

    return HttpResponse.json({
      data: {
        items,
        page,
        pageSize,
        total: filtered.length,
        stats: {
          studentsWithDebt,
          totalAmount,
          overdueOver30,
        },
      },
    });
  }),

  // -- POST /api/transactions/manual --
  http.post('/api/transactions/manual', async ({ request }) => {
    ensureSeeded();
    await delay(180);
    interface Body {
      studentId?: string;
      amountUzs?: number;
      scheduleId?: string;
      paymentMethod?: ManualPaymentMethod;
      paymentDate?: string;
      receiptNumber?: string;
      note?: string;
    }
    const body = (await request.json().catch(() => ({}))) as Body;

    if (!body.studentId || !body.amountUzs || !body.scheduleId || !body.paymentMethod || !body.paymentDate || !body.note || body.note.length < 20) {
      return HttpResponse.json(
        { error: { code: 'invalid_input' } },
        { status: 400 },
      );
    }
    const stu = getSeededStudents().find((s) => s.id === body.studentId);
    if (!stu) {
      return HttpResponse.json(
        { error: { code: 'not_found' } },
        { status: 404 },
      );
    }

    const rng = makeRng(Date.now() & 0xffffffff);
    const txId = genId('TXN', rng);
    const tx: Transaction = {
      id: txId,
      studentId: stu.id,
      studentName: `${stu.lastName} ${stu.firstName.charAt(0)}.`,
      departmentId: stu.departmentId,
      scheduleId: body.scheduleId,
      amount: uzs(body.amountUzs),
      commission: uzs(0),
      net: uzs(body.amountUzs),
      channel: 'manual',
      status: 'paid',
      paymentMethod: body.paymentMethod,
      receiptNumber: body.receiptNumber || undefined,
      note: body.note,
      createdAt: new Date(body.paymentDate).toISOString(),
      events: [
        { type: 'created', at: new Date(body.paymentDate).toISOString(), actor: 'admin' },
        { type: 'settled', at: new Date(body.paymentDate).toISOString(), actor: 'admin' },
      ],
    };
    paymentsTxStore.unshift(tx);
    return HttpResponse.json({ data: tx }, { status: 201 });
  }),

  // -- POST /api/transactions/:id/refund --
  http.post('/api/transactions/:id/refund', async ({ params, request }) => {
    ensureSeeded();
    await delay(200);
    interface Body {
      amountUzs?: number;
      reason?: RefundReason;
      note?: string;
      typePhrase?: string;
    }
    const body = (await request.json().catch(() => ({}))) as Body;
    const tx = paymentsTxStore.find((t) => t.id === params.id);
    if (!tx) {
      return HttpResponse.json(
        { error: { code: 'not_found' } },
        { status: 404 },
      );
    }
    if (tx.status !== 'paid') {
      return HttpResponse.json(
        { error: { code: 'refund_not_eligible' } },
        { status: 400 },
      );
    }
    if (!body.amountUzs || !body.reason || !body.note || body.note.length < 20 || body.typePhrase !== 'REFUND') {
      return HttpResponse.json(
        { error: { code: 'invalid_input' } },
        { status: 400 },
      );
    }
    if (body.amountUzs * 100 > Number(tx.amount.amount)) {
      return HttpResponse.json(
        { error: { code: 'amount_exceeds_original' } },
        { status: 400 },
      );
    }

    const rng = makeRng(Date.now() & 0xffffffff);
    const refund: Refund = {
      id: genId('RF', rng),
      transactionId: tx.id,
      studentId: tx.studentId,
      studentName: tx.studentName,
      amount: uzs(body.amountUzs),
      reason: body.reason,
      note: body.note,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    refundStore.unshift(refund);

    // Auto-approve after 3s for demo (spec §9.4).
    setTimeout(() => {
      const idx = refundStore.findIndex((r) => r.id === refund.id);
      if (idx >= 0 && refundStore[idx]!.status === 'pending') {
        const refundTxId = genId('TXN', makeRng((Date.now() + idx) & 0xffffffff));
        refundStore[idx] = {
          ...refundStore[idx]!,
          status: 'completed',
          resolvedAt: new Date().toISOString(),
          bankRef: `BK-${Math.floor(Math.random() * 999_999_999)
            .toString()
            .padStart(9, '0')}`,
          refundTransactionId: refundTxId,
        };
        // Flip the original tx to refunded.
        const txIdx = paymentsTxStore.findIndex((t) => t.id === refund.transactionId);
        if (txIdx >= 0) {
          paymentsTxStore[txIdx] = {
            ...paymentsTxStore[txIdx]!,
            status: 'refunded',
            events: [
              ...(paymentsTxStore[txIdx]!.events ?? []),
              { type: 'refunded', at: new Date().toISOString(), actor: 'admin' },
            ],
          };
        }
      }
    }, 3000);

    return HttpResponse.json({ data: refund }, { status: 201 });
  }),

  // -- GET /api/refunds --
  http.get('/api/refunds', async ({ request }) => {
    ensureSeeded();
    await delay(120);
    const state = forcedState(request);
    if (state === 'error') {
      return HttpResponse.json(
        { error: { code: 'request_failed' } },
        { status: 500 },
      );
    }
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status');

    let filtered = refundStore;
    if (statusFilter === 'pending') {
      filtered = refundStore.filter((r) => r.status === 'pending');
    } else if (statusFilter === 'history') {
      filtered = refundStore.filter((r) => r.status !== 'pending');
    }
    // Sort recent first.
    filtered = [...filtered].sort((a, b) =>
      b.requestedAt.localeCompare(a.requestedAt),
    );

    if (state === 'empty') filtered = [];
    return HttpResponse.json({ data: { items: filtered, total: filtered.length } });
  }),

  // -- POST /api/refunds/:id/approve --
  http.post('/api/refunds/:id/approve', async ({ params }) => {
    ensureSeeded();
    await delay(180);
    const idx = refundStore.findIndex((r) => r.id === params.id);
    if (idx < 0) {
      return HttpResponse.json(
        { error: { code: 'not_found' } },
        { status: 404 },
      );
    }
    if (refundStore[idx]!.status !== 'pending') {
      return HttpResponse.json(
        { error: { code: 'invalid_state' } },
        { status: 400 },
      );
    }
    const refundTxId = genId('TXN', makeRng(Date.now() & 0xffffffff));
    refundStore[idx] = {
      ...refundStore[idx]!,
      status: 'completed' as RefundStatus,
      resolvedAt: new Date().toISOString(),
      bankRef: `BK-${Math.floor(Math.random() * 999_999_999)
        .toString()
        .padStart(9, '0')}`,
      refundTransactionId: refundTxId,
    };
    // Mark original tx refunded.
    const txIdx = paymentsTxStore.findIndex((t) => t.id === refundStore[idx]!.transactionId);
    if (txIdx >= 0) {
      paymentsTxStore[txIdx] = {
        ...paymentsTxStore[txIdx]!,
        status: 'refunded',
        events: [
          ...(paymentsTxStore[txIdx]!.events ?? []),
          { type: 'refunded', at: new Date().toISOString(), actor: 'admin' },
        ],
      };
    }
    return HttpResponse.json({ data: refundStore[idx]! });
  }),

  // -- POST /api/refunds/:id/reject --
  http.post('/api/refunds/:id/reject', async ({ params, request }) => {
    ensureSeeded();
    await delay(160);
    interface Body {
      reason?: string;
    }
    const body = (await request.json().catch(() => ({}))) as Body;
    if (!body.reason || body.reason.length < 20) {
      return HttpResponse.json(
        { error: { code: 'invalid_input' } },
        { status: 400 },
      );
    }
    const idx = refundStore.findIndex((r) => r.id === params.id);
    if (idx < 0) {
      return HttpResponse.json(
        { error: { code: 'not_found' } },
        { status: 404 },
      );
    }
    refundStore[idx] = {
      ...refundStore[idx]!,
      status: 'rejected',
      resolvedAt: new Date().toISOString(),
      note: `${refundStore[idx]!.note}\n— Отклонено: ${body.reason}`,
    };
    return HttpResponse.json({ data: refundStore[idx]! });
  }),

  // -- POST /api/payments/bulk-remind --
  http.post('/api/payments/bulk-remind', async ({ request }) => {
    ensureSeeded();
    await delay(200);
    interface Body {
      studentIds?: string[];
      reason?: string;
    }
    const body = (await request.json().catch(() => ({}))) as Body;
    if (!body.studentIds || body.studentIds.length === 0) {
      return HttpResponse.json(
        { error: { code: 'invalid_input' } },
        { status: 400 },
      );
    }
    if (body.studentIds.length > 50 && (!body.reason || body.reason.length < 20)) {
      return HttpResponse.json(
        { error: { code: 'reason_required' } },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      data: { sent: body.studentIds.length, jobId: `JOB-${Date.now()}` },
    });
  }),

  // -- POST /api/payments/bulk-export --
  http.post('/api/payments/bulk-export', async ({ request }) => {
    ensureSeeded();
    await delay(140);
    const body = (await request.json().catch(() => ({}))) as { format?: string };
    const format = body.format ?? 'csv';
    return HttpResponse.json({
      data: { jobId: `EXP-${Date.now()}`, format },
    });
  }),
];

// Test helpers (used by reset/debug only)
export function _resetPaymentsStore() {
  paymentsTxStore = [];
  refundStore = [];
}
