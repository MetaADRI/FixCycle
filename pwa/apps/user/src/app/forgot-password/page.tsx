'use client';

import { useCallback, useMemo, useState } from 'react';

import type { CountryOption } from '@fixcycle/config';
import { getLoginOptions } from '@fixcycle/config';
import { Button } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { AuthShell } from '@/components/auth/auth-shell';
import { FormError, PasswordField } from '@/components/auth/fields';
import { OtpEntry } from '@/components/auth/otp-entry';
import { PhoneField } from '@/components/auth/phone-field';
import { t } from '@/lib/i18n';
import { messageFromError } from '@/lib/auth-errors';
import { useAuth } from '@/lib/session';
import { useRuntime } from '@/lib/runtime-context';

type Step = 'phone' | 'otp' | 'password';

function buildPhone(phonecode: string | undefined, number: string): string {
  const digits = number.replace(/\D/g, '');
  return `+${phonecode ?? ''}${digits}`;
}

export default function ForgotPasswordPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const { sendOtpFor, resetPassword } = useAuth();
  const router = useRouter();

  const loginOptions = useMemo(() => getLoginOptions(runtime), [runtime]);
  const channel: 'PHONE' | 'EMAIL' = loginOptions.email && !loginOptions.phone ? 'EMAIL' : 'PHONE';
  const locale = runtime.locale;

  const [step, setStep] = useState<Step>('phone');
  const [country, setCountry] = useState<CountryOption | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [otpLength, setOtpLength] = useState(6);
  const [otpHint, setOtpHint] = useState('');
  const [resendLockMs, setResendLockMs] = useState(60_000);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      const result = await sendOtpFor(2, channel, fullIdentifier);
      const prefilled = result.autoFill && result.otp ? result.otp : '';
      setOtp(prefilled);
      setOtpLength(Math.min(6, Math.max(4, prefilled.length > 0 ? prefilled.length : 6)));
      setOtpHint(`${t('auth.otpHint', locale)} · ${fullIdentifier}`);
      setResendLockMs(60_000);
      setStep('otp');
    } catch (err) {
      setError(messageFromError(err, t('auth.somethingWentWrong', locale)));
    } finally {
      setBusy(false);
    }
  }, [channel, fullIdentifier, locale, sendOtpFor]);

  const handleVerifyOtp = useCallback(async (): Promise<void> => {
    setError(null);
    if (otp.trim().length < 4) {
      setError(t('auth.otpRequired', locale));
      return;
    }
    setStep('password');
  }, [otp, locale]);

  const handleReset = useCallback(async (): Promise<void> => {
    setError(null);
    if (newPassword.length < 6) {
      setError(t('auth.passwordTooShort', locale));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch', locale));
      return;
    }
    setBusy(true);
    try {
      await resetPassword(channel, newPassword, fullIdentifier);
      router.replace('/login');
    } catch (err) {
      setError(messageFromError(err, t('auth.somethingWentWrong', locale)));
    } finally {
      setBusy(false);
    }
  }, [newPassword, confirmPassword, fullIdentifier, otp, locale, resetPassword, router]);

  return (
    <AuthShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-extrabold text-[var(--fc-text-primary)]">
            {t('forgot.title', locale)}
          </h2>
          <p className="text-sm text-[var(--fc-text-secondary)]">{t('forgot.subtitle', locale)}</p>
        </div>

        {step === 'phone' && (
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
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[var(--fc-text-primary)]">
                    {t('auth.email', locale)}
                  </label>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={identifier}
                    onChange={(e) => { setIdentifier(e.target.value); setError(null); }}
                    autoFocus
                    className="min-h-[52px] rounded-[var(--fc-radius-md)] border border-[var(--fc-border)] bg-[var(--fc-surface)] px-4 text-sm text-[var(--fc-text-primary)] outline-none focus:border-[var(--fc-bg-secondary)]"
                  />
                </div>
              )}
              <Button block loading={busy} onClick={() => void handleSendCode()}>
                {t('auth.sendCode', locale)}
              </Button>
            </div>
            <div className="flex justify-center pt-1">
              <a href="/login" className="text-sm font-semibold text-[var(--fc-bg-secondary)]">
                {t('auth.backToLogin', locale)}
              </a>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <OtpEntry
              label={t('auth.otp', locale)}
              hint={otpHint}
              value={otp}
              maxLength={otpLength}
              onValueChange={(value) => { setOtp(value); setError(null); }}
              resendLockMs={resendLockMs}
              onResend={() => void handleSendCode()}
              onEditNumber={() => { setStep('phone'); setOtp(''); setError(null); }}
              editNumberLabel={t('auth.changeNumber', locale)}
              error={error ?? undefined}
              autoFocus
              locale={locale}
            />
            <Button block loading={busy} onClick={() => void handleVerifyOtp()}>
              {t('auth.verify', locale)}
            </Button>
          </>
        )}

        {step === 'password' && (
          <>
            <div className="flex flex-col gap-4">
              <PasswordField
                label={t('forgot.newPassword', locale)}
                value={newPassword}
                onValueChange={(value) => { setNewPassword(value); setError(null); }}
              />
              <PasswordField
                label={t('forgot.confirmPassword', locale)}
                value={confirmPassword}
                onValueChange={(value) => { setConfirmPassword(value); setError(null); }}
                error={error?.includes(t('auth.passwordMismatch', locale)) ? error : undefined}
              />
              <Button block loading={busy} onClick={() => void handleReset()}>
                {t('forgot.resetButton', locale)}
              </Button>
            </div>
            <FormError message={error} />
          </>
        )}
      </div>
    </AuthShell>
  );
}