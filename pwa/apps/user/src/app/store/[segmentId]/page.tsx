'use client';

import { Suspense, useCallback, useMemo } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useStore } from '@/lib/store/use-store';
import { segmentSlug } from '@/lib/store/segment';
import type { Store } from '@fixcycle/api-client';

import { StoreCartBar } from '@/components/store/store-cart-bar';

function StoreHomeInner(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ segmentId: string }>();
  const search = useSearchParams();
  const segmentId = params?.segmentId ?? '';
  const slug = search.get('slug') ?? '';
  const flow = useStore(segmentSlug(Number(segmentId) || 0, (slug as never) || 'grocery'));

  const { stores, loading, error } = flow;

  const openStorePage = useCallback(
    (store: Store) => {
      router.push(`/store/${segmentId}/${store.id}`);
    },
    [router, segmentId],
  );

  const openCartPage = useCallback(() => router.push(`/store/${segmentId}/cart`), [router, segmentId]);
  const openOrdersPage = useCallback(() => router.push(`/store/${segmentId}/orders`), [router, segmentId]);

  const open = useMemo(() => stores.filter((s) => s.is_open === 1), [stores]);
  const closed = useMemo(() => stores.filter((s) => s.is_open !== 1), [stores]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('store.title', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
        trailing={
          <button type="button" aria-label={t('store.myOrders', runtime.locale)} onClick={openOrdersPage}>
            <IconButton icon="history" label={t('store.myOrders', runtime.locale)} />
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
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('store.errStore', runtime.locale)}</p>
            <Button variant="secondary" onClick={() => void flow.loadStores()}>
              {t('common.retry', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5 px-4">
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('store.subtitle', runtime.locale)}</p>

            {open.length > 0 ? (
              <section>
                <h2 className="mb-2 text-lg font-bold text-[var(--fc-text-primary)]">
                  {t('store.stores', runtime.locale)}
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
                  {t('store.stores', runtime.locale)}
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

      <StoreCartBar flow={flow} onOpenCart={openCartPage} />
    </div>
  );
}

function StoreCard({
  store,
  open,
  onOpen,
}: {
  store: Store;
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
        <img src="/assets/phase-8/store-avatar.svg" alt="" className="h-12 w-12 shrink-0 rounded-xl" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-[var(--fc-text-primary)]">{store.full_name}</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                open ? 'bg-[var(--fc-success)]/10 text-[var(--fc-success)]' : 'bg-[var(--fc-text-secondary)]/10 text-[var(--fc-text-secondary)]'
              }`}
            >
              {open ? t('store.open', runtime.locale) : t('store.closed', runtime.locale)}
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
              {store.delivery_time_min}–{store.delivery_time_max} {t('store.min', runtime.locale)}
            </span>
            <span>
              {t('store.deliveryFee', runtime.locale)}{' '}
              {store.delivery_fee === 0 ? t('store.free', runtime.locale) : `₹ ${store.delivery_fee}`}
            </span>
            <span>
              {t('store.minimumOrder', runtime.locale)} ₹ {store.minimum_order}
            </span>
          </span>
        </span>
        <Icon name="chevron-right" size={18} className="text-[var(--fc-text-secondary)]" />
      </button>
    </li>
  );
}

export default function StoreHomePage(): React.ReactNode {
  return (
    <Suspense fallback={null}>
      <StoreHomeInner />
    </Suspense>
  );
}
