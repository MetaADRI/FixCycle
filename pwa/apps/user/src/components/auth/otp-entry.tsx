'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '@fixcycle/ui';

import { t } from '@/lib/i18n';

export interface OtpEntryProps {
  label: string;
  hint: string;
  value: string;
  maxLength: number;
  onValueChange: (value: string) => void;
  resendLockMs: number;
  onResend: () => void;
  onEditNumber?: () => void;
  editNumberLabel?: string;
  error?: string;
  autoFocus?: boolean;
  locale?: string;
  resendLoading?: boolean;
}

export function OtpEntry({
  label,
  hint,
  value,
  maxLength,
  onValueChange,
  resendLockMs,
  onResend,
  onEditNumber,
  editNumberLabel,
  error,
  autoFocus,
  locale = 'en',
  resendLoading = false,
}: OtpEntryProps): ReactNode {
  const [remainingMs, setRemainingMs] = useState(resendLockMs);

  useEffect(() => {
    setRemainingMs(resendLockMs);
  }, [resendLockMs]);

  useEffect(() => {
    if (remainingMs <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setRemainingMs((current) => Math.max(0, current - 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remainingMs]);

  const locked = remainingMs > 0;
  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="otp" className="text-xs font-semibold text-[var(--fc-text-secondary)]">
          {label}
        </label>
        <input
          id="otp"
          type="text"
          inputMode="numeric"
          value={value}
          maxLength={maxLength}
          autoFocus={autoFocus}
          placeholder="0000"
          onChange={(event) => onValueChange(event.target.value.replace(/\D/g, '').slice(0, maxLength))}
          aria-invalid={error ? true : undefined}
          className={`min-h-[52px] w-full rounded-[var(--fc-radius-md)] border bg-[var(--fc-surface)] px-4 text-center text-xl font-bold tracking-[0.35em] text-[var(--fc-text-primary)] outline-none ${
            error ? 'border-[var(--fc-danger)]' : 'border-[var(--fc-border)] focus:border-[var(--fc-bg-secondary)]'
          }`}
        />
        {error ? (
          <p className="text-xs text-[var(--fc-danger)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <p className="px-1 text-xs leading-relaxed text-[var(--fc-text-secondary)]">{hint}</p>

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" className="px-2 text-xs" disabled={locked || resendLoading} onClick={onResend}>
          <span className="inline-flex items-center gap-1">
            {t('auth.resendCode', locale)}
            {locked ? (
              <span className="text-[var(--fc-text-secondary)]">
                {seconds} {t('common.seconds', locale)}
              </span>
            ) : null}
          </span>
        </Button>
        {onEditNumber ? (
          <button
            type="button"
            onClick={onEditNumber}
            className="text-xs font-semibold text-[var(--fc-bg-secondary)]"
          >
            {editNumberLabel ?? t('auth.changeNumber', locale)}
          </button>
        ) : null}
      </div>
    </div>
  );
}