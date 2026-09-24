'use client';

import { useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useHandyman } from '@/lib/handyman/use-handyman';

export default function HandymanCartPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ segmentId: string }>();
  const segmentId = params?.segmentId ?? '6';
  const flow = useHandyman(segmentId);

  const [promoText, setPromoText] = useState('');
  const [address, setAddress] = useState(flow.cart?.drop_location ?? '');

  const cart = flow.cart;
  const hasItems = (cart?.ordered_services.length ?? 0) > 0;

  const handleCheckout = () => {
    const encoded = encodeURIComponent(address || 'Home');
    router.push(`/handyman/${segmentId}/checkout?location=${encoded}`);
  };

  const handleApplyPromo = () => {
    void flow.applyPromo(promoText);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('handyman.cart', runtime.locale)}
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
        ) : !hasItems ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <img src="/assets/phase-8/empty-cart.svg" alt="" className="h-44 w-44" />
            <p className="text-base font-bold text-[var(--fc-text-primary)]">{t('handyman.cartEmpty', runtime.locale)}</p>
            <p className="max-w-xs text-sm text-[var(--fc-text-secondary)]">{t('handyman.cartEmptyMsg', runtime.locale)}</p>
            <Button variant="primary" onClick={() => router.push(`/handyman/${segmentId}`)}>
              {t('handyman.findHandymen', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4">
            {/* Service items */}
            <ul className="flex flex-col gap-2">
              {cart!.ordered_services.map((svc) => (
                <li key={svc.service_type_id} className="flex items-center gap-3 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[var(--fc-text-primary)]">{svc.service_name}</p>
                    <p className="text-xs text-[var(--fc-text-secondary)]">K{svc.service_price.toLocaleString('en-IN')} per unit</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void flow.updateCartService(svc.service_type_id, svc.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--fc-border)] bg-[var(--fc-surface)] text-[var(--fc-text-primary)]"
                    >
                      <Icon name="minus" size={13} />
                    </button>
                    <span className="min-w-5 text-center text-sm font-bold text-[var(--fc-text-primary)]">{svc.quantity}</span>
                    <button
                      onClick={() => void flow.updateCartService(svc.service_type_id, svc.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--fc-border)] bg-[var(--fc-surface)] text-[var(--fc-text-primary)]"
                    >
                      <Icon name="plus" size={13} />
                    </button>
                    <button
                      onClick={() => void flow.removeCartService(svc.service_type_id)}
                      className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-[var(--fc-danger)]"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Drop location */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('handyman.address', runtime.locale)}</h2>
              <input
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  flow.setDropLocation(e.target.value);
                }}
                placeholder="Enter your address"
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
              />
            </section>

            {/* Promo */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">Promo Code</h2>
              {cart!.applied_promo_code ? (
                <div className="flex items-center gap-2 rounded-xl border border-[var(--fc-success)]/20 bg-[var(--fc-success)]/5 px-3 py-2">
                  <Icon name="check" size={16} className="text-[var(--fc-success)]" />
                  <span className="min-w-0 flex-1 text-xs font-semibold text-[var(--fc-success)]">{cart!.applied_promo_code}</span>
                  <button type="button" onClick={() => void flow.removePromo()}>
                    <Icon name="close" size={14} className="text-[var(--fc-danger)]" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={promoText}
                    onChange={(e) => setPromoText(e.target.value)}
                    placeholder="Enter promo code"
                    className="flex-1 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
                  />
                  <Button variant="secondary" onClick={handleApplyPromo}>
                    Apply
                  </Button>
                </div>
              )}
            </section>

            {/* Totals */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <ul className="space-y-1.5 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-[var(--fc-text-secondary)]">Subtotal</span>
                  <span className="font-semibold text-[var(--fc-text-primary)]">K{cart!.total_amount.toLocaleString('en-IN')}</span>
                </li>
                {cart!.discount_amount > 0 ? (
                  <li className="flex items-center justify-between">
                    <span className="text-[var(--fc-success)]">Discount</span>
                    <span className="font-semibold text-[var(--fc-success)]">-K{cart!.discount_amount.toLocaleString('en-IN')}</span>
                  </li>
                ) : null}
                <li className="flex items-center justify-between border-t border-[var(--fc-border)] pt-1.5">
                  <span className="font-bold text-[var(--fc-text-primary)]">Final</span>
                  <span className="font-bold text-[var(--fc-text-primary)]">K{cart!.final_amount.toLocaleString('en-IN')}</span>
                </li>
              </ul>
            </section>

            <Button block variant="primary" onClick={handleCheckout}>
              {t('handyman.checkout', runtime.locale)} Ã‚Â· K{cart!.final_amount.toLocaleString('en-IN')}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
