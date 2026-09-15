'use client';

import { Button, Icon, StatusPill } from '@fixcycle/ui';
import { useInstallPrompt } from '@fixcycle/pwa-core';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

export function InstallHelp(): React.ReactNode {
  const install = useInstallPrompt();
  const { runtime } = useRuntime();

  if (install.isStandalone) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--fc-success)]/10 text-[var(--fc-success)]">
          <Icon name="check" size={32} />
        </span>
        <h2 className="text-lg font-bold text-[var(--fc-text-primary)]">{t('install.installed', runtime.locale)}</h2>
        <p className="max-w-xs text-sm text-[var(--fc-text-secondary)]">
          {runtime.appName} is installed on this device and ready to use.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-1 py-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[var(--fc-bg-primary)]">
          <Icon name="taxi" size={32} className="text-[var(--fc-bg-secondary)]" />
        </span>
        <h2 className="text-lg font-bold text-[var(--fc-text-primary)]">{runtime.appName}</h2>
        <p className="max-w-sm text-sm leading-6 text-[var(--fc-text-secondary)]">
          {install.platform === 'ios-safari' ? t('install.ios', runtime.locale) : t('install.android', runtime.locale)}
        </p>
        {install.platform === 'ios-safari' ? (
          <p className="max-w-sm rounded-xl bg-[var(--fc-surface-raised)] px-4 py-3 text-sm leading-6 text-[var(--fc-text-primary)]">
            {t('install.iosSteps', runtime.locale)}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        {install.platform !== 'ios-safari' ? (
          <Button
            block
            icon="download"
            disabled={!install.canInstall}
            loading={false}
            onClick={() => void install.promptInstall()}
          >
            {t('install.cta', runtime.locale)}
          </Button>
        ) : null}
        {!install.dismissed ? (
          <Button block variant="secondary" onClick={install.dismiss} icon="close">
            {t('install.dismiss', runtime.locale)}
          </Button>
        ) : null}
      </div>

      <div className="flex justify-center">
        <StatusPill tone={install.canInstall ? 'info' : 'neutral'}>
          <Icon name="info" size={14} />
          {install.platform}
        </StatusPill>
      </div>
    </div>
  );
}