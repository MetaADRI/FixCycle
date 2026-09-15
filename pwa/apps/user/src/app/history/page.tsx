'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { AppShell, Icon, IconButton, Spinner, StatusPill, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { useHistory, type HistoryScope, type HistoryTab } from '@/lib/history/use-history';
import { useRuntime } from '@/lib/runtime-context';
import { useAuth } from '@/lib/session';
import { t, type TranslationKey } from '@/lib/i18n';

const SCOPES: { key: HistoryScope; labelKey: 'history.ride' | 'history.delivery' | 'history.all' }[] = [
  { key: 'ride', labelKey: 'history.ride' },
  { key: 'delivery', labelKey: 'history.delivery' },
  { key: 'all', labelKey: 'history.all' },
];

const TABS: { key: HistoryTab; labelKey: TranslationKey }[] = [
  { key: 'recent', labelKey: 'history.recent' },
  { key: 'active', labelKey: 'history.active' },
  { key: 'past', labelKey: 'history.past' },
];

function statusTone(status: number): 'success' | 'warning' | 'neutral' {
  if (status === 4) return 'success';
  if (status === 2 || status === 3) return 'warning';
  return 'neutral';
}

function statusLabel(status: number, locale: string): string {
  if (status === 4) return t('history.completed', locale);
  if (status === 2) return t('history.ongoing', locale);
  if (status === 3) return t('history.arrived', locale);
  if (status === 1) return t('history.accepted', locale);
  return t('history.booked', locale);
}

export default function HistoryPage(): ReactNode {
  const { runtime } = useRuntime();
  const { status } = useAuth();
  const router = useRouter();
  const history = useHistory();
  const locale = runtime.locale;

  const [scope, setScope] = useState<HistoryScope>('all');
  const [tab, setTab] = useState<HistoryTab>('recent');

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/on-board');
    }
  }, [status, router]);

  useEffect(() => {
    if (tab === 'active') {
      void history.loadActive();
    } else {
      void history.load(scope, tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, tab]);

  if (status !== 'signedIn') {
    return null;
  }

  const items = tab === 'active' ? history.active : history.bookings;

  const activeTabClass = (active: boolean): string =>
    active
      ? 'bg-[var(--fc-bg-secondary)] text-white'
      : 'bg-[var(--fc-surface-raised)] text-[var(--fc-text-secondary)] border border-[var(--fc-border)]';

  return (
    <AppShell
      header={
        <TopHeader
          title={t('history.title', locale)}
          leading={
            <button type="button" aria-label={t('common.back', locale)} onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', locale)} />
            </button>
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {SCOPES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setScope(s.key)}
              aria-pressed={scope === s.key}
              className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${activeTabClass(scope === s.key)}`}
            >
              {t(s.labelKey, locale)}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              type="button"
              onClick={() => setTab(tb.key)}
              aria-pressed={tab === tb.key}
              className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${activeTabClass(tab === tb.key)}`}
            >
              {t(tb.labelKey, locale)}
            </button>
          ))}
        </div>

        {history.loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-8 text-center">
            <Icon name="history" size={32} className="mx-auto mb-2 text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('history.empty', locale)}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((booking) => (
              <li key={booking.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/history/${encodeURIComponent(booking.id)}`)}
                  className="flex w-full flex-col gap-2 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--fc-text-primary)]">{booking.bookingId}</span>
                      <StatusPill tone={statusTone(booking.bookingStatus)}>{statusLabel(booking.bookingStatus, locale)}</StatusPill>
                    </div>
                    {booking.amount ? <span className="text-sm font-bold text-[var(--fc-text-primary)]">{booking.amount}</span> : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[var(--fc-text-primary)]">{booking.serviceType || booking.segmentName}</p>
                    <p className="truncate text-xs text-[var(--fc-text-secondary)]">{booking.pickupAddress}</p>
                    {booking.dropAddress ? (
                      <p className="truncate text-xs text-[var(--fc-text-secondary)]">→ {booking.dropAddress}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--fc-text-secondary)]">
                    <span>{booking.bookingDate}</span>
                    {booking.driverName ? <span>@{booking.driverName}</span> : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}