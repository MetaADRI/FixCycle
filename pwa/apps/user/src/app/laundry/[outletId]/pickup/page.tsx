'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';

import { useParams, useRouter } from 'next/navigation';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useLaundry } from '@/lib/laundry/use-laundry';

const SERVICE_TYPES = [
  { id: 1, label: 'Home Delivery', icon: 'delivery' as const },
  { id: 6, label: 'Self Pickup', icon: 'loc' as const },
];

export default function LaundryPickupPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ outletId: string }>();
  const outletId = params?.outletId ?? '';
  const flow = useLaundry();

  const [serviceTypeId, setServiceTypeId] = useState<number>(1);
  const [dropLocation, setDropLocation] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void flow.loadCart(outletId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  useEffect(() => {
    if (!flow.cart) return;
    setServiceTypeId(flow.cart.service_type_id || 1);
    if (flow.cart.drop_location) setDropLocation(flow.cart.drop_location);
  }, [flow.cart?.cart_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async () => {
    setSaving(true);
    const ok = await flow.savePickup(outletId, {
      serviceTypeId,
      slotId: flow.selectedSlotId ?? undefined,
      dropLocation: serviceTypeId === 1 ? dropLocation.trim() : '',
    });
    setSaving(false);
    if (ok) router.push(`/laundry/${outletId}/checkout`);
  }, [flow, outletId, serviceTypeId, dropLocation, router]);

  const deliveryFee = serviceTypeId === 1 && flow.cart?.delivery_amount != null ? flow.cart.delivery_amount : 39;
  const showDeliveryFee = serviceTypeId === 1;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('laundry.pickup', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 pb-28 pt-3">
        <div className="flex flex-col gap-4 px-4">
          {/* Service type */}
          <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
            <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('laundry.homeDelivery', runtime.locale)}</h2>
            <div className="flex gap-2">
              {SERVICE_TYPES.map((opt) => {
                const active = serviceTypeId === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setServiceTypeId(opt.id)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-colors ${
                      active
                        ? 'border-[var(--fc-primary)] bg-[var(--fc-primary)]/5 text-[var(--fc-primary)]'
                        : 'border-[var(--fc-border)] bg-[var(--fc-surface)] text-[var(--fc-text-primary)]'
                    }`}
                  >
                    <Icon name={opt.icon} size={18} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {showDeliveryFee ? (
              <p className="mt-2 text-xs text-[var(--fc-text-secondary)]">
                {t('laundry.deliveryCharges', runtime.locale)} ₹{deliveryFee}
                <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-[var(--fc-success)]" style={{ verticalAlign: 'middle' }} />
              </p>
            ) : (
              <p className="mt-2 text-xs text-[var(--fc-text-secondary)]">No delivery charge · pick up from the outlet counter</p>
            )}
          </section>

          {/* Drop location */}
          {serviceTypeId === 1 ? (
            <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('laundry.dropLocation', runtime.locale)}</h2>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2">
                <Icon name="loc" size={16} className="shrink-0 text-[var(--fc-text-secondary)]" />
                <input
                  value={dropLocation}
                  onChange={(e) => setDropLocation(e.target.value)}
                  placeholder="Home / Office address"
                  className="w-full bg-transparent text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
                />
              </div>
            </section>
          ) : null}

          {/* Slot */}
          <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
            <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('laundry.selectSlot', runtime.locale)}</h2>
            {flow.slotsLoading && flow.slots == null ? (
              <div className="flex items-center justify-center py-6">
                <Spinner className="h-5 w-5" />
              </div>
            ) : flow.slots?.time_slots.length ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {flow.slots.time_slots.map((slot) => {
                  const active = flow.selectedSlotId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => flow.selectSlot(slot.id)}
                      className={`flex shrink-0 flex-col items-center rounded-xl border px-4 py-2 text-xs font-semibold transition-colors ${
                        active
                          ? 'border-[var(--fc-primary)] bg-[var(--fc-primary)]/10 text-[var(--fc-primary)]'
                          : 'border-[var(--fc-border)] bg-[var(--fc-surface)] text-[var(--fc-text-primary)]'
                      }`}
                    >
                      <span>{slot.date}</span>
                      <span>{slot.slot_time}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[var(--fc-text-secondary)]">No slots available</p>
            )}
          </section>

          {/* Cart summary */}
          <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--fc-text-secondary)]">
                {flow.cart?.total_quantity ?? 0} {t('laundry.itemsCount', runtime.locale)}
              </span>
              <span className="font-bold text-[var(--fc-text-primary)]">
                ₹{flow.cart?.final_amount?.toLocaleString('en-IN') ?? '0'}
              </span>
            </div>
          </section>

          {flow.error ? <p className="text-xs font-semibold text-[var(--fc-danger)]">{flow.error}</p> : null}

          <Button block variant="primary" loading={flow.cartLoading || saving} onClick={() => void handleSave()}>
            {t('laundry.checkout', runtime.locale)}
          </Button>
        </div>
      </main>
    </div>
  );
}