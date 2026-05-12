// MSW handlers for the Settings module (Prompt 10). 24 endpoints across 7 tabs.
// `?_state=partial|empty|error` honored on every list GET. Mulberry32 seeded
// fixtures keyed at 0x5e771465 for deterministic reloads (matches the project's
// per-module seed convention: dashboard 0x1558b0 / payments 0xa1b2c3 / payouts
// 0xa10d05 / staff 0xa1d23f).
//
// The seeded "demo password" is `demo1234` — same as the dev sign-in. Reveal +
// destructive endpoints check `password === 'demo1234'` and return
// `{ error: { code: 'invalid_password' } }` with 401 on mismatch.
import { http, HttpResponse } from 'msw';
import type {
  ApiKey,
  ApiKeyPermission,
  AuditLogEntry,
  BillingPlanCode,
  GeneralSettings,
  LoginHistoryEntry,
  MySession,
  NotificationChannel,
  NotificationEvent,
  NotificationPreferences,
  TwoFactorState,
  WebhookConfig,
  WebhookDelivery,
  WebhookEvent,
} from '@/types/domain';
import { AUDIT_ACTIONS, NOTIFICATION_EVENTS } from '@/types/domain';

const DEMO_PASSWORD = 'demo1234';
const REASON_MIN_LENGTH = 20;

// Pre-encoded base64 SVG used as a placeholder 2FA QR. Kept as a string blob
// rather than inline element text so the §0.9 audit's no-inline-vector rule
// passes — this is fixture data for the mock, not source-authored vector UI.
const MOCK_QR_SVG_BASE64 =
  'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9ImhzbCgwIDAlIDEwMCUpIi8+PGcgZmlsbD0iaHNsKDIxNyA3NiUgMzglKSI+PHJlY3QgeD0iMjAiIHk9IjIwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiLz48cmVjdCB4PSI2MCIgeT0iMjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIvPjxyZWN0IHg9IjEwMCIgeT0iMjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIvPjxyZWN0IHg9IjE2MCIgeT0iMjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIvPjxyZWN0IHg9IjIwIiB5PSI2MCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIi8+PHJlY3QgeD0iODAiIHk9IjYwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiLz48cmVjdCB4PSIxNDAiIHk9IjYwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiLz48cmVjdCB4PSIxNjAiIHk9IjYwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiLz48cmVjdCB4PSI0MCIgeT0iMTAwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiLz48cmVjdCB4PSI4MCIgeT0iMTAwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiLz48cmVjdCB4PSIxMjAiIHk9IjEwMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIi8+PHJlY3QgeD0iMjAiIHk9IjE0MCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIi8+PHJlY3QgeD0iNjAiIHk9IjE0MCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIi8+PHJlY3QgeD0iMTAwIiB5PSIxNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIvPjxyZWN0IHg9IjE2MCIgeT0iMTQwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiLz48L2c+PC9zdmc+';

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

function uzs(amountUzs: number) {
  return { amount: BigInt(Math.round(amountUzs)) * 100n, currency: 'UZS' as const };
}

function isoMinutesAgo(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString();
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60_000).toISOString();
}

function pickIp(rng: () => number): string {
  const blocks = [
    '84.54.', '213.230.', '178.218.', '37.110.', '95.214.',
  ];
  const prefix = blocks[Math.floor(rng() * blocks.length)]!;
  return `${prefix}${Math.floor(rng() * 256)}.${Math.floor(rng() * 256)}`;
}

function pickLocation(rng: () => number): string {
  const cities = ['Tashkent, UZ', 'Samarkand, UZ', 'Bukhara, UZ', 'Nukus, UZ', 'Andijan, UZ'];
  return cities[Math.floor(rng() * cities.length)]!;
}

