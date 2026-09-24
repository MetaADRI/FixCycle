'use client';

import { useRouter } from 'next/navigation';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';
import { useBus } from '@/lib/bus/use-bus';
import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

export default function BusResultsPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const bus = useBus();

  const results = bus.searchResults;

  const handleSelectRoute = async (route: typeof results[0]) => {
    const ok = await bus.loadRouteStops(route.routeId);
    if (ok) {
      router.push(`/bus/${route.routeId}`);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('bus.routeResults', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 px-4 pt-4">
        {results.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="bus" size={32} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('bus.noRoutes', runtime.locale)}</p>
            <Button variant="primary" onClick={() => router.push('/bus')}>
              {t('bus.search', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((route) => (
              <button
                key={route.routeId}
                onClick={() => void handleSelectRoute(route)}
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4 text-left transition active:scale-[0.98]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--fc-text-primary)]">{route.routeName}</p>
                    <p className="mt-1 text-xs text-[var(--fc-text-secondary)]">
                      {route.startPoint} Ã¢â€ â€™ {route.endPoint}
                    </p>
                  </div>
                  {route.distance && (
                    <span className="shrink-0 rounded-full bg-[var(--fc-primary-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--fc-primary)]">
                      {route.distance}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-[var(--fc-text-secondary)]">
                  <span className="flex items-center gap-1">
                    <Icon name="loc" size={14} />
                    {route.startPoint}
                  </span>
                  <Icon name="chevron-right" size={14} />
                  <span className="flex items-center gap-1">
                    <Icon name="loc" size={14} />
                    {route.endPoint}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
