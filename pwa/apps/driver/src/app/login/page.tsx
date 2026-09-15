'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button, Icon, Spinner } from '@fixcycle/ui';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useDriverSession } from '@/lib/session';
import { sendDriverOtp } from '@fixcycle/api-client';
import { api } from '@/lib/api';

type LoginMode = 'password' | 'otp';

export default function LoginPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const { status, signInWithOtp, signInWithPassword, signInDemo } = useDriverSession();
  const [mode, setMode] = useState<LoginMode>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'signedIn') {
      router.replace('/on-board');
    }
  }, [status, router]);

  const handleSendOtp = useCallback(async (): Promise<void> => {
    if (!phone) return;
    setLoading(true);
    setError(null);
    try {
      const result = await sendDriverOtp(api, { phone });
      setOtpSent(true);
      if (result.defaultOtp) {
        setOtp(result.defaultOtp);
      }
    } catch {
      setError(t('login.invalidCredentials', runtime.locale));
    } finally {
      setLoading(false);
    }
  }, [phone, runtime.locale]);

  const handlePasswordLogin = useCallback(async (): Promise<void> => {
    if (!phone || !password) return;
    setLoading(true);
    setError(null);
    try {
      await signInWithPassword(phone, password);
    } catch {
      setError(t('login.invalidCredentials', runtime.locale));
    } finally {
      setLoading(false);
    }
  }, [phone, password, signInWithPassword, runtime.locale]);

  const handleOtpLogin = useCallback(async (): Promise<void> => {
    if (!phone || !otp) return;
    setLoading(true);
    setError(null);
    try {
      await signInWithOtp(phone, otp);
    } catch {
      setError(t('login.invalidCredentials', runtime.locale));
    } finally {
      setLoading(false);
    }
  }, [phone, otp, signInWithOtp, runtime.locale]);

  const handleDemo = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await signInDemo();
    } catch {
      setError(t('login.invalidCredentials', runtime.locale));
    } finally {
      setLoading(false);
    }
  }, [signInDemo, runtime.locale]);

  if (status === 'booting') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--fc-surface)]">
        <Spinner className="h-6 w-6 text-[var(--fc-bg-secondary)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)] px-6 pt-16 pb-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--fc-bg-secondary)]/10">
          <Icon name="taxi" size={36} className="text-[var(--fc-bg-secondary)]" />
        </div>
        <h1 className="text-xl font-extrabold text-[var(--fc-text-primary)]">
          {t('login.title', runtime.locale)}
        </h1>
        <p className="mt-2 text-sm text-[var(--fc-text-secondary)]">
          {t('login.welcome', runtime.locale)}
        </p>
      </div>

      {/* Tab switch */}
      <div className="mb-6 flex rounded-2xl bg-[var(--fc-surface-raised)] p-1">
        {(['password', 'otp'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => { setMode(tab); setOtpSent(false); setError(null); }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              mode === tab
                ? 'bg-[var(--fc-surface)] text-[var(--fc-text-primary)] shadow-sm'
                : 'text-[var(--fc-text-secondary)]'
            }`}
          >
            {tab === 'password' ? t('login.tabPassword', runtime.locale) : t('login.tabOtp', runtime.locale)}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-[var(--fc-danger)]/10 p-3 text-sm text-[var(--fc-danger)]">
          <Icon name="alert" size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="space-y-4">
        {/* Phone */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">
            {t('login.phone', runtime.locale)}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('login.phonePlaceholder', runtime.locale)}
            className="w-full rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)] placeholder:text-[var(--fc-text-secondary)] focus:border-[var(--fc-bg-secondary)] focus:outline-none"
          />
        </div>

        {mode === 'password' ? (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">
              {t('login.password', runtime.locale)}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.passwordPlaceholder', runtime.locale)}
              className="w-full rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)] placeholder:text-[var(--fc-text-secondary)] focus:border-[var(--fc-bg-secondary)] focus:outline-none"
            />
          </div>
        ) : (
          <>
            {!otpSent ? (
              <Button
                block
                loading={loading}
                onClick={() => void handleSendOtp()}
                disabled={!phone}
              >
                {t('login.sendOtp', runtime.locale)}
              </Button>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--fc-text-primary)]">
                  {t('login.otp', runtime.locale)}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder={t('login.otpHint', runtime.locale)}
                  className="w-full rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)] placeholder:text-[var(--fc-text-secondary)] focus:border-[var(--fc-bg-secondary)] focus:outline-none"
                />
              </div>
            )}
          </>
        )}

        {mode === 'password' ? (
          <Button
            block
            loading={loading}
            onClick={() => void handlePasswordLogin()}
            disabled={!phone || !password}
          >
            {t('login.login', runtime.locale)}
          </Button>
        ) : otpSent ? (
          <Button
            block
            loading={loading}
            onClick={() => void handleOtpLogin()}
            disabled={!otp}
          >
            {t('login.login', runtime.locale)}
          </Button>
        ) : null}
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--fc-border)]" />
        <span className="text-xs text-[var(--fc-text-secondary)]">or</span>
        <div className="h-px flex-1 bg-[var(--fc-border)]" />
      </div>

      <Button
        variant="secondary"
        block
        loading={loading}
        onClick={() => void handleDemo()}
        icon="taxi"
      >
        {t('login.demo', runtime.locale)}
      </Button>
      <p className="mt-2 text-center text-xs text-[var(--fc-text-secondary)]">
        {t('login.demoHint', runtime.locale)}
      </p>

      <div className="mt-auto pt-8 text-center">
        <p className="text-sm text-[var(--fc-text-secondary)]">
          {t('login.registerCta', runtime.locale)}{' '}
          <a href="/on-board" className="font-semibold text-[var(--fc-bg-secondary)]">
            {t('login.register', runtime.locale)}
          </a>
        </p>
      </div>
    </div>
  );
}