'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { fetchAreas, searchPlaces } from '@fixcycle/api-client';
import type { AreaOption, PlaceOption, PlaceSearchResult } from '@fixcycle/api-client';
import { Icon, IconButton, Spinner } from '@fixcycle/ui';

import { api } from '@/lib/api';
import { t } from '@/lib/i18n';

export interface SelectedLocation {
  label: string;
  latitude?: number;
  longitude?: number;
  areaId?: string;
}

export interface LocationPickerProps {
  open: boolean;
  selected: SelectedLocation;
  onSelect: (location: SelectedLocation) => void;
  onClose: () => void;
  locale?: string;
}

type Tab = 'search' | 'areas';

function flattenPlaces(results: PlaceSearchResult[]): PlaceOption[] {
  return results.flatMap((group) => group.places);
}

function parseCoordinate(value: string | number | undefined): number | undefined {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function LocationPicker({
  open,
  selected,
  onSelect,
  onClose,
  locale = 'en',
}: LocationPickerProps): ReactNode {
  const [tab, setTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<PlaceOption[]>([]);
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setPlaces([]);
      setAreas([]);
      setSearching(false);
      setLoadingAreas(false);
      setSearched(false);
      setTab('search');
      void loadAreas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function loadAreas(): Promise<void> {
    setLoadingAreas(true);
    try {
      setAreas(await fetchAreas(api));
    } catch {
      setAreas([]);
    } finally {
      setLoadingAreas(false);
    }
  }

  useEffect(() => {
    if (tab !== 'search') {
      return;
    }
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    const needle = query.trim();
    if (needle.length < 2) {
      setPlaces([]);
      setSearched(false);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      void runSearch(needle);
    }, 400);
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tab]);

  async function runSearch(keyword: string): Promise<void> {
    setSearching(true);
    setSearched(true);
    try {
      const results = await searchPlaces(api, {
        keyword,
        location: `${selected.latitude ?? 0},${selected.longitude ?? 0}`,
        language: locale.slice(0, 2),
      });
      setPlaces(flattenPlaces(results));
    } catch {
      setPlaces([]);
    } finally {
      setSearching(false);
    }
  }

  const filteredAreas = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) {
      return areas;
    }
    return areas.filter((area) => area.name.toLowerCase().includes(needle));
  }, [areas, query]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-[var(--fc-overlay)]" onClick={onClose} />
      <div className="relative z-10 mx-auto flex max-h-[80dvh] w-full max-w-[430px] flex-col rounded-t-[1.5rem] bg-[var(--fc-surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--fc-border)] px-4 py-3">
          <h2 className="text-base font-bold text-[var(--fc-text-primary)]">{t('home.location', locale)}</h2>
          <IconButton icon="close" label={t('drawer.close', locale)} size={20} onClick={onClose} />
        </div>

        <div className="px-4 py-2">
          <button
            type="button"
            onClick={() => onSelect({ ...selected, label: t('home.currentLocation', locale) })}
            className="flex w-full min-h-[44px] items-center gap-2 rounded-[var(--fc-radius-md)] bg-[var(--fc-bg-secondary)] px-3 text-sm font-semibold text-white active:opacity-90"
          >
            <Icon name="loc" size={18} />
            <span>{t('home.useCurrentLocation', locale)}</span>
          </button>
        </div>

        <div className="px-4 pb-2">
          <div className="flex min-h-[44px] items-center gap-2 rounded-[var(--fc-radius-md)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3">
            <Icon name="search" size={18} className="text-[var(--fc-text-secondary)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('home.searchPlaceholder', locale)}
              className="w-full bg-transparent text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
            />
          </div>
        </div>

        <div className="flex gap-1 border-b border-[var(--fc-border)] px-4 pb-2">
          <TabButton active={tab === 'search'} onClick={() => setTab('search')} label={t('home.searchPlaces', locale)} />
          <TabButton active={tab === 'areas'} onClick={() => setTab('areas')} label={t('home.chooseArea', locale)} />
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {tab === 'search' ? (
            <>
              {searching ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--fc-text-secondary)]">
                  <Spinner className="h-4 w-4" />
                  <span>{t('common.loading', locale)}</span>
                </div>
              ) : searched && places.length === 0 ? (
                <p className="py-10 text-center text-sm text-[var(--fc-text-secondary)]">
                  {t('home.noResults', locale)}
                </p>
              ) : (
                places.map((place, index) => (
                  <button
                    key={place.placeId ?? `${place.mainText}-${index}`}
                    type="button"
                    onClick={() => {
                      onSelect({
                        label: place.mainText || place.description || '',
                        latitude: parseCoordinate(place.latitude),
                        longitude: parseCoordinate(place.longitude),
                      });
                      onClose();
                    }}
                    className="flex w-full items-center gap-3 rounded-[var(--fc-radius-sm)] px-3 py-3 text-left active:bg-[var(--fc-surface-raised)]"
                  >
                    <Icon name="dest" size={18} className="shrink-0 text-[var(--fc-text-secondary)]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-[var(--fc-text-primary)]">{place.mainText}</span>
                      {place.secondaryText ? (
                        <span className="block truncate text-xs text-[var(--fc-text-secondary)]">
                          {place.secondaryText}
                        </span>
                      ) : null}
                    </span>
                  </button>
                ))
              )}
            </>
          ) : (
            <>
              {loadingAreas ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--fc-text-secondary)]">
                  <Spinner className="h-4 w-4" />
                  <span>{t('common.loading', locale)}</span>
                </div>
              ) : filteredAreas.length === 0 ? (
                <p className="py-10 text-center text-sm text-[var(--fc-text-secondary)]">
                  {t('home.noResults', locale)}
                </p>
              ) : (
                filteredAreas.map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => {
                      onSelect({
                        label: area.name,
                        areaId: area.id,
                        latitude: area.latitude,
                        longitude: area.longitude,
                      });
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-[var(--fc-radius-sm)] px-3 py-3 text-left ${
                      selected.areaId === area.id ? 'bg-[var(--fc-surface-raised)]' : ''
                    }`}
                  >
                    <Icon name="loc" size={18} className="shrink-0 text-[var(--fc-text-secondary)]" />
                    <span className="min-w-0 flex-1 truncate text-sm text-[var(--fc-text-primary)]">{area.name}</span>
                    {selected.areaId === area.id ? (
                      <Icon name="check" size={16} className="shrink-0 text-[var(--fc-bg-secondary)]" />
                    ) : null}
                  </button>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[36px] rounded-full px-4 text-sm font-semibold transition-colors ${
        active
          ? 'bg-[var(--fc-bg-secondary)] text-white'
          : 'bg-transparent text-[var(--fc-text-secondary)] active:bg-[var(--fc-surface-raised)]'
      }`}
    >
      {label}
    </button>
  );
}
