'use client';

import { useEffect, type ReactNode } from 'react';

import { AppShell, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { usePromotions } from '@/lib/promotions/use-promotions';
import { useRuntime } from '@/lib/runtime-context';
import { useAuth } from '@/lib/session';
import { t } from '@/lib/i18n';

export default function PromotionsPage(): ReactNode {
  const { runtime } = useRuntime();
  const { status } = useAuth();
  const router = useRouter();
  const promotions = usePromotions();
  const locale = runtime.locale;

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/on-board');
    }
  }, [status, router]);

  if (status !== 'signedIn') {
    return null;
  }

  return (
    <AppShell
      header={
        <TopHeader
          title={t('promotions.title', locale)}
          leading={
            <button type="button" aria-label={t('common.back', locale)} onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', locale)} />
            </button>
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        {promotions.loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" />
          </div>
        ) : promotions.promotions.length === 0 ? (
          <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-8 text-center">
            <Icon name="promo" size={32} className="mx-auto mb-2 text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('promotions.empty', locale)}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {promotions.promotions.map((promo) => (
              <li key={promo.id} className="flex flex-col gap-3 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-base font-bold text-[var(--fc-text-primary)]">{promo.title}</p>
                    {promo.description ? (
                      <p className="mt-0.5 text-xs leading-relaxed text-[var(--fc-text-secondary)]">{promo.description}</p>
                    ) : null}
                  </div>
                  {promo.image ? (
                    <img src={promo.image} alt={promo.title} className="h-12 w-12 shrink-0 rounded-[var(--fc-radius-md)] object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--fc-primary-soft)] text-[var(--fc-primary)]">
                      <Icon name="promo" size={20} />
                    </span>
                  )}
                </div>
                {promo.expiryDate ? (
                  <p className="text-[11px] text-[var(--fc-text-secondary)]">
                    {t('promotions.validUntil', locale)} {promo.expiryDate}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}