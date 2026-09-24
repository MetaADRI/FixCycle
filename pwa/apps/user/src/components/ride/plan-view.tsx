'use client';

import { useCallback, useEffect, useState } from 'react';
import { searchPlaces, type OutstationResult, type OutstationVehicle, type PlaceOption, type RentalPackage, type RentalVehicle, type TransferPackage, type TransferVehicle, type PoolVehicle, type VehicleOption } from '@fixcycle/api-client';
import { Button, Icon, Spinner } from '@fixcycle/ui';

import { RideMap, type MapCoordinate } from '@/components/ride/ride-map';
import { api } from '@/lib/api';
import { t } from '@/lib/i18n';
import type { RideFlow, RidePlace } from '@/lib/ride/use-ride';

interface PlanViewProps {
  flow: RideFlow;
  locale: string;
  segmentSlug: string;
}

function toCoord(p: RidePlace | null): MapCoordinate | null {
  return p ? { lat: p.latitude, lng: p.longitude } : null;
}

export function PlanView({ flow, locale, segmentSlug }: PlanViewProps): React.ReactNode {
  const {
    pickup,
    setPickup,
    drop,
    setDrop,
    drivers,
    currency,
    rideMode,
    setRideMode,
    laterDate,
    setLaterDate,
    laterTime,
    setLaterTime,
    variant,
    setVariant,
    rentalVehicles,
    selectedRentalVehicle,
    selectedPackage,
    setSelectedPackage,
    selectRentalVehicle,
    loadRentalVehicles,
    outstationResult,
    selectedOutstationVehicle,
    selectOutstationVehicle,
    loadOutstation,
    tripWay,
    setTripWay,
    returnDate,
    setReturnDate,
    returnTime,
    setReturnTime,
    transferVehicles,
    selectedTransferVehicle,
    selectedTransferPackage,
    selectTransferVehicle,
    selectTransferPackage,
    loadTransfer,
    poolVehicles,
    selectedPoolVehicle,
    seatCount,
    setSeatCount,
    selectPoolVehicle,
    loadPool,
  } = flow;
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<PlaceOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  const center: MapCoordinate | null =
    toCoord(drop) ??
    toCoord(pickup) ??
    (drivers.length && drivers[0]?.currentLatitude !== undefined && drivers[0]?.currentLongitude !== undefined
      ? { lat: drivers[0].currentLatitude, lng: drivers[0].currentLongitude }
      : null);

  const markers = [
    ...(pickup ? [{ id: 'pickup', kind: 'pickup' as const, lat: pickup.latitude, lng: pickup.longitude, label: pickup.label }] : []),
    ...(drop ? [{ id: 'drop', kind: 'drop' as const, lat: drop.latitude, lng: drop.longitude, label: drop.label }] : []),
    ...drivers
      .filter((d) => d.currentLatitude !== undefined && d.currentLongitude !== undefined)
      .map((d, i) => ({ id: `driver-${d.id}-${i}`, kind: 'driver' as const, lat: d.currentLatitude as number, lng: d.currentLongitude as number, label: '' })),
  ];

  const runSearch = useCallback(
    async (keyword: string) => {
      setSearching(true);
      try {
        const loc = pickup ? `${pickup.latitude},${pickup.longitude}` : '0,0';
        const results = await searchPlaces(api, { keyword, location: loc });
        setPlaces(results.flatMap((g) => g.places));
      } catch {
        setPlaces([]);
      } finally {
        setSearching(false);
      }
    },
    [pickup],
  );

  useEffect(() => {
    if (searchOpen && query.trim().length > 0) {
      const delay = setTimeout(() => void runSearch(query.trim()), 350);
      return () => clearTimeout(delay);
    }
    if (searchOpen) setPlaces([]);
    return undefined;
  }, [query, searchOpen, runSearch]);

  const choosePickupFromCurrent = useCallback(async () => {
    setLocating(true);
    try {
      const { getCurrentPosition } = await import('@fixcycle/pwa-core');
      const coords = await getCurrentPosition({ timeoutMs: 8000 });
      const place: RidePlace = { latitude: coords.latitude, longitude: coords.longitude, label: t('ride.currentLocation', locale) };
      setPickup(place);
      void flow.loadCars(place);
      void flow.loadDrivers(place);
    } catch {
      setPickup(null);
    } finally {
      setLocating(false);
    }
  }, [flow, setPickup, locale]);

  const choosePickupOnMap = useCallback(
    (coord: MapCoordinate) => {
      const place: RidePlace = { latitude: coord.lat, longitude: coord.lng, label: t('ride.pickup', locale) };
      setPickup(place);
      void flow.loadCars(place);
      void flow.loadDrivers(place);
    },
    [flow, setPickup, locale],
  );

  const chooseDrop = useCallback(
    (p: PlaceOption) => {
      if (p.latitude !== undefined && p.longitude !== undefined) {
        setDrop({ latitude: Number(p.latitude), longitude: Number(p.longitude), label: p.mainText ?? p.description ?? '' });
      }
      setSearchOpen(false);
    },
    [setDrop],
  );

  const changeVariant = useCallback(
    (next: 'taxi' | 'rental' | 'outstation' | 'transfer' | 'pool') => {
      setVariant(next);
      if (next === 'rental') {
        void loadRentalVehicles(pickup ?? undefined);
      }
      if (next === 'outstation') {
        void loadOutstation(pickup ?? undefined);
      }
      if (next === 'transfer') {
        void loadTransfer(pickup ?? undefined);
      }
      if (next === 'pool') {
        void loadPool(pickup ?? undefined);
      }
    },
    [setVariant, loadRentalVehicles, loadOutstation, loadTransfer, loadPool, pickup],
  );

  const defaultCenter: MapCoordinate = { lat: 20.5937, lng: 78.9629 };

  if (!pickup) {
    return (
      <div className="flex h-full flex-col">
        <div className="relative flex-1">
          <RideMap center={center ?? defaultCenter} zoom={5} markers={markers} onMapClick={choosePickupOnMap} className="absolute inset-0" />
          <div className="absolute inset-x-0 top-4 z-10 flex justify-center">
            <Button variant="secondary" icon="loc" onClick={() => void choosePickupFromCurrent()} loading={locating} className="shadow-md">
              {t('ride.currentLocation', locale)}
            </Button>
          </div>
          <PickupPin label={t('ride.pickup', locale)} />
        </div>
        <p className="px-4 py-3 text-center text-sm text-[var(--fc-text-secondary)]">{t('ride.currentLocation', locale)}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="relative h-[36vh] w-full overflow-hidden rounded-xl">
        <RideMap center={toCoord(drop) ?? toCoord(pickup) ?? defaultCenter} markers={markers} onMapClick={choosePickupOnMap} className="h-full w-full" />
        <button
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--fc-surface)] text-[var(--fc-text-primary)] shadow-md active:opacity-80"
          aria-label={t('ride.currentLocation', locale)}
          onClick={() => void choosePickupFromCurrent()}
        >
          {locating ? <Spinner className="h-4 w-4" /> : <Icon name="loc" size={20} />}
        </button>
      </div>

      <div className="space-y-2 px-4 pt-3">
        <AddressRow icon="loc" label={t('ride.pickup', locale)} value={pickup.label} />
        <button onClick={() => setSearchOpen(true)} className="w-full text-left">
          <AddressRow icon="dest" label={t('ride.drop', locale)} value={drop?.label ?? t('ride.selectDrop', locale)} muted={!drop} />
        </button>
      </div>

      <VariantToggle variant={variant} onChange={changeVariant} locale={locale} />

      {variant === 'rental' ? (
        <div className="px-4 pt-3">
          <RentalSheet
            vehicles={rentalVehicles}
            selectedVehicle={selectedRentalVehicle}
            selectedPackage={selectedPackage}
            currency={currency}
            locale={locale}
            onSelectVehicle={selectRentalVehicle}
            onSelectPackage={setSelectedPackage}
            onContinue={() => {
              if (!selectedRentalVehicle) return;
              void flow.goToCheckout({
                id: String(selectedRentalVehicle.vehicleTypeId),
                name: selectedRentalVehicle.vehicleTypeName ?? '',
              } as VehicleOption);
            }}
            disabled={!drop}
            loading={flow.activity === 'busy'}
          />
        </div>
      ) : variant === 'outstation' ? (
        <div className="px-4 pt-3">
          <OutstationSheet
            result={outstationResult}
            selectedVehicle={selectedOutstationVehicle}
            currency={currency}
            locale={locale}
            tripWay={tripWay}
            setTripWay={setTripWay}
            returnDate={returnDate}
            setReturnDate={setReturnDate}
            returnTime={returnTime}
            setReturnTime={setReturnTime}
            onSelectVehicle={selectOutstationVehicle}
            onContinue={() => {
              if (!selectedOutstationVehicle) return;
              void flow.goToCheckout({
                id: String(selectedOutstationVehicle.vehicleTypeId),
                name: selectedOutstationVehicle.name,
              } as VehicleOption);
            }}
            disabled={!drop}
            loading={flow.activity === 'busy'}
          />
        </div>
      ) : variant === 'transfer' ? (
        <div className="px-4 pt-3">
          <TransferSheet
            vehicles={transferVehicles}
            selectedVehicle={selectedTransferVehicle}
            selectedPackage={selectedTransferPackage}
            currency={currency}
            locale={locale}
            onSelectVehicle={selectTransferVehicle}
            onSelectPackage={selectTransferPackage}
            onContinue={() => {
              if (!selectedTransferVehicle) return;
              void flow.goToCheckout({
                id: String(selectedTransferVehicle.vehicleTypeId),
                name: selectedTransferVehicle.vehicleTypeName ?? '',
              } as VehicleOption);
            }}
            disabled={!drop}
            loading={flow.activity === 'busy'}
          />
        </div>
      ) : variant === 'pool' ? (
        <div className="px-4 pt-3">
          <PoolSheet
            vehicles={poolVehicles}
            selectedVehicle={selectedPoolVehicle}
            seatCount={seatCount}
            currency={currency}
            locale={locale}
            onSelectVehicle={selectPoolVehicle}
            onSeatCountChange={setSeatCount}
            onContinue={() => {
              if (!selectedPoolVehicle) return;
              void flow.goToCheckout({
                id: String(selectedPoolVehicle.vehicleTypeId),
                name: selectedPoolVehicle.vehicleTypeName ?? '',
              } as VehicleOption);
            }}
            disabled={!drop}
            loading={flow.activity === 'busy'}
          />
        </div>
      ) : (
        <>
          <ScheduleControl
            rideMode={rideMode}
            setRideMode={setRideMode}
            laterDate={laterDate}
            setLaterDate={setLaterDate}
            laterTime={laterTime}
            setLaterTime={setLaterTime}
            locale={locale}
          />

          <div className="px-4 pt-3">
            {flow.vehicles.length === 0 ? (
              <div className="rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4 text-center text-sm text-[var(--fc-text-secondary)]">
                {flow.activity === 'busy' ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4" /> {t('ride.loading', locale)}
                  </span>
                ) : (
                  t('ride.noVehicles', locale)
                )}
              </div>
            ) : (
              <VehicleSheet vehicles={flow.vehicles} selected={flow.selectedVehicle} currency={currency} locale={locale} onSelect={(v) => void flow.goToCheckout(v)} disabled={!drop} />
            )}
          </div>

          <p className="px-4 pt-3 text-xs font-medium text-[var(--fc-text-secondary)]">
            {drivers.length > 0
              ? `${drivers.length} ${t('ride.nearbyDrivers', locale)}`
              : t('ride.noDrivers', locale)}
          </p>
        </>
      )}

      {searchOpen ? (
        <DropSearchOverlay
          query={query}
          setQuery={setQuery}
          places={places}
          searching={searching}
          locale={locale}
          onPick={chooseDrop}
          onClose={() => setSearchOpen(false)}
        />
      ) : null}
    </div>
  );
}

