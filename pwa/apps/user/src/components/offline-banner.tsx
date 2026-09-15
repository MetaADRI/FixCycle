'use client';

import { useEffect, useState } from 'react';

import { Button, Icon } from '@fixcycle/ui';
import { subscribeOnlineChange } from '@fixcycle/pwa-core';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

export function OfflineBanner(): React.ReactNode {
  const { runtime } = useRuntime();
  const [online, setOnline] = useState(true);

  useEffect(() => subscribeOnlineChange(setOnline), []);

  if (online) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 bg-[var(--fc-warning)] px-4 py-2 text-xs font-semibold text-black">
      <Icon name="wifi-off" size={16} />
      <span className="flex-1">{t('splash.offline', runtime.locale)}</span>
      <Button variant="ghost" className="min-h-0 px-2 py-1 text-xs" onClick={() => window.location.reload()}>
        {t('offline.reload', runtime.locale)}
      </Button>
    </div>
  );
}