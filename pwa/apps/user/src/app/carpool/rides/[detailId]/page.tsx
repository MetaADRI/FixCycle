'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Icon, IconButton, Spinner, TopHeader } from '@fixcycle/ui';
import { useCarpool } from '@/lib/carpool/use-carpool';
import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

export default function CarpoolRideDetailPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ detailId: string }>();
  const carpool = useCarpool();
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (params.detailId) {
      void carpool.loadDetail(params.detailId);
    }
  }, [params.detailId]);

  const d = carpool.detail;
  const canCancel = !cancelled && d && (d.ride_status === 1 || d.ride_status === 2);

  const handleCancel = async () => {
    if (!d) return;
    const ok = await carpool.cancelRide(d.id);
    if (ok) {
      setCancelled(true);
      await carpool.loadDetail(d.id);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]">
      <TopHeader
        title={t('carpool.rideDetail', runtime.locale)}
        leading={
          <button type="button" aria-label={t('common.back', runtime.locale)} onClick={() => router.back()}>
            <IconButton icon="back" label={t('common.back', runtime.locale)} />
          </button>
        }
      />

      <main className="flex-1 px-4 pt-4 pb-24">
        {carpool.detailLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : !d ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <Icon name="carpool" size={32} className="text-[var(--fc-text-secondary)]" />
            <p className="text-sm text-[var(--fc-text-secondary)]">{t('carpool.noRides', runtime.locale)}</p>
            <Button variant="primary" onClick={() => router.push('/carpool/rides')}>
              {t('carpool.myRides', runtime.locale)}
            </Button>
          </div>
        ) : (
          <>
            {/* Header card */}
            <div className="mb-4 overflow-hidden rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)]">
              <div className="flex items-center justify-between bg-gradient-to-br from-[#6d2bbf] to-[#9859e0] p-4">
                <div>
                  <p className="text-base font-bold text-white">{d.driver_name}</p>
                  <p className="text-xs text-white/70">{d.ride_date}</p>
                </div>
                <span className="rounded-full bg-[var(--fc-surface)] px-2.5 py-0.5 text-xs font-semibold text-[var(--fc-text-primary)]">
                  {d.ride_status_text}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[var(--fc-text-secondary)]">{d.pickup_location}</p>
                  </div>
                  <Icon name="chevron-right" size={16} className="text-[var(--fc-primary)]" />
                  <div className="text-right">
                    <p className="text-[var(--fc-text-secondary)]">{d.drop_location}</p>
                  </div>
                </div>
                {d.vehicle && (
                  <div className="mt-3 border-t border-[var(--fc-border)] pt-2 text-xs text-[var(--fc-text-secondary)]">
                    {d.vehicle.make} {d.vehicle.model} Ã‚Â· {d.vehicle.color} Ã‚Â· {d.vehicle.number}
                  </div>
                )}
              </div>
            </div>

            {/* Booking summary */}
            <div className="mb-4 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--fc-text-secondary)]">{t('carpool.seats', runtime.locale)}</span>
                <span className="text-sm font-bold text-[var(--fc-text-primary)]">{d.booked_seats}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--fc-text-secondary)]">{t('carpool.totalAmount', runtime.locale)}</span>
                <span className="text-sm font-bold text-[var(--fc-text-primary)]">{d.formatted_amount || d.total_amount}</span>
              </div>
            </div>

            {/* Bill breakdown */}
            {d.bill && (d.bill.base_fare > 0 || d.bill.distance_charge > 0 || d.bill.total > 0) && (
              <div className="mb-4 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
                <p className="mb-2 text-xs font-semibold text-[var(--fc-text-secondary)]">Fare details</p>
                {d.bill.base_fare > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--fc-text-secondary)]">Base fare</span>
                    <span className="text-[var(--fc-text-primary)]">{d.bill.base_fare}</span>
                  </div>
                )}
                {d.bill.distance_charge > 0 && (
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-[var(--fc-text-secondary)]">Distance</span>
                    <span className="text-[var(--fc-text-primary)]">{d.bill.distance_charge}</span>
                  </div>
                )}
                {d.bill.tax > 0 && (
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-[var(--fc-text-secondary)]">{t('laundry.tax', runtime.locale)}</span>
                    <span className="text-[var(--fc-text-primary)]">{d.bill.tax}</span>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between border-t border-[var(--fc-border)] pt-2">
                  <span className="text-sm font-bold text-[var(--fc-text-primary)]">{t('carpool.totalAmount', runtime.locale)}</span>
                  <span className="text-base font-bold text-[var(--fc-primary)]">{d.bill.formatted || d.bill.total}</span>
                </div>
              </div>
            )}

            {carpool.error && <p className="mb-3 text-xs text-[var(--fc-error)]">{carpool.error}</p>}
          </>
        )}
      </main>

      {canCancel && (
        <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] -translate-x-1/2 border-t border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
          <Button variant="danger" onClick={() => void handleCancel()} className="w-full" disabled={carpool.cancelLoading}>
            {carpool.cancelLoading ? 'Cancelling...' : t('carpool.cancelRide', runtime.locale)}
          </Button>
        </div>
      )}
    </div>
  );
}