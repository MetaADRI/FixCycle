'use client';

import { Button, Icon } from '@fixcycle/ui';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import type { StoreFlow } from '@/lib/store/use-store';

export function StoreCartBar({
  flow,
  onOpenCart,
}: {
  flow: StoreFlow;
  onOpenCart: () => void;
}): React.ReactNode {
  const { runtime } = useRuntime();
  const count = flow.cart.total_items ?? 0;
  const total = flow.cart.products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] px-4 pb-4">
      <Button block variant="primary" onClick={onOpenCart} className="shadow-lg">
        <span className="flex flex-1 items-center gap-2">
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/20 px-1 text-xs font-bold">
            {count}
          </span>
          <span>{t('store.cart', runtime.locale)}</span>
        </span>
        <span className="font-bold">₹ {total.toFixed(2)}</span>
        <Icon name="chevron-right" size={18} />
      </Button>
    </div>
  );
}
