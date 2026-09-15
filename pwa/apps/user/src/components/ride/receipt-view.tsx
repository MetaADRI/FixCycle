'use client';

import { Button, Icon } from '@fixcycle/ui';

import { t } from '@/lib/i18n';
import type { RideFlow } from '@/lib/ride/use-ride';

export function ReceiptView({ flow, locale }: { flow: RideFlow; locale: string }): React.ReactNode {
  const { receipt, details, currency, openRate, submitTip, activity } = flow;

  const driverName = details?.driver?.fullName ?? details?.driver?.firstName ?? receipt?.driver?.text ?? t('ride.driver', locale);
  const estimate = receipt?.estimatePrice ?? details?.estimatePrice;

  const tipOptions = [5, 10, 20];

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--fc-success)]/10 text-[var(--fc-success)]">
          <Icon name="check" size={32} />
        </span>
        <h1 className="text-lg font-bold text-[var(--fc-text-primary)]">{t('ride.rideComplete', locale)}</h1>
        <p className="text-sm text-[var(--fc-text-secondary)]">{t('ride.thanks', locale)}</p>
      </div>

      <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
        <div className="flex items-center justify-between border-b border-[var(--fc-border)] pb-3">
          <span className="text-sm font-semibold text-[var(--fc-text-primary)]">{driverName}</span>
          {estimate ? (
            <span className="text-base font-bold text-[var(--fc-bg-secondary)]">{currency} {estimate}</span>
          ) : null}
        </div>
        <ul className="mt-2 space-y-1.5">
          {(receipt?.staticValues ?? []).map((v, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="text-[var(--fc-text-secondary)]">{v.parameter ?? v.parameterType ?? '—'}</span>
              <span className="font-medium text-[var(--fc-text-primary)]">{v.amount ?? '—'}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-[var(--fc-border)] pt-2 text-xs text-[var(--fc-text-secondary)]">
          {details?.pickupLocation ? (
            <p className="flex items-center gap-2"><Icon name="loc" size={14} /><span className="truncate">{details.pickupLocation}</span></p>
          ) : null}
          {details?.dropLocation ? (
            <p className="flex items-center gap-2"><Icon name="dest" size={14} /><span className="truncate">{details.dropLocation}</span></p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
        <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('ride.tipDriver', locale)}</h2>
        <div className="flex gap-2">
          {tipOptions.map((amt) => (
            <button
              key={amt}
              onClick={() => void submitTip(amt)}
              disabled={activity === 'busy'}
              className="flex-1 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] py-2.5 text-sm font-semibold text-[var(--fc-bg-secondary)]"
            >
              {currency} {amt}
            </button>
          ))}
        </div>
      </section>

      <Button block variant="primary" icon="star" onClick={openRate}>
        {t('ride.rateDriver', locale)}
      </Button>
    </div>
  );
}
