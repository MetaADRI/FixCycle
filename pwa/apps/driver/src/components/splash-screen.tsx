'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { mapConfiguration } from '@fixcycle/config';
import { fetchDriverConfiguration } from '@fixcycle/api-client';
import { Icon, IconButton, Spinner } from '@fixcycle/ui';
import { useCapabilities } from '@fixcycle/pwa-core';

import { api } from '@/lib/api';
import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { OfflineBanner } from '@/components/offline-banner';

type SplashStatus = 'loading' | 'ready' | 'error';

export interface DriverSplashScreenProps {
  onReady?: () => void;
}

export function DriverSplashScreen({ onReady }: DriverSplashScreenProps): React.ReactNode {
  const { runtime, applyRuntime } = useRuntime();
  const [status, setStatus] = useState<SplashStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    if (status === 'ready') {
      onReady?.();
    }
  }, [status, onReady]);

  const loadConfiguration = useCallback(async (): Promise<void> => {
    setStatus('loading');
    setError(null);
    try {
      const configuration = await fetchDriverConfiguration(api);
      if (!mounted.current) {
        return;
      }
      applyRuntime(mapConfiguration(configuration.raw));
      setStatus('ready');
    } catch (err) {
      if (!mounted.current) {
        return;
      }
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [applyRuntime]);

  useEffect(() => {
    mounted.current = true;
    void loadConfiguration();
    return () => {
      mounted.current = false;
    };
  }, [loadConfiguration]);

  const capabilities = useCapabilities();

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--fc-bg-primary)]">
      {capabilities ? (capabilities.online ? null : <OfflineBanner />) : null}
      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col items-center justify-between px-6 py-10">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-white/10 ring-1 ring-white/15">
            {runtime.businessLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={runtime.businessLogoUrl} alt={runtime.appName} className="h-16 w-16 rounded-xl object-contain" />
            ) : (
              <Icon name="taxi" size={52} className="text-[var(--fc-bg-secondary)]" />
            )}
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">{runtime.appName}</h1>
            <p className="mt-2 text-sm text-white/60">{t('app.tagline', runtime.locale)}</p>
          </div>

          {status === 'loading' ? (
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/50">
              <Spinner className="h-4 w-4 text-white/50" />
              <span>{t('common.loading', runtime.locale)}</span>
            </div>
          ) : null}

          {status === 'error' ? (
            <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <Icon name="alert" size={28} className="text-[var(--fc-danger)]" />
              <p className="text-sm text-white/80">{error}</p>
              <button
                type="button"
                onClick={() => void loadConfiguration()}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--fc-bg-secondary)] px-5 text-sm font-semibold text-white"
              >
                <Icon name="refresh" size={16} />
                {t('common.retry', runtime.locale)}
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-center gap-5 text-white/40">
          <IconButton
            icon="bell"
            label={t('main.voiceAlert', runtime.locale)}
            className="text-white/40"
            onClick={() => undefined}
          />
          <IconButton
            icon="settings"
            label={t('app.tagline', runtime.locale)}
            className="text-white/40"
            onClick={() => undefined}
          />
        </div>

        <p className="pt-6 text-[11px] text-white/30">{t('app.version', runtime.locale)}</p>
      </div>
    </div>
  );
}