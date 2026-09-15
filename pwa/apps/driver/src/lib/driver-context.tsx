'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  driverBookingAcceptReject,
  fetchDriverOnlineConfig,
  saveDriverOnlineConfig,
  setDriverOnlineState,
  updateDriverLocation,
} from '@fixcycle/api-client';
import type { DriverBooking, DriverOnlineConfig } from '@fixcycle/api-client';
import { getCurrentPosition, isGeoSupported, watchPosition } from '@fixcycle/pwa-core';

import { api } from './api';
import type { LatLng } from './polyline';
import { isSoundEnabled, playSound, setSoundEnabled } from './sound';

const LOCATION_UPLOAD_INTERVAL_MS = 30000;

// Fallback position used when geolocation is unavailable (browser denied or
// unsupported) so the location-sharing behaviour stays demonstrable offline.
const FALLBACK_ORIGIN: LatLng = { lat: 19.076, lng: 72.877 };

interface DriverContextValue {
  online: boolean;
  setOnline: (online: boolean) => Promise<void>;
  onlineConfig: DriverOnlineConfig | null;
  incoming: DriverBooking | null;
  activeTrip: DriverBooking | null;
  acceptIncoming: (booking: DriverBooking) => Promise<void>;
  declineIncoming: (booking: DriverBooking) => Promise<void>;
  setActiveTrip: (booking: DriverBooking | null) => void;
  location: LatLng | null;
  soundEnabled: boolean;
  toggleSound: () => void;
  refreshConfig: () => Promise<void>;
  saveConfig: (voice: boolean, auto: boolean, radius: number) => Promise<void>;
  scheduleNextIncoming: (delayMs: number) => void;
}

const DriverContext = createContext<DriverContextValue | null>(null);

let incomingSeq = 0;

function mockIncomingBooking(): DriverBooking {
  incomingSeq += 1;
  const fallback: RequestFixture = REQUEST_FIXTURES[0]!;
  const request: RequestFixture = REQUEST_FIXTURES[incomingSeq % REQUEST_FIXTURES.length] ?? fallback;
  return {
    id: `bk-${9000 + incomingSeq}`,
    bookingOrderId: `bk-${9000 + incomingSeq}`,
    segmentSlug: request.segmentSlug,
    segmentName: request.segmentName,
    serviceName: request.serviceName,
    pickupAddress: request.pickupAddress,
    dropAddress: request.dropAddress,
    pickupLatitude: request.pickupLat,
    pickupLongitude: request.pickupLng,
    dropLatitude: request.dropLat,
    dropLongitude: request.dropLng,
    userFirstName: request.userFirstName,
    userPhone: request.userPhone,
    amount: request.amount,
    currency: '₹',
    status: 1,
    statusText: 'New',
    createdAt: new Date().toISOString(),
    raw: {},
  };
}

interface RequestFixture {
  segmentSlug: string;
  segmentName: string;
  serviceName: string;
  pickupAddress: string;
  dropAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  userFirstName: string;
  userPhone: string;
  amount: string;
}

const REQUEST_FIXTURES: RequestFixture[] = [
  {
    segmentSlug: 'ride',
    segmentName: 'Ride',
    serviceName: 'Sedan',
    pickupAddress: '12 Marine Drive, Mumbai',
    dropAddress: 'Nariman Point, Mumbai',
    pickupLat: 18.9438,
    pickupLng: 72.8246,
    dropLat: 18.9244,
    dropLng: 72.8111,
    userFirstName: 'Ananya',
    userPhone: '+91 98100 00001',
    amount: '185',
  },
  {
    segmentSlug: 'delivery',
    segmentName: 'Delivery',
    serviceName: 'Parcel',
    pickupAddress: 'Pizza Hut, Linking Road',
    dropAddress: 'BKC Office, Mumbai',
    pickupLat: 19.0833,
    pickupLng: 72.8334,
    dropLat: 19.0733,
    dropLng: 72.8558,
    userFirstName: 'Rohan',
    userPhone: '+91 98100 00002',
    amount: '99',
  },
  {
    segmentSlug: 'towing',
    segmentName: 'Vehicle Towing',
    serviceName: 'Car Tow',
    pickupAddress: 'Andheri East Service Road',
    dropAddress: 'Suresh Auto Garage',
    pickupLat: 19.1136,
    pickupLng: 72.8697,
    dropLat: 19.1522,
    dropLng: 72.8623,
    userFirstName: 'Kavita',
    userPhone: '+91 98100 00003',
    amount: '799',
  },
];

