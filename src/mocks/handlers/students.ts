import { http, HttpResponse } from 'msw';
import type {
  ImportRow,
  ImportRowError,
  ImportSession,
  PaymentChannel,
  PaymentStatus,
  PaymentType,
  ScheduleRow,
  ScheduleRowStatus,
  ScheduleTemplate,
  Student,
  StudentActivityAction,
  StudentActivityEntry,
  StudentNote,
  StudentPaymentStatus,
  Transaction,
  EducationType,
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

function isoDaysAgo(days: number, hours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function uzs(amountUzs: number) {
  return { amount: BigInt(amountUzs) * 100n, currency: 'UZS' as const };
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ---------- deterministic department layout (mirror of organization.ts) ----------

const FACULTIES = ['fac-eng', 'fac-econ', 'fac-it'] as const;
const DEPTS_PER_FAC = 4;
const YEARS = [1, 2] as const;
const GROUPS = ['A', 'B', 'C'] as const;

interface GroupRef {
  groupId: string;
  yearId: string;
  deptId: string;
  facId: string;
  year: number;
  groupLetter: string;
  pathLabel: string;
}

const FAC_LABELS_RU: Record<string, string> = {
  'fac-eng': 'Инженерный факультет',
  'fac-econ': 'Экономический факультет',
  'fac-it': 'Факультет информационных технологий',
};

function buildGroupRefs(): GroupRef[] {
  const out: GroupRef[] = [];
  for (const fac of FACULTIES) {
    for (let di = 0; di < DEPTS_PER_FAC; di++) {
      const deptId = `${fac}-dep${di + 1}`;
      for (const y of YEARS) {
        const yearId = `${deptId}-y${y}`;
        for (const g of GROUPS) {
          const groupId = `${yearId}-${g}`;
          out.push({
            groupId,
            yearId,
            deptId,
            facId: fac,
            year: y,
            groupLetter: g,
            pathLabel: `${FAC_LABELS_RU[fac] ?? fac} / ${y}-${g}`,
          });
        }
      }
    }
  }
  return out;
}

const GROUP_REFS = buildGroupRefs();
const GROUP_INDEX = new Map(GROUP_REFS.map((g) => [g.groupId, g]));

// ---------- name pools ----------

const FIRST_NAMES_M = [
  'Алишер', 'Бекзод', 'Шохрух', 'Дилшод', 'Жасур', 'Хуршид', 'Рустам', 'Тимур',
  'Анвар', 'Илхом', 'Сардор', 'Мирзо', 'Жахонгир', 'Шерзод', 'Икром', 'Аброр',
];
const FIRST_NAMES_F = [
  'Феруза', 'Зарина', 'Малика', 'Нодира', 'Гулнара', 'Севара', 'Шахзода',
  'Камола', 'Дилнура', 'Дилфуза', 'Лола', 'Шахноза', 'Мадина', 'Гавхар', 'Зулфия',
];
const LAST_NAMES = [
  'Каримов', 'Юсупов', 'Тургунов', 'Рахимов', 'Алимов', 'Хамидов', 'Ибрагимов',
  'Назаров', 'Усманов', 'Хасанов', 'Рашидов', 'Махмудов', 'Кулиев', 'Бабаев',
  'Эргашев', 'Холматов', 'Каюмов', 'Ражабов', 'Бахтиёров', 'Юлдашев',
];

function pickName(rng: () => number): { firstName: string; lastName: string; gender: 'male' | 'female' } {
  const gender = rng() < 0.5 ? 'male' : 'female';
  const pool = gender === 'male' ? FIRST_NAMES_M : FIRST_NAMES_F;
  const lastBase = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)] ?? 'Каримов';
  // Adjust last name suffix for female surnames so list reads naturally.
  const lastName = gender === 'female' ? lastBase.replace(/ов$/, 'ова').replace(/ев$/, 'ева') : lastBase;
  return {
    firstName: pool[Math.floor(rng() * pool.length)] ?? 'Алишер',
    lastName,
    gender,
  };
}

// ---------- payment channel pick (reused from dashboard) ----------

const CHANNEL_MIX: Array<{ channel: PaymentChannel; weight: number }> = [
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
  const total = CHANNEL_MIX.reduce((s, c) => s + c.weight, 0);
  let pick = rng() * total;
  for (const { channel, weight } of CHANNEL_MIX) {
    pick -= weight;
    if (pick <= 0) return channel;
  }
  return 'payme';
}

// ---------- stores (mutable) ----------

const studentStore: Student[] = [];
let scheduleStore: ScheduleRow[] = [];
let transactionStore: Transaction[] = [];
const noteStore: StudentNote[] = [];
const activityStore: StudentActivityEntry[] = [];
let templateStore: ScheduleTemplate[] = [];
const importSessions = new Map<string, ImportSession>();

// ---------- seeders ----------

function deriveStudentPaymentStatus(rows: ScheduleRow[]): StudentPaymentStatus {
  if (rows.length === 0) return 'pending';
  const anyOverdue = rows.some((r) => r.status === 'overdue');
  if (anyOverdue) return 'overdue';
  const allPaid = rows.every((r) => r.status === 'paid');
  if (allPaid) return 'paid';
  const anyPaidOrPartial = rows.some((r) => r.status === 'paid' || r.status === 'partial');
  if (anyPaidOrPartial) return 'partial';
  return 'pending';
}

function buildSeed() {
  const rng = makeRng(0x5740e7);
  const now = Date.now();

  // Pick a target student count and distribute across groups so we get a realistic 200+
  // dataset without making the seed too heavy. Each group gets 2-5 students.
  let studentCounter = 0;

  for (const grp of GROUP_REFS) {
    const perGroup = 2 + Math.floor(rng() * 4); // 2..5
    for (let n = 0; n < perGroup; n++) {
      const { firstName, lastName, gender } = pickName(rng);
      const id = `stu-${studentCounter.toString().padStart(4, '0')}`;
      const studentId = `${grp.facId.slice(-3).toUpperCase()}-${grp.year}${grp.groupLetter}-${(studentCounter % 99).toString().padStart(2, '0')}${Math.floor(rng() * 9)}`;
      const enrollmentDaysAgo = 180 + Math.floor(rng() * 720); // 6mo-2.5yr
      const eduRoll = rng();
      const educationType: EducationType =
        eduRoll < 0.6 ? 'full-time' : eduRoll < 0.85 ? 'part-time' : eduRoll < 0.95 ? 'evening' : 'remote';
      const tuitionPerSemUzs = 3_000_000 + Math.floor(rng() * 5_000_000); // 3M-8M UZS
      const semesters = 2 + Math.floor(rng() * 2); // 2..3 schedule rows
      const schedRows: ScheduleRow[] = [];
      for (let s = 0; s < semesters; s++) {
        const period = `Семестр ${s + 1} 2026`;
        const dueOffset = 30 + s * 90; // staggered through the year
        const dueDate = isoDaysAgo(-dueOffset).slice(0, 10);
        const isLastFuture = s === semesters - 1 && rng() < 0.6;
        const r = rng();
        let status: ScheduleRowStatus;
        let paidUzs = 0;
        if (isLastFuture) {
          status = 'pending';
        } else if (r < 0.55) {
          status = 'paid';
          paidUzs = tuitionPerSemUzs;
        } else if (r < 0.75) {
          status = 'partial';
          paidUzs = Math.floor(tuitionPerSemUzs * (0.3 + rng() * 0.5));
        } else if (r < 0.9) {
          status = 'overdue';
          paidUzs = rng() < 0.3 ? Math.floor(tuitionPerSemUzs * rng() * 0.3) : 0;
        } else {
          status = 'pending';
        }
        const rowId = `sch-${id}-${s}`;
        schedRows.push({
          id: rowId,
          studentId: id,
          period,
          type: s === semesters - 1 && rng() < 0.2 ? 'dormitory' : 'tuition',
          amount: uzs(tuitionPerSemUzs),
          paid: uzs(paidUzs),
          remaining: uzs(Math.max(0, tuitionPerSemUzs - paidUzs)),
          dueDate,
          status,
          createdAt: new Date(now - enrollmentDaysAgo * 86_400_000).toISOString(),
          updatedAt: new Date(now - (10 + Math.floor(rng() * 60)) * 86_400_000).toISOString(),
        });
      }
      scheduleStore.push(...schedRows);
      const paymentStatus = deriveStudentPaymentStatus(schedRows);
      const currentRow = schedRows.find((r) => r.status !== 'paid') ?? schedRows[schedRows.length - 1]!;
      const balanceUzs = schedRows
        .filter((r) => r.status !== 'paid')
        .reduce((sum, r) => sum + Number(r.remaining.amount) / 100, 0);

      const student: Student = {
        id,
        studentId,
        firstName,
        lastName,
        ...(rng() < 0.4 ? { middleName: gender === 'male' ? 'Алишерович' : 'Алишеровна' } : {}),
        dob: new Date(now - (18 + Math.floor(rng() * 8)) * 365 * 86_400_000).toISOString().slice(0, 10),
        gender,
        ...(rng() < 0.95 ? { phone: `+998 90 ${100 + Math.floor(rng() * 800)}-${10 + Math.floor(rng() * 89)}-${10 + Math.floor(rng() * 89)}` } : {}),
        ...(rng() < 0.7
          ? { email: `${firstName.toLowerCase().replace(/[^a-zа-я]/g, 'a')}.${lastName.toLowerCase().replace(/[^a-zа-я]/g, 'a')}${studentCounter}@stud.uz` }
          : {}),
        departmentId: grp.groupId,
        year: grp.year,
        educationType,
        enrollmentDate: new Date(now - enrollmentDaysAgo * 86_400_000).toISOString().slice(0, 10),
        ...(rng() < 0.3
          ? { endDate: new Date(now + (90 + Math.floor(rng() * 720)) * 86_400_000).toISOString().slice(0, 10) }
          : {}),
        status: 'active',
        currentBalance: uzs(balanceUzs),
        paymentStatus,
        lastPaymentAt: currentRow.status === 'paid'
          ? new Date(now - Math.floor(rng() * 30) * 86_400_000).toISOString()
          : undefined,
        createdAt: new Date(now - enrollmentDaysAgo * 86_400_000).toISOString(),
        updatedAt: new Date(now - Math.floor(rng() * 30) * 86_400_000).toISOString(),
      };
      studentStore.push(student);

      // transactions - every paid/partial schedule row generates one or more transactions.
      let txnCounter = 0;
      for (const row of schedRows) {
        if (row.status === 'paid' || row.status === 'partial' || (row.status === 'overdue' && Number(row.paid.amount) > 0n)) {
          const paidUzsAmt = Number(row.paid.amount) / 100;
          const txns = row.status === 'paid' && rng() < 0.3 ? 2 : 1;
          const eachUzs = Math.floor(paidUzsAmt / txns);
          for (let t = 0; t < txns; t++) {
            const txnDate = new Date(now - Math.floor(rng() * 120) * 86_400_000).toISOString();
            const commissionUzs = Math.floor(eachUzs * 0.005);
            const txnId = `tx-${id}-${txnCounter++}`;
            const txnStatus: PaymentStatus = rng() < 0.97 ? 'paid' : (rng() < 0.5 ? 'refunded' : 'failed');
            transactionStore.push({
              id: txnId,
              studentId: id,
              studentName: `${lastName} ${firstName.charAt(0)}.`,
              departmentId: grp.groupId,
              amount: uzs(eachUzs),
              commission: uzs(commissionUzs),
              net: uzs(eachUzs - commissionUzs),
              channel: pickChannel(rng),
              status: txnStatus,
              createdAt: txnDate,
              ...(txnStatus === 'paid' && rng() < 0.85 ? { receiptUrl: `/api/receipts/${txnId}` } : {}),
            });
          }
        }
      }

      // notes - 0..2 per student, append-only
      const noteCount = rng() < 0.4 ? Math.floor(rng() * 2) + 1 : 0;
      const NOTE_TEMPLATES = [
        'Связались с родителями — обещают оплатить до конца недели.',
        'Льгота 30% применена. См. подтверждение от деканата.',
        'Студент переведён с очной формы на заочную, бухгалтерия в курсе.',
        'Студент попросил рассрочку до конца семестра.',
        'Документы переданы в бухгалтерию для перерасчёта.',
      ];
      for (let i = 0; i < noteCount; i++) {
        noteStore.push({
          id: `note-${id}-${i}`,
          studentId: id,
          authorId: 'u-fin-1',
          authorName: 'Дилнура Юсупова',
          body: NOTE_TEMPLATES[Math.floor(rng() * NOTE_TEMPLATES.length)] ?? NOTE_TEMPLATES[0]!,
          createdAt: new Date(now - Math.floor(rng() * 90) * 86_400_000).toISOString(),
        });
      }

      // activity - 3..6 entries
      const actCount = 3 + Math.floor(rng() * 4);
      const actions: StudentActivityAction[] = ['created', 'schedule_row_added', 'updated', 'note_added', 'sms_sent', 'profile_updated', 'department_changed', 'status_changed'];
      activityStore.push({
        id: `act-${id}-create`,
        studentId: id,
        action: 'created',
        actorId: 'u-fin-1',
        actorName: 'Дилнура Юсупова',
        createdAt: student.createdAt!,
      });
      for (let a = 1; a < actCount; a++) {
        const action = actions[Math.floor(rng() * actions.length)] ?? 'updated';
        activityStore.push({
          id: `act-${id}-${a}`,
          studentId: id,
          action,
          actorId: rng() < 0.7 ? 'u-fin-1' : 'u-op-1',
          actorName: rng() < 0.7 ? 'Дилнура Юсупова' : 'Шохрух Эргашев',
          ...(action === 'department_changed' ? { field: 'departmentId', before: grp.groupId, after: grp.groupId } : {}),
          ...(action === 'profile_updated' ? { field: 'phone', before: '+998 90 000-00-00', after: student.phone ?? null } : {}),
          createdAt: new Date(now - Math.floor(rng() * 180) * 86_400_000).toISOString(),
        });
      }

      studentCounter++;
    }
  }

  // Templates (3 pre-seeded)
  templateStore = [
    {
      id: 'tpl-tuition-2026-s1',
      name: 'Обучение — 2026, семестр 1',
      type: 'tuition',
      amountMode: 'single',
      amount: uzs(5_000_000),
      dueDate: '2026-09-15',
      periodLabel: 'Семестр 1 2026',
      appliesTo: { departmentIds: [...FACULTIES], years: [1, 2], studentIds: [] },
      appliedCount: 0,
      createdAt: isoDaysAgo(45),
      createdBy: 'u-owner',
    },
    {
      id: 'tpl-tuition-2026-s2',
      name: 'Обучение — 2026, семестр 2',
      type: 'tuition',
      amountMode: 'single',
      amount: uzs(5_000_000),
      dueDate: '2027-02-15',
      periodLabel: 'Семестр 2 2026',
      appliesTo: { departmentIds: [...FACULTIES], years: [1, 2], studentIds: [] },
      appliedCount: 0,
      createdAt: isoDaysAgo(40),
      createdBy: 'u-owner',
    },
    {
      id: 'tpl-dorm-2026',
      name: 'Общежитие — 2026',
      type: 'dormitory',
      amountMode: 'per-department',
      perDepartmentAmounts: FACULTIES.map((fac, i) => ({
        departmentId: fac,
        amount: uzs(900_000 + i * 100_000),
      })),
      dueDate: '2026-09-30',
      periodLabel: 'Учебный год 2026',
      appliesTo: { departmentIds: [...FACULTIES], years: [1, 2], studentIds: [] },
      appliedCount: 0,
      createdAt: isoDaysAgo(30),
      createdBy: 'u-fin-1',
    },
  ];
}

buildSeed();

// ---------- query helpers ----------

function applyStudentFilters(items: Student[], request: Request): Student[] {
  const url = new URL(request.url);
  const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
  const departmentIds = url.searchParams.getAll('departmentId');
  const yearVals = url.searchParams.getAll('year').map(Number).filter((y) => !Number.isNaN(y));
  const statusVals = url.searchParams.getAll('paymentStatus') as StudentPaymentStatus[];
  const eduTypes = url.searchParams.getAll('educationType') as EducationType[];
  const accountStatuses = url.searchParams.getAll('status') as Array<'active' | 'inactive'>;

  let out = items;
  if (search) {
    out = out.filter((s) =>
      `${s.lastName} ${s.firstName}`.toLowerCase().includes(search) ||
      s.studentId.toLowerCase().includes(search) ||
      (s.phone ?? '').toLowerCase().includes(search) ||
      (s.email ?? '').toLowerCase().includes(search),
    );
  }
  if (departmentIds.length > 0) {
    // Match a student if its departmentId is in the picked set OR is a descendant of any.
    const targets = new Set(departmentIds);
    out = out.filter((s) => {
      if (targets.has(s.departmentId)) return true;
      // The departmentId is a group leaf - check if any ancestor (year, dept, fac) is selected.
      const grp = GROUP_INDEX.get(s.departmentId);
      if (!grp) return false;
      return targets.has(grp.yearId) || targets.has(grp.deptId) || targets.has(grp.facId);
    });
  }
  if (yearVals.length > 0) {
    out = out.filter((s) => s.year !== undefined && yearVals.includes(s.year));
  }
  if (statusVals.length > 0) {
    out = out.filter((s) => statusVals.includes(s.paymentStatus));
  }
  if (eduTypes.length > 0) {
    out = out.filter((s) => eduTypes.includes(s.educationType));
  }
  if (accountStatuses.length > 0) {
    out = out.filter((s) => accountStatuses.includes(s.status));
  }
  return out;
}

function logActivity(entry: Omit<StudentActivityEntry, 'id' | 'createdAt'> & Partial<Pick<StudentActivityEntry, 'createdAt'>>) {
  activityStore.unshift({
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: entry.createdAt ?? new Date().toISOString(),
    ...entry,
  });
}

function recomputeStudent(studentId: string): void {
  const idx = studentStore.findIndex((s) => s.id === studentId);
  if (idx === -1) return;
  const rows = scheduleStore.filter((r) => r.studentId === studentId);
  const balanceUzs = rows
    .filter((r) => r.status !== 'paid')
    .reduce((sum, r) => sum + Number(r.remaining.amount) / 100, 0);
  studentStore[idx] = {
    ...studentStore[idx]!,
    paymentStatus: deriveStudentPaymentStatus(rows),
    currentBalance: uzs(balanceUzs),
    updatedAt: new Date().toISOString(),
  };
}

// ---------- import flow helpers ----------

function validateImportRow(raw: ImportRow['raw']): ImportRowError[] {
  const errs: ImportRowError[] = [];
  if (!raw.studentId) errs.push({ field: 'studentId', code: 'required', message: 'required' });
  else if (studentStore.some((s) => s.studentId === raw.studentId)) {
    errs.push({ field: 'studentId', code: 'duplicate_student_id', message: 'duplicate_student_id' });
  }
  if (!raw.firstName) errs.push({ field: 'firstName', code: 'required', message: 'required' });
  if (!raw.lastName) errs.push({ field: 'lastName', code: 'required', message: 'required' });
  if (!raw.departmentId && !raw.departmentPath) {
    errs.push({ field: 'departmentId', code: 'required', message: 'required' });
  } else if (raw.departmentId && !GROUP_INDEX.has(raw.departmentId)) {
    errs.push({ field: 'departmentId', code: 'unknown_department', message: 'unknown_department' });
  }
  if (!raw.educationType) {
    errs.push({ field: 'educationType', code: 'required', message: 'required' });
  } else if (!['full-time', 'part-time', 'evening', 'remote'].includes(raw.educationType)) {
    errs.push({ field: 'educationType', code: 'invalid_education_type', message: 'invalid_education_type' });
  }
  if (!raw.enrollmentDate) errs.push({ field: 'enrollmentDate', code: 'required', message: 'required' });
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.enrollmentDate)) {
    errs.push({ field: 'enrollmentDate', code: 'invalid_date', message: 'invalid_date' });
  }
  if (raw.amount && Number.isNaN(Number(raw.amount))) {
    errs.push({ field: 'amount', code: 'invalid_amount', message: 'invalid_amount' });
  }
  if (raw.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(raw.dueDate)) {
    errs.push({ field: 'dueDate', code: 'invalid_date', message: 'invalid_date' });
  }
  return errs;
}

