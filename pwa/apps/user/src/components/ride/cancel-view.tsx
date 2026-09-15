'use client';

import { Button, Icon } from '@fixcycle/ui';

import { t } from '@/lib/i18n';
import type { RideFlow } from '@/lib/ride/use-ride';

export function CancelView({ flow, locale }: { flow: RideFlow; locale: string }): React.ReactNode {
  const { cancelReasons, doCancel, activity, resetFlow } = flow;
  const reasons = cancelReasons?.reasons ?? [];

  return (
    <div className="flex flex-col gap-3 py-4">
      <h1 className="text-base font-bold text-[var(--fc-text-primary)]">{t('ride.cancelReasons', locale)}</h1>
      {cancelReasons?.cancelCharges ? (
        <p className="flex items-center gap-1.5 text-xs text-[var(--fc-warning)]">
          <Icon name="info" size={14} /> {t('ride.cancelCharges', locale)}
        </p>
      ) : null}

      <div className="space-y-2">
        {reasons.length === 0 ? (
          <p className="rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4 text-center text-sm text-[var(--fc-text-secondary)]">
            {t('ride.selectReason', locale)}
          </p>
        ) : (
          reasons.map((r) => (
            <button
              key={r.id}
              disabled={activity === 'busy'}
              onClick={() => void doCancel(r.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-left"
            >
              <span className="flex-1 text-sm font-medium text-[var(--fc-text-primary)]">{r.reason}</span>
              <Icon name="chevron-right" size={18} className="text-[var(--fc-text-secondary)]" />
            </button>
          ))
        )}
      </div>

      <Button variant="ghost" block onClick={resetFlow}>
        {t('ride.back', locale)}
      </Button>
    </div>
  );
}
