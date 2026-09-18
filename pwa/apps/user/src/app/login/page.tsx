'use client';

import { useCallback, useState } from 'react';

import type { CountryOption } from '@fixcycle/config';
import { Button } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { AuthShell } from '@/components/auth/auth-shell';
import { PasswordField } from '@/components/auth/fields';
import { PhoneField } from '@/components/auth/phone-field';
import { GuestButton, SocialRow } from '@/components/auth/social-row';
import { t } from '@/lib/i18n';
import { messageFromError } from '@/lib/auth-errors';
import { useAuth } from '@/lib/session';
import { useRuntime } from '@/lib/runtime-context';

function buildPhone(phonecode: string | undefined, number: string): string {
  const digits = number.replace(/\D/g, '');
  return `+${phonecode ?? ''}${digits}`;
}

export default function LoginPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const { signInWithPassword, signInAsGuest } = useAuth();
  const router = useRouter();

  const [country, setCountry] = useState<CountryOption | null>(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const locale = runtime.locale;
  const fullPhone = buildPhone(country?.phonecode, phone);

  const handleSignIn = useCallback(async (): Promise<void> => {
    setError(null);
    if (fullPhone.length < 8) {
      setError(t('auth.phoneRequired', locale));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordTooShort', locale));
      return;
    }
    setBusy(true);
    try {
      await signInWithPassword(fullPhone, password);
      router.replace('/home');
    } catch (err) {
      setError(messageFromError(err, t('auth.somethingWentWrong', locale)));
    } finally {
      setBusy(false);
    }
  }, [fullPhone, password, locale, signInWithPassword, router]);

  return (
    <AuthShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-extrabold text-[var(--fc-text-primary)]">{t('auth.loginTitle', locale)}</h2>
          <p className="text-sm text-[var(--fc-text-secondary)]">{t('auth.loginSubtitle', locale)}</p>
        </div>

        <div className="flex flex-col gap-4">
          <PhoneField
            label={t('auth.phone', locale)}
            country={country}
            value={phone}
            onValueChange={(value) => {
              setPhone(value.replace(/[^\d]/g, ''));
              setError(null);
            }}
            onCountryChange={(selected) => setCountry(selected)}
            error={error?.includes(t('auth.phoneRequired', locale)) ? error : undefined}
            autoFocus
          />

          <PasswordField
            label={t('auth.password', locale)}
            value={password}
            onValueChange={(value) => {
              setPassword(value);
              setError(null);
            }}
            error={error?.includes(t('auth.passwordTooShort', locale)) ? error : undefined}
          />

          <Button block loading={busy} onClick={() => void handleSignIn()}>
            {t('auth.signIn', locale)}
          </Button>
        </div>

        <div className="flex flex-col items-center gap-3">
          <a href="/forgot-password" className="text-sm font-semibold text-[var(--fc-bg-secondary)]">
            {t('auth.forgotLink', locale)}
          </a>
          <p className="text-sm text-[var(--fc-text-secondary)]">
            {t('auth.newHere', locale)}{' '}
            <a href="/signup" className="font-semibold text-[var(--fc-bg-secondary)]">
              {t('auth.signUp', locale)}
            </a>
          </p>
        </div>

        <SocialRow />

        <div className="flex justify-center pt-1">
          <GuestButton
            busy={busy}
            onClick={() => {
              setBusy(true);
              signInAsGuest()
                .then(() => router.replace('/home'))
                .catch((err: unknown) => setError(messageFromError(err, t('auth.somethingWentWrong', locale))))
                .finally(() => setBusy(false));
            }}
          />
        </div>
      </div>
    </AuthShell>
  );
}