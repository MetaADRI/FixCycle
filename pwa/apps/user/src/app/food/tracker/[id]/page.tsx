'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useFood } from '@/lib/food/use-food';
import type { FoodOrder } from '@fixcycle/api-client';

const STATUS_TONE: Record<number, string> = {
  1: 'text-[var(--fc-info)]',
  6: 'text-[var(--fc-info)]',
  9: 'text-[var(--fc-warning)]',
  7: 'text-[var(--fc-info)]',
  10: 'text-[var(--fc-warning)]',
  11: 'text-[var(--fc-success)]',
  2: 'text-[var(--fc-danger)]',
  3: 'text-[var(--fc-danger)]',
  5: 'text-[var(--fc-danger)]',
  8: 'text-[var(--fc-danger)]',
  12: 'text-[var(--fc-danger)]',
};

const STATUS_ICON: Record<number, string> = {
  1: 'clock',
  6: 'delivery',
  9: 'clock',
  7: 'loc',
  10: 'delivery',
  11: 'check',
  2: 'alert',
  3: 'alert',
  5: 'alert',
  8: 'alert',
  12: 'alert',
};

const PROGRESS_STEPS = [1, 6, 9, 10, 11];

const STATUS_LABEL_KEY: Record<number, string> = {
  1: 'food.placed',
  6: 'food.driverAccepted',
  9: 'food.inProcess',
  10: 'food.outForDelivery',
  11: 'food.delivered',
  2: 'food.cancelled',
  3: 'food.cancelled',
  5: 'food.cancelled',
  8: 'food.cancelled',
};

