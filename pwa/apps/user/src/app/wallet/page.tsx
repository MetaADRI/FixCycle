'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { AppShell, Button, Icon, IconButton, Spinner, StatusPill, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { useWallet, type WalletFilter } from '@/lib/wallet/use-wallet';
import { useRuntime } from '@/lib/runtime-context';
import { useAuth } from '@/lib/session';
import { t } from '@/lib/i18n';

type Section = 'ledger' | 'add' | 'transfer' | 'cashout';

const FILTERS: { key: WalletFilter; label: string }[] = [
  { key: 1, label: 'All' },
  { key: 2, label: 'Credit' },
  { key: 3, label: 'Debit' },
];

export default function WalletPage(): ReactNode {
  const { runtime } = useRuntime();
  const { status, user } = useAuth();
  const router = useRouter();
  const wallet = useWallet();

  const [section, setSection] = useState<Section>('ledger');
  const [filter, setFilter] = useState<WalletFilter>(1);
  const [amount, setAmount] = useState('');
  const [receiverQuery, setReceiverQuery] = useState('');
  const [receiverId, setReceiverId] = useState<number | null>(null);
  const [cashoutMethod, setCashoutMethod] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/on-board');
    }
  }, [status, router]);

  useEffect(() => {
    wallet.load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  if (status !== 'signedIn' || !user) {
    return null;
  }

  const locale = runtime.locale;
  const numericAmount = parseFloat(amount);

  const chooseFilter = (next: WalletFilter) => {
    if (next !== filter) {
      setFilter(next);
    }
  };

  const runAddMoney = async () => {
    if (!(numericAmount > 0)) return;
    setBusy(true);
    setMessage('');
    const res = await wallet.addMoney({ amount: numericAmount, paymentOptionId: 1 });
    setMessage(res.message);
    setBusy(false);
    if (res.success) {
      setAmount('');
    }
  };

  const runSearch = async () => {
    if (!receiverQuery.trim()) return;
    const found = await wallet.searchReceiver(receiverQuery.trim());
    if (found) {
      setReceiverId(Number(found.userId) || null);
      setMessage(t('wallet.userFound', locale) + `: ${found.firstName} ${found.lastName}`);
    } else {
      setReceiverId(null);
      setMessage(t('wallet.userNotFound', locale));
    }
  };

  const runTransfer = async () => {
    if (!receiverId || !(numericAmount > 0)) return;
    setBusy(true);
    setMessage('');
    const res = await wallet.transfer({ receiverId, amount: numericAmount });
    setMessage(res.message);
    setBusy(false);
    if (res.success) {
      setAmount('');
      setReceiverQuery('');
      setReceiverId(null);
    }
  };

  const runCashout = async () => {
    if (!(numericAmount > 0)) return;
    setBusy(true);
    setMessage('');
    const res = await wallet.cashout({
      amount: numericAmount,
      cashoutMethodId: cashoutMethod ? Number(cashoutMethod) : undefined,
      accountNumber: accountNumber || undefined,
    });
    setMessage(res.message);
    setBusy(false);
    if (res.success) {
      setAmount('');
    }
  };

  const sectionButton = (key: Section, label: string): ReactNode => (
    <button
      type="button"
      onClick={() => setSection(key)}
      aria-current={section === key ? 'page' : undefined}
      className={`flex-1 rounded-[var(--fc-radius-md)] px-3 py-2 text-sm font-semibold transition-colors ${
        section === key ? 'bg-[var(--fc-bg-secondary)] text-white' : 'bg-[var(--fc-surface-raised)] text-[var(--fc-text-secondary)] border border-[var(--fc-border)]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <AppShell
      header={
        <TopHeader
          title={t('wallet.title', locale)}
          leading={
            <button type="button" aria-label={t('common.back', locale)} onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', locale)} />
            </button>
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-5">
          <span className="text-xs text-[var(--fc-text-secondary)]">{t('wallet.balance', locale)}</span>
          <span className="text-3xl font-bold text-[var(--fc-text-primary)]">
            {wallet.loading ? <Spinner className="h-5 w-5 text-[var(--fc-text-secondary)]" /> : wallet.walletBalance}
          </span>
          <div className="mt-3 flex gap-2">
            {sectionButton('ledger', t('wallet.transactions', locale))}
            {sectionButton('add', t('wallet.addMoney', locale))}
            {sectionButton('transfer', t('wallet.transfer', locale))}
            {sectionButton('cashout', t('wallet.cashout', locale))}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-[var(--fc-radius-md)] bg-[var(--fc-warning)]/10 px-4 py-3 text-xs text-[var(--fc-warning)]">
          <Icon name="info" size={16} />
          <span>{t('wallet.unavailable', locale)}</span>
        </div>

        {message ? (
          <div
            role="status"
            className="rounded-[var(--fc-radius-md)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)]"
          >
            {message}
          </div>
        ) : null}

        {section === 'ledger' ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => chooseFilter(f.key)}
                  aria-pressed={filter === f.key}
                  className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filter === f.key
                      ? 'bg-[var(--fc-primary)] text-white'
                      : 'bg-[var(--fc-surface-raised)] text-[var(--fc-text-secondary)] border border-[var(--fc-border)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {wallet.transactions.length === 0 && !wallet.loading ? (
              <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-8 text-center">
                <Icon name="wallet" size={32} className="mx-auto mb-2 text-[var(--fc-text-secondary)]" />
                <p className="text-sm text-[var(--fc-text-secondary)]">{t('wallet.noTransactions', locale)}</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {wallet.transactions.map((trx, index) => (
                  <li
                    key={`${trx.transactionName}-${index}`}
                    className="flex items-center justify-between rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--fc-text-primary)]">{trx.transactionName}</p>
                      {trx.description ? <p className="truncate text-xs text-[var(--fc-text-secondary)]">{trx.description}</p> : null}
                      <p className="mt-0.5 text-[11px] text-[var(--fc-text-secondary)]">{trx.date}</p>
                    </div>
                    <span
                      className="ml-3 text-sm font-bold"
                      style={{ color: trx.valueColor || (trx.type === '2' ? '#dc2626' : '#16a34a') }}
                    >
                      {trx.amount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {section === 'add' ? (
          <div className="flex flex-col gap-3 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
            <label className="text-xs font-semibold text-[var(--fc-text-primary)]">{t('wallet.amount', locale)}</label>
            <input
              type="number"
              min="1"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
            />
            <label className="text-xs font-semibold text-[var(--fc-text-primary)]">{t('wallet.paymentOption', locale)}</label>
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-between rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-secondary)]"
            >
              <span>{t('wallet.cash', locale)}</span>
              <Icon name="cash" size={16} />
            </button>
            <p className="text-xs text-[var(--fc-text-secondary)]">{t('wallet.addMoneyNote', locale)}</p>
            <Button block loading={busy} onClick={() => void runAddMoney()} disabled={!(numericAmount > 0)}>
              {t('wallet.addMoney', locale)}
            </Button>
            {message && !busy ? (
              <p role="status" className="text-xs text-[var(--fc-text-secondary)]">
                {message}
              </p>
            ) : null}
          </div>
        ) : null}

        {section === 'transfer' ? (
          <div className="flex flex-col gap-3 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
            <label className="text-xs font-semibold text-[var(--fc-text-primary)]">{t('wallet.transferTo', locale)}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={receiverQuery}
                onChange={(e) => setReceiverQuery(e.target.value)}
                placeholder={t('wallet.searchUserPlaceholder', locale)}
                className="flex-1 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
              <Button variant="secondary" onClick={() => void runSearch()} disabled={!receiverQuery.trim()}>
                {t('wallet.searchUser', locale)}
              </Button>
            </div>
            {receiverId ? (
              <div className="flex items-center gap-2 rounded-xl bg-[var(--fc-success)]/10 px-3 py-2 text-xs text-[var(--fc-success)]">
                <Icon name="check" size={16} />
                <span>{t('wallet.userFound', locale)}</span>
              </div>
            ) : null}
            <label className="text-xs font-semibold text-[var(--fc-text-primary)]">{t('wallet.amountToTransfer', locale)}</label>
            <input
              type="number"
              min="1"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
            />
            <Button block loading={busy} onClick={() => void runTransfer()} disabled={!receiverId || !(numericAmount > 0)}>
              {t('wallet.transfer', locale)}
            </Button>
            {message && !busy ? (
              <p role="status" className="text-xs text-[var(--fc-text-secondary)]">
                {message}
              </p>
            ) : null}
          </div>
        ) : null}

        {section === 'cashout' ? (
          <div className="flex flex-col gap-3 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
            <label className="text-xs font-semibold text-[var(--fc-text-primary)]">{t('wallet.amount', locale)}</label>
            <input
              type="number"
              min="1"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
            />
            <label className="text-xs font-semibold text-[var(--fc-text-primary)]">{t('wallet.cashoutMethod', locale)}</label>
            <select
              value={cashoutMethod}
              onChange={(e) => setCashoutMethod(e.target.value)}
              aria-label={t('wallet.cashoutMethod', locale)}
              className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
            >
              <option value="">--</option>
              {wallet.cashoutMethods.map((m) => (
                <option key={String(m['id'] ?? m['name'])} value={String(m['id'] ?? '')}>
                  {String(m['name'] ?? m['payment_method_name'] ?? 'Method')}
                </option>
              ))}
            </select>
            <label className="text-xs font-semibold text-[var(--fc-text-primary)]">{t('wallet.accountNumber', locale)}</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
            />
            <Button block loading={busy} onClick={() => void runCashout()} disabled={!(numericAmount > 0)}>
              {t('wallet.cashoutRequest', locale)}
            </Button>
            {message && !busy ? (
              <p role="status" className="text-xs text-[var(--fc-text-secondary)]">
                {message}
              </p>
            ) : null}

            <div className="mt-2">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--fc-text-secondary)]">
                {t('wallet.cashoutHistory', locale)}
              </h2>
              {wallet.cashoutHistory.length === 0 ? (
                <p className="text-sm text-[var(--fc-text-secondary)]">{t('wallet.cashoutEmpty', locale)}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {wallet.cashoutHistory.map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-[var(--fc-text-primary)]">{c.amount}</p>
                        <p className="text-[11px] text-[var(--fc-text-secondary)]">
                          {c.methodName} · {c.date}
                        </p>
                      </div>
                      <StatusPill tone={c.status === 'pending' ? 'warning' : c.status === 'completed' ? 'success' : 'neutral'}>
                        {c.status}
                      </StatusPill>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}