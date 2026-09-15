'use client';

import { Suspense, useCallback } from 'react';
import { IconButton } from '@fixcycle/ui';

import { DeliveryView } from '@/components/delivery/delivery-view';
import { t } from '@/lib/i18n';
import { useDelivery } from '@/lib/delivery/use-delivery';

function DeliveryInner(): React.ReactNode {
  const flow = useDelivery();

  const titles: Record<string, string> = {
    home: t('delivery.title', 'en'),
    category: t('delivery.chooseCategory', 'en'),
    product: t('delivery.chooseProduct', 'en'),
    vehicle: t('delivery.chooseVehicle', 'en'),
    checkout: t('delivery.title', 'en'),
    confirmed: t('delivery.confirmedTitle', 'en'),
  };

  const showHeader = flow.step !== 'home' && flow.step !== 'confirmed';

  const handleBack = useCallback(() => {
    if (flow.step === 'confirmed') return;
    if (flow.step === 'checkout') {
      flow.setStep('vehicle');
      return;
    }
    if (flow.step === 'vehicle') {
      flow.setStep('product');
      return;
    }
    if (flow.step === 'product') {
      flow.setStep('category');
      return;
    }
    if (flow.step === 'category') {
      flow.reset();
      return;
    }
    flow.reset();
  }, [flow]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      {showHeader ? (
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-[var(--fc-border)] bg-[var(--fc-surface)] px-2">
          <div className="flex w-12 items-center justify-start">
            <IconButton icon="back" label={t('delivery.back', 'en')} onClick={handleBack} />
          </div>
          <h1 className="flex-1 truncate text-center text-base font-bold text-[var(--fc-text-primary)]">
            {titles[flow.step] ?? t('delivery.title', 'en')}
          </h1>
          <div className="flex w-12 items-center justify-end" />
        </header>
      ) : null}

      <main className="flex-1 pb-6 pt-3">
        <DeliveryView flow={flow} />
      </main>
    </div>
  );
}

export default function DeliveryPage(): React.ReactNode {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-sm text-[var(--fc-text-secondary)]">{t('delivery.loading', 'en')}</div>}>
      <DeliveryInner />
    </Suspense>
  );
}

// Re-export for type consumers in the view components.
export type { DeliveryFlow } from '@/lib/delivery/use-delivery';