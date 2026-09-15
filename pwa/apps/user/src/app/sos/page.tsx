'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { AppShell, Button, Icon, IconButton, Spinner, StatusPill, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { useSos } from '@/lib/sos/use-sos';
import { useRuntime } from '@/lib/runtime-context';
import { useAuth } from '@/lib/session';
import { t } from '@/lib/i18n';

export default function SosPage(): ReactNode {
  const { runtime } = useRuntime();
  const { status } = useAuth();
  const router = useRouter();
  const sos = useSos();
  const locale = runtime.locale;

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
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

  const submitAdd = async () => {
    if (!name.trim() || !number.trim()) return;
    setMessage('');
    const res = await sos.addContact({ name: name.trim(), number: number.trim() });
    setMessage(res.message);
    if (res.success) {
      setName('');
      setNumber('');
      setAdding(false);
    }
  };

  const confirmDelete = async (id: string) => {
    setPendingDelete(id);
    const res = await sos.removeContact(id);
    setMessage(res.message);
    setPendingDelete(null);
  };

  return (
    <AppShell
      header={
        <TopHeader
          title={t('sos.title', locale)}
          leading={
            <button type="button" aria-label={t('common.back', locale)} onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', locale)} />
            </button>
          }
          trailing={
            <button type="button" aria-label={t('sos.addContact', locale)} onClick={() => setAdding((v) => !v)}>
              <IconButton icon="plus" label={t('sos.addContact', locale)} />
            </button>
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-[var(--fc-radius-lg)] bg-[var(--fc-danger)]/10 p-4">
          <Icon name="sos" size={28} className="shrink-0 text-[var(--fc-danger)]" />
          <div>
            <p className="text-sm font-bold text-[var(--fc-danger)]">{t('sos.emergency', locale)}</p>
            <p className="text-xs text-[var(--fc-text-secondary)]">{t('sos.requestConfirm', locale)}</p>
          </div>
        </div>

        {message ? (
          <div
            role="status"
            className="rounded-[var(--fc-radius-md)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)]"
          >
            {message}
          </div>
        ) : null}

        {adding ? (
          <div className="flex flex-col gap-3 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('sos.name', locale)}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('sos.number', locale)}</label>
              <input
                type="tel"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                inputMode="tel"
                placeholder="+00 000 000 0000"
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
            </div>
            <Button block onClick={() => void submitAdd()} disabled={!name.trim() || !number.trim()}>
              {t('sos.add', locale)}
            </Button>
          </div>
        ) : null}

        <div>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--fc-text-secondary)]">{t('sos.contacts', locale)}</h2>
          {sos.loading ? (
            <div className="flex justify-center py-6">
              <Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" />
            </div>
          ) : sos.contacts.length === 0 ? (
            <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-8 text-center">
              <Icon name="sos" size={32} className="mx-auto mb-2 text-[var(--fc-text-secondary)]" />
              <p className="text-sm text-[var(--fc-text-secondary)]">{t('sos.empty', locale)}</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {sos.contacts.map((contact) => (
                <li key={contact.id} className="flex items-center justify-between rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--fc-danger)]/10 text-[var(--fc-danger)]">
                    <Icon name="sos" size={18} />
                  </span>
                  <div className="min-w-0 flex-1 px-3">
                    <p className="truncate text-sm font-semibold text-[var(--fc-text-primary)]">{contact.name}</p>
                    <p className="truncate text-xs text-[var(--fc-text-secondary)]">{contact.number}</p>
                  </div>
                  <Button
                    variant="ghost"
                    icon="trash"
                    loading={pendingDelete === contact.id}
                    onClick={() => void confirmDelete(contact.id)}
                    aria-label={t('sos.confirmDelete', locale)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}