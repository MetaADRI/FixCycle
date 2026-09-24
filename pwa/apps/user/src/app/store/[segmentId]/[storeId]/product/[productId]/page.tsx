'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useStore } from '@/lib/store/use-store';
import { segmentSlug } from '@/lib/store/segment';
import type { StoreProduct } from '@fixcycle/api-client';

export default function StoreProductPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ segmentId: string; storeId: string; productId: string }>();
  const flow = useStore(segmentSlug(params?.segmentId));
  const segmentId = params?.segmentId ?? '';
  const storeId = params?.storeId ?? '';
  const productId = params?.productId ?? '';

  const [localProduct, setLocalProduct] = useState<StoreProduct | null>(null);
  const [localQuantity, setLocalQuantity] = useState(1);

  useEffect(() => {
    if (!storeId) return;
    void flow.openStore(storeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const product = useMemo(() => {
    if (localProduct) return localProduct;
    const found = flow.storeDetails?.products.find((p) => String(p.id) === String(productId)) ?? null;
    return found;
  }, [localProduct, flow.storeDetails, productId]);

  useEffect(() => {
    if (!product) return;
    setLocalProduct(product);
    flow.setVariantId(product.variants[0]?.id ?? null);
    flow.setOptionIds([]);
    setLocalQuantity(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const variantPrice =
    product?.variants.find((v) => String(v.id) === String(flow.variantId))?.price ??
    product?.price ??
    0;
  const optionsPrice = (product?.options.filter((o) => flow.optionIds.includes(o.id)) ?? []).reduce(
    (sum, o) => sum + o.price,
    0,
  );
  const unitPrice = (variantPrice || product?.price || 0) + optionsPrice;
  const totalPrice = unitPrice * localQuantity;

  const handleAdd = async () => {
    if (!product) return;
    await flow.addToStoreCartWithSelection(product, localQuantity);
    router.push(`/store/${segmentId}/${storeId}`);
  };

  if (flow.loading && !product) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <Icon name="alert" size={28} className="text-[var(--fc-warning)]" />
        <p className="text-sm text-[var(--fc-text-secondary)]">{t('store.errMenu', runtime.locale)}</p>
        <Button variant="secondary" onClick={() => router.back()}>
          {t('common.back', runtime.locale)}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('store.customise', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 pb-28 pt-3">
        <section className="px-4">
          <img
            src={flow.isPharmacy ? '/assets/phase-8/pharmacy-product.svg' : '/assets/phase-8/product-placeholder.svg'}
            alt=""
            className="h-36 w-full rounded-2xl object-cover"
          />
          <div className="mt-4">
            <h1 className="text-xl font-bold text-[var(--fc-text-primary)]">{product.product_name}</h1>
            {product.description ? (
              <p className="mt-1 text-sm text-[var(--fc-text-secondary)]">{product.description}</p>
            ) : null}
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--fc-text-secondary)]">
              {t('store.weight', runtime.locale)}: {product.weight || 'Ã¢â‚¬â€'}
            </p>
            <p className="mt-2 text-lg font-bold text-[var(--fc-text-primary)]">Ã¢â€šÂ¹ {product.price.toFixed(2)}</p>
          </div>
        </section>

        {product.variants.length > 1 ? (
          <section className="mt-5 px-4">
            <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('store.variant', runtime.locale)}</h2>
            <ul className="space-y-2">
              {product.variants.map((v) => {
                const active = String(flow.variantId) === String(v.id);
                return (
                  <li key={v.id}>
                    <button
                      onClick={() => flow.setVariantId(v.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors ${
                        active
                          ? 'border-[var(--fc-bg-secondary)] bg-[var(--fc-bg-secondary)]/5'
                          : 'border-[var(--fc-border)] bg-[var(--fc-surface-raised)]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--fc-text-primary)]">{v.name}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--fc-text-primary)]">Ã¢â€šÂ¹ {v.price.toFixed(2)}</span>
                        {active ? <Icon name="check" size={18} className="text-[var(--fc-bg-secondary)]" /> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {product.options.length > 0 ? (
          <section className="mt-5 px-4">
            <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('store.options', runtime.locale)}</h2>
            <ul className="space-y-2">
              {product.options.map((o) => {
                const active = flow.optionIds.includes(o.id);
                return (
                  <li key={o.id}>
                    <button
                      onClick={() => flow.toggleOption(o.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors ${
                        active
                          ? 'border-[var(--fc-bg-secondary)] bg-[var(--fc-bg-secondary)]/5'
                          : 'border-[var(--fc-border)] bg-[var(--fc-surface-raised)]'
                      }`}
                    >
                      <span className="text-sm font-bold text-[var(--fc-text-primary)]">{o.name}</span>
                      <span className="flex items-center gap-2">
                        {o.price > 0 ? (
                          <span className="text-sm font-bold text-[var(--fc-text-primary)]">Ã¢â€šÂ¹ {o.price.toFixed(2)}</span>
                        ) : null}
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            active ? 'border-[var(--fc-bg-secondary)] bg-[var(--fc-bg-secondary)] text-white' : 'border-[var(--fc-border)]'
                          }`}
                        >
                          {active ? <Icon name="check" size={13} /> : null}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section className="mt-5 flex items-center gap-3 px-4">
          <h2 className="text-sm font-bold text-[var(--fc-text-primary)]">{t('store.quantity', runtime.locale)}</h2>
          <span className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setLocalQuantity((q) => Math.max(1, q - 1))}
              aria-label="decrease"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] text-[var(--fc-text-primary)]"
            >
              <Icon name="minus" size={16} />
            </button>
            <span className="min-w-6 text-center text-base font-bold text-[var(--fc-text-primary)]">
              {localQuantity}
            </span>
            <button
              onClick={() => setLocalQuantity((q) => q + 1)}
              aria-label="increase"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] text-[var(--fc-text-primary)]"
            >
              <Icon name="plus" size={16} />
            </button>
          </span>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] px-4 pb-4">
        <Button block variant="primary" loading={flow.loading} onClick={() => void handleAdd()}>
          <span className="font-semibold">{t('store.add', runtime.locale)}</span>
          <span className="font-bold">Ã¢â€šÂ¹ {totalPrice.toFixed(2)}</span>
        </Button>
      </div>
    </div>
  );
}