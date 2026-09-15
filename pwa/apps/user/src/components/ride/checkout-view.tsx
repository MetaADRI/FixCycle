'use client';

import { useState } from 'react';
import { Button, Icon } from '@fixcycle/ui';

import { t } from '@/lib/i18n';
import type { RideFlow } from '@/lib/ride/use-ride';

interface CheckoutViewProps {
  flow: RideFlow;
  locale: string;
}

export function CheckoutView({ flow, locale }: CheckoutViewProps): React.ReactNode {
  const {
    checkout,
    paymentMethods,
    paymentMethod,
    selectPayment,
    applyPromoCode,
    removePromoCode,
    noSeatCheck,
    setNoSeatCheck,
    babySeat,
    setBabySeat,
    wheelChair,
    setWheelChair,
    genderMatch,
    setGenderMatch,
    notes,
    setNotes,
    submitRide,
    activity,
    currency,
    rideMode,
    laterDate,
    laterTime,
  } = flow;

  return (
    <div className="flex flex-col gap-3">
      {rideMode === 'later' ? (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2.5 text-sm">
          <Icon name="clock" size={16} className="text-[var(--fc-primary)]" />
          <span className="font-semibold text-[var(--fc-text-primary)]">{t('ride.scheduledFor', locale)}</span>
          <span className="text-[var(--fc-text-secondary)]">
            {laterDate || t('ride.chooseDate', locale)} {laterTime ? `· ${laterTime}` : ''}
          </span>
        </div>
      ) : null}
      {checkout ? (
        <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
          <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('ride.fareSummary', locale)}</h2>
          <ul className="space-y-1.5">
            {(checkout.estimateReceipt ?? []).map((line, i) => (
              <li key={`${line.code ?? i}-${i}`} className="flex items-center justify-between text-sm">
                <span className="text-[var(--fc-text-secondary)]">{line.parameter ?? line.parameterType ?? '-'}</span>
                <span className="font-semibold text-[var(--fc-text-primary)]">{currency} {line.amount ?? '—'}</span>
              </li>
            ))}
            {checkout.estimateBill ? (
              <li className="mt-2 flex items-center justify-between border-t border-[var(--fc-border)] pt-2 text-sm font-bold">
                <span className="text-[var(--fc-text-primary)]">{t('ride.estimateFare', locale)}</span>
                <span className="text-[var(--fc-bg-secondary)]">{currency} {checkout.estimateBill}</span>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
        <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('ride.payment', locale)}</h2>
        <ul className="divide-y divide-[var(--fc-border)]">
          {paymentMethods.map((m) => {
            const active = paymentMethod?.id === m.id;
            return (
              <li key={m.id}>
                <button
                  onClick={() => void selectPayment(m)}
                  className="flex w-full items-center gap-3 py-3 text-left"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--fc-surface)] text-[var(--fc-text-secondary)]">
                    <Icon name={m.icon === 'card' ? 'card' : m.icon === 'wallet' ? 'wallet' : 'cash'} size={18} />
                  </span>
                  <span className="flex-1 text-sm font-medium text-[var(--fc-text-primary)]">{m.name}</span>
                  {active ? <Icon name="check" size={18} className="text-[var(--fc-bg-secondary)]" /> : <Icon name="chevron-right" size={18} className="text-[var(--fc-text-secondary)]" />}
                </button>
              </li>
            );
          })}
        </ul>
        <PromoRow flow={flow} locale={locale} />
      </section>

      <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
        <h2 className="mb-3 text-sm font-bold text-[var(--fc-text-primary)]">{t('ride.addNotes', locale)}</h2>
        <div className="space-y-2">
          <ToggleRow label={t('ride.babySeat', locale)} checked={babySeat} onChange={setBabySeat} />
          <ToggleRow label={t('ride.wheelChair', locale)} checked={wheelChair} onChange={setWheelChair} />
          <ToggleRow label={t('ride.genderMatch', locale)} checked={genderMatch} onChange={setGenderMatch} />
          <ToggleRow label={t('ride.noSeatCheck', locale)} checked={noSeatCheck} onChange={setNoSeatCheck} />
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('ride.notesPlaceholder', locale)}
          rows={2}
          className="mt-3 w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
        />
      </section>

      <Button block variant="primary" loading={activity === 'busy'} onClick={() => void submitRide()}>
        {t('ride.requestRide', locale)}
      </Button>
    </div>
  );
}

function PromoRow({ flow, locale }: { flow: RideFlow; locale: string }): React.ReactNode {
  const [promoOpen, setPromoOpen] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const applied = flow.checkout?.promoCode;
  return (
    <div className="border-t border-[var(--fc-border)] pt-3">
      {applied ? (
        <div className="flex items-center justify-between rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2">
          <span className="flex items-center gap-2 text-sm font-medium text-[var(--fc-text-primary)]">
            <Icon name="promo" size={16} className="text-[var(--fc-bg-secondary)]" /> {applied}
          </span>
          <button className="text-xs font-semibold text-[var(--fc-danger)]" onClick={() => void flow.removePromoCode()}>
            {t('ride.removePromo', locale)}
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => setPromoOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-[var(--fc-bg-secondary)]"
          >
            <Icon name="promo" size={16} /> {t('ride.promo', locale)}
          </button>
          {promoOpen ? (
            <div className="mt-2 flex items-center gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('ride.promoPlaceholder', locale)}
                className="flex-1 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm outline-none placeholder:text-[var(--fc-text-secondary)]"
              />
              <Button
                variant="secondary"
                loading={busy}
                onClick={() => {
                  setBusy(true);
                  void flow.applyPromoCode(code).finally(() => setBusy(false));
                }}
              >
                {t('ride.applyPromo', locale)}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }): React.ReactNode {
  return (
    <button onClick={() => onChange(!checked)} className="flex w-full items-center justify-between py-1">
      <span className="text-sm text-[var(--fc-text-primary)]">{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-[var(--fc-bg-secondary)]' : 'bg-[var(--fc-border)]'}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`}
        />
      </span>
    </button>
  );
}
