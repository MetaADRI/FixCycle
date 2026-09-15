'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { AppShell, Button, Icon, IconButton, Spinner, StatusPill, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { useCards } from '@/lib/cards/use-cards';
import { useRuntime } from '@/lib/runtime-context';
import { useAuth } from '@/lib/session';
import { t } from '@/lib/i18n';

export default function CardsPage(): ReactNode {
  const { runtime } = useRuntime();
  const { status } = useAuth();
  const router = useRouter();
  const cards = useCards();
  const locale = runtime.locale;

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/on-board');
    }
  }, [status, router]);

  if (status !== 'signedIn') {
    return null;
  }

  const confirmDelete = async (id: string) => {
    setPendingDelete(id);
    const res = await cards.remove(id);
    setMessage(res.message);
    setPendingDelete(null);
  };

  return (
    <AppShell
      header={
        <TopHeader
          title={t('cards.title', locale)}
          leading={
            <button type="button" aria-label={t('common.back', locale)} onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', locale)} />
            </button>
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 rounded-[var(--fc-radius-md)] bg-[var(--fc-warning)]/10 px-4 py-3 text-xs text-[var(--fc-warning)]">
          <Icon name="info" size={16} />
          <span>{t('cards.displayOnly', locale)}</span>
        </div>

        {message ? (
          <div
            role="status"
            className="rounded-[var(--fc-radius-md)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)]"
          >
            {message}
          </div>
        ) : null}

        {cards.loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" />
          </div>
        ) : cards.cards.length === 0 ? (
          <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-8 text-center">
            <Icon name="card" size={32} className="mx-auto mb-2 text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('cards.empty', locale)}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {cards.cards.map((card) => (
              <li key={card.id}>
                <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-gradient-to-br from-[#1a383b] to-[#287e0a] p-5 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/70">{card.brand || 'Card'}</span>
                    {card.isDefault ? <StatusPill tone="success">{t('cards.default', locale)}</StatusPill> : null}
                  </div>
                  <p className="mt-4 text-lg font-bold tracking-wider">{card.maskedNumber || `•••• ${card.last4}`}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-white/70">
                    <span>
                      {card.expMonth || '**'}/{card.expYear || '**'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="card" size={14} />
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="ghost"
                    icon="trash"
                    loading={pendingDelete === card.id}
                    onClick={() => void confirmDelete(card.id)}
                    className="text-[var(--fc-danger)]"
                  >
                    {t('cards.deleteConfirm', locale)}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Button variant="secondary" block disabled>
          <Icon name="plus" size={18} />
          {t('cards.addCard', locale)}
        </Button>
      </div>
    </AppShell>
  );
}