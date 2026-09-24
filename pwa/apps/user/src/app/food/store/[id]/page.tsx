'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useFood } from '@/lib/food/use-food';
import type { FoodProduct } from '@fixcycle/api-client';

import { FoodCartBar } from '@/components/food/food-cart-bar';

export default function FoodStorePage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const flow = useFood();
  const params = useParams<{ id: string }>();
  const storeId = params?.id ?? '';

  const [added, setAdded] = useState<number | null>(null);

  useEffect(() => {
    if (!storeId) return;
    void flow.openStore(storeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const store = flow.storeDetails?.store ?? null;
  const categories = flow.storeDetails?.categories ?? [];
  const products = flow.storeDetails?.products ?? [];

  const visibleProducts = useMemo(() => {
    if (!flow.selectedCategory) return products;
    return products.filter((p) => p.category_id === flow.selectedCategory?.id);
  }, [products, flow.selectedCategory]);

  const openProductPage = useCallback(
    (p: FoodProduct) => {
      router.push(`/food/store/${storeId}/product/${p.id}`);
    },
    [router, storeId],
  );

  const openCartPage = useCallback(() => router.push('/food/cart'), [router]);
  const openChatPage = useCallback(() => router.push(`/food/store/${storeId}/chat`), [router, storeId]);

  const handleAdd = async (p: FoodProduct) => {
    if (p.variants.length > 1 || p.options.length > 0) {
      openProductPage(p);
      return;
    }
    if (p.variants.length === 1 && (p.variants[0]?.price ?? 0) > p.price) {
      router.push(`/food/store/${storeId}/product/${p.id}`);
      return;
    }
    await flow.addToCartSimple ? await flow.addToCartSimple(p) : null;
    setAdded(p.id);
    window.setTimeout(() => setAdded(null), 900);
  };

  if (flow.loading && !flow.storeDetails) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <Icon name="alert" size={28} className="text-[var(--fc-warning)]" />
        <p className="text-sm text-[var(--fc-text-secondary)]">{t('food.errMenu', runtime.locale)}</p>
        <Button variant="secondary" onClick={() => router.back()}>
          {t('common.back', runtime.locale)}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={store.full_name}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
        trailing={
          <button type="button" aria-label={t('food.chat', runtime.locale)} onClick={openChatPage}>
            <IconButton icon="chat" label={t('food.chat', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 pb-28 pt-3">
        <section className="px-4 pb-3">
          <img src="/assets/phase-7/store-banner.svg" alt="" className="mb-3 h-28 w-full rounded-2xl object-cover" />
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
            <img src="/assets/phase-7/store-avatar.svg" alt="" className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold text-[var(--fc-text-primary)]">{store.full_name}</h1>
              <p className="mt-0.5 text-xs text-[var(--fc-text-secondary)]">{store.address}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--fc-text-secondary)]">
                <span className="flex items-center gap-1 text-[var(--fc-text-primary)]">
                  <Icon name="star" size={13} className="text-[var(--fc-warning)]" />
                  {store.rating.toFixed(1)} ({store.review_count})
                </span>
                <span>
                  {store.delivery_time_min}Ã¢â‚¬â€œ{store.delivery_time_max} {t('food.min', runtime.locale)}
                </span>
                <span>
                  {store.is_open === 1 ? t('food.open', runtime.locale) : t('food.closed', runtime.locale)}
                </span>
              </div>
            </div>
          </div>

          {store.is_open !== 1 ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-[var(--fc-text-secondary)]/10 px-3 py-2 text-xs font-semibold text-[var(--fc-text-secondary)]">
              <Icon name="clock" size={15} />
              {t('food.todayClosed', runtime.locale)}
            </div>
          ) : null}
        </section>

        {categories.length > 1 ? (
          <nav
            aria-label={t('food.categories', runtime.locale)}
            className="sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-[var(--fc-border)] bg-[var(--fc-surface)] px-4 py-2"
          >
            {categories.map((cat) => {
              const active = flow.selectedCategory?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => flow.setSelectedCategory(cat)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[var(--fc-bg-secondary)] text-white'
                      : 'border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] text-[var(--fc-text-primary)]'
                  }`}
                >
                  {cat.category_name}
                </button>
              );
            })}
          </nav>
        ) : null}

        {visibleProducts.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[var(--fc-text-secondary)]">
            {t('food.errMenu', runtime.locale)}
          </p>
        ) : (
          <ul className="flex flex-col gap-2 px-4 pt-3">
            {visibleProducts.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-3"
              >
                <img src="/assets/phase-7/food-placeholder.svg" alt="" className="h-12 w-12 shrink-0 rounded-xl" />
                <button
                  onClick={() => openProductPage(p)}
                  className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <Icon
                      name="food"
                      size={14}
                      className={p.is_veg === 1 ? 'text-[var(--fc-success)]' : 'text-[var(--fc-danger)]'}
                    />
                    <span className="truncate text-sm font-bold text-[var(--fc-text-primary)]">{p.product_name}</span>
                  </span>
                  {p.description ? (
                    <span className="line-clamp-2 text-xs text-[var(--fc-text-secondary)]">{p.description}</span>
                  ) : null}
                  {p.options.length > 0 ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--fc-bg-secondary)]">
                      {t('food.customise', runtime.locale)}
                      {p.variants.length > 1 ? ' Ã‚Â· ' + p.variants.length + ' ' + t('food.variant', runtime.locale).toLowerCase() : ''}
                    </span>
                  ) : null}
                  <span className="text-sm font-bold text-[var(--fc-text-primary)]">K {p.price.toFixed(2)}</span>
                </button>
                <button
                  onClick={() => void handleAdd(p)}
                  aria-label={t('food.add', runtime.locale)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--fc-bg-secondary)] bg-[var(--fc-surface)] text-[var(--fc-bg-secondary)] active:scale-95"
                >
                  <Icon name={added === p.id ? 'check' : 'plus'} size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <FoodCartBar flow={flow} onOpenCart={openCartPage} />
    </div>
  );
}