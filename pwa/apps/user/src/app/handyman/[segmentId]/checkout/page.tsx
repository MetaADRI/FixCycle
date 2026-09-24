'use client';

import { Suspense, useCallback, useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useParams, useSearchParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useHandyman } from '@/lib/handyman/use-handyman';

function CheckoutInner(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ segmentId: string }>();
  const searchParams = useSearchParams();
  const segmentId = params?.segmentId ?? '6';
  const flow = useHandyman(segmentId);

  const locationParam = searchParams.get('location');
  const [address] = useState(locationParam ? decodeURIComponent(locationParam) : flow.cart?.drop_location ?? 'Home');
  const [paymentMode, setPaymentMode] = useState(1);
  const [advancePay, setAdvancePay] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cart = flow.cart;
  const minBill = flow.services?.minimum_booking_amount ?? 0;
  const showAdvance = minBill > 0 && (cart?.final_amount ?? 0) < minBill;

  const handleConfirm = useCallback(async () => {
    setSubmitting(true);
    const opts: { advancePaymentOfMinBill?: number; notes?: string } = {};
    if (advancePay && showAdvance) {
      opts.advancePaymentOfMinBill = minBill;
    }
    if (notes.trim()) {
      opts.notes = notes.trim();
    }
    const result = await flow.confirmOrder(paymentMode, opts);
    setSubmitting(false);
    if (result?.orderId) {
      router.replace(`/handyman/tracker/${result.orderId}`);
    }
  }, [flow, paymentMode, advancePay, showAdvance, minBill, notes, router]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('handyman.checkout', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 pb-28 pt-3">
        {!cart ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="grid" size={28} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('handyman.cartEmpty', runtime.locale)}</p>
            <Button variant="primary" onClick={() => router.push(`/handyman/${segmentId}`)}>
              {t('handyman.findHandymen', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4">
            {/* Address card */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h2 className="mb-1 text-sm font-bold text-[var(--fc-text-primary)]">{t('handyman.address', runtime.locale)}</h2>
              <p className="flex items-center gap-2 text-sm text-[var(--fc-text-primary)]">
                <Icon name="loc" size={16} className="text-[var(--fc-text-secondary)]" />
                {address}
              </p>
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

            {/* Advance payment */}
            {showAdvance ? (
              <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={advancePay}
                    onChange={(e) => setAdvancePay(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[var(--fc-primary)]"
                  />
                  <span className="text-sm text-[var(--fc-text-primary)]">
                    Pay minimum booking amount (K{minBill.toLocaleString('en-IN')}) now
                  </span>
                </label>
              </section>
            ) : null}

            {/* Additional notes */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">Additional Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions (optional)"
                rows={3}
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
              />
            </section>

            {/* Summary */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--fc-text-secondary)]">Services ({cart.ordered_services.length})</span>
                <span className="font-bold text-[var(--fc-text-primary)]">K{cart.final_amount.toLocaleString('en-IN')}</span>
              </div>
            </section>

            {flow.error ? (
              <p className="text-xs font-semibold text-[var(--fc-danger)]">{flow.error}</p>
            ) : null}

            <Button
              block
              variant="primary"
              loading={flow.loading || submitting}
              onClick={() => void handleConfirm()}
            >
              {t('handyman.confirmBooking', runtime.locale)}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function HandymanCheckoutPage(): React.ReactNode {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-sm text-[var(--fc-text-secondary)]">{t('common.loading', 'en')}</div>}>
      <CheckoutInner />
    </Suspense>
  );
}
