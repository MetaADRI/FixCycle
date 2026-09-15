'use client';

import { useCallback, useState } from 'react';
import {
  bookCarpoolingRide,
  cancelCarpoolingRide,
  cancelOfferRide,
  fetchCarpoolingRideDetail,
  fetchOfferedRides,
  fetchTakenRides,
  offerCarpoolingRide,
  searchCarpoolingRides,
} from '@fixcycle/api-client';
import type {
  CarpoolingBooking,
  CarpoolingRide,
  CarpoolingRideDetail,
} from '@fixcycle/api-client';

import { api } from '@/lib/api';

// Module-scoped shared state so the carpool search results survive client-side
// navigation between `/carpool` and `/carpool/results`.
const carpoolShared: { searchResults: CarpoolingRide[] } = {
  searchResults: [],
};

export interface CarpoolOfferRoutePoint {
  dropNo: number;
  fromLocation: string;
  toLocation: string;
  fromLatitude: number;
  fromLongitude: number;
  toLatitude: number;
  toLongitude: number;
  estimateDistance: number;
}

export interface CarpoolView {
  searching: boolean;
  searchResults: CarpoolingRide[];
  search: (params: {
    segmentId: number | string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropLatitude: number;
    dropLongitude: number;
    pickupLocation?: string;
    dropLocation?: string;
  }) => Promise<boolean>;

  offering: boolean;
  offerRide: (params: {
    segmentId: number | string;
    countryAreaId: number | string;
    userVehicleId: number | string;
    availableSeats: number;
    rideTimestamp: string;
    startLocation: string;
    endLocation: string;
    routePoints: CarpoolOfferRoutePoint[];
  }) => Promise<number | null>;

  booking: boolean;
  bookRide: (params: {
    rideId: number | string;
    routePointId: number | string;
    bookedSeats: number;
    pickupLocation: string;
    dropLocation: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropLatitude: number;
    dropLongitude: number;
    paymentAction?: 1 | 2 | 3;
  }) => Promise<{ id: number } | null>;

  offeredLoading: boolean;
  offeredRides: CarpoolingRide[];
  loadOfferedRides: () => Promise<void>;

  takenLoading: boolean;
  takenRides: CarpoolingBooking[];
  loadTakenRides: () => Promise<void>;

  detailLoading: boolean;
  detail: CarpoolingRideDetail | null;
  loadDetail: (detailId: number | string) => Promise<boolean>;

  cancelLoading: boolean;
  cancelRide: (detailId: number | string) => Promise<boolean>;
  cancelOfferedRide: (rideId: number | string) => Promise<boolean>;

  error: string | null;
  clearError: () => void;
}

export function useCarpool(): CarpoolView {
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CarpoolingRide[]>(carpoolShared.searchResults);
  const [offering, setOffering] = useState(false);
  const [booking, setBooking] = useState(false);
  const [offeredLoading, setOfferedLoading] = useState(false);
  const [offeredRides, setOfferedRides] = useState<CarpoolingRide[]>([]);
  const [takenLoading, setTakenLoading] = useState(false);
  const [takenRides, setTakenRides] = useState<CarpoolingBooking[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<CarpoolingRideDetail | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (params: {
    segmentId: number | string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropLatitude: number;
    dropLongitude: number;
    pickupLocation?: string;
    dropLocation?: string;
  }): Promise<boolean> => {
    setSearching(true);
    setError(null);
    try {
      const results = await searchCarpoolingRides(api, params);
      setSearchResults(results);
      carpoolShared.searchResults = results;
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to search rides');
      return false;
    } finally {
      setSearching(false);
    }
  }, []);

  const offerRide = useCallback(async (params: {
    segmentId: number | string;
    countryAreaId: number | string;
    userVehicleId: number | string;
    availableSeats: number;
    rideTimestamp: string;
    startLocation: string;
    endLocation: string;
    routePoints: CarpoolOfferRoutePoint[];
  }): Promise<number | null> => {
    setOffering(true);
    setError(null);
    try {
      const result = await offerCarpoolingRide(api, params);
      return result.id;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to offer ride');
      return null;
    } finally {
      setOffering(false);
    }
  }, []);

  const bookRide = useCallback(async (params: {
    rideId: number | string;
    routePointId: number | string;
    bookedSeats: number;
    pickupLocation: string;
    dropLocation: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropLatitude: number;
    dropLongitude: number;
    paymentAction?: 1 | 2 | 3;
  }): Promise<{ id: number } | null> => {
    setBooking(true);
    setError(null);
    try {
      const result = await bookCarpoolingRide(api, {
        carpoolingRideId: params.rideId,
        carpoolingRideDetailId: params.routePointId,
        bookedSeats: params.bookedSeats,
        pickupLocation: params.pickupLocation,
        dropLocation: params.dropLocation,
        pickupLatitude: params.pickupLatitude,
        pickupLongitude: params.pickupLongitude,
        dropLatitude: params.dropLatitude,
        dropLongitude: params.dropLongitude,
        paymentAction: params.paymentAction ?? 1,
      });
      return { id: result.id };
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to book ride');
      return null;
    } finally {
      setBooking(false);
    }
  }, []);

  const loadOfferedRides = useCallback(async (): Promise<void> => {
    setOfferedLoading(true);
    try {
      const rides = await fetchOfferedRides(api);
      setOfferedRides(rides);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load offered rides');
    } finally {
      setOfferedLoading(false);
    }
  }, []);

  const loadTakenRides = useCallback(async (): Promise<void> => {
    setTakenLoading(true);
    try {
      const rides = await fetchTakenRides(api);
      setTakenRides(rides);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load booked rides');
    } finally {
      setTakenLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (detailId: number | string): Promise<boolean> => {
    setDetailLoading(true);
    try {
      const result = await fetchCarpoolingRideDetail(api, { carpoolingRideUserDetailId: detailId });
      setDetail(result);
      return result !== null;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load ride');
      return false;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const cancelRide = useCallback(async (detailId: number | string): Promise<boolean> => {
    setCancelLoading(true);
    try {
      await cancelCarpoolingRide(api, { carpoolingRideUserDetailId: detailId });
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to cancel ride');
      return false;
    } finally {
      setCancelLoading(false);
    }
  }, []);

  const cancelOfferedRide = useCallback(async (rideId: number | string): Promise<boolean> => {
    setCancelLoading(true);
    try {
      await cancelOfferRide(api, { carpoolingRideId: rideId });
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to cancel ride');
      return false;
    } finally {
      setCancelLoading(false);
    }
  }, []);

  return {
    searching,
    searchResults,
    search,
    offering,
    offerRide,
    booking,
    bookRide,
    offeredLoading,
    offeredRides,
    loadOfferedRides,
    takenLoading,
    takenRides,
    loadTakenRides,
    detailLoading,
    detail,
    loadDetail,
    cancelLoading,
    cancelRide,
    cancelOfferedRide,
    error,
    clearError: () => setError(null),
  };
}