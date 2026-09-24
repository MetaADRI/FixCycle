'use client';

import { useCallback, useEffect } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useLaundry } from '@/lib/laundry/use-laundry';
import type { LaundryService } from '@fixcycle/api-client';

const IMG_FALLBACK = '/assets/phase-10/shirt.svg';

export default function LaundryCatalogPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ outletId: string }>();
  const outletId = params?.outletId ?? '';
  const flow = useLaundry();

  useEffect(() => {
    void flow.initCatalog();
    if (outletId) void flow.loadCart(outletId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  useEffect(() => {
    if (outletId) {
      const timer = window.setInterval(() => {
        void flow.loadCart(outletId);
      }, 8000);
      return () => window.clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  const handleAdd = useCallback(
    async (service: LaundryService) => {
      await flow.addItems(outletId, [{ laundryServiceId: service.id, quantity: 1 }]);
    },
    [flow, outletId],
  );

  const handleRemove = useCallback(
    async (service: LaundryService) => {
      await flow.decrementItem(outletId, service.id);
    },
    [flow, outletId],
  );

  const cartQuantity = (serviceId: number): number =>
    flow.cart?.items.find((i) => i.laundry_service_id === serviceId)?.quantity ?? 0;

  const cartCount = flow.cart?.total_quantity ?? 0;
  const cartTotal = flow.cart?.final_amount ?? 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('laundry.services', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 pb-28 pt-3">
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
                    <img
                      src={cat.image || IMG_FALLBACK}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src = IMG_FALLBACK;
                      }}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {flow.servicesLoading && flow.services.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <section className="px-4">
            <ul className="flex flex-col gap-2">
              {flow.services.map((svc) => {
                const qty = cartQuantity(svc.id);
                return (
                  <li
                    key={svc.id}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-3"
                  >
                    <img
                      src={svc.image || IMG_FALLBACK}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src = IMG_FALLBACK;
                      }}
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--fc-text-primary)]">{svc.title}</p>
                      <p className="line-clamp-1 text-xs text-[var(--fc-text-secondary)]">{svc.service_description}</p>
                      <p className="mt-0.5 text-sm font-semibold text-[var(--fc-primary)]">{svc.formatted_price || `${svc.currency}${svc.price}`}</p>
                    </div>
                    {qty > 0 ? (
                      <div className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--fc-border)] bg-[var(--fc-surface)] p-1">
                        <button
                          onClick={() => void handleRemove(svc)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--fc-primary)]"
                          aria-label={t('laundry.subtract', runtime.locale)}
                        >
                          <Icon name="minus" size={14} />
                        </button>
                        <span className="w-5 text-center text-sm font-bold text-[var(--fc-text-primary)]">{qty}</span>
                        <button
                          onClick={() => void handleAdd(svc)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--fc-primary)] text-white"
                          aria-label={t('laundry.add', runtime.locale)}
                        >
                          <Icon name="plus" size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => void handleAdd(svc)}
                        className="flex h-9 shrink-0 items-center gap-1 rounded-full bg-[var(--fc-primary)] px-4 text-xs font-bold text-white"
                      >
                        <Icon name="plus" size={14} />
                        {t('laundry.add', runtime.locale)}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>

      {cartCount > 0 ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--fc-border)] bg-white px-4 py-3">
          <div className="mx-auto flex max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] items-center gap-3">
            <Button block variant="primary" onClick={() => router.push(`/laundry/${outletId}/cart`)}>
              {t('laundry.cart', runtime.locale)} Ã‚Â· {cartCount} {t('laundry.itemsCount', runtime.locale)} Ã‚Â· Ã¢â€šÂ¹{cartTotal.toLocaleString('en-IN')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}