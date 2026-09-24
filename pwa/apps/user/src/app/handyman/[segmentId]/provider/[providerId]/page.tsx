'use client';

import { useCallback, useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useHandyman } from '@/lib/handyman/use-handyman';
import type { HandymanService, HandymanProviderService } from '@fixcycle/api-client';

export default function HandymanProviderDetailPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ segmentId: string; providerId: string }>();
  const segmentId = params?.segmentId ?? '6';
  const providerId = params?.providerId ?? '';
  const flow = useHandyman(segmentId);

  const [addingId, setAddingId] = useState<number | null>(null);

  const provider = flow.provider;
  const cartTotal = flow.cart?.final_amount ?? 0;

  const handleAdd = useCallback(
    async (svc: HandymanProviderService) => {
      const serviceObj: HandymanService = {
        id: svc.id,
        name: svc.name,
        price: svc.amount,
        amount_string: svc.amount_string,
        price_type: 1,
        segment_price_card_id: flow.provider?.segment_price_card_id ?? flow.slots?.time_slots?.[0]?.id ?? 0,
      };
      setAddingId(svc.id);
      await flow.addServiceToCart(serviceObj, 1);
      setAddingId(null);
    },
    [flow],
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={provider ? `${provider.first_name} ${provider.last_name}` : 'Provider'}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 pb-28 pt-3">
        {!provider ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4">
            {/* Hero */}
            <section className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <img src={provider.image || '/assets/phase-9/provider-avatar.svg'} alt="" className="h-20 w-20 rounded-full object-cover" />
              <h2 className="text-base font-bold text-[var(--fc-text-primary)]">
                {provider.first_name} {provider.last_name}
              </h2>
              {provider.business_name ? (
                <p className="text-xs text-[var(--fc-text-secondary)]">{provider.business_name}</p>
              ) : null}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Icon name="star" size={14} className="text-[var(--fc-warning)]" />
                  <span className="text-sm font-semibold text-[var(--fc-text-primary)]">{provider.rating_number}/5</span>
                </div>
                {provider.distance ? (
                  <span className="flex items-center gap-1 text-xs text-[var(--fc-text-secondary)]">
                    <Icon name="loc" size={12} /> {provider.distance}
                  </span>
                ) : null}
                {provider.time_range ? (
                  <span className="flex items-center gap-1 text-xs text-[var(--fc-text-secondary)]">
                    <Icon name="clock" size={12} /> {provider.time_range}
                  </span>
                ) : null}
              </div>
            </section>

            {/* Services table */}
            {provider.services.length > 0 ? (
              <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
                <h3 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">Services</h3>
                <ul className="flex flex-col gap-2">
                  {provider.services.map((svc) => {
                    const inCart = flow.cart?.ordered_services.some((s) => s.service_type_id === svc.id) ?? false;
                    return (
                      <li key={svc.id} className="flex items-center gap-3">
                        <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--fc-text-primary)]">{svc.name}</span>
                        <span className="text-sm text-[var(--fc-text-secondary)]">{svc.amount_string}</span>
                        <button
                          onClick={() => void handleAdd(svc)}
                          disabled={addingId === svc.id}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--fc-border)] bg-[var(--fc-surface)] text-[var(--fc-primary)]"
                        >
                          {addingId === svc.id ? (
                            <Spinner className="h-4 w-4" />
                          ) : (
                            <Icon name={inCart ? 'check' : 'plus'} size={14} />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {/* Time slots */}
            {flow.slots && flow.slots.time_slots.length > 0 ? (
              <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
                <h3 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">Time Slot</h3>
                <div className="flex flex-wrap gap-2">
                  {flow.slots.time_slots.map((slot) => {
                    const active = flow.selectedSlotId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => flow.selectSlot(slot.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          active
                            ? 'border-[var(--fc-primary)] bg-[var(--fc-primary)]/10 text-[var(--fc-primary)]'
                            : 'border-[var(--fc-border)] bg-[var(--fc-surface)] text-[var(--fc-text-primary)]'
                        }`}
                      >
                        {slot.slot_time}
                      </button>
                    );
                  })}
                </div>
                {flow.slots.instant_booking_after_text ? (
                  <p className="mt-2 text-[10px] text-[var(--fc-text-secondary)]">{flow.slots.instant_booking_after_text}</p>
                ) : null}
              </section>
            ) : null}

            {provider.min_bill_description ? (
              <p className="text-xs text-[var(--fc-text-secondary)]">{provider.min_bill_description}</p>
            ) : null}
          </div>
        )}
      </main>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--fc-border)] bg-white px-4 py-3">
        <div className="mx-auto flex max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] items-center justify-between">
          <div>
            <p className="text-xs text-[var(--fc-text-secondary)]">Total</p>
            <p className="text-base font-bold text-[var(--fc-text-primary)]">Ã¢â€šÂ¹{cartTotal.toLocaleString('en-IN')}</p>
          </div>
          <Button variant="primary" onClick={() => router.push(`/handyman/${segmentId}/cart`)}>
            {t('handyman.bookNow', runtime.locale)}
          </Button>
        </div>
      </div>
    </div>
  );
}
