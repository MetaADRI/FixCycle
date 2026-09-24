'use client';

import { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button, Icon, IconButton, TopHeader } from '@fixcycle/ui';
import { useCarpool } from '@/lib/carpool/use-carpool';
import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

export default function CarpoolBookPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ rideId: string }>();
  const searchParams = useSearchParams();
  const carpool = useCarpool();

  const rideId = params.rideId;
  const dateParam = searchParams.get('date') ?? '';

  const ride = carpool.searchResults.find((r) => String(r.id) === String(rideId));

  const [seats, setSeats] = useState(1);
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [paymentAction, setPaymentAction] = useState<1 | 2 | 3>(1);
  const [pickupLat, setPickupLat] = useState('0');
  const [pickupLng, setPickupLng] = useState('0');
  const [dropLat, setDropLat] = useState('0');
  const [dropLng, setDropLng] = useState('0');

  const canBook =
    seats >= 1 &&
    seats <= (ride?.available_seats ?? 0) &&
    pickupLocation.trim() !== '' &&
    dropLocation.trim() !== '';

  const handleBook = async () => {
    if (!ride || !canBook) return;
    const defaultPoint = ride.route_points[0];
    const result = await carpool.bookRide({
      rideId: ride.id,
      routePointId: defaultPoint?.id ?? ride.id,
      bookedSeats: seats,
      pickupLocation,
      dropLocation,
      pickupLatitude: parseFloat(pickupLat),
      pickupLongitude: parseFloat(pickupLng),
      dropLatitude: parseFloat(dropLat),
      dropLongitude: parseFloat(dropLng),
      paymentAction,
    });
    if (result) {
      router.push('/carpool/rides');
    }
  };

  if (!ride) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
        <TopHeader
          title={t('carpool.bookRide', runtime.locale)}
          leading={
            <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', runtime.locale)} />
            </button>
          }
        />
        <main className="flex-1 px-4 pt-4">
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="carpool" size={32} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('carpool.noRides', runtime.locale)}</p>
            <Button variant="primary" onClick={() => router.push('/carpool')}>
              {t('carpool.search', runtime.locale)}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('carpool.bookRide', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 px-4 pt-4 pb-24">
        {/* Ride summary */}
        <div className="mb-4 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-[var(--fc-text-primary)]">{ride.driver_name}</p>
              <p className="mt-0.5 text-xs text-[var(--fc-text-secondary)]">{ride.ride_date}</p>
            </div>
            <span className="rounded-full bg-[var(--fc-primary-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--fc-primary)]">
              {ride.per_seat_price} {t('carpool.perSeat', runtime.locale)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-[var(--fc-text-secondary)]">
            <span>{ride.start_location}</span>
            <Icon name="chevron-right" size={14} />
            <span>{ride.end_location}</span>
          </div>
          {ride.vehicle && (
            <div className="mt-2 text-xs text-[var(--fc-text-secondary)]">
              {ride.vehicle.make} {ride.vehicle.model} Ã‚Â· {ride.vehicle.color} Ã‚Â· {ride.vehicle.number}
            </div>
          )}
        </div>

        {/* Seats */}
        <div className="mb-4 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
          <p className="mb-2 text-xs font-semibold text-[var(--fc-text-secondary)]">{t('carpool.selectSeats', runtime.locale)}</p>
          <div className="flex items-center gap-3">
            <IconButton
              icon="minus"
              label="Decrease"
              onClick={() => setSeats((v) => Math.max(1, v - 1))}
              disabled={seats <= 1}
            />
            <span className="text-lg font-bold text-[var(--fc-text-primary)]">{seats}</span>
            <IconButton
              icon="plus"
              label="Increase"
              onClick={() => setSeats((v) => Math.min(ride.available_seats, v + 1))}
              disabled={seats >= ride.available_seats}
            />
            <span className="ml-auto text-xs text-[var(--fc-text-secondary)]">
              {ride.available_seats} {t('carpool.availableSeats', runtime.locale)}
            </span>
          </div>
        </div>

        {/* Pickup / Drop */}
        <div className="mb-4 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
          <p className="mb-2 text-xs font-semibold text-[var(--fc-text-secondary)]">{t('carpool.offerStart', runtime.locale)}</p>
          <input
            type="text"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            placeholder={t('carpool.offerStart', runtime.locale)}
            className="w-full rounded-lg border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
          />
          <div className="mt-2 flex gap-2">
            <input type="number" step="any" placeholder="Lat" value={pickupLat} onChange={(e) => setPickupLat(e.target.value)} className="w-1/2 rounded-lg border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)]" />
            <input type="number" step="any" placeholder="Lng" value={pickupLng} onChange={(e) => setPickupLng(e.target.value)} className="w-1/2 rounded-lg border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)]" />
          </div>

          <p className="mb-2 mt-4 text-xs font-semibold text-[var(--fc-text-secondary)]">{t('carpool.offerEnd', runtime.locale)}</p>
          <input
            type="text"
            value={dropLocation}
            onChange={(e) => setDropLocation(e.target.value)}
            placeholder={t('carpool.offerEnd', runtime.locale)}
            className="w-full rounded-lg border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
          />
          <div className="mt-2 flex gap-2">
            <input type="number" step="any" placeholder="Lat" value={dropLat} onChange={(e) => setDropLat(e.target.value)} className="w-1/2 rounded-lg border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)]" />
            <input type="number" step="any" placeholder="Lng" value={dropLng} onChange={(e) => setDropLng(e.target.value)} className="w-1/2 rounded-lg border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)]" />
          </div>
        </div>

        {/* Payment action */}
        <div className="mb-4 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
          <p className="mb-2 text-xs font-semibold text-[var(--fc-text-secondary)]">{t('carpool.paymentAction', runtime.locale)}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentAction(1)}
              className={`flex-1 rounded-lg border p-2.5 text-xs font-semibold ${
                paymentAction === 1 ? 'border-[var(--fc-primary)] bg-[var(--fc-primary-soft)] text-[var(--fc-primary)]' : 'border-[var(--fc-border)] text-[var(--fc-text-primary)]'
              }`}
            >
              {t('carpool.paymentAction1', runtime.locale)}
            </button>
            <button
              onClick={() => setPaymentAction(2)}
              className={`flex-1 rounded-lg border p-2.5 text-xs font-semibold ${
                paymentAction === 2 ? 'border-[var(--fc-primary)] bg-[var(--fc-primary-soft)] text-[var(--fc-primary)]' : 'border-[var(--fc-border)] text-[var(--fc-text-primary)]'
              }`}
            >
              {t('carpool.paymentAction2', runtime.locale)}
            </button>
            <button
              onClick={() => setPaymentAction(3)}
              className={`flex-1 rounded-lg border p-2.5 text-xs font-semibold ${
                paymentAction === 3 ? 'border-[var(--fc-primary)] bg-[var(--fc-primary-soft)] text-[var(--fc-primary)]' : 'border-[var(--fc-border)] text-[var(--fc-text-primary)]'
              }`}
            >
              {t('carpool.paymentAction3', runtime.locale)}
            </button>
          </div>
        </div>

        {/* Total */}
        <div className="rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--fc-text-primary)]">{t('carpool.totalAmount', runtime.locale)}</span>
            <span className="text-base font-bold text-[var(--fc-primary)]">{seats * ride.per_seat_price}</span>
          </div>
        </div>

        {carpool.error && <p className="mt-3 text-xs text-[var(--fc-error)]">{carpool.error}</p>}
      </main>

      <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] -translate-x-1/2 border-t border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
        <Button
          variant="primary"
          onClick={() => void handleBook()}
          className="w-full"
          disabled={!canBook || carpool.booking}
        >
          {carpool.booking ? 'Booking...' : t('carpool.confirmBooking', runtime.locale)}
        </Button>
      </div>
    </div>
  );
}