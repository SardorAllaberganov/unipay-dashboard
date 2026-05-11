import { authHandlers } from './auth';
import { onboardingHandlers } from './onboarding';
import { dashboardHandlers } from './dashboard';
import { organizationHandlers } from './organization';
import { staffHandlers } from './staff';
import { studentsHandlers } from './students';
import { paymentsHandlers } from './payments';

export const handlers = [
  ...authHandlers,
  ...onboardingHandlers,
  ...dashboardHandlers,
  ...organizationHandlers,
  ...staffHandlers,
  ...studentsHandlers,
  ...paymentsHandlers,
];
