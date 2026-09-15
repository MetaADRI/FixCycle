'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { AppShell, Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { useRewards } from '@/lib/rewards/use-rewards';
import { useRuntime } from '@/lib/runtime-context';
import { useAuth } from '@/lib/session';
import { t } from '@/lib/i18n';

export default function RewardsPage(): ReactNode {
  const { runtime } = useRuntime();
  const { status } = useAuth();
  const router = useRouter();
  const rewards = useRewards();
  const locale = runtime.locale;

  const [redeemingPoints, setRedeemingPoints] = useState(false);
  const [redeemingGift, setRedeemingGift] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/on-board');
    }
  }, [status, router]);

  if (status !== 'signedIn') {
    return null;
  }

  const onRedeemPoints = async () => {
    if (!rewards.summary) return;
    setRedeemingPoints(true);
    setMessage('');
    const res = await rewards.redeemPoints({ points: rewards.summary.usableRewardPoints });
    setMessage(res.message);
    setRedeemingPoints(false);
  };

  const onRedeemGift = async (id: string) => {
    setRedeemingGift(id);
    setMessage('');
    const res = await rewards.redeemGift({ giftId: id });
    setMessage(res.message);
    setRedeemingGift(null);
  };

  return (
    <AppShell
      header={
        <TopHeader
          title={t('rewards.title', locale)}
          leading={
            <button type="button" aria-label={t('common.back', locale)} onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', locale)} />
            </button>
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        {rewards.summary ? (
          <div className="rounded-[var(--fc-radius-lg)] bg-gradient-to-br from-[#7a3ef0] to-[#5a2bd0] p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{t('rewards.points', locale)}</p>
            <p className="mt-1 text-3xl font-bold">{rewards.summary.rewardPoints}</p>
            <p className="mt-1 text-xs text-white/80">
              {t('rewards.usable', locale)}: {rewards.summary.usableRewardPoints}
            </p>
            <Button
              className="mt-4 bg-white/95 text-[#5a2bd0]"
              icon="check"
              loading={redeemingPoints}
              disabled={rewards.summary.usableRewardPoints <= 0}
              onClick={() => void onRedeemPoints()}
            >
              {t('rewards.redeemPoints', locale)}
            </Button>
          </div>
        ) : null}

        {message ? (
          <div
            role="status"
            className="rounded-[var(--fc-radius-md)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3 text-sm text-[var(--fc-text-primary)]"
          >
            {message}
          </div>
        ) : null}

        {rewards.loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" />
          </div>
        ) : (
          <>
            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--fc-text-secondary)]">{t('rewards.gifts', locale)}</h2>
              <ul className="grid grid-cols-2 gap-3">
                {rewards.gifts.map((gift) => (
                  <li key={gift.id} className="flex flex-col gap-2 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--fc-primary-soft)] text-[var(--fc-primary)]">
                      <Icon name="star" size={18} />
                    </span>
                    <p className="text-sm font-semibold text-[var(--fc-text-primary)]">{gift.name}</p>
                    <p className="text-xs text-[var(--fc-text-secondary)]">
                      {gift.requiredPoints} {t('rewards.points', locale)}
                    </p>
                    <Button
                      variant="secondary"
                      block
                      icon="check"
                      loading={redeemingGift === gift.id}
                      disabled={!gift.available}
                      onClick={() => void onRedeemGift(gift.id)}
                    >
                      {gift.available ? t('rewards.redeem', locale) : t('rewards.unavailable', locale)}
                    </Button>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--fc-text-secondary)]">{t('rewards.history', locale)}</h2>
              {rewards.history.length === 0 ? (
                <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-6 text-center text-sm text-[var(--fc-text-secondary)]">
                  {t('rewards.noHistory', locale)}
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {rewards.history.map((item) => (
                    <li key={item.id} className="flex items-center justify-between rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--fc-text-primary)]">{item.description || item.type}</p>
                        <p className="text-xs text-[var(--fc-text-secondary)]">{item.date}</p>
                      </div>
                      <span className={`text-sm font-bold ${item.points >= 0 ? 'text-[var(--fc-success)]' : 'text-[var(--fc-danger)]'}`}>
                        {item.points >= 0 ? '+' : ''}
                        {item.points}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}