function PickupPin({ label }: { label: string }): React.ReactNode {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <svg width="46" height="46" viewBox="0 0 24 24" fill="#16a34a" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
        <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Z" />
        <circle cx="12" cy="9" r="2.6" fill="#fff" />
      </svg>
      <div className="mt-1 rounded-full bg-[var(--fc-surface)] px-2 py-0.5 text-center text-xs font-semibold text-[var(--fc-text-primary)] shadow">
        {label}
      </div>
    </div>
  );
}

function AddressRow({ icon, label, value, muted }: { icon: 'loc' | 'dest'; label: string; value: string; muted?: boolean }): React.ReactNode {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--fc-surface)] text-[var(--fc-text-secondary)]">
        <Icon name={icon} size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--fc-text-secondary)]">{label}</p>
        <p className={`truncate text-sm font-semibold ${muted ? 'text-[var(--fc-text-secondary)]' : 'text-[var(--fc-text-primary)]'}`}>{value}</p>
      </div>
    </div>
  );
}

function ScheduleControl({
  rideMode,
  setRideMode,
  laterDate,
  setLaterDate,
  laterTime,
  setLaterTime,
  locale,
}: {
  rideMode: 'now' | 'later';
  setRideMode: (m: 'now' | 'later') => void;
  laterDate: string;
  setLaterDate: (v: string) => void;
  laterTime: string;
  setLaterTime: (v: string) => void;
  locale: string;
}): React.ReactNode {
  return (
    <div className="px-4 pt-3">
      <div className="flex overflow-hidden rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)]">
        <button
          onClick={() => setRideMode('now')}
          className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
            rideMode === 'now' ? 'bg-[var(--fc-primary)] text-[var(--fc-on-primary)]' : 'text-[var(--fc-text-secondary)]'
          }`}
        >
          <Icon name="loc" size={16} />
          {t('ride.rideNow', locale)}
        </button>
        <button
          onClick={() => setRideMode('later')}
          className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
            rideMode === 'later' ? 'bg-[var(--fc-primary)] text-[var(--fc-on-primary)]' : 'text-[var(--fc-text-secondary)]'
          }`}
        >
          <Icon name="clock" size={16} />
          {t('ride.scheduleLater', locale)}
        </button>
      </div>

      {rideMode === 'later' ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--fc-text-secondary)]">
              {t('ride.laterDate', locale)}
            </span>
            <input
              type="date"
              value={laterDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setLaterDate(e.target.value)}
              className="bg-transparent text-sm font-semibold text-[var(--fc-text-primary)] outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--fc-text-secondary)]">
              {t('ride.laterTime', locale)}
            </span>
            <input
              type="time"
              value={laterTime}
              onChange={(e) => setLaterTime(e.target.value)}
              className="bg-transparent text-sm font-semibold text-[var(--fc-text-primary)] outline-none"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

