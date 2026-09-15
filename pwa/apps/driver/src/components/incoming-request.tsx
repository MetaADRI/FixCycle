'use client';

import { useEffect, useState } from 'react';

import { Button, Icon, Spinner } from '@fixcycle/ui';
import type { DriverBooking } from '@fixcycle/api-client';

import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';
import { formatDistance } from '@/lib/polyline';

interface IncomingRequestProps {
  booking: DriverBooking;
  driverLocation: { lat: number; lng: number } | null;
  onAccept: (booking: DriverBooking) => void;
  onDecline: (booking: DriverBooking) => void;
}

function estimateDistanceMeters(
  from: { lat: number; lng: number } | null,
  to: { lat: number; lng: number } | undefined,
): number {
  if (!from || !to) {
    return 2400;
  }
  const R = 6371000;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function IncomingRequest({
  booking,
  driverLocation,
  onAccept,
  onDecline,
}: IncomingRequestProps): React.ReactNode {
  const { runtime } = useRuntime();
  const [remaining, setRemaining] = useState(25);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          onDecline(booking);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [booking, onDecline]);

  const distance = estimateDistanceMeters(driverLocation, {
    lat: booking.pickupLatitude ?? 0,
    lng: booking.pickupLongitude ?? 0,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 pb-8 sm:items-center">
      <div className="w-full max-w-sm rounded-t-3xl bg-[var(--fc-surface)] p-6 shadow-2xl ring-1 ring-black/5 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="bell" size={18} className="text-[var(--fc-bg-secondary)]" />
            <span className="text-sm font-bold text-[var(--fc-bg-secondary)]">
              {t('request.newRequest', runtime.locale)}
            </span>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fc-bg-secondary)]/10 text-xs font-bold text-[var(--fc-bg-secondary)]">
            {remaining}s
          </span>
        </div>

        <div className="mb-5 rounded-2xl bg-[var(--fc-surface-raised)] p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--fc-bg-secondary)] text-sm font-bold text-white">
              {booking.userFirstName.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--fc-text-primary)]">
                {booking.userFirstName}
              </p>
              <p className="truncate text-xs text-[var(--fc-text-secondary)]">{booking.segmentName}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <Icon name="loc" size={16} className="mt-0.5 shrink-0 text-blue-500" />
              <span className="text-[var(--fc-text-primary)]">{booking.pickupAddress}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Icon name="dest" size={16} className="mt-0.5 shrink-0 text-[var(--fc-danger)]" />
              <span className="text-[var(--fc-text-primary)]">{booking.dropAddress}</span>
            </div>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-[var(--fc-surface-raised)] p-3 text-center">
            <p className="text-lg font-bold text-[var(--fc-text-primary)]">{formatDistance(distance)}</p>
            <p className="text-[10px] text-[var(--fc-text-secondary)]">{t('request.distance', runtime.locale)}</p>
          </div>
          <div className="rounded-xl bg-[var(--fc-surface-raised)] p-3 text-center">
            <p className="text-lg font-bold text-[var(--fc-bg-secondary)]">
              {booking.currency}
              {booking.amount}
            </p>
            <p className="text-[10px] text-[var(--fc-text-secondary)]">{t('request.amount', runtime.locale)}</p>
          </div>
          <div className="rounded-xl bg-[var(--fc-surface-raised)] p-3 text-center">
            <p className="text-lg font-bold text-[var(--fc-text-primary)]">
              ~{Math.round(distance / 1000 * 3 + 5)}m
            </p>
            <p className="text-[10px] text-[var(--fc-text-secondary)]">{t('request.eta', runtime.locale)}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="danger"
            className="flex-1"
            icon="close"
            onClick={() => onDecline(booking)}
          >
            {t('request.reject', runtime.locale)}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            icon="check"
            onClick={() => onAccept(booking)}
          >
            {t('request.accept', runtime.locale)}
          </Button>
        </div>
      </div>
    </div>
  );
}