import { http, HttpResponse } from 'msw';
import type {
  Role,
  StaffActivityAction,
  StaffActivityEntry,
  StaffMember,
  StaffSession,
  StaffStatus,
} from '@/types/domain';
import { ROLE_PERMISSIONS } from '@/types/domain';

type ForcedState = 'partial' | 'empty' | 'error' | null;

function forcedState(request: Request): ForcedState {
  const v = new URL(request.url).searchParams.get('_state');
  if (v === 'partial' || v === 'empty' || v === 'error') return v;
  return null;
}

function isoDaysAgo(days: number, hours = 0, minutes = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  d.setMinutes(d.getMinutes() - minutes);
  return d.toISOString();
}

// ----- staff store: 1 owner + 2 finance + 3 operators + 1 viewer + 2 pending invites -----

let staffStore: StaffMember[] = [
  {
    id: 'u-owner',
    email: 'owner@unipay.dev',
    fullName: 'Алишер Каримов',
    phone: '+998 90 100-10-10',
    locale: 'ru',
    timezone: 'Asia/Tashkent',
    role: 'owner',
    status: 'active',
    departmentIds: [],
    createdAt: isoDaysAgo(420),
    lastLoginAt: isoDaysAgo(0, 2),
    isOwner: true,
  },
  {
    id: 'u-fin-1',
    email: 'finance@unipay.dev',
    fullName: 'Дилнура Юсупова',
    phone: '+998 90 200-20-20',
    locale: 'ru',
    timezone: 'Asia/Tashkent',
    role: 'finance_manager',
    status: 'active',
    departmentIds: [],
    createdAt: isoDaysAgo(280),
    lastLoginAt: isoDaysAgo(0, 5),
    invitedBy: 'u-owner',
    isOwner: false,
  },
  {
    id: 'u-fin-2',
    email: 'finance2@unipay.dev',
    fullName: 'Тимур Назиров',
    phone: '+998 90 200-21-21',
    locale: 'ru',
    timezone: 'Asia/Tashkent',
    role: 'finance_manager',
    status: 'active',
    departmentIds: [],
    createdAt: isoDaysAgo(180),
    lastLoginAt: isoDaysAgo(1),
    invitedBy: 'u-owner',
    isOwner: false,
  },
  {
    id: 'u-op-1',
    email: 'operator@unipay.dev',
    fullName: 'Шохрух Эргашев',
    phone: '+998 90 300-30-30',
    locale: 'ru',
    timezone: 'Asia/Tashkent',
    role: 'operator',
    status: 'active',
    departmentIds: ['fac-eng', 'fac-econ'],
    createdAt: isoDaysAgo(150),
    lastLoginAt: isoDaysAgo(0, 9),
    invitedBy: 'u-fin-1',
    isOwner: false,
  },
  {
    id: 'u-op-2',
    email: 'sabina@unipay.dev',
    fullName: 'Сабина Камилова',
    phone: '+998 90 300-31-31',
    locale: 'uz',
    timezone: 'Asia/Tashkent',
    role: 'operator',
    status: 'active',
    departmentIds: ['fac-it'],
    createdAt: isoDaysAgo(95),
    lastLoginAt: isoDaysAgo(2),
    invitedBy: 'u-fin-1',
    isOwner: false,
  },
  {
    id: 'u-op-3',
    email: 'dilshod@unipay.dev',
    fullName: 'Дилшод Туляганов',
    phone: '+998 90 300-32-32',
    locale: 'ru',
    timezone: 'Asia/Tashkent',
    role: 'operator',
    status: 'inactive',
    departmentIds: ['fac-econ'],
    createdAt: isoDaysAgo(60),
    lastLoginAt: isoDaysAgo(35),
    invitedBy: 'u-fin-1',
    isOwner: false,
  },
  {
    id: 'u-view-1',
    email: 'viewer@unipay.dev',
    fullName: 'Мадина Тошева',
    locale: 'ru',
    timezone: 'Asia/Tashkent',
    role: 'viewer',
    status: 'active',
    departmentIds: [],
    createdAt: isoDaysAgo(40),
    lastLoginAt: isoDaysAgo(4),
    invitedBy: 'u-owner',
    isOwner: false,
  },
  {
    id: 'inv-1',
    email: 'anna.petrova@example.com',
    fullName: 'Анна Петрова',
    role: 'operator',
    status: 'pending',
    departmentIds: ['fac-it'],
    createdAt: isoDaysAgo(2),
    invitedAt: isoDaysAgo(2),
    invitedBy: 'u-owner',
    isOwner: false,
  },
  {
    id: 'inv-2',
    email: 'student.support@example.com',
    fullName: '',
    role: 'viewer',
    status: 'pending',
    departmentIds: [],
    createdAt: isoDaysAgo(0, 4),
    invitedAt: isoDaysAgo(0, 4),
    invitedBy: 'u-fin-1',
    isOwner: false,
  },
];

