'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useHandyman } from '@/lib/handyman/use-handyman';
import type { HandymanOrder } from '@fixcycle/api-client';

type Tab = 'active' | 'past';

const STATUS_TONE: Record<number, string> = {
  1: 'text-[var(--fc-info)]',
  6: 'text-[var(--fc-info)]',
  9: 'text-[var(--fc-warning)]',
  11: 'text-[var(--fc-success)]',
  2: 'text-[var(--fc-danger)]',
  3: 'text-[var(--fc-danger)]',
  5: 'text-[var(--fc-danger)]',
  8: 'text-[var(--fc-danger)]',
};

export default function HandymanOrdersPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const flow = useHandyman('6');
  const [tab, setTab] = useState<Tab>('active');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    await flow.loadOrders();
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const orders = tab === 'active' ? flow.activeOrders : flow.pastOrders;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('handyman.myBookings', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <nav className="flex gap-2 border-b border-[var(--fc-border)] px-4 py-2" aria-label={t('handyman.myBookings', runtime.locale)}>
        {(['active', 'past'] as Tab[]).map((key) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-[var(--fc-primary)] text-white'
                  : 'border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] text-[var(--fc-text-primary)]'
              }`}
            >
              {key === 'active' ? 'Active' : 'Past'}
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
            <img src="/assets/phase-8/empty-cart.svg" alt="" className="h-44 w-44" />
            <p className="text-base font-bold text-[var(--fc-text-primary)]">No bookings yet</p>
            <p className="max-w-xs text-sm text-[var(--fc-text-secondary)]">Your handyman bookings will appear here.</p>
            <Button variant="primary" onClick={() => router.push('/handyman/6')}>
              {t('handyman.findHandymen', runtime.locale)}
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2 px-4">
            {orders.map((order) => (
              <OrderCard key={order.order_id} order={order} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function OrderCard({ order }: { order: HandymanOrder }): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();

  const isCancelled = [2, 3, 5, 8].includes(order.numeric_order_status);
  const isActive = !isCancelled && order.numeric_order_status < 11;

  const serviceName = order.service_type.length > 2
    ? `${order.service_type.slice(0, 2).map((s) => s.name).join(', ')} +${order.service_type.length - 2}`
    : order.service_type.map((s) => s.name).join(', ');

  return (
    <li className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[var(--fc-text-secondary)]">
          #{order.merchant_order_id}
        </span>
        <span className={`text-xs font-bold ${STATUS_TONE[order.numeric_order_status] ?? 'text-[var(--fc-text-secondary)]'}`}>
          {order.status_text || order.order_status}
        </span>
      </div>

      <p className="mt-1 text-sm font-bold text-[var(--fc-text-primary)]">
        {order.first_name} {order.last_name}
      </p>
      <p className="mt-1 line-clamp-1 text-xs text-[var(--fc-text-secondary)]">{serviceName}</p>
      <div className="mt-1 flex items-center gap-2 text-xs text-[var(--fc-text-secondary)]">
        <Icon name="clock" size={10} />
        <span>{order.booking_date} · {order.slot_time_text}</span>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-[var(--fc-border)] pt-2">
        <span className="text-sm font-bold text-[var(--fc-text-primary)]">
          K{Number(order.final_amount_paid).toLocaleString('en-IN')}
        </span>
        {isActive ? (
          <Button variant="secondary" onClick={() => router.push(`/handyman/tracker/${order.order_id}`)}>
            {t('handyman.trackOrder', runtime.locale)}
          </Button>
        ) : null}
      </div>
    </li>
  );
}
