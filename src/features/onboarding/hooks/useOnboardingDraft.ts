import { useMutation, useQuery } from '@tanstack/react-query';
import { getDraft, patchDraft } from '../api';
import type { OnboardingDraft } from '../schemas';

const DRAFT_KEY = ['onboarding', 'draft'] as const;

export function useOnboardingDraftQuery() {
  return useQuery({
    queryKey: DRAFT_KEY,
    queryFn: getDraft,
    staleTime: Infinity,
  });
}

export function useSaveOnboardingDraft() {
  return useMutation({
    mutationFn: (patch: Partial<OnboardingDraft>) => patchDraft(patch),
  });
}
