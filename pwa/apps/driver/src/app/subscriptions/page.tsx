'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppShell, Button, Icon, IconButton, Spinner, StatusPill, TopHeader } from '@fixcycle/ui';
import {
  activateDriverSubscriptionPackage,
  fetchDriverActiveSubscription,
  fetchDriverSubscriptionHistory,
  fetchDriverSubscriptionPackages,
} from '@fixcycle/api-client';
import type {
  DriverSubscriptionPackageItem,
  DriverSubscriptionPaymentMethod,
} from '@fixcycle/api-client';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { api } from '@/lib/api';

const SEGMENT_ID = 'sg-1';

function packageProgress(pkg: DriverSubscriptionPackageItem): number {
  const details = pkg.packDetails;
  if (!details || details.totalTrips <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((details.usedTrip / details.totalTrips) * 100));
}

function PackageCard({
  pkg,
  onActivate,
}: {
  pkg: DriverSubscriptionPackageItem;
  onActivate: (pkg: DriverSubscriptionPackageItem) => void;
}): React.ReactNode {
  const { runtime } = useRuntime();
  const details = pkg.packDetails;
  const progress = packageProgress(pkg);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)]">
      <div className="flex items-center gap-3 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--fc-bg-secondary)]/10 text-[var(--fc-bg-secondary)]">
          <Icon name="promo" size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[var(--fc-text-primary)]">{pkg.name || pkg.text}</p>
          <p className="text-xs text-[var(--fc-text-secondary)]">
            {pkg.segmentName || pkg.vehicleType} · {pkg.packageDurationName || pkg.priceType}
          </p>
        </div>
        <div className="text-right">
          <p className="text-base font-extrabold text-[var(--fc-bg-secondary)]">{pkg.showPrice || pkg.amount}</p>
          {details ? (
            <p className="text-[10px] text-[var(--fc-text-secondary)]">
              {t('subscriptions.used', runtime.locale)} {details.usedTrip}/{details.totalTrips}
            </p>
          ) : null}
        </div>
      </div>

      {details ? (
        <div className="px-4 pb-3">
          <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--fc-text-secondary)]">
            <span>
              {details.startTime} — {details.endTime}
            </span>
            <span className="font-semibold text-[var(--fc-bg-secondary)]">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--fc-surface-raised)]">
            <div
              className="h-full rounded-full bg-[var(--fc-bg-secondary)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          {details.carryForwardedTrips > 0 ? (
            <p className="mt-1.5 text-[10px] text-[var(--fc-text-secondary)]">
              {t('subscriptions.carryForwarded', runtime.locale)}: {details.carryForwardedTrips}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="px-4 pb-3">
          <p className="line-clamp-2 text-xs text-[var(--fc-text-secondary)]">{pkg.description}</p>
          {pkg.maxTrip > 0 ? (
            <p className="mt-1 text-[10px] font-medium text-[var(--fc-bg-secondary)]">
              {t('subscriptions.maxTrip', runtime.locale)}: {pkg.maxTrip}
            </p>
          ) : null}
        </div>
      )}

      {pkg.status === 1 ? (
        <div className="border-t border-[var(--fc-border)] px-4 py-2.5">
          <StatusPill tone="success">{t('subscriptions.active', runtime.locale)}</StatusPill>
          {pkg.expireDate ? (
            <span className="ml-2 text-[10px] text-[var(--fc-text-secondary)]">
              {t('subscriptions.expires', runtime.locale)} {pkg.expireDate}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="border-t border-[var(--fc-border)] p-2">
          <Button variant="secondary" block onClick={() => onActivate(pkg)}>
            {t('subscriptions.activate', runtime.locale)} · {pkg.showPrice || pkg.amount}
          </Button>
        </div>
      )}
    </div>
  );
}

