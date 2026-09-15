import type { ApiClient } from '../client';

// ---------------------------------------------------------------------------
// Phase 4 — live tracking, receipt, cancel, SOS, rating.
// Source of truth: Api\BookingController, Api\CommonController, Api\SosController.
// ---------------------------------------------------------------------------

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function num(value: unknown): number | undefined {
  return typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : undefined;
}
function bool(value: unknown): boolean | undefined {
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  return undefined;
}
function obj(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

// ---------------------------------------------------------------------------
// Booking details — POST /user/booking/details  (BookingController@bookingDetails)
// ---------------------------------------------------------------------------

export interface BookingDriver {
  id: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  rating?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  fullName?: string;
  profileImage?: string;
  raw: Record<string, unknown>;
}

export interface BookingMarker {
  markerType?: string;
  markerLat?: number;
  markerLong?: number;
  raw: Record<string, unknown>;
}

export interface MovableMarker {
  driverMarkerName?: string;
  driverMarkerType?: string;
  driverMarkerLat?: number;
  driverMarkerLong?: number;
  driverMarkerBearing?: number;
  raw: Record<string, unknown>;
}

export interface PolyData {
  polylineWidth?: string;
  polylineColor?: string;
  polyline?: string;
  raw: Record<string, unknown>;
}

export interface BookingSos {
  id: string;
  number?: string;
  name?: string;
  raw: Record<string, unknown>;
}

export interface BookingDetails {
  id: string;
  segmentId?: string;
  estimatePrice?: string;
  bookingStatus: string;
  rideOtp?: string;
  ployPoints?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropLatitude?: number;
  dropLongitude?: number;
  pickupLocation?: string;
  dropLocation?: string;
  totalDropLocation?: number;
  otpEnable?: boolean;
  cancelable?: boolean;
  sosVisibility?: boolean;
  shareable?: boolean;
  tipStatus?: boolean;
  shareAbleLink?: string;
  tipAlreadyPaid?: boolean;
  polyData?: PolyData;
  stillMarker?: BookingMarker;
  movableMarker?: MovableMarker;
  driver?: BookingDriver;
  sos: BookingSos[];
  vehicleTypeImage?: string;
  vehicleColor?: string;
  vehiclePlate?: string;
  vehicleSideViewImage?: string;
  paymentMethodName?: string;
  paymentMethodIcon?: string;
  etaPickupAndDest?: string;
  waypoints: Record<string, unknown>[];
  location?: Record<string, unknown>;
  raw: Record<string, unknown>;
}

export function parseBookingDetails(payload: unknown): BookingDetails {
  const d = obj(payload);
  const driver = obj(d['driver']);
  const driverVehicle = obj(d['driver_vehicle']);
  const vehicleType = obj(d['vehicle_type']);
  const paymentMethod = obj(d['payment_method']);
  const polyData = obj(d['polydata']);
  const stillMarker = obj(d['still_marker']);
  const movableMarker = obj(d['movable_marker']);

  let rideOtp = str(d['ride_otp']);
  if (typeof d['ride_otp'] === 'object' && d['ride_otp'] !== null) {
    rideOtp = str((d['ride_otp'] as Record<string, unknown>)['value']) ?? str((d['ride_otp'] as Record<string, unknown>)['otp']);
  }

  return {
    id: String(d['id'] ?? ''),
    segmentId: d['segment_id'] !== undefined ? String(d['segment_id']) : undefined,
    estimatePrice: str(d['estimate_price']),
    bookingStatus: d['booking_status'] !== undefined ? String(d['booking_status']) : '',
    rideOtp,
    ployPoints: str(d['ploy_points']),
    pickupLatitude: num(d['pickup_latitude']),
    pickupLongitude: num(d['pickup_longitude']),
    dropLatitude: num(d['drop_latitude']),
    dropLongitude: num(d['drop_longitude']),
    pickupLocation: str(d['pickup_location']),
    dropLocation: str(d['drop_location']),
    totalDropLocation: num(d['total_drop_location']),
    otpEnable: bool(d['otp_enable']),
    cancelable: bool(d['cancelable']),
    sosVisibility: bool(d['sos_visibility']),
    shareable: bool(d['shareable']),
    tipStatus: bool(d['tip_status']),
    shareAbleLink: str(d['share_able_link']),
    tipAlreadyPaid: bool(d['tip_already_paid']),
    polyData: {
      polylineWidth: str(polyData['polyline_width']),
      polylineColor: str(polyData['polyline_color']),
      polyline: str(polyData['polyline']),
      raw: polyData,
    },
    stillMarker: {
      markerType: str(stillMarker['marker_type']),
      markerLat: num(stillMarker['marker_lat']),
      markerLong: num(stillMarker['marker_long']),
      raw: stillMarker,
    },
    movableMarker: {
      driverMarkerName: str(movableMarker['driver_marker_name']),
      driverMarkerType: str(movableMarker['driver_marker_type']),
      driverMarkerLat: num(movableMarker['driver_marker_lat']),
      driverMarkerLong: num(movableMarker['driver_marker_long']),
      driverMarkerBearing: num(movableMarker['driver_marker_bearing']),
      raw: movableMarker,
    },
    driver: {
      id: String(driver['id'] ?? ''),
      firstName: str(driver['first_name']),
      lastName: str(driver['last_name']),
      phoneNumber: str(driver['phoneNumber']),
      rating: str(driver['rating']),
      currentLatitude: num(driver['current_latitude']),
      currentLongitude: num(driver['current_longitude']),
      fullName: str(driver['fullName']),
      profileImage: str(driver['profile_image']),
      raw: driver,
    },
    sos: Array.isArray(d['sos']) ? (d['sos'] as Record<string, unknown>[]).map((s) => ({
      id: String(s['id'] ?? ''),
      number: str(s['number']),
      name: str(s['name']),
      raw: s,
    })) : [],
    vehicleTypeImage: str(vehicleType['vehicleTypeImage']),
    vehicleColor: str(driverVehicle['vehicle_color']),
    vehiclePlate: str(driverVehicle['vehicle_number_plate']),
    vehicleSideViewImage: str(driverVehicle['vehicle_side_view_image']),
    paymentMethodName: str(paymentMethod['payment_method']),
    paymentMethodIcon: str(paymentMethod['payment_icon']),
    etaPickupAndDest: str(d['eta_pickup_and_dest']),
    waypoints: Array.isArray(d['waypoints']) ? d['waypoints'] : [],
    location: d['location'] !== undefined ? obj(d['location']) : undefined,
    raw: d,
  };
}

export async function fetchBookingDetails(client: ApiClient, bookingId: string | number, signal?: AbortSignal): Promise<BookingDetails> {
  const envelope = await client.post<unknown>(
    '/user/booking/details',
    { booking_id: bookingId },
    { scope: 'user', signal },
  );
  return parseBookingDetails(envelope.data);
}

// ---------------------------------------------------------------------------
// Tracking — POST /user/booking/tracking  (BookingController@userTracking)
// ---------------------------------------------------------------------------

export interface LocationUpdates {
  eta?: string;
  distance?: string;
  distanceInMeter?: number;
  timeInMin?: string;
  driverFullName?: string;
  vehicle?: string;
  vehicleColor?: string;
  vehicleNumber?: string;
  vehicleImage?: string;
  driverImage?: string;
  raw: Record<string, unknown>;
}

export interface TrackingUpdate {
  bookingStatus: string;
  cancelable?: boolean;
  movingMarker?: MovableMarker;
  polyData?: PolyData;
  location?: Record<string, unknown>;
  locationUpdates?: LocationUpdates;
  estimateDriverTime?: string;
  estimateDriverDistance?: string;
  liveDistance?: string;
  liveTime?: string;
  speed?: string;
  raw: Record<string, unknown>;
}

export function parseTracking(payload: unknown): TrackingUpdate {
  const d = obj(payload);
  const movable = obj(d['movable_marker_type']);
  const polydata = obj(d['polydata']);
  const locUpdates = obj(d['location_updates']);
  const location = d['location'] !== undefined ? obj(d['location']) : undefined;
  return {
    bookingStatus: d['booking_status'] !== undefined ? String(d['booking_status']) : '',
    cancelable: bool(d['cancelable']),
    movingMarker: {
      driverMarkerName: str(movable['driver_marker_name']),
      driverMarkerType: str(movable['driver_marker_type']),
      driverMarkerLat: num(movable['driver_marker_lat']),
      driverMarkerLong: num(movable['driver_marker_long']),
      driverMarkerBearing: num(movable['driver_marker_bearing']),
      raw: movable,
    },
    polyData: {
      polylineWidth: str(polydata['polyline_width']),
      polylineColor: str(polydata['polyline_color']),
      polyline: str(polydata['polyline']),
      raw: polydata,
    },
    location,
    locationUpdates: {
      eta: str(locUpdates['eta']),
      distance: str(locUpdates['distance']),
      distanceInMeter: num(locUpdates['distance_in_meter']),
      timeInMin: str(locUpdates['time_in_min']),
      driverFullName: str(locUpdates['driver_full_name']),
      vehicle: str(locUpdates['vehicle']),
      vehicleColor: str(locUpdates['vehicle_color']),
      vehicleNumber: str(locUpdates['vehicle_number']),
      vehicleImage: str(locUpdates['vehicle_image']),
      driverImage: str(locUpdates['driver_image']),
      raw: locUpdates,
    },
    estimateDriverTime: str(location?.['estimate_driver_time']) ?? str(locUpdates['eta']),
    estimateDriverDistance: str(location?.['estimate_driver_distnace']),
    liveDistance: str(d['live_distance']),
    liveTime: str(d['live_time']),
    speed: str(d['speed']),
    raw: d,
  };
}

export async function fetchTracking(client: ApiClient, bookingId: string | number, signal?: AbortSignal): Promise<TrackingUpdate> {
  const envelope = await client.post<unknown>(
    '/user/booking/tracking',
    { booking_id: bookingId },
    { scope: 'user', signal },
  );
  return parseTracking(envelope.data);
}

// ---------------------------------------------------------------------------
// Receipt — POST /user/receipt  (BookingController@UserReceipt)
// ---------------------------------------------------------------------------

export interface ReceiptLineItem {
  parameterType?: string;
  amount?: string;
  type?: string;
  code?: string;
  parameter?: string;
  description?: string;
  raw: Record<string, unknown>;
}

export interface ReceiptResult {
  valueText?: string;
  leftText?: string;
  rightText?: string;
  pickLocation?: string;
  dropLocation?: string;
  circularText?: string;
  circularTextOne?: string;
  circularImage?: string;
  staticValues: ReceiptLineItem[];
  multipleDropLocation: { address?: string }[];
  driver: { id: string; text?: string; image?: string };
  driverFavourite: { driverId?: string; alreadyAdded?: boolean; text?: string; image?: string };
  bottomButton: { text?: string; action?: string; paymentMethodId?: string | number };
  rideTip: { text?: string; action?: string };
  estimatePrice?: string;
  raw: Record<string, unknown>;
}

export function parseReceipt(payload: unknown): ReceiptResult {
  const root = obj(payload);
  const holder = obj(root['holder_ride_info']);
  const driverHolder = obj(root['holder_driver_rating']);
  const favouriteHolder = obj(root['holder_driver_favourite']);
  const bottomHolder = obj(root['holder_bottom_button']);
  const tipHolder = obj(root['ride_tip']);
  const driverData = obj(driverHolder['driver_data']);
  const favouriteData = obj(favouriteHolder['driver_data']);
  const multipleDrop = Array.isArray(holder['multiple_drop_location']) ? holder['multiple_drop_location'] as Record<string, unknown>[] : [];
  const staticValues = Array.isArray(holder['static_values']) ? holder['static_values'] as Record<string, unknown>[] : [];

  return {
    valueText: str(holder['value_text']),
    leftText: str(holder['left_text']),
    rightText: str(holder['right_text']),
    pickLocation: str(holder['pick_locaion']),
    dropLocation: str(holder['drop_location']),
    circularText: str(holder['circular_text']),
    circularTextOne: str(holder['circular_text_one']),
    circularImage: str(holder['circular_image']),
    staticValues: staticValues.map((r) => ({
      parameterType: str(r['parameterType']),
      amount: str(r['amount']),
      type: str(r['type']),
      code: str(r['code']),
      parameter: str(r['parameter']),
      description: str(r['description']),
      raw: r,
    })),
    multipleDropLocation: multipleDrop.map((m) => ({ address: str(m['address']) })),
    driver: {
      id: String(driverData['booking_id'] ?? ''),
      text: str(driverData['text']),
      image: str(driverData['image']),
    },
    driverFavourite: {
      driverId: favouriteData['driver_id'] !== undefined ? String(favouriteData['driver_id']) : undefined,
      alreadyAdded: bool(favouriteData['already_added']),
      text: str(favouriteData['text']),
      image: str(favouriteData['image']),
    },
    bottomButton: {
      text: str(bottomHolder['text']),
      action: str(bottomHolder['action']),
      paymentMethodId: num(bottomHolder['payment_method_id']) ?? bottomHolder['payment_method_id'] as string | undefined,
    },
    rideTip: {
      text: str(tipHolder['text']) ?? str(obj(tipHolder['data'])['text']),
      action: str(tipHolder['action']) ?? str(obj(tipHolder['data'])['action']),
    },
    estimatePrice: str(root['estimate_price']),
    raw: root,
  };
}

export async function fetchReceipt(client: ApiClient, bookingId: string | number, signal?: AbortSignal): Promise<ReceiptResult> {
  const envelope = await client.post<unknown>(
    '/user/receipt',
    { booking_id: bookingId },
    { scope: 'user', signal },
  );
  return parseReceipt(envelope.data);
}

// ---------------------------------------------------------------------------
// Tip — POST /user/add-tip
// ---------------------------------------------------------------------------

export async function addTip(client: ApiClient, bookingId: string | number, tipAmount: number, signal?: AbortSignal): Promise<void> {
  await client.post<unknown>(
    '/user/add-tip',
    { booking_id: bookingId, tip_amount: tipAmount },
    { scope: 'user', signal },
  );
}

// ---------------------------------------------------------------------------
// Cancel reasons — POST /user/cancel-reasons
// ---------------------------------------------------------------------------

export interface CancelReasonItem {
  id: string;
  reason: string;
  raw: Record<string, unknown>;
}

export interface CancelReasonsResult {
  reasons: CancelReasonItem[];
  code?: string;
  cancelCharges?: string;
  messages?: string[];
  raw: Record<string, unknown>;
}

export function parseCancelReasons(payload: unknown): CancelReasonsResult {
  const root = obj(payload);
  const list = Array.isArray(root['response_data'])
    ? root['response_data'] as Record<string, unknown>[]
    : Array.isArray(payload)
      ? payload as Record<string, unknown>[]
      : [];
  return {
    reasons: list.map((r) => ({ id: String(r['id'] ?? ''), reason: str(r['reason']) ?? '', raw: r })),
    code: str(root['code']),
    cancelCharges: root['cancel_charges'] !== undefined ? String(root['cancel_charges']) : undefined,
    messages: Array.isArray(root['message']) ? (root['message'] as unknown[]).map((m) => String(m)) : undefined,
    raw: root,
  };
}

export async function fetchCancelReasons(client: ApiClient, segmentId: string | number, bookingId?: string | number, signal?: AbortSignal): Promise<CancelReasonsResult> {
  const body: Record<string, unknown> = { segment_id: segmentId };
  if (bookingId !== undefined) body['booking_id'] = bookingId;
  const envelope = await client.post<unknown>('/user/cancel-reasons', body, { scope: 'user', signal });
  return parseCancelReasons(envelope.data);
}

// ---------------------------------------------------------------------------
// Cancel — POST /user/booking/cancel & /user/booking/autocancel
// ---------------------------------------------------------------------------

export interface CancelBookingParams {
  bookingId: string | number;
  cancelReasonId: string | number;
  cancelCharges?: number | string;
  signal?: AbortSignal;
}

export async function cancelBooking(client: ApiClient, params: CancelBookingParams): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = {
    booking_id: params.bookingId,
    cancel_reason_id: params.cancelReasonId,
  };
  if (params.cancelCharges !== undefined) body['cancel_charges'] = params.cancelCharges;
  const envelope = await client.post<unknown>('/user/booking/cancel', body, { scope: 'user', signal: params.signal });
  return obj(envelope.data);
}

