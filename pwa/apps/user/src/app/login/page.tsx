'use client';

import { useCallback, useMemo, useState } from 'react';

import type { CountryOption } from '@fixcycle/config';
import { getLoginOptions } from '@fixcycle/config';
import { Button } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { AuthShell } from '@/components/auth/auth-shell';
import { InputField, PasswordField } from '@/components/auth/fields';
import { OtpEntry } from '@/components/auth/otp-entry';
import { PhoneField } from '@/components/auth/phone-field';
import { GuestButton, SocialRow } from '@/components/auth/social-row';
import { t } from '@/lib/i18n';
import { messageFromError } from '@/lib/auth-errors';
import { useAuth } from '@/lib/session';
import { useRuntime } from '@/lib/runtime-context';

type Step = 'identifier' | 'otp';

function buildPhone(phonecode: string | undefined, number: string): string {
  const digits = number.replace(/\D/g, '');
  return `+${phonecode ?? ''}${digits}`;
}

export default function LoginPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const { sendOtpFor, signInWithOtp, signInWithPassword, signInAsGuest } = useAuth();
  const router = useRouter();

  const loginOptions = useMemo(() => getLoginOptions(runtime), [runtime]);
  const channel: 'PHONE' | 'EMAIL' = loginOptions.email && !loginOptions.phone ? 'EMAIL' : 'PHONE';
  const useOtpMode = loginOptions.otp;

  const [step, setStep] = useState<Step>('identifier');
  const [country, setCountry] = useState<CountryOption | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpLength, setOtpLength] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendLockMs, setResendLockMs] = useState(60_000);
  const [otpHint, setOtpHint] = useState('');

  const locale = runtime.locale;

  const fullIdentifier =
    channel === 'PHONE' ? buildPhone(country?.phonecode, identifier) : identifier.trim().toLowerCase();

  const handleSendCode = useCallback(async (): Promise<void> => {
    setError(null);
    if (channel === 'PHONE' && fullIdentifier.length < 8) {
      setError(t('auth.phoneRequired', locale));
      return;
    }
    if (channel === 'EMAIL' && !fullIdentifier.includes('@')) {
      setError(t('auth.invalidEmail', locale));
      return;
    }
    setBusy(true);
    try {
      const result = await sendOtpFor(3, channel, fullIdentifier);
      setOtpHint(`${t('auth.otpHint', locale)} · ${channel === 'PHONE' ? fullIdentifier : fullIdentifier}`);
      const prefilled = result.autoFill && result.otp ? result.otp : '';
      setOtp(prefilled);
      setOtpLength(Math.min(6, Math.max(4, prefilled.length > 0 ? prefilled.length : 6)));
      setResendLockMs(60_000);
      setStep('otp');
    } catch (err) {
      setError(messageFromError(err, t('auth.somethingWentWrong', locale)));
    } finally {
      setBusy(false);
    }
  }, [channel, fullIdentifier, locale, sendOtpFor]);

  const handleSubmitIdentifier = useCallback(async (): Promise<void> => {
    if (useOtpMode) {
      await handleSendCode();
      return;
    }
    setError(null);
    if (fullIdentifier.length < 8) {
      setError(t('auth.phoneRequired', locale));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordTooShort', locale));
      return;
    }
    setBusy(true);
    try {
      await signInWithPassword(fullIdentifier, password, channel === 'EMAIL' ? 'EMAIL' : undefined);
      router.replace('/home');
    } catch (err) {
      setError(messageFromError(err, t('auth.somethingWentWrong', locale)));
    } finally {
      setBusy(false);
    }
  }, [useOtpMode, handleSendCode, fullIdentifier, password, channel, locale, signInWithPassword, router]);

  const handleVerify = useCallback(async (): Promise<void> => {
    setError(null);
    if (otp.trim().length < 4) {
      setError(t('auth.otpRequired', locale));
      return;
    }
    setBusy(true);
    try {
      await signInWithOtp(fullIdentifier, otp.trim());
      router.replace('/home');
    } catch (err) {
      setError(messageFromError(err, t('auth.somethingWentWrong', locale)));
    } finally {
      setBusy(false);
    }
  }, [otp, fullIdentifier, locale, signInWithOtp, router]);

  const handleResend = useCallback((): void => {
    void handleSendCode();
  }, [handleSendCode]);

  return (
    <AuthShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-extrabold text-[var(--fc-text-primary)]">{t('auth.loginTitle', locale)}</h2>
          <p className="text-sm text-[var(--fc-text-secondary)]">{t('auth.loginSubtitle', locale)}</p>
        </div>

        {step === 'identifier' ? (
          <>
            <div className="flex flex-col gap-4">
              {channel === 'PHONE' ? (
                <PhoneField
                  label={t('auth.phone', locale)}
                  country={country}
                  value={identifier}
                  onValueChange={(value) => {
                    setIdentifier(value.replace(/[^\d]/g, ''));
                    setError(null);
                  }}
                  onCountryChange={(selected) => setCountry(selected)}
                  error={error ?? undefined}
                  autoFocus
                />
              ) : (
                <InputField
                  label={t('auth.email', locale)}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={identifier}
                  onValueChange={(value) => {
                    setIdentifier(value);
                    setError(null);
                  }}
                  error={error ?? undefined}
                  autoFocus
                />
              )}

              {!useOtpMode ? (
                <PasswordField
                  label={t('auth.password', locale)}
                  value={password}
                  onValueChange={(value) => {
                    setPassword(value);
                    setError(null);
                  }}
                  error={error ?? undefined}
                />
              ) : null}

              <Button block loading={busy} onClick={() => void handleSubmitIdentifier()}>
                {useOtpMode ? t('auth.sendCode', locale) : t('auth.signIn', locale)}
              </Button>
            </div>

            <div className="flex flex-col items-center gap-3">
              <a
                href="/forgot-password"
                className="text-sm font-semibold text-[var(--fc-bg-secondary)]"
              >
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
          </>
        ) : (
          <>
            <OtpEntry
              label={t('auth.otp', locale)}
              hint={otpHint}
              value={otp}
              maxLength={otpLength}
              onValueChange={(value) => {
                setOtp(value);
                setError(null);
              }}
              resendLockMs={resendLockMs}
              onResend={handleResend}
              onEditNumber={() => {
                setStep('identifier');
                setOtp('');
                setError(null);
              }}
              editNumberLabel={t('auth.changeNumber', locale)}
              error={error ?? undefined}
              autoFocus
              locale={locale}
            />
            <Button block loading={busy} onClick={() => void handleVerify()}>
              {t('auth.verify', locale)}
            </Button>
          </>
        )}
      </div>
    </AuthShell>
  );
}