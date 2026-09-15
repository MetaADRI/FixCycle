'use client';

import { useCallback, useEffect } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useStore } from '@/lib/store/use-store';
import { segmentSlug } from '@/lib/store/segment';
import type { StoreCartItem } from '@fixcycle/api-client';

export default function StoreCartPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ segmentId: string }>();
  const segmentId = params?.segmentId ?? '';
  const flow = useStore(segmentSlug(segmentId));
  const { cart, loading } = flow;

  const onRefresh = useCallback(() => void flow.refreshCart(), [flow]);
  useEffect(() => {
    onRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtotal = cart.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const storeId = cart.products[0]?.store_id ?? 0;
  const checkoutDisabled = cart.products.length === 0;

  const handleCheckout = () => {
    router.push(`/store/${segmentId}/checkout?storeId=${encodeURIComponent(storeId)}`);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('store.cart', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 pb-28 pt-3">
        {loading && cart.products.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : cart.products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <img src="/assets/phase-8/empty-cart.svg" alt="" className="h-44 w-44" />
            <p className="text-base font-bold text-[var(--fc-text-primary)]">{t('store.cartEmpty', runtime.locale)}</p>
            <p className="max-w-xs text-sm text-[var(--fc-text-secondary)]">
              {t('store.cartEmptyMessage', runtime.locale)}
            </p>
            <Button variant="primary" onClick={() => router.push(`/store/${segmentId}`)}>
              {t('store.browseStores', runtime.locale)}
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-2 px-4">
              {cart.products.map((item) => (
                <CartItemRow key={item.cart_id} item={item} flow={flow} />
              ))}
            </ul>

            <section className="mt-5 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--fc-text-secondary)]">{t('store.subtotal', runtime.locale)}</span>
                <span className="font-bold text-[var(--fc-text-primary)]">₹ {subtotal.toFixed(2)}</span>
              </div>
              <p className="mt-1 text-[10px] text-[var(--fc-text-secondary)]">
                {t('store.minimumOrder', runtime.locale)}: ₹ {cart.products[0]?.store_id ? '99' : '—'}
              </p>
            </section>

            <div className="px-4 pt-4">
              <Button block variant="primary" disabled={checkoutDisabled} onClick={handleCheckout}>
                {t('store.checkout', runtime.locale)}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function CartItemRow({
  item,
  flow,
}: {
  item: StoreCartItem;
  flow: ReturnType<typeof useStore>;
}): React.ReactNode {
  const { runtime } = useRuntime();
  const onChange = (next: number) => {
    void flow.changeQuantity(item, next);
  };

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-3">
      <img src="/assets/phase-8/product-placeholder.svg" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[var(--fc-text-primary)]">{item.product_name}</p>
        <p className="flex items-center gap-1.5 text-xs text-[var(--fc-text-secondary)]">
          {item.variant_name ? <span>{item.variant_name}</span> : null}
          {item.weight ? <span>{item.weight}</span> : null}
          <span>₹ {item.price.toFixed(2)}</span>
        </p>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="flex items-center gap-2">
            <button
              onClick={() => onChange(item.quantity - 1)}
              aria-label="decrease"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--fc-border)] bg-[var(--fc-surface)] text-[var(--fc-text-primary)]"
            >
              <Icon name="minus" size={13} />
            </button>
            <span className="min-w-5 text-center text-sm font-bold text-[var(--fc-text-primary)]">{item.quantity}</span>
            <button
              onClick={() => onChange(item.quantity + 1)}
              aria-label="increase"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--fc-border)] bg-[var(--fc-surface)] text-[var(--fc-text-primary)]"
            >
              <Icon name="plus" size={13} />
            </button>
          </span>
          <button
            onClick={() => flow.removeItem(item.cart_id)}
            aria-label={t('store.cartEmpty', runtime.locale)}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-[var(--fc-danger)]"
          >
            <Icon name="trash" size={15} />
          </button>
        </div>
      </div>
    </li>
  );
}