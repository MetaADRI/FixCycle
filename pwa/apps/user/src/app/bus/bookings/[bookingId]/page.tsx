'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';
import { useBus } from '@/lib/bus/use-bus';
import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

function statusChip(status: number): string {
  switch (status) {
    case 1:
      return 'bg-[var(--fc-info-soft)] text-[var(--fc-info)]';
    case 2:
      return 'bg-[var(--fc-primary-soft)] text-[var(--fc-primary)]';
    case 3:
      return 'bg-[var(--fc-color-success-soft)] text-[var(--fc-color-success)]';
    case 4:
      return 'bg-[var(--fc-error-soft)] text-[var(--fc-error)]';
    default:
      return 'bg-[var(--fc-disabled)] text-[var(--fc-text-secondary)]';
  }
}

export default function BusBookingDetailPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ bookingId: string }>();
  const bus = useBus();
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (params.bookingId) {
      void bus.loadBookingDetail(params.bookingId);
    }
  }, [params.bookingId]);

  const bd = bus.bookingDetail;
  const canCancel = !cancelled && bd && (bd.status === 1 || bd.status === 2);

  const handleCancel = async () => {
    if (!bd) return;
    const ok = await bus.cancelBooking(bd.id);
    if (ok) {
      setCancelled(true);
      void bus.loadBookingDetail(bd.id);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('bus.bookingDetail', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 px-4 pt-4 pb-24">
        {bus.bookingDetailLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : !bd ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="history" size={32} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('bus.noBookings', runtime.locale)}</p>
            <Button variant="primary" onClick={() => router.push('/bus/bookings')}>
              {t('bus.myBookings', runtime.locale)}
            </Button>
          </div>
        ) : (
          <>
            {/* Ticket header */}
            <div className="mb-4 overflow-hidden rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)]">
              <div className="flex items-center justify-between bg-gradient-to-br from-[#1a5f2a] to-[#2a8f4a] p-4">
                <div>
                  <p className="text-base font-bold text-white">{bd.bus_name}</p>
                  <p className="text-xs text-white/70">{bd.bus_number}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[var(--fc-surface)] ${statusChip(bd.status)}`}>
                  {bd.status_text}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--fc-text-secondary)]">{t('bus.departure', runtime.locale)}</p>
                    <p className="text-sm font-bold text-[var(--fc-text-primary)]">{bd.pickup_stop_name || bd.boarding_point}</p>
                    <p className="text-xs text-[var(--fc-text-primary)]">{bd.departure_time}</p>
                  </div>
                  <Icon name="chevron-right" size={18} className="text-[var(--fc-primary)]" />
                  <div className="text-right">
                    <p className="text-xs text-[var(--fc-text-secondary)]">{t('bus.arrival', runtime.locale)}</p>
                    <p className="text-sm font-bold text-[var(--fc-text-primary)]">{bd.drop_stop_name || bd.dropping_point}</p>
                    <p className="text-xs text-[var(--fc-text-primary)]">{bd.arrival_time}</p>
                  </div>
                </div>
                <div className="mt-3 border-t border-[var(--fc-border)] pt-2">
                  <p className="text-xs text-[var(--fc-text-secondary)]">{bd.booking_date}</p>
                </div>
              </div>
            </div>

            {/* Passenger + seat info */}
            <div className="mb-4 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--fc-text-secondary)]">{t('bus.seatNumbers', runtime.locale)}</span>
                <span className="text-sm font-bold text-[var(--fc-text-primary)]">{bd.seat_numbers}</span>
              </div>
              {bd.passenger_name && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--fc-text-secondary)]">{t('carpool.passenger', runtime.locale)}</span>
                  <span className="text-sm text-[var(--fc-text-primary)]">{bd.passenger_name} {bd.passenger_phone ? `· ${bd.passenger_phone}` : ''}</span>
                </div>
              )}
            </div>

            {/* Fare */}
            <div className="mb-4 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--fc-text-primary)]">{t('bus.price', runtime.locale)}</span>
                <span className="text-base font-bold text-[var(--fc-primary)]">{bd.formatted_amount || bd.total_amount}</span>
              </div>
            </div>

            {bd.cancellation_policy && (
              <div className="mb-4 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-3">
                <p className="text-xs text-[var(--fc-text-secondary)]">{bd.cancellation_policy}</p>
              </div>
            )}

            {bus.error && <p className="mb-3 text-xs text-[var(--fc-error)]">{bus.error}</p>}
          </>
        )}
      </main>

      {canCancel && (
        <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
          <Button variant="danger" onClick={() => void handleCancel()} className="w-full" disabled={bus.cancelLoading}>
            {bus.cancelLoading ? 'Cancelling...' : t('bus.cancelBooking', runtime.locale)}
          </Button>
        </div>
      )}
    </div>
  );
}