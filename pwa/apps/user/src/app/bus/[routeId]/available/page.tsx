'use client';

import { useRouter, useParams } from 'next/navigation';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';
import { useBus } from '@/lib/bus/use-bus';
import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

export default function BusAvailablePage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ routeId: string }>();
  const bus = useBus();

  const routeId = params.routeId;

  const handleSelectBus = async (busItem: typeof bus.availableBuses[0]) => {
    if (!bus.selectedBoardingPoint || !bus.selectedDroppingPoint) return;
    const ok = await bus.loadSeatMap({
      busId: busItem.bus_id,
      routeId: routeId ?? busItem.id,
      pickupStopId: bus.selectedBoardingPoint.id,
      dropStopId: bus.selectedDroppingPoint.id,
    });
    if (ok) {
      router.push(`/bus/${routeId}/seats`);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('bus.availableBuses', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 px-4 pt-4">
        {bus.availableBusesLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : bus.availableBuses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="bus" size={32} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('bus.noBuses', runtime.locale)}</p>
            <Button variant="primary" onClick={() => router.back()}>
              {t('common.back', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {bus.availableBuses.map((busItem) => (
              <button
                key={busItem.bus_id}
                onClick={() => void handleSelectBus(busItem)}
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4 text-left transition active:scale-[0.98]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--fc-text-primary)]">
                      {busItem.bus_name || busItem.bus_number}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--fc-text-secondary)]">{busItem.bus_number}</p>
                  </div>
                  <span className="rounded-full bg-[var(--fc-primary-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--fc-primary)]">
                    {busItem.formatted_price || busItem.price}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-[var(--fc-text-secondary)]">
                  <span className="flex items-center gap-1">
                    <Icon name="clock" size={14} />
                    {busItem.departure_time}
                  </span>
                  <Icon name="chevron-right" size={14} />
                  <span>{busItem.arrival_time}</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-xs font-semibold text-[var(--fc-text-primary)]">
                    {busItem.available_seats} seats
                  </span>
                  {busItem.bus_type && (
                    <span className="rounded-full bg-[var(--fc-surface)] px-2 py-0.5 text-xs text-[var(--fc-text-secondary)]">
                      {busItem.bus_type}
                    </span>
                  )}
                  {busItem.service_name && (
                    <span className="rounded-full bg-[var(--fc-surface)] px-2 py-0.5 text-xs text-[var(--fc-text-secondary)]">
                      {busItem.service_name}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