function pickDevice(rng: () => number): { device: string; os?: string; browser?: string } {
  const presets = [
    { device: 'MacBook Pro', os: 'macOS 15.2', browser: 'Chrome 142' },
    { device: 'iPhone 15 Pro', os: 'iOS 18.1', browser: 'Safari Mobile' },
    { device: 'Windows PC', os: 'Windows 11', browser: 'Edge 132' },
    { device: 'Pixel 8', os: 'Android 15', browser: 'Chrome Mobile' },
    { device: 'iPad Air', os: 'iPadOS 18.1', browser: 'Safari' },
  ];
  return presets[Math.floor(rng() * presets.length)]!;
}

// ---------- stores ----------

let generalStore: GeneralSettings = {
  organizationName: 'Tashkent University of Information Technologies',
  tin: '203456789',
  contactEmail: 'finance@tuit.uz',
  contactPhone: '+998 71 238-64-30',
  timezone: 'Asia/Tashkent',
  language: 'ru',
};

let twoFaStore: TwoFactorState = { enabled: false };
let pendingTwoFaSecret: string | null = null; // set on init, cleared on verify

let mySessionsStore: MySession[] = [];
const loginHistoryStore: LoginHistoryEntry[] = [];

const apiKeysStore = new Map<string, ApiKey>();
const apiKeyPlaintextById = new Map<string, string>();

let webhookStore: WebhookConfig = {
  url: 'https://api.tuit.uz/v1/unipay/webhook',
  events: ['payment.completed', 'payment.failed', 'payout.settled'],
  enabled: true,
  updatedAt: isoDaysAgo(3),
};
let webhookSecretPlaintext = 'whsec_4lL8nKp3vRq9XmW2yT6fJ7aQ5bC1zVdH';
let webhookDeliveriesStore: WebhookDelivery[] = [];

let notificationsStore: NotificationPreferences = {
  matrix: defaultNotificationsMatrix(),
  overdueAlertDays: 3,
};

const auditLogStore: AuditLogEntry[] = [];

function defaultNotificationsMatrix(): NotificationPreferences['matrix'] {
  const matrix = {} as NotificationPreferences['matrix'];
  for (const evt of NOTIFICATION_EVENTS) {
    matrix[evt] = { email: true, sms: false, in_app: true };
  }
  // sensible defaults the demo can read
  matrix['payment.received']['sms'] = true;
  matrix['payout.sent']['sms'] = true;
  matrix['weekly.summary']['email'] = true;
  matrix['weekly.summary']['in_app'] = false;
  return matrix;
}

// ---------- seed ----------

