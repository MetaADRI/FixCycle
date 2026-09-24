'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useHandyman } from '@/lib/handyman/use-handyman';
import type { HandymanService } from '@fixcycle/api-client';

const SEGMENT_LABELS: Record<string, string> = {
  '6': 'Handyman',
  '7': 'Plumber',
  '8': 'Salon & Spa',
  '9': 'Vehicle Towing',
};

function getSegmentTitle(segmentId: string): string {
  return SEGMENT_LABELS[segmentId] ?? 'Services';
}

export default function HandymanHomePage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ segmentId: string }>();
  const segmentId = params?.segmentId ?? '6';
  const flow = useHandyman(segmentId);

  const [addingId, setAddingId] = useState<number | null>(null);

  const title = getSegmentTitle(segmentId);
  const cartCount = flow.cart?.total_quantity ?? 0;
  const cartTotal = flow.cart?.final_amount ?? 0;
  const minBill = flow.services?.minimum_booking_amount ?? 0;
  const showMinBillNote = flow.cart != null && flow.cart.final_amount < minBill && minBill > 0;

  const handleAdd = useCallback(
    async (service: HandymanService) => {
      setAddingId(service.id);
      await flow.addServiceToCart(service, 1);
      setAddingId(null);
    },
    [flow],
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={title}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 pb-28 pt-3">
        {/* Banner */}
        <section className="mx-4 mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a383b] to-[#287e0a] p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#17b26a]" />
            <span className="text-xs font-semibold text-[#17b26a]">{t('handyman.available', runtime.locale)}</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <img src="/assets/phase-9/category-placeholder.svg" alt="" className="h-16 w-16 shrink-0" />
            <div>
              <h1 className="text-base font-bold text-white">{title}</h1>
              <p className="text-xs text-white/70">Book verified helpers near you</p>
            </div>
          </div>
        </section>

        {/* Category chips */}
        {flow.categories.length > 0 ? (
          <section className="mb-4 px-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {flow.categories.map((cat) => {
                const active = flow.selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => flow.selectCategoryId(cat.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                      active
                        ? 'border-[var(--fc-primary)] bg-[var(--fc-primary)]/10 text-[var(--fc-primary)]'
                        : 'border-[var(--fc-border)] bg-[var(--fc-surface-raised)] text-[var(--fc-text-primary)]'
                    }`}
                  >
                    <img src={cat.image || '/assets/phase-9/category-placeholder.svg'} alt="" className="h-5 w-5 rounded-full object-cover" />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {flow.servicesLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : flow.services?.services ? (
          <>
            {/* Services list */}
            <section className="px-4">
              <ul className="flex flex-col gap-2">
                {flow.services.services.map((svc) => {
                  const inCart = flow.cart?.ordered_services.some((s) => s.service_type_id === svc.id) ?? false;
                  return (
                    <li key={svc.id} className="flex items-center gap-3 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[var(--fc-text-primary)]">{svc.name}</p>
                        <p className="text-xs text-[var(--fc-text-secondary)]">{svc.amount_string}</p>
                      </div>
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

            {showMinBillNote ? (
              <p className="mt-3 px-4 text-xs text-[var(--fc-text-secondary)]">
                {flow.services.min_bill_description || `Minimum booking amount: K${minBill.toLocaleString('en-IN')}`}
              </p>
            ) : null}

            {/* Bidding CTA */}
            {flow.services.handyman_bidding_enable ? (
              <section className="mx-4 mt-4 overflow-hidden rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
                <div className="flex items-center gap-3">
                  <img src="/assets/phase-9/work-request.svg" alt="" className="h-14 w-14 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--fc-text-primary)]">{t('handyman.postRequest', runtime.locale)}</p>
                    <p className="text-xs text-[var(--fc-text-secondary)]">Describe your work and get bids</p>
                  </div>
                  <Button variant="secondary" onClick={() => router.push('/handyman/bidding')}>
                    <Icon name="plus" size={16} />
                  </Button>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </main>

      {/* Bottom bar */}
      {cartCount > 0 || flow.selectedServiceIds.length > 0 ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--fc-border)] bg-white px-4 py-3">
          <div className="mx-auto flex max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] items-center gap-3">
            {cartCount > 0 ? (
              <Button
                variant="secondary"
                onClick={() => router.push(`/handyman/${segmentId}/cart`)}
                className="flex items-center gap-2"
              >
                {cartCount} services Ã‚Â· K{cartTotal.toLocaleString('en-IN')}
              </Button>
            ) : null}
            {flow.selectedServiceIds.length > 0 ? (
              <Button
                variant="primary"
                onClick={() => {
                  const ids = flow.selectedServiceIds.join(',');
                  void flow.loadProviders(segmentId);
                  router.push(`/handyman/${segmentId}/providers?services=${ids}`);
                }}
              >
                {t('handyman.findHandymen', runtime.locale)}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
