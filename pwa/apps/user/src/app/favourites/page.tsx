'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { AppShell, Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { useFavourites, type FavouritesTab } from '@/lib/favourites/use-favourites';
import { useRuntime } from '@/lib/runtime-context';
import { useAuth } from '@/lib/session';
import { t } from '@/lib/i18n';

export default function FavouritesPage(): ReactNode {
  const { runtime } = useRuntime();
  const { status } = useAuth();
  const router = useRouter();
  const favourites = useFavourites();
  const locale = runtime.locale;

  const [tab, setTab] = useState<FavouritesTab>('drivers');
  const [addingLocation, setAddingLocation] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/on-board');
    }
  }, [status, router]);

  useEffect(() => {
    void favourites.load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  if (status !== 'signedIn') {
    return null;
  }

  const activeTabClass = (active: boolean): string =>
    active
      ? 'bg-[var(--fc-bg-secondary)] text-white'
      : 'bg-[var(--fc-surface-raised)] text-[var(--fc-text-secondary)] border border-[var(--fc-border)]';

  const submitLocation = async () => {
    if (!locationName.trim() || !latitude.trim() || !longitude.trim()) return;
    setMessage('');
    const res = await favourites.addLocation({
      locationName: locationName.trim(),
      address: address.trim() || locationName.trim(),
      latitude,
      longitude,
    });
    setMessage(res.message);
    if (res.success) {
      setLocationName('');
      setAddress('');
      setLatitude('');
      setLongitude('');
      setAddingLocation(false);
    }
  };

  const removeLocation = async (id: string) => {
    setMessage('');
    const res = await favourites.removeLocation(id);
    setMessage(res.message);
  };

  return (
    <AppShell
      header={
        <TopHeader
          title={t('favourites.title', locale)}
          leading={
            <button type="button" aria-label={t('common.back', locale)} onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', locale)} />
            </button>
          }
          trailing={
            tab === 'locations' ? (
              <button type="button" aria-label={t('favourites.locationName', locale)} onClick={() => setAddingLocation((v) => !v)}>
                <IconButton icon="plus" label={t('favourites.locationName', locale)} />
              </button>
            ) : undefined
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <button type="button" onClick={() => setTab('drivers')} aria-pressed={tab === 'drivers'} className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${activeTabClass(tab === 'drivers')}`}>
            {t('favourites.drivers', locale)}
          </button>
          <button type="button" onClick={() => setTab('locations')} aria-pressed={tab === 'locations'} className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${activeTabClass(tab === 'locations')}`}>
            {t('favourites.locations', locale)}
          </button>
        </div>

        {message ? (
          <div
            role="status"
            className="rounded-[var(--fc-radius-md)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)]"
          >
            {message}
          </div>
        ) : null}

        {tab === 'drivers' ? (
          favourites.loading ? (
            <div className="flex justify-center py-6">
              <Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" />
            </div>
          ) : favourites.drivers.length === 0 ? (
            <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-8 text-center">
              <Icon name="star" size={32} className="mx-auto mb-2 text-[var(--fc-text-secondary)]" />
              <p className="text-sm text-[var(--fc-text-secondary)]">{t('favourites.noDrivers', locale)}</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {favourites.drivers.map((driver) => (
                <li key={driver.driverId} className="flex items-center justify-between rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--fc-primary-soft)] text-base font-bold text-[var(--fc-primary)]">
                    {(driver.firstName || 'D').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1 px-3">
                    <p className="truncate text-sm font-semibold text-[var(--fc-text-primary)]">
                      {driver.firstName} {driver.lastName}
                    </p>
                    <p className="truncate text-xs text-[var(--fc-text-secondary)]">{driver.phoneNumber}</p>
                  </div>
                  {driver.rating ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-[var(--fc-warning)]">
                      <Icon name="star" size={14} />
                      {driver.rating}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )
        ) : (
          <>
            {addingLocation ? (
              <div className="flex flex-col gap-3 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('favourites.locationName', locale)}</label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('favourites.address', locale)}</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">Lat</label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">Lng</label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
                    />
                  </div>
                </div>
                <Button block onClick={() => void submitLocation()} disabled={!locationName.trim() || !latitude.trim() || !longitude.trim()}>
                  {t('favourites.save', locale)}
                </Button>
              </div>
            ) : null}

            {favourites.loading ? (
              <div className="flex justify-center py-6">
                <Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" />
              </div>
            ) : favourites.locations.length === 0 ? (
              <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-8 text-center">
                <Icon name="star" size={32} className="mx-auto mb-2 text-[var(--fc-text-secondary)]" />
                <p className="text-sm text-[var(--fc-text-secondary)]">{t('favourites.noLocations', locale)}</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {favourites.locations.map((location) => (
                  <li key={location.id} className="flex items-center justify-between rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--fc-primary-soft)] text-[var(--fc-primary)]">
                      <Icon name="loc" size={18} />
                    </span>
                    <div className="min-w-0 flex-1 px-3">
                      <p className="truncate text-sm font-semibold text-[var(--fc-text-primary)]">{location.locationName}</p>
                      <p className="truncate text-xs text-[var(--fc-text-secondary)]">{location.address}</p>
                    </div>
                    <Button
                      variant="ghost"
                      icon="trash"
                      onClick={() => void removeLocation(location.id)}
                      aria-label={t('favourites.remove', locale)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}