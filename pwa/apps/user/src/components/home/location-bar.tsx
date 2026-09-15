'use client';

import type { ReactNode } from 'react';

import { Icon } from '@fixcycle/ui';

import type { SelectedLocation } from './location-picker';

export interface LocationBarProps {
  location: SelectedLocation;
  onOpenPicker: () => void;
  onOpenNotifications: () => void;
  hasNotifications?: boolean;
  locale?: string;
}

export function LocationBar({
  location,
  onOpenPicker,
  onOpenNotifications,
  hasNotifications = false,
}: LocationBarProps): ReactNode {
  return (
    <div className="flex h-14 items-center justify-between gap-2 border-b border-[var(--fc-border)] bg-[var(--fc-surface)] px-2">
      <button
        type="button"
        onClick={onOpenPicker}
        className="flex min-w-0 min-h-[44px] flex-1 items-center gap-2 rounded-[var(--fc-radius-md)] px-2 text-left active:bg-[var(--fc-surface-raised)]"
        aria-label="Change location"
      >
        <Icon name="loc" size={20} className="shrink-0 text-[var(--fc-bg-secondary)]" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] uppercase tracking-wide text-[var(--fc-text-secondary)]">Location</span>
          <span className="block truncate text-sm font-bold text-[var(--fc-text-primary)]">
            {location.label || '—'}
          </span>
        </span>
        <Icon name="chevron" size={18} className="shrink-0 text-[var(--fc-text-secondary)]" />
      </button>

      <button
        type="button"
        onClick={onOpenNotifications}
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--fc-text-primary)] active:bg-[var(--fc-surface-raised)]"
        aria-label="Notifications"
      >
        <Icon name="bell" size={22} />
        {hasNotifications ? (
          <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[var(--fc-bg-secondary)] ring-2 ring-[var(--fc-surface)]" />
        ) : null}
      </button>
    </div>
  );
}
