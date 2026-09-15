'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

import { fetchUserConfiguration } from '@fixcycle/api-client';
import type { LanguageOption } from '@fixcycle/config';
import { Icon, IconButton } from '@fixcycle/ui';

import { api } from '@/lib/api';
import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

export interface LanguagePickerProps {
  onLanguageChanged?: () => void;
}

export function LanguagePicker({ onLanguageChanged }: LanguagePickerProps): ReactNode {
  const { runtime, applyRuntime } = useRuntime();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const languages: LanguageOption[] =
    runtime.languages.length > 0 ? runtime.languages : [{ id: 1, name: 'English', shortName: 'en' }];
  const currentLanguage = languages.find(
    (language) => (language.shortName ?? language.name ?? '').toLowerCase() === runtime.locale.toLowerCase(),
  );

  const selectLanguage = async (language: LanguageOption): Promise<void> => {
    const code = (language.shortName ?? language.name ?? 'en').toLowerCase();
    if (code === runtime.locale.toLowerCase()) {
      setOpen(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      api.setLocale(code);
      try { localStorage.setItem('fixcycle:locale', code); } catch {}
      const configuration = await fetchUserConfiguration(api, { language_code: code });
      applyRuntime(configuration);
      onLanguageChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.somethingWentWrong', runtime.locale));
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--fc-radius-md)] border border-[var(--fc-border)] bg-[var(--fc-surface)] px-4 text-sm font-semibold text-[var(--fc-text-primary)] transition-colors active:scale-[0.98]"
      >
        <Icon name="language" size={16} className="text-[var(--fc-text-secondary)]" />
        {currentLanguage?.name ?? currentLanguage?.shortName ?? 'English'}
      </button>
      {error ? (
        <p className="text-center text-xs text-[var(--fc-danger)]" role="alert">{error}</p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-[var(--fc-overlay)]" onClick={() => setOpen(false)} />
          <div className="relative z-10 mx-auto flex max-h-[60dvh] w-full max-w-[430px] flex-col rounded-t-[1.5rem] bg-[var(--fc-surface)] pb-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--fc-border)] px-4 py-3">
              <h3 className="text-base font-bold text-[var(--fc-text-primary)]">
                {t('onboard.language', runtime.locale)}
              </h3>
              <IconButton icon="close" label="Close" size={20} onClick={() => setOpen(false)} />
            </div>
            <div className="flex flex-col px-2 pt-2">
              {languages.map((language) => {
                const code = (language.shortName ?? language.name ?? '').toLowerCase();
                const selected = code === runtime.locale.toLowerCase();
                return (
                  <button
                    key={language.id}
                    type="button"
                    disabled={busy}
                    onClick={() => void selectLanguage(language)}
                    className={`flex min-h-[48px] items-center justify-between rounded-[var(--fc-radius-sm)] px-4 text-left text-sm font-semibold ${
                      selected ? 'bg-[var(--fc-surface-raised)] text-[var(--fc-bg-secondary)]' : 'text-[var(--fc-text-primary)]'
                    }`}
                  >
                    {language.name ?? language.shortName ?? 'English'}
                    {selected ? <Icon name="check" size={16} className="text-[var(--fc-bg-secondary)]" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}