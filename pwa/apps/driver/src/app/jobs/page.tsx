'use client';

import { useCallback, useEffect, useState } from 'react';

import { AppShell, Icon, Spinner, TopHeader, TabBar } from '@fixcycle/ui';
import { fetchDriverActiveBookings, fetchDriverPastBookings } from '@fixcycle/api-client';
import type { DriverBooking } from '@fixcycle/api-client';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { api } from '@/lib/api';
import { BookingCard } from '@/components/booking-card';

type JobsTab = 'active' | 'past';

export default function JobsPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const [tab, setTab] = useState<JobsTab>('active');
  const [activeBookings, setActiveBookings] = useState<DriverBooking[]>([]);
  const [pastBookings, setPastBookings] = useState<DriverBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const [active, past] = await Promise.all([
        fetchDriverActiveBookings(api).catch(() => []),
        fetchDriverPastBookings(api).catch(() => []),
      ]);
      setActiveBookings(active);
      setPastBookings(past);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const list = tab === 'active' ? activeBookings : pastBookings;

  return (
    <AppShell
      padded={false}
      header={<TopHeader title={t('jobs.title', runtime.locale)} />}
      footer={
        <TabBar
          items={[
            { key: 'home', label: t('main.title', runtime.locale), icon: 'grid', href: '/main' },
            { key: 'jobs', label: t('jobs.title', runtime.locale), icon: 'history', href: '/jobs', active: true },
          ]}
        />
      }
    >
      {/* Tab switch */}
      <div className="flex border-b border-[var(--fc-border)]">
        {(['active', 'past'] as const).map((t2) => (
          <button
            key={t2}
            type="button"
            onClick={() => setTab(t2)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === t2
                ? 'border-b-2 border-[var(--fc-bg-secondary)] text-[var(--fc-bg-secondary)]'
                : 'text-[var(--fc-text-secondary)]'
            }`}
          >
            {t2 === 'active' ? t('common.active', runtime.locale) : t('common.past', runtime.locale)}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 pb-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-5 w-5 text-[var(--fc-bg-secondary)]" />
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Icon name="history" size={32} className="mb-3 text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('jobs.empty', runtime.locale)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((booking) => (
              <BookingCard key={booking.bookingOrderId} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}