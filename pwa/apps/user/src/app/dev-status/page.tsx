'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchUserConfiguration, UnauthorizedError } from '@fixcycle/api-client';
import { apiBaseUrl, hasMerchantCredentials, publicEnv, type RuntimeConfiguration } from '@fixcycle/config';
import { Button, Icon, Spinner, StatusPill } from '@fixcycle/ui';
import { useCapabilities, useInstallEligibility, useStandaloneMode } from '@fixcycle/pwa-core';

import { api } from '@/lib/api';
import { useRuntime } from '@/lib/runtime-context';

interface PingState {
  status: 'idle' | 'loading' | 'ok' | 'error';
  latencyMs?: number;
  error?: string;
  configuration?: RuntimeConfiguration;
}

function EnvRow({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' | 'bad' }): React.ReactNode {
  const toneClasses =
    tone === 'ok'
      ? 'text-[var(--fc-success)]'
      : tone === 'warn'
        ? 'text-[var(--fc-warning)]'
        : tone === 'bad'
          ? 'text-[var(--fc-danger)]'
          : 'text-[var(--fc-text-primary)]';
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--fc-border)] py-2 text-sm">
      <span className="text-[var(--fc-text-secondary)]">{label}</span>
      <code className={`max-w-[60%] truncate text-right text-xs ${toneClasses}`}>{value}</code>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }): React.ReactNode {
  return (
    <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--fc-text-secondary)]">{title}</h2>
      {children}
    </section>
  );
}

export default function DevStatusPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const [ping, setPing] = useState<PingState>({ status: 'idle' });

  const runPing = useCallback(async (): Promise<void> => {
    setPing({ status: 'loading' });
    const startedAt = performance.now();
    try {
      const configuration = await fetchUserConfiguration(api);
      setPing({
        status: 'ok',
        latencyMs: Math.round(performance.now() - startedAt),
        configuration,
      });
    } catch (err) {
      setPing({
        status: 'error',
        latencyMs: Math.round(performance.now() - startedAt),
        error:
          err instanceof UnauthorizedError
            ? '401 Unauthorized / session expired'
            : err instanceof Error
              ? err.message
              : String(err),
      });
    }
  }, []);

  useEffect(() => {
    void runPing();
  }, [runPing]);

  const capabilities = useCapabilities();
  const install = useInstallEligibility();
  const standalone = useStandaloneMode();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col gap-4 bg-[var(--fc-surface-raised)] px-4 py-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="settings" size={20} />
          <h1 className="text-lg font-bold">Developer status</h1>
        </div>
        <a href="/" aria-label="Back to home">
          <Button variant="secondary" icon="back">
            Home
          </Button>
        </a>
      </header>

      <SectionCard title="Environment">
        <EnvRow label="Role" value={publicEnv.appRole} />
        <EnvRow label="API base" value={apiBaseUrl() || '(unset)'} tone={apiBaseUrl() ? 'ok' : 'bad'} />
        <EnvRow
          label="Merchant credentials"
          value={hasMerchantCredentials() ? 'present' : 'missing'}
          tone={hasMerchantCredentials() ? 'ok' : 'bad'}
        />
        <EnvRow label="Locale" value={publicEnv.locale} />
        <EnvRow
          label="Google Maps key"
          value={publicEnv.googleMapsKey ? 'set' : 'missing'}
          tone={publicEnv.googleMapsKey ? 'ok' : 'warn'}
        />
        <EnvRow
          label="OneSignal app id"
          value={publicEnv.oneSignalAppId ? 'set' : 'missing'}
          tone={publicEnv.oneSignalAppId ? 'ok' : 'warn'}
        />
      </SectionCard>

      <SectionCard title="Device capabilities">
        <EnvRow
          label="Online"
          value={capabilities ? (capabilities.online ? 'yes' : 'no') : '…'}
          tone={!capabilities || capabilities.online ? 'ok' : 'bad'}
        />
        <EnvRow
          label="Service worker"
          value={capabilities ? (capabilities.serviceWorker ? 'supported' : 'unsupported') : '…'}
          tone={!capabilities || capabilities.serviceWorker ? 'ok' : 'warn'}
        />
        <EnvRow label="Touch" value={capabilities ? (capabilities.touch ? 'yes' : 'no') : '…'} />
        <EnvRow label="Standalone" value={standalone ? 'yes' : 'no'} />
        <EnvRow label="Install platform" value={install?.platform ?? '…'} />
        <EnvRow label="Install available" value={install ? (install.canInstall ? 'yes' : 'no') : '…'} />
      </SectionCard>

      <SectionCard title="Configuration endpoint">
        <div className="mb-3 flex items-center justify-between">
          <code className="text-xs">POST /user/configuration</code>
          <Button
            variant="secondary"
            icon="refresh"
            onClick={() => void runPing()}
            disabled={ping.status === 'loading'}
          >
            Check
          </Button>
        </div>
        {ping.status === 'loading' ? (
          <div className="flex items-center gap-2 py-2 text-sm text-[var(--fc-text-secondary)]">
            <Spinner className="h-4 w-4" />
            Requesting...
          </div>
        ) : ping.status === 'ok' && ping.configuration ? (
          <div className="space-y-1 py-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--fc-text-secondary)]">App name</span>
              <strong>{ping.configuration.appName}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--fc-text-secondary)]">Locale</span>
              <strong>{ping.configuration.locale}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--fc-text-secondary)]">Business logo</span>
              <strong>{ping.configuration.businessLogoUrl ? 'present' : 'none'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--fc-text-secondary)]">Languages</span>
              <strong>{ping.configuration.languages.length > 0 ? ping.configuration.languages.length : 'none'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--fc-text-secondary)]">Accent color</span>
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: ping.configuration.theme.bgColorSecondary }}
                />
                <code className="text-xs">{ping.configuration.theme.bgColorSecondary}</code>
              </span>
            </div>
            <div className="pt-2">
              <StatusPill tone="success">
                <Icon name="check" size={14} />
                OK in {ping.latencyMs} ms
              </StatusPill>
            </div>
          </div>
        ) : ping.status === 'error' ? (
          <div className="space-y-2 py-1">
            <StatusPill tone="danger">
              <Icon name="alert" size={14} />
              Failed {ping.latencyMs !== undefined ? `in ${ping.latencyMs} ms` : ''}
            </StatusPill>
            <p className="break-words text-xs text-[var(--fc-text-secondary)]">{ping.error}</p>
            <p className="text-xs text-[var(--fc-text-secondary)]">
              The PWA shell falls back to local defaults until the API is reachable and credentials are provided.
            </p>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Runtime configuration">
        <EnvRow label="Active app name" value={runtime.appName} />
        <EnvRow label="Active locale" value={runtime.locale} />
        <EnvRow label="Theme loaded" value={runtime.raw ? 'from API' : 'defaults'} />
        <EnvRow label="Flags available" value={runtime.flags ? 'yes' : 'no'} />
      </SectionCard>

      <p className="text-center text-[11px] text-[var(--fc-text-secondary)]">Fixcycle PWA — Phase 1 diagnostic</p>
    </main>
  );
}