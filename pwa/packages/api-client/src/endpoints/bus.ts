import type { ApiClient } from '../client';
import type { ApiEnvelope } from '../envelope';

// ---------------------------------------------------------------------------
// Phase 11 — Bus booking user endpoints.
// Source: Api\BusController (thin wrapper over Services\BusServiceController
// + BusTrait + BusBookingTrait). Routes under /user/bus/*.
// ---------------------------------------------------------------------------

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function num(value: unknown): number | undefined {
  return typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : undefined;
}
function num0(value: unknown, fb = 0): number {
  return num(value) ?? fb;
}
function str0(value: unknown, fb = ''): string {
  return str(value) ?? fb;
}
function arr(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}
function obj(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}
function toBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}
function dataOf(envelope: ApiEnvelope<unknown>): Record<string, unknown> {
  return obj(envelope.data);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BusRouteStop {
  id: number;
  stop_name: string;
  stop_latitude: number;
  stop_longitude: number;
  stop_time: string;
  stop_no: number;
}

export interface BusSearchResult {
  id: number;
  route_id: number;
  route_name: string;
  service_type_id: number;
  segment_id: number;
  start_point: string;
  end_point: string;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number;
  end_longitude: number;
  start_stop_id: number;
  end_stop_id: number;
  distance: string;
}

export interface BusAvailableBus {
  id: number;
  bus_id: number;
  bus_name: string;
  bus_number: string;
  service_type_id: number;
  bus_type: string;
  departure_time: string;
  arrival_time: string;
  available_seats: number;
  seat_layout: string;
  boarding_points: BusRouteStop[];
  dropping_points: BusRouteStop[];
  price: number;
  formatted_price: string;
  bus_design_type: number;
  seat_details: BusSeatDetail[];
  service_name: string;
  service_short_name: string;
}

export interface BusSeatDetail {
  seat_no: string;
  seat_type: string;
  type_slug: string;
  seat_status: string;
  seat_price: number;
  formatted_price: string;
  deck: string;
}

export interface BusSeatMap {
  bus_id: number;
  bus_name: string;
  bus_number: string;
  bus_type: string;
  boarding_points: BusRouteStop[];
  dropping_points: BusRouteStop[];
  seat_details: BusSeatDetail[];
  available_seats: number;
  total_seats: number;
  seat_price: number;
  formatted_price: string;
  seat_layout: string;
  bus_design_type: number;
}

export interface BusCheckoutDetail {
  bus_id: number;
  route_id: number;
  service_type_id: number;
  booking_date: string;
  seat_details: string[];
  boarding_point_id: number;
  dropping_point_id: number;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  drop_address: string;
  drop_latitude: number;
  drop_longitude: number;
  payment_method_id: number;
  segment_id: number;
}

export interface BusCheckoutResult {
  sub_total: number;
  tax: number;
  discount: number;
  grand_total: number;
  formatted_total: string;
  seat_prices: { seat_no: string; price: number; formatted: string }[];
  currency: string;
}

export interface BusBookingConfirmResult {
  bus_booking_id: number;
  status: string;
}

export interface BusBooking {
  id: number;
  merchant_booking_id: number;
  bus_id: number;
  bus_name: string;
  bus_number: string;
  route_id: number;
  route_name: string;
  service_type_id: number;
  booking_date: string;
  departure_time: string;
  arrival_time: string;
  seat_numbers: string;
  seat_count: number;
  boarding_point: string;
  dropping_point: string;
  status: number;
  status_text: string;
  total_amount: number;
  formatted_amount: string;
  booking_created_at: string;
  pickup_location: string;
  drop_location: string;
}

export interface BusBookingDetail extends BusBooking {
  pickup_latitude: number;
  pickup_longitude: number;
  drop_latitude: number;
  drop_longitude: number;
  pickup_stop_name: string;
  drop_stop_name: string;
  cancellation_policy: string;
  rating: number;
  passenger_name: string;
  passenger_phone: string;
}

// ---------------------------------------------------------------------------
// Search routes
// ---------------------------------------------------------------------------

export interface SearchBusRoutesParams {
  segmentId: number | string;
  serviceTypeId?: number | string;
  fromLatitude: number;
  fromLongitude: number;
  toLatitude: number;
  toLongitude: number;
  pickupLocation?: string;
  dropLocation?: string;
  distance?: number;
}

export async function searchBusRoutes(
  client: ApiClient,
  params: SearchBusRoutesParams,
  signal?: AbortSignal,
): Promise<BusSearchResult[]> {
  const envelope = await client.post<unknown>(
    '/user/bus/search-routes',
    {
      segment_id: params.segmentId,
      service_type_id: params.serviceTypeId ?? 1,
      from_latitude: params.fromLatitude,
      from_longitude: params.fromLongitude,
      to_latitude: params.toLatitude,
      to_longitude: params.toLongitude,
      pickup_location: params.pickupLocation ?? '',
      drop_location: params.dropLocation ?? '',
      distance: params.distance ?? 30,
    },
    { scope: 'user', signal },
  );
  const d = dataOf(envelope);
  return arr(d['routes']).map((r) => ({
    id: num0(r['id'], num0(r['bus_route_id'])),
    route_id: num0(r['bus_route_id'], num0(r['id'])),
    route_name: str0(r['route_name']),
    service_type_id: num0(r['service_type_id'], 1),
    segment_id: num0(r['segment_id']),
    start_point: str0(r['start_point']),
    end_point: str0(r['end_point']),
    start_latitude: num0(r['start_latitude']),
    start_longitude: num0(r['start_longitude']),
    end_latitude: num0(r['end_latitude']),
    end_longitude: num0(r['end_longitude']),
    start_stop_id: num0(r['start_stop_id']),
    end_stop_id: num0(r['end_stop_id']),
    distance: str0(r['distance']),
  }));
}

// ---------------------------------------------------------------------------
// Route stops
// ---------------------------------------------------------------------------

export interface FetchRouteStopsParams {
  routeId: number | string;
  serviceTypeId?: number | string;
}

export async function fetchRouteStops(
  client: ApiClient,
  params: FetchRouteStopsParams,
  signal?: AbortSignal,
): Promise<BusRouteStop[]> {
  const envelope = await client.post<unknown>(
    '/user/bus/route-stops',
    { route_id: params.routeId, service_type_id: params.serviceTypeId ?? 1 },
    { scope: 'user', signal },
  );
  const d = dataOf(envelope);
  return arr(d['stops']).map((s) => ({
    id: num0(s['id'], num0(s['bus_stop_id'])),
    stop_name: str0(s['stop_name'], str0(s['name'])),
    stop_latitude: num0(s['stop_latitude'], num0(s['latitude'])),
    stop_longitude: num0(s['stop_longitude'], num0(s['longitude'])),
    stop_time: str0(s['stop_time'], str0(s['time'])),
    stop_no: num0(s['stop_no'], num0(s['sequence'])),
  }));
}

// ---------------------------------------------------------------------------
// Available buses
// ---------------------------------------------------------------------------

export interface FetchAvailableBusesParams {
  routeId: number | string;
  serviceTypeId?: number | string;
  pickupStopId: number | string;
  dropStopId: number | string;
  bookingDate?: string;
  segmentId?: number | string;
}

function parseSeatDetail(s: Record<string, unknown>): BusSeatDetail {
  return {
    seat_no: str0(s['seat_no']),
    seat_type: str0(s['seat_type']),
    type_slug: str0(s['type_slug']),
    seat_status: str0(s['seat_status']),
    seat_price: num0(s['seat_price'], num0(s['price'])),
    formatted_price: str0(s['formatted_price']),
    deck: str0(s['deck']),
  };
}

function parseRouteStop(s: Record<string, unknown>): BusRouteStop {
  return {
    id: num0(s['id'], num0(s['bus_stop_id'])),
    stop_name: str0(s['stop_name'], str0(s['name'])),
    stop_latitude: num0(s['stop_latitude'], num0(s['latitude'])),
    stop_longitude: num0(s['stop_longitude'], num0(s['longitude'])),
    stop_time: str0(s['stop_time'], str0(s['time'])),
    stop_no: num0(s['stop_no'], num0(s['sequence'])),
  };
}

export async function fetchAvailableBuses(
  client: ApiClient,
  params: FetchAvailableBusesParams,
  signal?: AbortSignal,
): Promise<BusAvailableBus[]> {
  const envelope = await client.post<unknown>(
    '/user/bus/available-buses',
    {
      route_id: params.routeId,
      service_type_id: params.serviceTypeId ?? 1,
      pickup_stop_id: params.pickupStopId,
      drop_stop_id: params.dropStopId,
      booking_date: params.bookingDate ?? new Date().toISOString().slice(0, 10),
      segment_id: params.segmentId ?? 4,
    },
    { scope: 'user', signal },
  );
  const d = dataOf(envelope);
  return arr(d['buses']).map((b) => ({
    id: num0(b['id'], num0(b['bus_id'])),
    bus_id: num0(b['bus_id'], num0(b['id'])),
    bus_name: str0(b['bus_name']),
    bus_number: str0(b['bus_number']),
    service_type_id: num0(b['service_type_id'], 1),
    bus_type: str0(b['bus_type']),
    departure_time: str0(b['departure_time']),
    arrival_time: str0(b['arrival_time']),
    available_seats: num0(b['available_seats']),
    seat_layout: str0(b['seat_layout']),
    boarding_points: arr(b['boarding_points']).map(parseRouteStop),
    dropping_points: arr(b['dropping_points']).map(parseRouteStop),
    price: num0(b['price'], num0(b['base_price'])),
    formatted_price: str0(b['formatted_price']),
    bus_design_type: num0(b['bus_design_type'], 1),
    seat_details: arr(b['seat_details']).map(parseSeatDetail),
    service_name: str0(b['service_name']),
    service_short_name: str0(b['service_short_name']),
  }));
}

// ---------------------------------------------------------------------------
// Seat map
// ---------------------------------------------------------------------------

export interface FetchSeatMapParams {
  busId: number | string;
  routeId: number | string;
  serviceTypeId?: number | string;
  pickupStopId: number | string;
  dropStopId: number | string;
  bookingDate?: string;
  segmentId?: number | string;
}

export async function fetchSeatMap(
  client: ApiClient,
  params: FetchSeatMapParams,
  signal?: AbortSignal,
): Promise<BusSeatMap> {
  const envelope = await client.post<unknown>(
    '/user/bus/seat-map',
    {
      bus_id: params.busId,
      route_id: params.routeId,
      service_type_id: params.serviceTypeId ?? 1,
      pickup_stop_id: params.pickupStopId,
      drop_stop_id: params.dropStopId,
      booking_date: params.bookingDate ?? new Date().toISOString().slice(0, 10),
      segment_id: params.segmentId ?? 4,
    },
    { scope: 'user', signal },
  );
  const d = dataOf(envelope);
  return {
    bus_id: num0(d['bus_id'], num0(d['id'])),
    bus_name: str0(d['bus_name']),
    bus_number: str0(d['bus_number']),
    bus_type: str0(d['bus_type']),
    boarding_points: arr(d['boarding_points']).map(parseRouteStop),
    dropping_points: arr(d['dropping_points']).map(parseRouteStop),
    seat_details: arr(d['seat_details']).map(parseSeatDetail),
    available_seats: num0(d['available_seats']),
    total_seats: num0(d['total_seats']),
    seat_price: num0(d['seat_price'], num0(d['base_price'])),
    formatted_price: str0(d['formatted_price']),
    seat_layout: str0(d['seat_layout']),
    bus_design_type: num0(d['bus_design_type'], 1),
  };
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export interface BusCheckoutParams {
  busId: number | string;
  routeId: number | string;
  serviceTypeId?: number | string;
  seatNumbers: string[];
  boardingPointId: number | string;
  droppingPointId: number | string;
  pickupLocation?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropLocation?: string;
  dropLatitude?: number;
  dropLongitude?: number;
  paymentMethodId?: number;
  segmentId?: number | string;
  bookingDate?: string;
}

export async function fetchBusCheckout(
  client: ApiClient,
  params: BusCheckoutParams,
  signal?: AbortSignal,
): Promise<BusCheckoutResult> {
  const envelope = await client.post<unknown>(
    '/user/bus/checkout',
    {
      bus_id: params.busId,
      route_id: params.routeId,
      service_type_id: params.serviceTypeId ?? 1,
      seat_numbers: params.seatNumbers,
      boarding_point_id: params.boardingPointId,
      dropping_point_id: params.droppingPointId,
      pickup_location: params.pickupLocation ?? '',
      pickup_latitude: params.pickupLatitude ?? 0,
      pickup_longitude: params.pickupLongitude ?? 0,
      drop_location: params.dropLocation ?? '',
      drop_latitude: params.dropLatitude ?? 0,
      drop_longitude: params.dropLongitude ?? 0,
      payment_method_id: params.paymentMethodId ?? 1,
      segment_id: params.segmentId ?? 4,
      booking_date: params.bookingDate ?? new Date().toISOString().slice(0, 10),
    },
    { scope: 'user', signal },
  );
  const d = dataOf(envelope);
  return {
    sub_total: num0(d['sub_total'], num0(d['base_amount'])),
    tax: num0(d['tax']),
    discount: num0(d['discount_amount'], num0(d['discount'])),
    grand_total: num0(d['grand_total'], num0(d['total_amount'])),
    formatted_total: str0(d['formatted_total'], str0(d['formatted_amount'])),
    seat_prices: arr(d['seat_prices']).map((sp) => ({
      seat_no: str0(sp['seat_no']),
      price: num0(sp['price'], num0(sp['seat_price'])),
      formatted: str0(sp['formatted_price']),
    })),
    currency: str0(d['currency'], 'K'),
  };
}

// ---------------------------------------------------------------------------
// Confirm booking
// ---------------------------------------------------------------------------

export interface BusConfirmParams {
  busId: number | string;
  routeId: number | string;
  serviceTypeId?: number | string;
  seatNumbers: string[];
  boardingPointId: number | string;
  droppingPointId: number | string;
  pickupLocation?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropLocation?: string;
  dropLatitude?: number;
  dropLongitude?: number;
  paymentMethodId?: number;
  segmentId?: number | string;
  bookingDate?: string;
}

export async function confirmBusBooking(
  client: ApiClient,
  params: BusConfirmParams,
  signal?: AbortSignal,
): Promise<BusBookingConfirmResult> {
  const envelope = await client.post<unknown>(
    '/user/bus/confirm',
    {
      bus_id: params.busId,
      route_id: params.routeId,
      service_type_id: params.serviceTypeId ?? 1,
      seat_numbers: params.seatNumbers,
      boarding_point_id: params.boardingPointId,
      dropping_point_id: params.droppingPointId,
      pickup_location: params.pickupLocation ?? '',
      pickup_latitude: params.pickupLatitude ?? 0,
      pickup_longitude: params.pickupLongitude ?? 0,
      drop_location: params.dropLocation ?? '',
      drop_latitude: params.dropLatitude ?? 0,
      drop_longitude: params.dropLongitude ?? 0,
      payment_method_id: params.paymentMethodId ?? 1,
      segment_id: params.segmentId ?? 4,
      booking_date: params.bookingDate ?? new Date().toISOString().slice(0, 10),
    },
    { scope: 'user', signal },
  );
  const d = dataOf(envelope);
  return {
    bus_booking_id: num0(d['bus_booking_id']),
    status: str0(d['status'], 'Booking confirmed'),
  };
}

// ---------------------------------------------------------------------------
// Bookings list
// ---------------------------------------------------------------------------

export interface FetchBusBookingsParams {
  page?: number;
  perPage?: number;
  status?: 'upcoming' | 'past';
}

function parseBooking(b: Record<string, unknown>): BusBooking {
  return {
    id: num0(b['id'], num0(b['bus_booking_id'])),
    merchant_booking_id: num0(b['merchant_booking_id']),
    bus_id: num0(b['bus_id']),
    bus_name: str0(b['bus_name']),
    bus_number: str0(b['bus_number']),
    route_id: num0(b['route_id']),
    route_name: str0(b['route_name']),
    service_type_id: num0(b['service_type_id']),
    booking_date: str0(b['booking_date']),
    departure_time: str0(b['departure_time']),
    arrival_time: str0(b['arrival_time']),
    seat_numbers: str0(b['seat_numbers']),
    seat_count: num0(b['seat_count']),
    boarding_point: str0(b['boarding_point']),
    dropping_point: str0(b['dropping_point']),
    status: num0(b['status']),
    status_text: str0(b['status_text']),
    total_amount: num0(b['total_amount']),
    formatted_amount: str0(b['formatted_amount']),
    booking_created_at: str0(b['booking_created_at'], str0(b['created_at'])),
    pickup_location: str0(b['pickup_location']),
    drop_location: str0(b['drop_location']),
  };
}

export async function fetchBusBookings(
  client: ApiClient,
  params: FetchBusBookingsParams = {},
  signal?: AbortSignal,
): Promise<BusBooking[]> {
  const envelope = await client.post<unknown>(
    '/user/bus/bookings',
    {
      page: params.page ?? 1,
      status: params.status ?? 'upcoming',
    },
    { scope: 'user', signal },
  );
  const d = dataOf(envelope);
  return arr(d['bookings']).map(parseBooking);
}

// ---------------------------------------------------------------------------
// Booking detail
// ---------------------------------------------------------------------------

export async function fetchBusBookingDetail(
  client: ApiClient,
  params: { busBookingId: number | string; signal?: AbortSignal },
): Promise<BusBookingDetail | null> {
  const envelope = await client.post<unknown>(
    '/user/bus/booking-detail',
    { bus_booking_id: params.busBookingId },
    { scope: 'user', signal: params.signal },
  );
  const d = dataOf(envelope);
  const raw = d['booking'];
  if (!raw) return null;
  const b = obj(raw);
  const booking = parseBooking(b) as BusBookingDetail;
  booking.pickup_latitude = num0(b['pickup_latitude']);
  booking.pickup_longitude = num0(b['pickup_longitude']);
  booking.drop_latitude = num0(b['drop_latitude']);
  booking.drop_longitude = num0(b['drop_longitude']);
  booking.pickup_stop_name = str0(b['pickup_stop_name']);
  booking.drop_stop_name = str0(b['drop_stop_name']);
  booking.cancellation_policy = str0(b['cancellation_policy']);
  booking.rating = num0(b['rating']);
  booking.passenger_name = str0(b['passenger_name']);
  booking.passenger_phone = str0(b['passenger_phone']);
  return booking;
}

// ---------------------------------------------------------------------------
// Cancel booking
// ---------------------------------------------------------------------------

export async function cancelBusBooking(
  client: ApiClient,
  params: { busBookingId: number | string; cancelReason?: string; signal?: AbortSignal },
): Promise<boolean> {
  const envelope = await client.post<unknown>(
    '/user/bus/cancel-booking',
    { bus_booking_id: params.busBookingId, cancel_reason: params.cancelReason ?? '' },
    { scope: 'user', signal: params.signal },
  );
  return toBool(envelope.data);
}
