'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { AppShell, Button, Icon, IconButton, Spinner, StatusPill, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { useSupport } from '@/lib/support/use-support';
import { useRuntime } from '@/lib/runtime-context';
import { useAuth } from '@/lib/session';
import { t } from '@/lib/i18n';

export default function SupportPage(): ReactNode {
  const { runtime } = useRuntime();
  const { status } = useAuth();
  const router = useRouter();
  const support = useSupport();
  const locale = runtime.locale;

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [composing, setComposing] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/on-board');
    }
  }, [status, router]);

  if (status !== 'signedIn') {
    return null;
  }

  const submit = async () => {
    if (!body.trim()) return;
    setSending(true);
    setMessage('');
    const res = await support.send({ subject: subject.trim() || undefined, message: body.trim() });
    setMessage(res.message);
    setSending(false);
    if (res.success) {
      setSubject('');
      setBody('');
      setComposing(false);
    }
  };

  return (
    <AppShell
      header={
        <TopHeader
          title={t('support.title', locale)}
          leading={
            <button type="button" aria-label={t('common.back', locale)} onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', locale)} />
            </button>
          }
          trailing={
            <button type="button" aria-label={t('support.send', locale)} onClick={() => setComposing((v) => !v)}>
              <IconButton icon="plus" label={t('support.send', locale)} />
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

        {composing ? (
          <div className="flex flex-col gap-3 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('support.subject', locale)}</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('support.message', locale)}</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
            </div>
            <Button block loading={sending} disabled={!body.trim()} onClick={() => void submit()}>
              {t('support.send', locale)}
            </Button>
          </div>
        ) : null}

        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--fc-text-secondary)]">{t('support.channels', locale)}</h2>
          {support.loading ? (
            <div className="flex justify-center py-6">
              <Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" />
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {support.channels.map((channel) => (
                <li key={channel.id} className="flex items-center gap-3 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--fc-primary-soft)] text-[var(--fc-primary)]">
                    <Icon name={channel.name.toLowerCase() === 'email' ? 'document' : 'phone'} size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--fc-text-primary)]">{channel.name}</p>
                    <p className="truncate text-xs text-[var(--fc-text-secondary)]">{channel.value}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--fc-text-secondary)]">{t('support.title', locale)}</h2>
          {support.loading ? (
            <div className="flex justify-center py-6">
              <Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" />
            </div>
          ) : support.threads.length === 0 ? (
            <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-6 text-center text-sm text-[var(--fc-text-secondary)]">
              {t('chat.empty', locale)}
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {support.threads.map((thread) => (
                <li key={thread.id} className="flex flex-col gap-1 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-[var(--fc-text-primary)]">{thread.subject || t('support.subject', locale)}</p>
                    <StatusPill tone={thread.status === 'CLOSED' || thread.status === 'RESOLVED' ? 'neutral' : 'warning'}>
                      {thread.status || 'OPEN'}
                    </StatusPill>
                  </div>
                  <p className="text-sm text-[var(--fc-text-secondary)]">{thread.message}</p>
                  {thread.createdAt ? <p className="text-[10px] text-[var(--fc-text-secondary)]">{thread.createdAt}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}