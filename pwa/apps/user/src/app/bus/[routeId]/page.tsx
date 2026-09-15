'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';
import { useBus } from '@/lib/bus/use-bus';
import type { BusRouteStop } from '@fixcycle/api-client';
import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

export default function BusRoutePage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ routeId: string }>();
  const bus = useBus();

  const routeId = params.routeId;

  useEffect(() => {
    if (bus.routeStops.length === 0 && routeId) {
      void bus.loadRouteStops(routeId);
    }
  }, [routeId, bus.routeStops.length]);

  const [selectedBoard, setSelectedBoard] = useState<BusRouteStop | null>(null);
  const [selectedDrop, setSelectedDrop] = useState<BusRouteStop | null>(null);

  useEffect(() => {
    if (selectedBoard) bus.selectBoardingPoint(selectedBoard);
  }, [selectedBoard]);
  useEffect(() => {
    if (selectedDrop) bus.selectDroppingPoint(selectedDrop);
  }, [selectedDrop]);

  const canProceed = selectedBoard && selectedDrop && selectedBoard.stop_no < selectedDrop.stop_no;

  const handleSearch = async () => {
    if (!routeId || !selectedBoard || !selectedDrop) return;
    const ok = await bus.loadAvailableBuses({
      routeId,
      pickupStopId: selectedBoard.id,
      dropStopId: selectedDrop.id,
    });
    if (ok) {
      router.push(`/bus/${routeId}/available`);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('bus.selectRoute', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 px-4 pt-4">
        {bus.routeStopsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : bus.routeStops.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="bus" size={32} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">No stops available for this route</p>
            <Button variant="primary" onClick={() => router.back()}>
              {t('common.back', runtime.locale)}
            </Button>
          </div>
        ) : (
          <>
            {/* Boarding points */}
            <section className="mb-6">
              <h2 className="mb-2 text-xs font-bold uppercase text-[var(--fc-text-secondary)]">{t('bus.board', runtime.locale)}</h2>
              <div className="space-y-2">
                {bus.routeStops.map((stop) => (
                  <button
                    key={`board-${stop.id}`}
                    onClick={() => setSelectedBoard(stop)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedBoard?.id === stop.id
                        ? 'border-[var(--fc-primary)] bg-[var(--fc-primary-soft)]'
                        : 'border-[var(--fc-border)] bg-[var(--fc-surface-raised)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--fc-text-primary)]">{stop.stop_name}</span>
                      {stop.stop_time && (
                        <span className="text-xs text-[var(--fc-text-secondary)]">{stop.stop_time}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Dropping points */}
            <section className="mb-6">
              <h2 className="mb-2 text-xs font-bold uppercase text-[var(--fc-text-secondary)]">{t('bus.drop', runtime.locale)}</h2>
              <div className="space-y-2">
                {bus.routeStops.map((stop) => (
                  <button
                    key={`drop-${stop.id}`}
                    onClick={() => setSelectedDrop(stop)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedDrop?.id === stop.id
                        ? 'border-[var(--fc-primary)] bg-[var(--fc-primary-soft)]'
                        : 'border-[var(--fc-border)] bg-[var(--fc-surface-raised)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--fc-text-primary)]">{stop.stop_name}</span>
                      {stop.stop_time && (
                        <span className="text-xs text-[var(--fc-text-secondary)]">{stop.stop_time}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {bus.error && <p className="mb-3 text-xs text-[var(--fc-error)]">{bus.error}</p>}

            <Button
              variant="primary"
              disabled={!canProceed}
              onClick={() => void handleSearch()}
              className="w-full"
            >
              {t('bus.availableBuses', runtime.locale)}
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
