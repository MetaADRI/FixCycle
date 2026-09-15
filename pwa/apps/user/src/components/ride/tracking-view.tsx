'use client';

import { Button, Icon } from '@fixcycle/ui';

import { RideMap, type MapCoordinate } from '@/components/ride/ride-map';
import { t } from '@/lib/i18n';
import { RIDE_STATUS_ACCEPTED, RIDE_STATUS_ARRIVED, RIDE_STATUS_TRIP, type RideFlow } from '@/lib/ride/use-ride';

export function TrackingView({ flow, locale }: { flow: RideFlow; locale: string }): React.ReactNode {
  const { details, tracking, driverLocation, ridePolyline, cancelable, openCancel, sendSos, changeDrop } = flow;

  const status = tracking?.bookingStatus ?? '';
  const driver = details?.driver;
  const statusLabel = status === RIDE_STATUS_TRIP ? t('ride.tripStarted', locale) : status === RIDE_STATUS_ARRIVED ? t('ride.driverArriving', locale) : status === RIDE_STATUS_ACCEPTED ? t('ride.driverAssigned', locale) : t('ride.driverEnRoute', locale);

  const center: MapCoordinate =
    driverLocation ??
    (details?.dropLatitude !== undefined && details?.dropLongitude !== undefined
      ? { lat: details.dropLatitude, lng: details.dropLongitude }
      : { lat: details?.pickupLatitude ?? 0, lng: details?.pickupLongitude ?? 0 });

  const markers = [];
  if (details?.pickupLatitude !== undefined && details?.pickupLongitude !== undefined) {
    markers.push({ id: 'pickup', kind: 'pickup' as const, lat: details.pickupLatitude, lng: details.pickupLongitude, label: details.pickupLocation ?? '' });
  }
  if (details?.dropLatitude !== undefined && details?.dropLongitude !== undefined) {
    markers.push({ id: 'drop', kind: 'drop' as const, lat: details.dropLatitude, lng: details.dropLongitude, label: details.dropLocation ?? '' });
  }
  if (driverLocation) {
    markers.push({ id: 'driver', kind: 'driver' as const, lat: driverLocation.lat, lng: driverLocation.lng, label: driver?.fullName ?? '' });
  }

  return (
    <div className="relative flex flex-col">
      <div className="relative h-[42vh] w-full overflow-hidden rounded-xl">
        <RideMap center={center} zoom={14} markers={markers} polyline={ridePolyline} className="h-full w-full" />
        <div className="absolute left-3 top-3 z-10 rounded-full bg-[var(--fc-surface)] px-3 py-1 text-xs font-semibold text-[var(--fc-text-primary)] shadow">
          {statusLabel}
        </div>
      </div>

      {driver ? (
        <div className="mx-4 -mt-6 z-10 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4 shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[var(--fc-surface)] text-[var(--fc-bg-secondary)]">
              {driver.profileImage ? (
                <img src={driver.profileImage} alt={driver.fullName ?? ''} className="h-full w-full object-cover" />
              ) : (
                <Icon name="user" size={26} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[var(--fc-text-primary)]">{driver.fullName ?? driver.firstName ?? t('ride.driver', locale)}</p>
              {driver.rating ? (
                <p className="flex items-center gap-1 text-xs text-[var(--fc-text-secondary)]">
                  <Icon name="star" size={14} className="fill-[var(--fc-warning)] text-[var(--fc-warning)]" /> {driver.rating}
                </p>
              ) : null}
            </div>
            <div className="text-right text-xs text-[var(--fc-text-secondary)]">
              {details?.vehiclePlate ? <p className="font-semibold text-[var(--fc-text-primary)]">{details.vehiclePlate}</p> : null}
              {details?.vehicleColor ? <p>{details.vehicleColor}</p> : null}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <ActionChip label={t('ride.call', locale)} icon="phone" onClick={() => driver.phoneNumber && window.location.assign(`tel:${driver.phoneNumber}`)} />
            <ActionChip label={t('ride.chat', locale)} icon="chat" onClick={() => undefined} />
            <ActionChip label={t('ride.share', locale)} icon="share" onClick={() => details?.shareAbleLink && void navigator.clipboard?.writeText(details.shareAbleLink).catch(() => undefined)} />
          </div>

          {(flow.hasSos ?? []).length > 0 ? (
            <Button
              variant="danger"
              block
              icon="sos"
              className="mt-3"
              onClick={() => void sendSos((flow.hasSos[0] as { number?: string })?.number ?? '')}
            >
              {t('ride.sos', locale)}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="mx-4 mt-4 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4 text-center text-sm text-[var(--fc-text-secondary)]">
          {t('ride.searchingForDriver', locale)}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <Button variant="ghost" icon="dest" onClick={() => void changeDrop(details?.dropLatitude ?? 0, details?.dropLongitude ?? 0, details?.dropLocation ?? '')}>
          {t('ride.changeDrop', locale)}
        </Button>
        {cancelable ? (
          <Button variant="danger" icon="close" onClick={() => void openCancel()}>
            {t('ride.cancel', locale)}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ActionChip({ label, icon, onClick }: { label: string; icon: 'phone' | 'chat' | 'share'; onClick: () => void }): React.ReactNode {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] py-2.5 text-[var(--fc-text-primary)]">
      <Icon name={icon} size={20} />
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}
