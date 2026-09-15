'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button, Icon, Spinner } from '@fixcycle/ui';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useDriverSession } from '@/lib/session';

export default function PendingApprovalPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const { status, profile, refresh, signOut } = useDriverSession();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/login');
    } else if (status !== 'booting' && profile && profile.signupStep >= 9) {
      router.replace('/main');
    }
  }, [status, profile, router]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    setChecking(true);
    try {
      await refresh();
    } finally {
      setChecking(false);
    }
  }, [refresh]);

  const handleSignOut = useCallback(async (): Promise<void> => {
    await signOut();
    router.replace('/login');
  }, [signOut, router]);

  if (status === 'booting' || !profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--fc-surface)]">
        <Spinner className="h-6 w-6 text-[var(--fc-bg-secondary)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center bg-[var(--fc-surface)] px-6 pt-20 pb-8 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--fc-warning)]/10">
        <Icon name="clock" size={40} className="text-[var(--fc-warning)]" />
      </div>
      <h1 className="mb-2 text-xl font-extrabold text-[var(--fc-text-primary)]">
        {t('pending.title', runtime.locale)}
      </h1>
      <p className="mb-8 max-w-xs text-sm text-[var(--fc-text-secondary)]">
        {t('pending.description', runtime.locale)}
      </p>
      <p className="mb-6 rounded-2xl bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-secondary)]">
        {t('pending.check', runtime.locale)}
      </p>
      <Button
        block
        loading={checking}
        onClick={() => void handleRefresh()}
        icon="refresh"
      >
        {t('pending.refresh', runtime.locale)}
      </Button>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="mt-4 text-sm text-[var(--fc-text-secondary)]"
      >
        Sign out
      </button>
    </div>
  );
}