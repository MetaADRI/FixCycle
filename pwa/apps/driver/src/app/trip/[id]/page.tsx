'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter, useParams } from 'next/navigation';

import { AppShell, Button, Icon, Spinner, TopHeader } from '@fixcycle/ui';
import {
  driverArrivedAtPickup,
  driverBookingOrderPicked,
  driverEndBooking,
  fetchDriverDirection,
  fetchDriverPaymentInfo,
  driverConfirmPayment,
  driverCompleteBookingOrder,
} from '@fixcycle/api-client';
import type { DriverDirectionResult, DriverPaymentInfo } from '@fixcycle/api-client';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { useDriverSession } from '@/lib/session';
import { useDriver } from '@/lib/driver-context';
import { api } from '@/lib/api';
import { DriverMap } from '@/components/driver-map';

type TripStage =
  | 'to-pickup'
  | 'arrived'
  | 'picked-up'
  | 'end'
  | 'payment'
  | 'complete';

const STAGE_ICONS: Record<TripStage, 'navigate' | 'loc' | 'check' | 'close' | 'cash' | 'check'> = {
  'to-pickup': 'navigate',
  'arrived': 'loc',
  'picked-up': 'check',
  'end': 'close',
  'payment': 'cash',
  'complete': 'check',
};

export default function TripPage(): React.ReactNode {
  const { runtime } = useRuntime();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const bookingId = params.id as string;
  const { profile } = useDriverSession();
  const { activeTrip, setActiveTrip, location } = useDriver();
  const [stage, setStage] = useState<TripStage>('to-pickup');
  const [direction, setDirection] = useState<DriverDirectionResult | null>(null);
  const [payment, setPayment] = useState<DriverPaymentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Redirect if no active trip
  useEffect(() => {
    if (!activeTrip) {
      router.replace('/main');
    }
  }, [activeTrip, router]);

  // Fetch direction data when entering to-pickup
  useEffect(() => {
    if (stage !== 'to-pickup' || !activeTrip) return;
    const pickupLat = activeTrip.pickupLatitude ?? 18.9438;
    const pickupLng = activeTrip.pickupLongitude ?? 72.8246;
    const driverLat = location?.lat ?? pickupLat;
    const driverLng = location?.lng ?? pickupLng;
    void fetchDriverDirection(api, {
      pickupLatitude: driverLat,
      pickupLongitude: driverLng,
      dropLatitude: pickupLat,
      dropLongitude: pickupLng,
    }).then(setDirection).catch(() => {});
  }, [stage, activeTrip, location]);

  // Fetch payment info when entering payment stage
  useEffect(() => {
    if (stage !== 'payment' || !activeTrip) return;
    setLoadingPayment(true);
    void fetchDriverPaymentInfo(api, activeTrip.bookingOrderId)
      .then(setPayment)
      .catch(() => {})
      .finally(() => setLoadingPayment(false));
  }, [stage, activeTrip]);

  const handleArrived = useCallback(async (): Promise<void> => {
    if (!activeTrip) return;
    setLoading(true);
    try {
      await driverArrivedAtPickup(api, activeTrip.bookingOrderId);
      setStage('arrived');
    } catch { setStage('arrived'); } finally { setLoading(false); }
  }, [activeTrip]);

  const handlePickedUp = useCallback(async (): Promise<void> => {
    if (!activeTrip) return;
    setLoading(true);
    try {
      await driverBookingOrderPicked(api, activeTrip.bookingOrderId);
      setStage('picked-up');
    } catch { setStage('picked-up'); } finally { setLoading(false); }
  }, [activeTrip]);

  const handleEndTrip = useCallback(async (): Promise<void> => {
    if (!activeTrip) return;
    setLoading(true);
    try {
      await driverEndBooking(api, activeTrip.bookingOrderId);
      setStage('end');
      setStage('payment');
    } catch { setStage('payment'); } finally { setLoading(false); }
  }, [activeTrip]);

  const handleConfirmPayment = useCallback(async (): Promise<void> => {
    if (!activeTrip) return;
    setLoading(true);
    try {
      await driverConfirmPayment(api, { bookingOrderId: activeTrip.bookingOrderId, paymentBy: 'cash' });
      await driverCompleteBookingOrder(api, activeTrip.bookingOrderId);
      setStage('complete');
    } catch { setStage('complete'); } finally { setLoading(false); }
  }, [activeTrip]);

  const handleBackOnline = useCallback((): void => {
    setActiveTrip(null);
    router.replace('/main');
  }, [setActiveTrip, router]);

  if (!activeTrip) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--fc-surface)]">
        <Spinner className="h-6 w-6 text-[var(--fc-bg-secondary)]" />
      </div>
    );
  }

  const pickup = { lat: activeTrip.pickupLatitude ?? 0, lng: activeTrip.pickupLongitude ?? 0 };
  const drop = { lat: activeTrip.dropLatitude ?? 0, lng: activeTrip.dropLongitude ?? 0 };
  const stageLabels: Record<TripStage, string> = {
    'to-pickup': t('trip.toPickup', runtime.locale),
    'arrived': t('trip.arrived', runtime.locale),
    'picked-up': t('trip.picked', runtime.locale),
    'end': t('trip.end', runtime.locale),
    'payment': t('trip.payment', runtime.locale),
    'complete': t('trip.completed', runtime.locale),
  };

  return (
    <AppShell
      padded={false}
      header={
        <TopHeader
          title={stageLabels[stage]}
          leading={
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--fc-text-secondary)]"
            >
              <Icon name="back" size={20} />
            </button>
          }
        />
      }
    >
      {/* Map */}
      <div className="px-4 pt-4">
        <DriverMap
          encodedPolyline={direction?.encodedPolyline}
          driverLocation={location}
          pickupLocation={pickup}
          dropLocation={drop}
          height={200}
        />
      </div>

      {/* Booking info */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--fc-bg-secondary)] text-sm font-bold text-white">
              {activeTrip.userFirstName.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--fc-text-primary)]">{activeTrip.userFirstName}</p>
              <p className="truncate text-xs text-[var(--fc-text-secondary)]">{activeTrip.segmentName}</p>
            </div>
            <a
              href={`tel:${activeTrip.userPhone}`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--fc-surface-raised)] text-[var(--fc-bg-secondary)]"
            >
              <Icon name="phone" size={18} />
            </a>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Icon name="loc" size={14} className="mt-0.5 shrink-0 text-blue-500" />
              <span className="text-[var(--fc-text-primary)]">{activeTrip.pickupAddress}</span>
            </div>
            <div className="flex items-start gap-2">
              <Icon name="dest" size={14} className="mt-0.5 shrink-0 text-[var(--fc-danger)]" />
              <span className="text-[var(--fc-text-primary)]">{activeTrip.dropAddress}</span>
            </div>
          </div>
          {activeTrip.otp ? (
            <div className="mt-3 rounded-xl bg-[var(--fc-surface-raised)] p-2 text-center text-sm">
              <span className="text-[var(--fc-text-secondary)]">{t('trip.rideOtp', runtime.locale)}: </span>
              <span className="font-bold text-[var(--fc-bg-secondary)]">{activeTrip.otp}</span>
            </div>
          ) : null}
          {direction ? (
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs text-[var(--fc-text-secondary)]">
              <span>{direction.distanceText}</span>
              <span>{direction.durationText}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Stage action */}
      <div className="px-4 pt-6 pb-8">
        {stage === 'to-pickup' ? (
          <Button block loading={loading} onClick={() => void handleArrived()} icon="loc">
            {t('trip.arriveAtPickup', runtime.locale)}
          </Button>
        ) : stage === 'arrived' ? (
          <Button block loading={loading} onClick={() => void handlePickedUp()} icon="check">
            {t('trip.startTrip', runtime.locale)}
          </Button>
        ) : stage === 'picked-up' ? (
          <Button block loading={loading} onClick={() => void handleEndTrip()} icon="close">
            {t('trip.end', runtime.locale)}
          </Button>
        ) : stage === 'payment' ? (
          <div className="space-y-4">
            {loadingPayment ? (
              <div className="flex justify-center py-4"><Spinner className="h-5 w-5" /></div>
            ) : payment ? (
              <div className="rounded-2xl bg-[var(--fc-surface-raised)] p-4 text-center">
                <p className="text-sm text-[var(--fc-text-secondary)]">{t('trip.payment', runtime.locale)}</p>
                <p className="mt-1 text-3xl font-extrabold text-[var(--fc-text-primary)]">
                  {payment.currency}{payment.payableAmount}
                </p>
                {payment.paymentMethods.length > 0 ? (
                  <p className="mt-1 text-xs text-[var(--fc-text-secondary)]">
                    {payment.paymentMethods.join(', ')}
                  </p>
                ) : null}
              </div>
            ) : null}
            <Button block loading={loading} onClick={() => void handleConfirmPayment()} icon="check">
              {t('trip.confirmPayment', runtime.locale)}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-[var(--fc-success)]/10">
              <Icon name="check" size={36} className="text-[var(--fc-success)]" />
            </div>
            <h2 className="text-lg font-bold text-[var(--fc-text-primary)]">{t('trip.completed', runtime.locale)}</h2>
            <p className="text-sm text-[var(--fc-text-secondary)]">
              {t('trip.payment', runtime.locale)}: {payment?.currency}{payment?.payableAmount}
            </p>
            <Button block onClick={handleBackOnline} icon="refresh">
              {t('trip.backOnline', runtime.locale)}
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}