function VariantToggle({ variant, onChange, locale }: { variant: 'taxi' | 'rental' | 'outstation' | 'transfer' | 'pool'; onChange: (v: 'taxi' | 'rental' | 'outstation' | 'transfer' | 'pool') => void; locale: string }): React.ReactNode {
  return (
    <div className="px-4 pt-3">
      <div className="flex overflow-hidden rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)]">
        <button
          onClick={() => onChange('taxi')}
          className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
            variant === 'taxi' ? 'bg-[var(--fc-primary)] text-[var(--fc-on-primary)]' : 'text-[var(--fc-text-secondary)]'
          }`}
        >
          <Icon name="taxi" size={16} />
          {t('ride.variantTaxi', locale)}
        </button>
        <button
          onClick={() => onChange('rental')}
          className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
            variant === 'rental' ? 'bg-[var(--fc-primary)] text-[var(--fc-on-primary)]' : 'text-[var(--fc-text-secondary)]'
          }`}
        >
          <Icon name="rental" size={16} />
          {t('ride.variantRental', locale)}
        </button>
        <button
          onClick={() => onChange('outstation')}
          className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
            variant === 'outstation' ? 'bg-[var(--fc-primary)] text-[var(--fc-on-primary)]' : 'text-[var(--fc-text-secondary)]'
          }`}
        >
          <Icon name="outstation" size={16} />
          {t('ride.variantOutstation', locale)}
        </button>
        <button
          onClick={() => onChange('transfer')}
          className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
            variant === 'transfer' ? 'bg-[var(--fc-primary)] text-[var(--fc-on-primary)]' : 'text-[var(--fc-text-secondary)]'
          }`}
        >
          <Icon name="transfer" size={16} />
          {t('ride.variantTransfer', locale)}
        </button>
        <button
          onClick={() => onChange('pool')}
          className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
            variant === 'pool' ? 'bg-[var(--fc-primary)] text-[var(--fc-on-primary)]' : 'text-[var(--fc-text-secondary)]'
          }`}
        >
          <Icon name="pool" size={16} />
          {t('ride.variantPool', locale)}
        </button>
      </div>
    </div>
  );
}

function RentalSheet({
  vehicles,
  selectedVehicle,
  selectedPackage,
  currency,
  locale,
  onSelectVehicle,
  onSelectPackage,
  onContinue,
  disabled,
  loading,
}: {
  vehicles: RentalVehicle[];
  selectedVehicle: RentalVehicle | null;
  selectedPackage: RentalPackage | null;
  currency: string;
  locale: string;
  onSelectVehicle: (v: RentalVehicle) => void;
  onSelectPackage: (p: RentalPackage) => void;
  onContinue: () => void;
  disabled: boolean;
  loading: boolean;
}): React.ReactNode {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)]">
      <div className="px-4 py-3">
        <h2 className="text-sm font-bold text-[var(--fc-text-primary)]">{t('ride.rentalHeading', locale)}</h2>
        <p className="text-xs text-[var(--fc-text-secondary)]">{t('ride.rentalSubtitle', locale)}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" /></div>
      ) : vehicles.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-[var(--fc-text-secondary)]">{t('ride.noVehicles', locale)}</p>
      ) : (
        <ul className="divide-y divide-[var(--fc-border)]">
          {vehicles.map((v) => {
            const active = selectedVehicle?.vehicleTypeId === v.vehicleTypeId;
            return (
              <li key={v.vehicleTypeId} className="px-4 py-3">
                <button
                  onClick={() => onSelectVehicle(v)}
                  disabled={disabled}
                  className={`flex w-full items-center gap-3 text-left ${active ? '' : 'active:opacity-80'}`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--fc-surface)] text-[var(--fc-bg-secondary)]">
                    <Icon name="taxi" size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--fc-text-primary)]">{v.vehicleTypeName}</p>
                  </div>
                  {active ? <Icon name="check" size={18} className="text-[var(--fc-primary)]" /> : null}
                </button>

                {active ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--fc-text-secondary)]">{t('ride.rentalChoosePackage', locale)}</p>
                    <div className="space-y-1">
                      {v.packages.map((p) => {
                        const pkgActive = selectedPackage?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => onSelectPackage(p)}
                            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${
                              pkgActive ? 'border-[var(--fc-primary)] bg-[var(--fc-surface)]' : 'border-[var(--fc-border)] bg-[var(--fc-surface)]'
                            }`}
                          >
                            <span className="text-sm font-medium text-[var(--fc-text-primary)]">{p.packageName}</span>
                            <span className="text-sm font-bold text-[var(--fc-bg-secondary)]">
                              {currency} {p.estimateFare !== undefined ? p.estimateFare : p.estimateFareText}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-[var(--fc-border)] px-4 py-3">
        <Button variant="primary" icon="check" onClick={onContinue} disabled={disabled || !selectedVehicle || !selectedPackage} className="w-full">
          {t('ride.rentalContinue', locale)}
        </Button>
        {disabled ? <p className="pt-2 text-center text-xs text-[var(--fc-text-secondary)]">{t('ride.selectDrop', locale)}</p> : null}
      </div>
    </div>
  );
}