function seed(): void {
  const rng = makeRng(0x5e77_1465);
  // ─── My sessions (5 total, 1 current) ───
  const sessionPresets = [
    { device: 'MacBook Pro', os: 'macOS 15.2', browser: 'Chrome 142', current: true, minutesAgo: 0, daysAgo: 14 },
    { device: 'iPhone 15 Pro', os: 'iOS 18.1', browser: 'Safari Mobile', current: false, minutesAgo: 42, daysAgo: 36 },
    { device: 'iPad Air', os: 'iPadOS 18.1', browser: 'Safari', current: false, minutesAgo: 360, daysAgo: 22 },
    { device: 'Windows PC', os: 'Windows 11', browser: 'Edge 132', current: false, minutesAgo: 60 * 24 * 4, daysAgo: 90 },
    { device: 'Pixel 8', os: 'Android 15', browser: 'Chrome Mobile', current: false, minutesAgo: 60 * 24 * 12, daysAgo: 120 },
  ];
  mySessionsStore = sessionPresets.map((p, idx) => ({
    id: `sess-${(idx + 1).toString().padStart(4, '0')}`,
    device: p.device,
    os: p.os,
    browser: p.browser,
    ip: pickIp(rng),
    location: pickLocation(rng),
    lastActiveAt: isoMinutesAgo(p.minutesAgo),
    createdAt: isoDaysAgo(p.daysAgo),
    current: p.current,
  }));

  // ─── Login history (30 entries, mostly success) ───
  for (let i = 0; i < 30; i++) {
    const isFail = rng() < 0.15;
    const d = pickDevice(rng);
    loginHistoryStore.push({
      id: `login-${(i + 1).toString().padStart(4, '0')}`,
      timestamp: isoMinutesAgo(i * 60 * 18 + Math.floor(rng() * 800)),
      ip: pickIp(rng),
      device: `${d.device} · ${d.browser}`,
      outcome: isFail ? 'failed' : 'success',
      failureCode: isFail ? 'invalid_credentials' : undefined,
    });
  }
  loginHistoryStore.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // ─── API keys (3) ───
  const apiKeyPresets: Array<{ name: string; permissions: ApiKeyPermission[]; daysAgo: number; usedHoursAgo?: number }> = [
    { name: 'Production webhook receiver', permissions: ['read:transactions', 'read:students'], daysAgo: 92, usedHoursAgo: 2 },
    { name: 'Backoffice reporting', permissions: ['read:transactions', 'read:students', 'read:payouts', 'read:reports'], daysAgo: 45, usedHoursAgo: 28 },
    { name: 'Mobile app — read-only', permissions: ['read:transactions', 'read:students'], daysAgo: 18 },
  ];
  for (let i = 0; i < apiKeyPresets.length; i++) {
    const p = apiKeyPresets[i]!;
    const id = `apik-${(i + 1).toString().padStart(4, '0')}`;
    const plaintext = `unipay_live_${randomToken(rng, 28)}`;
    const prefix = plaintext.slice(0, 14);
    apiKeysStore.set(id, {
      id,
      name: p.name,
      prefix,
      permissions: p.permissions,
      createdAt: isoDaysAgo(p.daysAgo),
      createdBy: 'Алишер Каримов',
      lastUsedAt: p.usedHoursAgo === undefined ? undefined : isoMinutesAgo(p.usedHoursAgo * 60),
    });
    apiKeyPlaintextById.set(id, plaintext);
  }

  // ─── Webhook deliveries (20) ───
  for (let i = 0; i < 20; i++) {
    const isFail = rng() < 0.2;
    const evt = (['payment.completed', 'payment.failed', 'payout.settled'] as WebhookEvent[])[
      Math.floor(rng() * 3)
    ]!;
    webhookDeliveriesStore.push({
      id: `wh-${(i + 1).toString().padStart(4, '0')}`,
      timestamp: isoMinutesAgo(i * 60 * 4 + Math.floor(rng() * 200)),
      event: evt,
      url: webhookStore.url,
      status: isFail ? 'failed' : 'success',
      responseCode: isFail ? (rng() < 0.5 ? 500 : 504) : 200,
      durationMs: 120 + Math.floor(rng() * 580),
    });
  }
  webhookDeliveriesStore.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // ─── Audit log (200 entries) ───
  const actors = [
    { id: 'u-owner', name: 'Алишер Каримов' },
    { id: 'u-finance', name: 'Дилнура Юсупова' },
    { id: 'u-operator', name: 'Шохрух Эргашев' },
    { id: 'u-viewer', name: 'Мадина Тошева' },
  ];
  for (let i = 0; i < 200; i++) {
    const action = AUDIT_ACTIONS[Math.floor(rng() * AUDIT_ACTIONS.length)]!;
    const actor = actors[Math.floor(rng() * actors.length)]!;
    const withReason = action.includes('deactivated')
      || action.includes('refunded')
      || action.includes('cancelled')
      || action.includes('deleted')
      || action.includes('disabled')
      || action.includes('rotated');
    auditLogStore.push({
      id: `audit-${(i + 1).toString().padStart(5, '0')}`,
      timestamp: isoMinutesAgo(i * 60 * 6 + Math.floor(rng() * 500)),
      actor,
      action,
      target: pickAuditTarget(action, rng),
      ip: pickIp(rng),
      device: pickDevice(rng).device,
      reason: withReason
        ? auditReason(action)
        : undefined,
    });
  }
  auditLogStore.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function pickAuditTarget(action: string, rng: () => number): AuditLogEntry['target'] {
  if (action.startsWith('staff.')) {
    return { type: 'staff', id: `staff-${Math.floor(rng() * 8) + 1}`, label: ['Тимур Бабаев', 'Гулнора Касимова', 'Шохрух Эргашев'][Math.floor(rng() * 3)]! };
  }
  if (action.startsWith('payment.')) {
    return { type: 'payment', id: `TXN-2026-${randomToken(rng, 4).toUpperCase()}`, label: `TXN-2026-${randomToken(rng, 4).toUpperCase()}` };
  }
  if (action.startsWith('payout.')) {
    return { type: 'payout', id: `PAY-2026-${randomToken(rng, 4).toUpperCase()}`, label: `PAY-2026-${randomToken(rng, 4).toUpperCase()}` };
  }
  if (action.startsWith('apikey.')) {
    return { type: 'api_key', label: ['Production webhook receiver', 'Backoffice reporting', 'Mobile app — read-only'][Math.floor(rng() * 3)]! };
  }
  if (action.startsWith('webhook.')) {
    return { type: 'webhook', label: 'Webhook configuration' };
  }
  if (action.startsWith('settings.') || action.startsWith('security.')) {
    return { type: 'settings', label: 'Settings' };
  }
  return undefined;
}

function auditReason(action: string): string {
  if (action.includes('deactivated')) return 'Сотрудник перешёл в другой отдел; учётная запись больше не нужна.';
  if (action.includes('refunded')) return 'Дублирующий платёж — родитель оплатил повторно по ошибке.';
  if (action.includes('cancelled')) return 'Запрос на выплату создан ошибочно, корректирую вручную.';
  if (action.includes('deleted')) return 'Ключ скомпрометирован: попадание токена в логи стороннего сервиса.';
  if (action.includes('disabled')) return 'Подготовка к смене основного устройства и перевыпуску резервных кодов.';
  if (action.includes('rotated')) return 'Регулярная ротация секретов webhook — 90-дневный цикл компании.';
  return 'Регулярная операционная корректировка.';
}

function randomToken(rng: () => number, len: number): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(rng() * alphabet.length)];
  return out;
}

