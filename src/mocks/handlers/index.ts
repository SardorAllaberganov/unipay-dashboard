import { authHandlers } from './auth';
import { onboardingHandlers } from './onboarding';
import { dashboardHandlers } from './dashboard';
import { organizationHandlers } from './organization';
import { staffHandlers } from './staff';

export const handlers = [
  ...authHandlers,
  ...onboardingHandlers,
  ...dashboardHandlers,
  ...organizationHandlers,
  ...staffHandlers,
];
