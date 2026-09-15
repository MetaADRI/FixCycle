'use client';

import { OnboardingCarousel } from '@/components/onboarding/onboarding-carousel';
import { AuthShell } from '@/components/auth/auth-shell';

export default function OnBoardPage(): React.ReactNode {
  return (
    <AuthShell>
      <OnboardingCarousel />
    </AuthShell>
  );
}