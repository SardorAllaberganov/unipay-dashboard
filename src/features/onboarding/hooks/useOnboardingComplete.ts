import { useMutation } from '@tanstack/react-query';
import { completeOnboarding } from '../api';

export function useOnboardingComplete() {
  return useMutation({ mutationFn: completeOnboarding });
}