export default function FoodTrackerPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const flow = useFood();
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? '';

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showRate, setShowRate] = useState(false);

  const order = flow.trackedOrder;

  useEffect(() => {
    if (!orderId) return;
    void flow.trackOrder(orderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Poll tracking every 8 seconds while order is active.
  useEffect(() => {
    if (!orderId || !order || [2, 3, 5, 8, 11, 12].includes(order.order_status)) return;
    const timer = window.setInterval(() => void flow.trackOrder(orderId), 8000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, order?.order_status]);

  const currentIdx = PROGRESS_STEPS.indexOf(order?.order_status ?? -1);
  const progressPct = currentIdx >= 0 ? ((currentIdx + 1) / PROGRESS_STEPS.length) * 100 : 0;
  const isDone = order?.order_status === 11;
  const isCancelled = order != null && [2, 3, 5, 8, 12].includes(order.order_status);

  const handleCancel = async () => {
    if (!orderId) return;
    await flow.cancelOrder(orderId);
  };

  const handleRate = async () => {
    if (!orderId || rating === 0) return;
    await flow.rateOrder(orderId, rating, comment);
    setShowRate(false);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('food.trackOrder', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
        trailing={
          order && !isCancelled ? (
            <button type="button" onClick={() => void flow.openChat(String(order.store_id))}>
              <IconButton icon="chat" label={t('food.chat', runtime.locale)} />
            </button>
          ) : undefined
        }
      />

      <main className="flex-1 pb-28 pt-3">
        {flow.loading && !order ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : !order ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="alert" size={28} className="text-[var(--fc-warning)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('food.errStore', runtime.locale)}</p>
            <Button variant="primary" onClick={() => router.push('/food')}>
              {t('food.browseRestaurants', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4">
            {/* Status hero */}
            <section className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-5">
              <img
                src={order.order_status === 11 ? '/assets/phase-7/order-success.svg' : '/assets/phase-7/food-tracker.svg'}
                alt=""
                className="h-36 w-full rounded-xl object-cover"
              />
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  isDone ? 'bg-[var(--fc-success)]/10' : isCancelled ? 'bg-[var(--fc-danger)]/10' : 'bg-[var(--fc-info)]/10'
                }`}
              >
                <Icon
                  name={STATUS_ICON[order.order_status] as React.ComponentProps<typeof Icon>['name']}
                  size={28}
                  className={STATUS_TONE[order.order_status] ?? 'text-[var(--fc-text-secondary)]'}
                />
              </span>
              <h2 className="text-base font-bold text-[var(--fc-text-primary)]">
                {t((STATUS_LABEL_KEY[order.order_status] ?? 'food.placed') as never, runtime.locale)}
              </h2>
              {order.order_status === 11 ? (
                <p className="text-xs text-[var(--fc-text-secondary)]">
                  {t('food.delivered', runtime.locale)}
                </p>
              ) : null}
            </section>

            {/* Progress bar */}
            {!isCancelled ? (
              <div className="flex flex-col gap-2 px-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--fc-border)]">
                  <div
                    className="h-full rounded-full bg-[var(--fc-bg-secondary)] transition-all duration-500"
                    style={{ width: `${Math.max(2, progressPct)}%` }}
                  />
                </div>
                <ul className="flex items-center justify-between text-[10px] font-semibold text-[var(--fc-text-secondary)]">
                  {PROGRESS_STEPS.map((s, i) => {
                    const active = currentIdx >= i;
                    return (
                      <li key={s} className={`text-center ${active ? 'text-[var(--fc-bg-secondary)]' : ''}`}>
                        {t((STATUS_LABEL_KEY[s] ?? 'food.placed') as never, runtime.locale)}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div className="px-4">
                <div className="h-1.5 w-full rounded-full bg-[var(--fc-danger)]/20" />
              </div>
            )}

            {/* Order items */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('food.menu', runtime.locale)}</h2>
              <ul className="space-y-2">
                {order.products.map((p) => (
                  <li key={p.cart_id} className="flex items-center gap-3 text-sm">
                    <img src="/assets/phase-7/food-placeholder.svg" alt="" className="h-8 w-8 shrink-0 rounded-lg" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-[var(--fc-text-primary)]">{p.product_name}</span>
                      <span className="block text-xs text-[var(--fc-text-secondary)]">x{p.quantity}</span>
                    </span>
                    <span className="font-semibold text-[var(--fc-text-primary)]">K {p.total_amount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Payment summary */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <ul className="space-y-1.5 text-sm">
                <li className="flex justify-between">
                  <span className="text-[var(--fc-text-secondary)]">{t('food.subtotal', runtime.locale)}</span>
                  <span className="font-bold text-[var(--fc-text-primary)]">K {order.subtotal.toFixed(2)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[var(--fc-text-secondary)]">{t('food.delivery', runtime.locale)}</span>
                  <span className="font-bold text-[var(--fc-text-primary)]">K {order.delivery_fee.toFixed(2)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[var(--fc-text-secondary)]">{t('food.tax', runtime.locale)}</span>
                  <span className="font-bold text-[var(--fc-text-primary)]">K {order.tax.toFixed(2)}</span>
                </li>
                {order.discount_amount > 0 ? (
                  <li className="flex justify-between">
                    <span className="text-[var(--fc-success)]">{t('food.discount', runtime.locale)}</span>
                    <span className="font-bold text-[var(--fc-success)]">-K {order.discount_amount.toFixed(2)}</span>
                  </li>
                ) : null}
                <li className="flex justify-between border-t border-[var(--fc-border)] pt-1.5">
                  <span className="text-sm font-bold text-[var(--fc-text-primary)]">{t('food.placeOrder', runtime.locale)}</span>
                  <span className="font-bold text-[var(--fc-text-primary)]">K {order.total_amount.toFixed(2)}</span>
                </li>
              </ul>
            </section>

            {/* Actions */}
            {!isDone && !isCancelled && order.cancel_able ? (
              <Button block variant="danger" onClick={() => void handleCancel()}>
                {t('food.cancelOrder', runtime.locale)}
              </Button>
            ) : null}

            {isDone && !order.rate && !showRate ? (
              <Button block variant="secondary" onClick={() => setShowRate(true)}>
                <Icon name="star" size={18} />
                {t('food.rate', runtime.locale)}
              </Button>
            ) : null}

            {showRate ? (
              <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
                <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('food.rateTitle', runtime.locale)}</h2>
                <div className="mb-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRating(s)}>
                      <Icon
                        name="star"
                        size={24}
                        className={s <= rating ? 'text-[var(--fc-warning)]' : 'text-[var(--fc-border)]'}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('food.ratePlaceholder', runtime.locale)}
                  className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
                  rows={3}
                />
                <Button block variant="primary" disabled={rating === 0} onClick={() => void handleRate()}>
                  {t('food.submitRating', runtime.locale)}
                </Button>
              </section>
            ) : null}

            <Button block variant="primary" onClick={() => router.push('/food')}>
              {t('food.browseRestaurants', runtime.locale)}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}