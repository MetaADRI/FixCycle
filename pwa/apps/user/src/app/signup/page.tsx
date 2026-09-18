'use client';

import { useCallback, useState } from 'react';

import type { CountryOption } from '@fixcycle/config';
import { Button } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { AuthShell } from '@/components/auth/auth-shell';
import { FormError, InputField, PasswordField } from '@/components/auth/fields';
import { PhoneField } from '@/components/auth/phone-field';
import { t } from '@/lib/i18n';
import { messageFromError } from '@/lib/auth-errors';
import { useAuth } from '@/lib/session';
import { useRuntime } from '@/lib/runtime-context';

function buildPhone(phonecode: string | undefined, number: string): string {
  const digits = number.replace(/\D/g, '');
  return `+${phonecode ?? ''}${digits}`;
}

export default function SignUpPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const { signUp } = useAuth();
  const router = useRouter();

  const locale = runtime.locale;

  const [country, setCountry] = useState<CountryOption | null>(null);
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fullPhone = buildPhone(country?.phonecode, phone);

  const handleRegister = useCallback(async (): Promise<void> => {
    setError(null);
    if (fullPhone.length < 8) {
      setError(t('auth.phoneRequired', locale));
      return;
    }
    if (firstName.trim().length === 0) {
      setError(t('auth.firstNameRequired', locale));
      return;
    }
    if (email.trim().length > 0 && !email.trim().includes('@')) {
      setError(t('auth.invalidEmail', locale));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordTooShort', locale));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch', locale));
      return;
    }
    setBusy(true);
    try {
      await signUp({
        isRegister: true,
        phone: fullPhone,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        email: email.trim() || undefined,
        password,
        countryId: country?.id,
      });
      router.replace('/login');
    } catch (err) {
      setError(messageFromError(err, t('auth.somethingWentWrong', locale)));
    } finally {
      setBusy(false);
    }
  }, [fullPhone, firstName, lastName, email, password, confirmPassword, country?.id, locale, signUp, router]);

  return (
    <AuthShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-extrabold text-[var(--fc-text-primary)]">
            {t('onboard.createAccount', locale)}
          </h2>
          <p className="text-sm text-[var(--fc-text-secondary)]">{t('signup.subtitle', locale)}</p>
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
            autoFocus
          />

          <InputField
            label={t('auth.firstName', locale)}
            value={firstName}
            onValueChange={(value) => {
              setFirstName(value);
              setError(null);
            }}
          />
          <InputField
            label={t('auth.lastName', locale)}
            value={lastName}
            onValueChange={(value) => {
              setLastName(value);
              setError(null);
            }}
          />

          <InputField
            label={`${t('auth.email', locale)} (${t('signup.optional', locale)})`}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onValueChange={(value) => {
              setEmail(value);
              setError(null);
            }}
          />

          <PasswordField
            label={t('auth.password', locale)}
            value={password}
            onValueChange={(value) => {
              setPassword(value);
              setError(null);
            }}
          />
          <PasswordField
            label={t('signup.confirmPassword', locale)}
            value={confirmPassword}
            onValueChange={(value) => {
              setConfirmPassword(value);
              setError(null);
            }}
          />

          <Button block loading={busy} onClick={() => void handleRegister()}>
            {t('auth.register', locale)}
          </Button>
        </div>

        <FormError message={error} />

        <div className="flex justify-center pt-1">
          <p className="text-sm text-[var(--fc-text-secondary)]">
            {t('auth.alreadyHaveAccount', locale)}{' '}
            <a href="/login" className="font-semibold text-[var(--fc-bg-secondary)]">
              {t('auth.signIn', locale)}
            </a>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}