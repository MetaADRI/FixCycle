'use client';

import { useState } from 'react';
import { Button, Icon } from '@fixcycle/ui';

import { t } from '@/lib/i18n';
import type { RideFlow } from '@/lib/ride/use-ride';

export function RateView({ flow, locale }: { flow: RideFlow; locale: string }): React.ReactNode {
  const { submitRating, activity, resetFlow } = flow;
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const driverName = flow.details?.driver?.fullName ?? t('ride.driver', locale);

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="text-center">
        <h1 className="text-lg font-bold text-[var(--fc-text-primary)]">{t('ride.rateTitle', locale)}</h1>
        <p className="mt-1 text-sm text-[var(--fc-text-secondary)]">{driverName} · {t('ride.rateSubtitle', locale)}</p>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => setScore(s)}
            aria-label={`${s} star${s > 1 ? 's' : ''}`}
            className="text-[var(--fc-text-secondary)]"
          >
            <Icon name="star" size={36} className={s <= score ? 'fill-[var(--fc-warning)] text-[var(--fc-warning)]' : ''} />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t('ride.commentPlaceholder', locale)}
        rows={3}
        className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
      />

      <Button
        block
        variant="primary"
        loading={activity === 'busy'}
        disabled={score === 0}
        onClick={() => void submitRating(score, comment)}
      >
        {t('ride.submit', locale)}
      </Button>
      <Button variant="ghost" block onClick={resetFlow}>
        {t('ride.back', locale)}
      </Button>
    </div>
  );
}
