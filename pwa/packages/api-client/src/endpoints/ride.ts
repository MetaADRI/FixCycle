import type { ApiClient } from '../client';

// ---------------------------------------------------------------------------
// Phase 4 — Taxi Normal: ride-now endpoints.
// Source of truth: Api\HomeController, Api\BookingController, Api\CommonController,
// Api\SosController. See the Phase 4 contract research for exact shapes.
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
function arr(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}
function obj(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

// ---------------------------------------------------------------------------
// Cars / vehicle list — POST /user/cars  (HomeController@userHomeScreen)
// ---------------------------------------------------------------------------

export interface VehicleOption {
  id: string;
  name: string;
  description?: string;
  image?: string;
  mapIcon?: string;
  rideNow?: boolean;
  rideLater?: boolean;
  surcharge?: string;
  eta?: string;
  estimateFare?: string;
  competitorEstimateFare?: string;
  volumetricCapacity?: string;
  raw: Record<string, unknown>;
}

export interface CategoryOption {
  categoryId: string;
  name: string;
  categoryImage?: string;
  categoryEta?: string;
  vehicles: VehicleOption[];
  raw: Record<string, unknown>;
}

export interface ServiceTypeOption {
  id: string;
  serviceName: string;
  sequence?: string | number;
  type?: string | number;
  vehicles: VehicleOption[];
  categories: CategoryOption[];
  raw: Record<string, unknown>;
}

export interface CarsResult {
  config: {
    currency: string;
    isGeofence: boolean;
  };
  area: {
    id: string;
    countryId?: string;
    merchantId?: string;
    timezone?: string;
  } | null;
  serviceTypes: ServiceTypeOption[];
  raw: Record<string, unknown>;
}

export interface FetchCarsParams {
  latitude: string | number;
  longitude: string | number;
  segmentId: string | number;
  dropLocation?: unknown[];
  estimateDistance?: number | string;
  estimateTime?: number | string;
  signal?: AbortSignal;
}

function parseVehicle(record: Record<string, unknown>): VehicleOption {
  return {
    id: String(record['id'] ?? ''),
    name: str(record['vehicleTypeName']) ?? str(record['name']) ?? '',
    description: str(record['vehicleTypeDescription']),
    image: str(record['vehicleTypeImage']),
    mapIcon: str(record['map_icon']),
    rideNow: bool(record['ride_now']) ?? false,
    rideLater: bool(record['ride_later']) ?? false,
    surcharge: str(record['surcharge']),
    eta: str(record['eta']),
    estimateFare: str(record['estimate_fare']),
    competitorEstimateFare: str(record['competitor_estimate_fare']),
    volumetricCapacity: str(record['volumetric_capacity']),
    raw: record,
  };
}

function parseServiceType(record: Record<string, unknown>): ServiceTypeOption {
  const vehicles: VehicleOption[] = arr(record['vehicles']).map(parseVehicle);
  const categories: CategoryOption[] = arr(record['arr_category']).map((cat) => ({
    categoryId: String(cat['category_id'] ?? ''),
    name: str(cat['name']) ?? '',
    categoryImage: str(cat['category_image']),
    categoryEta: str(cat['category_eta']),
    vehicles: arr(cat['vehicle']).map(parseVehicle),
    raw: cat,
  }));
  return {
    id: String(record['id'] ?? ''),
    serviceName: str(record['serviceName']) ?? str(record['service_type_name']) ?? '',
    sequence: num(record['sequence']) ?? record['sequence'] as string | undefined,
    type: record['type'] !== undefined ? String(record['type']) : undefined,
    vehicles,
    categories,
    raw: record,
  };
}

export function parseCars(payload: unknown): CarsResult {
  const root = obj(payload);
  const configData = obj(root['config_data']);
  const responseData = obj(root['response_data']);
  const serviceTypes: ServiceTypeOption[] = arr(responseData['service_types']).map(parseServiceType);
  return {
    config: {
      currency: str(configData['currency']) ?? '',
      isGeofence: bool(configData['is_geofence']) ?? false,
    },
    area:
      responseData['id'] !== undefined
        ? {
            id: String(responseData['id']),
            countryId: responseData['country_id'] !== undefined ? String(responseData['country_id']) : undefined,
            merchantId: responseData['merchant_id'] !== undefined ? String(responseData['merchant_id']) : undefined,
            timezone: str(responseData['timezone']),
          }
        : null,
    serviceTypes,
    raw: root,
  };
}

export async function fetchCars(client: ApiClient, params: FetchCarsParams): Promise<CarsResult> {
  const body: Record<string, unknown> = {
    latitude: params.latitude,
    longitude: params.longitude,
    segment_id: params.segmentId,
  };
  if (params.dropLocation) body['drop_location'] = JSON.stringify(params.dropLocation);
  if (params.estimateDistance !== undefined) body['estimate_distance'] = params.estimateDistance;
  if (params.estimateTime !== undefined) body['estimate_time'] = params.estimateTime;
  const envelope = await client.post<unknown>('/user/cars', body, { scope: 'user', signal: params.signal });
  return parseCars(envelope.data);
}

// ---------------------------------------------------------------------------
// Nearby drivers — POST /user/driver (HomeController@homeScreenDrivers)
// ---------------------------------------------------------------------------

export interface NearbyDriver {
  id: string;
  driverId?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  mapIcon?: string;
  lastLocationUpdateTime?: string;
  raw: Record<string, unknown>;
}

export interface FetchDriversParams {
  area: string | number;
  distance: string | number;
  latitude: string | number;
  longitude: string | number;
  segmentId: string | number;
  serviceType?: string | number;
  vehicleType?: string | number;
  signal?: AbortSignal;
}

export function parseDrivers(payload: unknown): NearbyDriver[] {
  const root = obj(payload);
  const list = arr(root['response_data']);
  return list.map((d) => ({
    id: String(d['id'] ?? d['driver_id'] ?? ''),
    driverId: d['driver_id'] !== undefined ? String(d['driver_id']) : undefined,
    currentLatitude: num(d['current_latitude']),
    currentLongitude: num(d['current_longitude']),
    mapIcon: str(d['vehicleTypeMapImage']),
    lastLocationUpdateTime: str(d['last_location_update_time']),
    raw: d,
  }));
}

export async function fetchDrivers(client: ApiClient, params: FetchDriversParams): Promise<NearbyDriver[]> {
  const body: Record<string, unknown> = {
    area: params.area,
    distance: params.distance,
    latitude: params.latitude,
    longitude: params.longitude,
    segment_id: params.segmentId,
    type: 'SERVICE_SELECTED',
    service_type: params.serviceType,
    vehicle_type: params.vehicleType,
  };
  const envelope = await client.post<unknown>('/user/driver', body, { scope: 'user', signal: params.signal });
  return parseDrivers(envelope.data);
}

// ---------------------------------------------------------------------------
// Checkout — POST /user/checkout (BookingController@checkout)
// ---------------------------------------------------------------------------

export interface DropPoint {
  dropLatitude: string | number;
  dropLongitude: string | number;
  dropLocation: string;
  stop?: string | number;
}

export interface CheckoutReceiptItem {
  parameterType?: string;
  amount?: string;
  type?: string;
  code?: string;
  parameter?: string;
  description?: string;
  raw: Record<string, unknown>;
}

export interface PaymentMethodOption {
  id: string;
  name: string;
  cardId?: string | null;
  action?: boolean;
  icon?: string;
  message?: string;
  raw: Record<string, unknown>;
}

export interface CheckoutResult {
  id: string;
  segmentId?: string;
  serviceTypeId?: string;
  vehicleTypeId?: string;
  totalDropLocation?: string | number;
  numberOfRider?: string | number;
  paymentMethodId?: string | number;
  cardId?: string | null;
  pickupLatitude?: string;
  pickupLongitude?: string;
  pickupLocation?: string;
  dropLatitude?: string;
  dropLongitude?: string;
  dropLocation?: string;
  waypoints: unknown[];
  mapImage?: string;
  estimateDistance?: string;
  estimateTime?: string;
  estimateDriverDistance?: string;
  estimateDriverTime?: string;
  bookingType?: string | number;
  vehicleTypeName?: string;
  vehicleTypeImage?: string;
  selectedPaymentMethod?: PaymentMethodOption;
  estimateReceipt: CheckoutReceiptItem[];
  promoCode?: string;
  discountedAmount?: string;
  discountAmountFormatted?: string;
  estimateBill?: string;
  estimateBillWithoutFormat?: number | string;
  outstandingAmount?: string;
  outstandingShow?: boolean;
  serviceTypeName?: string;
  servicePackage?: string;
  laterDate?: string;
  laterTime?: string;
  inDriveEnable?: boolean;
  estimatesArriveHeaderText?: string;
  promoHeading?: string;
  estimatesHeaderText?: string;
  raw: Record<string, unknown>;
}

function parseReceiptItem(r: Record<string, unknown>): CheckoutReceiptItem {
  return {
    parameterType: str(r['parameterType']),
    amount: str(r['amount']),
    type: str(r['type']),
    code: str(r['code']),
    parameter: str(r['parameter']),
    description: str(r['description']),
    raw: r,
  };
}

function parsePaymentOption(r: Record<string, unknown>): PaymentMethodOption {
  return {
    id: String(r['id'] ?? ''),
    name: str(r['name']) ?? '',
    cardId: r['card_id'] == null ? undefined : String(r['card_id']),
    action: bool(r['action']),
    icon: str(r['icon']),
    message: str(r['message']),
    raw: r,
  };
}

export function parseCheckout(payload: unknown): CheckoutResult {
  const d = obj(payload);
  return {
    id: String(d['id'] ?? ''),
    segmentId: d['segment_id'] !== undefined ? String(d['segment_id']) : undefined,
    serviceTypeId: d['service_type_id'] !== undefined ? String(d['service_type_id']) : undefined,
    vehicleTypeId: d['vehicle_type_id'] !== undefined ? String(d['vehicle_type_id']) : undefined,
    totalDropLocation: num(d['total_drop_location']) ?? d['total_drop_location'] as string | undefined,
    numberOfRider: num(d['number_of_rider']) ?? d['number_of_rider'] as string | undefined,
    paymentMethodId: num(d['payment_method_id']) ?? d['payment_method_id'] as string | undefined,
    cardId: d['card_id'] == null ? undefined : String(d['card_id']),
    pickupLatitude: str(d['pickup_latitude']),
    pickupLongitude: str(d['pickup_longitude']),
    pickupLocation: str(d['pickup_location']),
    dropLatitude: str(d['drop_latitude']),
    dropLongitude: str(d['drop_longitude']),
    dropLocation: str(d['drop_location']),
    waypoints: Array.isArray(d['waypoints']) ? d['waypoints'] : [],
    mapImage: str(d['map_image']),
    estimateDistance: str(d['estimate_distance']),
    estimateTime: str(d['estimate_time']),
    estimateDriverDistance: str(d['estimate_driver_distance']),
    estimateDriverTime: str(d['estimate_driver_time']),
    bookingType: num(d['booking_type']) ?? d['booking_type'] as string | undefined,
    vehicleTypeName: str(d['vehicleTypeName']),
    vehicleTypeImage: str(d['vehicleTypeImage']),
    selectedPaymentMethod: d['SelectedPaymentMethod'] !== undefined ? parsePaymentOption(obj(d['SelectedPaymentMethod'])) : undefined,
    estimateReceipt: Array.isArray(d['estimate_receipt']) ? (d['estimate_receipt'] as Record<string, unknown>[]).map(parseReceiptItem) : [],
    promoCode: str(d['promo_code']),
    discountedAmount: str(d['discounted_amout']),
    discountAmountFormatted: str(d['discount_amount_formatted']),
    estimateBill: str(d['estimate_bill']),
    estimateBillWithoutFormat: num(d['estimate_bill_without_format']) ?? d['estimate_bill_without_format'] as number | undefined,
    outstandingAmount: str(d['outstandAmount']),
    outstandingShow: bool(d['outstandShow']),
    serviceTypeName: str(d['service_type_name']),
    servicePackage: str(d['service_package']),
    laterDate: str(d['later_date']),
    laterTime: str(d['later_time']),
    inDriveEnable: bool(d['in_drive_enable']),
    estimatesArriveHeaderText: str(d['estimates_arrive_header_text']),
    promoHeading: str(d['promo_heading']),
    estimatesHeaderText: str(d['estimates_header_text']),
    raw: d,
  };
}

export interface FetchCheckoutParams {
  segmentId: string | number;
  area: string | number;
  serviceType: string | number;
  vehicleType?: string | number;
  pickupLatitude: string | number;
  pickupLongitude: string | number;
  pickUpLocation: string;
  totalDropLocation: number;
  dropLocation?: DropPoint[];
  bookingType?: number;
  numberOfRider?: number;
  checkoutStep?: number;
  estimateDistance?: number;
  estimateTime?: number;
  laterDate?: string;
  laterTime?: string;
  servicePackageId?: string | number;
  tripWay?: string | number;
  returnDate?: string;
  returnTime?: string;
  estimateFare?: string | number;
  signal?: AbortSignal;
}

export async function fetchCheckout(client: ApiClient, params: FetchCheckoutParams): Promise<CheckoutResult> {
  const body: Record<string, unknown> = {
    segment_id: params.segmentId,
    area: params.area,
    service_type: params.serviceType,
    vehicle_type: params.vehicleType,
    pickup_latitude: params.pickupLatitude,
    pickup_longitude: params.pickupLongitude,
    pick_up_location: params.pickUpLocation,
    total_drop_location: params.totalDropLocation,
    booking_type: params.bookingType ?? 1,
    number_of_rider: params.numberOfRider ?? 1,
    checkout_step: params.checkoutStep,
    estimate_distance: params.estimateDistance,
    estimate_time: params.estimateTime,
  };
  if (params.laterDate) body['later_date'] = params.laterDate;
  if (params.laterTime) body['later_time'] = params.laterTime;
  if (params.servicePackageId !== undefined) body['service_package_id'] = params.servicePackageId;
  if (params.tripWay !== undefined) body['trip_way'] = params.tripWay;
  if (params.returnDate) body['return_date'] = params.returnDate;
  if (params.returnTime) body['return_time'] = params.returnTime;
  if (params.estimateFare !== undefined) body['estimate_fare'] = params.estimateFare;
  if (params.dropLocation && params.dropLocation.length > 0) {
    body['drop_location'] = JSON.stringify(params.dropLocation);
  }
  const envelope = await client.post<unknown>('/user/checkout', body, { scope: 'user', signal: params.signal });
  return parseCheckout(envelope.data);
}

// ---------------------------------------------------------------------------
// Payment options — POST /user/payment-option (BookingController@paymentOption)
// ---------------------------------------------------------------------------

export interface FetchPaymentOptionsParams {
  checkoutId?: string | number;
  bookingId?: string | number;
  outstandingId?: string | number;
  segmentId?: string | number;
  signal?: AbortSignal;
}

export async function fetchPaymentOptions(client: ApiClient, params: FetchPaymentOptionsParams): Promise<PaymentMethodOption[]> {
  const body: Record<string, unknown> = {};
  if (params.checkoutId !== undefined) body['checkout_id'] = params.checkoutId;
  if (params.bookingId !== undefined) body['booking_id'] = params.bookingId;
  if (params.outstandingId !== undefined) body['outstanding_id'] = params.outstandingId;
  if (params.segmentId !== undefined) body['segment_id'] = params.segmentId;
  const envelope = await client.post<unknown>('/user/payment-option', body, { scope: 'user', signal: params.signal });
  return Array.isArray(envelope.data) ? (envelope.data as Record<string, unknown>[]).map(parsePaymentOption) : [];
}

// ---------------------------------------------------------------------------
// Checkout payment — POST /user/checkout-payment (BookingController@checkoutPayment)
// ---------------------------------------------------------------------------

export interface FetchCheckoutPaymentParams {
  checkout: string | number;
  paymentMethodId: string | number;
  paymentOptionId?: string | number;
  cardId?: string | number;
  signal?: AbortSignal;
}

export async function fetchCheckoutPayment(client: ApiClient, params: FetchCheckoutPaymentParams): Promise<CheckoutResult> {
  const body: Record<string, unknown> = {
    checkout: params.checkout,
    payment_method_id: params.paymentMethodId,
    payment_option_id: params.paymentOptionId,
    card_id: params.cardId,
  };
  const envelope = await client.post<unknown>('/user/checkout-payment', body, { scope: 'user', signal: params.signal });
  return parseCheckout(envelope.data);
}

// ---------------------------------------------------------------------------
// Additional info — POST /user/checkout-additional-info (BookingController@checkoutAdditionalInfo)
// ---------------------------------------------------------------------------

export interface AdditionalInfoParams {
  checkoutId: string | number;
  wheelChairEnable: number;
  babySeatEnable: number;
  genderMatch: number;
  gender?: number;
  noSeatCheck: number;
  additionalInformation?: string;
  additionalNotes?: string;
  bagsWeightKg?: number;
  noOfBags?: number;
  noOfPets?: number;
  noOfPerson?: number;
  noOfChildren?: number;
  acNonac?: number;
  signal?: AbortSignal;
}

export interface AdditionalInfoResult {
  ok: boolean;
  message?: string;
  raw: unknown;
}

export async function fetchCheckoutAdditionalInfo(client: ApiClient, params: AdditionalInfoParams): Promise<AdditionalInfoResult> {
  const body: Record<string, unknown> = {
    checkout_id: params.checkoutId,
    wheel_chair_enable: params.wheelChairEnable,
    baby_seat_enable: params.babySeatEnable,
    gender_match: params.genderMatch,
    gender: params.gender,
    no_seat_check: params.noSeatCheck,
    additional_information: params.additionalInformation,
    additional_notes: params.additionalNotes,
    bags_weight_kg: params.bagsWeightKg,
    no_of_bags: params.noOfBags,
    no_of_pats: params.noOfPets,
    no_of_person: params.noOfPerson,
    no_of_children: params.noOfChildren,
    ac_nonac: params.acNonac,
  };
  const envelope = await client.post<unknown>('/user/checkout-additional-info', body, { scope: 'user', signal: params.signal });
  return { ok: true, raw: envelope.data };
}

// ---------------------------------------------------------------------------
// Promo — POST /user/checkout/apply-promo & /user/checkout/remove-promo
// ---------------------------------------------------------------------------

export interface ApplyPromoParams {
  checkoutId: string | number;
  promoCode: string;
  signal?: AbortSignal;
}

export async function applyPromo(client: ApiClient, params: ApplyPromoParams): Promise<CheckoutResult> {
  const envelope = await client.post<unknown>(
    '/user/checkout/apply-promo',
    { checkout_id: params.checkoutId, promo_code: params.promoCode },
    { scope: 'user', signal: params.signal },
  );
  return parseCheckout(envelope.data);
}

export async function removePromo(client: ApiClient, checkoutId: string | number, signal?: AbortSignal): Promise<CheckoutResult> {
  const envelope = await client.post<unknown>(
    '/user/checkout/remove-promo',
    { checkout_id: checkoutId },
    { scope: 'user', signal },
  );
  return parseCheckout(envelope.data);
}

// ---------------------------------------------------------------------------
// Confirm — POST /user/confirm (BookingController@confirmBooking)
// ---------------------------------------------------------------------------

export interface ConfirmResult {
  id: string;
  bookingType?: string | number;
  merchantBookingId?: string | number;
  raw: Record<string, unknown>;
}

export interface ConfirmBookingParams {
  segmentId: string | number;
  checkout: string | number;
  favDriverId?: string | number;
  additionalNotes?: string;
  bookingType?: number;
  laterDate?: string;
  laterTime?: string;
  signal?: AbortSignal;
}

export function parseConfirm(payload: unknown): ConfirmResult {
  const d = obj(payload);
  return {
    id: String(d['id'] ?? ''),
    bookingType: num(d['booking_type']) ?? d['booking_type'] as string | undefined,
    merchantBookingId: num(d['merchant_booking_id']) ?? d['merchant_booking_id'] as string | undefined,
    raw: d,
  };
}

export async function confirmBooking(client: ApiClient, params: ConfirmBookingParams): Promise<ConfirmResult> {
  const body: Record<string, unknown> = {
    segment_id: params.segmentId,
    checkout: params.checkout,
    fav_driver_id: params.favDriverId,
    additional_notes: params.additionalNotes,
  };
  if (params.bookingType !== undefined) body['booking_type'] = params.bookingType;
  if (params.laterDate) body['later_date'] = params.laterDate;
  if (params.laterTime) body['later_time'] = params.laterTime;
  const envelope = await client.post<unknown>('/user/confirm', body, { scope: 'user', signal: params.signal });
  return parseConfirm(envelope.data);
}

// ---------------------------------------------------------------------------
// Check booking status — POST /user/check-booking-status
// ---------------------------------------------------------------------------

export async function checkBookingStatus(client: ApiClient, bookingId: string | number, signal?: AbortSignal): Promise<string> {
  const envelope = await client.post<unknown>(
    '/user/check-booking-status',
    { booking_id: bookingId },
    { scope: 'user', signal },
  );
  const d = obj(envelope.data);
  return d['booking_status'] !== undefined ? String(d['booking_status']) : '';
}

// ---------------------------------------------------------------------------
// Pending ride-later approvals — POST /user/pending-booking-approvals
// (BookingController@PendingBookingApproval)
// ---------------------------------------------------------------------------

export interface PendingBooking {
  id: string;
  bookingId?: string;
  merchantBookingId?: string | number;
  bookingType?: string | number;
  estimatePrice?: string;
  pickupLocation?: string;
  dropLocation?: string;
  laterDate?: string;
  laterTime?: string;
  bookingStatus?: string;
  approveStatus?: string | number;
  vehicleTypeName?: string;
  serviceTypeName?: string;
  raw: Record<string, unknown>;
}

export function parsePendingBookings(payload: unknown): PendingBooking[] {
  const root = obj(payload);
  const list = Array.isArray(root['response_data']) ? (root['response_data'] as Record<string, unknown>[]) : Array.isArray(root['data']) ? (root['data'] as Record<string, unknown>[]) : [];
  return list.map((d) => ({
    id: String(d['id'] ?? d['booking_id'] ?? ''),
    bookingId: d['booking_id'] !== undefined ? String(d['booking_id']) : undefined,
    merchantBookingId: num(d['merchant_booking_id']) ?? d['merchant_booking_id'] as string | undefined,
    bookingType: num(d['booking_type']) ?? d['booking_type'] as string | undefined,
    estimatePrice: str(d['estimate_price']),
    pickupLocation: str(d['pickup_location']),
    dropLocation: str(d['drop_location']),
    laterDate: str(d['later_date']),
    laterTime: str(d['later_time']),
    bookingStatus: d['booking_status'] !== undefined ? String(d['booking_status']) : undefined,
    approveStatus: d['approve_status'] !== undefined ? String(d['approve_status']) : undefined,
    vehicleTypeName: str(d['vehicleTypeName']),
    serviceTypeName: str(d['service_type_name']),
    raw: d,
  }));
}

export async function fetchPendingBookingApprovals(client: ApiClient, params: { segmentId?: string | number; signal?: AbortSignal } = {}): Promise<PendingBooking[]> {
  const body: Record<string, unknown> = {};
  if (params.segmentId !== undefined) body['segment_id'] = params.segmentId;
  const envelope = await client.post<unknown>('/user/pending-booking-approvals', body, { scope: 'user', signal: params.signal });
  return parsePendingBookings(envelope.data);
}

// ---------------------------------------------------------------------------
// Rental cars — POST /user/rental-cars  (Api\HomeController@rentalCars)
// ---------------------------------------------------------------------------

export interface RentalPackage {
  id: string | number;
  packageName?: string;
  estimateFare?: string | number;
  estimateFareText?: string;
}

export interface RentalVehicle {
  vehicleTypeId: string | number;
  vehicleTypeName?: string;
  vehicleTypeImage?: string;
  rideNow?: string | number;
  rideLater?: string | number;
  packages: RentalPackage[];
}

export function parseRentalVehicles(payload: unknown): RentalVehicle[] {
  const list = Array.isArray(payload) ? (payload as Record<string, unknown>[]) : [];
  return list.map((d) => {
    const pkgRaw = Array.isArray(d['arr_package']) ? (d['arr_package'] as Record<string, unknown>[]) : [];
    return {
      vehicleTypeId: d['vehicle_type_id'] as string | number,
      vehicleTypeName: str(d['vehicle_type_name']),
      vehicleTypeImage: str(d['vehicle_type_image']),
      rideNow: d['ride_now'] !== undefined ? String(d['ride_now']) : undefined,
      rideLater: d['ride_later'] !== undefined ? String(d['ride_later']) : undefined,
      packages: pkgRaw.map((p) => ({
        id: p['id'] as string | number,
        packageName: str(p['package_name']),
        estimateFare: p['estimate_fare'] !== undefined && p['estimate_fare'] !== null ? Number(p['estimate_fare']) : undefined,
        estimateFareText: str(p['estimate_fare_text']),
      })),
    };
  });
}

export async function fetchRentalCars(
  client: ApiClient,
  params: {
    areaId?: string | number;
    latitude?: string | number;
    longitude?: string | number;
    serviceType?: string | number;
    segmentId?: string | number;
    vehicleType?: string | number;
    signal?: AbortSignal;
  } = {},
): Promise<RentalVehicle[]> {
  const body: Record<string, unknown> = {};
  if (params.areaId !== undefined) body['area_id'] = params.areaId;
  if (params.latitude !== undefined) body['latitude'] = String(params.latitude);
  if (params.longitude !== undefined) body['longitude'] = String(params.longitude);
  if (params.serviceType !== undefined) body['service_type'] = params.serviceType;
  if (params.segmentId !== undefined) body['segment_id'] = params.segmentId;
  if (params.vehicleType !== undefined) body['vehicle_type'] = params.vehicleType;
  if (body['area_id'] === undefined) body['area_id'] = 1;
  if (body['segment_id'] === undefined) body['segment_id'] = 1;
  const envelope = await client.post<unknown>('/user/rental-cars', body, { scope: 'user', signal: params.signal });
  return parseRentalVehicles(envelope.data);
}

export interface OutstationVehicle {
  id: string;
  vehicleTypeId: number;
  servicePackageId?: number;
  name: string;
  description: string;
  image: string;
  baseFare: string;
  baseFareAmount: number;
  packageName?: string;
  estimateDistance?: number;
}

export interface OutstationResult {
  single: OutstationVehicle[];
  round: OutstationVehicle[];
  returnTime: number;
}

export function parseOutstationVehicles(data: unknown): OutstationResult {
  const d = (data ?? {}) as Record<string, any>;
  const toVehicle = (v: any): OutstationVehicle => ({
    id: String(v?.id ?? ''),
    vehicleTypeId: Number(v?.vehicle_type_id ?? 0),
    servicePackageId: v?.service_package_id !== undefined ? Number(v.service_package_id) : undefined,
    name: String(v?.vechile_name ?? 'Vehicle'),
    description: String(v?.vechile_description ?? ''),
    image: String(v?.vechile_image ?? ''),
    baseFare: String(v?.base_fare ?? ''),
    baseFareAmount: Number(v?.base_fare_amount ?? 0),
    packageName: v?.package_name !== undefined ? String(v.package_name) : undefined,
    estimateDistance: v?.estimate_distance !== undefined ? Number(v.estimate_distance) : undefined,
  });
  const single = Array.isArray(d.single) ? d.single.map(toVehicle) : [];
  const round = Array.isArray(d.round) ? d.round.map(toVehicle) : [];
  return { single, round, returnTime: Number(d.return_time ?? 0) };
}

export async function fetchOutstationDetails(
  client: ApiClient,
  params: {
    areaId?: string | number;
    latitude?: string | number;
    longitude?: string | number;
    serviceType?: string | number;
    segmentId?: string | number;
    pickupLatitude?: string | number;
    pickupLongitude?: string | number;
    dropLatitude?: string | number;
    dropLongitude?: string | number;
    estimateDistance?: string | number;
    signal?: AbortSignal;
  } = {},
): Promise<OutstationResult> {
  const body: Record<string, unknown> = {};
  if (params.areaId !== undefined) body['area_id'] = params.areaId;
  if (params.latitude !== undefined) body['latitude'] = String(params.latitude);
  if (params.longitude !== undefined) body['longitude'] = String(params.longitude);
  if (params.serviceType !== undefined) body['service_type'] = params.serviceType;
  if (params.segmentId !== undefined) body['segment_id'] = params.segmentId;
  if (params.pickupLatitude !== undefined) body['pickup_lat'] = String(params.pickupLatitude);
  if (params.pickupLongitude !== undefined) body['pickup_long'] = String(params.pickupLongitude);
  if (params.dropLatitude !== undefined) body['drop_lat'] = String(params.dropLatitude);
  if (params.dropLongitude !== undefined) body['drop_long'] = String(params.dropLongitude);
  if (params.estimateDistance !== undefined) body['estimate_distance'] = params.estimateDistance;
  if (body['area_id'] === undefined) body['area_id'] = 1;
  if (body['segment_id'] === undefined) body['segment_id'] = 1;
  const envelope = await client.post<unknown>('/user/outstation-details', body, { scope: 'user', signal: params.signal });
  return parseOutstationVehicles(envelope.data);
}

// ---------------------------------------------------------------------------
// Transfer details — POST /user/transfer-details  (TransferController@transferDetail)
// Airport / hourly transfer: per-vehicle hourly packages (same shape as rental).
// ---------------------------------------------------------------------------

export interface TransferPackage {
  id: string | number;
  packageName?: string;
  estimateFare?: string | number;
  estimateFareText?: string;
}

export interface TransferVehicle {
  vehicleTypeId: string | number;
  vehicleTypeName?: string;
  vehicleTypeImage?: string;
  rideNow?: string | number;
  rideLater?: string | number;
  packages: TransferPackage[];
}

export function parseTransferVehicles(payload: unknown): TransferVehicle[] {
  const list = Array.isArray(payload) ? (payload as Record<string, unknown>[]) : [];
  return list.map((d) => {
    const pkgRaw = Array.isArray(d['arr_package']) ? (d['arr_package'] as Record<string, unknown>[]) : [];
    return {
      vehicleTypeId: d['vehicle_type_id'] as string | number,
      vehicleTypeName: str(d['vehicle_type_name']),
      vehicleTypeImage: str(d['vehicle_type_image']),
      rideNow: d['ride_now'] !== undefined ? String(d['ride_now']) : undefined,
      rideLater: d['ride_later'] !== undefined ? String(d['ride_later']) : undefined,
      packages: pkgRaw.map((p) => ({
        id: p['id'] as string | number,
        packageName: str(p['package_name']),
        estimateFare: p['estimate_fare'] !== undefined && p['estimate_fare'] !== null ? Number(p['estimate_fare']) : undefined,
        estimateFareText: str(p['estimate_fare_text']),
      })),
    };
  });
}

export async function fetchTransferDetails(
  client: ApiClient,
  params: {
    areaId?: string | number;
    latitude?: string | number;
    longitude?: string | number;
    serviceType?: string | number;
    segmentId?: string | number;
    vehicleType?: string | number;
    signal?: AbortSignal;
  } = {},
): Promise<TransferVehicle[]> {
  const body: Record<string, unknown> = {};
  if (params.areaId !== undefined) body['area_id'] = params.areaId;
  if (params.latitude !== undefined) body['latitude'] = String(params.latitude);
  if (params.longitude !== undefined) body['longitude'] = String(params.longitude);
  if (params.serviceType !== undefined) body['service_type'] = params.serviceType;
  if (params.segmentId !== undefined) body['segment_id'] = params.segmentId;
  if (params.vehicleType !== undefined) body['vehicle_type'] = params.vehicleType;
  if (body['area_id'] === undefined) body['area_id'] = 1;
  if (body['segment_id'] === undefined) body['segment_id'] = 1;
  const envelope = await client.post<unknown>('/user/transfer-details', body, { scope: 'user', signal: params.signal });
  return parseTransferVehicles(envelope.data);
}

// ---------------------------------------------------------------------------
// Pool details — POST /user/pool-details  (PoolController-like behaviour)
// Returns pool-enabled vehicles with seat capacity and per-seat fare.
// ---------------------------------------------------------------------------

export interface PoolVehicle {
  vehicleTypeId: string | number;
  vehicleTypeName?: string;
  vehicleTypeImage?: string;
  vehicleSeat?: number;
  passengerSeatCapacity?: number;
  rideFare?: number;
  rideFareText?: string;
  rideNow?: string | number;
  rideLater?: string | number;
}

export function parsePoolVehicles(payload: unknown): PoolVehicle[] {
  const list = Array.isArray(payload) ? (payload as Record<string, unknown>[]) : [];
  return list.map((d) => ({
    vehicleTypeId: d['vehicle_type_id'] as string | number,
    vehicleTypeName: str(d['vehicle_type_name']),
    vehicleTypeImage: str(d['vehicle_type_image']),
    vehicleSeat: d['vehicle_seat'] !== undefined ? Number(d['vehicle_seat']) : undefined,
    passengerSeatCapacity: d['passenger_seat_capacity'] !== undefined ? Number(d['passenger_seat_capacity']) : undefined,
    rideFare: d['ride_fare'] !== undefined && d['ride_fare'] !== null ? Number(d['ride_fare']) : undefined,
    rideFareText: str(d['ride_fare_text']),
    rideNow: d['ride_now'] !== undefined ? String(d['ride_now']) : undefined,
    rideLater: d['ride_later'] !== undefined ? String(d['ride_later']) : undefined,
  }));
}

export async function fetchPoolDetails(
  client: ApiClient,
  params: {
    areaId?: string | number;
    latitude?: string | number;
    longitude?: string | number;
    serviceType?: string | number;
    segmentId?: string | number;
    vehicleType?: string | number;
    signal?: AbortSignal;
  } = {},
): Promise<PoolVehicle[]> {
  const body: Record<string, unknown> = {};
  if (params.areaId !== undefined) body['area_id'] = params.areaId;
  if (params.latitude !== undefined) body['latitude'] = String(params.latitude);
  if (params.longitude !== undefined) body['longitude'] = String(params.longitude);
  if (params.serviceType !== undefined) body['service_type'] = params.serviceType;
  if (params.segmentId !== undefined) body['segment_id'] = params.segmentId;
  if (params.vehicleType !== undefined) body['vehicle_type'] = params.vehicleType;
  if (body['area_id'] === undefined) body['area_id'] = 1;
  if (body['segment_id'] === undefined) body['segment_id'] = 1;
  const envelope = await client.post<unknown>('/user/pool-details', body, { scope: 'user', signal: params.signal });
  return parsePoolVehicles(envelope.data);
}

// ---------------------------------------------------------------------------
// CheckSeats — POST /user/CheckSeats  (UserController@CheckSeats)
// Validates seat availability for pool rides.
// ---------------------------------------------------------------------------

export interface CheckSeatsResult {
  result: string | undefined;
  message: string | undefined;
  seatsAvailable: number;
  totalSeats: number;
}

export async function fetchCheckSeats(
  client: ApiClient,
  params: {
    checkoutId: string | number;
    noOfPerson?: number;
    noOfChildren?: number;
    signal?: AbortSignal;
  },
): Promise<CheckSeatsResult> {
  const body: Record<string, unknown> = {
    checkout_id: params.checkoutId,
    no_of_person: params.noOfPerson ?? 1,
    no_of_children: params.noOfChildren ?? 0,
    wheel_chair_enable: 0,
    baby_seat_enable: 0,
    gender_match: 0,
    no_seat_check: 1,
  };
  const envelope = await client.post<unknown>('/user/CheckSeats', body, { scope: 'user', signal: params.signal });
  const d = obj(envelope.data);
  return {
    result: str(d['result']),
    message: str(d['message']),
    seatsAvailable: num(d['seats_available']) ?? 0,
    totalSeats: num(d['total_seats']) ?? 0,
  };
}

// ── Delivery ──────────────────────────────────────────────────────────────

export interface DeliveryPackage {
  id: number;
  package_name: string;
  dead_weight: number;
  package_length: number;
  package_width: number;
  package_height: number;
  volumetric_capacity: number;
  package_image: string;
  engine_type: string;
}

export async function fetchDeliveryPackages(
  client: ApiClient,
  opts?: { signal?: AbortSignal },
): Promise<DeliveryPackage[]> {
  const envelope = await client.post<unknown>('/user/get-delivery-package', { segment_id: 2 }, { scope: 'user', signal: opts?.signal });
  const d = obj(envelope.data);
  const arr = Array.isArray(d) ? d : Array.isArray(d['packages']) ? d['packages'] : [];
  return arr.map((p) => ({
    id: num(p['id']) ?? 0,
    package_name: str(p['package_name']) ?? '',
    dead_weight: num(p['dead_weight']) ?? 0,
    package_length: num(p['package_length']) ?? 0,
    package_width: num(p['package_width']) ?? 0,
    package_height: num(p['package_height']) ?? 0,
    volumetric_capacity: num(p['volumetric_capacity']) ?? 0,
    package_image: str(p['package_image']) ?? '',
    engine_type: str(p['engine_type']) ?? 'bike',
  }));
}

export interface DeliveryProduct {
  id: number;
  product_name: string;
  description: string;
  weight: number;
  price: number;
  category_id: number;
}

export async function fetchDeliveryProductList(
  client: ApiClient,
  params: { categoryId?: number; signal?: AbortSignal },
): Promise<DeliveryProduct[]> {
  const body: Record<string, unknown> = {};
  if (params.categoryId) body.category_id = params.categoryId;
  const envelope = await client.post<unknown>('/user/delivery/product-list', body, { scope: 'user', signal: params.signal });
  const d = obj(envelope.data);
  const arr = Array.isArray(d) ? d : Array.isArray(d['data']) ? d['data'] : [];
  return arr.map((p) => ({
    id: num(p['id']) ?? 0,
    product_name: str(p['product_name']) ?? '',
    description: str(p['description']) ?? '',
    weight: num(p['weight']) ?? 0,
    price: num(p['price']) ?? 0,
    category_id: num(p['category_id']) ?? 0,
  }));
}

export interface DeliveryCategoryType {
  id: number;
  category_name: string;
}

export async function fetchDeliveryCategoryTypes(
  client: ApiClient,
  opts?: { signal?: AbortSignal },
): Promise<DeliveryCategoryType[]> {
  const envelope = await client.post<unknown>('/user/delivery/category-type', {}, { scope: 'user', signal: opts?.signal });
  const d = obj(envelope.data);
  const arr = Array.isArray(d) ? d : Array.isArray(d['data']) ? d['data'] : [];
  return arr.map((c) => ({
    id: num(c['id']) ?? 0,
    category_name: str(c['category_name']) ?? '',
  }));
}

export interface DeliveryVehicle {
  vehicle_type_id: number;
  vehicle_type_name: string;
  vehicle_type_image: string;
  capacity_kg: number;
  ride_fare: number;
  ride_fare_text: string;
}

export async function fetchDeliveryVehiclePackage(
  client: ApiClient,
  params: { deliveryPackageId: number; signal?: AbortSignal },
): Promise<DeliveryVehicle[]> {
  const envelope = await client.post<unknown>('/user/delivery/checkout/vehicle-delivery-package', {
    delivery_package_id: params.deliveryPackageId,
  }, { scope: 'user', signal: params.signal });
  const d = obj(envelope.data);
  const arr = Array.isArray(d) ? d : Array.isArray(d['data']) ? d['data'] : [];
  return arr.map((v) => ({
    vehicle_type_id: num(v['vehicle_type_id']) ?? 0,
    vehicle_type_name: str(v['vehicle_type_name']) ?? '',
    vehicle_type_image: str(v['vehicle_type_image']) ?? '',
    capacity_kg: num(v['capacity_kg']) ?? 0,
    ride_fare: num(v['ride_fare']) ?? 0,
    ride_fare_text: str(v['ride_fare_text']) ?? '',
  }));
}

export interface DeliveryDrop {
  drop_latitude: number;
  drop_longitude: number;
  drop_location: string;
  contact_name: string;
  contact_phone: string;
  instruction: string;
}

export interface DeliveryCheckoutResult {
  id: string;
  segment_id: number;
  service_type: number;
  service_type_name: string;
  vehicle_type_id: number;
  vehicle_type_name: string;
  vehicle_type_image: string;
  pickup_location: string;
  pickup_latitude: number;
  pickup_longitude: number;
  drop_location: DeliveryDrop[];
  total_drop_location: number;
  product_id: number;
  category_id: number;
  delivery_package_id: number;
  package_name: string;
  weight: number;
  estimate_fare: number;
  estimate_fare_text: string;
  base_fare: number;
  package_fare: number;
  booking_type: number;
  payment_methods: { id: string; name: string; card_id: string | null }[];
}

export async function fetchDeliveryCheckout(
  client: ApiClient,
  params: {
    pickupLatitude: number;
    pickupLongitude: number;
    pickUpLocation: string;
    drops: DeliveryDrop[];
    productId: number;
    categoryId: number;
    deliveryPackageId: number;
    weight: number;
    vehicleType?: number;
    bookingType?: number;
    signal?: AbortSignal;
  },
): Promise<DeliveryCheckoutResult> {
  const body: Record<string, unknown> = {
    segment_id: 2,
    service_type: 6,
    pickup_latitude: params.pickupLatitude,
    pickup_longitude: params.pickupLongitude,
    pick_up_location: params.pickUpLocation,
    drop_location: JSON.stringify(params.drops),
    total_drop_location: params.drops.length,
    product_id: params.productId,
    category_id: params.categoryId,
    delivery_package_id: params.deliveryPackageId,
    weight: params.weight,
    vehicle_type: params.vehicleType ?? 14,
    booking_type: params.bookingType ?? 1,
  };
  const envelope = await client.post<unknown>('/user/delivery/checkout', body, { scope: 'user', signal: params.signal });
  const d = obj(envelope.data);
  const drops = (Array.isArray(d['drop_location']) ? d['drop_location'] : []).map((dd) => ({
    drop_latitude: num(dd['drop_latitude']) ?? 0,
    drop_longitude: num(dd['drop_longitude']) ?? 0,
    drop_location: str(dd['drop_location']) ?? '',
    contact_name: str(dd['contact_name']) ?? '',
    contact_phone: str(dd['contact_phone']) ?? '',
    instruction: str(dd['instruction']) ?? '',
  }));
  return {
    id: str(d['id']) ?? '',
    segment_id: num(d['segment_id']) ?? 2,
    service_type: num(d['service_type']) ?? 6,
    service_type_name: str(d['service_type_name']) ?? 'Delivery',
    vehicle_type_id: num(d['vehicle_type_id']) ?? 14,
    vehicle_type_name: str(d['vehicle_type_name']) ?? '',
    vehicle_type_image: str(d['vehicle_type_image']) ?? '',
    pickup_location: str(d['pickup_location']) ?? '',
    pickup_latitude: num(d['pickup_latitude']) ?? 0,
    pickup_longitude: num(d['pickup_longitude']) ?? 0,
    drop_location: drops,
    total_drop_location: num(d['total_drop_location']) ?? drops.length,
    product_id: num(d['product_id']) ?? 0,
    category_id: num(d['category_id']) ?? 0,
    delivery_package_id: num(d['delivery_package_id']) ?? 0,
    package_name: str(d['package_name']) ?? '',
    weight: num(d['weight']) ?? 0,
    estimate_fare: num(d['estimate_fare']) ?? 0,
    estimate_fare_text: str(d['estimate_fare_text']) ?? '',
    base_fare: num(d['base_fare']) ?? 0,
    package_fare: num(d['package_fare']) ?? 0,
    booking_type: num(d['booking_type']) ?? 1,
    payment_methods: (Array.isArray(d['payment_methods']) ? d['payment_methods'] : []).map((pm) => ({
      id: str(pm['id']) ?? '',
      name: str(pm['name']) ?? '',
      card_id: str(pm['card_id']) ?? '',
    })),
  };
}

export async function fetchDeliveryCheckoutDetails(
  client: ApiClient,
  params: { checkoutId: string; signal?: AbortSignal },
): Promise<DeliveryCheckoutResult> {
  const envelope = await client.post<unknown>('/user/delivery/checkout-details', {
    checkout_id: params.checkoutId,
  }, { scope: 'user', signal: params.signal });
  const d = obj(envelope.data);
  return {
    id: str(d['id']) ?? params.checkoutId,
    segment_id: 2,
    service_type: 6,
    service_type_name: 'Delivery',
    vehicle_type_id: 0,
    vehicle_type_name: str(d['vehicle_type_name']) ?? '',
    vehicle_type_image: '',
    pickup_location: str(d['pickup_location']) ?? '',
    pickup_latitude: 0,
    pickup_longitude: 0,
    drop_location: (Array.isArray(d['drop_location']) ? d['drop_location'] : []).map((dd) => ({
      drop_latitude: num(dd['drop_latitude']) ?? 0,
      drop_longitude: num(dd['drop_longitude']) ?? 0,
      drop_location: str(dd['drop_location']) ?? '',
      contact_name: str(dd['contact_name']) ?? '',
      contact_phone: str(dd['contact_phone']) ?? '',
      instruction: str(dd['instruction']) ?? '',
    })),
    total_drop_location: num(d['total_drop_location']) ?? 1,
    product_id: 0,
    category_id: 0,
    delivery_package_id: 0,
    package_name: str(d['package_name']) ?? '',
    weight: num(d['weight']) ?? 0,
    estimate_fare: num(d['estimate_fare']) ?? 0,
    estimate_fare_text: str(d['estimate_fare_text']) ?? '',
    base_fare: 0,
    package_fare: 0,
    booking_type: num(d['booking_type']) ?? 1,
    payment_methods: (Array.isArray(d['payment_methods']) ? d['payment_methods'] : []).map((pm) => ({
      id: str(pm['id']) ?? '',
      name: str(pm['name']) ?? '',
      card_id: str(pm['card_id']) ?? '',
    })),
  };
}

export async function confirmDeliveryBooking(
  client: ApiClient,
  params: { checkoutId: string; signal?: AbortSignal },
): Promise<{ id: string; bookingStatus: number }> {
  const envelope = await client.post<unknown>('/user/confirm/delivery', {
    checkout_id: params.checkoutId,
  }, { scope: 'user', signal: params.signal });
  const d = obj(envelope.data);
  return {
    id: str(d['id']) ?? '',
    bookingStatus: num(d['booking_status']) ?? 0,
  };
}