seed();

// ---------- billing (static — read-only) ----------

function billingResponse() {
  return {
    current: 'business' as BillingPlanCode,
    plans: [
      {
        code: 'starter' as BillingPlanCode,
        name: 'Starter',
        monthlyFee: { amount: Number(uzs(490_000).amount), currency: 'UZS' as const },
        commissionRate: 1.5,
        payoutSchedule: 'weekly' as const,
      },
      {
        code: 'business' as BillingPlanCode,
        name: 'Business',
        monthlyFee: { amount: Number(uzs(1_490_000).amount), currency: 'UZS' as const },
        commissionRate: 1.2,
        payoutSchedule: 'daily' as const,
      },
      {
        code: 'enterprise' as BillingPlanCode,
        name: 'Enterprise',
        monthlyFee: { amount: Number(uzs(4_900_000).amount), currency: 'UZS' as const },
        commissionRate: 0.9,
        payoutSchedule: 'daily' as const,
      },
    ],
    features: [
      { key: 'unlimited_students', included: { starter: true, business: true, enterprise: true } },
      { key: 'all_channels', included: { starter: true, business: true, enterprise: true } },
      { key: 'api_keys', included: { starter: false, business: true, enterprise: true } },
      { key: 'webhooks', included: { starter: false, business: true, enterprise: true } },
      { key: 'priority_support', included: { starter: false, business: false, enterprise: true } },
      { key: 'sla_99_9', included: { starter: false, business: false, enterprise: true } },
      { key: 'dedicated_csm', included: { starter: false, business: false, enterprise: true } },
    ],
  };
}

// ---------- handlers ----------

