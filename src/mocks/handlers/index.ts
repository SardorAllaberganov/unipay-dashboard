import { authHandlers } from './auth';
import { onboardingHandlers } from './onboarding';

export const handlers = [...authHandlers, ...onboardingHandlers];
