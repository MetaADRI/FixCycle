'use client';

import { useCallback, useState } from 'react';
import {
  cancelBusBooking,
  confirmBusBooking,
  fetchAvailableBuses,
  fetchBusBookingDetail,
  fetchBusBookings,
  fetchBusCheckout,
  fetchRouteStops,
  fetchSeatMap,
  searchBusRoutes,
} from '@fixcycle/api-client';
import type {
  BusAvailableBus,
  BusBooking,
  BusBookingDetail,
  BusCheckoutResult,
  BusRouteStop,
  BusSeatMap,
} from '@fixcycle/api-client';

import { api } from '@/lib/api';

export interface BusView {
  searching: boolean;
  searchResults: BusSearchResultFlat[];
  search: (params: {
    segmentId: number | string;
    fromLatitude: number;
    fromLongitude: number;
    toLatitude: number;
    toLongitude: number;
    pickupLocation?: string;
    dropLocation?: string;
  }) => Promise<boolean>;

  routeStops: BusRouteStop[];
  routeStopsLoading: boolean;
  loadRouteStops: (routeId: number | string) => Promise<boolean>;

  availableBuses: BusAvailableBus[];
  availableBusesLoading: boolean;
  loadAvailableBuses: (params: {
    routeId: number | string;
    pickupStopId: number | string;
    dropStopId: number | string;
    bookingDate?: string;
  }) => Promise<boolean>;

  seatMap: BusSeatMap | null;
  seatMapLoading: boolean;
  loadSeatMap: (params: {
    busId: number | string;
    routeId: number | string;
    pickupStopId: number | string;
    dropStopId: number | string;
    bookingDate?: string;
  }) => Promise<boolean>;
  selectedSeats: string[];
  toggleSeat: (seatNo: string) => void;
  clearSeats: () => void;

  selectedBoardingPoint: BusRouteStop | null;
  selectedDroppingPoint: BusRouteStop | null;
  selectBoardingPoint: (point: BusRouteStop) => void;
  selectDroppingPoint: (point: BusRouteStop) => void;

  checkoutResult: BusCheckoutResult | null;
  checkoutLoading: boolean;
  runCheckout: (params: {
    busId: number | string;
    routeId: number | string;
    pickupStopId: number | string;
    dropStopId: number | string;
    bookingDate?: string;
    paymentMethodId?: number;
  }) => Promise<boolean>;

  confirmResult: { busBookingId: number; status: string } | null;
  confirmLoading: boolean;
  runConfirm: (params: {
    busId: number | string;
    routeId: number | string;
    pickupStopId: number | string;
    dropStopId: number | string;
    bookingDate?: string;
    paymentMethodId?: number;
  }) => Promise<boolean>;

  bookings: BusBooking[];
  bookingsLoading: boolean;
  loadBookings: (status?: 'upcoming' | 'past') => Promise<void>;

  bookingDetail: BusBookingDetail | null;
  bookingDetailLoading: boolean;
  loadBookingDetail: (bookingId: number | string) => Promise<boolean>;

  cancelLoading: boolean;
  cancelBooking: (bookingId: number | string) => Promise<boolean>;

  error: string | null;
  clearError: () => void;
}

interface BusSearchResultFlat {
  id: number;
  routeId: number;
  routeName: string;
  startPoint: string;
  endPoint: string;
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
  startStopId: number;
  endStopId: number;
  distance: string;
}

// Module-scoped shared state so the bus flow survives client-side navigation
// between pages (each page instantiates `useBus()` independently). Everything
// else is fetched per-screen from the API, so only the search/results/selection
// hand-offs need to be shared.
interface BusSharedState {
  searchResults: BusSearchResultFlat[];
  routeStops: BusRouteStop[];
  availableBuses: BusAvailableBus[];
  selectedBoardingPoint: BusRouteStop | null;
  selectedDroppingPoint: BusRouteStop | null;
  seatMap: BusSeatMap | null;
  selectedSeats: string[];
  checkoutResult: BusCheckoutResult | null;
}

const busShared: BusSharedState = {
  searchResults: [],
  routeStops: [],
  availableBuses: [],
  selectedBoardingPoint: null,
  selectedDroppingPoint: null,
  seatMap: null,
  selectedSeats: [],
  checkoutResult: null,
};

