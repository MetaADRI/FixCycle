'use client';

import { useEffect, type ReactNode } from 'react';

import { AppShell, IconButton, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/session';
import { useRuntime } from '@/lib/runtime-context';
import { t } from '@/lib/i18n';

import { NotificationsList } from '@/components/home/notifications-list';

export default function NotificationsPage(): ReactNode {
  const { runtime } = useRuntime();
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/on-board');
    }
  }, [status, router]);

  if (status !== 'signedIn') {
    return null;
  }

  return (
    <AppShell
      header={
        <TopHeader
          title={t('home.notifications', runtime.locale)}
          leading={
            <button type="button" aria-label="Back" onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', runtime.locale)} />
            </button>
          }
        />
      }
    >
      <NotificationsList locale={runtime.locale} />
    </AppShell>
  );
}
