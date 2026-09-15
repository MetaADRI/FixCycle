'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppShell, Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';
import {
  addDriverWalletMoney,
  fetchDriverAccountEarnings,
  fetchDriverCashoutHistory,
  fetchDriverWalletTransactions,
  requestDriverCashout,
  withdrawDriverWallet,
} from '@fixcycle/api-client';
import type {
  DriverAccountEarnings,
  DriverCashoutHistoryItem,
  DriverWalletResult,
} from '@fixcycle/api-client';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { api } from '@/lib/api';

type ModalKind = 'add' | 'withdraw' | 'cashout' | null;

function AmountSheet({
  kind,
  walletBalance,
  onClose,
  onDone,
}: {
  kind: Exclude<ModalKind, null>;
  walletBalance: string;
  onClose: () => void;
  onDone: () => void;
}): React.ReactNode {
  const { runtime } = useRuntime();
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title =
    kind === 'add'
      ? t('earnings.addMoney', runtime.locale)
      : kind === 'withdraw'
        ? t('earnings.withdraw', runtime.locale)
        : t('earnings.cashout', runtime.locale);

  const handleSubmit = async (): Promise<void> => {
    const value = Number(amount);
    if (!value || value <= 0) {
      setError(t('earnings.amount', runtime.locale));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (kind === 'add') {
        await addDriverWalletMoney(api, { amount: value, paymentMethod: 1 });
      } else if (kind === 'withdraw') {
        await withdrawDriverWallet(api, value);
      } else {
        await requestDriverCashout(api, { amount: value });
      }
      onDone();
      onClose();
    } catch {
      setError(t('earnings.amount', runtime.locale));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)] focus:border-[var(--fc-bg-secondary)] focus:outline-none';

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" role="presentation">
      <div className="w-full max-w-[430px] rounded-t-3xl bg-[var(--fc-surface)] p-5 pb-8" role="dialog" aria-modal="true">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--fc-border)]" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--fc-text-primary)]">{title}</h2>
          <IconButton icon="close" label={t('common.cancel', runtime.locale)} onClick={onClose} className="h-8 w-8" />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-[var(--fc-surface-raised)] p-4 text-center">
            <p className="text-xs text-[var(--fc-text-secondary)]">{t('earnings.wallet', runtime.locale)}</p>
            <p className="mt-1 text-2xl font-extrabold text-[var(--fc-text-primary)]">{walletBalance}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">
              {t('earnings.amount', runtime.locale)}
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('earnings.amountPlaceholder', runtime.locale)}
              className={inputClass}
            />
          </div>

          {error ? <p className="text-sm text-[var(--fc-danger)]">{error}</p> : null}

          <Button block loading={submitting} onClick={() => void handleSubmit()}>
            {title}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = 'primary',
}: {
  label: string;
  value: string;
  tone?: 'primary' | 'text' | 'success';
}): React.ReactNode {
  const textClass =
    tone === 'success'
      ? 'text-[var(--fc-success)]'
      : tone === 'text'
        ? 'text-[var(--fc-text-primary)]'
        : 'text-[var(--fc-bg-secondary)]';
  return (
    <div className="rounded-2xl bg-[var(--fc-surface-raised)] p-3 text-center">
      <p className={`text-lg font-bold ${textClass}`}>{value}</p>
      <p className="mt-0.5 text-[10px] text-[var(--fc-text-secondary)]">{label}</p>
    </div>
  );
}

