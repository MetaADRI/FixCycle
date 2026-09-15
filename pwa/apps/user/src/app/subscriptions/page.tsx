'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { AppShell, Button, Icon, IconButton, Spinner, StatusPill, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { useSubscriptions } from '@/lib/subscriptions/use-subscriptions';
import { useRuntime } from '@/lib/runtime-context';
import { useAuth } from '@/lib/session';
import { t } from '@/lib/i18n';

export default function SubscriptionsPage(): ReactNode {
  const { runtime } = useRuntime();
  const { status } = useAuth();
  const router = useRouter();
  const subscriptions = useSubscriptions();
  const locale = runtime.locale;

  const [activating, setActivating] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/on-board');
    }
  }, [status, router]);

  if (status !== 'signedIn') {
    return null;
  }

  const onActivate = async (pkg: { id: string; paymentMethods: { id: number; name: string }[] }) => {
    setActivating(pkg.id);
    setMessage('');
    const paymentMethodId = pkg.paymentMethods.length > 0 ? pkg.paymentMethods[0]?.id : undefined;
    const res = await subscriptions.activate({ packageId: pkg.id, paymentMethodId });
    setMessage(res.message);
    setActivating(null);
  };

  return (
    <AppShell
      header={
        <TopHeader
          title={t('subscriptions.title', locale)}
          leading={
            <button type="button" aria-label={t('common.back', locale)} onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', locale)} />
            </button>
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        {subscriptions.active ? (
          <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-primary)] bg-[var(--fc-primary-soft)] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--fc-primary)]">{t('subscriptions.active', locale)}</p>
              <StatusPill tone="success">Active</StatusPill>
            </div>
            <p className="mt-2 text-lg font-bold text-[var(--fc-text-primary)]">{subscriptions.active.title}</p>
            <p className="text-sm text-[var(--fc-text-secondary)]">
              {subscriptions.active.price} {subscriptions.active.currency} · {subscriptions.active.durationLabel}
            </p>
          </div>
        ) : null}

        {message ? (
          <div
            role="status"
            className="rounded-[var(--fc-radius-md)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)]"
          >
            {message}
          </div>
        ) : null}

        {subscriptions.loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" />
          </div>
        ) : (
          <>
            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--fc-text-secondary)]">{t('subscriptions.packages', locale)}</h2>
              <ul className="flex flex-col gap-3">
                {subscriptions.packages.map((pkg) => (
                  <li key={pkg.id} className="flex flex-col gap-3 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-base font-bold text-[var(--fc-text-primary)]">{pkg.title}</p>
                        {pkg.description ? <p className="mt-0.5 text-xs text-[var(--fc-text-secondary)]">{pkg.description}</p> : null}
                      </div>
                      <StatusPill tone={pkg.active ? 'success' : 'neutral'}>{pkg.active ? 'Active' : 'Off'}</StatusPill>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-[var(--fc-text-primary)]">
                          {pkg.price} <span className="text-sm font-medium text-[var(--fc-text-secondary)]">{pkg.currency}</span>
                        </p>
                        {pkg.durationLabel ? <p className="text-xs text-[var(--fc-text-secondary)]">{pkg.durationLabel}</p> : null}
                      </div>
                      <Button
                        icon="check"
                        loading={activating === pkg.id}
                        disabled={pkg.active}
                        onClick={() => void onActivate(pkg)}
                      >
                        {pkg.active ? t('subscriptions.active', locale) : t('subscriptions.activate', locale)}
                      </Button>
                    </div>
                    {pkg.features.length > 0 ? (
                      <ul className="flex flex-col gap-1 border-t border-[var(--fc-border)] pt-3">
                        {pkg.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-xs text-[var(--fc-text-secondary)]">
                            <Icon name="check" size={14} className="text-[var(--fc-success)]" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--fc-text-secondary)]">{t('subscriptions.history', locale)}</h2>
              {subscriptions.history.length === 0 ? (
                <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-6 text-center text-sm text-[var(--fc-text-secondary)]">
                  {t('subscriptions.noHistory', locale)}
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {subscriptions.history.map((item) => (
                    <li key={item.id} className="flex items-center justify-between rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--fc-text-primary)]">{item.title}</p>
                        <p className="text-xs text-[var(--fc-text-secondary)]">{item.durationLabel}</p>
                      </div>
                      <span className="text-sm font-bold text-[var(--fc-text-primary)]">
                        {item.price} {item.currency}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}