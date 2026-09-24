'use client';

import { useEffect, useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useLaundry } from '@/lib/laundry/use-laundry';
import type { LaundryOrder } from '@fixcycle/api-client';

const IMG_FALLBACK = '/assets/phase-10/outlet-default.svg';

type Tab = 'ONGOING' | 'PAST';

export default function LaundryOrdersPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const flow = useLaundry();

  const [tab, setTab] = useState<Tab>('ONGOING');

  useEffect(() => {
    void flow.loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orders: LaundryOrder[] = tab === 'ONGOING' ? flow.ongoingOrders : flow.pastOrders;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('laundry.myOrders', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 pb-16 pt-3">
        {/* Tabs */}
        <section className="mb-4 px-4">
          <div className="flex gap-2 rounded-full border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-1">
            {(['ONGOING', 'PAST'] as Tab[]).map((key) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex-1 rounded-full py-2 text-xs font-bold transition-colors ${
                    active ? 'bg-[var(--fc-primary)] text-white' : 'text-[var(--fc-text-secondary)]'
                  }`}
                >
                  {key === 'ONGOING' ? t('laundry.ongoing', runtime.locale) : t('laundry.past', runtime.locale)}
                </button>
              );
            })}
          </div>
        </section>

        {flow.ordersLoading && orders.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="laundry" size={28} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">
              {tab === 'ONGOING' ? 'No ongoing orders' : 'No past orders'}
            </p>
            <Button variant="primary" onClick={() => router.push('/laundry')}>
              {t('laundry.outlets', runtime.locale)}
            </Button>
          </div>
        ) : (
          <section className="px-4">
            <ul className="flex flex-col gap-2">
              {orders.map((order) => (
                <li key={order.order_id}>
                  <button
                    onClick={() => router.push(`/laundry/tracker/${order.order_id}`)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-3 text-left"
                  >
                    <img
                      src={order.outlet_image || IMG_FALLBACK}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src = IMG_FALLBACK;
                      }}
                      className="h-12 w-12 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--fc-text-primary)]">{order.outlet_name}</p>
                      <p className="truncate text-xs text-[var(--fc-text-secondary)]">
                        {order.items_count} {t('laundry.itemsCount', runtime.locale)} Ã‚Â· {order.booking_date}
                        {order.slot_time_text ? ` Ã‚Â· ${order.slot_time_text}` : ''}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--fc-primary)]">{order.order_status_text}</span>
                        <span className="text-sm font-bold text-[var(--fc-text-primary)]">
                          {order.currency} {Number(order.final_amount_paid).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                    <Icon name="chevron" size={16} className="mt-1 shrink-0 text-[var(--fc-text-secondary)]" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}