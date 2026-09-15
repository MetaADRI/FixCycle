'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { SplashScreen } from '@/components/splash-screen';
import { useAuth } from '@/lib/session';

export function LaunchScreen(): React.ReactNode {
  const { status } = useAuth();
  const router = useRouter();
  const [configReady, setConfigReady] = useState(false);

  useEffect(() => {
    if (configReady && status !== 'booting') {
      router.replace(status === 'signedIn' ? '/home' : '/on-board');
    }
  }, [configReady, status, router]);

  return <SplashScreen onReady={() => setConfigReady(true)} />;
}