'use client';

import { Icon, StatusPill } from '@fixcycle/ui';
import type { DriverBooking } from '@fixcycle/api-client';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

interface BookingCardProps {
  booking: DriverBooking;
  onView?: (booking: DriverBooking) => void;
}

function statusTone(status: number): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 4 || status === 5) return 'success';
  if (status === 1) return 'warning';
  if (status === 3) return 'danger';
  return 'neutral';
}

export function BookingCard({ booking, onView }: BookingCardProps): React.ReactNode {
  const { runtime } = useRuntime();
  return (
    <div className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="taxi" size={18} className="text-[var(--fc-bg-secondary)]" />
          <span className="text-sm font-bold text-[var(--fc-text-primary)]">
            {booking.segmentName || booking.serviceName}
          </span>
        </div>
        <StatusPill tone={statusTone(booking.status)}>
          {booking.statusText}
        </StatusPill>
      </div>
      <div className="mb-3 space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <Icon name="loc" size={14} className="mt-0.5 shrink-0 text-blue-500" />
          <span className="text-[var(--fc-text-primary)]">{booking.pickupAddress}</span>
        </div>
        <div className="flex items-start gap-2">
          <Icon name="dest" size={14} className="mt-0.5 shrink-0 text-[var(--fc-danger)]" />
          <span className="text-[var(--fc-text-primary)]">{booking.dropAddress}</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--fc-text-secondary)]">{booking.createdAt}</span>
        <span className="font-bold text-[var(--fc-text-primary)]">
          {booking.currency}{booking.amount}
        </span>
      </div>
      {onView ? (
        <button
          type="button"
          onClick={() => onView(booking)}
          className="mt-3 w-full rounded-xl bg-[var(--fc-surface-raised)] py-2.5 text-xs font-semibold text-[var(--fc-bg-secondary)]"
        >
          {t('jobs.viewDetails', runtime.locale)}
        </button>
      ) : null}
    </div>
  );
}