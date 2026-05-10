import type { OnboardingDraft, TemplateType, DepartmentNode } from './schemas';

interface ApiResponse<T> {
  data: T;
}

export async function getDraft(): Promise<OnboardingDraft> {
  const res = await fetch('/api/onboarding/draft');
  if (!res.ok) throw new Error('draft_failed');
  const body = (await res.json()) as ApiResponse<OnboardingDraft>;
  return body.data;
}

export async function patchDraft(draft: Partial<OnboardingDraft>): Promise<void> {
  const res = await fetch('/api/onboarding/draft', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  });
  if (!res.ok) throw new Error('draft_failed');
}

export async function completeOnboarding(): Promise<void> {
  const res = await fetch('/api/onboarding/complete', { method: 'POST' });
  if (!res.ok) throw new Error('complete_failed');
}

export async function getTemplate(type: TemplateType): Promise<DepartmentNode[]> {
  const res = await fetch(`/api/onboarding/templates/${type}`);
  if (!res.ok) throw new Error('template_failed');
  const body = (await res.json()) as ApiResponse<DepartmentNode[]>;
  return body.data;
}
