'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { fetchNotifications } from '@fixcycle/api-client';
import type { NotificationItem } from '@fixcycle/api-client';
import { ErrorState, Icon, Spinner } from '@fixcycle/ui';

import { api } from '@/lib/api';
import { t } from '@/lib/i18n';

export interface NotificationsListProps {
  locale?: string;
}

export function NotificationsList({ locale = 'en' }: NotificationsListProps): ReactNode {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    setError(false);
    try {
      setItems(await fetchNotifications(api));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-14 text-sm text-[var(--fc-text-secondary)]">
        <Spinner className="h-4 w-4" />
        <span>{t('common.loading', locale)}</span>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title={t('home.loadFailed', locale)}
        onRetry={() => void load()}
        retryLabel={t('common.retry', locale)}
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--fc-surface-raised)] text-[var(--fc-text-secondary)]">
          <Icon name="bell" size={26} />
        </span>
        <p className="text-sm text-[var(--fc-text-secondary)]">{t('notifications.empty', locale)}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      {items.map((item) => (
        <NotificationRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function NotificationRow({ item }: { item: NotificationItem }): ReactNode {
  const open = (): void => {
    if (item.url?.trim()) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };
  return (
    <button
      type="button"
      onClick={open}
      className="flex w-full items-start gap-3 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-3 text-left active:opacity-90"
    >
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-[var(--fc-radius-md)] object-cover" loading="lazy" />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--fc-radius-md)] bg-[var(--fc-bg-secondary)] text-white">
          <Icon name="promo" size={22} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        {item.title ? (
          <span className="block text-sm font-semibold text-[var(--fc-text-primary)]">{item.title}</span>
        ) : null}
        {item.message ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-[var(--fc-text-secondary)]">{item.message}</span>
        ) : null}
        {item.createdAt ? (
          <span className="mt-1 block text-[10px] text-[var(--fc-text-secondary)]">{item.createdAt}</span>
        ) : null}
      </span>
    </button>
  );
}