export function useBus(): BusView {
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<BusSearchResultFlat[]>(busShared.searchResults);
  const [routeStops, setRouteStops] = useState<BusRouteStop[]>(busShared.routeStops);
  const [routeStopsLoading, setRouteStopsLoading] = useState(false);
  const [availableBuses, setAvailableBuses] = useState<BusAvailableBus[]>(busShared.availableBuses);
  const [availableBusesLoading, setAvailableBusesLoading] = useState(false);
  const [seatMap, setSeatMap] = useState<BusSeatMap | null>(busShared.seatMap);
  const [seatMapLoading, setSeatMapLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<string[]>(busShared.selectedSeats);
  const [selectedBoardingPoint, setSelectedBoardingPoint] = useState<BusRouteStop | null>(busShared.selectedBoardingPoint);
  const [selectedDroppingPoint, setSelectedDroppingPoint] = useState<BusRouteStop | null>(busShared.selectedDroppingPoint);
  const [checkoutResult, setCheckoutResult] = useState<BusCheckoutResult | null>(busShared.checkoutResult);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [confirmResult, setConfirmResult] = useState<{ busBookingId: number; status: string } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [bookings, setBookings] = useState<BusBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingDetail, setBookingDetail] = useState<BusBookingDetail | null>(null);
  const [bookingDetailLoading, setBookingDetailLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (params: {
    segmentId: number | string;
    fromLatitude: number;
    fromLongitude: number;
    toLatitude: number;
    toLongitude: number;
    pickupLocation?: string;
    dropLocation?: string;
  }): Promise<boolean> => {
    setSearching(true);
    setError(null);
    try {
      const results = await searchBusRoutes(api, {
        segmentId: params.segmentId,
        fromLatitude: params.fromLatitude,
        fromLongitude: params.fromLongitude,
        toLatitude: params.toLatitude,
        toLongitude: params.toLongitude,
        pickupLocation: params.pickupLocation,
        dropLocation: params.dropLocation,
      });
      const flat: BusSearchResultFlat[] = results.map((r) => ({
        id: r.id,
        routeId: r.route_id,
        routeName: r.route_name,
        startPoint: r.start_point,
        endPoint: r.end_point,
        startLatitude: r.start_latitude,
        startLongitude: r.start_longitude,
        endLatitude: r.end_latitude,
        endLongitude: r.end_longitude,
        startStopId: r.start_stop_id,
        endStopId: r.end_stop_id,
        distance: r.distance,
      }));
      setSearchResults(flat);
      busShared.searchResults = flat;
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to search routes');
      return false;
    } finally {
      setSearching(false);
    }
  }, []);

  const loadRouteStops = useCallback(async (routeId: number | string): Promise<boolean> => {
    setRouteStopsLoading(true);
    try {
      const stops = await fetchRouteStops(api, { routeId });
      setRouteStops(stops);
      busShared.routeStops = stops;
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load stops');
      return false;
    } finally {
      setRouteStopsLoading(false);
    }
  }, []);

  const loadAvailableBuses = useCallback(async (params: {
    routeId: number | string;
    pickupStopId: number | string;
    dropStopId: number | string;
    bookingDate?: string;
  }): Promise<boolean> => {
    setAvailableBusesLoading(true);
    setError(null);
    try {
      const buses = await fetchAvailableBuses(api, params);
      setAvailableBuses(buses);
      busShared.availableBuses = buses;
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load buses');
      return false;
    } finally {
      setAvailableBusesLoading(false);
    }
  }, []);

  const loadSeatMap = useCallback(async (params: {
    busId: number | string;
    routeId: number | string;
    pickupStopId: number | string;
    dropStopId: number | string;
    bookingDate?: string;
  }): Promise<boolean> => {
    setSeatMapLoading(true);
    setError(null);
    try {
      const map = await fetchSeatMap(api, params);
      setSeatMap(map);
      busShared.seatMap = map;
      setSelectedSeats([]);
      busShared.selectedSeats = [];
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load seat map');
      return false;
    } finally {
      setSeatMapLoading(false);
    }
  }, []);

  const toggleSeat = useCallback((seatNo: string) => {
    setSelectedSeats((prev) => {
      const next = prev.includes(seatNo) ? prev.filter((s) => s !== seatNo) : [...prev, seatNo];
      busShared.selectedSeats = next;
      return next;
    });
  }, []);

  const clearSeats = useCallback(() => {
    setSelectedSeats([]);
    busShared.selectedSeats = [];
  }, []);

  const runCheckout = useCallback(async (params: {
    busId: number | string;
    routeId: number | string;
    pickupStopId: number | string;
    dropStopId: number | string;
    bookingDate?: string;
    paymentMethodId?: number;
  }): Promise<boolean> => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return false;
    }
    if (!selectedBoardingPoint || !selectedDroppingPoint) {
      setError('Please select boarding and dropping points');
      return false;
    }
    setCheckoutLoading(true);
    setError(null);
    try {
      const result = await fetchBusCheckout(api, {
        ...params,
        seatNumbers: selectedSeats,
        boardingPointId: selectedBoardingPoint.id,
        droppingPointId: selectedDroppingPoint.id,
      });
      setCheckoutResult(result);
      busShared.checkoutResult = result;
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
      return false;
    } finally {
      setCheckoutLoading(false);
    }
  }, [selectedSeats, selectedBoardingPoint, selectedDroppingPoint]);

  const runConfirm = useCallback(async (params: {
    busId: number | string;
    routeId: number | string;
    pickupStopId: number | string;
    dropStopId: number | string;
    bookingDate?: string;
    paymentMethodId?: number;
  }): Promise<boolean> => {
    if (selectedSeats.length === 0 || !selectedBoardingPoint || !selectedDroppingPoint) {
      setError('Missing booking details');
      return false;
    }
    setConfirmLoading(true);
    setError(null);
    try {
      const result = await confirmBusBooking(api, {
        ...params,
        seatNumbers: selectedSeats,
        boardingPointId: selectedBoardingPoint.id,
        droppingPointId: selectedDroppingPoint.id,
      });
      setConfirmResult({ busBookingId: result.bus_booking_id, status: result.status });
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Booking failed');
      return false;
    } finally {
      setConfirmLoading(false);
    }
  }, [selectedSeats, selectedBoardingPoint, selectedDroppingPoint]);

  const loadBookings = useCallback(async (status: 'upcoming' | 'past' = 'upcoming'): Promise<void> => {
    setBookingsLoading(true);
    try {
      const results = await fetchBusBookings(api, { status });
      setBookings(results);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load bookings');
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  const loadBookingDetail = useCallback(async (bookingId: number | string): Promise<boolean> => {
    setBookingDetailLoading(true);
    try {
      const detail = await fetchBusBookingDetail(api, { busBookingId: bookingId });
      setBookingDetail(detail);
      return detail !== null;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load booking');
      return false;
    } finally {
      setBookingDetailLoading(false);
    }
  }, []);

  const doCancelBooking = useCallback(async (bookingId: number | string): Promise<boolean> => {
    setCancelLoading(true);
    try {
      await cancelBusBooking(api, { busBookingId: bookingId });
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to cancel booking');
      return false;
    } finally {
      setCancelLoading(false);
    }
  }, []);

  return {
    searching,
    searchResults,
    search,
    routeStops,
    routeStopsLoading,
    loadRouteStops,
    availableBuses,
    availableBusesLoading,
    loadAvailableBuses,
    seatMap,
    seatMapLoading,
    loadSeatMap,
    selectedSeats,
    toggleSeat,
    clearSeats,
    selectedBoardingPoint,
    selectedDroppingPoint,
    selectBoardingPoint: (point) => {
      busShared.selectedBoardingPoint = point;
      setSelectedBoardingPoint(point);
    },
    selectDroppingPoint: (point) => {
      busShared.selectedDroppingPoint = point;
      setSelectedDroppingPoint(point);
    },
    checkoutResult,
    checkoutLoading,
    runCheckout,
    confirmResult,
    confirmLoading,
    runConfirm,
    bookings,
    bookingsLoading,
    loadBookings,
    bookingDetail,
    bookingDetailLoading,
    loadBookingDetail,
    cancelLoading,
    cancelBooking: doCancelBooking,
    error,
    clearError: () => setError(null),
  };
}
