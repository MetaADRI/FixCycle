'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useHandyman } from '@/lib/handyman/use-handyman';
import type { HandymanBidOrder } from '@fixcycle/api-client';

type Tab = 'active' | 'history';

export default function HandymanBiddingPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const flow = useHandyman('6');
  const [tab, setTab] = useState<Tab>('active');

  useEffect(() => {
    void flow.loadBidOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bids = tab === 'active' ? flow.activeBids : flow.allBids;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('handyman.workRequests', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
        trailing={
          <button type="button" onClick={() => router.push('/handyman/bidding/new')}>
            <IconButton icon="plus" label="New request" />
          </button>
        }
      />

      <nav className="flex gap-2 border-b border-[var(--fc-border)] px-4 py-2" aria-label={t('handyman.workRequests', runtime.locale)}>
        {(['active', 'history'] as Tab[]).map((key) => {
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
              {key === 'active' ? 'Active' : 'History'}
            </button>
          );
        })}
      </nav>

      <main className="flex-1 pb-6 pt-3">
        {flow.bidsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : bids.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <img src="/assets/phase-9/empty-bids.svg" alt="" className="h-44 w-44" />
            <p className="text-base font-bold text-[var(--fc-text-primary)]">No work requests yet</p>
            <Button variant="primary" onClick={() => router.push('/handyman/bidding/new')}>
              {t('handyman.postRequest', runtime.locale)}
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2 px-4">
            {bids.map((bid) => (
              <BidCard key={bid.bid_order_id} bid={bid} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function BidCard({ bid }: { bid: HandymanBidOrder }): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();

  return (
    <li
      onClick={() => router.push(`/handyman/bidding/${bid.bid_order_id}`)}
      className="cursor-pointer rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--fc-text-secondary)]">
          {bid.category_name} · {bid.service_name}
        </span>
        {bid.no_of_bids > 0 ? (
          <span className="rounded-full bg-[var(--fc-primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--fc-primary)]">
            {bid.no_of_bids} {t('handyman.bids', runtime.locale)}
          </span>
        ) : null}
      </div>
      {bid.description ? (
        <p className="mt-1 line-clamp-2 text-xs text-[var(--fc-text-secondary)]">{bid.description}</p>
      ) : null}
      <div className="mt-2 flex items-center justify-between border-t border-[var(--fc-border)] pt-2">
        <span className="text-sm font-bold text-[var(--fc-text-primary)]">
          {t('handyman.fromPrice', runtime.locale)} ₹{Number(bid.user_offer_price).toLocaleString('en-IN')}
        </span>
        <span className="text-xs text-[var(--fc-text-secondary)]">{bid.time_slot_text || bid.booked_at}</span>
      </div>
    </li>
  );
}
