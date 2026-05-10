import { http, HttpResponse } from 'msw';
import type { BankAccount, Branding, Department, Organization } from '@/types/domain';

type ForcedState = 'partial' | 'empty' | 'error' | null;

function forcedState(request: Request): ForcedState {
  const v = new URL(request.url).searchParams.get('_state');
  if (v === 'partial' || v === 'empty' || v === 'error') return v;
  return null;
}

// ---------- organization ----------

let organizationStore: Organization = {
  id: 'org-tatu',
  name: { ru: 'ТАТУ', uz: 'TATU', en: 'TUIT' },
  type: 'university',
  tin: '301234567',
  legalForm: 'state',
  region: 'tashkent-city',
  address: 'г. Ташкент, ул. Амира Темура, 108',
  website: 'https://tuit.uz',
  foundedYear: 1955,
};

// ---------- branding ----------

let brandingStore: Branding = {
  logoDataUrl: '',
  primaryColor: '#1558B0',
  receiptFooter: 'Спасибо за оплату!',
};

// ---------- departments seed ----------
// 3 faculties × 4 departments × 2 years × 3 groups = 72 leaf nodes.

const FACULTIES: Array<{ id: string; nameRu: string; nameUz: string }> = [
  { id: 'fac-eng', nameRu: 'Инженерный факультет', nameUz: 'Muhandislik fakulteti' },
  { id: 'fac-econ', nameRu: 'Экономический факультет', nameUz: 'Iqtisodiyot fakulteti' },
  { id: 'fac-it', nameRu: 'Факультет информационных технологий', nameUz: 'AT fakulteti' },
];

const DEPT_NAMES: Record<string, Array<{ ru: string; uz: string }>> = {
  'fac-eng': [
    { ru: 'Кафедра механики', uz: 'Mexanika kafedrasi' },
    { ru: 'Кафедра электротехники', uz: 'Elektrotexnika kafedrasi' },
    { ru: 'Кафедра энергетики', uz: 'Energetika kafedrasi' },
    { ru: 'Кафедра автоматики', uz: 'Avtomatika kafedrasi' },
  ],
  'fac-econ': [
    { ru: 'Кафедра финансов', uz: 'Moliya kafedrasi' },
    { ru: 'Кафедра менеджмента', uz: 'Menejment kafedrasi' },
    { ru: 'Кафедра маркетинга', uz: 'Marketing kafedrasi' },
    { ru: 'Кафедра аудита', uz: 'Audit kafedrasi' },
  ],
  'fac-it': [
    { ru: 'Кафедра программной инженерии', uz: 'Dasturiy injiniring kafedrasi' },
    { ru: 'Кафедра информационной безопасности', uz: 'Axborot xavfsizligi kafedrasi' },
    { ru: 'Кафедра ИИ', uz: 'SI kafedrasi' },
    { ru: 'Кафедра компьютерных систем', uz: 'Kompyuter tizimlari kafedrasi' },
  ],
};

function seedRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildDepartments(): Department[] {
  const rng = seedRng(0x1558b0);
  const list: Department[] = [];

  for (const fac of FACULTIES) {
    list.push({
      id: fac.id,
      parentId: null,
      name: { ru: fac.nameRu, uz: fac.nameUz },
      type: 'faculty',
      studentCount: 0,
      paymentTypes: ['tuition', 'dormitory'],
    });

    DEPT_NAMES[fac.id]?.forEach((dep, di) => {
      const depId = `${fac.id}-dep${di + 1}`;
      list.push({
        id: depId,
        parentId: fac.id,
        name: { ru: dep.ru, uz: dep.uz },
        type: 'department',
        studentCount: 0,
        paymentTypes: ['tuition'],
      });

      for (let y = 1; y <= 2; y++) {
        const yearId = `${depId}-y${y}`;
        list.push({
          id: yearId,
          parentId: depId,
          name: { ru: `${y} курс`, uz: `${y}-kurs` },
          type: 'class',
          studentCount: 0,
        });

        for (const g of ['A', 'B', 'C'] as const) {
          const groupId = `${yearId}-${g}`;
          const count = 20 + Math.floor(rng() * 10);
          list.push({
            id: groupId,
            parentId: yearId,
            name: { ru: `Группа ${y}${g}`, uz: `${y}${g}-guruh` },
            type: 'group',
            studentCount: count,
          });
        }
      }
    });
  }

  // Roll up student counts: every non-group node = sum of leaves in its subtree.
  const childrenOf = new Map<string, string[]>();
  for (const d of list) {
    if (d.parentId) {
      const arr = childrenOf.get(d.parentId) ?? [];
      arr.push(d.id);
      childrenOf.set(d.parentId, arr);
    }
  }
  const byId = new Map(list.map((d) => [d.id, d]));
  function rollUp(id: string): number {
    const node = byId.get(id);
    if (!node) return 0;
    if (node.type === 'group') return node.studentCount;
    const kids = childrenOf.get(id) ?? [];
    const total = kids.reduce((sum, k) => sum + rollUp(k), 0);
    node.studentCount = total;
    return total;
  }
  for (const d of list) {
    if (d.parentId === null) rollUp(d.id);
  }

  return list;
}

