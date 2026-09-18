'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCountries } from '@fixcycle/api-client';
import type { CountryOption } from '@fixcycle/config';
import { getCountries } from '@fixcycle/config';

import { api } from '@/lib/api';
import { useRuntime } from '@/lib/runtime-context';
import { FlagImage } from '@/components/flags/flag-image';
import { CountrySheet } from './country-sheet';

export interface UseCountriesResult {
  countries: CountryOption[];
  loading: boolean;
}

export function useCountries(): UseCountriesResult {
  const { runtime } = useRuntime();
  const cached = useMemo(() => getCountries(runtime), [runtime]);
  const [countries, setCountries] = useState<CountryOption[]>(cached);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cached.length > 0) {
      setCountries(cached);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchCountries(api)
      .then((list) => {
        if (!cancelled) {
          setCountries(list);
        }
      })
      .catch(() => {
        // fall back to an empty list; the country picker still works
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [cached]);

  return { countries, loading };
}

export interface PhoneFieldProps {
  label: string;
  country: CountryOption | null;
  value: string;
  onValueChange: (value: string) => void;
  onCountryChange: (country: CountryOption) => void;
  error?: string;
  autoComplete?: string;
  autoFocus?: boolean;
}

export function PhoneField({
  label,
  country,
  value,
  onValueChange,
  onCountryChange,
  error,
  autoComplete,
  autoFocus,
}: PhoneFieldProps): React.ReactNode {
  const { loading, countries } = useCountries();
  const [open, setOpen] = useState(false);

  const defaultCountry = countries[0] ?? null;

  useEffect(() => {
    if (!country && defaultCountry) {
      onCountryChange(defaultCountry);
    }
  }, [country, defaultCountry, onCountryChange]);

  const selectCountry = useCallback(
    (selected: CountryOption) => {
      onCountryChange(selected);
    },
    [onCountryChange],
  );

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[var(--fc-text-secondary)]">{label}</label>
      <div
        className={`flex min-h-[48px] items-center rounded-[var(--fc-radius-md)] border bg-[var(--fc-surface)] transition-colors ${
          error ? 'border-[var(--fc-danger)]' : 'border-[var(--fc-border)] focus-within:border-[var(--fc-bg-secondary)]'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-full shrink-0 items-center gap-1.5 self-stretch border-r border-[var(--fc-border)] px-3 text-sm font-semibold text-[var(--fc-text-primary)]"
        >
          <FlagImage countryCode={country?.country_code} countryName={country?.name} size={20} />
          <span>+{country?.phonecode ?? '···'}</span>
          <svg
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="text-[var(--fc-text-secondary)]"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <input
          type="tel"
          inputMode="tel"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="0000 0000"
          autoComplete={autoComplete ?? 'tel-national'}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          className="min-h-[46px] w-full bg-transparent px-3 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
        />
      </div>
      {error ? (
        <p className="text-xs text-[var(--fc-danger)]" role="alert">
          {error}
        </p>
      ) : null}
      <CountrySheet
        open={open}
        countries={countries}
        loading={loading}
        selectedId={country?.id}
        onSelect={selectCountry}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}