'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { fetchMainScreen } from '@fixcycle/api-client';
import type { BannerCellItem, BusinessSegmentItem, MainScreenCell, MainScreenCellItem, ServiceCellItem } from '@fixcycle/api-client';
import { ErrorState, Icon } from '@fixcycle/ui';
import type { MainScreenResult } from '@fixcycle/api-client';

import { api } from '@/lib/api';
import { t } from '@/lib/i18n';

import { EmptyHomeIllustration } from './illustrations';
import { HolderRenderer } from './holder-renderer';
import type { HolderRendererContext } from './holder-renderer';
import { HomeSkeleton } from './skeletons';

const CACHE_KEY = 'fixcycle:home:v1';

export interface VisibleLocation {
  label: string;
  latitude?: number;
  longitude?: number;
  areaId?: string;
}

export interface MainScreenProps {
  location: VisibleLocation;
  walletBalance?: string;
  currency: string;
  online: boolean;
  onOpenLocation: () => void;
  onBanner: (banner: BannerCellItem) => void;
  onService: (service: ServiceCellItem) => void;
  onBusiness: (item: BusinessSegmentItem) => void;
  onAddMoney: () => void;
  onGeneric: (cell: MainScreenCell, item: MainScreenCellItem | undefined) => void;
  locale?: string;
}

interface CacheEntry {
  cells: MainScreenCell[];
  savedAt: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readCachedHome(): CacheEntry | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || !Array.isArray(parsed['cells'])) {
      return null;
    }
    return { cells: parsed['cells'] as MainScreenCell[], savedAt: Number(parsed['savedAt']) || 0 };
  } catch {
    return null;
  }
}

export function MainScreen({
  location,
  walletBalance,
  currency,
  online,
  onOpenLocation,
  onBanner,
  onService,
  onBusiness,
  onAddMoney,
  onGeneric,
  locale = 'en',
}: MainScreenProps): ReactNode {
  const [result, setResult] = useState<MainScreenResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const [pullAmount, setPullAmount] = useState(0);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const fetchSeq = useRef(0);

  const hasCoords = location.latitude !== undefined && location.longitude !== undefined;

  const load = useCallback(
    async (showSpinner: boolean, seq: number): Promise<void> => {
      if (!hasCoords) {
        if (seq === fetchSeq.current) {
          setLoading(false);
          setError(null);
          setResult(null);
        }
        return;
      }
      if (showSpinner) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      try {
        const fresh = await fetchMainScreen(api, {
          latitude: location.latitude as number,
          longitude: location.longitude as number,
          area: location.areaId,
        });
        if (seq !== fetchSeq.current) {
          return;
        }
        setResult(fresh);
        setUsingCache(false);
        try {
          window.localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ cells: fresh.cells, savedAt: Date.now() }),
          );
        } catch {
          // ignore quota errors
        }
      } catch {
        if (seq !== fetchSeq.current) {
          return;
        }
        const cached = readCachedHome();
        if (cached && cached.cells.length > 0) {
          setResult({ cells: cached.cells, raw: null });
          setUsingCache(true);
        } else {
          setError(t('home.loadFailed', locale));
        }
      } finally {
        if (seq === fetchSeq.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [hasCoords, location.latitude, location.longitude, location.areaId, locale],
  );

  useEffect(() => {
    const seq = ++fetchSeq.current;
    setResult(null);
    void load(true, seq);
    return () => {
      if (seq === fetchSeq.current) {
        fetchSeq.current += 1;
      }
    };
  }, [location.latitude, location.longitude, location.areaId, load]);

  // Touch-based pull to refresh.
  function onTouchStart(event: React.TouchEvent): void {
    if (window.scrollY <= 0) {
      startY.current = event.touches[0]?.clientY ?? null;
      pulling.current = true;
    }
  }
  function onTouchMove(event: React.TouchEvent): void {
    if (!pulling.current || startY.current == null) {
      return;
    }
    const delta = (event.touches[0]?.clientY ?? startY.current) - startY.current;
    if (delta > 0) {
      setPullAmount(Math.min(delta, 96));
    }
  }
  function onTouchEnd(): void {
    if (pulling.current) {
      if (pullAmount >= 72) {
        void load(false, ++fetchSeq.current);
      }
      setPullAmount(0);
      pulling.current = false;
      startY.current = null;
    }
  }

  // No coordinates yet — prompt the user to pick a location.
  if (!hasCoords) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
        {!online ? (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--fc-warning)]/10 text-[var(--fc-warning)]">
            <Icon name="wifi-off" size={26} />
          </span>
        ) : (
          <EmptyHomeIllustration className="h-36 w-36" />
        )}
        <h2 className="text-base font-bold text-[var(--fc-text-primary)]">{t('home.noServiceTitle', locale)}</h2>
        <p className="max-w-xs text-sm text-[var(--fc-text-secondary)]">{t('home.noServiceMessage', locale)}</p>
        <button
          type="button"
          onClick={onOpenLocation}
          className="mt-2 min-h-[44px] rounded-[var(--fc-radius-md)] bg-[var(--fc-bg-secondary)] px-6 text-sm font-semibold text-white active:opacity-90"
        >
          {t('home.noServiceAction', locale)}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        {pullAmount > 0 ? <RefreshIndicator amount={pullAmount} locale={locale} /> : null}
        <HomeSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        {pullAmount > 0 ? <RefreshIndicator amount={pullAmount} locale={locale} /> : null}
        <ErrorState title={error} onRetry={() => void load(true, ++fetchSeq.current)} retryLabel={t('common.retry', locale)} />
      </div>
    );
  }

  const cells = result?.cells ?? [];
  const empty = cells.length === 0;

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {pullAmount > 0 ? <RefreshIndicator amount={pullAmount} locale={locale} /> : null}
      {refreshing ? (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-[var(--fc-text-secondary)]">
          <Icon name="refresh" size={14} className="animate-spin" />
          <span>{t('home.pullToRefresh', locale)}</span>
        </div>
      ) : null}
      {usingCache ? (
        <div className="flex items-center gap-1.5 px-4 py-2 text-xs text-[var(--fc-warning)]">
          <Icon name="wifi-off" size={14} />
          <span>{t('home.offlineCache', locale)}</span>
        </div>
      ) : null}

      {empty ? (
        <EmptyHome locale={locale} />
      ) : (
        <div className="flex flex-col gap-6 px-4 pb-6 pt-4">
          {cells.map((cell, index) => {
            const ctx: HolderRendererContext = {
              locale,
              currency,
              walletBalance,
              onBanner,
              onService,
              onBusiness,
              onAddMoney,
              onGeneric,
            };
            return <HolderRenderer key={`${cell.title}-${index}`} cell={cell} ctx={ctx} />;
          })}
        </div>
      )}
    </div>
  );
}

function RefreshIndicator({ amount, locale }: { amount: number; locale: string }): ReactNode {
  void locale;
  return (
    <div
      className="flex items-center justify-center"
      style={{ height: `${32 + amount}px` }}
    >
      <Icon
        name="refresh"
        size={18}
        className="text-[var(--fc-text-secondary)]"
        style={{ transform: `rotate(${amount}deg)` }}
      />
    </div>
  );
}

function EmptyHome({ locale }: { locale: string }): ReactNode {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <EmptyHomeIllustration className="h-36 w-36" />
      <h2 className="text-base font-bold text-[var(--fc-text-primary)]">{t('home.empty', locale)}</h2>
      <p className="max-w-xs text-sm text-[var(--fc-text-secondary)]">{t('home.emptyMessage', locale)}</p>
    </div>
  );
}
