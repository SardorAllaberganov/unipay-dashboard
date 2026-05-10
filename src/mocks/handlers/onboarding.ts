import { http, HttpResponse } from 'msw';
import type { OnboardingDraft, DepartmentNode } from '@/features/onboarding/schemas';

let draftStore: OnboardingDraft = { completedSteps: [] };

const universityTemplate: DepartmentNode[] = [
  {
    id: 'fac-eng',
    label: 'Инженерный факультет',
    children: [
      {
        id: 'dep-cs',
        label: 'Кафедра компьютерных наук',
        children: [1, 2, 3, 4].map((y) => ({
          id: `cs-y${y}`,
          label: `${y} курс`,
          children: ['A', 'B'].map((g) => ({
            id: `cs-y${y}-${g}`,
            label: `Группа ${g}`,
          })),
        })),
      },
      {
        id: 'dep-ee',
        label: 'Кафедра электротехники',
        children: [1, 2, 3, 4].map((y) => ({
          id: `ee-y${y}`,
          label: `${y} курс`,
          children: ['A'].map((g) => ({
            id: `ee-y${y}-${g}`,
            label: `Группа ${g}`,
          })),
        })),
      },
    ],
  },
  {
    id: 'fac-econ',
    label: 'Экономический факультет',
    children: [
      {
        id: 'dep-fin',
        label: 'Кафедра финансов',
        children: [1, 2, 3, 4].map((y) => ({
          id: `fin-y${y}`,
          label: `${y} курс`,
          children: ['A', 'B'].map((g) => ({
            id: `fin-y${y}-${g}`,
            label: `Группа ${g}`,
          })),
        })),
      },
    ],
  },
];

const schoolTemplate: DepartmentNode[] = Array.from({ length: 11 }, (_, i) => i + 1).map(
  (grade) => ({
    id: `grade-${grade}`,
    label: `${grade} класс`,
    children: ['А', 'Б', 'В'].map((sec) => ({
      id: `grade-${grade}-${sec}`,
      label: `${grade}${sec}`,
    })),
  })
);

const kindergartenTemplate: DepartmentNode[] = [
  { id: 'kg-younger', label: 'Младшая группа' },
  { id: 'kg-middle', label: 'Средняя группа' },
  { id: 'kg-older', label: 'Старшая группа' },
  { id: 'kg-prep', label: 'Подготовительная группа' },
];

const templates: Record<string, DepartmentNode[]> = {
  university: universityTemplate,
  school: schoolTemplate,
  kindergarten: kindergartenTemplate,
};

export const onboardingHandlers = [
  http.get('/api/onboarding/draft', () => HttpResponse.json({ data: draftStore })),

  http.patch('/api/onboarding/draft', async ({ request }) => {
    const body = (await request.json()) as Partial<OnboardingDraft>;
    draftStore = { ...draftStore, ...body };
    return HttpResponse.json({ data: draftStore });
  }),

  http.post('/api/onboarding/complete', () => {
    // Reset for next dev iteration so the wizard remains testable.
    draftStore = { completedSteps: [] };
    return HttpResponse.json({ data: { ok: true } });
  }),

  http.get('/api/onboarding/templates/:type', ({ params }) => {
    const type = String(params.type);
    const tpl = templates[type];
    if (!tpl) {
      return HttpResponse.json({ error: { code: 'unknown_template' } }, { status: 404 });
    }
    return HttpResponse.json({ data: tpl });
  }),
];
