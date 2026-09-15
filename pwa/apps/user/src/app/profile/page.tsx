'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { AppShell, Button, Icon, IconButton, Spinner, StatusPill, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { useAccount } from '@/lib/account/use-account';
import { useRuntime } from '@/lib/runtime-context';
import { useAuth } from '@/lib/session';
import { t } from '@/lib/i18n';

type Section = 'view' | 'edit' | 'password' | 'documents' | 'delete';

export default function ProfilePage(): ReactNode {
  const { runtime } = useRuntime();
  const { status, user, signOut } = useAuth();
  const router = useRouter();
  const account = useAccount();
  const locale = runtime.locale;

  const [section, setSection] = useState<Section>('view');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [smokerType, setSmokerType] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [documentNumber, setDocumentNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/on-board');
    }
  }, [status, router]);

  useEffect(() => {
    const p = account.profile;
    if (p) {
      setFirstName(p.firstName);
      setLastName(p.lastName);
      setEmail(p.email);
      setPhone(p.phone);
      setGender(p.gender);
      setSmokerType(p.smokerType);
    }
  }, [account.profile]);

  if (status !== 'signedIn' || !user) {
    return null;
  }

  const profile = account.profile;

  const runSaveProfile = async () => {
    setBusy(true);
    setMessage('');
    const res = await account.saveProfile({ firstName, lastName, email, phone, smokerType, userGender: gender });
    setMessage(res.message);
    setBusy(false);
    if (res.success) setSection('view');
  };

  const runChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage(t('account.passwordMismatch', locale));
      return;
    }
    setBusy(true);
    setMessage('');
    const res = await account.updatePassword({ currentPassword, newPassword });
    setMessage(res.message);
    setBusy(false);
    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSection('view');
    }
  };

  const runSaveDocument = async () => {
    if (!documentNumber.trim()) return;
    setBusy(true);
    setMessage('');
    const res = await account.saveDocument({ documentId: 1, documentNumber: documentNumber.trim(), expiryDate: expiryDate || undefined });
    setMessage(res.message);
    setBusy(false);
    if (res.success) {
      setDocumentNumber('');
      setExpiryDate('');
    }
  };

  const runDelete = async () => {
    setBusy(true);
    setMessage('');
    const res = await account.removeAccount(reason ? { reason } : undefined);
    setMessage(res.message);
    setBusy(false);
    if (res.success) {
      await signOut();
      router.replace('/on-board');
    }
  };

  const navButton = (key: Section, label: string): ReactNode => (
    <button
      type="button"
      onClick={() => setSection(key)}
      className={`flex items-center justify-between rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm font-semibold text-[var(--fc-text-primary)] ${
        section === key ? 'ring-2 ring-[var(--fc-primary)]' : ''
      }`}
    >
      <span>{label}</span>
      <Icon name="chevron" size={18} className="text-[var(--fc-text-secondary)]" />
    </button>
  );

  return (
    <AppShell
      header={
        <TopHeader
          title={t('account.title', locale)}
          leading={
            <button type="button" aria-label={t('common.back', locale)} onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', locale)} />
            </button>
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--fc-primary-soft)] text-xl font-bold text-[var(--fc-primary)]">
              {(profile?.firstName || 'G').charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-[var(--fc-text-primary)]">
                {profile ? `${profile.firstName} ${profile.lastName}` : user.firstName}
              </p>
              <p className="truncate text-sm text-[var(--fc-text-secondary)]">{profile?.email || user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-[var(--fc-surface)] px-3 py-2">
              <p className="text-[11px] text-[var(--fc-text-secondary)]">{t('account.referralCode', locale)}</p>
              <p className="font-semibold text-[var(--fc-text-primary)]">{profile?.referralCode || '--'}</p>
            </div>
            <div className="rounded-xl bg-[var(--fc-surface)] px-3 py-2">
              <p className="text-[11px] text-[var(--fc-text-secondary)]">{t('wallet.balance', locale)}</p>
              <p className="font-semibold text-[var(--fc-text-primary)]">{profile?.walletBalance || user.walletBalance || '0'}</p>
            </div>
            <div className="col-span-2 rounded-xl bg-[var(--fc-surface)] px-3 py-2">
              <p className="text-[11px] text-[var(--fc-text-secondary)]">{t('account.memberSince', locale)}</p>
              <p className="font-semibold text-[var(--fc-text-primary)]">{profile?.raw?.['created_at'] ? String(profile.raw['created_at']) : '--'}</p>
            </div>
          </div>
          {account.loading ? (
            <Spinner className="h-5 w-5 self-center text-[var(--fc-text-secondary)]" />
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          {navButton('edit', t('account.editProfile', locale))}
          {navButton('password', t('account.changePassword', locale))}
          {navButton('documents', t('account.documents', locale))}
          {navButton('delete', t('account.deleteAccount', locale))}
        </div>

        {message ? (
          <div
            role="status"
            className="rounded-[var(--fc-radius-md)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)]"
          >
            {message}
          </div>
        ) : null}

        {section === 'edit' ? (
          <div className="flex flex-col gap-3 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('account.firstName', locale)}</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('account.lastName', locale)}</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('account.email', locale)}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                inputMode="email"
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('account.phone', locale)}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('account.gender', locale)}</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  aria-label={t('account.gender', locale)}
                  className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">Smoker</label>
                <select
                  value={smokerType}
                  onChange={(e) => setSmokerType(e.target.value)}
                  aria-label="Smoker type"
                  className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>
            <Button block loading={busy} onClick={() => void runSaveProfile()}>
              {t('account.save', locale)}
            </Button>
          </div>
        ) : null}

        {section === 'password' ? (
          <div className="flex flex-col gap-3 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('account.currentPassword', locale)}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('account.newPassword', locale)}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('account.confirmNewPassword', locale)}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
            </div>
            <Button block variant="primary" loading={busy} onClick={() => void runChangePassword()} disabled={!currentPassword || !newPassword || !confirmPassword}>
              {t('account.changePassword', locale)}
            </Button>
          </div>
        ) : null}

        {section === 'documents' ? (
          <div className="flex flex-col gap-3">
            {account.documents.length === 0 ? (
              <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-8 text-center">
                <Icon name="document" size={32} className="mx-auto mb-2 text-[var(--fc-text-secondary)]" />
                <p className="text-sm text-[var(--fc-text-secondary)]">{t('account.documentsEmpty', locale)}</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {account.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--fc-text-primary)]">{doc.documentName}</p>
                      <p className="truncate text-xs text-[var(--fc-text-secondary)]">
                        {doc.documentNumber} · {t('account.expiryDate', locale)}: {doc.expiryDate || '--'}
                      </p>
                    </div>
                    <StatusPill tone={doc.status === 'approved' ? 'success' : 'warning'}>
                      {doc.status === 'approved' ? t('account.documentStatusApproved', locale) : t('account.documentStatusPending', locale)}
                    </StatusPill>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col gap-3 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <label className="text-xs font-semibold text-[var(--fc-text-primary)]">{t('account.documentNumber', locale)}</label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
              <label className="text-xs font-semibold text-[var(--fc-text-primary)]">{t('account.expiryDate', locale)}</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
              />
              <Button block variant="secondary" loading={busy} onClick={() => void runSaveDocument()} disabled={!documentNumber.trim()}>
                {t('account.addDocument', locale)}
              </Button>
            </div>
          </div>
        ) : null}

        {section === 'delete' ? (
          <div className="flex flex-col gap-3 rounded-[var(--fc-radius-lg)] border border-[var(--fc-danger)]/30 bg-[var(--fc-danger)]/5 p-4">
            <p className="text-sm font-semibold text-[var(--fc-text-primary)]">{t('account.deleteAccount', locale)}</p>
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('account.deleteAccountConfirm', locale)}</p>
            <label className="text-xs font-semibold text-[var(--fc-text-primary)]">{t('account.reason', locale)}</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
            />
            <div className="flex gap-2">
              <Button variant="secondary" block onClick={() => setSection('view')}>
                {t('account.cancel', locale)}
              </Button>
              <Button variant="danger" block loading={busy} onClick={() => void runDelete()}>
                {t('account.delete', locale)}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}