'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Icon, IconButton, TopHeader } from '@fixcycle/ui';
import { useCarpool } from '@/lib/carpool/use-carpool';
import type { CarpoolOfferRoutePoint } from '@/lib/carpool/use-carpool';
import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

export default function CarpoolOfferPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const carpool = useCarpool();

  const [availableSeats, setAvailableSeats] = useState('3');
  const [rideTimestamp, setRideTimestamp] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [userVehicleId, setUserVehicleId] = useState('1');
  const [countryAreaId, setCountryAreaId] = useState('1');
  const [routePoints, setRoutePoints] = useState<CarpoolOfferRoutePoint[]>([
    {
      dropNo: 1,
      fromLocation: '',
      toLocation: '',
      fromLatitude: 0,
      fromLongitude: 0,
      toLatitude: 0,
      toLongitude: 0,
      estimateDistance: 0,
    },
  ]);

  const [success, setSuccess] = useState(false);

  const addRoutePoint = () => {
    setRoutePoints((prev) => [
      ...prev,
      {
        dropNo: prev.length + 1,
        fromLocation: '',
        toLocation: '',
        fromLatitude: 0,
        fromLongitude: 0,
        toLatitude: 0,
        toLongitude: 0,
        estimateDistance: 0,
      },
    ]);
  };

  const updateRoutePoint = (index: number, patch: Partial<CarpoolOfferRoutePoint>) => {
    setRoutePoints((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const canSubmit =
    availableSeats.trim() !== '' &&
    Number(availableSeats) >= 1 &&
    rideTimestamp !== '' &&
    startLocation.trim() !== '' &&
    endLocation.trim() !== '' &&
    routePoints.length >= 1;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const id = await carpool.offerRide({
      segmentId: 3,
      countryAreaId,
      userVehicleId,
      availableSeats: Number(availableSeats),
      rideTimestamp,
      startLocation,
      endLocation,
      routePoints,
    });
    if (id) {
      setSuccess(true);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('carpool.offerRide', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 px-4 pt-4 pb-24">
        {success ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="carpool" size={40} className="text-[var(--fc-color-success)]" />
            <p className="text-sm font-semibold text-[var(--fc-text-primary)]">{t('carpool.offerSuccess', runtime.locale)}</p>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => router.push('/carpool/rides')}>
                {t('carpool.myRides', runtime.locale)}
              </Button>
              <Button variant="secondary" onClick={() => router.push('/carpool')}>
                {t('common.retry', runtime.locale)}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <section>
              <h2 className="mb-2 text-xs font-bold uppercase text-[var(--fc-text-secondary)]">Ride details</h2>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    placeholder={t('carpool.offerSeats', runtime.locale)}
                    value={availableSeats}
                    onChange={(e) => setAvailableSeats(e.target.value)}
                    className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
                  />
                  <input
                    type="text"
                    placeholder={t('carpool.offerVehicle', runtime.locale)}
                    value={userVehicleId}
                    onChange={(e) => setUserVehicleId(e.target.value)}
                    className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
                  />
                </div>
                <input
                  type="datetime-local"
                  value={rideTimestamp}
                  onChange={(e) => setRideTimestamp(e.target.value)}
                  className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
                />
                <input
                  type="text"
                  placeholder={t('carpool.offerStart', runtime.locale)}
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
                />
                <input
                  type="text"
                  placeholder={t('carpool.offerEnd', runtime.locale)}
                  value={endLocation}
                  onChange={(e) => setEndLocation(e.target.value)}
                  className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
                />
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-xs font-bold uppercase text-[var(--fc-text-secondary)]">{t('carpool.routePoints', runtime.locale)}</h2>
              <div className="space-y-2">
                {routePoints.map((point, index) => (
                  <div key={index} className="rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-3">
                    <p className="mb-1 text-xs font-semibold text-[var(--fc-text-primary)]">
                      #{point.dropNo}
                    </p>
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="From location"
                        value={point.fromLocation}
                        onChange={(e) => updateRoutePoint(index, { fromLocation: e.target.value })}
                        className="w-full rounded-lg border border-[var(--fc-border)] bg-[var(--fc-surface)] px-2.5 py-2 text-sm text-[var(--fc-text-primary)]"
                      />
                      <input
                        type="text"
                        placeholder="To location"
                        value={point.toLocation}
                        onChange={(e) => updateRoutePoint(index, { toLocation: e.target.value })}
                        className="w-full rounded-lg border border-[var(--fc-border)] bg-[var(--fc-surface)] px-2.5 py-2 text-sm text-[var(--fc-text-primary)]"
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Distance (km)"
                        value={point.estimateDistance || ''}
                        onChange={(e) => updateRoutePoint(index, { estimateDistance: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-[var(--fc-border)] bg-[var(--fc-surface)] px-2.5 py-2 text-sm text-[var(--fc-text-primary)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="secondary" onClick={addRoutePoint} className="mt-2 w-full">
                + {t('carpool.addRoutePoint', runtime.locale)}
              </Button>
            </section>

            {carpool.error && <p className="text-xs text-[var(--fc-error)]">{carpool.error}</p>}
          </div>
        )}
      </main>

      {!success && (
        <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] -translate-x-1/2 border-t border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
          <Button
            variant="primary"
            onClick={() => void handleSubmit()}
            className="w-full"
            disabled={!canSubmit || carpool.offering}
          >
            {carpool.offering ? 'Offering...' : t('carpool.submitOffer', runtime.locale)}
          </Button>
        </div>
      )}
    </div>
  );
}