export default function EarningsPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const [earnings, setEarnings] = useState<DriverAccountEarnings | null>(null);
  const [wallet, setWallet] = useState<DriverWalletResult | null>(null);
  const [cashouts, setCashouts] = useState<DriverCashoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modal, setModal] = useState<ModalKind>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(false);
    try {
      const [acc, walletResult, cashoutList] = await Promise.all([
        fetchDriverAccountEarnings(api, { segmentId: 'sg-1' }),
        fetchDriverWalletTransactions(api, { filter: 1, duration: 'one_week' }),
        fetchDriverCashoutHistory(api).catch(() => []),
      ]);
      setEarnings(acc);
      setWallet(walletResult);
      setCashouts(cashoutList);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const walletBalance = wallet?.walletBalance || earnings?.walletBalance || '₹ 0.00';

  return (
    <AppShell
      padded={false}
      header={
        <TopHeader
          title={t('earnings.title', runtime.locale)}
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
        ) : error || !earnings ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Icon name="alert" size={32} className="mb-3 text-[var(--fc-text-secondary)]" />
            <Button variant="secondary" onClick={() => void load()}>
              {t('common.retry', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[var(--fc-bg-secondary)] p-5 text-white">
              <p className="text-xs opacity-80">{t('earnings.totalEarnings', runtime.locale)}</p>
              <p className="mt-1 text-3xl font-extrabold">{earnings.totalEarnings}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-sm font-bold">{earnings.receivedInWallet}</p>
                  <p className="text-[10px] opacity-80">{t('earnings.inWallet', runtime.locale)}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-sm font-bold">{earnings.receivedCash}</p>
                  <p className="text-[10px] opacity-80">{t('earnings.receivedCash', runtime.locale)}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--fc-text-primary)]">{t('earnings.wallet', runtime.locale)}</h3>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setModal('add')}>
                    {t('earnings.addMoney', runtime.locale)}
                  </Button>
                  <Button variant="secondary" onClick={() => setModal('withdraw')}>
                    {t('earnings.withdraw', runtime.locale)}
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--fc-bg-secondary)]/10 text-[var(--fc-bg-secondary)]">
                    <Icon name="wallet" size={22} />
                  </span>
                  <div className="flex-1">
                    <p className="text-xl font-extrabold text-[var(--fc-text-primary)]">{walletBalance}</p>
                    <p className="text-xs text-[var(--fc-text-secondary)]">{t('earnings.cashoutHint', runtime.locale)}</p>
                  </div>
                  <Button variant="secondary" icon="promo" onClick={() => setModal('cashout')}>
                    {t('earnings.cashout', runtime.locale)}
                  </Button>
                </div>
              </div>
            </div>

            {earnings.holderData.length > 0 ? (
              <div className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
                <div className="space-y-2">
                  {earnings.holderData.map((line, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                      style={{ color: line.colour || 'var(--fc-text-primary)', fontWeight: line.bold ? 700 : 400 }}
                    >
                      <span>{line.parameterName}</span>
                      <span>{line.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <h3 className="mb-3 text-sm font-bold text-[var(--fc-text-primary)]">
                {t('earnings.transactions', runtime.locale)}
              </h3>
              {wallet && wallet.recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Icon name="wallet" size={28} className="mb-2 text-[var(--fc-text-secondary)]" />
                  <p className="text-sm text-[var(--fc-text-secondary)]">{t('earnings.empty', runtime.locale)}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {wallet?.recentTransactions.map((txn, i) => {
                    const isCredit = /credit/i.test(txn.transactionType);
                    return (
                      <div key={i} className="rounded-2xl bg-[var(--fc-surface-raised)] p-3">
                        <div className="flex items-center justify-between">
                          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--fc-text-primary)]">
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                isCredit ? 'bg-[var(--fc-success)]/10 text-[var(--fc-success)]' : 'bg-[var(--fc-danger)]/10 text-[var(--fc-danger)]'
                              }`}
                            >
                              <Icon name={isCredit ? 'arrow-up' : 'minus'} size={16} />
                            </span>
                            {txn.platform}
                          </p>
                          <span
                            className="text-sm font-bold"
                            style={{ color: txn.valueColor || (isCredit ? 'var(--fc-success)' : 'var(--fc-danger)') }}
                          >
                            {isCredit ? '+' : '−'} {txn.amount}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--fc-text-secondary)]">
                          {txn.description} · {txn.date}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {earnings.tripsDetails.days.length > 0 ? (
              <div>
                <h3 className="mb-3 text-sm font-bold text-[var(--fc-text-primary)]">
                  {t('earnings.trips', runtime.locale)}
                </h3>
                <div className="space-y-3">
                  {earnings.tripsDetails.days.map((day, i) => (
                    <div key={i} className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-bold text-[var(--fc-text-primary)]">{day.dateText}</p>
                        <p className="text-xs text-[var(--fc-text-secondary)]">
                          {day.completedRides} {t('earnings.trips', runtime.locale)} · {t('earnings.dayEarning', runtime.locale)}{' '}
                          {day.dayEarning}
                        </p>
                      </div>
                      {day.trips.map((trip) => (
                        <div key={trip.orderId} className="flex items-center justify-between border-t border-[var(--fc-border)] py-2 text-sm">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[var(--fc-text-primary)]">{trip.orderName}</p>
                            <p className="text-xs text-[var(--fc-text-secondary)]">
                              {trip.orderNo} · {trip.timeOfBooking}
                            </p>
                          </div>
                          <span className="font-semibold text-[var(--fc-text-primary)]">{trip.amount}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <h3 className="mb-3 text-sm font-bold text-[var(--fc-text-primary)]">
                {t('earnings.cashoutHistory', runtime.locale)}
              </h3>
              {cashouts.length === 0 ? (
                <p className="text-sm text-[var(--fc-text-secondary)]">{t('earnings.empty', runtime.locale)}</p>
              ) : (
                <div className="space-y-2">
                  {cashouts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-2xl bg-[var(--fc-surface-raised)] p-3">
                      <div>
                        <p className="text-sm font-bold text-[var(--fc-text-primary)]">{c.amount}</p>
                        <p className="text-xs text-[var(--fc-text-secondary)]">
                          {t('earnings.date', runtime.locale)}: {c.id}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          /(pending|process|initiat)/i.test(c.cashoutStatus)
                            ? 'bg-[var(--fc-warning)]/10 text-[var(--fc-warning)]'
                            : 'bg-[var(--fc-success)]/10 text-[var(--fc-success)]'
                        }`}
                      >
                        {c.cashoutStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatCard label={t('earnings.gross', runtime.locale)} value={earnings.totalBilledToConsumer || '—'} tone="text" />
              <StatCard label={t('earnings.commission', runtime.locale)} value="—" tone="text" />
              <StatCard label={t('earnings.net', runtime.locale)} value={earnings.totalEarnings} tone="success" />
            </div>
          </div>
        )}
      </div>

      {modal ? (
        <AmountSheet
          kind={modal}
          walletBalance={walletBalance}
          onClose={() => setModal(null)}
          onDone={() => void load()}
        />
      ) : null}
    </AppShell>
  );
}