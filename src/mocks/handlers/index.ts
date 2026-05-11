import { authHandlers } from './auth';
import { onboardingHandlers } from './onboarding';
import { dashboardHandlers } from './dashboard';
import { organizationHandlers } from './organization';
import { staffHandlers } from './staff';
import { studentsHandlers } from './students';
import { paymentsHandlers } from './payments';
import { reportsHandlers } from './reports';

export const handlers = [
  ...authHandlers,
  ...onboardingHandlers,
  ...dashboardHandlers,
  ...organizationHandlers,
  ...staffHandlers,
  ...studentsHandlers,
  ...paymentsHandlers,
  ...reportsHandlers,
];
