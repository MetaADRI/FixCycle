'use client';

import { Suspense, useCallback, useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useSearchParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useFood } from '@/lib/food/use-food';

function CheckoutInner(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const flow = useFood();
  const params = useSearchParams();
  const storeId = params.get('storeId') ?? '';

  const [address, setAddress] = useState('');
  const [deliveryMode, setDeliveryMode] = useState(1);
  const [paymentMode, setPaymentMode] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [promoText, setPromoText] = useState('');

  const subtotal = flow.cart.products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  const handleCheckout = useCallback(async () => {
    if (!address.trim() || !storeId) return;
    const result = await flow.runCheckout({
      storeId,
      deliveryMode,
      paymentMode,
      address: address.trim(),
    });
    if (result) {
      const placed = await flow.placeOrder({
        checkoutId: result.id,
        storeId,
        deliveryMode,
        paymentMode,
        address: address.trim(),
      });
      if (placed?.id) router.replace(`/food/tracker/${placed.id}`);
      else router.replace('/food/orders');
    }
  }, [flow, storeId, deliveryMode, paymentMode, address, router]);

  const handleApplyPromo = () => {
    void flow.applyPromo(promoText);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('food.checkout', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 pb-28 pt-3">
        {flow.cart.products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="food" size={28} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('food.cartEmpty', runtime.locale)}</p>
            <Button variant="primary" onClick={() => router.push('/food')}>
              {t('food.browseRestaurants', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4">
            {/* Delivery address */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('food.address', runtime.locale)}</h2>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('food.addressPlaceholder', runtime.locale)}
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
              />
            </section>

            {/* Delivery mode */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('food.deliveryMode', runtime.locale)}</h2>
              <div className="flex gap-2">
                {[
                  { mode: 1, label: t('food.deliverHome', runtime.locale), icon: 'loc' as const },
                  { mode: 2, label: t('food.selfPickup', runtime.locale), icon: 'map' as const },
                ].map((opt) => {
                  const active = deliveryMode === opt.mode;
                  return (
                    <button
                      key={opt.mode}
                      onClick={() => setDeliveryMode(opt.mode)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-colors ${
                        active
                          ? 'border-[var(--fc-bg-secondary)] bg-[var(--fc-bg-secondary)]/5 text-[var(--fc-bg-secondary)]'
                          : 'border-[var(--fc-border)] bg-[var(--fc-surface)] text-[var(--fc-text-primary)]'
                      }`}
                    >
                      <Icon name={opt.icon} size={18} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Payment */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('food.payment', runtime.locale)}</h2>
              <div className="flex gap-2">
                {[
                  { mode: '1', label: t('food.cash', runtime.locale), icon: 'cash' as const },
                  { mode: '2', label: t('food.wallet', runtime.locale), icon: 'wallet' as const },
                ].map((opt) => {
                  const active = paymentMode === opt.mode;
                  return (
                    <button
                      key={opt.mode}
                      onClick={() => setPaymentMode(opt.mode)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-colors ${
                        active
                          ? 'border-[var(--fc-bg-secondary)] bg-[var(--fc-bg-secondary)]/5 text-[var(--fc-bg-secondary)]'
                          : 'border-[var(--fc-border)] bg-[var(--fc-surface)] text-[var(--fc-text-primary)]'
                      }`}
                    >
                      <Icon name={opt.icon} size={18} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Promo */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('food.promoPlaceholder', runtime.locale)}</h2>
              <div className="flex gap-2">
                <input
                  value={promoText}
                  onChange={(e) => setPromoText(e.target.value)}
                  placeholder={t('food.promoPlaceholder', runtime.locale)}
                  className="flex-1 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
                />
                <Button variant="secondary" onClick={handleApplyPromo}>
                  {t('food.apply', runtime.locale)}
                </Button>
              </div>
              {flow.promo ? (
                <p className="mt-1 text-xs font-semibold text-[var(--fc-success)]">
                  {t('food.promoApplied', runtime.locale)}: -₹ {flow.promo.discount_value.toFixed(2)}
                </p>
              ) : null}
              {flow.error && !flow.promo ? (
                <p className="mt-1 text-xs font-semibold text-[var(--fc-danger)]">{flow.error}</p>
              ) : null}
            </section>

            {/* Summary */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <ul className="space-y-1.5 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-[var(--fc-text-secondary)]">{t('food.subtotal', runtime.locale)}</span>
                  <span className="font-semibold text-[var(--fc-text-primary)]">₹ {subtotal.toFixed(2)}</span>
                </li>
                {flow.promo ? (
                  <li className="flex items-center justify-between">
                    <span className="text-[var(--fc-success)]">{t('food.discount', runtime.locale)}</span>
                    <span className="font-semibold text-[var(--fc-success)]">-₹ {flow.promo.discount_value.toFixed(2)}</span>
                  </li>
                ) : null}
              </ul>
            </section>

            <Button
              block
              variant="primary"
              loading={flow.loading || submitting}
              disabled={!address.trim()}
              onClick={() => {
                setSubmitting(true);
                void handleCheckout().finally(() => setSubmitting(false));
              }}
            >
              {t('food.placeOrder', runtime.locale)}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function FoodCheckoutPage(): React.ReactNode {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-sm text-[var(--fc-text-secondary)]">{t('food.loading', 'en')}</div>}>
      <CheckoutInner />
    </Suspense>
  );
}