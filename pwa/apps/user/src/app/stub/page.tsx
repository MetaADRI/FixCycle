'use client';

import { Suspense, type ReactNode } from 'react';

import { AppShell, Icon, IconButton, TopHeader } from '@fixcycle/ui';

import { useRouter, useSearchParams } from 'next/navigation';

import { useRuntime } from '@/lib/runtime-context';
import { t } from '@/lib/i18n';

function StubContent(): ReactNode {
  const router = useRouter();
  const { runtime } = useRuntime();
  const params = useSearchParams();
  const title = params.get('title') ?? '';

  return (
    <AppShell
      header={
        <TopHeader
          title={title || t('home.drawer', runtime.locale)}
          leading={
            <button type="button" aria-label="Back" onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', runtime.locale)} />
            </button>
          }
        />
      }
    >
      <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--fc-surface-raised)] text-[var(--fc-text-secondary)]">
          <Icon name="info" size={28} />
        </span>
        <p className="text-sm text-[var(--fc-text-secondary)]">{t('home.emptyMessage', runtime.locale)}</p>
      </div>
    </AppShell>
  );
}

export default function StubPage(): ReactNode {
  return (
    <Suspense fallback={null}>
      <StubContent />
    </Suspense>
  );
}