function ActivateSheet({
  pkg,
  paymentMethods,
  onClose,
  onDone,
}: {
  pkg: DriverSubscriptionPackageItem;
  paymentMethods: DriverSubscriptionPaymentMethod[];
  onClose: () => void;
  onDone: () => void;
}): React.ReactNode {
  const { runtime } = useRuntime();
  const [methodId, setMethodId] = useState(paymentMethods[0]?.id ?? '1');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async (): Promise<void> => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await activateDriverSubscriptionPackage(api, {
        packageId: pkg.id,
        segmentId: SEGMENT_ID,
        amount: pkg.amount || pkg.showPrice || 0,
        paymentMethod: methodId,
      });
      if (result && String(result['result'] ?? '1') === '0') {
        setError(t('subscriptions.failed', runtime.locale));
        return;
      }
      onDone();
      onClose();
    } catch {
      setError(t('subscriptions.failed', runtime.locale));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" role="presentation">
      <div className="w-full max-w-[430px] rounded-t-3xl bg-[var(--fc-surface)] p-5 pb-8" role="dialog" aria-modal="true">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--fc-border)]" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--fc-text-primary)]">
            {t('subscriptions.confirm', runtime.locale)}
          </h2>
          <IconButton icon="close" label={t('common.cancel', runtime.locale)} onClick={onClose} className="h-8 w-8" />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-[var(--fc-surface-raised)] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[var(--fc-text-primary)]">{pkg.name || pkg.text}</p>
              <p className="text-lg font-extrabold text-[var(--fc-bg-secondary)]">
                {pkg.showPrice || pkg.amount}
              </p>
            </div>
            <p className="mt-1 text-xs text-[var(--fc-text-secondary)]">
              {pkg.packageDurationName} · {t('subscriptions.maxTrip', runtime.locale)} {pkg.maxTrip}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">
              {t('subscriptions.payment', runtime.locale)}
            </label>
            <div className="space-y-2">
              {paymentMethods.length === 0 ? (
                <div className="rounded-2xl border border-[var(--fc-border)] p-3 text-sm text-[var(--fc-text-secondary)]">
                  {t('subscriptions.walletOnly', runtime.locale)}
                </div>
              ) : null}
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setMethodId(method.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-sm transition-colors ${
                    methodId === method.id
                      ? 'border-[var(--fc-bg-secondary)] bg-[var(--fc-bg-secondary)]/5'
                      : 'border-[var(--fc-border)] bg-[var(--fc-surface-raised)]'
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fc-bg-secondary)]/10 text-[var(--fc-bg-secondary)]">
                    <Icon name="wallet" size={16} />
                  </span>
                  <span className="flex-1 text-left font-medium text-[var(--fc-text-primary)]">{method.name}</span>
                  {methodId === method.id ? (
                    <Icon name="check" size={18} className="text-[var(--fc-bg-secondary)]" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {error ? <p className="text-sm text-[var(--fc-danger)]">{error}</p> : null}

          <Button block loading={submitting} onClick={() => void handleActivate()}>
            {t('subscriptions.pay', runtime.locale)} {pkg.showPrice || pkg.amount}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionsPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const [available, setAvailable] = useState<DriverSubscriptionPackageItem[]>([]);
  const [history, setHistory] = useState<DriverSubscriptionPackageItem[]>([]);
  const [active, setActive] = useState<DriverSubscriptionPackageItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<DriverSubscriptionPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activating, setActivating] = useState<DriverSubscriptionPackageItem | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(false);
    try {
      const [listResult, activeResult] = await Promise.all([
        fetchDriverSubscriptionPackages(api, { segmentId: SEGMENT_ID }),
        fetchDriverActiveSubscription(api, { segmentId: SEGMENT_ID }).catch(() => null),
      ]);
      setAvailable(listResult.packages);
      setPaymentMethods(listResult.paymentMethods);
      const activeList = activeResult?.packages ?? [];
      if (activeList.length === 0) {
        activeList.push(...listResult.packages.filter((pkg) => pkg.status === 1));
      }
      setActive(activeList);
      const historyList = await fetchDriverSubscriptionHistory(api, { segmentId: SEGMENT_ID }).catch(() => []);
      setHistory(historyList);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDone = useCallback((): void => {
    void load();
  }, [load]);

  return (
    <AppShell
      padded={false}
      header={
        <TopHeader
          title={t('subscriptions.title', runtime.locale)}
          leading={
            <IconButton icon="back" label={t('common.back', runtime.locale)} onClick={() => router.back()} />
          }
        />
      }
    >
      <div className="px-4 pb-8 pt-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-5 w-5 text-[var(--fc-bg-secondary)]" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Icon name="alert" size={32} className="mb-3 text-[var(--fc-text-secondary)]" />
            <Button variant="secondary" onClick={() => void load()}>
              {t('common.retry', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {active.length > 0 ? (
              <div>
                <h3 className="mb-3 text-sm font-bold text-[var(--fc-text-primary)]">
                  {t('subscriptions.current', runtime.locale)}
                </h3>
                <div className="space-y-3">
                  {active.map((pkg) => (
                    <PackageCard
                      key={`active-${pkg.id}`}
                      pkg={{ ...pkg, status: 1 }}
                      onActivate={() => undefined}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {available.length > 0 ? (
              <div>
                <h3 className="mb-3 text-sm font-bold text-[var(--fc-text-primary)]">
                  {t('subscriptions.plans', runtime.locale)}
                </h3>
                <div className="space-y-3">
                  {available
                    .filter((pkg) => pkg.status !== 1)
                    .map((pkg) => (
                      <PackageCard key={`plan-${pkg.id}`} pkg={pkg} onActivate={setActivating} />
                    ))}
                </div>
              </div>
            ) : null}

            {history.length > 0 ? (
              <div>
                <h3 className="mb-3 text-sm font-bold text-[var(--fc-text-primary)]">
                  {t('subscriptions.history', runtime.locale)}
                </h3>
                <div className="space-y-3">
                  {history.map((pkg) => (
                    <PackageCard key={`history-${pkg.id}`} pkg={{ ...pkg, status: 0 }} onActivate={() => undefined} />
                  ))}
                </div>
              </div>
            ) : null}

            {available.length === 0 && active.length === 0 && history.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Icon name="promo" size={32} className="mb-3 text-[var(--fc-text-secondary)]" />
                <p className="text-sm text-[var(--fc-text-secondary)]">
                  {t('subscriptions.empty', runtime.locale)}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {activating ? (
        <ActivateSheet
          pkg={activating}
          paymentMethods={paymentMethods}
          onClose={() => setActivating(null)}
          onDone={handleDone}
        />
      ) : null}
    </AppShell>
  );
}