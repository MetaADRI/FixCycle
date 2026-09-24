'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';
import { useCarpool } from '@/lib/carpool/use-carpool';
import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

export default function CarpoolRidesPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const carpool = useCarpool();

  const [tab, setTab] = useState<'offered' | 'taken'>('taken');

  useEffect(() => {
    if (tab === 'offered') {
      void carpool.loadOfferedRides();
    } else {
      void carpool.loadTakenRides();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleCancelTaken = async (id: number) => {
    const ok = await carpool.cancelRide(id);
    if (ok) {
      await carpool.loadTakenRides();
    }
  };

  const handleCancelOffered = async (id: number) => {
    const ok = await carpool.cancelOfferedRide(id);
    if (ok) {
      await carpool.loadOfferedRides();
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('carpool.myRides', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
        trailing={
          <button type="button" aria-label={t('carpool.offerRide', runtime.locale)} onClick={() => router.push('/carpool/offer')}>
            <span className="rounded-full bg-[var(--fc-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--fc-primary)]">
              + {t('carpool.offer', runtime.locale)}
            </span>
          </button>
        }
      />

      <div className="mx-4 mb-4 flex rounded-xl bg-[var(--fc-surface-raised)] p-1">
        <button
          onClick={() => setTab('taken')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            tab === 'taken' ? 'bg-[var(--fc-primary)] text-white' : 'text-[var(--fc-text-secondary)]'
          }`}
        >
          {t('carpool.takenRides', runtime.locale)}
        </button>
        <button
          onClick={() => setTab('offered')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            tab === 'offered' ? 'bg-[var(--fc-primary)] text-white' : 'text-[var(--fc-text-secondary)]'
          }`}
        >
          {t('carpool.offeredRides', runtime.locale)}
        </button>
      </div>

      <main className="flex-1 px-4 pb-24">
        {tab === 'taken' ? (
          carpool.takenLoading && carpool.takenRides.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="h-6 w-6" />
            </div>
          ) : carpool.takenRides.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
              <Icon name="carpool" size={32} className="text-[var(--fc-text-secondary)]" />
              <p className="text-sm text-[var(--fc-text-secondary)]">{t('carpool.noTaken', runtime.locale)}</p>
              <Button variant="primary" onClick={() => router.push('/carpool')}>
                {t('carpool.search', runtime.locale)}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {carpool.takenRides.map((ride) => (
                <div
                  key={ride.id}
                  className="rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-[var(--fc-text-primary)]">{ride.driver_name}</p>
                      <p className="mt-0.5 text-xs text-[var(--fc-text-secondary)]">{ride.ride_date}</p>
                    </div>
                    <span className="text-sm font-bold text-[var(--fc-primary)]">{ride.formatted_amount || ride.total_amount}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-[var(--fc-text-secondary)]">
                    <span>{ride.pickup_location}</span>
                    <Icon name="chevron-right" size={14} />
                    <span>{ride.drop_location}</span>
                  </div>
                  <div className="mt-2 text-xs text-[var(--fc-text-secondary)]">
                    {ride.booked_seats} {t('carpool.seats', runtime.locale)}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={() => router.push(`/carpool/rides/${ride.id}`)}>
                      {t('carpool.rideDetail', runtime.locale)}
                    </Button>
                    {(ride.ride_status === 1 || ride.ride_status === 2) && (
                      <Button
                        variant="danger"
                       
                        className="flex-1"
                        onClick={() => void handleCancelTaken(ride.id)}
                        disabled={carpool.cancelLoading}
                      >
                        {t('carpool.cancelRide', runtime.locale)}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : carpool.offeredLoading && carpool.offeredRides.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : carpool.offeredRides.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="carpool" size={32} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('carpool.noOffered', runtime.locale)}</p>
            <Button variant="primary" onClick={() => router.push('/carpool/offer')}>
              {t('carpool.offerRide', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {carpool.offeredRides.map((ride) => (
              <div key={ride.id} className="rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--fc-text-primary)]">{ride.start_location}</p>
                    <p className="mt-0.5 text-xs text-[var(--fc-text-secondary)]">{ride.ride_date}</p>
                  </div>
                  <span className="rounded-full bg-[var(--fc-primary-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--fc-primary)]">
                    {ride.per_seat_price} {t('carpool.perSeat', runtime.locale)}
                  </span>
                </div>
                <div className="mt-2 text-xs text-[var(--fc-text-secondary)]">
                  {ride.start_location} Ã¢â€ â€™ {ride.end_location}
                </div>
                <div className="mt-2 text-xs text-[var(--fc-text-secondary)]">
                  {ride.available_seats} {t('carpool.seats', runtime.locale)} {t('carpool.availableSeats', runtime.locale)}
                </div>
                <div className="mt-3">
                  {(ride.ride_status === 1 || ride.ride_status === 2) && (
                    <Button
                      variant="danger"
                     
                      className="w-full"
                      onClick={() => void handleCancelOffered(ride.id)}
                      disabled={carpool.cancelLoading}
                    >
                      {t('carpool.cancelOffer', runtime.locale)}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {carpool.error && <p className="mt-3 text-xs text-[var(--fc-error)]">{carpool.error}</p>}
      </main>
    </div>
  );
}