'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useStore } from '@/lib/store/use-store';
import { segmentSlug } from '@/lib/store/segment';

export default function StoreChatPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ segmentId: string; storeId: string }>();
  const segmentId = params?.segmentId ?? '';
  const storeId = params?.storeId ?? '';
  const flow = useStore(segmentSlug(segmentId));

  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!storeId) return;
    void flow.openChat(storeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [flow.chatMessages.length]);

  const send = useCallback(() => {
    if (!draft.trim() || !storeId) return;
    void flow.sendChat(storeId, draft.trim());
    setDraft('');
  }, [draft, storeId, flow]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('store.chatTitle', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto bg-[var(--fc-surface-raised)]/40 px-4 py-4"
        style={{ maxHeight: 'calc(100dvh - 7rem)' }}
      >
        {flow.chatMessages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <img src="/assets/phase-8/chat-empty.svg" alt="" className="h-40 w-60" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('store.chatPlaceholder', runtime.locale)}</p>
          </div>
        ) : (
          flow.chatMessages.map((msg, i) => {
            const mine = msg.sender === 'USER';
            return (
              <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? 'rounded-br-sm bg-[var(--fc-bg-secondary)] text-white'
                      : 'rounded-bl-sm border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] text-[var(--fc-text-primary)]'
                  }`}
                >
                  <p>{msg.message}</p>
                  <p className={`mt-0.5 text-[10px] ${mine ? 'text-white/70' : 'text-[var(--fc-text-secondary)]'}`}>
                    {msg.sender === 'BUSINESS_SEGMENT'
                      ? flow.chatUserName || t('store.chatTitle', runtime.locale)
                      : t('store.chatPlaceholder', runtime.locale)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-[var(--fc-border)] bg-[var(--fc-surface)] px-4 py-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          placeholder={t('store.chatPlaceholder', runtime.locale)}
          className="flex-1 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
        />
        <Button variant="primary" disabled={!draft.trim() || flow.sendingChat} onClick={send}>
          {flow.sendingChat ? <Spinner className="h-4 w-4" /> : null}
          {t('store.send', runtime.locale)}
        </Button>
      </div>
    </div>
  );
}