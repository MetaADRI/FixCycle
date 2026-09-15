'use client';

import { useCallback, useMemo, useState } from 'react';

import type { CountryOption } from '@fixcycle/config';
import { getCpfEnabled, getNetworkCodeVisibility, getReferralCodeMandatory, getRegisterOptions } from '@fixcycle/config';
import { Button } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { AuthShell } from '@/components/auth/auth-shell';
import { FormError, InputField, PasswordField } from '@/components/auth/fields';
import { OtpEntry } from '@/components/auth/otp-entry';
import { PhoneField } from '@/components/auth/phone-field';
import { t } from '@/lib/i18n';
import { messageFromError } from '@/lib/auth-errors';
import { useAuth } from '@/lib/session';
import { useRuntime } from '@/lib/runtime-context';

type Step = 'phone' | 'otp' | 'details';

function buildPhone(phonecode: string | undefined, number: string): string {
  const digits = number.replace(/\D/g, '');
  return `+${phonecode ?? ''}${digits}`;
}

export default function SignUpPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const { sendOtpFor, signUp } = useAuth();
  const router = useRouter();

  const registerOptions = useMemo(() => getRegisterOptions(runtime), [runtime]);
  const cpfEnabled = getCpfEnabled(runtime);
  const networkCodeVisibility = getNetworkCodeVisibility(runtime);
  const referralCodeMandatory = getReferralCodeMandatory(runtime);
  const locale = runtime.locale;

  const [step, setStep] = useState<Step>('phone');
  const [country, setCountry] = useState<CountryOption | null>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpLength, setOtpLength] = useState(6);
  const [otpHint, setOtpHint] = useState('');
  const [resendLockMs, setResendLockMs] = useState(60_000);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<string>('');
  const [smokerType, setSmokerType] = useState<string>('');
  const [cpf, setCpf] = useState('');
  const [networkCode, setNetworkCode] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fullPhone = buildPhone(country?.phonecode, phone);

  const handleSendCode = useCallback(async (): Promise<void> => {
    setError(null);
    if (fullPhone.length < 8) {
      setError(t('auth.phoneRequired', locale));
      return;
    }
    setBusy(true);
    try {
      const result = await sendOtpFor(1, 'PHONE', fullPhone);
      const prefilled = result.autoFill && result.otp ? result.otp : '';
      setOtp(prefilled);
      setOtpLength(Math.min(6, Math.max(4, prefilled.length > 0 ? prefilled.length : 6)));
      setOtpHint(`${t('auth.otpHint', locale)} · ${fullPhone}`);
      setResendLockMs(60_000);
      setStep('otp');
    } catch (err) {
      setError(messageFromError(err, t('auth.somethingWentWrong', locale)));
    } finally {
      setBusy(false);
    }
  }, [fullPhone, locale, sendOtpFor]);

  const handleVerifyOtp = useCallback(async (): Promise<void> => {
    setError(null);
    if (otp.trim().length < 4) {
      setError(t('auth.otpRequired', locale));
      return;
    }
    setStep('details');
  }, [otp, locale]);

  const handleSignUp = useCallback(async (): Promise<void> => {
    setError(null);
    if (firstName.trim().length === 0) {
      setError(t('auth.firstNameRequired', locale));
      return;
    }
    if (registerOptions.email && registerOptions.userEmailVisibility && email.trim().length === 0) {
      setError(t('auth.invalidEmail', locale));
      return;
    }
    if (registerOptions.smoker && smokerType === '') {
      setError(t('auth.smokerRequired', locale));
      return;
    }
    if (cpfEnabled && cpf.trim().length === 0) {
      setError(t('auth.cpfRequired', locale));
      return;
    }
    if (networkCodeVisibility && networkCode.trim().length === 0) {
      setError(t('auth.networkCodeRequired', locale));
      return;
    }
    if (referralCodeMandatory && referralCode.trim().length === 0) {
      setError(t('auth.referralCodeRequired', locale));
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
        loginOtp: otp.trim(),
        phone: fullPhone,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        password,
        countryId: country?.id,
        gender: gender || undefined,
        smokerType: smokerType || undefined,
        userCpfNumber: cpf.trim() || undefined,
        networkCode: networkCode.trim() || undefined,
        referralCode: referralCode.trim() || undefined,
      });
      router.replace('/home');
    } catch (err) {
      setError(messageFromError(err, t('auth.somethingWentWrong', locale)));
    } finally {
      setBusy(false);
    }
  }, [
    firstName, lastName, email, password, confirmPassword, gender, smokerType,
    cpf, networkCode, referralCode, otp, fullPhone, country?.id,
    registerOptions.email, registerOptions.userEmailVisibility, registerOptions.smoker,
    cpfEnabled, networkCodeVisibility, referralCodeMandatory, locale, signUp, router,
  ]);

  const genderOptions = useMemo(
    () => [
      { value: '1', label: t('signup.genderMale', locale) },
      { value: '2', label: t('signup.genderFemale', locale) },
    ],
    [locale],
  );

  const smokerOptions = useMemo(
    () => [
      { value: '1', label: t('signup.smoker', locale) },
      { value: '2', label: t('signup.nonSmoker', locale) },
    ],
    [locale],
  );

  return (
    <AuthShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-extrabold text-[var(--fc-text-primary)]">
            {t('onboard.createAccount', locale)}
          </h2>
          <p className="text-sm text-[var(--fc-text-secondary)]">{t('signup.subtitle', locale)}</p>
        </div>

        {step === 'phone' && (
          <>
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
                error={error ?? undefined}
                autoFocus
              />
              <Button block loading={busy} onClick={() => void handleSendCode()}>
                {t('auth.sendCode', locale)}
              </Button>
            </div>
            <div className="flex justify-center pt-1">
              <p className="text-sm text-[var(--fc-text-secondary)]">
                {t('auth.alreadyHaveAccount', locale)}{' '}
                <a href="/login" className="font-semibold text-[var(--fc-bg-secondary)]">
                  {t('auth.signIn', locale)}
                </a>
              </p>
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
              onValueChange={(value) => {
                setOtp(value);
                setError(null);
              }}
              resendLockMs={resendLockMs}
              onResend={() => void handleSendCode()}
              onEditNumber={() => {
                setStep('phone');
                setOtp('');
                setError(null);
              }}
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

        {step === 'details' && (
          <>
            <div className="flex flex-col gap-4">
              <InputField
                label={t('signup.firstName', locale)}
                value={firstName}
                onValueChange={(value) => { setFirstName(value); setError(null); }}
                error={error?.includes(t('auth.firstNameRequired', locale)) ? error : undefined}
                autoFocus
              />
              <InputField
                label={t('signup.lastName', locale)}
                value={lastName}
                onValueChange={setLastName}
              />

              {registerOptions.email && registerOptions.userEmailVisibility ? (
                <InputField
                  label={t('auth.email', locale)}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onValueChange={(value) => { setEmail(value); setError(null); }}
                />
              ) : null}

              {registerOptions.gender ? (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-[var(--fc-text-primary)]">
                    {t('signup.gender', locale)}
                  </span>
                  <div className="flex gap-2">
                    {genderOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => { setGender(option.value); setError(null); }}
                        className={`flex-1 rounded-[var(--fc-radius-sm)] border px-3 py-2 text-sm font-semibold transition-colors ${
                          gender === option.value
                            ? 'border-[var(--fc-bg-secondary)] bg-[var(--fc-bg-secondary)] text-white'
                            : 'border-[var(--fc-border)] text-[var(--fc-text-primary)]'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {registerOptions.smoker ? (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-[var(--fc-text-primary)]">
                    {t('signup.smoker', locale)}
                  </span>
                  <div className="flex gap-2">
                    {smokerOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => { setSmokerType(option.value); setError(null); }}
                        className={`flex-1 rounded-[var(--fc-radius-sm)] border px-3 py-2 text-sm font-semibold transition-colors ${
                          smokerType === option.value
                            ? 'border-[var(--fc-bg-secondary)] bg-[var(--fc-bg-secondary)] text-white'
                            : 'border-[var(--fc-border)] text-[var(--fc-text-primary)]'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {cpfEnabled ? (
                <InputField
                  label={t('auth.cpf', locale)}
                  inputMode="numeric"
                  value={cpf}
                  onValueChange={(value) => { setCpf(value.replace(/[^\d]/g, '')); setError(null); }}
                  maxLength={14}
                />
              ) : null}

              {networkCodeVisibility ? (
                <InputField
                  label={t('auth.networkCode', locale)}
                  value={networkCode}
                  onValueChange={(value) => { setNetworkCode(value); setError(null); }}
                />
              ) : null}

              {referralCodeMandatory ? (
                <InputField
                  label={t('auth.referralCode', locale)}
                  value={referralCode}
                  onValueChange={(value) => { setReferralCode(value); setError(null); }}
                />
              ) : null}

              <PasswordField
                label={t('auth.password', locale)}
                value={password}
                onValueChange={(value) => { setPassword(value); setError(null); }}
              />
              <PasswordField
                label={t('signup.confirmPassword', locale)}
                value={confirmPassword}
                onValueChange={(value) => { setConfirmPassword(value); setError(null); }}
                error={error?.includes(t('auth.passwordMismatch', locale)) ? error : undefined}
              />

              <Button block loading={busy} onClick={() => void handleSignUp()}>
                {t('auth.signUp', locale)}
              </Button>
            </div>
            <FormError message={error} />
          </>
        )}
      </div>
    </AuthShell>
  );
}