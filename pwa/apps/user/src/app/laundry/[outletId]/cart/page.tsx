'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useLaundry } from '@/lib/laundry/use-laundry';

const IMG_FALLBACK = '/assets/phase-10/shirt.svg';

export default function LaundryCartPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ outletId: string }>();
  const outletId = params?.outletId ?? '';
  const flow = useLaundry();

  const [promo, setPromo] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    void flow.loadCart(outletId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  useEffect(() => {
    if (flow.cart?.applied_promo_code) setPromo(flow.cart.applied_promo_code);
  }, [flow.cart?.applied_promo_code]);

  const handleApplyPromo = useCallback(async () => {
    setApplying(true);
    await flow.applyPromo(outletId, promo.trim());
    setApplying(false);
  }, [flow, outletId, promo]);

  const handleRemove = useCallback(
    async (serviceId: number) => {
      await flow.decrementItem(outletId, serviceId);
    },
    [flow, outletId],
  );

  const handleAdd = useCallback(
    async (serviceId: number) => {
      await flow.addItems(outletId, [{ laundryServiceId: serviceId, quantity: 1 }]);
    },
    [flow, outletId],
  );

  const cart = flow.cart;
  const lineTotal = (serviceId: number): number => {
    const item = cart?.items.find((i) => i.laundry_service_id === serviceId);
    return item ? item.price * item.quantity : 0;
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('laundry.cart', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 pb-28 pt-3">
        {flow.cartLoading && !cart ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : !cart?.items.length ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="laundry" size={28} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('laundry.cartEmpty', runtime.locale)}</p>
            <p className="text-xs text-[var(--fc-text-secondary)]">{t('laundry.cartEmptyMsg', runtime.locale)}</p>
            <Button variant="primary" onClick={() => router.push(`/laundry/${outletId}`)}>
              {t('laundry.services', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4">
            {/* Items */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">
                {t('laundry.services', runtime.locale)} ({cart?.total_quantity ?? 0} {t('laundry.itemsCount', runtime.locale)})
              </h2>
              <ul className="space-y-3">
                {cart?.items.map((item) => (
                  <li key={item.laundry_service_id} className="flex items-center gap-3">
                    <img
                      src={item.image || IMG_FALLBACK}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src = IMG_FALLBACK;
                      }}
                      className="h-12 w-12 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--fc-text-primary)]">{item.title}</p>
                      <p className="text-xs text-[var(--fc-text-secondary)]">K{item.price.toLocaleString('en-IN')} each</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--fc-border)] bg-[var(--fc-surface)] p-1">
                      <button
                        onClick={() => void handleRemove(item.laundry_service_id)}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--fc-primary)]"
                        aria-label={t('laundry.subtract', runtime.locale)}
                      >
                        <Icon name="minus" size={13} />
                      </button>
                      <span className="w-4 text-center text-sm font-bold text-[var(--fc-text-primary)]">{item.quantity}</span>
                      <button
                        onClick={() => void handleAdd(item.laundry_service_id)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--fc-primary)] text-white"
                        aria-label={t('laundry.add', runtime.locale)}
                      >
                        <Icon name="plus" size={13} />
                      </button>
                    </div>
                    <span className="w-16 shrink-0 text-right text-sm font-bold text-[var(--fc-text-primary)]">
                      K{lineTotal(item.laundry_service_id).toLocaleString('en-IN')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Promo */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[var(--fc-text-primary)]">
                <Icon name="promo" size={16} className="text-[var(--fc-primary)]" />
                {t('laundry.promoCode', runtime.locale)}
              </h2>
              <div className="flex items-center gap-2">
                <input
                  value={promo}
                  onChange={(e) => setPromo(e.target.value.toUpperCase())}
                  placeholder="WELCOME10 / FLAT25"
                  className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm uppercase text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
                />
                <Button variant="secondary" loading={applying || flow.cartLoading} onClick={() => void handleApplyPromo()}>
                  {t('laundry.applyPromo', runtime.locale)}
                </Button>
              </div>
              {cart?.applied_promo_code ? (
                <p className="mt-2 text-xs font-semibold text-[var(--fc-success)]">{cart.applied_promo_code} applied</p>
              ) : null}
            </section>

            {/* Summary */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--fc-text-secondary)]">Cart Amount</span>
                <span className="text-[var(--fc-text-primary)]">K{cart?.cart_amount?.toLocaleString('en-IN') ?? '0'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--fc-text-secondary)]">{t('laundry.deliveryCharges', runtime.locale)}</span>
                <span className="text-[var(--fc-text-primary)]">K{cart?.delivery_amount?.toLocaleString('en-IN') ?? '0'}</span>
              </div>
              {(cart?.discount_amount ?? 0) > 0 ? (
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--fc-success)]">{t('laundry.discount', runtime.locale)}</span>
                  <span className="text-[var(--fc-success)]">-K{cart?.discount_amount?.toLocaleString('en-IN') ?? '0'}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-xs">
                <span className="text-[var(--fc-text-secondary)]">{t('laundry.tax', runtime.locale)}</span>
                <span className="text-[var(--fc-text-primary)]">K{cart?.tax?.toLocaleString('en-IN') ?? '0'}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--fc-border)] pt-2 text-sm font-bold">
                <span className="text-[var(--fc-text-primary)]">{t('laundry.toPay', runtime.locale)}</span>
                <span className="text-[var(--fc-text-primary)]">K{cart?.final_amount?.toLocaleString('en-IN') ?? '0'}</span>
              </div>
            </section>

            {flow.error ? <p className="text-xs font-semibold text-[var(--fc-danger)]">{flow.error}</p> : null}

            <Button block variant="primary" onClick={() => router.push(`/laundry/${outletId}/pickup`)}>
              {t('laundry.pickup', runtime.locale)}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}