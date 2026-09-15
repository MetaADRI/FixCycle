'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

import { getGuestEnabled, getSocialOptions } from '@fixcycle/config';
import { Button, Spinner } from '@fixcycle/ui';

import { GoogleIcon, FacebookIcon } from '@/components/social-icons';
import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

export interface SocialRowProps {
  onProvider?: (provider: 'google' | 'facebook') => void;
  pending?: boolean;
}

const SOCIAL_ICONS: Record<string, typeof GoogleIcon> = {
  google: GoogleIcon,
  facebook: FacebookIcon,
};

export function SocialRow({ onProvider, pending = false }: SocialRowProps): ReactNode {
  const { runtime } = useRuntime();
  const [notice, setNotice] = useState<string | null>(null);

  const social = getSocialOptions(runtime);
  const providerList: Array<{ key: 'google' | 'facebook'; label: string; enabled: boolean }> = [
    { key: 'google', label: t('auth.socialGoogle', runtime.locale), enabled: social.google && social.googleSignupKey.length > 0 },
    { key: 'facebook', label: t('auth.socialFacebook', runtime.locale), enabled: social.facebook && social.facebookSignupKey.length > 0 },
  ];
  const providers = providerList.filter((provider) => provider.enabled);

  if (!social.enable || providers.length === 0) {
    return null;
  }

  const selectProvider = (provider: 'google' | 'facebook') => {
    if (onProvider) {
      onProvider(provider);
      return;
    }
    setNotice(t('auth.somethingWentWrong', runtime.locale));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--fc-border)]" />
        <span className="text-xs text-[var(--fc-text-secondary)]">{t('auth.orContinueWith', runtime.locale)}</span>
        <span className="h-px flex-1 bg-[var(--fc-border)]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {providers.map((provider) => {
          const IconComponent = SOCIAL_ICONS[provider.key];
          return (
            <Button
              key={provider.key}
              variant="secondary"
              block
              disabled={pending}
              onClick={() => selectProvider(provider.key)}
              className="flex items-center justify-center gap-2"
            >
              {pending ? (
                <Spinner className="h-4 w-4" />
              ) : IconComponent ? (
                <IconComponent className="h-5 w-5" />
              ) : null}
              <span>{provider.label}</span>
            </Button>
          );
        })}
      </div>
      {notice ? (
        <p className="text-center text-xs text-[var(--fc-warning)]" role="alert">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

export interface GuestButtonProps {
  onClick: () => void;
  busy?: boolean;
}

export function GuestButton({ onClick, busy = false }: GuestButtonProps): ReactNode {
  const { runtime } = useRuntime();
  if (!getGuestEnabled(runtime)) {
    return null;
  }
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="mt-1 text-sm font-semibold text-[var(--fc-text-secondary)] underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current disabled:opacity-50"
    >
      {busy ? t('common.loading', runtime.locale) : t('auth.guest', runtime.locale)}
    </button>
  );
}