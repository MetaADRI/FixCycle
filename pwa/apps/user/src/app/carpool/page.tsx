'use client';

import { useState } from 'react';
import { Button, Icon, IconButton, TopHeader } from '@fixcycle/ui';
import { useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useCarpool } from '@/lib/carpool/use-carpool';

export default function CarpoolHomePage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const carpool = useCarpool();

  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [pickupLat, setPickupLat] = useState<string>('');
  const [pickupLng, setPickupLng] = useState<string>('');
  const [dropLat, setDropLat] = useState<string>('');
  const [dropLng, setDropLng] = useState<string>('');
  const [rideDate, setRideDate] = useState<string>('');

  const canSearch =
    pickupLat.trim() !== '' && pickupLng.trim() !== '' && dropLat.trim() !== '' && dropLng.trim() !== '';

  const handleSearch = async () => {
    if (!canSearch) return;
    const ok = await carpool.search({
      segmentId: 3,
      pickupLatitude: parseFloat(pickupLat),
      pickupLongitude: parseFloat(pickupLng),
      dropLatitude: parseFloat(dropLat),
      dropLongitude: parseFloat(dropLng),
      pickupLocation,
      dropLocation,
    });
    if (ok) {
      router.push(`/carpool/results?date=${encodeURIComponent(rideDate)}`);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('carpool.home', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
        trailing={
          <button type="button" aria-label={t('carpool.offerRide', runtime.locale)} onClick={() => router.push('/carpool/offer')}>
            <span className="rounded-full bg-[var(--fc-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--fc-primary)]">
              + {t('carpool.offer', runtime.locale)}
            </span>
          </button>
        }
      />

      <main className="flex-1 px-4 pt-4">
        <section className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#6d2bbf] to-[#9859e0] p-4">
          <div className="flex items-center gap-3">
            <Icon name="carpool" size={36} className="text-white" />
            <div>
              <h1 className="text-base font-bold text-white">{t('carpool.home', runtime.locale)}</h1>
              <p className="text-xs text-white/70">{t('carpool.offerSubtitle', runtime.locale)}</p>
            </div>
          </div>
        </section>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('carpool.offerStart', runtime.locale)}</label>
            <input
              type="text"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder={`${t('carpool.offerStart', runtime.locale)} (text)`}
              className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
            />
            <div className="mt-1 flex gap-2">
              <input
                type="number"
                step="any"
                placeholder="Lat"
                value={pickupLat}
                onChange={(e) => setPickupLat(e.target.value)}
                className="w-1/2 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
              <input
                type="number"
                step="any"
                placeholder="Lng"
                value={pickupLng}
                onChange={(e) => setPickupLng(e.target.value)}
                className="w-1/2 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('carpool.offerEnd', runtime.locale)}</label>
            <input
              type="text"
              value={dropLocation}
              onChange={(e) => setDropLocation(e.target.value)}
              placeholder={`${t('carpool.offerEnd', runtime.locale)} (text)`}
              className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
            />
            <div className="mt-1 flex gap-2">
              <input
                type="number"
                step="any"
                placeholder="Lat"
                value={dropLat}
                onChange={(e) => setDropLat(e.target.value)}
                className="w-1/2 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
              <input
                type="number"
                step="any"
                placeholder="Lng"
                value={dropLng}
                onChange={(e) => setDropLng(e.target.value)}
                className="w-1/2 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('carpool.rideDate', runtime.locale)}</label>
            <input
              type="datetime-local"
              value={rideDate}
              onChange={(e) => setRideDate(e.target.value)}
              className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
            />
          </div>

          {carpool.error && <p className="text-xs text-[var(--fc-error)]">{carpool.error}</p>}

          <Button
            variant="primary"
            disabled={!canSearch || carpool.searching}
            onClick={() => void handleSearch()}
            className="w-full"
          >
            {carpool.searching ? t('carpool.searching', runtime.locale) : t('carpool.search', runtime.locale)}
          </Button>
        </div>

        <div className="mt-8 space-y-2">
          <button
            onClick={() => router.push('/carpool/rides')}
            className="flex w-full items-center gap-3 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-3 text-left"
          >
            <Icon name="history" size={20} className="text-[var(--fc-primary)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--fc-text-primary)]">{t('carpool.myRides', runtime.locale)}</p>
              <p className="text-xs text-[var(--fc-text-secondary)]">Offered and booked rides</p>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}