let departmentsStore = buildDepartments();

function descendantsOf(list: Department[], id: string): Set<string> {
  const out = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const d of list) {
      if (d.parentId && out.has(d.parentId) && !out.has(d.id)) {
        out.add(d.id);
        grew = true;
      }
    }
  }
  return out;
}

// ---------- bank accounts ----------

let bankAccountsStore: BankAccount[] = [
  {
    id: 'ba-001',
    bankName: 'Национальный банк Узбекистана',
    mfo: '00440',
    accountNumber: '20208000900112345678',
    holderName: 'ТАТУ',
    currency: 'UZS',
    label: 'Основной',
    isDefault: true,
    verification: 'verified',
  },
  {
    id: 'ba-002',
    bankName: 'Asaka Bank',
    mfo: '00773',
    accountNumber: '20208000900198765432',
    holderName: 'ТАТУ',
    currency: 'UZS',
    label: 'Резервный',
    isDefault: false,
    verification: 'verified',
  },
];

// ---------- handlers ----------

export const organizationHandlers = [
  // organization
  http.get('/api/organization', ({ request }) => {
    if (forcedState(request) === 'error') {
      return HttpResponse.json({ error: { code: 'FORCED' } }, { status: 500 });
    }
    return HttpResponse.json({ data: organizationStore });
  }),
  http.patch('/api/organization', async ({ request }) => {
    const body = (await request.json()) as Partial<Organization>;
    organizationStore = { ...organizationStore, ...body };
    return HttpResponse.json({ data: organizationStore });
  }),

  // departments
  http.get('/api/organization/departments', ({ request }) => {
    const forced = forcedState(request);
    if (forced === 'error') {
      return HttpResponse.json({ error: { code: 'FORCED' } }, { status: 500 });
    }
    if (forced === 'empty') {
      return HttpResponse.json({ data: { items: [] } });
    }
    if (forced === 'partial') {
      const shown = departmentsStore.slice(0, 30);
      return HttpResponse.json({
        data: {
          items: shown,
          _meta: { partial: true, shown: shown.length, total: departmentsStore.length },
        },
      });
    }
    return HttpResponse.json({ data: { items: departmentsStore } });
  }),
  http.post('/api/organization/departments', async ({ request }) => {
    const body = (await request.json()) as Partial<Department>;
    const id = `dep-${Math.random().toString(36).slice(2, 10)}`;
    const created: Department = {
      id,
      parentId: body.parentId ?? null,
      name: body.name ?? { ru: 'Новое подразделение' },
      type: body.type ?? 'department',
      studentCount: 0,
      paymentTypes: body.paymentTypes,
      headStaffId: body.headStaffId,
      notes: body.notes,
    };
    departmentsStore = [...departmentsStore, created];
    return HttpResponse.json({ data: created });
  }),
  http.patch('/api/organization/departments/:id', async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as Partial<Department>;
    const idx = departmentsStore.findIndex((d) => d.id === id);
    if (idx < 0) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    const current = departmentsStore[idx]!;
    const next: Department = { ...current, ...body, id };
    departmentsStore = [
      ...departmentsStore.slice(0, idx),
      next,
      ...departmentsStore.slice(idx + 1),
    ];
    return HttpResponse.json({ data: next });
  }),
  http.delete('/api/organization/departments/:id', ({ params }) => {
    const id = String(params.id);
    const toDelete = descendantsOf(departmentsStore, id);
    const deletedIds = Array.from(toDelete);
    departmentsStore = departmentsStore.filter((d) => !toDelete.has(d.id));
    return HttpResponse.json({ data: { ok: true, deletedIds } });
  }),
  http.post('/api/organization/departments/:id/move', async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as { newParentId: string | null };
    const idx = departmentsStore.findIndex((d) => d.id === id);
    if (idx < 0) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    if (body.newParentId !== null) {
      const banned = descendantsOf(departmentsStore, id);
      if (banned.has(body.newParentId)) {
        return HttpResponse.json({ error: { code: 'cycle' } }, { status: 400 });
      }
    }
    const current = departmentsStore[idx]!;
    const next: Department = { ...current, parentId: body.newParentId };
    departmentsStore = [
      ...departmentsStore.slice(0, idx),
      next,
      ...departmentsStore.slice(idx + 1),
    ];
    return HttpResponse.json({ data: next });
  }),

  // bank accounts
  http.get('/api/organization/bank-accounts', ({ request }) => {
    const forced = forcedState(request);
    if (forced === 'error') {
      return HttpResponse.json({ error: { code: 'FORCED' } }, { status: 500 });
    }
    if (forced === 'empty') {
      return HttpResponse.json({ data: { items: [] } });
    }
    if (forced === 'partial') {
      const shown = bankAccountsStore.slice(0, 1);
      return HttpResponse.json({
        data: {
          items: shown,
          _meta: { partial: true, shown: shown.length, total: bankAccountsStore.length },
        },
      });
    }
    return HttpResponse.json({ data: { items: bankAccountsStore } });
  }),
  http.post('/api/organization/bank-accounts', async ({ request }) => {
    const body = (await request.json()) as Partial<BankAccount>;
    const id = `ba-${Math.random().toString(36).slice(2, 10)}`;
    const created: BankAccount = {
      id,
      bankName: body.bankName ?? '',
      mfo: body.mfo ?? '',
      accountNumber: body.accountNumber ?? '',
      holderName: body.holderName ?? '',
      currency: body.currency ?? 'UZS',
      label: body.label,
      isDefault: body.isDefault ?? false,
      verification: 'pending',
    };
    if (created.isDefault) {
      bankAccountsStore = bankAccountsStore.map((b) => ({ ...b, isDefault: false }));
    }
    bankAccountsStore = [...bankAccountsStore, created];

    // Verification flips after 5s. Store is module-level so this persists across page navigation.
    setTimeout(() => {
      bankAccountsStore = bankAccountsStore.map((b) =>
        b.id === id ? { ...b, verification: 'verified' } : b
      );
    }, 5000);

    return HttpResponse.json({ data: created });
  }),
  http.patch('/api/organization/bank-accounts/:id', async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as Partial<BankAccount>;
    const idx = bankAccountsStore.findIndex((b) => b.id === id);
    if (idx < 0) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    const current = bankAccountsStore[idx]!;
    const next: BankAccount = { ...current, ...body, id };
    bankAccountsStore = [
      ...bankAccountsStore.slice(0, idx),
      next,
      ...bankAccountsStore.slice(idx + 1),
    ];
    return HttpResponse.json({ data: next });
  }),
  http.delete('/api/organization/bank-accounts/:id', ({ params }) => {
    const id = String(params.id);
    bankAccountsStore = bankAccountsStore.filter((b) => b.id !== id);
    return HttpResponse.json({ data: { ok: true } });
  }),
  http.post('/api/organization/bank-accounts/:id/set-default', ({ params }) => {
    const id = String(params.id);
    if (!bankAccountsStore.some((b) => b.id === id)) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    bankAccountsStore = bankAccountsStore.map((b) => ({ ...b, isDefault: b.id === id }));
    return HttpResponse.json({ data: bankAccountsStore.find((b) => b.id === id) });
  }),

  // branding
  http.get('/api/organization/branding', ({ request }) => {
    if (forcedState(request) === 'error') {
      return HttpResponse.json({ error: { code: 'FORCED' } }, { status: 500 });
    }
    return HttpResponse.json({ data: brandingStore });
  }),
  http.patch('/api/organization/branding', async ({ request }) => {
    const body = (await request.json()) as Partial<Branding>;
    brandingStore = { ...brandingStore, ...body };
    return HttpResponse.json({ data: brandingStore });
  }),
];
