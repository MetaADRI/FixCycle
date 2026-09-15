'use client';

import { Button, Icon } from '@fixcycle/ui';

import { t } from '@/lib/i18n';
import type { RideFlow } from '@/lib/ride/use-ride';

export function ScheduledView({ flow, locale }: { flow: RideFlow; locale: string }): React.ReactNode {
  const { laterDate, laterTime, pendingBookings, scheduleAnother, resetFlow } = flow;

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--fc-primary)]/15">
          <Icon name="clock" size={30} className="text-[var(--fc-primary)]" />
        </div>
        <h2 className="text-lg font-bold text-[var(--fc-text-primary)]">{t('ride.scheduledConfirmation', locale)}</h2>
        {laterDate || laterTime ? (
          <p className="flex items-center gap-1.5 text-sm text-[var(--fc-text-secondary)]">
            <Icon name="clock" size={16} />
            {t('ride.scheduledFor', locale)}&nbsp;{laterDate || t('ride.chooseDate', locale)}{' '}
            {laterTime ? `· ${laterTime}` : ''}
          </p>
        ) : null}
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-[var(--fc-text-primary)]">{t('ride.pendingRides', locale)}</h3>
        {pendingBookings.length === 0 ? (
          <p className="rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4 text-center text-sm text-[var(--fc-text-secondary)]">
            {t('ride.noPendingRides', locale)}
          </p>
        ) : (
          <div className="space-y-2">
            {pendingBookings.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--fc-text-primary)]">
                    {b.vehicleTypeName || b.serviceTypeName}
                  </span>
                  {b.laterDate || b.laterTime ? (
                    <span className="flex items-center gap-1 text-xs text-[var(--fc-text-secondary)]">
                      <Icon name="clock" size={13} />
                      {b.laterDate ?? ''} {b.laterTime ?? ''}
                    </span>
                  ) : null}
                </div>
                {b.pickupLocation || b.dropLocation ? (
                  <p className="mt-1.5 truncate text-xs text-[var(--fc-text-secondary)]">
                    {b.pickupLocation ?? ''} → {b.dropLocation ?? ''}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <Button
        variant="primary"
        disabled={flow.activity === 'busy'}
        onClick={scheduleAnother ?? resetFlow}
        className="w-full"
      >
        {t('ride.scheduleAnother', locale)}
      </Button>
    </div>
  );
}
