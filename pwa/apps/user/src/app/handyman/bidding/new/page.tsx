'use client';

import { useState } from 'react';
import { Button, IconButton, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useHandyman } from '@/lib/handyman/use-handyman';

export default function HandymanNewBidPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const flow = useHandyman('6');

  const [description, setDescription] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [location, setLocation] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().slice(0, 10));

  const handleSubmit = async () => {
    if (!description.trim()) return;
    const created = await flow.createBidOrder({
      description: description.trim(),
      userOfferPrice: offerPrice ? Number(offerPrice) : undefined,
      dropLocation: location.trim(),
      bookingDate,
    });
    if (created) {
      router.replace(`/handyman/bidding/${created.bid_order_id}`);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('handyman.postRequest', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 pb-28 pt-3">
        <div className="flex flex-col gap-4 px-4">
          {/* Work description */}
          <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
            <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">Work Description</h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the work you need done"
              rows={4}
              className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
            />
          </section>

          {/* Offer price */}
          <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
            <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">Your Offer Price</h2>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--fc-text-secondary)]">K</span>
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] pl-7 pr-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
              />
            </div>
          </section>

          {/* Drop location */}
          <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
            <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('handyman.address', runtime.locale)}</h2>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your address"
              className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
            />
          </section>

          {/* Booking date */}
          <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
            <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">Booking Date</h2>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none"
            />
          </section>

          {flow.error ? (
            <p className="text-xs font-semibold text-[var(--fc-danger)]">{flow.error}</p>
          ) : null}

          <Button
            block
            variant="primary"
            loading={flow.loading}
            disabled={!description.trim()}
            onClick={() => void handleSubmit()}
          >
            {t('handyman.postRequest', runtime.locale)}
          </Button>
        </div>
      </main>
    </div>
  );
}