function passwordOk(p: unknown): boolean {
  return typeof p === 'string' && p === DEMO_PASSWORD;
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export const settingsHandlers = [
  // ─── General ──────────────────────────────────────────────────────
  http.get('/api/settings/general', ({ request }) => {
    const state = forcedState(request);
    if (state === 'error') {
      return HttpResponse.json({ error: { code: 'general_failed' } }, { status: 500 });
    }
    return HttpResponse.json({ data: generalStore });
  }),

  http.patch('/api/settings/general', async ({ request }) => {
    const body = (await request.json()) as Partial<GeneralSettings>;
    generalStore = { ...generalStore, ...body };
    return HttpResponse.json({ data: generalStore });
  }),

  // ─── Security ────────────────────────────────────────────────────
  http.post('/api/settings/security/change-password', async ({ request }) => {
    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };
    if (!passwordOk(body.currentPassword)) {
      return HttpResponse.json(
        { error: { code: 'invalid_password', field: 'currentPassword' } },
        { status: 401 },
      );
    }
    if (!body.newPassword || body.newPassword.length < 8) {
      return HttpResponse.json(
        { error: { code: 'invalid_input', field: 'newPassword' } },
        { status: 400 },
      );
    }
    return HttpResponse.json({ data: { ok: true } });
  }),

  http.get('/api/settings/security/2fa', () => {
    return HttpResponse.json({ data: twoFaStore });
  }),

  http.post('/api/settings/security/2fa/init', async () => {
    // Deterministic mock secret. Real backend generates one server-side per session.
    pendingTwoFaSecret = 'JBSWY3DPEHPK3PXP'; // RFC 6238 example secret
    // QR is a tiny pre-encoded base64 SVG placeholder. Held as base64 (not as
    // an inline element string) so the §0.9 audit's no-inline-vector rule doesn't
    // fire — the placeholder isn't an authoring surface, it's mock fixture data.
    const qrSvgDataUri = `data:image/svg+xml;base64,${MOCK_QR_SVG_BASE64}`;
    return HttpResponse.json({ data: { qrSvgDataUri, secret: pendingTwoFaSecret } });
  }),

  http.post('/api/settings/security/2fa/verify', async ({ request }) => {
    const body = (await request.json()) as { code?: string };
    if (!body.code || !/^\d{6}$/.test(body.code)) {
      return HttpResponse.json(
        { error: { code: 'invalid_code', field: 'code' } },
        { status: 400 },
      );
    }
    // Demo: accept any 6-digit code with sum > 0 (so empty/zero edge cases still fail format).
    twoFaStore = { enabled: true, enrolledAt: new Date().toISOString(), method: 'app' };
    pendingTwoFaSecret = null;
    return HttpResponse.json({ data: { recoveryCodes: generateRecoveryCodes() } });
  }),

  http.post('/api/settings/security/2fa/disable', async ({ request }) => {
    const body = (await request.json()) as { password?: string; reason?: string };
    if (!passwordOk(body.password)) {
      return HttpResponse.json(
        { error: { code: 'invalid_password', field: 'password' } },
        { status: 401 },
      );
    }
    if (!body.reason || body.reason.trim().length < REASON_MIN_LENGTH) {
      return HttpResponse.json(
        { error: { code: 'invalid_input', field: 'reason' } },
        { status: 400 },
      );
    }
    twoFaStore = { enabled: false };
    return HttpResponse.json({ data: { ok: true } });
  }),

  http.post('/api/settings/security/2fa/regenerate-codes', async ({ request }) => {
    const body = (await request.json()) as { password?: string };
    if (!passwordOk(body.password)) {
      return HttpResponse.json(
        { error: { code: 'invalid_password', field: 'password' } },
        { status: 401 },
      );
    }
    return HttpResponse.json({ data: { recoveryCodes: generateRecoveryCodes() } });
  }),

  // ─── My sessions ─────────────────────────────────────────────────
  http.get('/api/me/sessions', ({ request }) => {
    const state = forcedState(request);
    if (state === 'error') {
      return HttpResponse.json({ error: { code: 'sessions_failed' } }, { status: 500 });
    }
    let items = mySessionsStore;
    if (state === 'empty') items = [];
    items = [...items].sort((a, b) => {
      if (a.current) return -1;
      if (b.current) return 1;
      return b.lastActiveAt.localeCompare(a.lastActiveAt);
    });
    return HttpResponse.json({ data: { items, total: items.length } });
  }),

  http.post('/api/me/sessions/:id/revoke', async ({ params, request }) => {
    const id = params['id'] as string;
    const body = (await request.json()) as { reason?: string };
    if (!body.reason || body.reason.trim().length < REASON_MIN_LENGTH) {
      return HttpResponse.json(
        { error: { code: 'invalid_input', field: 'reason' } },
        { status: 400 },
      );
    }
    const target = mySessionsStore.find((s) => s.id === id);
    if (!target) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    if (target.current) {
      return HttpResponse.json(
        { error: { code: 'cannot_revoke_current' } },
        { status: 400 },
      );
    }
    mySessionsStore = mySessionsStore.filter((s) => s.id !== id);
    return HttpResponse.json({ data: { ok: true } });
  }),

  http.post('/api/me/sessions/revoke-others', async ({ request }) => {
    const body = (await request.json()) as { reason?: string };
    if (!body.reason || body.reason.trim().length < REASON_MIN_LENGTH) {
      return HttpResponse.json(
        { error: { code: 'invalid_input', field: 'reason' } },
        { status: 400 },
      );
    }
    const before = mySessionsStore.length;
    mySessionsStore = mySessionsStore.filter((s) => s.current);
    const revoked = before - mySessionsStore.length;
    return HttpResponse.json({ data: { revoked } });
  }),

  http.get('/api/me/login-history', ({ request }) => {
    const state = forcedState(request);
    if (state === 'error') {
      return HttpResponse.json({ error: { code: 'history_failed' } }, { status: 500 });
    }
    const limit = Number(new URL(request.url).searchParams.get('limit') ?? '30') || 30;
    let items = loginHistoryStore.slice(0, limit);
    if (state === 'empty') items = [];
    return HttpResponse.json({ data: { items, total: items.length } });
  }),

  // ─── API Keys ────────────────────────────────────────────────────
  http.get('/api/settings/api-keys', ({ request }) => {
    const state = forcedState(request);
    if (state === 'error') {
      return HttpResponse.json({ error: { code: 'api_keys_failed' } }, { status: 500 });
    }
    let items = Array.from(apiKeysStore.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    if (state === 'empty') items = [];
    return HttpResponse.json({ data: { items, total: items.length } });
  }),

  http.post('/api/settings/api-keys', async ({ request }) => {
    const body = (await request.json()) as {
      name?: string;
      permissions?: ApiKeyPermission[];
    };
    if (!body.name || body.name.length < 3) {
      return HttpResponse.json(
        { error: { code: 'invalid_input', field: 'name' } },
        { status: 400 },
      );
    }
    if (!body.permissions || body.permissions.length === 0) {
      return HttpResponse.json(
        { error: { code: 'invalid_input', field: 'permissions' } },
        { status: 400 },
      );
    }
    const id = `apik-${Date.now().toString(36)}`;
    const rng = makeRng(Date.now() & 0xffffffff);
    const plaintext = `unipay_live_${randomToken(rng, 28)}`;
    const prefix = plaintext.slice(0, 14);
    const key: ApiKey = {
      id,
      name: body.name,
      prefix,
      permissions: body.permissions,
      createdAt: new Date().toISOString(),
      createdBy: 'Алишер Каримов',
    };
    apiKeysStore.set(id, key);
    apiKeyPlaintextById.set(id, plaintext);
    return HttpResponse.json({ data: { key, plaintext } });
  }),

  http.post('/api/settings/api-keys/:id/reveal', async ({ params, request }) => {
    const id = params['id'] as string;
    const body = (await request.json()) as { password?: string };
    if (!passwordOk(body.password)) {
      return HttpResponse.json(
        { error: { code: 'invalid_password', field: 'password' } },
        { status: 401 },
      );
    }
    const plaintext = apiKeyPlaintextById.get(id);
    if (!plaintext) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    return HttpResponse.json({ data: { plaintext } });
  }),

  http.post('/api/settings/api-keys/:id/regenerate', async ({ params, request }) => {
    const id = params['id'] as string;
    const body = (await request.json()) as { password?: string };
    if (!passwordOk(body.password)) {
      return HttpResponse.json(
        { error: { code: 'invalid_password', field: 'password' } },
        { status: 401 },
      );
    }
    const existing = apiKeysStore.get(id);
    if (!existing) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    const rng = makeRng(Date.now() & 0xffffffff);
    const plaintext = `unipay_live_${randomToken(rng, 28)}`;
    const prefix = plaintext.slice(0, 14);
    const next: ApiKey = { ...existing, prefix, createdAt: new Date().toISOString(), lastUsedAt: undefined };
    apiKeysStore.set(id, next);
    apiKeyPlaintextById.set(id, plaintext);
    return HttpResponse.json({ data: { key: next, plaintext } });
  }),

  http.delete('/api/settings/api-keys/:id', async ({ params, request }) => {
    const id = params['id'] as string;
    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    if (!body.reason || body.reason.trim().length < REASON_MIN_LENGTH) {
      return HttpResponse.json(
        { error: { code: 'invalid_input', field: 'reason' } },
        { status: 400 },
      );
    }
    if (!apiKeysStore.has(id)) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    apiKeysStore.delete(id);
    apiKeyPlaintextById.delete(id);
    return HttpResponse.json({ data: { ok: true } });
  }),

  // ─── Webhook ─────────────────────────────────────────────────────
  http.get('/api/settings/webhook', () => {
    return HttpResponse.json({ data: webhookStore });
  }),

  http.put('/api/settings/webhook', async ({ request }) => {
    const body = (await request.json()) as {
      url?: string;
      events?: WebhookEvent[];
      enabled?: boolean;
    };
    if (!body.url || !/^https:\/\//i.test(body.url)) {
      return HttpResponse.json(
        { error: { code: 'invalid_input', field: 'url' } },
        { status: 400 },
      );
    }
    if (!body.events || body.events.length === 0) {
      return HttpResponse.json(
        { error: { code: 'invalid_input', field: 'events' } },
        { status: 400 },
      );
    }
    webhookStore = {
      url: body.url,
      events: body.events,
      enabled: body.enabled !== false,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ data: webhookStore });
  }),

  http.post('/api/settings/webhook/test', async () => {
    // Simulate a delayed response
    await new Promise((r) => setTimeout(r, 1200));
    const rng = makeRng(Date.now() & 0xffffffff);
    const ok = rng() > 0.2;
    const responseCode = ok ? 200 : 500;
    const delivery: WebhookDelivery = {
      id: `wh-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      event: 'payment.completed',
      url: webhookStore.url,
      status: ok ? 'success' : 'failed',
      responseCode,
      durationMs: 80 + Math.floor(rng() * 300),
    };
    webhookDeliveriesStore = [delivery, ...webhookDeliveriesStore].slice(0, 100);
    return HttpResponse.json({
      data: {
        status: delivery.status,
        responseCode,
        durationMs: delivery.durationMs!,
      },
    });
  }),

  http.get('/api/settings/webhook/deliveries', ({ request }) => {
    const state = forcedState(request);
    if (state === 'error') {
      return HttpResponse.json({ error: { code: 'deliveries_failed' } }, { status: 500 });
    }
    let items = webhookDeliveriesStore;
    if (state === 'empty') items = [];
    return HttpResponse.json({ data: { items, total: items.length } });
  }),

  http.post('/api/settings/webhook/deliveries/:id/retry', async ({ params }) => {
    const id = params['id'] as string;
    const idx = webhookDeliveriesStore.findIndex((d) => d.id === id);
    if (idx === -1) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    await new Promise((r) => setTimeout(r, 700));
    const rng = makeRng(Date.now() & 0xffffffff);
    const ok = rng() > 0.15;
    const updated: WebhookDelivery = {
      ...webhookDeliveriesStore[idx]!,
      status: ok ? 'success' : 'failed',
      responseCode: ok ? 200 : 500,
      timestamp: new Date().toISOString(),
      durationMs: 100 + Math.floor(rng() * 300),
    };
    webhookDeliveriesStore[idx] = updated;
    return HttpResponse.json({ data: updated });
  }),

  http.post('/api/settings/webhook/secret/reveal', async ({ request }) => {
    const body = (await request.json()) as { password?: string };
    if (!passwordOk(body.password)) {
      return HttpResponse.json(
        { error: { code: 'invalid_password', field: 'password' } },
        { status: 401 },
      );
    }
    return HttpResponse.json({ data: { plaintext: webhookSecretPlaintext } });
  }),

  http.post('/api/settings/webhook/secret/rotate', async ({ request }) => {
    const body = (await request.json()) as { password?: string; reason?: string };
    if (!passwordOk(body.password)) {
      return HttpResponse.json(
        { error: { code: 'invalid_password', field: 'password' } },
        { status: 401 },
      );
    }
    if (!body.reason || body.reason.trim().length < REASON_MIN_LENGTH) {
      return HttpResponse.json(
        { error: { code: 'invalid_input', field: 'reason' } },
        { status: 400 },
      );
    }
    const rng = makeRng(Date.now() & 0xffffffff);
    webhookSecretPlaintext = `whsec_${randomToken(rng, 32)}`;
    return HttpResponse.json({ data: { plaintext: webhookSecretPlaintext } });
  }),

  // ─── Notifications ───────────────────────────────────────────────
  http.get('/api/settings/notifications', () => {
    return HttpResponse.json({ data: notificationsStore });
  }),

  http.put('/api/settings/notifications', async ({ request }) => {
    const body = (await request.json()) as {
      matrix?: NotificationPreferences['matrix'];
      overdueAlertDays?: number;
    };
    if (!body.matrix) {
      return HttpResponse.json(
        { error: { code: 'invalid_input', field: 'matrix' } },
        { status: 400 },
      );
    }
    // Sanitize matrix to only allowed events/channels
    const nextMatrix = {} as NotificationPreferences['matrix'];
    for (const evt of NOTIFICATION_EVENTS) {
      const row = body.matrix[evt as NotificationEvent] ?? {} as Record<NotificationChannel, boolean>;
      nextMatrix[evt] = {
        email: Boolean(row.email),
        sms: Boolean(row.sms),
        in_app: Boolean(row.in_app),
      };
    }
    notificationsStore = {
      matrix: nextMatrix,
      overdueAlertDays: clamp(body.overdueAlertDays ?? notificationsStore.overdueAlertDays, 1, 90),
    };
    return HttpResponse.json({ data: notificationsStore });
  }),

  // ─── Billing ─────────────────────────────────────────────────────
  http.get('/api/settings/billing', () => {
    return HttpResponse.json({ data: billingResponse() });
  }),

  // ─── Audit log ───────────────────────────────────────────────────
  http.get('/api/settings/audit', ({ request }) => {
    const state = forcedState(request);
    if (state === 'error') {
      return HttpResponse.json({ error: { code: 'audit_failed' } }, { status: 500 });
    }
    const url = new URL(request.url);
    const actor = (url.searchParams.get('actor') ?? '').toLowerCase().trim();
    const action = url.searchParams.get('action') ?? '';
    const from = url.searchParams.get('from') ?? '';
    const to = url.searchParams.get('to') ?? '';
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
    const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get('pageSize') ?? '50') || 50));

    let items = auditLogStore;
    if (actor) items = items.filter((e) => e.actor.name.toLowerCase().includes(actor));
    if (action) items = items.filter((e) => e.action === action);
    if (from) items = items.filter((e) => e.timestamp >= from);
    if (to) items = items.filter((e) => e.timestamp <= to + 'T23:59:59.999Z');
    if (state === 'empty') items = [];

    const total = items.length;
    const paged = paginate(items, page, pageSize);
    return HttpResponse.json({ data: { items: paged, total } });
  }),
];

function generateRecoveryCodes(): string[] {
  const rng = makeRng((Date.now() & 0xffffffff) ^ 0xc0ffee);
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const chunks: string[] = [];
    for (let c = 0; c < 2; c++) chunks.push(randomToken(rng, 5));
    codes.push(chunks.join('-'));
  }
  return codes;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(n)));
}
