'use client';

import { useRouter, useParams } from 'next/navigation';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';
import { useBus } from '@/lib/bus/use-bus';
import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useState } from 'react';

export default function BusCheckoutPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ routeId: string }>();
  const bus = useBus();
  const [paymentMethodId, setPaymentMethodId] = useState(1);

  const cr = bus.checkoutResult;
  const sm = bus.seatMap;

  const handleConfirm = async () => {
    if (!sm || !bus.selectedBoardingPoint || !bus.selectedDroppingPoint) return;
    const ok = await bus.runConfirm({
      busId: sm.bus_id,
      routeId: params.routeId ?? sm.bus_id,
      pickupStopId: bus.selectedBoardingPoint.id,
      dropStopId: bus.selectedDroppingPoint.id,
      paymentMethodId,
    });
    if (ok && bus.confirmResult?.busBookingId) {
      router.push(`/bus/bookings/${bus.confirmResult.busBookingId}`);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('bus.checkout', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 px-4 pt-4 pb-24">
        {bus.checkoutLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : !cr || !sm ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="history" size={32} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">Checkout details unavailable - go back and select seats.</p>
            <Button variant="primary" onClick={() => router.back()}>
              {t('common.back', runtime.locale)}
            </Button>
          </div>
        ) : (
          <>
            {/* Journey summary */}
            <div className="mb-4 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <p className="text-sm font-bold text-[var(--fc-text-primary)]">{sm.bus_name} ({sm.bus_number})</p>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-xs text-[var(--fc-text-secondary)]">
                  {bus.selectedBoardingPoint?.stop_name || 'Boarding'} Ã¢â€ â€™ {bus.selectedDroppingPoint?.stop_name || 'Dropping'}
                </p>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-[var(--fc-text-secondary)]">
                <Icon name="clock" size={14} /> {sm.bus_type}
              </div>
              <div className="mt-1 text-xs text-[var(--fc-text-secondary)]">
                {t('bus.departure', runtime.locale)}: {bus.selectedBoardingPoint?.stop_time || '-'} | {t('bus.arrival', runtime.locale)}: {bus.selectedDroppingPoint?.stop_time || '-'}
              </div>
            </div>

            {/* Seat summary */}
            <div className="mb-4 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <p className="text-xs font-semibold text-[var(--fc-text-secondary)]">{t('bus.seatNumbers', runtime.locale)}</p>
              <p className="mt-1 text-sm font-bold text-[var(--fc-text-primary)]">{bus.selectedSeats.join(', ')}</p>
              <div className="mt-3 space-y-1">
                {cr.seat_prices.map((seat) => (
                  <div key={seat.seat_no} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--fc-text-primary)]">Seat {seat.seat_no}</span>
                    <span className="text-[var(--fc-text-primary)]">{seat.formatted || seat.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div className="mb-4 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <p className="mb-2 text-xs font-semibold text-[var(--fc-text-secondary)]">{t('bus.paymentMethod', runtime.locale)}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentMethodId(1)}
                  className={`flex-1 rounded-lg border p-2.5 text-xs font-semibold ${
                    paymentMethodId === 1 ? 'border-[var(--fc-primary)] bg-[var(--fc-primary-soft)] text-[var(--fc-primary)]' : 'border-[var(--fc-border)] text-[var(--fc-text-primary)]'
                  }`}
                >
                  Wallet
                </button>
                <button
                  onClick={() => setPaymentMethodId(2)}
                  className={`flex-1 rounded-lg border p-2.5 text-xs font-semibold ${
                    paymentMethodId === 2 ? 'border-[var(--fc-primary)] bg-[var(--fc-primary-soft)] text-[var(--fc-primary)]' : 'border-[var(--fc-border)] text-[var(--fc-text-primary)]'
                  }`}
                >
                  Pay Later
                </button>
              </div>
            </div>

            {/* Fare summary */}
            <div className="rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--fc-text-secondary)]">Subtotal</span>
                <span className="text-[var(--fc-text-primary)]">{cr.sub_total}</span>
              </div>
              {cr.tax > 0 && (
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-[var(--fc-text-secondary)]">{t('laundry.tax', runtime.locale)}</span>
                  <span className="text-[var(--fc-text-primary)]">{cr.tax}</span>
                </div>
              )}
              {cr.discount > 0 && (
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-[var(--fc-text-secondary)]">{t('laundry.discount', runtime.locale)}</span>
                  <span className="text-[var(--fc-color-success)]">-{cr.discount}</span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between border-t border-[var(--fc-border)] pt-2">
                <span className="text-sm font-bold text-[var(--fc-text-primary)]">{t('bus.price', runtime.locale)}</span>
                <span className="text-base font-bold text-[var(--fc-primary)]">{cr.formatted_total || cr.grand_total}</span>
              </div>
            </div>

            {bus.error && <p className="mt-3 text-xs text-[var(--fc-error)]">{bus.error}</p>}
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] -translate-x-1/2 border-t border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
        <Button variant="primary" onClick={() => void handleConfirm()} className="w-full" disabled={bus.confirmLoading}>
          {bus.confirmLoading ? 'Confirming...' : t('bus.confirmBooking', runtime.locale)}
        </Button>
      </div>
    </div>
  );
}