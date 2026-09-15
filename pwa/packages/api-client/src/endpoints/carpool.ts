import type { ApiClient } from '../client';
import type { ApiEnvelope } from '../envelope';

// ---------------------------------------------------------------------------
// Phase 11 — Carpooling user endpoints.
// Source: Api\CarpoolingController (wraps CarpoolingTrait).
// Routes under /user/carpool/*.
// Status codes: 1=offer, 2=booked, 3=ongoing, 4=end, 5=cancelled, 6=taken-cancel, 7=expired.
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

export type CarpoolingRideStatus = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const CARPOOLING_STATUS_LABELS: Record<CarpoolingRideStatus, string> = {
  1: 'Offered',
  2: 'Booked',
  3: 'Ongoing',
  4: 'Completed',
  5: 'Cancelled',
  6: 'Cancelled',
  7: 'Expired',
};

export interface CarpoolingVehicle {
  make: string;
  model: string;
  color: string;
  number: string;
}

export interface CarpoolingRoutePoint {
  id: number;
  drop_no: number;
  from_location: string;
  to_location: string;
  from_latitude: number;
  from_longitude: number;
  to_latitude: number;
  to_longitude: number;
  estimate_distance: number;
  final_charges: number;
}

export interface CarpoolingRide {
  id: number;
  merchant_ride_id: number;
  ride_date: string;
  start_location: string;
  end_location: string;
  available_seats: number;
  booked_seats: number;
  per_seat_price: number;
  ride_status: CarpoolingRideStatus;
  ride_status_text: string;
  driver_name: string;
  vehicle: CarpoolingVehicle | null;
  route_points: CarpoolingRoutePoint[];
}

export interface CarpoolingBooking {
  id: number;
  carpooling_ride_id: number;
  ride_status: CarpoolingRideStatus;
  booked_seats: number;
  total_amount: number;
  formatted_amount: string;
  pickup_location: string;
  drop_location: string;
  ride_date: string;
  start_location: string;
  end_location: string;
  driver_name: string;
  vehicle: CarpoolingVehicle | null;
}

export interface CarpoolingRideDetail {
  id: number;
  ride_status: CarpoolingRideStatus;
  ride_status_text: string;
  booked_seats: number;
  total_amount: number;
  formatted_amount: string;
  pickup_location: string;
  drop_location: string;
  pickup_latitude: number;
  pickup_longitude: number;
  drop_latitude: number;
  drop_longitude: number;
  ride_date: string;
  driver_name: string;
  vehicle: CarpoolingVehicle | null;
  bill: {
    base_fare: number;
    distance_charge: number;
    time_charge: number;
    tax: number;
    total: number;
    formatted: string;
  };
}

export interface OfferRideParams {
  segmentId: number | string;
  countryAreaId: number | string;
  userVehicleId: number | string;
  availableSeats: number;
  rideTimestamp: string;
  startLocation: string;
  endLocation: string;
  routePoints: {
    dropNo: number;
    fromLocation: string;
    toLocation: string;
    fromLatitude: number;
    fromLongitude: number;
    toLatitude: number;
    toLongitude: number;
    estimateDistance: number;
  }[];
  returnRide?: boolean;
  returnRideTimestamp?: string;
}

