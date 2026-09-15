'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { BannerCellItem, BusinessSegmentItem, MainScreenCell, MainScreenCellItem, ServiceCellItem } from '@fixcycle/api-client';
import {
  fetchNavigationDrawerConfig,
} from '@fixcycle/api-client';
import type { NavigationDrawerConfig } from '@fixcycle/api-client';
import { AppShell, Icon } from '@fixcycle/ui';
import { getCurrentPosition, requestGeolocationPermission, type GeolocationStatus } from '@fixcycle/pwa-core';

import { useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useAuth } from '@/lib/session';
import { useRuntime } from '@/lib/runtime-context';
import { api } from '@/lib/api';

import { Drawer } from '@/components/home/drawer';
import { LocationBar } from '@/components/home/location-bar';
import { LocationPicker } from '@/components/home/location-picker';
import type { SelectedLocation } from '@/components/home/location-picker';
import { MainScreen } from '@/components/home/main-screen';
import type { VisibleLocation } from '@/components/home/main-screen';

const LOCATION_STORAGE_KEY = 'fixcycle:location:v1';

export default function HomePage(): React.ReactNode {
  const { runtime } = useRuntime();
  const { status, user, signOut } = useAuth();
  const router = useRouter();
  const [location, setLocation] = useState<VisibleLocation>({ label: '' });
  const [locationReady, setLocationReady] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerConfig, setDrawerConfig] = useState<NavigationDrawerConfig | null>(null);
  const [online, setOnline] = useState(true);
  const didAskGeo = useRef(false);

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/on-board');
    }
  }, [status, router]);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onLine = (): void => setOnline(true);
    const offLine = (): void => setOnline(false);
    window.addEventListener('online', onLine);
    window.addEventListener('offline', offLine);
    return () => {
      window.removeEventListener('online', onLine);
      window.removeEventListener('offline', offLine);
    };
  }, []);

  const loadDrawer = useCallback(async (): Promise<void> => {
    try {
      setDrawerConfig(await fetchNavigationDrawerConfig(api, { requestFor: 'USER' }));
    } catch {
      setDrawerConfig(null);
    }
  }, []);

  useEffect(() => {
    void loadDrawer();
  }, [loadDrawer]);

  // Restore or ask for a location on first home view.
  useEffect(() => {
    if (status !== 'signedIn') {
      return;
    }
    let cancelled = false;
    (async () => {
      const stored = readStoredLocation();
      if (stored) {
        if (!cancelled) {
          setLocation(stored);
          setLocationReady(true);
        }
        return;
      }
      if (didAskGeo.current) {
        return;
      }
      didAskGeo.current = true;
      let geoStatus: GeolocationStatus;
      try {
        const granted = await requestGeolocationPermission();
        geoStatus = granted;
        if (granted.granted) {
          const coords = await getCurrentPosition({ timeoutMs: 8000 });
          if (!cancelled) {
            const next: VisibleLocation = {
              label: '',
              latitude: coords.latitude,
              longitude: coords.longitude,
            };
            setLocation(next);
            setLocationReady(true);
            writeStoredLocation(next);
          }
          return;
        }
      } catch {
        geoStatus = { granted: false, reason: 'unavailable' };
      }
      // Denied / unavailable → manual city/area picker.
      if (geoStatus && !geoStatus.granted && !cancelled) {
        setLocationReady(true);
        setPickerOpen(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleSelectLocation = useCallback((next: SelectedLocation): void => {
    const visible: VisibleLocation = {
      label: next.label,
      latitude: next.latitude,
      longitude: next.longitude,
      areaId: next.areaId,
    };
    setLocation(visible);
    writeStoredLocation(visible);
  }, []);

  // Navigation handlers.
  const goBanner = useCallback(
    (banner: BannerCellItem) => {
      router.push(`/store/${encodeURIComponent(banner.businessSegmentId || banner.segmentId || banner.id)}?from=banner`);
    },
    [router],
  );
  const goService = useCallback(
    (service: ServiceCellItem) => {
      const segmentId = service.segmentId || service.id || '';
      const areaId = location.areaId ?? '';
      if (service.dynamicUrl === '/' || /(taxi|ride)$/i.test(service.slug ?? '') || /(taxi|ride)/i.test(service.title ?? '')) {
        router.push(`/ride?segment=${encodeURIComponent(segmentId)}&area=${encodeURIComponent(areaId)}`);
        return;
      }
      if (/(delivery|parcel|courier)/i.test(service.slug ?? '') || /(delivery|parcel|courier)/i.test(service.title ?? '')) {
        router.push('/delivery');
        return;
      }
      if (/(food)/i.test(service.slug ?? '') || /(food)/i.test(service.title ?? '')) {
        router.push('/food');
        return;
      }
      if (service.segmentGroupId === 'laundry' || service.dynamicUrl === '/laundry' || /(laundry)/i.test(`${service.slug ?? ''} ${service.title ?? ''}`)) {
        router.push('/laundry');
        return;
      }
      if (service.segmentGroupId === '2' || /(handyman|plumber|salon|spa|towing)/i.test(`${service.slug ?? ''} ${service.title ?? ''}`)) {
        const rawSegmentId = typeof service.raw?.['business_segment_id'] === 'string' || typeof service.raw?.['business_segment_id'] === 'number'
          ? String(service.raw['business_segment_id'])
          : undefined;
        router.push(`/handyman/${encodeURIComponent(service.segmentId || rawSegmentId || '6')}`);
        return;
      }
      router.push(`/store/${encodeURIComponent(segmentId)}?from=service&slug=${encodeURIComponent(service.slug || service.title || '')}`);
    },
    [router, location.areaId],
  );
  const goBusiness = useCallback(
    (item: BusinessSegmentItem) => {
      const slug = item.segmentGroupId ?? item.slug ?? '';
      if (/(food)/i.test(slug) || /(restaurant)/i.test(item.title ?? '')) {
        router.push('/food');
        return;
      }
      if (/(laundry)/i.test(slug) || /(laundry)/i.test(item.title ?? '') || item.segmentId === '5') {
        router.push('/laundry');
        return;
      }
      if (/(handyman|plumber|salon|towing)/i.test(slug) || /(handyman|plumber|salon|spa|towing)/i.test(item.title ?? '')) {
        const slugMap: Record<string, string> = { handyman: '6', plumber: '7', salon: '8', towing: '9' };
        const segId = item.segmentId || slugMap[slug.toLowerCase()] || '6';
        router.push(`/handyman/${encodeURIComponent(segId)}`);
        return;
      }
      router.push(`/store/${encodeURIComponent(item.businessSegmentId || item.id)}?from=business`);
    },
    [router],
  );
  const goGeneric = useCallback(
    (_cell: MainScreenCell, _item: MainScreenCellItem | undefined) => {
      setDrawerOpen(false);
      router.push('/stub');
    },
    [router],
  );
  const goAddMoney = useCallback(() => router.push('/wallet'), [router]);
  const goNotifications = useCallback(() => router.push('/notifications'), [router]);
  const goDrawer = useCallback(() => setDrawerOpen(true), []);
  const goDrawerItem = useCallback(
    (screenName: string) => {
      setDrawerOpen(false);
      const key = screenName.toLowerCase();
      if (key.includes('wallet')) {
        router.push('/wallet');
      } else if (key.includes('notif')) {
        router.push('/notifications');
      } else if (key.includes('histor') || key.includes('booking')) {
        router.push('/history');
      } else if (key.includes('profile') || key.includes('account')) {
        router.push('/profile');
      } else if (key.includes('card')) {
        router.push('/cards');
      } else if (key.includes('sos') || key.includes('emergency')) {
        router.push('/sos');
      } else if (key.includes('favourite') || key.includes('favorite')) {
        router.push('/favourites');
      } else if (key.includes('family')) {
        router.push('/family');
      } else if (key.includes('refer')) {
        router.push('/referral');
      } else if (key.includes('reward') || key.includes('gift') || key.includes('point')) {
        router.push('/rewards');
      } else if (key.includes('subscribe') || key.includes('plan')) {
        router.push('/subscriptions');
      } else if (key.includes('chat')) {
        router.push('/chat');
      } else if (key.includes('support') || key.includes('help')) {
        router.push('/support');
      } else if (key.includes('price')) {
        router.push('/pricecard');
      } else if (key.includes('promo') || key.includes('offer')) {
        router.push('/promotions');
      } else if (key.includes('setting') || key.includes('logout')) {
        router.push('/settings');
      } else {
        router.push('/stub');
      }
    },
    [router],
  );

  if (status !== 'signedIn' || !user) {
    return (
      <AppShell padded={false}>
        <div className="flex flex-1 items-center justify-center py-12">
          <span className="text-sm text-[var(--fc-text-secondary)]">{t('common.loading', runtime.locale)}</span>
        </div>
      </AppShell>
    );
  }

  const initials = `${(user.firstName ?? '')[0] ?? ''}${(user.lastName ?? '')[0] ?? ''}`.toUpperCase() || '·';
  const displayName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || t('home.guest', runtime.locale);
  const currency = runtime.raw && 'currency' in runtime.raw && typeof (runtime.raw as Record<string, unknown>)['currency'] === 'string'
    ? ((runtime.raw as Record<string, unknown>)['currency'] as string)
    : '';

  return (
    <AppShell padded={false}>
      <LocationBar
        location={{ label: location.label || '' } as SelectedLocation}
        onOpenPicker={() => setPickerOpen(true)}
        onOpenNotifications={goNotifications}
      />

      <main className="flex-1">
        {locationReady ? (
          <MainScreen
            key={locationReady ? `${location.latitude ?? ''}:${location.longitude ?? ''}:${location.areaId ?? ''}` : 'pending'}
            location={location}
            walletBalance={user.walletBalance}
            currency={currency}
            online={online}
            onOpenLocation={() => setPickerOpen(true)}
            onBanner={goBanner}
            onService={goService}
            onBusiness={goBusiness}
            onAddMoney={goAddMoney}
            onGeneric={goGeneric}
            locale={runtime.locale}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center py-12">
            <span className="text-sm text-[var(--fc-text-secondary)]">{t('common.loading', runtime.locale)}</span>
          </div>
        )}
      </main>

      {/* Drawer toggle */}
      <button
        type="button"
        onClick={goDrawer}
        className="fixed bottom-6 left-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--fc-bg-secondary)] text-white shadow-lg active:opacity-90"
        aria-label={t('home.drawer', runtime.locale)}
      >
        <Icon name="menu" size={22} />
      </button>

      <LocationPicker
        open={pickerOpen}
        selected={{ label: location.label || '' }}
        onSelect={handleSelectLocation}
        onClose={() => setPickerOpen(false)}
        locale={runtime.locale}
      />

      <Drawer
        open={drawerOpen}
        config={drawerConfig}
        userName={displayName}
        userInitials={initials}
        onNavigate={goDrawerItem}
        onLogout={() => {
          setDrawerOpen(false);
          signOut().then(() => router.replace('/on-board'));
        }}
        onClose={() => setDrawerOpen(false)}
        locale={runtime.locale}
      />
    </AppShell>
  );
}

function readStoredLocation(): VisibleLocation | null {
  try {
    const raw = window.localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const label = typeof parsed['label'] === 'string' ? parsed['label'] : '';
    const areaId = typeof parsed['areaId'] === 'string' ? parsed['areaId'] : undefined;
    const latitude = typeof parsed['latitude'] === 'number' ? parsed['latitude'] : undefined;
    const longitude = typeof parsed['longitude'] === 'number' ? parsed['longitude'] : undefined;
    return { label, areaId, latitude, longitude };
  } catch {
    return null;
  }
}

function writeStoredLocation(location: VisibleLocation): void {
  try {
    window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch {
    // ignore quota / privacy-mode errors
  }
}
