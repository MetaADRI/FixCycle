'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addTip,
  applyPromo,
  cancelBooking,
  changeDropAddress,
  confirmBooking,
  fetchBookingDetails,
  fetchCancelReasons,
  fetchCheckout,
  fetchCheckoutAdditionalInfo,
  fetchCheckoutPayment,
  fetchCars,
  fetchDrivers,
  fetchPaymentOptions,
  fetchPendingBookingApprovals,
  fetchOutstationDetails,
  fetchReceipt,
  fetchRentalCars,
  fetchTracking,
  fetchTransferDetails,
  fetchPoolDetails,
  fetchCheckSeats,
  rateDriver,
  removePromo,
  requestSos,
} from '@fixcycle/api-client';
import type {
  BookingDetails,
  CancelReasonsResult,
  CarsResult,
  CheckoutResult,
  NearbyDriver,
  OutstationResult,
  OutstationVehicle,
  PaymentMethodOption,
  PendingBooking,
  ReceiptResult,
  RentalPackage,
  RentalVehicle,
  TrackingUpdate,
  TransferPackage,
  TransferVehicle,
  PoolVehicle,
  VehicleOption,
} from '@fixcycle/api-client';

import type { MapCoordinate } from '@/components/ride/ride-map';
import { decodePolyline } from '@/components/ride/ride-map';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/session';

export const RIDE_STATUS_SEARCHING = '1001';
export const RIDE_STATUS_ACCEPTED = '1002';
export const RIDE_STATUS_ARRIVED = '1003';
export const RIDE_STATUS_TRIP = '1004';
export const RIDE_STATUS_DONE = '1005';

export interface RidePlace {
  latitude: number;
  longitude: number;
  label: string;
}

export type RideView = 'plan' | 'checkout' | 'searching' | 'tracking' | 'receipt' | 'rate' | 'cancel' | 'scheduled';

type Activity = 'idle' | 'busy' | 'error';

export interface RideError {
  message: string;
}

export type RideFlow = ReturnType<typeof useRideFlow>;

