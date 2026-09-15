'use client';

import { useRouter, useParams } from 'next/navigation';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';
import { useBus } from '@/lib/bus/use-bus';
import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

const DECK_COLORS = {
  available: 'bg-[var(--fc-surface-raised)] border-[var(--fc-border)] text-[var(--fc-text-primary)]',
  booked: 'bg-[var(--fc-disabled)] border-[var(--fc-disabled)] text-[var(--fc-text-secondary)]',
  selected: 'bg-[var(--fc-primary)] border-[var(--fc-primary)] text-white',
};

export default function BusSeatMapPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ routeId: string }>();
  const bus = useBus();

  const sm = bus.seatMap;

  const handleCheckout = async () => {
    if (!sm || !bus.selectedBoardingPoint || !bus.selectedDroppingPoint) return;
    const ok = await bus.runCheckout({
      busId: sm.bus_id,
      routeId: params.routeId ?? sm.bus_id,
      pickupStopId: bus.selectedBoardingPoint.id,
      dropStopId: bus.selectedDroppingPoint.id,
    });
    if (ok) {
      router.push(`/bus/${params.routeId}/checkout`);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('bus.seatMap', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
        trailing={<span className="text-sm font-semibold text-[var(--fc-primary)]">{bus.selectedSeats.length} {t('bus.seatsSelected', runtime.locale)}</span>}
      />

      <main className="flex-1 px-4 pt-4 pb-20">
        {bus.seatMapLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : !sm ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="bus" size={32} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">No seat layout available</p>
            <Button variant="primary" onClick={() => router.back()}>
              {t('common.back', runtime.locale)}
            </Button>
          </div>
        ) : (
          <>
            {/* Bus info */}
            <div className="mb-4 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-3">
              <p className="text-sm font-bold text-[var(--fc-text-primary)]">{sm.bus_name}</p>
              <p className="text-xs text-[var(--fc-text-secondary)]">{sm.bus_number} | {sm.bus_type}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-[var(--fc-primary-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--fc-primary)]">
                  {sm.seat_price} {t('bus.perSeat', runtime.locale) || '/ seat'}
                </span>
                <span className="text-xs text-[var(--fc-text-secondary)]">{sm.available_seats} available</span>
              </div>
            </div>

            {/* Legend */}
            <div className="mb-4 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-[var(--fc-surface-raised)] border border-[var(--fc-border)]" /> Available</span>
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-[var(--fc-primary)]" /> Selected</span>
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-[var(--fc-disabled)]" /> Booked</span>
            </div>

            {/* Seat grid */}
            <div className="mx-auto max-w-[280px]">
              <div className="flex items-center justify-between text-[10px] text-[var(--fc-text-secondary)]">
                <span>Driver</span>
                <span>DOOR</span>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {sm.seat_details.map((seat) => {
                  const isAvailable = seat.seat_status === 'available' || seat.seat_status === '0';
                  const isBooked = !isAvailable;
                  const isSelected = bus.selectedSeats.includes(seat.seat_no);
                  const statusKey = isBooked ? 'booked' : isSelected ? 'selected' : 'available';

                  return (
                    <button
                      key={seat.seat_no}
                      disabled={isBooked}
                      onClick={() => bus.toggleSeat(seat.seat_no)}
                      className={`flex h-9 w-full items-center justify-center rounded-lg border text-xs font-semibold transition ${
                        DECK_COLORS[statusKey]
                      } ${isBooked ? 'cursor-not-allowed opacity-50' : 'active:scale-95'}`}
                      title={`${seat.seat_no} - ${seat.type_slug}`}
                    >
                      {seat.seat_no}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price summary */}
            {bus.selectedSeats.length > 0 && (
              <div className="mt-6 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-3">
                <p className="text-xs font-semibold text-[var(--fc-text-secondary)]">{t('bus.seatsSelected', runtime.locale)}</p>
                <p className="mt-1 text-sm text-[var(--fc-text-primary)]">{bus.selectedSeats.join(', ')}</p>
                <div className="mt-2 border-t border-[var(--fc-border)] pt-2">
                  <p className="text-xs text-[var(--fc-text-secondary)]">{bus.selectedSeats.length} x {sm.seat_price}</p>
                  <p className="text-base font-bold text-[var(--fc-primary)]">
                    Total: {sm.seat_price * bus.selectedSeats.length}
                  </p>
                </div>
              </div>
            )}

            {bus.error && <p className="mt-3 text-xs text-[var(--fc-error)]">{bus.error}</p>}
          </>
        )}
      </main>

      {/* Fixed bottom CTA */}
      {sm && bus.selectedSeats.length > 0 && (
        <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
          <Button variant="primary" onClick={() => void handleCheckout()} className="w-full" disabled={bus.checkoutLoading}>
            {bus.checkoutLoading ? 'Processing...' : t('bus.checkout', runtime.locale)}
          </Button>
        </div>
      )}
    </div>
  );
}
