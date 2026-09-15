'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { AppShell, Button, Icon, IconButton, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { useRuntime } from '@/lib/runtime-context';
import { useAuth } from '@/lib/session';
import { t } from '@/lib/i18n';

export default function SettingsPage(): ReactNode {
  const { runtime } = useRuntime();
  const { status } = useAuth();
  const router = useRouter();
  const locale = runtime.locale;

  const [language, setLanguage] = useState(locale);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [autoplay, setAutoplay] = useState(false);

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/on-board');
    }
  }, [status, router]);

  if (status !== 'signedIn') {
    return null;
  }

  const toggleAutoplay = () => setAutoplay((v) => !v);
  const toggleTheme = () => setTheme((v) => (v === 'light' ? 'dark' : 'light'));

  return (
    <AppShell
      header={
        <TopHeader
          title={t('settings.title', locale)}
          leading={
            <button type="button" aria-label={t('common.back', locale)} onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', locale)} />
            </button>
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-2 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--fc-text-secondary)]">{t('settings.language', locale)}</h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
          >
            <option value="en">English</option>
            <option value="sw">Swahili</option>
          </select>
        </section>

        <section className="flex flex-col gap-2 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--fc-text-secondary)]">{t('settings.theme', locale)}</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-pressed={theme === 'light'}
              className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                theme === 'light' ? 'bg-[var(--fc-bg-secondary)] text-white' : 'border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] text-[var(--fc-text-secondary)]'
              }`}
            >
              <Icon name="settings" size={14} className="mr-1" />
              {t('settings.light', locale)}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-pressed={theme === 'dark'}
              className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                theme === 'dark' ? 'bg-[var(--fc-bg-secondary)] text-white' : 'border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] text-[var(--fc-text-secondary)]'
              }`}
            >
              <Icon name="settings" size={14} className="mr-1" />
              {t('settings.dark', locale)}
            </button>
          </div>
        </section>

        <section className="flex items-center justify-between rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[var(--fc-text-primary)]">{t('settings.autoplay', locale)}</p>
          </div>
          <button
            type="button"
            onClick={toggleAutoplay}
            className={`relative h-6 w-11 rounded-full transition-colors ${autoplay ? 'bg-[var(--fc-primary)]' : 'bg-[var(--fc-border)]'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${autoplay ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </section>

        <div className="flex flex-col gap-2 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[var(--fc-text-primary)]">{t('settings.version', locale)}</span>
            <span className="text-sm text-[var(--fc-text-secondary)]">1.0.0</span>
          </div>
          <div className="h-px bg-[var(--fc-border)]" />
          <button type="button" onClick={() => router.push('/support')} className="flex items-center justify-between py-2 text-left">
            <span className="text-sm text-[var(--fc-text-primary)]">{t('settings.help', locale)}</span>
            <Icon name="chevron" size={18} className="text-[var(--fc-text-secondary)]" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}