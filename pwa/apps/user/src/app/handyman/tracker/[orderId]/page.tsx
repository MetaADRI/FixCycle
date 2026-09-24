'use client';

import { useEffect, useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useHandyman } from '@/lib/handyman/use-handyman';

export default function HandymanTrackerPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId ?? '';
  const flow = useHandyman('6');

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [selectedReason, setSelectedReason] = useState<number | null>(null);

  const detail = flow.orderDetail;

  useEffect(() => {
    if (!orderId) return;
    void flow.loadOrderDetail(orderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const status = detail?.status ?? 0;
  const isCancelled = [2, 3, 5, 8].includes(status);
  const steps = [
    { label: 'Placed', done: status >= 1 },
    { label: 'Accepted', done: status >= 6 },
    { label: 'In Progress', done: status >= 9 },
    { label: 'Done', done: status >= 11 },
  ];
  const done = status >= 11;

  const handleCancel = async () => {
    if (selectedReason == null) return;
    await flow.cancelOrder(selectedReason);
    setShowCancel(false);
  };

  const handleRate = async () => {
    if (rating === 0) return;
    await flow.rateOrder(rating, comment || undefined);
  };

  const handlePay = async () => {
    const pending = detail?.payment_detail?.total_pending_amount ?? '0';
    await flow.payBooking(pending);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title="Order Tracker"
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 pb-28 pt-3">
        {flow.orderDetailLoading && !detail ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : !detail ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="alert" size={28} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">Failed to load order</p>
            <Button variant="primary" onClick={() => router.push('/handyman/orders')}>
              {t('handyman.myBookings', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4">
            {/* Provider header */}
            <section className="flex items-center gap-3 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <img src={detail.profile_image || '/assets/phase-9/provider-avatar.svg'} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div>
                <p className="text-sm font-bold text-[var(--fc-text-primary)]">{detail.first_name} {detail.last_name}</p>
                <div className="flex items-center gap-1">
                  <Icon name="star" size={12} className="text-[var(--fc-warning)]" />
                  <span className="text-xs text-[var(--fc-text-secondary)]">{detail.rating || '0'}</span>
                </div>
              </div>
            </section>

            {/* Progress / Cancelled */}
            {isCancelled ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--fc-danger)]/20 bg-[var(--fc-danger)]/5 px-4 py-5">
                <Icon name="alert" size={28} className="text-[var(--fc-danger)]" />
                <p className="text-sm font-bold text-[var(--fc-danger)]">Cancelled</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 px-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--fc-border)]">
                  <div
                    className="h-full rounded-full bg-[var(--fc-primary)] transition-all duration-500"
                    style={{ width: `${Math.max(2, (steps.filter((s) => s.done).length / steps.length) * 100)}%` }}
                  />
                </div>
                <ul className="flex items-center justify-between text-[10px] font-semibold text-[var(--fc-text-secondary)]">
                  {steps.map((s) => (
                    <li key={s.label} className={`text-center ${s.done ? 'text-[var(--fc-primary)]' : ''}`}>
                      {s.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Services + Payment */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h3 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">Services</h3>
              <ul className="space-y-1.5">
                {detail.service_type.map((svc) => (
                  <li key={svc.id} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--fc-text-primary)]">{svc.name}</span>
                    <span className="font-semibold text-[var(--fc-text-primary)]">{svc.amount}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t border-[var(--fc-border)] pt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--fc-text-secondary)]">Cart Amount</span>
                  <span className="text-[var(--fc-text-primary)]">{detail.payment_detail.cart_amount}</span>
                </div>
                {Number(detail.payment_detail.discount_amount) > 0 ? (
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--fc-success)]">Discount</span>
                    <span className="text-[var(--fc-success)]">-{detail.payment_detail.discount_amount}</span>
                  </div>
                ) : null}
                {Number(detail.payment_detail.tax) > 0 ? (
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--fc-text-secondary)]">Tax</span>
                    <span className="text-[var(--fc-text-primary)]">{detail.payment_detail.tax}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm font-bold border-t border-[var(--fc-border)] pt-1">
                  <span className="text-[var(--fc-text-primary)]">Total Paid</span>
                  <span className="text-[var(--fc-text-primary)]">K{Number(detail.payment_detail.final_amount_paid).toLocaleString('en-IN')}</span>
                </div>
                {detail.payment_detail.pending_amount_status ? (
                  <p className="text-xs text-[var(--fc-warning)]">{detail.payment_detail.pending_message}</p>
                ) : null}
              </div>
            </section>

            {/* Details card */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Icon name="loc" size={14} className="text-[var(--fc-text-secondary)]" />
                <span className="text-[var(--fc-text-primary)]">{detail.drop_location || 'Home'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Icon name="clock" size={14} className="text-[var(--fc-text-secondary)]" />
                <span className="text-[var(--fc-text-primary)]">{detail.booking_date} Ã‚Â· {detail.slot_time_text}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--fc-text-secondary)]">
                <Icon name="document" size={14} />
                <span>#{detail.merchant_order_id}</span>
              </div>
            </section>

            {/* Cancel */}
            {detail.arr_action.cancel && !isCancelled ? (
              <section>
                {showCancel ? (
                  <div className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
                    <h3 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">Select a reason</h3>
                    <ul className="space-y-2">
                      {detail.cancel_reason.map((r) => (
                        <li key={r.id}>
                          <button
                            onClick={() => setSelectedReason(r.id)}
                            className={`flex w-full items-center gap-2 rounded-xl border p-3 text-left text-sm transition-colors ${
                              selectedReason === r.id
                                ? 'border-[var(--fc-danger)] bg-[var(--fc-danger)]/5 text-[var(--fc-danger)]'
                                : 'border-[var(--fc-border)] bg-[var(--fc-surface)] text-[var(--fc-text-primary)]'
                            }`}
                          >
                            {r.reason}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <Button
                      block
                      variant="danger"
                      className="mt-3"
                      disabled={selectedReason == null}
                      onClick={() => void handleCancel()}
                    >
                      Cancel Booking
                    </Button>
                  </div>
                ) : (
                  <Button block variant="danger" onClick={() => setShowCancel(true)}>
                    Cancel Booking
                  </Button>
                )}
              </section>
            ) : null}

            {/* Rating */}
            {!detail.is_rated && done ? (
              <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
                <h3 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('handyman.rateProviderTitle', runtime.locale)}</h3>
                <div className="mb-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRating(s)}>
                      <Icon
                        name="star"
                        size={24}
                        className={s <= rating ? 'text-[var(--fc-warning)]' : 'text-[var(--fc-border)]'}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your feedback (optional)"
                  className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
                  rows={2}
                />
                <Button block variant="primary" disabled={rating === 0} onClick={() => void handleRate()}>
                  {t('handyman.rateProvider', runtime.locale)}
                </Button>
              </section>
            ) : null}

            <Button block variant="primary" onClick={() => router.push('/handyman/orders')}>
              {t('handyman.myBookings', runtime.locale)}
            </Button>
          </div>
        )}
      </main>

      {/* Bottom bar - pay */}
      {detail?.arr_action.pay || detail?.payment_detail?.pending_amount_status ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--fc-border)] bg-white px-4 py-3">
          <div className="mx-auto max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px]">
            <Button block variant="primary" onClick={() => void handlePay()}>
              Pay now Ã‚Â· K{Number(detail?.payment_detail?.total_pending_amount ?? 0).toLocaleString('en-IN')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
