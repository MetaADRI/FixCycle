'use client';

import { Button, Icon, Spinner } from '@fixcycle/ui';

import { t } from '@/lib/i18n';
import type { RideFlow } from '@/lib/ride/use-ride';

export function SearchingView({ flow, locale }: { flow: RideFlow; locale: string }): React.ReactNode {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <PulseRing />
      <div>
        <h1 className="text-lg font-bold text-[var(--fc-text-primary)]">{t('ride.searching', locale)}</h1>
        <p className="mt-1 max-w-xs text-sm text-[var(--fc-text-secondary)]">{t('ride.searchingForDriver', locale)}</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-[var(--fc-text-secondary)]">
        <Spinner className="h-4 w-4" />
        <span>{t('ride.nearbyDrivers', locale)}</span>
      </div>
      <Button variant="danger" block icon="close" onClick={() => void flow.openCancel()}>
        {t('ride.cancelSearch', locale)}
      </Button>
    </div>
  );
}

function PulseRing(): React.ReactNode {
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <span className="absolute inset-0 animate-ping rounded-full bg-[var(--fc-bg-secondary)]/25" />
      <span className="absolute inset-3 rounded-full bg-[var(--fc-bg-secondary)]/15" />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--fc-bg-secondary)] text-white shadow-lg">
        <Icon name="taxi" size={28} />
      </span>
    </div>
  );
}
