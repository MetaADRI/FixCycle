'use client';

import { Suspense, useCallback, useRef, useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useParams, useSearchParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useStore } from '@/lib/store/use-store';
import { segmentSlug } from '@/lib/store/segment';

function CheckoutInner(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ segmentId: string }>();
  const searchParams = useSearchParams();
  const segmentId = params?.segmentId ?? '';
  const storeId = searchParams.get('storeId') ?? '';
  const flow = useStore(segmentSlug(segmentId));

  const [address, setAddress] = useState('');
  const [deliveryMode, setDeliveryMode] = useState(1);
  const [paymentMode, setPaymentMode] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [promoText, setPromoText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const subtotal = flow.cart.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const slots = flow.storeDetails?.time_slots ?? [];

  const handleCheckout = useCallback(async () => {
    if (!address.trim() || !storeId) return;
    const result = await flow.runCheckout({
      storeId,
      deliveryMode,
      paymentMode,
      address: address.trim(),
      timeSlotId: flow.selectedSlotId,
    });
    if (result) {
      const placed = await flow.placeOrder({
        checkoutId: result.id,
        storeId,
        deliveryMode,
        paymentMode,
        address: address.trim(),
        timeSlotId: flow.selectedSlotId,
      });
      if (placed?.id) router.replace(`/store/${segmentId}/tracker/${placed.id}`);
      else router.replace(`/store/${segmentId}/orders`);
    }
  }, [flow, segmentId, storeId, deliveryMode, paymentMode, address, router]);

  const handleApplyPromo = () => {
    void flow.applyPromo(promoText);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('store.checkout', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 pb-28 pt-3">
        {flow.cart.products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="grid" size={28} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('store.cartEmpty', runtime.locale)}</p>
            <Button variant="primary" onClick={() => router.push(`/store/${segmentId}`)}>
              {t('store.browseStores', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4">
            {/* Delivery address */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('store.address', runtime.locale)}</h2>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('store.addressPlaceholder', runtime.locale)}
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
              />
            </section>

            {/* Delivery mode */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('store.deliveryMode', runtime.locale)}</h2>
              <div className="flex gap-2">
                {[
                  { mode: 1, label: t('store.deliverHome', runtime.locale), icon: 'loc' as const },
                  { mode: 2, label: t('store.selfPickup', runtime.locale), icon: 'map' as const },
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

            {/* Time slots */}
            {slots.length > 0 ? (
              <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
                <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('store.timeSlot', runtime.locale)}</h2>
                <ul className="space-y-2">
                  {slots.map((slot) => {
                    const active = flow.selectedSlotId === slot.id;
                    return (
                      <li key={slot.id}>
                        <button
                          onClick={() => flow.setSelectedSlotId(slot.id)}
                          className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-colors ${
                            active
                              ? 'border-[var(--fc-bg-secondary)] bg-[var(--fc-bg-secondary)]/5'
                              : 'border-[var(--fc-border)] bg-[var(--fc-surface)]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon name="clock" size={16} className={active ? 'text-[var(--fc-bg-secondary)]' : 'text-[var(--fc-text-secondary)]'} />
                            <span className={`text-sm font-semibold ${active ? 'text-[var(--fc-bg-secondary)]' : 'text-[var(--fc-text-primary)]'}`}>{slot.label}</span>
                          </span>
                          {active ? <Icon name="check" size={18} className="text-[var(--fc-bg-secondary)]" /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {/* Payment */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('store.payment', runtime.locale)}</h2>
              <div className="flex gap-2">
                {[
                  { mode: '1', label: t('store.cash', runtime.locale), icon: 'cash' as const },
                  { mode: '2', label: t('store.wallet', runtime.locale), icon: 'wallet' as const },
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

            {/* Prescription (pharmacy only) */}
            {flow.isPharmacy ? (
              <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
                <h2 className="mb-1 text-sm font-bold text-[var(--fc-text-primary)]">{t('store.prescription', runtime.locale)}</h2>
                <p className="mb-2 text-xs text-[var(--fc-text-secondary)]">{t('store.prescriptionHint', runtime.locale)}</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    flow.setPrescriptionFile(file);
                  }}
                />
                {flow.prescriptionName ? (
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--fc-success)]/20 bg-[var(--fc-success)]/5 px-3 py-2">
                    <Icon name="check" size={16} className="text-[var(--fc-success)]" />
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--fc-success)]">{flow.prescriptionName}</span>
                    <button type="button" onClick={() => flow.setPrescriptionFile(null)}>
                      <Icon name="close" size={14} className="text-[var(--fc-danger)]" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--fc-border)] px-4 py-3 text-xs font-semibold text-[var(--fc-text-secondary)] transition-colors hover:border-[var(--fc-bg-secondary)] hover:text-[var(--fc-bg-secondary)]"
                  >
                    <Icon name="camera" size={18} />
                    {t('store.upload', runtime.locale)}
                  </button>
                )}
              </section>
            ) : null}

            {/* Promo */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('store.promoPlaceholder', runtime.locale)}</h2>
              <div className="flex gap-2">
                <input
                  value={promoText}
                  onChange={(e) => setPromoText(e.target.value)}
                  placeholder={t('store.promoPlaceholder', runtime.locale)}
                  className="flex-1 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
                />
                <Button variant="secondary" onClick={handleApplyPromo}>
                  {t('store.apply', runtime.locale)}
                </Button>
              </div>
              {flow.promo ? (
                <p className="mt-1 text-xs font-semibold text-[var(--fc-success)]">
                  {t('store.promoApplied', runtime.locale)}: -₹ {flow.promo.discount_value.toFixed(2)}
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
                  <span className="text-[var(--fc-text-secondary)]">{t('store.subtotal', runtime.locale)}</span>
                  <span className="font-semibold text-[var(--fc-text-primary)]">₹ {subtotal.toFixed(2)}</span>
                </li>
                {flow.promo ? (
                  <li className="flex items-center justify-between">
                    <span className="text-[var(--fc-success)]">{t('store.discount', runtime.locale)}</span>
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
              {t('store.placeOrder', runtime.locale)}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function StoreCheckoutPage(): React.ReactNode {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-sm text-[var(--fc-text-secondary)]">{t('store.loading', 'en')}</div>}>
      <CheckoutInner />
    </Suspense>
  );
}