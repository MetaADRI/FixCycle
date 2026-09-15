'use client';

import { Button, Icon, StatusPill } from '@fixcycle/ui';
import { getCapabilities, isStandaloneMode } from '@fixcycle/pwa-core';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

export function OfflinePanel(): React.ReactNode {
  const { runtime } = useRuntime();
  const capabilities = getCapabilities();

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--fc-info)]/10 text-[var(--fc-info)]">
        <Icon name="wifi-off" size={32} />
      </span>
      <h2 className="text-lg font-bold text-[var(--fc-text-primary)]">{t('offline.title', runtime.locale)}</h2>
      <p className="max-w-xs text-sm leading-6 text-[var(--fc-text-secondary)]">{t('offline.message', runtime.locale)}</p>
      <Button variant="secondary" icon="refresh" onClick={() => window.location.reload()}>
        {t('offline.reload', runtime.locale)}
      </Button>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <StatusPill tone={capabilities.online ? 'success' : 'danger'}>
          online: {capabilities.online ? 'yes' : 'no'}
        </StatusPill>
        <StatusPill tone={capabilities.serviceWorker ? 'success' : 'neutral'}>
          service worker: {capabilities.serviceWorker ? 'active' : 'missing'}
        </StatusPill>
        <StatusPill tone={isStandaloneMode() ? 'success' : 'neutral'}>
          standalone: {isStandaloneMode() ? 'yes' : 'no'}
        </StatusPill>
      </div>
    </div>
  );
}