function TransferSheet({
  vehicles,
  selectedVehicle,
  selectedPackage,
  currency,
  locale,
  onSelectVehicle,
  onSelectPackage,
  onContinue,
  disabled,
  loading,
}: {
  vehicles: TransferVehicle[];
  selectedVehicle: TransferVehicle | null;
  selectedPackage: TransferPackage | null;
  currency: string;
  locale: string;
  onSelectVehicle: (v: TransferVehicle) => void;
  onSelectPackage: (p: TransferPackage) => void;
  onContinue: () => void;
  disabled: boolean;
  loading: boolean;
}): React.ReactNode {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)]">
      <div className="px-4 py-3">
        <h2 className="text-sm font-bold text-[var(--fc-text-primary)]">{t('ride.transferHeading', locale)}</h2>
        <p className="text-xs text-[var(--fc-text-secondary)]">{t('ride.transferSubtitle', locale)}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" /></div>
      ) : vehicles.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-[var(--fc-text-secondary)]">{t('ride.noVehicles', locale)}</p>
      ) : (
        <ul className="divide-y divide-[var(--fc-border)]">
          {vehicles.map((v) => {
            const active = selectedVehicle?.vehicleTypeId === v.vehicleTypeId;
            return (
              <li key={v.vehicleTypeId} className="px-4 py-3">
                <button
                  onClick={() => onSelectVehicle(v)}
                  disabled={disabled}
                  className={`flex w-full items-center gap-3 text-left ${active ? '' : 'active:opacity-80'}`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--fc-surface)] text-[var(--fc-bg-secondary)]">
                    <Icon name="transfer" size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--fc-text-primary)]">{v.vehicleTypeName}</p>
                  </div>
                  {active ? <Icon name="check" size={18} className="text-[var(--fc-primary)]" /> : null}
                </button>

                {active ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--fc-text-secondary)]">{t('ride.transferChoosePackage', locale)}</p>
                    <div className="space-y-1">
                      {v.packages.map((p) => {
                        const pkgActive = selectedPackage?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => onSelectPackage(p)}
                            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${
                              pkgActive ? 'border-[var(--fc-primary)] bg-[var(--fc-surface)]' : 'border-[var(--fc-border)] bg-[var(--fc-surface)]'
                            }`}
                          >
                            <span className="text-sm font-medium text-[var(--fc-text-primary)]">{p.packageName}</span>
                            <span className="text-sm font-bold text-[var(--fc-bg-secondary)]">
                              {currency} {p.estimateFare !== undefined ? p.estimateFare : p.estimateFareText}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-[var(--fc-border)] px-4 py-3">
        <Button variant="primary" icon="check" onClick={onContinue} disabled={disabled || !selectedVehicle || !selectedPackage} className="w-full">
          {t('ride.transferContinue', locale)}
        </Button>
        {disabled ? <p className="pt-2 text-center text-xs text-[var(--fc-text-secondary)]">{t('ride.selectDrop', locale)}</p> : null}
      </div>
    </div>
  );
}

function PoolSheet({
  vehicles,
  selectedVehicle,
  seatCount,
  currency,
  locale,
  onSelectVehicle,
  onSeatCountChange,
  onContinue,
  disabled,
  loading,
}: {
  vehicles: PoolVehicle[];
  selectedVehicle: PoolVehicle | null;
  seatCount: number;
  currency: string;
  locale: string;
  onSelectVehicle: (v: PoolVehicle) => void;
  onSeatCountChange: (n: number) => void;
  onContinue: () => void;
  disabled: boolean;
  loading: boolean;
}): React.ReactNode {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)]">
      <div className="px-4 py-3">
        <h2 className="text-sm font-bold text-[var(--fc-text-primary)]">{t('ride.poolHeading', locale)}</h2>
        <p className="text-xs text-[var(--fc-text-secondary)]">{t('ride.poolSubtitle', locale)}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" /></div>
      ) : vehicles.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-[var(--fc-text-secondary)]">{t('ride.noVehicles', locale)}</p>
      ) : (
        <>
          <ul className="divide-y divide-[var(--fc-border)]">
            {vehicles.map((v) => {
              const active = selectedVehicle?.vehicleTypeId === v.vehicleTypeId;
              return (
                <li key={v.vehicleTypeId} className="px-4 py-3">
                  <button
                    onClick={() => onSelectVehicle(v)}
                    disabled={disabled}
                    className={`flex w-full items-center gap-3 text-left ${active ? '' : 'active:opacity-80'}`}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--fc-surface)] text-[var(--fc-bg-secondary)]">
                      <Icon name="pool" size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--fc-text-primary)]">{v.vehicleTypeName}</p>
                      {v.passengerSeatCapacity !== undefined && (
                        <p className="text-xs text-[var(--fc-text-secondary)]">{v.passengerSeatCapacity} {t('ride.poolSeats', locale)}</p>
                      )}
                    </div>
                    {v.rideFareText && <span className="text-sm font-bold text-[var(--fc-bg-secondary)]">{v.rideFareText}</span>}
                    {active ? <Icon name="check" size={18} className="text-[var(--fc-primary)]" /> : null}
                  </button>

                  {active ? (
                    <div className="mt-3 flex items-center gap-3">
                      <p className="text-sm font-medium text-[var(--fc-text-primary)]">{t('ride.poolRiders', locale)}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSeatCountChange(Math.max(1, seatCount - 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--fc-border)] bg-[var(--fc-surface)] text-[var(--fc-text-primary)] active:opacity-80"
                        >
                          -
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-bold text-[var(--fc-text-primary)]">{seatCount}</span>
                        <button
                          onClick={() => onSeatCountChange(Math.min(v.passengerSeatCapacity ?? 4, seatCount + 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--fc-border)] bg-[var(--fc-surface)] text-[var(--fc-text-primary)] active:opacity-80"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="border-t border-[var(--fc-border)] px-4 py-3">
        <Button variant="primary" icon="check" onClick={onContinue} disabled={disabled || !selectedVehicle || seatCount < 1} className="w-full">
          {t('ride.poolContinue', locale)}
        </Button>
        {disabled ? <p className="pt-2 text-center text-xs text-[var(--fc-text-secondary)]">{t('ride.selectDrop', locale)}</p> : null}
      </div>
    </div>
  );
}

function OutstationSheet({
  result,
  selectedVehicle,
  currency,
  locale,
  tripWay,
  setTripWay,
  returnDate,
  setReturnDate,
  returnTime,
  setReturnTime,
  onSelectVehicle,
  onContinue,
  disabled,
  loading,
}: {
  result: OutstationResult | null;
  selectedVehicle: OutstationVehicle | null;
  currency: string;
  locale: string;
  tripWay: 1 | 2;
  setTripWay: (v: 1 | 2) => void;
  returnDate: string;
  setReturnDate: (v: string) => void;
  returnTime: string;
  setReturnTime: (v: string) => void;
  onSelectVehicle: (v: OutstationVehicle) => void;
  onContinue: () => void;
  disabled: boolean;
  loading: boolean;
}): React.ReactNode {
  const roundTrip = tripWay === 2;
  const vehicles = (roundTrip ? result?.round : result?.single) ?? [];
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)]">
      <div className="px-4 py-3">
        <h2 className="text-sm font-bold text-[var(--fc-text-primary)]">{t('ride.outstationHeading', locale)}</h2>
        <p className="text-xs text-[var(--fc-text-secondary)]">{t('ride.outstationSubtitle', locale)}</p>
      </div>

      <div className="px-4 pb-3">
        <div className="flex overflow-hidden rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)]">
          <button
            onClick={() => setTripWay(1)}
            className={`flex flex-1 items-center justify-center gap-2 py-2 text-xs font-semibold transition-colors ${
              !roundTrip ? 'bg-[var(--fc-primary)] text-[var(--fc-on-primary)]' : 'text-[var(--fc-text-secondary)]'
            }`}
          >
            {t('ride.outstationOneWay', locale)}
          </button>
          <button
            onClick={() => setTripWay(2)}
            className={`flex flex-1 items-center justify-center gap-2 py-2 text-xs font-semibold transition-colors ${
              roundTrip ? 'bg-[var(--fc-primary)] text-[var(--fc-on-primary)]' : 'text-[var(--fc-text-secondary)]'
            }`}
          >
            {t('ride.outstationRoundTrip', locale)}
          </button>
        </div>
      </div>

      {roundTrip ? (
        <div className="space-y-2 px-4 pb-3">
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            disabled={disabled}
            className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none"
          />
          <input
            type="time"
            value={returnTime}
            onChange={(e) => setReturnTime(e.target.value)}
            disabled={disabled}
            className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none"
          />
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-8"><Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" /></div>
      ) : vehicles.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-[var(--fc-text-secondary)]">{t('ride.noVehicles', locale)}</p>
      ) : (
        <ul className="divide-y divide-[var(--fc-border)]">
          {vehicles.map((v) => {
            const active = selectedVehicle?.vehicleTypeId === v.vehicleTypeId;
            return (
              <li key={v.id} className="px-4 py-3">
                <button
                  onClick={() => onSelectVehicle(v)}
                  disabled={disabled}
                  className={`flex w-full items-center gap-3 text-left ${active ? '' : 'active:opacity-80'}`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--fc-surface)] text-[var(--fc-bg-secondary)]">
                    <Icon name="outstation" size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--fc-text-primary)]">{v.name}</p>
                    <p className="text-xs text-[var(--fc-text-secondary)]">
                      {roundTrip && v.estimateDistance ? `${v.estimateDistance} km` : v.packageName || ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--fc-bg-secondary)]">{currency} {Number(v.baseFareAmount)}</p>
                  </div>
                  {active ? <Icon name="check" size={18} className="ml-2 text-[var(--fc-primary)]" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-[var(--fc-border)] px-4 py-3">
        <Button
          variant="primary"
          icon="check"
          onClick={onContinue}
          disabled={disabled || !selectedVehicle || (roundTrip && (!returnDate || !returnTime))}
          className="w-full"
        >
          {t('ride.outstationContinue', locale)}
        </Button>
        {disabled ? <p className="pt-2 text-center text-xs text-[var(--fc-text-secondary)]">{t('ride.selectDrop', locale)}</p> : null}
      </div>
    </div>
  );
}

function VehicleSheet({
  vehicles,
  selected,
  currency,
  locale,
  onSelect,
  disabled,
}: {
  vehicles: VehicleOption[];
  selected: VehicleOption | null;
  currency: string;
  locale: string;
  onSelect: (v: VehicleOption) => void;
  disabled: boolean;
}): React.ReactNode {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)]">
      <div className="px-4 py-3">
        <h2 className="text-sm font-bold text-[var(--fc-text-primary)]">{t('ride.vehicles', locale)}</h2>
      </div>
      <ul className="divide-y divide-[var(--fc-border)]">
        {vehicles.map((v) => {
          const active = selected?.id === v.id;
          return (
            <li key={v.id}>
              <button
                onClick={() => onSelect(v)}
                disabled={disabled}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-[var(--fc-surface)] ${active ? 'bg-[var(--fc-surface)]' : ''}`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--fc-surface)] text-[var(--fc-bg-secondary)]">
                  <Icon name="taxi" size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--fc-text-primary)]">{v.name}</p>
                  {v.eta ? <p className="text-xs text-[var(--fc-text-secondary)]">{t('ride.eta', locale)} Ã‚Â· {v.eta} min</p> : null}
                </div>
                <div className="text-right">
                  {v.estimateFare ? (
                    <p className="text-sm font-bold text-[var(--fc-bg-secondary)]">
                      {currency} {v.estimateFare}
                    </p>
                  ) : (
                    <Icon name="chevron-right" size={18} className="text-[var(--fc-text-secondary)]" />
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      {disabled ? <p className="px-4 pb-3 text-xs text-[var(--fc-text-secondary)]">{t('ride.selectDrop', locale)}</p> : null}
    </div>
  );
}

