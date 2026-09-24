'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useLaundry } from '@/lib/laundry/use-laundry';

const IMG_FALLBACK = '/assets/phase-10/outlet-default.svg';

export default function LaundryTrackerPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId ?? '';
  const flow = useLaundry();

  const [otp, setOtp] = useState('');
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

  useEffect(() => {
    if (!orderId || !detail) return;
    const status = detail.order_status;
    if (status >= 14 || [2, 3, 5, 8].includes(status)) return;
    const timer = window.setInterval(() => {
      void flow.loadOrderDetail(orderId);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [orderId, detail?.order_status]); // eslint-disable-line react-hooks/exhaustive-deps

  const status = detail?.order_status ?? 0;
  const isCancelled = [2, 3, 5, 8].includes(status);
  const isDone = status >= 14;
  const steps = detail?.status_prgress ?? [];
  const reachedSteps = steps.filter((s) => s.status).length;
  const showOtp = (detail?.otp_required || detail?.arr_action.otp_required) && !isDone && !isCancelled;

  const handleVerifyOtp = useCallback(async () => {
    if (otp.trim().length < 4) return;
    const ok = await flow.verifyOtp(orderId, otp.trim());
    if (ok) setOtp('');
  }, [flow, orderId, otp]);

  const handleCancel = useCallback(async () => {
    if (selectedReason == null) return;
    await flow.cancelOrder(orderId, selectedReason);
    setShowCancel(false);
  }, [flow, orderId, selectedReason]);

  const handleRate = useCallback(async () => {
    if (rating === 0) return;
    await flow.rateOrder(orderId, rating, comment || undefined);
  }, [flow, orderId, rating, comment]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('laundry.trackOrder', runtime.locale)}
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
            <Button variant="primary" onClick={() => router.push('/laundry/orders')}>
              {t('laundry.myOrders', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4">
            {/* Outlet header */}
            <section className="flex items-center gap-3 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <img
                src={detail.outlet_image || IMG_FALLBACK}
                alt=""
                onError={(e) => {
                  e.currentTarget.src = IMG_FALLBACK;
                }}
                className="h-12 w-12 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[var(--fc-text-primary)]">{detail.outlet_name}</p>
                <p className="truncate text-xs text-[var(--fc-text-secondary)]">{detail.outlet_address}</p>
                <p className="mt-0.5 text-xs font-semibold text-[var(--fc-primary)]">{detail.order_status_text}</p>
              </div>
              <IconButton icon="phone" label="Call outlet" onClick={() => undefined} />
            </section>

            {/* Progress */}
            {isCancelled || status === 2 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--fc-danger)]/20 bg-[var(--fc-danger)]/5 px-4 py-5">
                <Icon name="alert" size={28} className="text-[var(--fc-danger)]" />
                <p className="text-sm font-bold text-[var(--fc-danger)]">Cancelled</p>
              </div>
            ) : steps.length > 0 ? (
              <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--fc-border)]">
                  <div
                    className="h-full rounded-full bg-[var(--fc-primary)] transition-all duration-500"
                    style={{ width: `${Math.max(2, (reachedSteps / steps.length) * 100)}%` }}
                  />
                </div>
                <ul className="space-y-2">
                  {steps.map((step, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          step.status ? 'bg-[var(--fc-primary)] text-white' : 'bg-[var(--fc-border)] text-[var(--fc-text-secondary)]'
                        }`}
                      >
                        {step.status ? <Icon name="check" size={12} /> : <span className="text-[10px]">{idx + 1}</span>}
                      </span>
                      <span className={step.status ? 'font-semibold text-[var(--fc-text-primary)]' : 'text-[var(--fc-text-secondary)]'}>
                        {step.status_text}
                      </span>
                      {step.status && step.order_timestamp ? (
                        <span className="ml-auto text-[10px] text-[var(--fc-text-secondary)]">{step.order_timestamp}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* OTP verification */}
            {showOtp ? (
              <section className="rounded-2xl border border-[var(--fc-primary)]/30 bg-[var(--fc-primary)]/5 p-4">
                <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-[var(--fc-text-primary)]">
                  {t('laundry.otpTitle', runtime.locale)}
                </h3>
                <p className="mb-3 text-xs text-[var(--fc-text-secondary)]">{t('laundry.otpHint', runtime.locale)}</p>
                <div className="mb-3 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-center">
                  <span className="text-2xl font-bold tracking-[0.5em] text-[var(--fc-primary)]">OTP {detail.order_otp}</span>
                </div>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  placeholder="Enter OTP from delivery partner"
                  className="mb-2 w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-center text-sm tracking-widest text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
                />
                <Button
                  block
                  variant="primary"
                  loading={flow.orderDetailLoading}
                  disabled={otp.trim().length < 4}
                  onClick={() => void handleVerifyOtp()}
                >
                  {t('laundry.verifyOtp', runtime.locale)}
                </Button>
              </section>
            ) : null}

            {/* Items */}
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h3 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">
                {t('laundry.services', runtime.locale)} ({detail.total_quantity} {t('laundry.itemsCount', runtime.locale)})
              </h3>
              <ul className="space-y-1.5">
                {detail.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-[var(--fc-text-primary)]">
                      {item.title} <span className="text-[var(--fc-text-secondary)]">Ãƒâ€” {item.quantity}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-[var(--fc-text-primary)]">{item.total_amount}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 border-t border-[var(--fc-border)] pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--fc-text-secondary)]">Cart Amount</span>
                  <span className="text-[var(--fc-text-primary)]">{detail.payment_detail.cart_amount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--fc-text-secondary)]">{t('laundry.deliveryCharges', runtime.locale)}</span>
                  <span className="text-[var(--fc-text-primary)]">{detail.payment_detail.delivery_amount}</span>
                </div>
                {Number(detail.payment_detail.discount_amount) > 0 ? (
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--fc-success)]">{t('laundry.discount', runtime.locale)}</span>
                    <span className="text-[var(--fc-success)]">-{detail.payment_detail.discount_amount}</span>
                  </div>
                ) : null}
                {Number(detail.payment_detail.tax) > 0 ? (
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--fc-text-secondary)]">{t('laundry.tax', runtime.locale)}</span>
                    <span className="text-[var(--fc-text-primary)]">{detail.payment_detail.tax}</span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-[var(--fc-border)] pt-1 text-sm font-bold">
                  <span className="text-[var(--fc-text-primary)]">{t('laundry.toPay', runtime.locale)}</span>
                  <span className="text-[var(--fc-text-primary)]">
                    Ã¢â€šÂ¹{Number(detail.payment_detail.final_amount_paid).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </section>

            {/* Details */}
            <section className="space-y-2 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <div className="flex items-center gap-2 text-sm">
                <Icon name="loc" size={14} className="text-[var(--fc-text-secondary)]" />
                <span className="text-[var(--fc-text-primary)]">{detail.drop_location || detail.outlet_address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Icon name="clock" size={14} className="text-[var(--fc-text-secondary)]" />
                <span className="text-[var(--fc-text-primary)]">
                  {detail.booking_date} Ã‚Â· {detail.slot_time_text}
                </span>
              </div>
              {detail.estimate_delivery_time ? (
                <div className="flex items-center gap-2 text-xs text-[var(--fc-text-secondary)]">
                  <Icon name="history" size={14} />
                  <span>{t('laundry.estimateDelivery', runtime.locale)}: {detail.estimate_delivery_time}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2 text-xs text-[var(--fc-text-secondary)]">
                <Icon name="document" size={14} />
                <span>#{detail.merchant_order_id}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--fc-text-secondary)]">
                <Icon name="cash" size={14} />
                <span>{detail.payment_detail.payment_mode}</span>
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
                    <Button block variant="danger" className="mt-3" disabled={selectedReason == null} onClick={() => void handleCancel()}>
                      {t('laundry.cancelOrder', runtime.locale)}
                    </Button>
                  </div>
                ) : (
                  <Button block variant="danger" onClick={() => setShowCancel(true)}>
                    {t('laundry.cancelOrder', runtime.locale)}
                  </Button>
                )}
              </section>
            ) : null}

            {/* Rating */}
            {!detail.is_rated && isDone && !isCancelled ? (
              <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
                <h3 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('laundry.rateOutlet', runtime.locale)}</h3>
                <div className="mb-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRating(s)}>
                      <Icon name="star" size={24} className={s <= rating ? 'text-[var(--fc-warning)]' : 'text-[var(--fc-border)]'} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your feedback (optional)"
                  className="mb-3 w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
                  rows={2}
                />
                <Button block variant="primary" disabled={rating === 0} onClick={() => void handleRate()}>
                  {t('laundry.rateOutlet', runtime.locale)}
                </Button>
              </section>
            ) : null}

            <Button block variant="secondary" onClick={() => router.push('/laundry/orders')}>
              {t('laundry.myOrders', runtime.locale)}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}