'use client';

import { useState } from 'react';
import { Button, Icon, IconButton, TopHeader } from '@fixcycle/ui';
import { useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useBus } from '@/lib/bus/use-bus';

export default function BusHomePage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const bus = useBus();

  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number } | null>(null);

  const canSearch = pickupCoords && dropCoords;

  const handleSearch = async () => {
    if (!pickupCoords || !dropCoords) return;
    const ok = await bus.search({
      segmentId: 4,
      fromLatitude: pickupCoords.lat,
      fromLongitude: pickupCoords.lng,
      toLatitude: dropCoords.lat,
      toLongitude: dropCoords.lng,
      pickupLocation,
      dropLocation,
    });
    if (ok) {
      router.push('/bus/results');
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('bus.searchTitle', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 px-4 pt-4">
        {/* Banner */}
        <section className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a5f2a] to-[#2a8f4a] p-4">
          <div className="flex items-center gap-3">
            <Icon name="bus" size={36} className="text-white" />
            <div>
              <h1 className="text-base font-bold text-white">{t('bus.home', runtime.locale)}</h1>
              <p className="text-xs text-white/70">Intercity and intracity bus booking</p>
            </div>
          </div>
        </section>

        {/* Search form */}
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('bus.fromLocation', runtime.locale)}</label>
            <input
              type="text"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder={t('bus.fromLocation', runtime.locale)}
              className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)] placeholder:text-[var(--fc-text-secondary)]"
            />
            <input
              type="number"
              step="any"
              placeholder="Lat"
              value={pickupCoords?.lat ?? ''}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                setPickupCoords((prev) => ({ lat, lng: prev?.lng ?? 0 }));
              }}
              className="mt-1 w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)] placeholder:text-[var(--fc-text-secondary)]"
            />
            <input
              type="number"
              step="any"
              placeholder="Lng"
              value={pickupCoords?.lng ?? ''}
              onChange={(e) => {
                const lng = parseFloat(e.target.value);
                setPickupCoords((prev) => ({ lat: prev?.lat ?? 0, lng }));
              }}
              className="mt-1 w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)] placeholder:text-[var(--fc-text-secondary)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('bus.toLocation', runtime.locale)}</label>
            <input
              type="text"
              value={dropLocation}
              onChange={(e) => setDropLocation(e.target.value)}
              placeholder={t('bus.toLocation', runtime.locale)}
              className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)] placeholder:text-[var(--fc-text-secondary)]"
            />
            <input
              type="number"
              step="any"
              placeholder="Lat"
              value={dropCoords?.lat ?? ''}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                setDropCoords((prev) => ({ lat, lng: prev?.lng ?? 0 }));
              }}
              className="mt-1 w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)] placeholder:text-[var(--fc-text-secondary)]"
            />
            <input
              type="number"
              step="any"
              placeholder="Lng"
              value={dropCoords?.lng ?? ''}
              onChange={(e) => {
                const lng = parseFloat(e.target.value);
                setDropCoords((prev) => ({ lat: prev?.lat ?? 0, lng }));
              }}
              className="mt-1 w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)] placeholder:text-[var(--fc-text-secondary)]"
            />
          </div>

          {bus.error && (
            <p className="text-xs text-[var(--fc-error)]">{bus.error}</p>
          )}

          <Button
            variant="primary"
            disabled={!canSearch || bus.searching}
            onClick={() => void handleSearch()}
            className="w-full"
          >
            {bus.searching ? t('bus.searching', runtime.locale) : t('bus.search', runtime.locale)}
          </Button>
        </div>

        {/* Quick links */}
        <div className="mt-8 space-y-2">
          <button
            onClick={() => router.push('/bus/bookings')}
            className="flex w-full items-center gap-3 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-3 text-left"
          >
            <Icon name="history" size={20} className="text-[var(--fc-primary)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--fc-text-primary)]">{t('bus.myBookings', runtime.locale)}</p>
              <p className="text-xs text-[var(--fc-text-secondary)]">View upcoming and past bookings</p>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
