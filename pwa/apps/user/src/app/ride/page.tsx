'use client';

import { Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Icon, IconButton } from '@fixcycle/ui';

import { CancelView } from '@/components/ride/cancel-view';
import { CheckoutView } from '@/components/ride/checkout-view';
import { PlanView } from '@/components/ride/plan-view';
import { RateView } from '@/components/ride/rate-view';
import { ReceiptView } from '@/components/ride/receipt-view';
import { ScheduledView } from '@/components/ride/scheduled-view';
import { SearchingView } from '@/components/ride/searching-view';
import { TrackingView } from '@/components/ride/tracking-view';
import { t, type TranslationKey } from '@/lib/i18n';
import { useRideFlow } from '@/lib/ride/use-ride';
import { useRuntime } from '@/lib/runtime-context';

function RideInner(): React.ReactNode {
  const { runtime } = useRuntime();
  const locale = runtime.locale;
  const params = useSearchParams();
  const segment = params.get('segment') ?? '';
  const area = params.get('area') ?? params.get('areaId') ?? '';

  const flow = useRideFlow({ segmentId: segment, areaId: area });

  const titles: Record<string, string> = {
    plan: t('ride.title', locale),
    checkout: t('ride.checkout', locale),
    searching: t('ride.searching', locale),
    tracking: t('ride.title', locale),
    receipt: t('ride.receipt', locale),
    rate: t('ride.rateTitle', locale),
    cancel: t('ride.cancelRide', locale),
    scheduled: t('ride.scheduledTitle', locale),
  };

  const showHeader = flow.view !== 'plan';

  const handleBack = useCallback(() => {
    if (flow.view === 'checkout') flow.resetFlow();
    else if (flow.view === 'rate') flow.backToReceipt();
    else if (flow.view === 'cancel') flow.resumeTracking();
    else flow.resetFlow();
  }, [flow]);

  let content: React.ReactNode;
  switch (flow.view) {
    case 'checkout':
      content = <CheckoutView flow={flow} locale={locale} />;
      break;
    case 'searching':
      content = <SearchingView flow={flow} locale={locale} />;
      break;
    case 'tracking':
      content = <TrackingView flow={flow} locale={locale} />;
      break;
    case 'receipt':
      content = <ReceiptView flow={flow} locale={locale} />;
      break;
    case 'rate':
      content = <RateView flow={flow} locale={locale} />;
      break;
    case 'cancel':
      content = <CancelView flow={flow} locale={locale} />;
      break;
    case 'scheduled':
      content = <ScheduledView flow={flow} locale={locale} />;
      break;
    default:
      content = <PlanView flow={flow} locale={locale} segmentSlug={segment} />;
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      {showHeader ? (
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-[var(--fc-border)] bg-[var(--fc-surface)] px-2">
          <div className="flex w-12 items-center justify-start">
            <IconButton icon="back" label={t('ride.back', locale)} onClick={handleBack} />
          </div>
          <h1 className="flex-1 truncate text-center text-base font-bold text-[var(--fc-text-primary)]">{titles[flow.view]}</h1>
          <div className="flex w-12 items-center justify-end" />
        </header>
      ) : null}

      {flow.error ? (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-[var(--fc-danger)]/30 bg-[var(--fc-danger)]/10 px-3 py-2 text-sm text-[var(--fc-danger)]">
          <Icon name="alert" size={18} />
          <span className="flex-1">{t(flow.error.message as TranslationKey, locale)}</span>
          <button onClick={flow.clearError} className="font-semibold">
            <Icon name="close" size={18} />
          </button>
        </div>
      ) : null}

      <main className="flex-1 pb-6 pt-3">{content}</main>
    </div>
  );
}

export default function RidePage(): React.ReactNode {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-sm text-[var(--fc-text-secondary)]">{t('ride.loading', 'en')}</div>}>
      <RideInner />
    </Suspense>
  );
}
