'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { DriverSplashScreen } from '@/components/splash-screen';
import { useDriverSession } from '@/lib/session';

export function DriverLaunchScreen(): React.ReactNode {
  const { status, profile } = useDriverSession();
  const router = useRouter();
  const [configReady, setConfigReady] = useState(false);

  useEffect(() => {
    if (!configReady || status === 'booting') {
      return;
    }
    if (status === 'signedOut') {
      router.replace('/login');
      return;
    }
    const step = profile?.signupStep ?? 0;
    if (step >= 9) {
      router.replace('/main');
    } else if (step === 8) {
      router.replace('/pending-approval');
    } else {
      router.replace('/on-board');
    }
  }, [configReady, status, profile, router]);

  return <DriverSplashScreen onReady={() => setConfigReady(true)} />;
}