function fabricateImportRows(seed: number, fileName: string): ImportRow[] {
  const rng = makeRng(seed);
  const rowCount = 25 + Math.floor(rng() * 20); // 25..44 rows
  const rows: ImportRow[] = [];
  for (let i = 0; i < rowCount; i++) {
    const grp = GROUP_REFS[Math.floor(rng() * GROUP_REFS.length)]!;
    const { firstName, lastName } = pickName(rng);
    const introduceError = rng() < 0.15; // ~15% rows have an error
    const baseRaw: ImportRow['raw'] = {
      studentId: `IMP-${i.toString().padStart(3, '0')}`,
      firstName,
      lastName,
      ...(rng() < 0.4 ? { middleName: 'Алишерович' } : {}),
      dob: `200${5 + Math.floor(rng() * 5)}-0${1 + Math.floor(rng() * 9)}-1${Math.floor(rng() * 9)}`,
      phone: `+998 90 ${100 + Math.floor(rng() * 800)}-12-34`,
      departmentId: grp.groupId,
      year: String(grp.year),
      educationType: 'full-time',
      enrollmentDate: '2026-09-01',
      amount: '5000000',
      dueDate: '2026-09-15',
    };
    if (introduceError) {
      const which = Math.floor(rng() * 4);
      if (which === 0) baseRaw.studentId = '';
      else if (which === 1) baseRaw.enrollmentDate = 'not-a-date';
      else if (which === 2) baseRaw.departmentId = 'fac-bogus-zzz';
      else baseRaw.amount = 'not-a-number';
    }
    rows.push({
      index: i,
      raw: baseRaw,
      errors: validateImportRow(baseRaw),
    });
  }
  // Sprinkle a duplicate of the first row's studentId so duplicate-detection is exercised.
  if (rows.length > 5 && rows[0]) {
    rows[3] = {
      ...rows[3]!,
      raw: { ...rows[3]!.raw, studentId: rows[0].raw.studentId },
    };
    rows[3]!.errors = validateImportRow(rows[3]!.raw);
  }
  // Touch fileName so the seeder uses it (unique fixture per filename).
  void fileName;
  return rows;
}

