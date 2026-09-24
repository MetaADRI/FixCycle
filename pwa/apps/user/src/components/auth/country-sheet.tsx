'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { CountryOption } from '@fixcycle/config';
import { Icon, IconButton, Spinner } from '@fixcycle/ui';

import { t } from '@/lib/i18n';
import { FlagImage } from '@/components/flags/flag-image';

export interface CountrySheetProps {
  open: boolean;
  countries: CountryOption[];
  loading?: boolean;
  selectedId?: number;
  onSelect: (country: CountryOption) => void;
  onClose: () => void;
  locale?: string;
}

export function CountrySheet({
  open,
  countries,
  loading = false,
  selectedId,
  onSelect,
  onClose,
  locale = 'en',
}: CountrySheetProps): ReactNode {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) {
      setQuery('');
    }
  }, [open]);

  const filtered = useMemo(() => {
    const raw = query.trim().toLowerCase();
    if (raw.length === 0) {
      return countries;
    }
    const needle = raw;
    const needleDigits = needle.replace(/[^0-9]/g, '');
    return countries.filter((country) => {
      return (
        (country.name ?? '').toLowerCase().includes(needle) ||
        country.country_code.toLowerCase().includes(needle) ||
        (country.isoCode ?? '').toLowerCase().includes(needle) ||
        (needleDigits.length > 0 &&
          country.phonecode.replace(/[^0-9]/g, '').includes(needleDigits))
      );
    });
  }, [countries, query]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-[var(--fc-overlay)]"
        onClick={onClose}
      />
      <div className="relative z-10 mx-auto flex max-h-[72dvh] w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col rounded-t-[1.5rem] bg-[var(--fc-surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--fc-border)] px-4 py-3">
          <h2 className="text-base font-bold text-[var(--fc-text-primary)]">{t('auth.phoneCode', locale)}</h2>
          <IconButton icon="close" label="Close" size={20} onClick={onClose} />
        </div>
        <div className="px-4 py-2">
          <div className="flex min-h-[44px] items-center gap-2 rounded-[var(--fc-radius-md)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3">
            <Icon name="search" size={18} className="text-[var(--fc-text-secondary)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('auth.searchCountry', locale)}
              className="w-full bg-transparent text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--fc-text-secondary)]">
              <Spinner className="h-4 w-4" />
              <span>{t('common.loading', locale)}</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--fc-text-secondary)]">
              {t('common.retry', locale)}
            </p>
          ) : (
            filtered.map((country) => {
              const label = country.name && country.name.length > 0 ? country.name : country.country_code;
              const isSelected = selectedId === country.id;
              return (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => {
                    onSelect(country);
                    onClose();
                  }}
                  className={`flex w-full items-center gap-3 rounded-[var(--fc-radius-sm)] px-3 py-3 text-left ${
                    isSelected ? 'bg-[var(--fc-surface-raised)]' : ''
                  }`}
                >
                  <FlagImage countryCode={country.country_code} countryName={country.name} size={24} />
                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--fc-text-primary)]">{label}</span>
                  <span className="shrink-0 text-sm font-semibold text-[var(--fc-text-secondary)]">
                    +{country.phonecode}
                  </span>
                  {isSelected ? <Icon name="check" size={16} className="shrink-0 text-[var(--fc-bg-secondary)]" /> : null}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}