'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { AppShell, Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { useFamily } from '@/lib/family/use-family';
import { useRuntime } from '@/lib/runtime-context';
import { useAuth } from '@/lib/session';
import { t } from '@/lib/i18n';

export default function FamilyPage(): ReactNode {
  const { runtime } = useRuntime();
  const { status } = useAuth();
  const router = useRouter();
  const family = useFamily();
  const locale = runtime.locale;

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');
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
    if (!name.trim() || !phone.trim()) return;
    setMessage('');
    const res = await family.addMember({ name: name.trim(), phone: phone.trim(), relationship: relation.trim() });
    setMessage(res.message);
    if (res.success) {
      setName('');
      setPhone('');
      setRelation('');
      setAdding(false);
    }
  };

  const confirmDelete = async (id: string) => {
    setPendingDelete(id);
    const res = await family.removeMember(id);
    setMessage(res.message);
    setPendingDelete(null);
  };

  return (
    <AppShell
      header={
        <TopHeader
          title={t('family.title', locale)}
          leading={
            <button type="button" aria-label={t('common.back', locale)} onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', locale)} />
            </button>
          }
          trailing={
            <button type="button" aria-label={t('family.addMember', locale)} onClick={() => setAdding((v) => !v)}>
              <IconButton icon="plus" label={t('family.addMember', locale)} />
            </button>
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
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
              <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('family.name', locale)}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('family.phone', locale)}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                placeholder="+00 000 000 0000"
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('family.relationship', locale)}</label>
              <input
                type="text"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                placeholder={t('family.relationship', locale)}
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
            </div>
            <Button block onClick={() => void submitAdd()} disabled={!name.trim() || !phone.trim()}>
              {t('family.add', locale)}
            </Button>
          </div>
        ) : null}

        {family.loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" />
          </div>
        ) : family.members.length === 0 ? (
          <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-8 text-center">
            <Icon name="user" size={32} className="mx-auto mb-2 text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('family.empty', locale)}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {family.members.map((member) => (
              <li key={member.id} className="flex items-center justify-between rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--fc-primary-soft)] text-base font-bold text-[var(--fc-primary)]">
                  {(member.name || 'F').charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1 px-3">
                  <p className="truncate text-sm font-semibold text-[var(--fc-text-primary)]">{member.name}</p>
                  <p className="truncate text-xs text-[var(--fc-text-secondary)]">
                    {member.relationship ? `${member.relationship} · ` : ''}
                    {member.phone}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  icon="trash"
                  loading={pendingDelete === member.id}
                  onClick={() => void confirmDelete(member.id)}
                  aria-label={t('family.confirmDelete', locale)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}