// ----- activity log: 30+ entries per active staff, single 'invite_sent' for pending -----

let activityCounter = 0;
function pushActivity(
  staffId: string,
  action: StaffActivityAction,
  partial: { target?: string; ip?: string; device?: string; daysAgo?: number; hoursAgo?: number; minutesAgo?: number } = {}
): StaffActivityEntry {
  activityCounter += 1;
  return {
    id: `act-${activityCounter}`,
    staffId,
    action,
    target: partial.target,
    ip: partial.ip,
    device: partial.device,
    createdAt: isoDaysAgo(partial.daysAgo ?? 0, partial.hoursAgo ?? 0, partial.minutesAgo ?? 0),
  };
}

const DEVICES = [
  'macOS · Chrome 134',
  'macOS · Safari 17',
  'Windows · Edge 134',
  'iOS · Safari Mobile',
  'Android · Chrome Mobile',
];
const IP_POOL = [
  '85.140.32.18',
  '109.226.144.7',
  '178.218.96.21',
  '5.45.207.155',
  '195.158.7.42',
];

function rotatingDevice(seed: number): string {
  return DEVICES[seed % DEVICES.length]!;
}
function rotatingIp(seed: number): string {
  return IP_POOL[seed % IP_POOL.length]!;
}

function seedActivityFor(staffId: string, count: number): StaffActivityEntry[] {
  const actions: StaffActivityAction[] = [
    'login',
    'student_added',
    'transaction_created',
    'report_exported',
    'access_changed',
    'login',
    'contact_updated',
    'login',
  ];
  const out: StaffActivityEntry[] = [];
  for (let i = 0; i < count; i++) {
    const action = actions[i % actions.length]!;
    out.push(
      pushActivity(staffId, action, {
        target:
          action === 'student_added'
            ? `Студент ${(i % 9) + 1}`
            : action === 'transaction_created'
              ? `TX-2026-04-${100 + i}`
              : action === 'report_exported'
                ? `Отчёт за ${['март', 'февраль', 'январь'][i % 3]} 2026`
                : action === 'access_changed'
                  ? `Подразделение ${(i % 5) + 1}`
                  : undefined,
        ip: rotatingIp(i),
        device: rotatingDevice(i),
        daysAgo: Math.floor(i / 4),
        hoursAgo: (i * 3) % 24,
      })
    );
  }
  return out;
}

let activityStore: StaffActivityEntry[] = [
  ...seedActivityFor('u-owner', 32),
  ...seedActivityFor('u-fin-1', 30),
  ...seedActivityFor('u-fin-2', 30),
  ...seedActivityFor('u-op-1', 34),
  ...seedActivityFor('u-op-2', 28),
  ...seedActivityFor('u-op-3', 12),
  ...seedActivityFor('u-view-1', 18),
  pushActivity('inv-1', 'invite_sent', { daysAgo: 2 }),
  pushActivity('inv-2', 'invite_sent', { daysAgo: 0, hoursAgo: 4 }),
];

// ----- sessions store: 2-3 active sessions per active staff -----

let sessionCounter = 0;
function makeSession(
  staffId: string,
  partial: Partial<StaffSession> & { device: string; ip: string }
): StaffSession {
  sessionCounter += 1;
  return {
    id: `sess-${sessionCounter}`,
    staffId,
    device: partial.device,
    os: partial.os,
    browser: partial.browser,
    ip: partial.ip,
    location: partial.location,
    lastActiveAt: partial.lastActiveAt ?? isoDaysAgo(0, 1),
    createdAt: partial.createdAt ?? isoDaysAgo(5),
    current: partial.current ?? false,
  };
}

