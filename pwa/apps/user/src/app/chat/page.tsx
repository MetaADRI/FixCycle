'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { AppShell, Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { useChat } from '@/lib/chat/use-chat';
import { useRuntime } from '@/lib/runtime-context';
import { useAuth } from '@/lib/session';
import { t } from '@/lib/i18n';

export default function ChatPage(): ReactNode {
  const { runtime } = useRuntime();
  const { status } = useAuth();
  const router = useRouter();
  const chat = useChat();
  const locale = runtime.locale;

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/on-board');
    }
  }, [status, router]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat.messages.length]);

  if (status !== 'signedIn') {
    return null;
  }

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setMessage('');
    const res = await chat.send(text);
    setMessage(res.message);
    setSending(false);
    if (res.success) setDraft('');
  };

  return (
    <AppShell
      header={
        <TopHeader
          title={t('chat.title', locale)}
          leading={
            <button type="button" aria-label={t('common.back', locale)} onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', locale)} />
            </button>
          }
        />
      }
    >
      <div className="flex h-[calc(100dvh-96px)] flex-col">
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4">
          {chat.loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" />
            </div>
          ) : chat.messages.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Icon name="chat" size={32} className="text-[var(--fc-text-secondary)]" />
              <p className="text-sm text-[var(--fc-text-secondary)]">{t('chat.empty', locale)}</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {chat.messages.map((msg) => {
                const mine = msg.senderType === 'USER';
                return (
                  <li key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                        mine
                          ? 'rounded-br-sm bg-[var(--fc-bg-secondary)] text-white'
                          : 'rounded-bl-sm border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] text-[var(--fc-text-primary)]'
                      }`}
                    >
                      {!mine && msg.senderName ? <p className="mb-0.5 text-[10px] font-semibold text-[var(--fc-text-secondary)]">{msg.senderName}</p> : null}
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      {msg.createdAt ? <p className={`mt-0.5 text-[10px] ${mine ? 'text-white/60' : 'text-[var(--fc-text-secondary)]'}`}>{msg.createdAt}</p> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {message ? (
          <div className="px-4 pb-2 text-center text-xs text-[var(--fc-text-secondary)]">{message}</div>
        ) : null}

        <div className="flex items-center gap-2 border-t border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void send();
            }}
            placeholder={t('chat.placeholder', locale)}
            className="min-w-0 flex-1 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
          />
          <Button icon="chat" loading={sending} disabled={!draft.trim()} onClick={() => void send()}>
            {t('chat.send', locale)}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}