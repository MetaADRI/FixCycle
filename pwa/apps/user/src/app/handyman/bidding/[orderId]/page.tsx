'use client';

import { useEffect, useState } from 'react';
import { Button, Icon, IconButton, Spinner, StatusPill, TopHeader } from '@fixcycle/ui';

import { useParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useHandyman } from '@/lib/handyman/use-handyman';

export default function HandymanBidDetailPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId ?? '';
  const flow = useHandyman('6');

  const [counterAmount, setCounterAmount] = useState('');
  const [counteringId, setCounteringId] = useState<string | number | null>(null);

  useEffect(() => {
    if (!orderId) return;
    void flow.loadBidOrderDetail(orderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const detail = flow.bidOrderDetail;
  const bids = flow.bids;
  const isBooked = detail?.status === 'Booked' || detail?.status === 'Accepted';
  const isActive = detail && !isBooked;

  const handleAccept = async (driverId: number) => {
    await flow.acceptBid(driverId);
  };

  const handleCounter = async (bidId: number | string) => {
    if (!counterAmount) return;
    setCounteringId(bidId);
    await flow.counterBid(bidId, Number(counterAmount));
    setCounteringId(null);
    setCounterAmount('');
  };

  const handleCancel = async () => {
    await flow.cancelDeleteBid('CANCEL');
  };

  const handleDelete = async () => {
    await flow.cancelDeleteBid('DELETE');
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title="Work Request"
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 pb-28 pt-3">
        {flow.bidsLoading && !detail ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : !detail ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="alert" size={28} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">Failed to load work request</p>
            <Button variant="primary" onClick={() => router.push('/handyman/bidding')}>
              Back to requests
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4">
            {/* Header */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--fc-text-secondary)]">
                  {detail.category_name} · {detail.service_name}
                </span>
                <StatusPill tone={isBooked ? 'success' : 'warning'}>
                  {detail.status}
                </StatusPill>
              </div>
              {detail.description ? (
                <p className="mt-2 text-sm text-[var(--fc-text-primary)]">{detail.description}</p>
              ) : null}
              <div className="mt-2 flex items-center justify-between border-t border-[var(--fc-border)] pt-2">
                <span className="text-base font-bold text-[var(--fc-text-primary)]">
                  Offer: ₹{Number(detail.user_offer_price).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-[var(--fc-text-secondary)]">{detail.time_slot_text || detail.booked_at}</span>
              </div>
            </section>

            {/* Work images placeholder */}
            <section className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)]">
                  <img src="/assets/phase-9/category-placeholder.svg" alt="" className="h-full w-full object-cover opacity-30" />
                </div>
              ))}
            </section>

            {/* Bids */}
            {bids.length > 0 ? (
              <section>
                <h3 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">
                  Bids ({bids.length})
                </h3>
                <ul className="flex flex-col gap-2">
                  {bids.map((bid) => {
                    const isAccepted = bid.status === 'Accepted';
                    return (
                      <li key={bid.id} className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
                        <div className="flex items-start gap-3">
                          <img src={bid.profile_image || '/assets/phase-9/provider-avatar.svg'} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-[var(--fc-text-primary)]">{bid.first_name} {bid.last_name}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Icon name="star" size={10} className="text-[var(--fc-warning)]" />
                                <span className="text-xs text-[var(--fc-text-secondary)]">{bid.rating}</span>
                              </div>
                              <span className="text-xs text-[var(--fc-text-secondary)]">{bid.time_text}</span>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-[var(--fc-primary)]">₹{Number(bid.bid_amount).toLocaleString('en-IN')}</span>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <StatusPill tone={isAccepted ? 'success' : 'warning'}>
                            {bid.status}
                          </StatusPill>
                        </div>

                        {isActive && bid.status !== 'Accepted' ? (
                          <div className="mt-3 flex items-center gap-2">
                            <Button variant="primary" onClick={() => void handleAccept(bid.driver_id)}>
                              {t('handyman.accept', runtime.locale)}
                            </Button>
                            {counteringId === bid.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={counterAmount}
                                  onChange={(e) => setCounterAmount(e.target.value)}
                                  placeholder="₹"
                                  className="w-20 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-2 py-1.5 text-sm outline-none"
                                />
                                <Button variant="secondary" onClick={() => void handleCounter(bid.id)}>
                                  Send
                                </Button>
                              </div>
                            ) : (
                              <Button variant="secondary" onClick={() => setCounteringId(bid.id)}>
                                {t('handyman.counter', runtime.locale)}
                              </Button>
                            )}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : (
              <p className="text-center text-sm text-[var(--fc-text-secondary)]">No bids yet</p>
            )}
          </div>
        )}
      </main>

      {/* Bottom bar */}
      {isActive ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--fc-border)] bg-white px-4 py-3">
          <div className="mx-auto flex max-w-[430px] gap-3">
            <Button variant="danger" onClick={() => void handleCancel()}>
              {t('handyman.cancelRequest', runtime.locale)}
            </Button>
            <Button variant="secondary" onClick={() => void handleDelete()}>
              {t('handyman.deleteRequest', runtime.locale)}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