export function useRideFlow(params: { segmentId: string; areaId: string }) {
  const { user } = useAuth();
  const [view, setView] = useState<RideView>('plan');

  const [activity, setActivity] = useState<Activity>('idle');
  const [error, setError] = useState<RideError | null>(null);

  const [pickup, setPickup] = useState<RidePlace | null>(null);
  const [drop, setDrop] = useState<RidePlace | null>(null);
  const [dropPoints, setDropPoints] = useState<
    { latitude: string; longitude: string; location: string }[]
  >([]);

  const [cars, setCars] = useState<CarsResult | null>(null);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);
  const [drivers, setDrivers] = useState<NearbyDriver[]>([]);

  const [checkout, setCheckout] = useState<CheckoutResult | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodOption | null>(null);

  const [noSeatCheck, setNoSeatCheck] = useState<boolean>(false);
  const [babySeat, setBabySeat] = useState<boolean>(false);
  const [wheelChair, setWheelChair] = useState<boolean>(false);
  const [genderMatch, setGenderMatch] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  const [rideMode, setRideMode] = useState<'now' | 'later'>('now');
  const [laterDate, setLaterDate] = useState<string>('');
  const [laterTime, setLaterTime] = useState<string>('');
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);

  const [variant, setVariant] = useState<'taxi' | 'rental' | 'outstation' | 'transfer' | 'pool'>('taxi');
  const [rentalVehicles, setRentalVehicles] = useState<RentalVehicle[]>([]);
  const [selectedRentalVehicle, setSelectedRentalVehicle] = useState<RentalVehicle | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<RentalPackage | null>(null);
  const [outstationResult, setOutstationResult] = useState<OutstationResult | null>(null);
  const [selectedOutstationVehicle, setSelectedOutstationVehicle] = useState<OutstationVehicle | null>(null);
  const [tripWay, setTripWay] = useState<1 | 2>(1);
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [transferVehicles, setTransferVehicles] = useState<TransferVehicle[]>([]);
  const [selectedTransferVehicle, setSelectedTransferVehicle] = useState<TransferVehicle | null>(null);
  const [selectedTransferPackage, setSelectedTransferPackage] = useState<TransferPackage | null>(null);
  const [poolVehicles, setPoolVehicles] = useState<PoolVehicle[]>([]);
  const [selectedPoolVehicle, setSelectedPoolVehicle] = useState<PoolVehicle | null>(null);
  const [seatCount, setSeatCount] = useState<number>(1);

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [details, setDetails] = useState<BookingDetails | null>(null);
  const [tracking, setTracking] = useState<TrackingUpdate | null>(null);
  const [liveCoord, setLiveCoord] = useState<MapCoordinate | null>(null);
  const [driverCoord, setDriverCoord] = useState<MapCoordinate | null>(null);
  const [polyline, setPolyline] = useState<MapCoordinate[]>([]);

  const [receipt, setReceipt] = useState<ReceiptResult | null>(null);
  const [cancelReasons, setCancelReasons] = useState<CancelReasonsResult | null>(null);
  const [cancelable, setCancelable] = useState(false);
  const [otpEnabled, setOtpEnabled] = useState(false);

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLock = useRef<unknown>(null);
  const segmentIdRef = useRef(params.segmentId);
  const areaIdRef = useRef(params.areaId);
  segmentIdRef.current = params.segmentId;
  areaIdRef.current = params.areaId;

  const currency = useMemo(() => cars?.config.currency ?? '', [cars]);

  const setBusy = useCallback((isBusy: boolean) => setActivity(isBusy ? 'busy' : 'idle'), []);
  const fail = useCallback((message: string) => {
    setError({ message });
    setActivity('idle');
  }, []);
  const clearError = useCallback(() => setError(null), []);

  const ensureSignedIn = useCallback((): boolean => {
    if (!user) {
      setError({ message: 'ride.errSignedIn' });
      return false;
    }
    return true;
  }, [user]);

  // -------------------------------------------------------------------------
  // Polling + helpers (declared before callers).
  // -------------------------------------------------------------------------

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const startWakeLock = useCallback(async () => {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (t?: string) => Promise<unknown> } };
      if ('wakeLock' in nav && nav.wakeLock) {
        wakeLock.current = await nav.wakeLock.request('screen');
      }
    } catch {
      wakeLock.current = null;
    }
  }, []);

  const stopWakeLock = useCallback(() => {
    const lock = wakeLock.current as { release?: () => Promise<void> } | null;
    if (lock?.release) {
      void lock.release().catch(() => undefined);
    }
    wakeLock.current = null;
  }, []);

  const loadReceipt = useCallback(async (id: string): Promise<void> => {
    try {
      const r = await fetchReceipt(api, id);
      setReceipt(r);
      setBookingId(id);
    } catch {
      setReceipt(null);
    }
  }, []);

  const driverCoordRaw = useCallback((result: TrackingUpdate): MapCoordinate | null => {
    const mk = result.movingMarker;
    if (mk && mk.driverMarkerLat !== undefined && mk.driverMarkerLong !== undefined) {
      return { lat: mk.driverMarkerLat, lng: mk.driverMarkerLong };
    }
    return null;
  }, []);

  const loadDetails = useCallback(
    async (id: string): Promise<void> => {
      try {
        const det = await fetchBookingDetails(api, id);
        setDetails(det);
        setOtpEnabled(!!det.otpEnable);
        if (det.driver?.currentLatitude !== undefined && det.driver?.currentLongitude !== undefined) {
          setDriverCoord({ lat: det.driver.currentLatitude, lng: det.driver.currentLongitude });
        }
        if (det.ployPoints) {
          try {
            setPolyline(decodePolyline(det.ployPoints));
          } catch {
            /* ignore malformed */
          }
        }
      } catch {
        /* tolerate */
      }
    },
    [],
  );

  const startPolling = useCallback(
    (id: string) => {
      stopPolling();
      void startWakeLock();
      const tick = async (): Promise<void> => {
        try {
          const result = await fetchTracking(api, id);
          setTracking(result);
          const status = result.bookingStatus;

          const coord = driverCoordRaw(result);
          if (coord) setDriverCoord(coord);
          const poly = result.polyData?.polyline;
          if (poly) {
            try {
              setPolyline(decodePolyline(poly));
            } catch {
              /* ignore */
            }
          }

          if (status === RIDE_STATUS_SEARCHING) {
            setView('searching');
            setCancelable(result.cancelable ?? false);
          } else if (status === RIDE_STATUS_ACCEPTED || status === RIDE_STATUS_ARRIVED || status === RIDE_STATUS_TRIP) {
            setView('tracking');
            setCancelable(result.cancelable ?? false);
            void loadDetails(id);
            if (status === RIDE_STATUS_TRIP) setLiveCoord(coord);
          } else if (status === RIDE_STATUS_DONE) {
            stopPolling();
            stopWakeLock();
            setView('receipt');
            void loadReceipt(id);
          } else {
            setView('tracking');
          }
        } catch {
          // Transient network failures are tolerated while polling.
        }
      };

      void tick();
      pollTimer.current = setInterval(() => void tick(), 6000);
    },
    [stopPolling, startWakeLock, stopWakeLock, loadReceipt, driverCoordRaw, loadDetails],
  );

  // -------------------------------------------------------------------------
  // Plan step — location & nearby cars + drivers.
  // -------------------------------------------------------------------------

  const loadCars = useCallback(
    async (place: RidePlace): Promise<void> => {
      if (!ensureSignedIn()) return;
      setBusy(true);
      clearError();
      try {
        const result = await fetchCars(api, {
          latitude: place.latitude,
          longitude: place.longitude,
          segmentId: segmentIdRef.current,
          dropLocation: pickup ? [{ drop_latitude: place.latitude, drop_longitude: place.longitude }] : undefined,
          estimateDistance: 0,
          estimateTime: 0,
        });
        setCars(result);
        setVehicles(result.serviceTypes.flatMap((st) => st.vehicles));
      } catch (err) {
        fail(err instanceof Error ? err.message : 'ride.errNetwork');
      } finally {
        setBusy(false);
      }
    },
    [ensureSignedIn, setBusy, clearError, fail, pickup],
  );

  const loadDrivers = useCallback(
    async (place: RidePlace): Promise<void> => {
      if (!ensureSignedIn()) return;
      try {
        const list = await fetchDrivers(api, {
          area: areaIdRef.current,
          distance: 100,
          latitude: place.latitude,
          longitude: place.longitude,
          segmentId: segmentIdRef.current,
        });
        setDrivers(list);
      } catch {
        setDrivers([]);
      }
    },
    [ensureSignedIn],
  );

  // -------------------------------------------------------------------------
  // Rental variant — load rental vehicles + packages.
  // -------------------------------------------------------------------------

  const loadRentalVehicles = useCallback(
    async (place?: RidePlace): Promise<void> => {
      if (!ensureSignedIn()) return;
      setBusy(true);
      clearError();
      try {
        const list = await fetchRentalCars(api, {
          areaId: areaIdRef.current,
          latitude: place?.latitude,
          longitude: place?.longitude,
          serviceType: 1,
          segmentId: segmentIdRef.current,
        });
        setRentalVehicles(list);
      } catch (err) {
        fail(err instanceof Error ? err.message : 'ride.errNetwork');
      } finally {
        setBusy(false);
      }
    },
    [ensureSignedIn, setBusy, clearError, fail],
  );

  const selectRentalVehicle = useCallback(
    (vehicle: RentalVehicle) => {
      setSelectedRentalVehicle(vehicle);
      setSelectedPackage(vehicle.packages[0] ?? null);
    },
    [],
  );

  const loadOutstation = useCallback(
    async (place?: RidePlace): Promise<void> => {
      if (!ensureSignedIn()) return;
      setBusy(true);
      clearError();
      try {
        const result = await fetchOutstationDetails(api, {
          areaId: areaIdRef.current,
          latitude: place?.latitude,
          longitude: place?.longitude,
          serviceType: 1,
          segmentId: segmentIdRef.current,
          pickupLatitude: place?.latitude,
          pickupLongitude: place?.longitude,
          dropLatitude: drop?.latitude,
          dropLongitude: drop?.longitude,
        });
        setOutstationResult(result);
      } catch (err) {
        fail(err instanceof Error ? err.message : 'ride.errNetwork');
      } finally {
        setBusy(false);
      }
    },
    [ensureSignedIn, setBusy, clearError, fail, drop],
  );

  const selectOutstationVehicle = useCallback((vehicle: OutstationVehicle) => setSelectedOutstationVehicle(vehicle), []);

  // Transfer variant - load hourly transfer packages per vehicle.
  const loadTransfer = useCallback(
    async (place?: RidePlace): Promise<void> => {
      if (!ensureSignedIn()) return;
      setBusy(true);
      clearError();
      try {
        const list = await fetchTransferDetails(api, {
          areaId: areaIdRef.current,
          latitude: place?.latitude,
          longitude: place?.longitude,
          serviceType: 1003,
          segmentId: segmentIdRef.current,
        });
        setTransferVehicles(list);
      } catch (err) {
        fail(err instanceof Error ? err.message : 'ride.errNetwork');
      } finally {
        setBusy(false);
      }
    },
    [ensureSignedIn, setBusy, clearError, fail],
  );

  const selectTransferVehicle = useCallback((vehicle: TransferVehicle) => {
    setSelectedTransferVehicle(vehicle);
    setSelectedTransferPackage(null);
  }, []);

  const selectTransferPackage = useCallback((pkg: TransferPackage) => setSelectedTransferPackage(pkg), []);

  // Pool variant — load pool vehicles with seat capacity.
  const loadPool = useCallback(
    async (place?: RidePlace): Promise<void> => {
      if (!ensureSignedIn()) return;
      setBusy(true);
      clearError();
      try {
        const list = await fetchPoolDetails(api, {
          areaId: areaIdRef.current,
          latitude: place?.latitude,
          longitude: place?.longitude,
          serviceType: 5,
          segmentId: segmentIdRef.current,
        });
        setPoolVehicles(list);
      } catch (err) {
        fail(err instanceof Error ? err.message : 'ride.errNetwork');
      } finally {
        setBusy(false);
      }
    },
    [ensureSignedIn, setBusy, clearError, fail],
  );

  const selectPoolVehicle = useCallback((vehicle: PoolVehicle) => {
    setSelectedPoolVehicle(vehicle);
    setSeatCount(1);
  }, []);

  // -------------------------------------------------------------------------
  // Checkout step.
  // -------------------------------------------------------------------------

  const goToCheckout = useCallback(
    async (vehicle: VehicleOption): Promise<void> => {
      if (!ensureSignedIn() || !pickup || !drop) {
        setError({ message: 'ride.errPickupDrop' });
        return;
      }
      const isLater = rideMode === 'later';
      if (isLater && (!laterDate || !laterTime)) {
        setError({ message: 'ride.errLaterFields' });
        return;
      }
      const isRental = variant === 'rental';
      if (isRental && !selectedRentalVehicle) {
        setError({ message: 'ride.errRentalVehicle' });
        return;
      }
      if (isRental && !selectedPackage) {
        setError({ message: 'ride.errRentalPackage' });
        return;
      }
      const isOutstation = variant === 'outstation';
      if (isOutstation && !selectedOutstationVehicle) {
        setError({ message: 'ride.errOutstationVehicle' });
        return;
      }
      if (isOutstation && tripWay === 2 && (!returnDate || !returnTime)) {
        setError({ message: 'ride.errOutstationReturn' });
        return;
      }
      const isTransfer = variant === 'transfer';
      if (isTransfer && !selectedTransferVehicle) {
        setError({ message: 'ride.errTransferVehicle' });
        return;
      }
      if (isTransfer && !selectedTransferPackage) {
        setError({ message: 'ride.errTransferPackage' });
        return;
      }
      const isPool = variant === 'pool';
      if (isPool && !selectedPoolVehicle) {
        setError({ message: 'ride.errPoolVehicle' });
        return;
      }
      if (isPool && seatCount < 1) {
        setError({ message: 'ride.errPoolSeats' });
        return;
      }
      setBusy(true);
      clearError();
      try {
        const result = await fetchCheckout(api, {
          segmentId: segmentIdRef.current,
          area: areaIdRef.current,
          serviceType: isPool ? 5 : isTransfer ? 1003 : 1,
          vehicleType: Number(
            isRental && selectedRentalVehicle
              ? selectedRentalVehicle.vehicleTypeId
              : isOutstation && selectedOutstationVehicle
              ? selectedOutstationVehicle.vehicleTypeId
              : isTransfer && selectedTransferVehicle
              ? selectedTransferVehicle.vehicleTypeId
              : isPool && selectedPoolVehicle
              ? selectedPoolVehicle.vehicleTypeId
              : vehicle.id,
          ),
          pickupLatitude: pickup.latitude,
          pickupLongitude: pickup.longitude,
          pickUpLocation: pickup.label,
          totalDropLocation: 1,
          dropLocation: [{ dropLatitude: drop.latitude, dropLongitude: drop.longitude, dropLocation: drop.label }],
          bookingType: isLater ? 2 : 1,
          numberOfRider: isPool ? seatCount : 1,
          laterDate: isLater ? laterDate : undefined,
          laterTime: isLater ? laterTime : undefined,
          servicePackageId: isTransfer
            ? Number(selectedTransferPackage?.id)
            : isRental
            ? Number(selectedPackage?.id)
            : undefined,
          tripWay: isOutstation ? (tripWay as number) : undefined,
          returnDate: isOutstation ? returnDate || undefined : undefined,
          returnTime: isOutstation ? returnTime || undefined : undefined,
          estimateFare: isOutstation && selectedOutstationVehicle ? selectedOutstationVehicle.baseFareAmount : undefined,
        });
        setSelectedVehicle(vehicle);
        setCheckout(result);
        const methods = await fetchPaymentOptions(api, { checkoutId: result.id });
        setPaymentMethods(methods);
        setPaymentMethod(methods[0] ?? null);
        setView('checkout');
      } catch (err) {
        fail(err instanceof Error ? err.message : 'ride.errCheckout');
      } finally {
        setBusy(false);
      }
    },
    [ensureSignedIn, pickup, drop, rideMode, laterDate, laterTime, variant, selectedRentalVehicle, selectedPackage, selectedOutstationVehicle, tripWay, returnDate, returnTime, selectedTransferVehicle, selectedTransferPackage, selectedPoolVehicle, seatCount, setBusy, clearError, fail],
  );

  const selectPayment = useCallback(
    async (method: PaymentMethodOption): Promise<void> => {
      if (!checkout) return;
      setBusy(true);
      try {
        const updated = await fetchCheckoutPayment(api, {
          checkout: checkout.id,
          paymentMethodId: Number(method.id),
        });
        setCheckout(updated);
        setPaymentMethod(method);
      } catch (err) {
        fail(err instanceof Error ? err.message : 'ride.errPayment');
      } finally {
        setBusy(false);
      }
    },
    [checkout, setBusy, fail],
  );

  const applyPromoCode = useCallback(
    async (code: string): Promise<void> => {
      if (!checkout) return;
      setBusy(true);
      try {
        const updated = await applyPromo(api, { checkoutId: checkout.id, promoCode: code });
        setCheckout(updated);
      } catch (err) {
        fail(err instanceof Error ? err.message : 'ride.errPromo');
      } finally {
        setBusy(false);
      }
    },
    [checkout, setBusy, fail],
  );

  const removePromoCode = useCallback(async (): Promise<void> => {
    if (!checkout) return;
    setBusy(true);
    try {
      const updated = await removePromo(api, checkout.id);
      setCheckout(updated);
    } catch (err) {
      fail(err instanceof Error ? err.message : 'ride.errPromo');
    } finally {
      setBusy(false);
    }
  }, [checkout, setBusy, fail]);

  const saveAdditionalInfo = useCallback(async (): Promise<boolean> => {
    if (!checkout) return false;
    try {
      await fetchCheckoutAdditionalInfo(api, {
        checkoutId: checkout.id,
        wheelChairEnable: wheelChair ? 1 : 0,
        babySeatEnable: babySeat ? 1 : 0,
        genderMatch: genderMatch ? 1 : 0,
        noSeatCheck: noSeatCheck ? 1 : 0,
        additionalNotes: notes,
        noOfPerson: 1,
        noOfBags: 0,
        noOfPets: 0,
        noOfChildren: 0,
      });
      return true;
    } catch {
      return false;
    }
  }, [checkout, wheelChair, babySeat, genderMatch, noSeatCheck, notes]);

  const loadPendingBookings = useCallback(async (): Promise<void> => {
    try {
      const list = await fetchPendingBookingApprovals(api, { segmentId: segmentIdRef.current });
      setPendingBookings(list);
    } catch {
      setPendingBookings([]);
    }
  }, []);

  const submitRide = useCallback(
    async (): Promise<boolean> => {
      if (!ensureSignedIn() || !checkout) return false;
      const isLater = rideMode === 'later';
      setBusy(true);
      clearError();
      try {
        await saveAdditionalInfo();
        const result = await confirmBooking(api, {
          segmentId: segmentIdRef.current,
          checkout: checkout.id,
          bookingType: isLater ? 2 : 1,
          laterDate: isLater ? laterDate : undefined,
          laterTime: isLater ? laterTime : undefined,
        });
        const id = String(result.id);
        if (!id) {
          fail('ride.errConfirm');
          setView('plan');
          return false;
        }
        setBookingId(id);
        if (isLater) {
          setView('scheduled');
          void loadPendingBookings();
          return true;
        }
        setView('searching');
        startPolling(id);
        return true;
      } catch (err) {
        fail(err instanceof Error ? err.message : 'ride.errConfirm');
        setView('plan');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [ensureSignedIn, checkout, rideMode, laterDate, laterTime, saveAdditionalInfo, setBusy, clearError, fail, startPolling, loadPendingBookings],
  );

  // -------------------------------------------------------------------------
  // Cancel.
  // -------------------------------------------------------------------------

  const openCancel = useCallback(async (): Promise<void> => {
    if (!bookingId) return;
    setBusy(true);
    try {
      const reasons = await fetchCancelReasons(api, segmentIdRef.current, bookingId);
      setCancelReasons(reasons);
      setView('cancel');
    } catch (err) {
      fail(err instanceof Error ? err.message : 'ride.errCancel');
    } finally {
      setBusy(false);
    }
  }, [bookingId, setBusy, fail]);

  const doCancel = useCallback(
    async (reasonId: string): Promise<void> => {
      if (!bookingId) return;
      setBusy(true);
      try {
        await cancelBooking(api, { bookingId, cancelReasonId: reasonId });
        stopPolling();
        stopWakeLock();
        setView('plan');
      } catch (err) {
        fail(err instanceof Error ? err.message : 'ride.errCancel');
      } finally {
        setBusy(false);
      }
    },
    [bookingId, stopPolling, stopWakeLock, setBusy, fail],
  );

  const changeDrop = useCallback(
    async (latitude: number, longitude: number, location: string): Promise<void> => {
      if (!bookingId) return;
      try {
        await changeDropAddress(api, { bookingId, location, latitude, longitude });
      } catch {
        // non-fatal
      }
    },
    [bookingId],
  );

  // -------------------------------------------------------------------------
  // Reset.
  // -------------------------------------------------------------------------

  const resetFlow = useCallback(() => {
    stopPolling();
    stopWakeLock();
    setBookingId(null);
    setDetails(null);
    setTracking(null);
    setReceipt(null);
    setCancelReasons(null);
    setCheckout(null);
    setPaymentMethods([]);
    setPaymentMethod(null);
    setSelectedVehicle(null);
    setDrivers([]);
    setDropPoints([]);
    setDrop(null);
    setRideMode('now');
    setLaterDate('');
    setLaterTime('');
    setPendingBookings([]);
    setVariant('taxi');
    setRentalVehicles([]);
    setSelectedRentalVehicle(null);
    setSelectedPackage(null);
    setOutstationResult(null);
    setSelectedOutstationVehicle(null);
    setTripWay(1);
    setReturnDate('');
    setReturnTime('');
    setTransferVehicles([]);
    setSelectedTransferVehicle(null);
    setSelectedTransferPackage(null);
    setPoolVehicles([]);
    setSelectedPoolVehicle(null);
    setSeatCount(1);
    setView('plan');
  }, [stopPolling, stopWakeLock]);

  useEffect(() => {
    return () => {
      stopPolling();
      stopWakeLock();
    };
  }, [stopPolling, stopWakeLock]);

  // -------------------------------------------------------------------------
  // Rating + tip.
  // -------------------------------------------------------------------------

  const openRate = useCallback((): void => {
    setView('rate');
  }, []);

  const backToReceipt = useCallback((): void => {
    if (bookingId) {
      setView('receipt');
    } else {
      setView('plan');
    }
  }, [bookingId]);

  const resumeTracking = useCallback((): void => {
    if (bookingId) {
      setView('tracking');
      startPolling(bookingId);
    } else {
      setView('plan');
    }
  }, [bookingId, startPolling]);

  const submitRating = useCallback(
    async (rating: number, comment: string, vehicleRating?: number): Promise<void> => {
      if (!bookingId) return;
      setBusy(true);
      try {
        await rateDriver(api, {
          segmentSlug: 'ride',
          bookingOrderId: bookingId,
          rating,
          comment,
          vehicleRating,
        });
        resetFlow();
      } catch (err) {
        fail(err instanceof Error ? err.message : 'ride.errRate');
      } finally {
        setBusy(false);
      }
    },
    [bookingId, setBusy, fail, resetFlow],
  );

  const submitTip = useCallback(
    async (amount: number): Promise<void> => {
      if (!bookingId) return;
      setBusy(true);
      try {
        await addTip(api, bookingId, amount);
      } catch (err) {
        fail(err instanceof Error ? err.message : 'ride.errTip');
      } finally {
        setBusy(false);
      }
    },
    [bookingId, setBusy, fail],
  );

  const sendSos = useCallback(
    async (contactNumber: string): Promise<void> => {
      if (!bookingId || !details) return;
      try {
        await requestSos(api, {
          bookingId,
          number: contactNumber,
          latitude: details.pickupLatitude ?? pickup?.latitude ?? 0,
          longitude: details.pickupLongitude ?? pickup?.longitude ?? 0,
          locationName: details.pickupLocation ?? pickup?.label,
        });
      } catch {
        // non-fatal
      }
    },
    [bookingId, details, pickup],
  );

  // -------------------------------------------------------------------------
  // Reset + cleanup.
  // -------------------------------------------------------------------------

  return {
    view,
    activity,
    error,
    clearError,
    pickup,
    setPickup,
    drop,
    setDrop,
    dropPoints,
    currency,
    cars,
    vehicles,
    selectedVehicle,
    drivers,
    checkout,
    paymentMethods,
    paymentMethod,
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
    rideMode,
    setRideMode,
    laterDate,
    setLaterDate,
    laterTime,
    setLaterTime,
    pendingBookings,
    loadPendingBookings,
    bookingId,
    details,
    tracking,
    driverLocation: driverCoord,
    liveCoord,
    ridePolyline: polyline,
    cancelable,
    otpEnabled,
    receipt,
    cancelReasons,
    loadCars,
    loadDrivers,
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
    goToCheckout,
    selectPayment,
    applyPromoCode,
    removePromoCode,
    submitRide,
    openCancel,
    doCancel,
    changeDrop,
    openRate,
    backToReceipt,
    resumeTracking,
    submitRating,
    submitTip,
    sendSos,
    resetFlow,
    scheduleAnother: resetFlow,
    hasSos: details?.sos ?? [],
  };
}
