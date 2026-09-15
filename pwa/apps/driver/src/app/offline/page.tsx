'use client';

import { Icon } from '@fixcycle/ui';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

export default function OfflinePage(): React.ReactNode {
  const { runtime } = useRuntime();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--fc-surface)] px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--fc-warning)]/10">
        <Icon name="wifi-off" size={40} className="text-[var(--fc-warning)]" />
      </div>
      <h1 className="mb-2 text-xl font-extrabold text-[var(--fc-text-primary)]">
        {t('offline.title', runtime.locale)}
      </h1>
      <p className="mb-8 max-w-xs text-sm text-[var(--fc-text-secondary)]">
        {t('offline.description', runtime.locale)}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--fc-bg-secondary)] px-6 text-sm font-semibold text-white"
      >
        <Icon name="refresh" size={16} />
        {t('offline.retry', runtime.locale)}
      </button>
    </div>
  );
}