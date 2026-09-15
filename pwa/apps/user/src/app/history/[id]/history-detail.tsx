'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { AppShell, Button, Icon, IconButton, Spinner, StatusPill, TopHeader } from '@fixcycle/ui';

import { useParams, useRouter } from 'next/navigation';

import { useHistory } from '@/lib/history/use-history';
import { useRuntime } from '@/lib/runtime-context';
import { useAuth } from '@/lib/session';
import { t } from '@/lib/i18n';

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

export function HistoryDetail(): ReactNode {
  const { runtime } = useRuntime();
  const { status } = useAuth();
  const router = useRouter();
  const history = useHistory();
  const params = useParams<{ id: string }>();
  const locale = runtime.locale;

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/on-board');
    }
  }, [status, router]);

  useEffect(() => {
    const id = params?.id;
    if (id) {
      void history.loadDetail(id).then(() => setLoaded(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  if (status !== 'signedIn') {
    return null;
  }

  const booking = history.detail?.booking;

  return (
    <AppShell
      header={
        <TopHeader
          title={t('history.bookingDetails', locale)}
          leading={
            <button type="button" aria-label={t('common.back', locale)} onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', locale)} />
            </button>
          }
        />
      }
    >
      {!loaded || !booking ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[var(--fc-text-primary)]">{booking.bookingId}</p>
                <p className="text-xs text-[var(--fc-text-secondary)]">{booking.segmentName}</p>
              </div>
              <StatusPill tone={statusTone(booking.bookingStatus)}>{statusLabel(booking.bookingStatus, locale)}</StatusPill>
            </div>
            {booking.amount ? (
              <p className="mt-3 text-2xl font-bold text-[var(--fc-text-primary)]">
                {booking.currency} {booking.amount}
              </p>
            ) : null}
            {typeof booking.rating === 'number' ? (
              <div className="mt-2 flex items-center gap-1 text-sm text-[var(--fc-warning)]">
                <Icon name="star" size={16} />
                <span>{booking.rating}</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-5">
            <div className="flex items-start gap-3">
              <Icon name="loc" size={18} className="mt-0.5 shrink-0 text-[var(--fc-primary)]" />
              <div className="min-w-0">
                <p className="text-xs text-[var(--fc-text-secondary)]">{t('history.pickup', locale)}</p>
                <p className="text-sm font-medium text-[var(--fc-text-primary)]">{booking.pickupAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Icon name="dest" size={18} className="mt-0.5 shrink-0 text-[var(--fc-primary)]" />
              <div className="min-w-0">
                <p className="text-xs text-[var(--fc-text-secondary)]">{t('history.drop', locale)}</p>
                <p className="text-sm font-medium text-[var(--fc-text-primary)]">{booking.dropAddress || '--'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <p className="text-[11px] text-[var(--fc-text-secondary)]">{t('history.driverName', locale)}</p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--fc-text-primary)]">{booking.driverName || '--'}</p>
            </div>
            <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <p className="text-[11px] text-[var(--fc-text-secondary)]">{t('history.vehicle', locale)}</p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--fc-text-primary)]">
                {booking.vehicleType || booking.vehicleNumber || '--'}
              </p>
            </div>
            <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <p className="text-[11px] text-[var(--fc-text-secondary)]">{t('history.date', locale)}</p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--fc-text-primary)]">{booking.bookingDate}</p>
            </div>
            <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <p className="text-[11px] text-[var(--fc-text-secondary)]">{t('history.status', locale)}</p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--fc-text-primary)]">{booking.bookingStatusLabel || statusLabel(booking.bookingStatus, locale)}</p>
            </div>
          </div>

          {history.detail?.sos && history.detail.sos.length > 0 ? (
            <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--fc-text-secondary)]">{t('sos.contacts', locale)}</p>
              <ul className="flex flex-col gap-2">
                {history.detail.sos.map((contact) => (
                  <li key={contact.id} className="flex items-center justify-between text-sm text-[var(--fc-text-primary)]">
                    <span>{contact.name}</span>
                    <span>{contact.number}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Button variant="secondary" icon="support" onClick={() => router.push('/support')}>
            {t('support.title', locale)}
          </Button>
        </div>
      )}
    </AppShell>
  );
}