let sessionsStore: StaffSession[] = [
  makeSession('u-owner', { device: 'MacBook Pro', os: 'macOS 14', browser: 'Chrome 134', ip: '85.140.32.18', location: 'Tashkent, UZ', lastActiveAt: isoDaysAgo(0, 0, 12), createdAt: isoDaysAgo(7), current: true }),
  makeSession('u-owner', { device: 'iPhone 15', os: 'iOS 17', browser: 'Safari Mobile', ip: '178.218.96.21', location: 'Tashkent, UZ', lastActiveAt: isoDaysAgo(0, 6), createdAt: isoDaysAgo(14) }),
  makeSession('u-owner', { device: 'iPad Air', os: 'iPadOS 17', browser: 'Safari', ip: '195.158.7.42', location: 'Samarkand, UZ', lastActiveAt: isoDaysAgo(3), createdAt: isoDaysAgo(60) }),
  makeSession('u-fin-1', { device: 'Dell XPS 13', os: 'Windows 11', browser: 'Edge 134', ip: '109.226.144.7', location: 'Tashkent, UZ', lastActiveAt: isoDaysAgo(0, 5), createdAt: isoDaysAgo(20), current: true }),
  makeSession('u-fin-1', { device: 'Pixel 8', os: 'Android 14', browser: 'Chrome Mobile', ip: '5.45.207.155', location: 'Tashkent, UZ', lastActiveAt: isoDaysAgo(1), createdAt: isoDaysAgo(30) }),
  makeSession('u-fin-2', { device: 'MacBook Air', os: 'macOS 14', browser: 'Safari 17', ip: '85.140.32.19', location: 'Tashkent, UZ', lastActiveAt: isoDaysAgo(1), createdAt: isoDaysAgo(15), current: true }),
  makeSession('u-op-1', { device: 'MacBook Pro', os: 'macOS 14', browser: 'Chrome 134', ip: '178.218.96.21', location: 'Tashkent, UZ', lastActiveAt: isoDaysAgo(0, 9), createdAt: isoDaysAgo(40), current: true }),
  makeSession('u-op-1', { device: 'iPhone 13', os: 'iOS 17', browser: 'Safari Mobile', ip: '195.158.7.42', location: 'Bukhara, UZ', lastActiveAt: isoDaysAgo(2), createdAt: isoDaysAgo(50) }),
  makeSession('u-op-2', { device: 'Surface Laptop', os: 'Windows 11', browser: 'Edge 134', ip: '109.226.144.8', location: 'Tashkent, UZ', lastActiveAt: isoDaysAgo(2), createdAt: isoDaysAgo(25), current: true }),
  makeSession('u-view-1', { device: 'MacBook Pro', os: 'macOS 14', browser: 'Chrome 134', ip: '5.45.207.155', location: 'Tashkent, UZ', lastActiveAt: isoDaysAgo(4), createdAt: isoDaysAgo(35), current: true }),
];

// ----- handlers -----