function DropSearchOverlay({
  query,
  setQuery,
  places,
  searching,
  locale,
  onPick,
  onClose,
}: {
  query: string;
  setQuery: (q: string) => void;
  places: PlaceOption[];
  searching: boolean;
  locale: string;
  onPick: (p: PlaceOption) => void;
  onClose: () => void;
}): React.ReactNode {
  return (
    <div className="fixed inset-0 z-30 bg-black/40" onClick={onClose}>
      <div className="mx-auto flex h-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-col bg-[var(--fc-surface)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-[var(--fc-border)] px-3 py-3">
          <button onClick={onClose} aria-label={t('ride.back', locale)} className="text-[var(--fc-text-primary)]">
            <Icon name="back" size={22} />
          </button>
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2">
            <Icon name="search" size={18} className="text-[var(--fc-text-secondary)]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('ride.searchPlaceholder', locale)}
              className="flex-1 bg-transparent text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {searching ? (
            <div className="flex justify-center py-8"><Spinner className="h-6 w-6 text-[var(--fc-text-secondary)]" /></div>
          ) : places.length === 0 && query.trim().length > 0 ? (
            <p className="py-8 text-center text-sm text-[var(--fc-text-secondary)]">{t('home.noResults', locale)}</p>
          ) : (
            <ul className="divide-y divide-[var(--fc-border)]">
              {places.map((r, i) => (
                <li key={`${r.placeId ?? r.mainText}-${i}`}>
                  <button onClick={() => onPick(r)} className="flex w-full items-center gap-3 px-2 py-3 text-left">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--fc-surface-raised)] text-[var(--fc-text-secondary)]">
                      <Icon name="dest" size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-[var(--fc-text-primary)]">{r.mainText}</span>
                      {r.secondaryText ? <span className="block truncate text-xs text-[var(--fc-text-secondary)]">{r.secondaryText}</span> : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
