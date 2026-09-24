'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useFood } from '@/lib/food/use-food';
import type { FoodOrder } from '@fixcycle/api-client';

type Tab = 'active' | 'past';

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
};

export default function FoodOrdersPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const flow = useFood();
  const [tab, setTab] = useState<Tab>('active');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([flow.loadOrders('ACTIVE'), flow.loadOrders('PAST')]);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const orders = tab === 'active' ? flow.activeOrders : flow.pastOrders;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('food.myOrders', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <nav className="flex gap-2 border-b border-[var(--fc-border)] px-4 py-2" aria-label={t('food.myOrders', runtime.locale)}>
        {(['active', 'past'] as Tab[]).map((key) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-[var(--fc-bg-secondary)] text-white'
                  : 'border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] text-[var(--fc-text-primary)]'
              }`}
            >
              {key === 'active' ? t('food.active', runtime.locale) : t('food.past', runtime.locale)}
            </button>
          );
        })}
      </nav>

      <main className="flex-1 pb-6 pt-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <img src="/assets/phase-7/empty-cart.svg" alt="" className="h-44 w-44" />
            <p className="text-base font-bold text-[var(--fc-text-primary)]">{t('food.noOrders', runtime.locale)}</p>
            <p className="max-w-xs text-sm text-[var(--fc-text-secondary)]">
              {t('food.noOrdersMessage', runtime.locale)}
            </p>
            <Button variant="primary" onClick={() => router.push('/food')}>
              {t('food.browseRestaurants', runtime.locale)}
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2 px-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} flow={flow} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function OrderCard({
  order,
  flow,
}: {
  order: FoodOrder;
  flow: ReturnType<typeof useFood>;
}): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const statusCancelled = [2, 3, 5, 8, 12].includes(order.order_status);
  const statusLabel =
    order.order_status === 1
      ? t('food.placed', runtime.locale)
      : order.order_status === 6
        ? t('food.driverAccepted', runtime.locale)
        : order.order_status === 9
          ? t('food.inProcess', runtime.locale)
          : order.order_status === 10
            ? t('food.outForDelivery', runtime.locale)
            : order.order_status === 11
              ? t('food.delivered', runtime.locale)
              : t('food.cancelled', runtime.locale);

  const handleReorder = async () => {
    setBusy(true);
    const next = await flow.reorder(order.id);
    setBusy(false);
    if (next && next.products.length > 0) {
      flow.setCartCount(next.total_items);
      router.push('/food/cart');
    }
  };

  return (
    <li className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[var(--fc-text-secondary)]">
          {t('food.orderNumber', runtime.locale)} #{order.order_number}
        </span>
        <span
          className={`text-xs font-bold ${
            statusCancelled ? 'text-[var(--fc-danger)]' : STATUS_TONE[order.order_status] ?? 'text-[var(--fc-text-secondary)]'
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <p className="mt-1 text-sm font-bold text-[var(--fc-text-primary)]">{order.store_name}</p>
      <p className="mt-1 line-clamp-1 text-xs text-[var(--fc-text-secondary)]">
        {order.products.map((p) => `${p.product_name} x${p.quantity}`).join(', ')}
      </p>

      <div className="mt-2 flex items-center justify-between border-t border-[var(--fc-border)] pt-2">
        <span className="text-sm font-bold text-[var(--fc-text-primary)]">K {order.total_amount.toFixed(2)}</span>
        <div className="flex gap-2">
          {order.order_status !== 11 && !statusCancelled ? (
            <Button variant="secondary" onClick={() => router.push(`/food/tracker/${order.id}`)}>
              {t('food.trackOrder', runtime.locale)}
            </Button>
          ) : null}
          {order.order_status === 11 ? (
            <Button variant="secondary" loading={busy} onClick={() => void handleReorder()}>
              {t('food.reorder', runtime.locale)}
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  );
}