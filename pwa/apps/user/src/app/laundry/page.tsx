'use client';

import { useEffect } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useLaundry } from '@/lib/laundry/use-laundry';

const IMG_FALLBACK = '/assets/phase-10/outlet-default.svg';

export default function LaundryHomePage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const flow = useLaundry();

  useEffect(() => {
    void flow.loadOutlets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const popular = flow.outlets.slice(0, 3);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('laundry.home', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 pb-16 pt-3">
        {/* Banner */}
        <section className="mx-4 mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#223a6b] to-[#33508f] p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#17b26a]" />
            <span className="text-xs font-semibold text-[#17b26a]">Available now</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Icon name="laundry" size={40} className="text-white" />
            <div>
              <h1 className="text-base font-bold text-white">{t('laundry.home', runtime.locale)}</h1>
              <p className="text-xs text-white/70">Wash, dry clean and ironing at your doorstep</p>
            </div>
          </div>
        </section>

        {flow.outletsLoading && flow.outlets.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : flow.error && flow.outlets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="alert" size={28} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{flow.error}</p>
            <Button variant="primary" onClick={() => void flow.loadOutlets()}>
              {t('common.retry', runtime.locale)}
            </Button>
          </div>
        ) : (
          <>
            {/* Popular outlets */}
            {popular.length > 0 ? (
              <section className="mb-5">
                <h2 className="mb-2 px-4 text-sm font-bold text-[var(--fc-text-primary)]">{t('laundry.popular', runtime.locale)}</h2>
                <div className="flex gap-3 overflow-x-auto px-4 pb-1">
                  {popular.map((outlet) => (
                    <button
                      key={outlet.id}
                      onClick={() => router.push(`/laundry/${outlet.id}`)}
                      className="shrink-0 overflow-hidden rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] text-left"
                    >
                      <img
                        src={outlet.image || IMG_FALLBACK}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.src = IMG_FALLBACK;
                        }}
                        className="h-24 w-40 object-cover"
                      />
                      <div className="p-3">
                        <p className="truncate text-sm font-bold text-[var(--fc-text-primary)]">{outlet.full_name}</p>
                        <p className="flex items-center gap-1 text-xs text-[var(--fc-text-secondary)]">
                          <Icon name="star" size={12} className="text-[var(--fc-warning)]" />
                          {outlet.rating}
                          <span className="text-[var(--fc-border-strong)]">·</span>
                          {outlet.distance}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {/* All outlets */}
            <section>
              <h2 className="mb-2 px-4 text-sm font-bold text-[var(--fc-text-primary)]">{t('laundry.outlets', runtime.locale)}</h2>
              <ul className="flex flex-col gap-2 px-4">
                {flow.outlets.map((outlet) => (
                  <li key={outlet.id}>
                    <button
                      onClick={() => router.push(`/laundry/${outlet.id}`)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-3 text-left"
                    >
                      <img
                        src={outlet.image || IMG_FALLBACK}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.src = IMG_FALLBACK;
                        }}
                        className="h-14 w-14 shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[var(--fc-text-primary)]">{outlet.full_name}</p>
                        <p className="truncate text-xs text-[var(--fc-text-secondary)]">{outlet.address}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-1 font-semibold text-[var(--fc-text-primary)]">
                            <Icon name="star" size={12} className="text-[var(--fc-warning)]" />
                            {outlet.rating}
                          </span>
                          <span className="text-[var(--fc-border-strong)]">·</span>
                          <span className="text-[var(--fc-text-secondary)]">{outlet.distance}</span>
                          {outlet.is_outlet_open ? (
                            <span className="ml-auto flex items-center gap-1 text-[var(--fc-success)]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--fc-success)]" />
                              Open
                            </span>
                          ) : (
                            <span className="ml-auto flex items-center gap-1 text-[var(--fc-danger)]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--fc-danger)]" />
                              Closed
                            </span>
                          )}
                        </div>
                      </div>
                      <Icon name="chevron" size={16} className="shrink-0 text-[var(--fc-text-secondary)]" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}