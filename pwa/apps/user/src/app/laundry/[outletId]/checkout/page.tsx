'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useLaundry } from '@/lib/laundry/use-laundry';

function CheckoutInner(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ outletId: string }>();
  const outletId = params?.outletId ?? '';
  const flow = useLaundry();

  const [paymentMode, setPaymentMode] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void flow.initCatalog();
    void flow.loadCart(outletId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  const handleConfirm = useCallback(async () => {
    setSubmitting(true);
    const result = await flow.confirmOrder(outletId, {
      paymentMethodId: paymentMode,
      dropLocation: flow.cart?.drop_location ?? '',
    });
    setSubmitting(false);
    if (result?.orderId) {
      router.replace(`/laundry/tracker/${result.orderId}`);
    }
  }, [flow, outletId, paymentMode, router]);

  const cart = flow.cart;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('laundry.checkout', runtime.locale)}
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
            <Button variant="primary" onClick={() => router.push(`/laundry/${outletId}`)}>
              {t('laundry.services', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4">
            {/* Outlet + slot */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Icon name="loc" size={16} className="text-[var(--fc-text-secondary)]" />
                <span className="text-[var(--fc-text-primary)]">{cart.drop_location || 'Self Pickup at outlet'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Icon name="clock" size={16} className="text-[var(--fc-text-secondary)]" />
                <span className="text-[var(--fc-text-primary)]">
                  {cart.booking_date}
                  {cart.slot_time_text ? ` · ${cart.slot_time_text}` : ''}
                </span>
              </div>
            </section>

            {/* Payment */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">Payment</h2>
              <div className="flex gap-2">
                {[
                  { mode: 1, label: 'Cash', icon: 'cash' as const },
                  { mode: 2, label: 'Wallet', icon: 'wallet' as const },
                  { mode: 3, label: 'Card', icon: 'card' as const },
                ].map((opt) => {
                  const active = paymentMode === opt.mode;
                  return (
                    <button
                      key={opt.mode}
                      onClick={() => setPaymentMode(opt.mode)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-colors ${
                        active
                          ? 'border-[var(--fc-primary)] bg-[var(--fc-primary)]/5 text-[var(--fc-primary)]'
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

            {/* Summary */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--fc-text-secondary)]">Cart Amount</span>
                <span className="text-[var(--fc-text-primary)]">₹{cart.cart_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--fc-text-secondary)]">{t('laundry.deliveryCharges', runtime.locale)}</span>
                <span className="text-[var(--fc-text-primary)]">₹{cart.delivery_amount.toLocaleString('en-IN')}</span>
              </div>
              {cart.discount_amount > 0 ? (
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--fc-success)]">{t('laundry.discount', runtime.locale)}</span>
                  <span className="text-[var(--fc-success)]">-₹{cart.discount_amount.toLocaleString('en-IN')}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-xs">
                <span className="text-[var(--fc-text-secondary)]">{t('laundry.tax', runtime.locale)}</span>
                <span className="text-[var(--fc-text-primary)]">₹{cart.tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--fc-border)] pt-2 text-sm font-bold">
                <span className="text-[var(--fc-text-primary)]">{t('laundry.toPay', runtime.locale)}</span>
                <span className="text-[var(--fc-text-primary)]">₹{cart.final_amount.toLocaleString('en-IN')}</span>
              </div>
            </section>

            {flow.error ? <p className="text-xs font-semibold text-[var(--fc-danger)]">{flow.error}</p> : null}

            <Button block variant="primary" loading={flow.loading || submitting} onClick={() => void handleConfirm()}>
              {t('laundry.placeOrder', runtime.locale)}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function LaundryCheckoutPage(): React.ReactNode {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-[var(--fc-text-secondary)]">
          {t('common.loading', 'en')}
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}