export async function autoCancelBooking(client: ApiClient, bookingId: string | number, signal?: AbortSignal): Promise<string> {
  const envelope = await client.post<unknown>(
    '/user/booking/autocancel',
    { booking_id: bookingId },
    { scope: 'user', signal },
  );
  const d = obj(envelope.data);
  return d['booking_status'] !== undefined ? String(d['booking_status']) : '';
}

// ---------------------------------------------------------------------------
// Increase radius — POST /user/increaseRideRequestArea
// ---------------------------------------------------------------------------

export async function increaseRideRadius(client: ApiClient, bookingId: string | number, signal?: AbortSignal): Promise<void> {
  await client.post<unknown>(
    '/user/increaseRideRequestArea',
    { booking_id: bookingId },
    { scope: 'user', signal },
  );
}

// ---------------------------------------------------------------------------
// Change drop — POST /user/booking/change_address
// ---------------------------------------------------------------------------

export interface ChangeDropParams {
  bookingId: string | number;
  location: string;
  latitude: number | string;
  longitude: number | string;
  dropStopNo?: number;
  signal?: AbortSignal;
}

export async function changeDropAddress(client: ApiClient, params: ChangeDropParams): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = {
    booking_id: params.bookingId,
    location: params.location,
    latitude: params.latitude,
    longitude: params.longitude,
    drop_stop_no: params.dropStopNo,
  };
  const envelope = await client.post<unknown>('/user/booking/change_address', body, { scope: 'user', signal: params.signal });
  return obj(envelope.data);
}

