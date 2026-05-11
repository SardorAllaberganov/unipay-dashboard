import { authHandlers } from './auth';
import { onboardingHandlers } from './onboarding';
import { dashboardHandlers } from './dashboard';
import { organizationHandlers } from './organization';
import { staffHandlers } from './staff';
import { studentsHandlers } from './students';

export const handlers = [
  ...authHandlers,
  ...onboardingHandlers,
  ...dashboardHandlers,
  ...organizationHandlers,
  ...staffHandlers,
  ...studentsHandlers,
];
