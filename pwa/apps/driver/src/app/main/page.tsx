'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { AppShell, Button, Icon, Spinner, TopHeader } from '@fixcycle/ui';
import { fetchDriverMainScreenConfig } from '@fixcycle/api-client';
import type { DriverStepHolder } from '@fixcycle/api-client';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useDriverSession } from '@/lib/session';
import { useDriver } from '@/lib/driver-context';
import { api } from '@/lib/api';
import { IncomingRequest } from '@/components/incoming-request';
import { OnlinePreferences } from '@/components/online-preferences';
import { StepCard } from '@/components/step-card';

export default function MainPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const { status, profile, signOut } = useDriverSession();
  const { online, setOnline, incoming, activeTrip, acceptIncoming, declineIncoming, location, soundEnabled, toggleSound, scheduleNextIncoming } = useDriver();
  const [steps, setSteps] = useState<DriverStepHolder[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(true);
  const [onlineTime, setOnlineTime] = useState<Date | null>(null);

  // Redirect if not approved
  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/login');
    } else if (status !== 'booting' && profile && profile.signupStep < 8) {
      router.replace('/on-board');
    } else if (status !== 'booting' && profile && profile.signupStep === 8) {
      router.replace('/pending-approval');
    }
  }, [status, profile, router]);

  // Load main-screen-config
  const loadConfig = useCallback(async (): Promise<void> => {
    setLoadingSteps(true);
    try {
      const config = await fetchDriverMainScreenConfig(api);
      setSteps(config.configuration);
    } catch {
      // gate is non-blocking
    } finally {
      setLoadingSteps(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  // Schedule next simulated incoming after decline (context auto-schedules too)
  useEffect(() => {
    if (online && !activeTrip && !incoming) {
      scheduleNextIncoming(8000);
    }
  }, [online, activeTrip, incoming, scheduleNextIncoming]);

  const handleGoOnline = useCallback(async (): Promise<void> => {
    await setOnline(true);
    setOnlineTime(new Date());
  }, [setOnline]);

  const handleGoOffline = useCallback(async (): Promise<void> => {
    await setOnline(false);
    setOnlineTime(null);
  }, [setOnline]);

  const handleAccept = useCallback(async (): Promise<void> => {
    if (!incoming) return;
    await acceptIncoming(incoming);
    router.push(`/trip/${incoming.bookingOrderId}`);
  }, [incoming, acceptIncoming, router]);

  const handleDecline = useCallback(async (): Promise<void> => {
    if (!incoming) return;
    await declineIncoming(incoming);
  }, [incoming, declineIncoming]);

  const incompleteSteps = steps.filter((s) => s.stepStatus !== 5);
  const firstName = profile?.firstName || 'Driver';

  return (
    <AppShell
      header={
        <TopHeader
          title={t('main.title', runtime.locale)}
          trailing={
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--fc-text-secondary)]"
              aria-label="Sign out"
            >
              <Icon name="logout" size={20} />
            </button>
          }
        />
      }
    >
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-sm text-[var(--fc-text-secondary)]">Hello,</p>
        <h2 className="text-xl font-extrabold text-[var(--fc-text-primary)]">{firstName}</h2>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-[var(--fc-surface-raised)] p-3 text-center">
          <p className="text-lg font-bold text-[var(--fc-bg-secondary)]">₹0</p>
          <p className="text-[10px] text-[var(--fc-text-secondary)]">{t('main.earnedToday', runtime.locale)}</p>
        </div>
        <div className="rounded-2xl bg-[var(--fc-surface-raised)] p-3 text-center">
          <p className="text-lg font-bold text-[var(--fc-text-primary)]">0</p>
          <p className="text-[10px] text-[var(--fc-text-secondary)]">{t('main.tripsToday', runtime.locale)}</p>
        </div>
        <div className="rounded-2xl bg-[var(--fc-surface-raised)] p-3 text-center">
          <p className="text-lg font-bold text-[var(--fc-text-primary)]">{profile?.rating ?? '—'}</p>
          <p className="text-[10px] text-[var(--fc-text-secondary)]">{t('main.rating', runtime.locale)}</p>
        </div>
      </div>

      {/* Online toggle */}
      <div className="mb-6 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[var(--fc-text-primary)]">
              {online ? t('main.goOnline', runtime.locale) : t('main.goOffline', runtime.locale)}
            </p>
            {online && onlineTime ? (
              <p className="mt-1 text-xs text-[var(--fc-text-secondary)]">
                {t('main.onlineSince', runtime.locale)} {onlineTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            ) : !online ? (
              <p className="mt-1 text-xs text-[var(--fc-text-secondary)]">{t('main.offlineNote', runtime.locale)}</p>
            ) : null}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={online}
            onClick={() => void (online ? handleGoOffline() : handleGoOnline())}
            className={`relative h-12 w-14 rounded-full transition-colors ${online ? 'bg-[var(--fc-success)]' : 'bg-[var(--fc-border)]'}`}
          >
            <span
              className={`absolute top-1 h-10 w-10 rounded-full bg-white shadow-md transition-transform ${online ? 'translate-x-3 left-0' : 'left-1'}`}
            />
          </button>
        </div>
        {online ? (
          <p className="mt-3 text-xs text-[var(--fc-text-secondary)]">
            <Icon name="loc" size={12} className="mr-1 inline text-[var(--fc-success)]" />
            {t('main.locationNote', runtime.locale)}
            {location ? ` — ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : ''}
          </p>
        ) : null}
      </div>

      {/* Waiting state when online + no trip */}
      {online && !activeTrip && !incoming ? (
        <div className="mb-6 flex flex-col items-center rounded-2xl bg-[var(--fc-surface-raised)] py-8">
          <Spinner className="mb-3 h-6 w-6 text-[var(--fc-bg-secondary)]" />
          <p className="text-sm font-medium text-[var(--fc-text-secondary)]">{t('main.waiting', runtime.locale)}</p>
        </div>
      ) : null}

      {/* Active trip card */}
      {activeTrip ? (
        <button
          type="button"
          onClick={() => router.push(`/trip/${activeTrip.bookingOrderId}`)}
          className="mb-6 w-full rounded-2xl border border-[var(--fc-success)]/30 bg-[var(--fc-success)]/5 p-4 text-left"
        >
          <div className="mb-2 flex items-center gap-2">
            <Icon name="taxi" size={18} className="text-[var(--fc-success)]" />
            <span className="text-sm font-bold text-[var(--fc-success)]">{activeTrip.segmentName} — Active trip</span>
          </div>
          <p className="text-sm text-[var(--fc-text-primary)]">{activeTrip.pickupAddress}</p>
          <p className="text-xs text-[var(--fc-text-secondary)]">→ {activeTrip.dropAddress}</p>
        </button>
      ) : null}

      {/* Incomplete steps */}
      {incompleteSteps.length > 0 && !loadingSteps ? (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-bold text-[var(--fc-text-primary)]">
            {t('main.completeSteps', runtime.locale)}
          </h3>
          <p className="mb-3 text-xs text-[var(--fc-text-secondary)]">
            {t('main.completeStepsDesc', runtime.locale)}
          </p>
          <div className="space-y-2">
            {incompleteSteps.slice(0, 3).map((step) => (
              <StepCard key={step.stepType} step={step} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Preferences */}
      <OnlinePreferences />

      {/* Sound toggle */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
        <span className="flex items-center gap-2 text-sm text-[var(--fc-text-primary)]">
          <Icon name="bell" size={16} className="text-[var(--fc-text-secondary)]" />
          {t('main.voiceAlert', runtime.locale)}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={soundEnabled}
          onClick={toggleSound}
          className={`relative h-6 w-11 rounded-full transition-colors ${soundEnabled ? 'bg-[var(--fc-bg-secondary)]' : 'bg-[var(--fc-border)]'}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${soundEnabled ? 'translate-x-5.5 left-0' : 'left-0.5'}`}
          />
        </button>
      </div>

      {/* Driver tools */}
      <div className="mt-4">
        <h3 className="mb-3 text-sm font-bold text-[var(--fc-text-primary)]">{t('main.tools', runtime.locale)}</h3>
        <div className="grid grid-cols-5 gap-2">
          {[
            { href: '/documents', icon: 'document' as const, label: t('documents.title', runtime.locale) },
            { href: '/vehicles', icon: 'taxi' as const, label: t('vehicles.title', runtime.locale) },
            { href: '/segments', icon: 'grid' as const, label: t('segments.title', runtime.locale) },
            { href: '/earnings', icon: 'wallet' as const, label: t('earnings.title', runtime.locale) },
            { href: '/subscriptions', icon: 'promo' as const, label: t('subscriptions.title', runtime.locale) },
          ].map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-[var(--fc-surface-raised)] py-3 text-center transition-colors"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--fc-bg-secondary)]/10 text-[var(--fc-bg-secondary)]">
                <Icon name={item.icon} size={18} />
              </span>
              <span className="text-[10px] leading-tight text-[var(--fc-text-secondary)]">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom spacer for safe area */}
      <div className="h-8" />

      {incoming ? (
        <IncomingRequest
          booking={incoming}
          driverLocation={location}
          onAccept={() => void handleAccept()}
          onDecline={() => void handleDecline()}
        />
      ) : null}
    </AppShell>
  );
}