'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';
import { useBus } from '@/lib/bus/use-bus';
import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

const STATUS_LABELS: Record<number, string> = {
  1: 'New Booking',
  2: 'Started',
  3: 'Completed',
  4: 'Cancelled',
  5: 'Expired',
};

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

export default function BusBookingsPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const bus = useBus();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    void bus.loadBookings(tab);
  }, [tab]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('bus.myBookings', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      {/* Tabs */}
      <div className="mx-4 mb-4 flex rounded-xl bg-[var(--fc-surface-raised)] p-1">
        <button
          onClick={() => setTab('upcoming')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            tab === 'upcoming' ? 'bg-[var(--fc-primary)] text-white' : 'text-[var(--fc-text-secondary)]'
          }`}
        >
          {t('bus.upcoming', runtime.locale)}
        </button>
        <button
          onClick={() => setTab('past')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            tab === 'past' ? 'bg-[var(--fc-primary)] text-white' : 'text-[var(--fc-text-secondary)]'
          }`}
        >
          {t('bus.past', runtime.locale)}
        </button>
      </div>

      <main className="flex-1 px-4">
        {bus.bookingsLoading && bus.bookings.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : bus.bookings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="history" size={32} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('bus.noBookings', runtime.locale)}</p>
            <Button variant="primary" onClick={() => router.push('/bus')}>
              {t('bus.search', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {bus.bookings.map((booking) => (
              <button
                key={booking.id}
                onClick={() => router.push(`/bus/bookings/${booking.id}`)}
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4 text-left transition active:scale-[0.98]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--fc-text-primary)]">
                      {booking.bus_name} ({booking.bus_number})
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--fc-text-secondary)]">{booking.route_name}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusChip(booking.status)}`}>
                    {booking.status_text || STATUS_LABELS[booking.status] || `Status ${booking.status}`}
                  </span>
                </div>
                <div className="mt-2 text-xs text-[var(--fc-text-secondary)]">
                  {booking.booking_date} · {booking.departure_time} → {booking.arrival_time}
                </div>
                <div className="mt-1 text-xs text-[var(--fc-text-secondary)]">
                  {booking.seat_numbers} · {booking.seat_count} seats
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-[var(--fc-border)] pt-2">
                  <span className="text-xs text-[var(--fc-text-secondary)]">{booking.pickup_location || booking.boarding_point}</span>
                  <span className="text-sm font-bold text-[var(--fc-primary)]">{booking.formatted_amount || booking.total_amount}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}