function summarizeImport(session: ImportSession) {
  session.okCount = session.rows.filter((r) => r.errors.length === 0).length;
  session.errorCount = session.rows.length - session.okCount;
  session.totalRows = session.rows.length;
}

// ---------- handlers ----------

export const studentsHandlers = [
  // ---- list ----
  http.get('/api/students', ({ request }) => {
    const state = forcedState(request);
    if (state === 'error') {
      return HttpResponse.json({ error: { code: 'students_list_failed' } }, { status: 500 });
    }
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const pageSize = Math.max(1, Math.min(200, Number(url.searchParams.get('pageSize') ?? '50')));
    const filtered = applyStudentFilters([...studentStore], request);
    // Stable sort: overdue first, then partial, pending, paid; then by lastName.
    const statusOrder: Record<StudentPaymentStatus, number> = { overdue: 0, partial: 1, pending: 2, paid: 3 };
    filtered.sort((a, b) => {
      const so = statusOrder[a.paymentStatus] - statusOrder[b.paymentStatus];
      if (so !== 0) return so;
      return a.lastName.localeCompare(b.lastName, 'ru');
    });

    if (state === 'empty') {
      return HttpResponse.json({ data: { items: [], page: 1, pageSize, total: 0 } });
    }
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    if (state === 'partial') {
      const shown = Math.max(1, Math.floor(items.length * 0.6));
      return HttpResponse.json({
        data: { items: items.slice(0, shown), page, pageSize, total, _meta: { partial: true, shown, total } },
      });
    }
    return HttpResponse.json({ data: { items, page, pageSize, total } });
  }),

  // ---- check unique studentId ----
  http.get('/api/students/check-id', async ({ request }) => {
    const url = new URL(request.url);
    const sid = (url.searchParams.get('id') ?? '').trim();
    if (!sid) return HttpResponse.json({ data: { available: false } });
    await delay(180); // simulate latency for async UX
    const taken = studentStore.some((s) => s.studentId.toLowerCase() === sid.toLowerCase());
    return HttpResponse.json({ data: { available: !taken } });
  }),

  // ---- one student ----
  http.get('/api/students/:id', ({ params, request }) => {
    const state = forcedState(request);
    if (state === 'error') {
      return HttpResponse.json({ error: { code: 'students_get_failed' } }, { status: 500 });
    }
    const id = params['id'] as string;
    const student = studentStore.find((s) => s.id === id);
    if (!student) return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    return HttpResponse.json({ data: student });
  }),

  // ---- create student ----
  http.post('/api/students', async ({ request }) => {
    const body = (await request.json()) as Partial<Student> & { templateId?: string };
    if (!body.studentId || !body.firstName || !body.lastName || !body.departmentId || !body.educationType || !body.enrollmentDate) {
      return HttpResponse.json({ error: { code: 'invalid_input' } }, { status: 400 });
    }
    if (studentStore.some((s) => s.studentId.toLowerCase() === body.studentId!.toLowerCase())) {
      return HttpResponse.json({ error: { code: 'duplicate_student_id' } }, { status: 409 });
    }
    const grp = GROUP_INDEX.get(body.departmentId);
    if (!grp) return HttpResponse.json({ error: { code: 'unknown_department' } }, { status: 400 });
    const now = new Date().toISOString();
    const id = `stu-new-${Date.now().toString(36)}`;
    const student: Student = {
      id,
      studentId: body.studentId,
      firstName: body.firstName,
      lastName: body.lastName,
      ...(body.middleName ? { middleName: body.middleName } : {}),
      ...(body.dob ? { dob: body.dob } : {}),
      ...(body.gender ? { gender: body.gender } : {}),
      ...(body.phone ? { phone: body.phone } : {}),
      ...(body.email ? { email: body.email } : {}),
      departmentId: body.departmentId,
      year: grp.year,
      educationType: body.educationType,
      enrollmentDate: body.enrollmentDate,
      ...(body.endDate ? { endDate: body.endDate } : {}),
      status: 'active',
      currentBalance: uzs(0),
      paymentStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    studentStore.push(student);
    logActivity({ studentId: id, action: 'created', actorId: 'u-fin-1', actorName: 'Дилнура Юсупова' });
    if (body.templateId) {
      const tpl = templateStore.find((t) => t.id === body.templateId);
      if (tpl) {
        const tplAmount = tpl.amountMode === 'single' ? tpl.amount : tpl.perDepartmentAmounts?.find((p) => p.departmentId === grp.facId || p.departmentId === grp.deptId)?.amount;
        if (tplAmount) {
          const row: ScheduleRow = {
            id: `sch-${id}-tpl`,
            studentId: id,
            period: tpl.periodLabel,
            type: tpl.type,
            amount: tplAmount,
            paid: uzs(0),
            remaining: tplAmount,
            dueDate: tpl.dueDate,
            status: 'pending',
            templateId: tpl.id,
            createdAt: now,
            updatedAt: now,
          };
          scheduleStore.push(row);
          tpl.appliedCount += 1;
          logActivity({ studentId: id, action: 'template_applied', actorId: 'u-fin-1', actorName: 'Дилнура Юсупова' });
        }
      }
    }
    recomputeStudent(id);
    return HttpResponse.json({ data: studentStore.find((s) => s.id === id) });
  }),

  // ---- update student ----
  http.patch('/api/students/:id', async ({ params, request }) => {
    const id = params['id'] as string;
    const body = (await request.json()) as Partial<Student> & { reason?: string };
    const idx = studentStore.findIndex((s) => s.id === id);
    if (idx === -1) return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    const prev = studentStore[idx]!;
    const next: Student = {
      ...prev,
      ...(body.firstName !== undefined ? { firstName: body.firstName } : {}),
      ...(body.lastName !== undefined ? { lastName: body.lastName } : {}),
      ...(body.middleName !== undefined ? { middleName: body.middleName } : {}),
      ...(body.dob !== undefined ? { dob: body.dob } : {}),
      ...(body.gender !== undefined ? { gender: body.gender } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.departmentId !== undefined ? { departmentId: body.departmentId, year: GROUP_INDEX.get(body.departmentId)?.year ?? prev.year } : {}),
      ...(body.educationType !== undefined ? { educationType: body.educationType } : {}),
      ...(body.enrollmentDate !== undefined ? { enrollmentDate: body.enrollmentDate } : {}),
      ...(body.endDate !== undefined ? { endDate: body.endDate } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
      updatedAt: new Date().toISOString(),
    };
    studentStore[idx] = next;
    if (body.departmentId !== undefined && body.departmentId !== prev.departmentId) {
      logActivity({
        studentId: id,
        action: 'department_changed',
        actorId: 'u-fin-1',
        actorName: 'Дилнура Юсупова',
        field: 'departmentId',
        before: prev.departmentId,
        after: body.departmentId,
      });
    } else if (body.status !== undefined && body.status !== prev.status) {
      logActivity({
        studentId: id,
        action: body.status === 'inactive' ? 'deactivated' : 'reactivated',
        actorId: 'u-fin-1',
        actorName: 'Дилнура Юсупова',
        field: 'status',
        before: prev.status,
        after: body.status,
      });
    } else {
      logActivity({ studentId: id, action: 'profile_updated', actorId: 'u-fin-1', actorName: 'Дилнура Юсупова' });
    }
    return HttpResponse.json({ data: next });
  }),

  // ---- delete student (Owner-only enforced client-side; server accepts) ----
  http.delete('/api/students/:id', async ({ params, request }) => {
    const id = params['id'] as string;
    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    if (!body.reason || body.reason.trim().length < 20) {
      return HttpResponse.json({ error: { code: 'reason_too_short' } }, { status: 400 });
    }
    const idx = studentStore.findIndex((s) => s.id === id);
    if (idx === -1) return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    studentStore.splice(idx, 1);
    scheduleStore = scheduleStore.filter((r) => r.studentId !== id);
    transactionStore = transactionStore.filter((t) => t.studentId !== id);
    // notes + activity preserved as audit trail
    logActivity({ studentId: id, action: 'deleted', actorId: 'u-owner', actorName: 'Алишер Каримов', before: body.reason });
    return HttpResponse.json({ data: { id, deleted: true } });
  }),

  // ---- schedule ----
  http.get('/api/students/:id/schedule', ({ params, request }) => {
    const state = forcedState(request);
    if (state === 'error') return HttpResponse.json({ error: { code: 'schedule_failed' } }, { status: 500 });
    const id = params['id'] as string;
    if (state === 'empty') return HttpResponse.json({ data: { items: [], total: 0 } });
    const items = scheduleStore.filter((r) => r.studentId === id).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    if (state === 'partial' && items.length > 1) {
      const shown = Math.max(1, Math.floor(items.length * 0.6));
      return HttpResponse.json({ data: { items: items.slice(0, shown), total: items.length, _meta: { partial: true, shown, total: items.length } } });
    }
    return HttpResponse.json({ data: { items, total: items.length } });
  }),

  http.post('/api/students/:id/schedule', async ({ params, request }) => {
    const id = params['id'] as string;
    const body = (await request.json()) as Partial<ScheduleRow>;
    const student = studentStore.find((s) => s.id === id);
    if (!student) return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    if (!body.period || !body.type || !body.amount || !body.dueDate) {
      return HttpResponse.json({ error: { code: 'invalid_input' } }, { status: 400 });
    }
    const now = new Date().toISOString();
    const row: ScheduleRow = {
      id: `sch-${id}-${Date.now().toString(36)}`,
      studentId: id,
      period: body.period,
      type: body.type as PaymentType,
      amount: body.amount,
      paid: body.paid ?? uzs(0),
      remaining: body.remaining ?? body.amount,
      dueDate: body.dueDate,
      status: body.status ?? 'pending',
      createdAt: now,
      updatedAt: now,
    };
    scheduleStore.push(row);
    logActivity({ studentId: id, action: 'schedule_row_added', actorId: 'u-fin-1', actorName: 'Дилнура Юсупова' });
    recomputeStudent(id);
    return HttpResponse.json({ data: row });
  }),

  http.patch('/api/students/:id/schedule/:rowId', async ({ params, request }) => {
    const id = params['id'] as string;
    const rowId = params['rowId'] as string;
    const body = (await request.json()) as Partial<ScheduleRow>;
    const idx = scheduleStore.findIndex((r) => r.id === rowId && r.studentId === id);
    if (idx === -1) return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    const prev = scheduleStore[idx]!;
    const next: ScheduleRow = {
      ...prev,
      ...(body.period !== undefined ? { period: body.period } : {}),
      ...(body.type !== undefined ? { type: body.type } : {}),
      ...(body.amount !== undefined ? { amount: body.amount } : {}),
      ...(body.paid !== undefined ? { paid: body.paid } : {}),
      ...(body.dueDate !== undefined ? { dueDate: body.dueDate } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      updatedAt: new Date().toISOString(),
    };
    // Recompute remaining from amount - paid if either changed.
    if (body.amount !== undefined || body.paid !== undefined) {
      const amt = Number(next.amount.amount);
      const pd = Number(next.paid.amount);
      next.remaining = { amount: BigInt(Math.max(0, amt - pd)), currency: 'UZS' };
    }
    scheduleStore[idx] = next;
    logActivity({ studentId: id, action: 'schedule_row_updated', actorId: 'u-fin-1', actorName: 'Дилнура Юсупова' });
    recomputeStudent(id);
    return HttpResponse.json({ data: next });
  }),

  http.delete('/api/students/:id/schedule/:rowId', ({ params }) => {
    const id = params['id'] as string;
    const rowId = params['rowId'] as string;
    const idx = scheduleStore.findIndex((r) => r.id === rowId && r.studentId === id);
    if (idx === -1) return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    scheduleStore.splice(idx, 1);
    logActivity({ studentId: id, action: 'schedule_row_removed', actorId: 'u-fin-1', actorName: 'Дилнура Юсупова' });
    recomputeStudent(id);
    return HttpResponse.json({ data: { id: rowId, deleted: true } });
  }),

  // ---- transactions ----
  http.get('/api/students/:id/transactions', ({ params, request }) => {
    const state = forcedState(request);
    if (state === 'error') return HttpResponse.json({ error: { code: 'transactions_failed' } }, { status: 500 });
    const id = params['id'] as string;
    if (state === 'empty') return HttpResponse.json({ data: { items: [], total: 0 } });
    const items = transactionStore.filter((t) => t.studentId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (state === 'partial' && items.length > 1) {
      const shown = Math.max(1, Math.floor(items.length * 0.5));
      return HttpResponse.json({ data: { items: items.slice(0, shown), total: items.length, _meta: { partial: true, shown, total: items.length } } });
    }
    return HttpResponse.json({ data: { items, total: items.length } });
  }),

  // ---- notes ----
  http.get('/api/students/:id/notes', ({ params, request }) => {
    const state = forcedState(request);
    if (state === 'error') return HttpResponse.json({ error: { code: 'notes_failed' } }, { status: 500 });
    const id = params['id'] as string;
    if (state === 'empty') return HttpResponse.json({ data: { items: [], total: 0 } });
    const items = noteStore.filter((n) => n.studentId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return HttpResponse.json({ data: { items, total: items.length } });
  }),

  http.post('/api/students/:id/notes', async ({ params, request }) => {
    const id = params['id'] as string;
    const body = (await request.json()) as { body?: string };
    if (!body.body || body.body.trim().length < 3) {
      return HttpResponse.json({ error: { code: 'invalid_input' } }, { status: 400 });
    }
    if (!studentStore.some((s) => s.id === id)) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    const note: StudentNote = {
      id: `note-${id}-${Date.now().toString(36)}`,
      studentId: id,
      authorId: 'u-fin-1',
      authorName: 'Дилнура Юсупова',
      body: body.body.trim(),
      createdAt: new Date().toISOString(),
    };
    noteStore.unshift(note);
    logActivity({ studentId: id, action: 'note_added', actorId: 'u-fin-1', actorName: 'Дилнура Юсупова' });
    return HttpResponse.json({ data: note });
  }),

  // ---- activity ----
  http.get('/api/students/:id/activity', ({ params, request }) => {
    const state = forcedState(request);
    if (state === 'error') return HttpResponse.json({ error: { code: 'activity_failed' } }, { status: 500 });
    const id = params['id'] as string;
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get('pageSize') ?? '20')));
    const action = url.searchParams.get('action') as StudentActivityAction | null;
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    let all = activityStore.filter((a) => a.studentId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (action) all = all.filter((a) => a.action === action);
    if (from) all = all.filter((a) => a.createdAt >= from);
    if (to) all = all.filter((a) => a.createdAt <= to);
    if (state === 'empty') return HttpResponse.json({ data: { items: [], page: 1, pageSize, total: 0 } });
    const total = all.length;
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);
    if (state === 'partial') {
      const shown = Math.max(1, Math.floor(items.length * 0.5));
      return HttpResponse.json({ data: { items: items.slice(0, shown), page, pageSize, total, _meta: { partial: true, shown, total } } });
    }
    return HttpResponse.json({ data: { items, page, pageSize, total } });
  }),

  // ---- import ----
  http.post('/api/students/import/parse', async ({ request }) => {
    // We don't actually parse the uploaded file in the mock - we fabricate a deterministic
    // session keyed by file name + size so the user gets a real, reviewable error mix.
    const form = await request.formData().catch(() => null);
    const file = form?.get('file') as File | null;
    const fileName = file?.name ?? 'students-import.xlsx';
    const fileSize = file?.size ?? 1234;
    if (fileSize > 5 * 1024 * 1024) {
      return HttpResponse.json({ error: { code: 'file_too_large' } }, { status: 400 });
    }
    await delay(800); // simulate parse latency
    const id = `imp-${Date.now().toString(36)}`;
    const rows = fabricateImportRows((fileName.length * 31 + fileSize) & 0xffffffff, fileName);
    const session: ImportSession = {
      id,
      fileName,
      totalRows: rows.length,
      okCount: 0,
      errorCount: 0,
      rows,
      status: 'parsed',
      createdAt: new Date().toISOString(),
    };
    summarizeImport(session);
    importSessions.set(id, session);
    return HttpResponse.json({ data: session });
  }),

  http.patch('/api/students/import/:sessionId/row/:index', async ({ params, request }) => {
    const sessionId = params['sessionId'] as string;
    const index = Number(params['index']);
    const session = importSessions.get(sessionId);
    if (!session) return HttpResponse.json({ error: { code: 'session_not_found' } }, { status: 404 });
    const rowIdx = session.rows.findIndex((r) => r.index === index);
    if (rowIdx === -1) return HttpResponse.json({ error: { code: 'row_not_found' } }, { status: 404 });
    const patch = (await request.json()) as Partial<ImportRow['raw']>;
    const merged = { ...session.rows[rowIdx]!.raw, ...patch };
    session.rows[rowIdx] = {
      index,
      raw: merged,
      errors: validateImportRow(merged),
    };
    summarizeImport(session);
    return HttpResponse.json({ data: session.rows[rowIdx] });
  }),

  http.post('/api/students/import/:sessionId/commit', async ({ params, request }) => {
    const sessionId = params['sessionId'] as string;
    const session = importSessions.get(sessionId);
    if (!session) return HttpResponse.json({ error: { code: 'session_not_found' } }, { status: 404 });
    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    if (session.errorCount > 0) {
      return HttpResponse.json({ error: { code: 'has_errors' } }, { status: 400 });
    }
    const cleanRows = session.rows.filter((r) => r.errors.length === 0);
    if (cleanRows.length > 100 && (!body.reason || body.reason.trim().length < 20)) {
      return HttpResponse.json({ error: { code: 'reason_too_short' } }, { status: 400 });
    }
    session.status = 'committing';
    await delay(600); // simulate work
    const now = new Date().toISOString();
    for (const row of cleanRows) {
      const grp = GROUP_INDEX.get(row.raw.departmentId!);
      if (!grp) continue;
      const id = `stu-imp-${session.id.slice(-6)}-${row.index}`;
      const amountUzs = Number(row.raw.amount ?? '0');
      const student: Student = {
        id,
        studentId: row.raw.studentId!,
        firstName: row.raw.firstName!,
        lastName: row.raw.lastName!,
        ...(row.raw.middleName ? { middleName: row.raw.middleName } : {}),
        ...(row.raw.dob ? { dob: row.raw.dob } : {}),
        ...(row.raw.phone ? { phone: row.raw.phone } : {}),
        ...(row.raw.email ? { email: row.raw.email } : {}),
        departmentId: row.raw.departmentId!,
        year: grp.year,
        educationType: row.raw.educationType as EducationType,
        enrollmentDate: row.raw.enrollmentDate!,
        status: 'active',
        currentBalance: uzs(amountUzs),
        paymentStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      };
      studentStore.push(student);
      if (amountUzs > 0 && row.raw.dueDate) {
        scheduleStore.push({
          id: `sch-${id}-imp`,
          studentId: id,
          period: 'Импортирован',
          type: 'tuition',
          amount: uzs(amountUzs),
          paid: uzs(0),
          remaining: uzs(amountUzs),
          dueDate: row.raw.dueDate,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        });
      }
      logActivity({ studentId: id, action: 'imported', actorId: 'u-fin-1', actorName: 'Дилнура Юсупова' });
    }
    session.status = 'committed';
    return HttpResponse.json({ data: { id: session.id, importedCount: cleanRows.length, status: 'committed' } });
  }),

  http.get('/api/students/import/:sessionId/error-report.xlsx', ({ params }) => {
    const sessionId = params['sessionId'] as string;
    const session = importSessions.get(sessionId);
    if (!session) return HttpResponse.json({ error: { code: 'session_not_found' } }, { status: 404 });
    // The real backend will return an actual xlsx Blob. The mock returns a JSON payload with
    // the error rows; the client serializes to xlsx via the dynamically-imported `xlsx` lib.
    const errorRows = session.rows.filter((r) => r.errors.length > 0);
    return HttpResponse.json({ data: { rows: errorRows } });
  }),

  // ---- schedule templates ----
  http.get('/api/students/schedules-templates', ({ request }) => {
    const state = forcedState(request);
    if (state === 'error') return HttpResponse.json({ error: { code: 'templates_failed' } }, { status: 500 });
    if (state === 'empty') return HttpResponse.json({ data: { items: [], total: 0 } });
    const items = [...templateStore].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return HttpResponse.json({ data: { items, total: items.length } });
  }),

  http.post('/api/students/schedules-templates', async ({ request }) => {
    const body = (await request.json()) as Partial<ScheduleTemplate>;
    if (!body.name || !body.type || !body.dueDate || !body.periodLabel || !body.appliesTo) {
      return HttpResponse.json({ error: { code: 'invalid_input' } }, { status: 400 });
    }
    const now = new Date().toISOString();
    const tpl: ScheduleTemplate = {
      id: `tpl-${Date.now().toString(36)}`,
      name: body.name,
      type: body.type as PaymentType,
      amountMode: body.amountMode ?? 'single',
      ...(body.amount ? { amount: body.amount } : {}),
      ...(body.perDepartmentAmounts ? { perDepartmentAmounts: body.perDepartmentAmounts } : {}),
      dueDate: body.dueDate,
      periodLabel: body.periodLabel,
      appliesTo: body.appliesTo,
      appliedCount: 0,
      createdAt: now,
      createdBy: 'u-fin-1',
    };
    templateStore.unshift(tpl);
    return HttpResponse.json({ data: tpl });
  }),

  http.patch('/api/students/schedules-templates/:id', async ({ params, request }) => {
    const id = params['id'] as string;
    const body = (await request.json()) as Partial<ScheduleTemplate>;
    const idx = templateStore.findIndex((t) => t.id === id);
    if (idx === -1) return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    const prev = templateStore[idx]!;
    templateStore[idx] = { ...prev, ...body, id: prev.id, createdAt: prev.createdAt };
    return HttpResponse.json({ data: templateStore[idx] });
  }),

  http.delete('/api/students/schedules-templates/:id', async ({ params, request }) => {
    const id = params['id'] as string;
    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    if (!body.reason || body.reason.trim().length < 20) {
      return HttpResponse.json({ error: { code: 'reason_too_short' } }, { status: 400 });
    }
    const idx = templateStore.findIndex((t) => t.id === id);
    if (idx === -1) return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    templateStore.splice(idx, 1);
    return HttpResponse.json({ data: { id, deleted: true } });
  }),

  http.post('/api/students/schedules-templates/:id/apply', async ({ params, request }) => {
    const id = params['id'] as string;
    const body = (await request.json()) as {
      departmentIds?: string[];
      years?: number[];
      studentIds?: string[];
      reason?: string;
    };
    if (!body.reason || body.reason.trim().length < 20) {
      return HttpResponse.json({ error: { code: 'reason_too_short' } }, { status: 400 });
    }
    const tpl = templateStore.find((t) => t.id === id);
    if (!tpl) return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    const targets = resolveTemplateTargets(body);
    const now = new Date().toISOString();
    let applied = 0;
    for (const stu of targets) {
      const amt = tpl.amountMode === 'single'
        ? tpl.amount
        : tpl.perDepartmentAmounts?.find((p) => {
            const grp = GROUP_INDEX.get(stu.departmentId);
            return p.departmentId === stu.departmentId || p.departmentId === grp?.deptId || p.departmentId === grp?.facId;
          })?.amount;
      if (!amt) continue;
      scheduleStore.push({
        id: `sch-${stu.id}-${tpl.id}-${Date.now().toString(36)}-${applied}`,
        studentId: stu.id,
        period: tpl.periodLabel,
        type: tpl.type,
        amount: amt,
        paid: uzs(0),
        remaining: amt,
        dueDate: tpl.dueDate,
        status: 'pending',
        templateId: tpl.id,
        createdAt: now,
        updatedAt: now,
      });
      logActivity({ studentId: stu.id, action: 'template_applied', actorId: 'u-fin-1', actorName: 'Дилнура Юсупова' });
      recomputeStudent(stu.id);
      applied += 1;
    }
    tpl.appliedCount += applied;
    return HttpResponse.json({ data: { id, appliedCount: applied } });
  }),

  // ---- bulk actions ----
  http.post('/api/students/bulk-remind', async ({ request }) => {
    const body = (await request.json()) as { studentIds: string[] };
    await delay(500);
    return HttpResponse.json({ data: { sent: body.studentIds?.length ?? 0 } });
  }),

  http.post('/api/students/bulk-export', async ({ request }) => {
    const body = (await request.json()) as { studentIds: string[] };
    await delay(400);
    return HttpResponse.json({ data: { exported: body.studentIds?.length ?? 0, downloadUrl: '#' } });
  }),

  http.post('/api/students/bulk-change-dept', async ({ request }) => {
    const body = (await request.json()) as { studentIds: string[]; departmentId: string };
    if (!body.departmentId || !GROUP_INDEX.has(body.departmentId)) {
      return HttpResponse.json({ error: { code: 'unknown_department' } }, { status: 400 });
    }
    const grp = GROUP_INDEX.get(body.departmentId)!;
    let updated = 0;
    for (const id of body.studentIds ?? []) {
      const idx = studentStore.findIndex((s) => s.id === id);
      if (idx === -1) continue;
      const prev = studentStore[idx]!;
      studentStore[idx] = { ...prev, departmentId: body.departmentId, year: grp.year, updatedAt: new Date().toISOString() };
      logActivity({ studentId: id, action: 'department_changed', actorId: 'u-fin-1', actorName: 'Дилнура Юсупова', before: prev.departmentId, after: body.departmentId });
      updated += 1;
    }
    return HttpResponse.json({ data: { updated } });
  }),

  http.post('/api/students/bulk-deactivate', async ({ request }) => {
    const body = (await request.json()) as { studentIds: string[]; reason?: string };
    if (!body.reason || body.reason.trim().length < 20) {
      return HttpResponse.json({ error: { code: 'reason_too_short' } }, { status: 400 });
    }
    let updated = 0;
    for (const id of body.studentIds ?? []) {
      const idx = studentStore.findIndex((s) => s.id === id);
      if (idx === -1) continue;
      const prev = studentStore[idx]!;
      if (prev.status === 'inactive') continue;
      studentStore[idx] = { ...prev, status: 'inactive', updatedAt: new Date().toISOString() };
      logActivity({ studentId: id, action: 'deactivated', actorId: 'u-fin-1', actorName: 'Дилнура Юсупова', before: body.reason });
      updated += 1;
    }
    return HttpResponse.json({ data: { updated } });
  }),

  // ---- SMS (per-student) ----
  http.post('/api/students/:id/sms', async ({ params, request }) => {
    const id = params['id'] as string;
    const body = (await request.json().catch(() => ({}))) as { message?: string };
    if (!studentStore.some((s) => s.id === id)) {
      return HttpResponse.json({ error: { code: 'not_found' } }, { status: 404 });
    }
    await delay(300);
    logActivity({ studentId: id, action: 'sms_sent', actorId: 'u-fin-1', actorName: 'Дилнура Юсупова', after: body.message?.slice(0, 80) ?? null });
    return HttpResponse.json({ data: { sent: true } });
  }),
];

function resolveTemplateTargets(body: { departmentIds?: string[]; years?: number[]; studentIds?: string[] }): Student[] {
  const explicit = new Set(body.studentIds ?? []);
  const out: Student[] = [];
  for (const stu of studentStore) {
    if (explicit.has(stu.id)) { out.push(stu); continue; }
    const grp = GROUP_INDEX.get(stu.departmentId);
    if (!grp) continue;
    const deptMatch = (body.departmentIds ?? []).some((id) => id === grp.groupId || id === grp.yearId || id === grp.deptId || id === grp.facId);
    const yearMatch = (body.years ?? []).includes(grp.year);
    if (deptMatch && (body.years && body.years.length > 0 ? yearMatch : true)) {
      out.push(stu);
    }
  }
  return out;
}