// ---------------------------------------------------------------------------
// SOS — POST /user/sos/request  +  POST /sos (list)
// ---------------------------------------------------------------------------

export interface SosContact {
  id: string;
  number?: string;
  name?: string;
  raw: Record<string, unknown>;
}

export interface SosRequestResult {
  id: string;
  number?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  raw: Record<string, unknown>;
}

export async function fetchSosContacts(client: ApiClient, signal?: AbortSignal): Promise<SosContact[]> {
  const envelope = await client.post<unknown>('/sos', {}, { scope: 'user', signal });
  const list = Array.isArray(envelope.data) ? envelope.data as Record<string, unknown>[] : [];
  return list.map((s) => ({ id: String(s['id'] ?? ''), number: str(s['number']), name: str(s['name']), raw: s }));
}

export interface SosRequestParams {
  bookingId: string | number;
  number: string;
  latitude: number | string;
  longitude: number | string;
  locationName?: string;
  signal?: AbortSignal;
}

export async function requestSos(client: ApiClient, params: SosRequestParams): Promise<SosRequestResult> {
  const body: Record<string, unknown> = {
    booking_id: params.bookingId,
    number: params.number,
    latitude: params.latitude,
    longitude: params.longitude,
    location_name: params.locationName,
  };
  const envelope = await client.post<unknown>('/user/sos/request', body, { scope: 'user', signal: params.signal });
  const d = obj(envelope.data);
  return {
    id: String(d['id'] ?? ''),
    number: str(d['number']),
    latitude: num(d['latitude']),
    longitude: num(d['longitude']),
    locationName: str(d['location_name']),
    raw: d,
  };
}

// ---------------------------------------------------------------------------
// Rate driver — POST /user/rate-to-driver (CommonController@rateToDriverByUser)
// ---------------------------------------------------------------------------

export interface RateDriverParams {
  segmentSlug: string;
  bookingOrderId: string | number;
  rating: number | string;
  comment?: string;
  vehicleRating?: number | string;
  vehicleComment?: string;
  signal?: AbortSignal;
}

export async function rateDriver(client: ApiClient, params: RateDriverParams): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = {
    segment_slug: params.segmentSlug,
    booking_order_id: params.bookingOrderId,
    rating: params.rating,
    comment: params.comment,
    vehicle_rating: params.vehicleRating,
    vehicle_comment: params.vehicleComment,
  };
  const envelope = await client.post<unknown>('/user/rate-to-driver', body, { scope: 'user', signal: params.signal });
  return obj(envelope.data);
}
