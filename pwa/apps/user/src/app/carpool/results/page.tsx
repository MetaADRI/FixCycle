'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';
import { useCarpool } from '@/lib/carpool/use-carpool';
import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

export default function CarpoolResultsPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const searchParams = useSearchParams();
  const carpool = useCarpool();

  const date = searchParams.get('date') ?? '';

  useEffect(() => {
    if (carpool.searchResults.length === 0) {
      router.replace('/carpool');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [rideId, setRideId] = useState<number | string | null>(null);

  const handleBook = async (ride: typeof carpool.searchResults[0]) => {
    if (ride.route_points.length === 0) return;
    setRideId(ride.id);
    router.push(`/carpool/book/${ride.id}?date=${encodeURIComponent(date)}`);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('carpool.availableRides', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 px-4 pt-4">
        {carpool.searching ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : carpool.searchResults.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="carpool" size={32} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('carpool.noRides', runtime.locale)}</p>
            <Button variant="primary" onClick={() => router.push('/carpool')}>
              {t('carpool.search', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {carpool.searchResults.map((ride) => (
              <div
                key={ride.id}
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--fc-text-primary)]">{ride.driver_name}</p>
                    <p className="mt-0.5 text-xs text-[var(--fc-text-secondary)]">{ride.ride_date}</p>
                  </div>
                  <span className="rounded-full bg-[var(--fc-primary-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--fc-primary)]">
                    {ride.per_seat_price} {t('carpool.perSeat', runtime.locale)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-[var(--fc-text-secondary)]">
                  <span>{ride.start_location}</span>
                  <Icon name="chevron-right" size={14} />
                  <span>{ride.end_location}</span>
                </div>

                {ride.vehicle && (
                  <div className="mt-2 text-xs text-[var(--fc-text-secondary)]">
                    {ride.vehicle.make} {ride.vehicle.model} · {ride.vehicle.color} · {ride.vehicle.number}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--fc-text-primary)]">
                    {ride.available_seats} {t('carpool.seats', runtime.locale)} {t('carpool.availableSeats', runtime.locale)}
                  </span>
                  <Button
                    variant="primary"
                   
                    disabled={rideId === ride.id}
                    onClick={() => void handleBook(ride)}
                  >
                    {rideId === ride.id ? '...' : t('carpool.book', runtime.locale)}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}