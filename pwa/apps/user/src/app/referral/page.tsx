'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { AppShell, Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { useReferral } from '@/lib/referral/use-referral';
import { useRuntime } from '@/lib/runtime-context';
import { useAuth } from '@/lib/session';
import { t } from '@/lib/i18n';

export default function ReferralPage(): ReactNode {
  const { runtime } = useRuntime();
  const { status } = useAuth();
  const router = useRouter();
  const referral = useReferral();
  const locale = runtime.locale;

  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/on-board');
    }
  }, [status, router]);

  if (status !== 'signedIn') {
    return null;
  }

  async function share(): Promise<void> {
    const info = referral.referral;
    if (!info) return;
    const text = info.sharingText
      ? `${info.sharingText} Code: ${info.referCode}`
      : `${info.referHeading} — ${info.referExplanation} Code: ${info.referCode}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ text });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShareMessage(t('referral.codeCopied', locale));
      }
    } catch {
      // user dismissed share sheet
    }
  }

  return (
    <AppShell
      header={
        <TopHeader
          title={t('referral.title', locale)}
          leading={
            <button type="button" aria-label={t('common.back', locale)} onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', locale)} />
            </button>
          }
        />
      }
    >
      {referral.loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" />
        </div>
      ) : !referral.referral ? (
        <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-8 text-center">
          <Icon name="promo" size={32} className="mx-auto mb-2 text-[var(--fc-text-secondary)]" />
          <p className="text-sm text-[var(--fc-text-secondary)]">No referral available</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-[var(--fc-radius-lg)] bg-gradient-to-br from-[var(--fc-primary)] to-[var(--fc-bg-secondary)] p-6 text-white">
            <p className="text-xl font-bold">{referral.referral.referHeading}</p>
            <p className="mt-1 text-sm text-white/80">{referral.referral.referExplanation}</p>
            {referral.referral.referOffer ? (
              <p className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{referral.referral.referOffer}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-5 py-4">
            <div>
              <p className="text-xs text-[var(--fc-text-secondary)]">{t('referral.yourCode', locale)}</p>
              <p className="text-lg font-bold tracking-widest text-[var(--fc-text-primary)]">{referral.referral.referCode}</p>
            </div>
            <StatusChip status={referral.referral.referStatus} locale={locale} />
          </div>

          {referral.referral.startDate || referral.referral.endDate ? (
            <div className="flex justify-between rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-5 py-3 text-xs text-[var(--fc-text-secondary)]">
              <span>
                {t('referral.validFrom', locale)} {referral.referral.startDate || '--'}
              </span>
              <span>
                {t('referral.validTo', locale)} {referral.referral.endDate || '--'}
              </span>
            </div>
          ) : null}

          {shareMessage ? (
            <div
              role="status"
              className="rounded-[var(--fc-radius-md)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)]"
            >
              {shareMessage}
            </div>
          ) : null}

          <Button icon="share" onClick={() => void share()}>
            {t('referral.share', locale)}
          </Button>
        </div>
      )}
    </AppShell>
  );
}

function StatusChip({ status, locale }: { status: string; locale: string }): ReactNode {
  if (!status) return null;
  const active = status === '1' || status.toLowerCase() === 'active';
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        active ? 'bg-[var(--fc-primary-soft)] text-[var(--fc-primary)]' : 'bg-[var(--fc-warning)]/10 text-[var(--fc-warning)]'
      }`}
    >
      {active ? t('common.active', locale) : t('referral.inactive', locale)}
    </span>
  );
}