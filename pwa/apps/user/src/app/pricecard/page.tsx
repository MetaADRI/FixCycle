'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { AppShell, Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useRouter } from 'next/navigation';

import { usePriceCard } from '@/lib/pricecard/use-pricecard';
import { useRuntime } from '@/lib/runtime-context';
import { useAuth } from '@/lib/session';
import { t } from '@/lib/i18n';

const AREAS = ['Mumbai', 'Delhi', 'Bengaluru'];

export default function PriceCardPage(): ReactNode {
  const { runtime } = useRuntime();
  const { status } = useAuth();
  const router = useRouter();
  const pricecard = usePriceCard();
  const locale = runtime.locale;

  const [area, setAreaLocal] = useState('Mumbai');
  const [segmentId, setSegmentId] = useState(1);

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/on-board');
    }
  }, [status, router]);

  if (status !== 'signedIn') {
    return null;
  }

  const apply = () => {
    void pricecard.load({ area, segmentId });
  };

  return (
    <AppShell
      header={
        <TopHeader
          title={t('pricecard.title', locale)}
          leading={
            <button type="button" aria-label={t('common.back', locale)} onClick={() => router.back()}>
              <IconButton icon="back" label={t('common.back', locale)} />
            </button>
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('pricecard.selectArea', locale)}</label>
            <select
              value={area}
              onChange={(e) => setAreaLocal(e.target.value)}
              className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
            >
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--fc-text-primary)]">{t('pricecard.selectSegment', locale)}</label>
            <select
              value={segmentId}
              onChange={(e) => setSegmentId(Number(e.target.value))}
              className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2.5 text-sm text-[var(--fc-text-primary)]"
            >
              <option value={1}>{t('history.ride', locale)}</option>
              <option value={4}>{t('history.delivery', locale)}</option>
            </select>
          </div>
          <Button block icon="check" onClick={apply}>
            {t('pricecard.view', locale)}
          </Button>
        </div>

        {pricecard.loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" />
          </div>
        ) : pricecard.services.length === 0 ? (
          <div className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-8 text-center">
            <Icon name="card" size={32} className="mx-auto mb-2 text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('pricecard.empty', locale)}</p>
          </div>
        ) : (
          pricecard.services.map((service) => (
            <section key={service.serviceName} className="flex flex-col gap-2">
              <h2 className="text-sm font-bold text-[var(--fc-text-primary)]">{service.serviceName}</h2>
              {service.vehicleTypes.map((vehicle) => (
                <div key={vehicle.vehicleTypeName} className="rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--fc-text-primary)]">{vehicle.vehicleTypeName}</p>
                    {vehicle.vehicleTypeDescription ? (
                      <p className="text-xs text-[var(--fc-text-secondary)]">{vehicle.vehicleTypeDescription}</p>
                    ) : null}
                  </div>
                  <ul className="mt-2 flex flex-col gap-1">
                    {vehicle.priceCardValues.map((pricing, index) => (
                      <li key={index} className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-1 text-[var(--fc-text-secondary)]">
                          {pricing.pricingParameter === 'Base fare' ? <Icon name="cash" size={14} /> : <Icon name="clock" size={14} />}
                          {pricing.pricingParameter}
                        </span>
                        <span className="font-semibold text-[var(--fc-text-primary)]">{pricing.parameterPrice}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))
        )}
      </div>
    </AppShell>
  );
}