export interface BookRideParams {
  carpoolingRideId: number | string;
  carpoolingRideDetailId: number | string;
  bookedSeats: number;
  pickupLocation: string;
  dropLocation: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropLatitude: number;
  dropLongitude: number;
  paymentAction: 1 | 2 | 3;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseVehicle(v: unknown): CarpoolingVehicle | null {
  if (!v || typeof v !== 'object') return null;
  const vv = v as Record<string, unknown>;
  return {
    make: str0(vv['make']),
    model: str0(vv['model']),
    color: str0(vv['color']),
    number: str0(vv['number']),
  };
}

function parseRoutePoint(p: Record<string, unknown>): CarpoolingRoutePoint {
  return {
    id: num0(p['id']),
    drop_no: num0(p['drop_no']),
    from_location: str0(p['from_location']),
    to_location: str0(p['to_location']),
    from_latitude: num0(p['from_latitude']),
    from_longitude: num0(p['from_longitude']),
    to_latitude: num0(p['to_latitude']),
    to_longitude: num0(p['to_longitude']),
    estimate_distance: num0(p['estimate_distance']),
    final_charges: num0(p['final_charges']),
  };
}

// ---------------------------------------------------------------------------
// Search rides
// ---------------------------------------------------------------------------

export interface SearchCarpoolingRidesParams {
  segmentId: number | string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropLatitude: number;
  dropLongitude: number;
  pickupLocation?: string;
  dropLocation?: string;
}

export async function searchCarpoolingRides(
  client: ApiClient,
  params: SearchCarpoolingRidesParams,
  signal?: AbortSignal,
): Promise<CarpoolingRide[]> {
  const envelope = await client.post<unknown>(
    '/user/carpool/search-rides',
    {
      segment_id: params.segmentId,
      pickup_latitude: params.pickupLatitude,
      pickup_longitude: params.pickupLongitude,
      drop_latitude: params.dropLatitude,
      drop_longitude: params.dropLongitude,
      pickup_location: params.pickupLocation ?? '',
      drop_location: params.dropLocation ?? '',
    },
    { scope: 'user', signal },
  );
  const d = dataOf(envelope);
  return arr(d['rides']).map((r) => ({
    id: num0(r['id'], num0(r['carpooling_ride_id'])),
    merchant_ride_id: num0(r['merchant_ride_id']),
    ride_date: str0(r['ride_date']),
    start_location: str0(r['start_location']),
    end_location: str0(r['end_location']),
    available_seats: num0(r['available_seats']),
    booked_seats: num0(r['booked_seats']),
    per_seat_price: num0(r['per_seat_price']),
    ride_status: num0(r['ride_status']) as CarpoolingRideStatus,
    ride_status_text: str0(r['ride_status_text']),
    driver_name: str0(r['driver_name']),
    vehicle: parseVehicle(r['vehicle']),
    route_points: arr(r['route_points']).map(parseRoutePoint),
  }));
}

// ---------------------------------------------------------------------------
// Offer ride
// ---------------------------------------------------------------------------

export async function offerCarpoolingRide(
  client: ApiClient,
  params: OfferRideParams,
  signal?: AbortSignal,
): Promise<{ id: number; ride_status: number }> {
  const envelope = await client.post<unknown>(
    '/user/carpool/offer-ride',
    {
      segment_id: params.segmentId,
      country_area_id: params.countryAreaId,
      user_vehicle_id: params.userVehicleId,
      available_seats: params.availableSeats,
      ride_timestamp: params.rideTimestamp,
      start_location: params.startLocation,
      end_location: params.endLocation,
      return_ride: params.returnRide ? 1 : 0,
      return_ride_timestamp: params.returnRideTimestamp,
      route_points: params.routePoints.map((p) => ({
        drop_no: p.dropNo,
        from_location: p.fromLocation,
        to_location: p.toLocation,
        from_latitude: p.fromLatitude,
        from_longitude: p.fromLongitude,
        to_latitude: p.toLatitude,
        to_longitude: p.toLongitude,
        estimate_distance: p.estimateDistance,
      })),
    },
    { scope: 'user', signal },
  );
  const d = dataOf(envelope);
  const ride = obj(d['offer_ride']);
  return { id: num0(ride['id']), ride_status: num0(ride['ride_status']) };
}

// ---------------------------------------------------------------------------
// Book ride
// ---------------------------------------------------------------------------

export async function bookCarpoolingRide(
  client: ApiClient,
  params: BookRideParams,
  signal?: AbortSignal,
): Promise<{ id: number; ride_status: number; total_amount: string }> {
  const envelope = await client.post<unknown>(
    '/user/carpool/book-ride',
    {
      carpooling_ride_id: params.carpoolingRideId,
      carpooling_ride_detail_id: params.carpoolingRideDetailId,
      booked_seats: params.bookedSeats,
      pickup_location: params.pickupLocation,
      drop_location: params.dropLocation,
      pickup_latitude: params.pickupLatitude,
      pickup_longitude: params.pickupLongitude,
      drop_latitude: params.dropLatitude,
      drop_longitude: params.dropLongitude,
      payment_action: params.paymentAction,
    },
    { scope: 'user', signal },
  );
  const d = dataOf(envelope);
  const booking = obj(d['booking']);
  return {
    id: num0(booking['carpooling_ride_user_detail_id']),
    ride_status: num0(booking['ride_status']),
    total_amount: str0(booking['total_amount']),
  };
}

// ---------------------------------------------------------------------------
// Offered rides list (driver side)
// ---------------------------------------------------------------------------

export async function fetchOfferedRides(
  client: ApiClient,
  params: { page?: number } = {},
  signal?: AbortSignal,
): Promise<CarpoolingRide[]> {
  const envelope = await client.post<unknown>(
    '/user/carpool/offer-rides',
    { page: params.page ?? 1 },
    { scope: 'user', signal },
  );
  const d = dataOf(envelope);
  return arr(d['rides']).map((r) => ({
    id: num0(r['id'], num0(r['carpooling_ride_id'])),
    merchant_ride_id: num0(r['merchant_ride_id']),
    ride_date: str0(r['ride_date']),
    start_location: str0(r['start_location']),
    end_location: str0(r['end_location']),
    available_seats: num0(r['available_seats']),
    booked_seats: num0(r['booked_seats']),
    per_seat_price: num0(r['per_seat_price']),
    ride_status: num0(r['ride_status']) as CarpoolingRideStatus,
    ride_status_text: str0(r['ride_status_text']),
    driver_name: str0(r['driver_name']),
    vehicle: parseVehicle(r['vehicle']),
    route_points: [],
  }));
}

// ---------------------------------------------------------------------------
// Taken rides list (passenger side)
// ---------------------------------------------------------------------------

export async function fetchTakenRides(
  client: ApiClient,
  params: { page?: number } = {},
  signal?: AbortSignal,
): Promise<CarpoolingBooking[]> {
  const envelope = await client.post<unknown>(
    '/user/carpool/taken-rides',
    { page: params.page ?? 1 },
    { scope: 'user', signal },
  );
  const d = dataOf(envelope);
  return arr(d['rides']).map((r) => ({
    id: num0(r['id'], num0(r['carpooling_ride_user_detail_id'])),
    carpooling_ride_id: num0(r['carpooling_ride_id']),
    ride_status: num0(r['ride_status']) as CarpoolingRideStatus,
    booked_seats: num0(r['booked_seats']),
    total_amount: num0(r['total_amount']),
    formatted_amount: str0(r['formatted_amount'], str0(r['total_amount'])),
    pickup_location: str0(r['pickup_location']),
    drop_location: str0(r['drop_location']),
    ride_date: str0(r['ride_date']),
    start_location: str0(r['start_location']),
    end_location: str0(r['end_location']),
    driver_name: str0(r['driver_name']),
    vehicle: parseVehicle(r['vehicle']),
  }));
}

// ---------------------------------------------------------------------------
// Ride detail
// ---------------------------------------------------------------------------

export async function fetchCarpoolingRideDetail(
  client: ApiClient,
  params: { carpoolingRideUserDetailId: number | string; signal?: AbortSignal },
): Promise<CarpoolingRideDetail | null> {
  const envelope = await client.post<unknown>(
    '/user/carpool/ride-detail',
    { carpooling_ride_user_detail_id: params.carpoolingRideUserDetailId },
    { scope: 'user', signal: params.signal },
  );
  const d = dataOf(envelope);
  const r = obj(d['ride']);
  if (!r || Object.keys(r).length === 0) return null;
  return {
    id: num0(r['id']),
    ride_status: num0(r['ride_status']) as CarpoolingRideStatus,
    ride_status_text: str0(r['ride_status_text']),
    booked_seats: num0(r['booked_seats']),
    total_amount: num0(r['total_amount']),
    formatted_amount: str0(r['total_amount']),
    pickup_location: str0(r['pickup_location']),
    drop_location: str0(r['drop_location']),
    pickup_latitude: num0(r['pickup_latitude']),
    pickup_longitude: num0(r['pickup_longitude']),
    drop_latitude: num0(r['drop_latitude']),
    drop_longitude: num0(r['drop_longitude']),
    ride_date: str0(r['ride_date']),
    driver_name: str0(r['driver_name']),
    vehicle: parseVehicle(r['vehicle']),
    bill: (() => {
      const b = obj(r['bill']);
      return {
        base_fare: num0(b['base_fare']),
        distance_charge: num0(b['distance_charge']),
        time_charge: num0(b['time_charge']),
        tax: num0(b['tax']),
        total: num0(b['total']),
        formatted: str0(b['formatted']),
      };
    })(),
  };
}

// ---------------------------------------------------------------------------
// Cancel ride (passenger)
// ---------------------------------------------------------------------------

export async function cancelCarpoolingRide(
  client: ApiClient,
  params: { carpoolingRideUserDetailId: number | string; cancelReason?: string; signal?: AbortSignal },
): Promise<boolean> {
  const envelope = await client.post<unknown>(
    '/user/carpool/cancel-ride',
    { carpooling_ride_user_detail_id: params.carpoolingRideUserDetailId, cancel_reason: params.cancelReason ?? '' },
    { scope: 'user', signal: params.signal },
  );
  return toBool(envelope.data);
}

// ---------------------------------------------------------------------------
// Cancel offer ride (driver)
// ---------------------------------------------------------------------------

export async function cancelOfferRide(
  client: ApiClient,
  params: { carpoolingRideId: number | string; signal?: AbortSignal },
): Promise<boolean> {
  const envelope = await client.post<unknown>(
    '/user/carpool/cancel-offer-ride',
    { carpooling_ride_id: params.carpoolingRideId },
    { scope: 'user', signal: params.signal },
  );
  return toBool(envelope.data);
}
