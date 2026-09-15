'use client';

import { Suspense, useCallback, useEffect } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useParams, useSearchParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useHandyman } from '@/lib/handyman/use-handyman';

function ProvidersInner(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ segmentId: string }>();
  const searchParams = useSearchParams();
  const segmentId = params?.segmentId ?? '6';
  const flow = useHandyman(segmentId);

  const serviceIdsRaw = searchParams.get('services') ?? '';

  useEffect(() => {
    if (!serviceIdsRaw) return;
    const ids = serviceIdsRaw.split(',').map(Number).filter(Boolean);
    const allServices = flow.services?.services ?? [];
    for (const id of ids) {
      if (!flow.selectedServiceIds.includes(id)) {
        flow.toggleService(id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceIdsRaw]);

  useEffect(() => {
    if (flow.selectedServiceIds.length > 0) {
      void flow.loadProviders(segmentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.selectedServiceIds.length]);

  const handleSelect = useCallback(
    async (providerId: number) => {
      await flow.openProvider(providerId, segmentId);
      router.push(`/handyman/${segmentId}/provider/${providerId}`);
    },
    [flow, segmentId, router],
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title="Available Handymen"
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 pb-6 pt-3">
        {flow.providersLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : flow.providers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <Icon name="user" size={28} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">No handymen found nearby</p>
            <Button variant="primary" onClick={() => router.back()}>
              {t('common.back', runtime.locale)}
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2 px-4">
            {flow.providers.map((p) => (
              <li key={p.id} className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
                <div className="flex items-start gap-3">
                  <img src={p.image || '/assets/phase-9/provider-avatar.svg'} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--fc-text-primary)]">
                      {p.first_name} {p.last_name}
                    </p>
                    {p.business_name ? (
                      <p className="text-xs text-[var(--fc-text-secondary)]">{p.business_name}</p>
                    ) : null}
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Icon name="star" size={12} className="text-[var(--fc-warning)]" />
                        <span className="text-xs font-semibold text-[var(--fc-text-primary)]">{p.rating_number}/5</span>
                      </div>
                      {p.distance ? (
                        <span className="flex items-center gap-1 text-xs text-[var(--fc-text-secondary)]">
                          <Icon name="loc" size={10} /> {p.distance}
                        </span>
                      ) : null}
                      {p.time_range ? (
                        <span className="flex items-center gap-1 text-xs text-[var(--fc-text-secondary)]">
                          <Icon name="clock" size={10} /> {p.time_range}
                        </span>
                      ) : null}
                    </div>
                    {p.services.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.services.map((s) => (
                          <span key={s.id} className="rounded-full bg-[var(--fc-border)]/50 px-2 py-0.5 text-[10px] font-semibold text-[var(--fc-text-secondary)]">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <Button variant="secondary" onClick={() => void handleSelect(p.id)}>
                    {t('handyman.selectProvider', runtime.locale)}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default function HandymanProvidersPage(): React.ReactNode {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-sm text-[var(--fc-text-secondary)]">{t('common.loading', 'en')}</div>}>
      <ProvidersInner />
    </Suspense>
  );
}