export function DriverProvider({ children }: { children: ReactNode }): ReactNode {
  const [online, setOnlineState] = useState(false);
  const [onlineConfig, setOnlineConfig] = useState<DriverOnlineConfig | null>(null);
  const [incoming, setIncoming] = useState<DriverBooking | null>(null);
  const [activeTrip, setActiveTripState] = useState<DriverBooking | null>(null);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => isSoundEnabled());

  const locationRef = useRef<LatLng | null>(location);
  const lastUploadRef = useRef(0);
  const incomingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchHandleRef = useRef<{ stop: () => void } | null>(null);

  const clearIncomingTimer = useCallback(() => {
    if (incomingTimerRef.current) {
      clearTimeout(incomingTimerRef.current);
      incomingTimerRef.current = null;
    }
  }, []);

  const scheduleIncoming = useCallback((delayMs: number): void => {
    clearIncomingTimer();
    incomingTimerRef.current = setTimeout(() => {
      incomingTimerRef.current = null;
      const booking = mockIncomingBooking();
      setIncoming(booking);
      playSound('request-alert');
    }, delayMs);
  }, [clearIncomingTimer]);

  const scheduleNextIncoming = useCallback(
    (delayMs: number): void => {
      scheduleIncoming(delayMs);
    },
    [scheduleIncoming],
  );

  const refreshConfig = useCallback(async (): Promise<void> => {
    try {
      const config = await fetchDriverOnlineConfig(api);
      setOnlineConfig(config);
    } catch {
      // config loads lazily; gate is non-blocking
    }
  }, []);

  // When online with no active trip and no pending request, keep the next
  // simulated request coming so the preview stays alive in the demo.
  useEffect(() => {
    if (online && !activeTrip && !incoming) {
      scheduleNextIncoming(8000);
    }
    return clearIncomingTimer;
  }, [online, activeTrip, incoming, scheduleNextIncoming, clearIncomingTimer]);

  useEffect(() => {
    void refreshConfig();
  }, [refreshConfig]);

  const uploadLocation = useCallback(async (point: LatLng): Promise<void> => {
    const now = Date.now();
    if (now - lastUploadRef.current < LOCATION_UPLOAD_INTERVAL_MS) {
      return;
    }
    lastUploadRef.current = now;
    try {
      await updateDriverLocation(api, { latitude: point.lat, longitude: point.lng });
    } catch {
      // best-effort location upload
    }
  }, []);

  useEffect(() => {
    locationRef.current = location;
    if (location) {
      void uploadLocation(location);
    }
  }, [location, uploadLocation]);

  const stopWatching = useCallback(() => {
    if (watchHandleRef.current) {
      watchHandleRef.current.stop();
      watchHandleRef.current = null;
    }
  }, []);

  const setOnline = useCallback(
    async (value: boolean): Promise<void> => {
      await setDriverOnlineState(api, value);
      setOnlineState(value);
      if (!value) {
        setIncoming(null);
        clearIncomingTimer();
        stopWatching();
        return;
      }
      playSound('ready-to-go');
      let live = isGeoSupported() && typeof navigator.permissions !== 'undefined';
      if (live) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          live = permission.state === 'granted';
        } catch {
          live = false;
        }
      }
      if (live) {
        try {
          const coords = await getCurrentPosition();
          if (coords.latitude !== 0 || coords.longitude !== 0) {
            setLocation({ lat: coords.latitude, lng: coords.longitude });
          }
        } catch {
          // use fallback below
        }
      }
      try {
        const handle = watchPosition(
          (coords) => {
            if (coords.latitude !== 0 || coords.longitude !== 0) {
              setLocation({ lat: coords.latitude, lng: coords.longitude });
            }
          },
          { highAccuracy: false, timeoutMs: 20000, maximumAgeMs: 5000 },
        );
        watchHandleRef.current = handle;
      } catch {
        if (!locationRef.current) {
          setLocation(FALLBACK_ORIGIN);
        }
      }
      if (!live) {
        // Simulated location drift so the map + uploader stay visible offline.
        const drift = setInterval(() => {
          const base = locationRef.current ?? FALLBACK_ORIGIN;
          setLocation({
            lat: base.lat + (Math.random() - 0.5) * 0.0008,
            lng: base.lng + (Math.random() - 0.5) * 0.0008,
          });
        }, 6000);
        if (!watchHandleRef.current) {
          watchHandleRef.current = { stop: () => clearInterval(drift) };
        }
      }
      if (!locationRef.current) {
        setLocation(FALLBACK_ORIGIN);
      }
    },
    [clearIncomingTimer, stopWatching],
  );

  useEffect(() => {
    return stopWatching;
  }, [stopWatching]);

  const acceptIncoming = useCallback(
    async (booking: DriverBooking): Promise<void> => {
      const point = locationRef.current ?? FALLBACK_ORIGIN;
      try {
        await driverBookingAcceptReject(api, {
          bookingOrderId: booking.bookingOrderId,
          status: 'ACCEPT',
          segmentSlug: booking.segmentSlug,
          latitude: point.lat,
          longitude: point.lng,
        });
      } catch {
        // proceed optimistically in preview mode
      }
      clearIncomingTimer();
      setIncoming(null);
      setActiveTripState(booking);
      playSound('ready-to-go');
    },
    [clearIncomingTimer],
  );

  const declineIncoming = useCallback(
    async (booking: DriverBooking): Promise<void> => {
      const point = locationRef.current ?? FALLBACK_ORIGIN;
      try {
        await driverBookingAcceptReject(api, {
          bookingOrderId: booking.bookingOrderId,
          status: 'REJECT',
          segmentSlug: booking.segmentSlug,
          latitude: point.lat,
          longitude: point.lng,
        });
      } catch {
        // proceed optimistically in preview mode
      }
      setIncoming(null);
      // The main screen re-schedules the next simulated request.
    },
    [],
  );

  const setActiveTripStateCallback = useCallback((booking: DriverBooking | null): void => {
    setActiveTripState(booking);
  }, []);

  const toggleSound = useCallback((): void => {
    setSoundEnabledState((previous) => {
      const next = !previous;
      setSoundEnabled(next);
      return next;
    });
  }, []);

  const saveConfig = useCallback(
    async (voice: boolean, auto: boolean, radius: number): Promise<void> => {
      await saveDriverOnlineConfig(api, {
        voiceAlertEnabled: voice,
        autoAcceptEnabled: auto,
        radiusKm: radius,
      });
      await refreshConfig();
    },
    [refreshConfig],
  );

  const value = useMemo<DriverContextValue>(
    () => ({
      online,
      setOnline,
      onlineConfig,
      incoming,
      activeTrip,
      acceptIncoming,
      declineIncoming,
      setActiveTrip: setActiveTripStateCallback,
      location,
      soundEnabled,
      toggleSound,
      refreshConfig,
      saveConfig,
      scheduleNextIncoming,
    }),
    [
      online,
      setOnline,
      onlineConfig,
      incoming,
      activeTrip,
      acceptIncoming,
      declineIncoming,
      setActiveTripStateCallback,
      location,
      soundEnabled,
      toggleSound,
      refreshConfig,
      saveConfig,
      scheduleNextIncoming,
    ],
  );

  return <DriverContext.Provider value={value}>{children}</DriverContext.Provider>;
}

export function useDriver(): DriverContextValue {
  const value = useContext(DriverContext);
  if (!value) {
    throw new Error('useDriver must be used within DriverProvider');
  }
  return value;
}

export { mockIncomingBooking };