export const staffHandlers = [
  http.get('/api/staff', ({ request }) => {
    const state = forcedState(request);
    if (state === 'error') {
      return HttpResponse.json({ error: { code: 'staff_list_failed' } }, { status: 500 });
    }
    if (state === 'empty') {
      return HttpResponse.json({ data: { items: [], page: 1, pageSize: 50, total: 0 } });
    }
    const url = new URL(request.url);
    const role = url.searchParams.get('role') as Role | null;
    const status = url.searchParams.get('status') as StaffStatus | null;
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get('pageSize') ?? '50')));

    let filtered = [...staffStore];
    if (role) filtered = filtered.filter((s) => s.role === role);
    if (status) filtered = filtered.filter((s) => s.status === status);
    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.fullName.toLowerCase().includes(search) ||
          s.email.toLowerCase().includes(search)
      );
    }
    // Pending invites sort to the top, then by createdAt desc.
    filtered.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    if (state === 'partial') {
      const shown = Math.max(1, Math.floor(items.length * 0.6));
      return HttpResponse.json({
        data: {
          items: items.slice(0, shown),
          page,
          pageSize,
          total,
          _meta: { partial: true, shown, total },
        },
      });
    }

    return HttpResponse.json({
      data: { items, page, pageSize, total },
    });
  }),

  http.get('/api/staff/:id', ({ params }) => {
    const id = params['id'] as string;
    const member = staffStore.find((s) => s.id === id);
    if (!member) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    return HttpResponse.json({
      data: {
        ...member,
        permissions: ROLE_PERMISSIONS[member.role],
      },
    });
  }),

  http.get('/api/staff/:id/activity', ({ params, request }) => {
    const state = forcedState(request);
    if (state === 'error') {
      return HttpResponse.json({ error: { code: 'activity_failed' } }, { status: 500 });
    }
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get('pageSize') ?? '20')));
    const action = url.searchParams.get('action') as StaffActivityAction | null;
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    let all = activityStore
      .filter((a) => a.staffId === params['id'])
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (action) all = all.filter((a) => a.action === action);
    if (from) all = all.filter((a) => a.createdAt >= from);
    if (to) all = all.filter((a) => a.createdAt <= to);

    if (state === 'empty') {
      return HttpResponse.json({ data: { items: [], page: 1, pageSize, total: 0 } });
    }
    const total = all.length;
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);
    if (state === 'partial') {
      const shown = Math.max(1, Math.floor(items.length * 0.5));
      return HttpResponse.json({
        data: {
          items: items.slice(0, shown),
          page,
          pageSize,
          total,
          _meta: { partial: true, shown, total },
        },
      });
    }
    return HttpResponse.json({
      data: { items, page, pageSize, total },
    });
  }),

  http.get('/api/staff/:id/sessions', ({ params, request }) => {
    const state = forcedState(request);
    if (state === 'error') {
      return HttpResponse.json({ error: { code: 'sessions_failed' } }, { status: 500 });
    }
    const id = params['id'] as string;
    if (!staffStore.find((s) => s.id === id)) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    let items = sessionsStore.filter((s) => s.staffId === id);
    if (state === 'empty') items = [];
    items = [...items].sort((a, b) => {
      if (a.current) return -1;
      if (b.current) return 1;
      return b.lastActiveAt.localeCompare(a.lastActiveAt);
    });
    return HttpResponse.json({
      data: { items, total: items.length },
    });
  }),

  http.post('/api/staff/invite', async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      fullName?: string;
      role?: Role;
      departmentIds?: string[];
      note?: string;
    };
    if (!body.email || !body.role) {
      return HttpResponse.json(
        { error: { code: 'invalid_input' } },
        { status: 400 }
      );
    }
    if (staffStore.some((s) => s.email.toLowerCase() === body.email!.toLowerCase())) {
      return HttpResponse.json(
        { error: { code: 'email_already_used' } },
        { status: 409 }
      );
    }
    const id = `inv-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const created: StaffMember = {
      id,
      email: body.email,
      fullName: body.fullName ?? '',
      role: body.role,
      status: 'pending',
      departmentIds: body.departmentIds ?? [],
      createdAt: now,
      invitedAt: now,
      invitedBy: 'u-owner',
      isOwner: false,
    };
    staffStore = [created, ...staffStore];
    activityStore = [
      ...activityStore,
      { id: `act-${Date.now()}`, staffId: id, action: 'invite_sent', createdAt: now },
    ];
    return HttpResponse.json({ data: created });
  }),

  http.patch('/api/staff/:id', async ({ params, request }) => {
    const id = params['id'] as string;
    const body = (await request.json()) as {
      role?: Role;
      departmentIds?: string[];
      fullName?: string;
      phone?: string;
      email?: string;
      locale?: 'ru' | 'uz';
      timezone?: string;
      reason?: string;
    };
    const idx = staffStore.findIndex((s) => s.id === id);
    if (idx === -1) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    const existing = staffStore[idx]!;
    if (existing.isOwner && body.role && body.role !== 'owner') {
      return HttpResponse.json(
        { error: { code: 'owner_role_locked' } },
        { status: 403 }
      );
    }
    const updated: StaffMember = {
      ...existing,
      ...(body.role !== undefined ? { role: body.role } : {}),
      ...(body.departmentIds !== undefined ? { departmentIds: body.departmentIds } : {}),
      ...(body.fullName !== undefined ? { fullName: body.fullName } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.locale !== undefined ? { locale: body.locale } : {}),
      ...(body.timezone !== undefined ? { timezone: body.timezone } : {}),
    };
    staffStore[idx] = updated;
    const now = new Date().toISOString();
    if (body.role !== undefined && body.role !== existing.role) {
      activityStore = [
        ...activityStore,
        {
          id: `act-${Date.now()}`,
          staffId: id,
          action: 'role_changed',
          target: existing.fullName || existing.email,
          createdAt: now,
        },
      ];
    } else if (body.departmentIds !== undefined) {
      activityStore = [
        ...activityStore,
        {
          id: `act-${Date.now()}`,
          staffId: id,
          action: 'access_changed',
          target: existing.fullName || existing.email,
          createdAt: now,
        },
      ];
    } else if (body.email !== undefined || body.phone !== undefined) {
      activityStore = [
        ...activityStore,
        {
          id: `act-${Date.now()}`,
          staffId: id,
          action: 'contact_updated',
          createdAt: now,
        },
      ];
    }
    return HttpResponse.json({ data: updated });
  }),

  http.post('/api/staff/:id/deactivate', async ({ params, request }) => {
    const id = params['id'] as string;
    const body = (await request.json()) as { reason?: string };
    if (!body.reason || body.reason.trim().length < 20) {
      return HttpResponse.json(
        { error: { code: 'reason_too_short' } },
        { status: 400 }
      );
    }
    const idx = staffStore.findIndex((s) => s.id === id);
    if (idx === -1) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    if (staffStore[idx]!.isOwner) {
      return HttpResponse.json(
        { error: { code: 'owner_locked' } },
        { status: 403 }
      );
    }
    const updated: StaffMember = { ...staffStore[idx]!, status: 'inactive' };
    staffStore[idx] = updated;
    activityStore = [
      ...activityStore,
      {
        id: `act-${Date.now()}`,
        staffId: id,
        action: 'deactivated',
        createdAt: new Date().toISOString(),
      },
    ];
    return HttpResponse.json({ data: updated });
  }),

  http.post('/api/staff/:id/reactivate', ({ params }) => {
    const id = params['id'] as string;
    const idx = staffStore.findIndex((s) => s.id === id);
    if (idx === -1) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    const updated: StaffMember = { ...staffStore[idx]!, status: 'active' };
    staffStore[idx] = updated;
    activityStore = [
      ...activityStore,
      {
        id: `act-${Date.now()}`,
        staffId: id,
        action: 'reactivated',
        createdAt: new Date().toISOString(),
      },
    ];
    return HttpResponse.json({ data: updated });
  }),

  http.post('/api/staff/:id/reset-password', ({ params }) => {
    const id = params['id'] as string;
    if (!staffStore.some((s) => s.id === id)) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    activityStore = [
      ...activityStore,
      {
        id: `act-${Date.now()}`,
        staffId: id,
        action: 'password_reset',
        createdAt: new Date().toISOString(),
      },
    ];
    return HttpResponse.json({ data: { ok: true } });
  }),

  http.post('/api/staff/:id/resend-invite', ({ params }) => {
    const id = params['id'] as string;
    const idx = staffStore.findIndex((s) => s.id === id);
    if (idx === -1) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    const now = new Date().toISOString();
    const updated: StaffMember = { ...staffStore[idx]!, invitedAt: now };
    staffStore[idx] = updated;
    activityStore = [
      ...activityStore,
      { id: `act-${Date.now()}`, staffId: id, action: 'invite_resent', createdAt: now },
    ];
    return HttpResponse.json({ data: updated });
  }),

  http.delete('/api/staff/:id/invite', ({ params }) => {
    const id = params['id'] as string;
    const idx = staffStore.findIndex((s) => s.id === id);
    if (idx === -1) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    if (staffStore[idx]!.status !== 'pending') {
      return HttpResponse.json(
        { error: { code: 'not_a_pending_invite' } },
        { status: 400 }
      );
    }
    activityStore = [
      ...activityStore,
      {
        id: `act-${Date.now()}`,
        staffId: id,
        action: 'invite_cancelled',
        createdAt: new Date().toISOString(),
      },
    ];
    staffStore = staffStore.filter((s) => s.id !== id);
    return HttpResponse.json({ data: { ok: true } });
  }),

  // ----- DELETE /api/staff/:id (account delete, 2-step) -----
  http.delete('/api/staff/:id', async ({ params, request }) => {
    const id = params['id'] as string;
    const body = (await request.json()) as { reason?: string; emailConfirm?: string };
    const idx = staffStore.findIndex((s) => s.id === id);
    if (idx === -1) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    const existing = staffStore[idx]!;
    if (existing.isOwner) {
      return HttpResponse.json(
        { error: { code: 'owner_locked' } },
        { status: 403 }
      );
    }
    if (!body.reason || body.reason.trim().length < 20) {
      return HttpResponse.json(
        { error: { code: 'reason_too_short' } },
        { status: 400 }
      );
    }
    if (
      !body.emailConfirm ||
      body.emailConfirm.trim().toLowerCase() !== existing.email.toLowerCase()
    ) {
      return HttpResponse.json(
        { error: { code: 'email_mismatch' } },
        { status: 400 }
      );
    }
    // Activity entries preserved (per spec); only remove the staff record + sessions.
    staffStore = staffStore.filter((s) => s.id !== id);
    sessionsStore = sessionsStore.filter((s) => s.staffId !== id);
    return HttpResponse.json({ data: { ok: true } });
  }),

  // ----- POST /api/staff/:id/transfer-ownership -----
  http.post('/api/staff/:id/transfer-ownership', async ({ params, request }) => {
    const id = params['id'] as string;
    const body = (await request.json()) as { reason?: string; confirmPhrase?: string };
    if (!body.reason || body.reason.trim().length < 20) {
      return HttpResponse.json(
        { error: { code: 'reason_too_short' } },
        { status: 400 }
      );
    }
    if (body.confirmPhrase !== 'TRANSFER') {
      return HttpResponse.json(
        { error: { code: 'phrase_mismatch' } },
        { status: 400 }
      );
    }
    const recipientIdx = staffStore.findIndex((s) => s.id === id);
    if (recipientIdx === -1) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    const recipient = staffStore[recipientIdx]!;
    if (recipient.isOwner) {
      return HttpResponse.json(
        { error: { code: 'already_owner' } },
        { status: 400 }
      );
    }
    if (recipient.status !== 'active') {
      return HttpResponse.json(
        { error: { code: 'recipient_inactive' } },
        { status: 400 }
      );
    }
    const currentOwnerIdx = staffStore.findIndex((s) => s.isOwner);
    if (currentOwnerIdx !== -1) {
      const currentOwner = staffStore[currentOwnerIdx]!;
      staffStore[currentOwnerIdx] = {
        ...currentOwner,
        role: 'finance_manager',
        isOwner: false,
      };
    }
    const promoted: StaffMember = { ...recipient, role: 'owner', isOwner: true };
    staffStore[recipientIdx] = promoted;
    const now = new Date().toISOString();
    activityStore = [
      ...activityStore,
      {
        id: `act-${Date.now()}-a`,
        staffId: id,
        action: 'role_changed',
        target: recipient.fullName || recipient.email,
        createdAt: now,
      },
    ];
    return HttpResponse.json({ data: promoted });
  }),

  // ----- POST /api/staff/:id/sessions/:sessionId/revoke -----
  http.post(
    '/api/staff/:id/sessions/:sessionId/revoke',
    async ({ params, request }) => {
      const id = params['id'] as string;
      const sessionId = params['sessionId'] as string;
      const body = (await request.json()) as { reason?: string };
      if (!body.reason || body.reason.trim().length < 20) {
        return HttpResponse.json(
          { error: { code: 'reason_too_short' } },
          { status: 400 }
        );
      }
      const session = sessionsStore.find(
        (s) => s.id === sessionId && s.staffId === id
      );
      if (!session) {
        return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
      }
      sessionsStore = sessionsStore.filter((s) => s.id !== sessionId);
      activityStore = [
        ...activityStore,
        {
          id: `act-${Date.now()}`,
          staffId: id,
          action: 'session_revoked',
          target: session.device,
          createdAt: new Date().toISOString(),
        },
      ];
      return HttpResponse.json({ data: { ok: true, revokedId: sessionId } });
    }
  ),

  // ----- POST /api/staff/:id/sessions/revoke-all-others -----
  http.post(
    '/api/staff/:id/sessions/revoke-all-others',
    async ({ params, request }) => {
      const id = params['id'] as string;
      const body = (await request.json()) as { reason?: string };
      if (!body.reason || body.reason.trim().length < 20) {
        return HttpResponse.json(
          { error: { code: 'reason_too_short' } },
          { status: 400 }
        );
      }
      const before = sessionsStore.filter((s) => s.staffId === id);
      const revoked = before.filter((s) => !s.current);
      sessionsStore = sessionsStore.filter(
        (s) => s.staffId !== id || s.current
      );
      activityStore = [
        ...activityStore,
        {
          id: `act-${Date.now()}`,
          staffId: id,
          action: 'sessions_revoked_all_others',
          createdAt: new Date().toISOString(),
        },
      ];
      return HttpResponse.json({
        data: { ok: true, revokedCount: revoked.length },
      });
    }
  ),
];
