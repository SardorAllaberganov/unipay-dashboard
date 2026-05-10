import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '@/lib/auth';

export function useOnboardingGuard(): void {
  const session = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) return;
    if (session.profile.onboardingComplete) return;
    if (location.pathname.startsWith('/onboarding')) return;
    navigate('/onboarding/1', { replace: true });
  }, [session, location.pathname, navigate]);
}
