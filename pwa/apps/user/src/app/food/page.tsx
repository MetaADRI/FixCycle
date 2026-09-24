'use client';

import { useCallback } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useFood } from '@/lib/food/use-food';
import type { FoodStore } from '@fixcycle/api-client';

import { FoodCartBar } from '@/components/food/food-cart-bar';

export default function FoodHomePage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const flow = useFood();
  const { stores, loading, error } = flow;

  const openStorePage = useCallback(
    (store: FoodStore) => {
      router.push(`/food/store/${store.id}`);
    },
    [router],
  );

  const openCartPage = useCallback(() => router.push('/food/cart'), [router]);
  const openOrdersPage = useCallback(() => router.push('/food/orders'), [router]);

  const open = stores.filter((s) => s.is_open === 1);
  const closed = stores.filter((s) => s.is_open !== 1);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('food.title', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
        trailing={
          <button type="button" aria-label={t('food.myOrders', runtime.locale)} onClick={openOrdersPage}>
            <IconButton icon="history" label={t('food.myOrders', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 pb-28 pt-3">
        {loading && stores.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : error && stores.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Icon name="alert" size={28} className="text-[var(--fc-warning)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('food.errStore', runtime.locale)}</p>
            <Button variant="secondary" onClick={() => void flow.loadStores()}>
              {t('common.retry', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5 px-4">
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('food.subtitle', runtime.locale)}</p>

            {open.length > 0 ? (
              <section>
                <h2 className="mb-2 text-lg font-bold text-[var(--fc-text-primary)]">
                  {t('food.popularRestaurants', runtime.locale)}
                </h2>
                <ul className="space-y-2">
                  {open.map((store) => (
                    <StoreCard key={store.id} store={store} open onOpen={() => openStorePage(store)} />
                  ))}
                </ul>
              </section>
            ) : null}

            {closed.length > 0 ? (
              <section>
                <h2 className="mb-2 text-lg font-bold text-[var(--fc-text-primary)]">
                  {t('food.allRestaurants', runtime.locale)}
                </h2>
                <ul className="space-y-2">
                  {closed.map((store) => (
                    <StoreCard key={store.id} store={store} open={false} onOpen={() => openStorePage(store)} />
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </main>

      <FoodCartBar flow={flow} onOpenCart={openCartPage} />
    </div>
  );
}

function StoreCard({
  store,
  open,
  onOpen,
}: {
  store: FoodStore;
  open: boolean;
  onOpen: () => void;
}): React.ReactNode {
  const { runtime } = useRuntime();
  return (
    <li>
      <button
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4 text-left transition-colors"
      >
        <img src="/assets/phase-7/store-avatar.svg" alt="" className="h-12 w-12 shrink-0 rounded-xl" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-[var(--fc-text-primary)]">{store.full_name}</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                open ? 'bg-[var(--fc-success)]/10 text-[var(--fc-success)]' : 'bg-[var(--fc-text-secondary)]/10 text-[var(--fc-text-secondary)]'
              }`}
            >
              {open ? t('food.open', runtime.locale) : t('food.closed', runtime.locale)}
            </span>
          </span>
          <span className="mt-0.5 block text-xs text-[var(--fc-text-secondary)]">
            {store.cuisines || store.address}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--fc-text-secondary)]">
            <span className="flex items-center gap-1 text-[var(--fc-text-primary)]">
              <Icon name="star" size={13} className="text-[var(--fc-warning)]" />
              {store.rating.toFixed(1)}
            </span>
            <span>
              {store.delivery_time_min}Ã¢â‚¬â€œ{store.delivery_time_max} {t('food.min', runtime.locale)}
            </span>
            <span>
              {t('food.deliveryFee', runtime.locale)}{' '}
              {store.delivery_fee === 0 ? t('food.free', runtime.locale) : `Ã¢â€šÂ¹ ${store.delivery_fee}`}
            </span>
          </span>
        </span>
        <Icon name="chevron-right" size={18} className="text-[var(--fc-text-secondary)]" />
      </button>
    </li>
  );
}