import { authHandlers } from './auth';
import { onboardingHandlers } from './onboarding';
import { dashboardHandlers } from './dashboard';

export const handlers = [...authHandlers, ...onboardingHandlers, ...dashboardHandlers];
