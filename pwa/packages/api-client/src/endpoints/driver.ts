import { z } from 'zod';

import type { ApiClient } from '../client';
import type { ApiEnvelope } from '../envelope';

// ---------------------------------------------------------------------------
// Driver view models
// ---------------------------------------------------------------------------

export interface DriverTokenPayload {
  accessToken: string;
  driver: DriverProfile;
  pushNotification?: unknown;
  raw: Record<string, unknown>;
}

export interface DriverProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCode: string;
  profileImageUrl?: string;
  segmentGroupId: number;
  signupStep: number;
  onlineEnable: boolean;
  onlineConfigStatus: string;
  workSet: boolean;
  rating?: string;
  raw: Record<string, unknown>;
}

export interface DriverMainScreenConfig {
  driverVehicleId?: string;
  configuration: DriverStepHolder[];
  raw: Record<string, unknown>;
}

export type DriverStepType =
  | 'MANAGE_REGISTRATION'
  | 'MANAGE_PERSONAL_DOCUMENT'
  | 'MANAGE_VEHICLE'
  | 'MANAGE_VEHICLE_DOCUMENT'
  | 'MANAGE_SEGMENT_SERVICES'
  | 'MANAGE_AVAILABILITY_SLOT'
  | 'MANAGE_ADDITIONAL_INFORMATION'
  | string;

export interface DriverStepHolder {
  stepName: string;
  stepDescription: string;
  stepStatus: number;
  stepType: DriverStepType;
  buttonDisplay: string;
  buttonText: string;
}

export interface DriverOnlineConfig {
  voiceAlertEnabled: boolean;
  autoAcceptEnabled: boolean;
  radiusKm: number;
  selectedSegments: string[];
  raw: Record<string, unknown>;
}

export interface DriverBooking {
  id: string;
  bookingOrderId: string;
  segmentSlug: string;
  segmentName: string;
  serviceName: string;
  pickupAddress: string;
  dropAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropLatitude?: number;
  dropLongitude?: number;
  userFirstName: string;
  userPhone: string;
  amount: string;
  currency: string;
  otp?: string;
  status: number;
  statusText: string;
  createdAt: string;
  raw: Record<string, unknown>;
}

export type DriverBookingStatus = '1' | '2' | '3' | '4' | '5';
export type DriverAcceptReject = 'ACCEPT' | 'REJECT';

// ---------------------------------------------------------------------------
// Schemas (lenient — mirror live Laravel resources)
// ---------------------------------------------------------------------------

const recordSchema = z.record(z.string(), z.unknown());

const driverResourceSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    UserProfileImage: z.unknown().optional(),
    profile_image: z.unknown().optional(),
    email: z.union([z.string(), z.null()]).optional(),
    phone: z.union([z.string(), z.null()]).optional(),
    phone_code: z.unknown().optional(),
    segment_group_id: z.union([z.string(), z.number()]).optional(),
    signup_step: z.union([z.string(), z.number()]).optional(),
    online_enable: z.union([z.boolean(), z.number(), z.string()]).optional(),
    online_config_status: z.union([z.string(), z.number()]).optional(),
    work_set: z.union([z.boolean(), z.number(), z.string()]).optional(),
    rating: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function toNumber(
  value: unknown,
  fallback: number,
): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toOptionalNumber(value: unknown): number | undefined {
  const candidate = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(candidate) ? candidate : undefined;
}

function toOptionalLatLng(value: unknown): number | undefined {
  const parsed = toOptionalNumber(value);
  if (parsed === undefined) {
    return undefined;
  }
  return Math.abs(parsed) <= 180 ? parsed : undefined;
}

function pickImageUrl(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    const candidate = record['full_url'] ?? record['web_image'] ?? record['url'];
    return typeof candidate === 'string' && candidate.length > 0 ? candidate : undefined;
  }
  return undefined;
}

function pickLogoUrl(data: Record<string, unknown>): string | undefined {
  const businessLogo = pickImageUrl(data['business_logo']);
  if (businessLogo) {
    return businessLogo;
  }
  const theme = readRecord(data['theme_cofig']);
  const driverLogo = pickImageUrl(theme?.['driver_app_logo']);
  if (driverLogo) {
    return driverLogo;
  }
  const general = readRecord(data['general_config']);
  const splash = general?.['splash_screen'];
  return typeof splash === 'string' && splash.trim().length > 0 ? splash : undefined;
}

function unwrapEnvelopeData<T>(envelope: ApiEnvelope<unknown>, path: string): T {
  if (envelope.data === null || typeof envelope.data !== 'object') {
    throw new Error(`API response for ${path} did not include data`);
  }
  return envelope.data as T;
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;
}

function recordAt(value: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  return readRecord(value[key]);
}

// ---------------------------------------------------------------------------
// Device payload  (mirrors Api\DriverController device expectations)
// ---------------------------------------------------------------------------

const PLAYER_ID_KEY = 'fixcycle:driver-player-id';

export function getOrCreatePlayerId(): string {
  if (typeof localStorage === 'undefined') {
    return 'pwa-driver-player-id-0000000000000000000000000000';
  }
  const existing = localStorage.getItem(PLAYER_ID_KEY);
  if (existing) {
    return existing;
  }
  let created: string;
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    created = `fc-${crypto.randomUUID().replace(/-/g, '')}`;
  } else {
    created = `fc-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  }
  try {
    localStorage.setItem(PLAYER_ID_KEY, created);
  } catch {
    // storage unavailable (private mode etc.)
  }
  return created;
}

export interface DriverDevicePayload {
  requested_from: 'web';
  unique_no: string;
  package_name: string;
  apk_version: string;
  device: number;
  operating_system: string;
  language_code: string;
  player_id?: string;
}

const DEVICE_ID_KEY = 'fixcycle:driver-device-unique-no';

export function getOrCreateDriverDeviceId(): string {
  if (typeof localStorage === 'undefined') {
    return 'pwa-driver-unique';
  }
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }
  const created =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `pwa-driver-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  try {
    localStorage.setItem(DEVICE_ID_KEY, created);
  } catch {
    // storage unavailable (private mode etc.)
  }
  return created;
}

export function buildDriverDevicePayload(client: ApiClient): DriverDevicePayload {
  return {
    requested_from: 'web',
    unique_no: getOrCreateDriverDeviceId(),
    package_name: 'com.fixcycle.pwa.driver',
    apk_version: '1.0.0',
    device: 2,
    operating_system: 'WEB',
    language_code: client.locale,
    player_id: getOrCreatePlayerId(),
  };
}

function parseDriverProfile(data: Record<string, unknown>): DriverProfile {
  const parsed = driverResourceSchema.parse(data);
  return {
    id: String(parsed.id ?? ''),
    firstName: parsed.first_name ?? '',
    lastName: parsed.last_name ?? '',
    email: parsed.email ?? '',
    phone: parsed.phone ?? '',
    phoneCode: typeof parsed.phone_code === 'string' ? parsed.phone_code : '',
    profileImageUrl: pickImageUrl(parsed['UserProfileImage'] ?? parsed['profile_image']),
    segmentGroupId: toNumber(parsed.segment_group_id, 1),
    signupStep: toNumber(parsed.signup_step, 0),
    onlineEnable: toBoolean(parsed.online_enable),
    onlineConfigStatus: typeof parsed.online_config_status === 'string' ? parsed.online_config_status : '',
    workSet: toBoolean(parsed.work_set),
    rating: typeof parsed.rating === 'string' ? parsed.rating : parsed.rating === undefined ? undefined : String(parsed.rating),
    raw: data,
  };
}

function parseDriverToken(data: Record<string, unknown>): DriverTokenPayload {
  const accessToken = data['access_token'];
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    throw new Error('API response did not include an access token');
  }
  const driverRecord = recordAt(data, 'driver') ?? data;
  return {
    accessToken,
    driver: parseDriverProfile(driverRecord),
    pushNotification: data['push_notification'],
    raw: data,
  };
}

// ---------------------------------------------------------------------------
// Configuration  /driver/configuration  (Api\DriverController@Configuration)
// ---------------------------------------------------------------------------

export interface DriverConfigurationPayload {
  appName: string;
  businessLogoUrl?: string;
  raw: Record<string, unknown>;
}

const driverConfigurationSchema = z
  .object({
    app_name: z.string().optional(),
    general_config: z.unknown().optional(),
    business_logo: z.unknown().optional(),
  })
  .passthrough();

export async function fetchDriverConfiguration(
  client: ApiClient,
): Promise<DriverConfigurationPayload> {
  const envelope = await client.post<Record<string, unknown>>('/driver/configuration', {
    ...buildDriverDevicePayload(client),
    requested_from: 'web',
  });
  const data = unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/configuration');
  const parsed = driverConfigurationSchema.parse(data);
  return {
    appName: parsed.app_name || 'Fixcycle',
    businessLogoUrl: pickLogoUrl(data),
    raw: data,
  };
}

// ---------------------------------------------------------------------------
// OTP send  /driver/otp  (Api\DriverController@Otp)
// ---------------------------------------------------------------------------

export interface DriverOtpSendResult {
  autoFill: boolean;
  otp?: string;
  defaultOtpEnabled: boolean;
  defaultOtp?: string;
}

const otpSendDataSchema = z
  .object({
    auto_fill: z.union([z.boolean(), z.number()]).optional(),
    otp: z.union([z.string(), z.number()]).optional(),
    default_otp_enable: z.union([z.boolean(), z.number()]).optional(),
    default_otp: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export interface DriverSendOtpParams {
  phone: string;
  type?: string | number;
  countryCode?: string;
}

export async function sendDriverOtp(
  client: ApiClient,
  params: DriverSendOtpParams,
): Promise<DriverOtpSendResult> {
  const envelope = await client.post<Record<string, unknown>>('/driver/otp', {
    ...buildDriverDevicePayload(client),
    type: params.type ?? 3,
    phone: params.phone,
    user_name: params.phone,
    country_code: params.countryCode,
  });
  const data = unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/otp');
  const parsed = otpSendDataSchema.parse(data);
  return {
    autoFill: toBoolean(parsed.auto_fill),
    otp: typeof parsed.otp === 'string' ? parsed.otp : parsed.otp === undefined ? undefined : String(parsed.otp),
    defaultOtpEnabled: toBoolean(parsed.default_otp_enable),
    defaultOtp:
      typeof parsed.default_otp === 'string'
        ? parsed.default_otp
        : parsed.default_otp === undefined
          ? undefined
          : String(parsed.default_otp),
  };
}

// ---------------------------------------------------------------------------
// OTP login  /driver/login/otp  (Api\DriverController@LoginOtp)
// ---------------------------------------------------------------------------

export interface DriverLoginWithOtpParams {
  phone: string;
  loginOtp: string;
  playerId?: string;
}

export async function driverLoginWithOtp(
  client: ApiClient,
  params: DriverLoginWithOtpParams,
): Promise<DriverTokenPayload> {
  const envelope = await client.post<Record<string, unknown>>('/driver/login/otp', {
    ...buildDriverDevicePayload(client),
    phone: params.phone,
    login_otp: params.loginOtp,
    player_id: params.playerId ?? getOrCreatePlayerId(),
  });
  return parseDriverToken(unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/login/otp'));
}

// ---------------------------------------------------------------------------
// Password login  /driver/on-board  (Api\DriverController@Login)
// ---------------------------------------------------------------------------

export interface DriverLoginWithPasswordParams {
  phone: string;
  password: string;
  countryCode?: string;
}

export async function driverLoginWithPassword(
  client: ApiClient,
  params: DriverLoginWithPasswordParams,
): Promise<DriverTokenPayload> {
  const envelope = await client.post<Record<string, unknown>>('/driver/on-board', {
    ...buildDriverDevicePayload(client),
    requested_from: 'web',
    phone: params.phone,
    password: params.password,
    ...(params.countryCode ? { country_code: params.countryCode } : {}),
  });
  return parseDriverToken(unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/on-board'));
}

// ---------------------------------------------------------------------------
// Demo onboard  /driver/demo-onboard  (Api\DriverController@demoLogin)
// ---------------------------------------------------------------------------

export async function driverDemoOnboard(client: ApiClient): Promise<DriverTokenPayload> {
  const envelope = await client.post<Record<string, unknown>>('/driver/demo-onboard', {
    ...buildDriverDevicePayload(client),
  });
  return parseDriverToken(
    unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/demo-onboard'),
  );
}

// ---------------------------------------------------------------------------
// Driver profile  /driver/details  (Api\DriverController@DriverDetails)
// ---------------------------------------------------------------------------

export async function fetchDriverDetails(
  client: ApiClient,
  options?: { signal?: AbortSignal },
): Promise<DriverProfile> {
  const envelope = await client.post<Record<string, unknown>>(
    '/driver/details',
    buildDriverDevicePayload(client),
    { scope: 'driver', signal: options?.signal },
  );
  return parseDriverProfile(unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/details'));
}

// ---------------------------------------------------------------------------
// Logout  /driver/out-board  (Api\DriverController@Logout)
// ---------------------------------------------------------------------------

export async function logoutDriver(client: ApiClient): Promise<void> {
  try {
    await client.post<unknown>('/driver/out-board', buildDriverDevicePayload(client), { scope: 'driver' });
  } finally {
    await client.tokenStore.clearToken('driver');
  }
}

// ---------------------------------------------------------------------------
// Main screen config  /driver/get-main-screen-config
// ---------------------------------------------------------------------------

const stepSchema = z
  .object({
    step_name: z.union([z.string(), z.number()]).optional(),
    step_description: z.union([z.string(), z.number()]).optional(),
    step_status: z.union([z.string(), z.number()]).optional(),
    step_type: z.union([z.string(), z.number()]).optional(),
    button_display: z.union([z.string(), z.number()]).optional(),
    button_text: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export function parseDriverMainScreenConfig(data: Record<string, unknown>): DriverMainScreenConfig {
  const rawConfig = data['configuration'];
  const config = Array.isArray(rawConfig)
    ? rawConfig
    : readRecord(data) && Array.isArray(readRecord(data)?.['configuration'])
      ? (readRecord(data)?.['configuration'] as unknown[])
      : [];
  const steps = config.flatMap((entry): DriverStepHolder[] => {
    const record = readRecord(entry);
    if (!record) {
      return [];
    }
    const parsed = stepSchema.parse(record);
    return [
      {
        stepName: String(parsed.step_name ?? ''),
        stepDescription: String(parsed.step_description ?? ''),
        stepStatus: toNumber(parsed.step_status, 1),
        stepType: String(parsed.step_type ?? ''),
        buttonDisplay: String(parsed.button_display ?? ''),
        buttonText: String(parsed.button_text ?? ''),
      },
    ];
  });
  return {
    driverVehicleId:
      data['driver_vehicle_id'] === undefined ? undefined : String(data['driver_vehicle_id']),
    configuration: steps,
    raw: data,
  };
}

export async function fetchDriverMainScreenConfig(
  client: ApiClient,
): Promise<DriverMainScreenConfig> {
  const envelope = await client.post<Record<string, unknown>>('/driver/get-main-screen-config', {
    ...buildDriverDevicePayload(client),
  });
  return parseDriverMainScreenConfig(
    unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/get-main-screen-config'),
  );
}

// ---------------------------------------------------------------------------
// Online work config  /driver/get-online-work-config + /save-online-work-config
// ---------------------------------------------------------------------------

const onlineConfigSchema = z
  .object({
    voice_alert_enable: z.union([z.boolean(), z.number(), z.string()]).optional(),
    auto_accept_enable: z.union([z.boolean(), z.number(), z.string()]).optional(),
    ride_accept_radius: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export function parseDriverOnlineConfig(data: Record<string, unknown>): DriverOnlineConfig {
  const parsed = onlineConfigSchema.parse(data);
  const segments: string[] = [];
  const rawSegments = data['segments'] ?? data['segment_list'] ?? data['work_set'];
  if (Array.isArray(rawSegments)) {
    for (const entry of rawSegments) {
      const record = readRecord(entry);
      const slug = record?.['segment_slug'] ?? record?.['slug'];
      const id = record?.['segment_id'] ?? record?.['id'];
      if (typeof slug === 'string' && slug.length > 0) {
        segments.push(slug);
      } else if (id !== undefined) {
        segments.push(String(id));
      }
    }
  }
  return {
    voiceAlertEnabled: toBoolean(parsed.voice_alert_enable),
    autoAcceptEnabled: toBoolean(parsed.auto_accept_enable),
    radiusKm: toNumber(parsed.ride_accept_radius, 5),
    selectedSegments: segments,
    raw: data,
  };
}

export async function fetchDriverOnlineConfig(client: ApiClient): Promise<DriverOnlineConfig> {
  const envelope = await client.post<Record<string, unknown>>('/driver/get-online-work-config', {
    ...buildDriverDevicePayload(client),
  });
  return parseDriverOnlineConfig(
    unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/get-online-work-config'),
  );
}

export interface DriverSaveOnlineConfigParams {
  voiceAlertEnabled: boolean;
  autoAcceptEnabled: boolean;
  radiusKm: number;
}

export async function saveDriverOnlineConfig(
  client: ApiClient,
  params: DriverSaveOnlineConfigParams,
): Promise<unknown> {
  const envelope = await client.post<unknown>('/driver/save-online-work-config', {
    ...buildDriverDevicePayload(client),
    voice_alert_enable: params.voiceAlertEnabled ? 1 : 0,
    auto_accept_enable: params.autoAcceptEnabled ? 1 : 0,
    ride_accept_radius: params.radiusKm,
    report_submit: 1,
  });
  return envelope.data;
}

// ---------------------------------------------------------------------------
// Driver location  /driver/location  (Api\DriverController@Location)
// ---------------------------------------------------------------------------

export interface DriverLocationParams {
  latitude: number;
  longitude: number;
  bearing?: number;
}

export async function updateDriverLocation(
  client: ApiClient,
  params: DriverLocationParams,
): Promise<unknown> {
  const envelope = await client.post<unknown>('/driver/location', {
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    ...(params.bearing !== undefined ? { bearing: params.bearing } : {}),
  });
  return envelope.data;
}

// ---------------------------------------------------------------------------
// Online / offline  /driver/online-offline  (Api\DriverController@OnlineOffline)
// ---------------------------------------------------------------------------

export async function setDriverOnlineState(client: ApiClient, online: boolean): Promise<unknown> {
  const envelope = await client.post<unknown>('/driver/online-offline', {
    ...buildDriverDevicePayload(client),
    provider_online: online ? 1 : 0,
  });
  return envelope.data;
}

// ---------------------------------------------------------------------------
// Incoming booking order info  /driver/booking-order-info
// ---------------------------------------------------------------------------

const bookingOrderSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    booking_order_id: z.union([z.string(), z.number()]).optional(),
    segment_slug: z.string().optional(),
    segment_name: z.string().optional(),
    service_name: z.string().optional(),
    pickup_address: z.string().optional(),
    drop_address: z.string().optional(),
    pickup_latitude: z.union([z.string(), z.number()]).optional(),
    pickup_longitude: z.union([z.string(), z.number()]).optional(),
    drop_latitude: z.union([z.string(), z.number()]).optional(),
    drop_longitude: z.union([z.string(), z.number()]).optional(),
    user_first_name: z.string().optional(),
    user_phone: z.union([z.string(), z.number()]).optional(),
    total_amount: z.union([z.string(), z.number()]).optional(),
    currency: z.string().optional(),
    otp: z.string().optional(),
    booking_status: z.union([z.string(), z.number()]).optional(),
    status_text: z.string().optional(),
    created_at: z.string().optional(),
  })
  .passthrough();

export function parseDriverBooking(data: Record<string, unknown>): DriverBooking {
  const parsed = bookingOrderSchema.parse(data);
  const id = parsed.id ?? parsed.booking_order_id;
  return {
    id: String(id ?? ''),
    bookingOrderId: String(parsed.booking_order_id ?? id ?? ''),
    segmentSlug: parsed.segment_slug ?? '',
    segmentName: parsed.segment_name ?? '',
    serviceName: parsed.service_name ?? '',
    pickupAddress: parsed.pickup_address ?? '',
    dropAddress: parsed.drop_address ?? '',
    pickupLatitude: toOptionalLatLng(parsed.pickup_latitude),
    pickupLongitude: toOptionalLatLng(parsed.pickup_longitude),
    dropLatitude: toOptionalLatLng(parsed.drop_latitude),
    dropLongitude: toOptionalLatLng(parsed.drop_longitude),
    userFirstName: parsed.user_first_name ?? '',
    userPhone:
      typeof parsed.user_phone === 'string' ? parsed.user_phone : parsed.user_phone === undefined ? '' : String(parsed.user_phone),
    amount:
      typeof parsed.total_amount === 'string' ? parsed.total_amount : parsed.total_amount === undefined ? '0' : String(parsed.total_amount),
    currency: parsed.currency ?? '₹',
    otp: parsed.otp,
    status: toNumber(parsed.booking_status, 0),
    statusText: parsed.status_text ?? '',
    createdAt: parsed.created_at ?? '',
    raw: data,
  };
}

export async function fetchDriverBookingOrderInfo(
  client: ApiClient,
  bookingOrderId: string | number,
): Promise<DriverBooking> {
  const envelope = await client.post<Record<string, unknown>>('/driver/booking-order-info', {
    ...buildDriverDevicePayload(client),
    booking_order_id: bookingOrderId,
  });
  return parseDriverBooking(
    unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/booking-order-info'),
  );
}

// ---------------------------------------------------------------------------
// Accept / reject  /driver/booking-order-accept-reject
// ---------------------------------------------------------------------------

export interface DriverAcceptRejectParams {
  bookingOrderId: string | number;
  status: DriverAcceptReject;
  segmentSlug: string;
  latitude: number;
  longitude: number;
}

export async function driverBookingAcceptReject(
  client: ApiClient,
  params: DriverAcceptRejectParams,
): Promise<unknown> {
  const envelope = await client.post<unknown>('/driver/booking-order-accept-reject', {
    segment_slug: params.segmentSlug,
    booking_order_id: params.bookingOrderId,
    status: params.status,
    latitude: String(params.latitude),
    longitude: String(params.longitude),
  });
  return envelope.data;
}

// ---------------------------------------------------------------------------
// Arrived at pickup  /driver/arrived-at-pickup
// ---------------------------------------------------------------------------

export async function driverArrivedAtPickup(
  client: ApiClient,
  bookingOrderId: string | number,
): Promise<unknown> {
  const envelope = await client.post<unknown>('/driver/arrived-at-pickup', {
    ...buildDriverDevicePayload(client),
    booking_order_id: bookingOrderId,
  });
  return envelope.data;
}

// ---------------------------------------------------------------------------
// Picked up  /driver/booking-order-picked
// ---------------------------------------------------------------------------

export async function driverBookingOrderPicked(
  client: ApiClient,
  bookingOrderId: string | number,
): Promise<unknown> {
  const envelope = await client.post<unknown>('/driver/booking-order-picked', {
    ...buildDriverDevicePayload(client),
    booking_order_id: bookingOrderId,
  });
  return envelope.data;
}

// ---------------------------------------------------------------------------
// Direction data  /driver/direction-data
// ---------------------------------------------------------------------------

export interface DriverDirectionParams {
  pickupLatitude: number;
  pickupLongitude: number;
  dropLatitude: number;
  dropLongitude: number;
}

export interface DriverDirectionResult {
  distanceText: string;
  distanceMeters: number;
  durationText: string;
  durationSeconds: number;
  encodedPolyline: string;
  raw: Record<string, unknown>;
}

export async function fetchDriverDirection(
  client: ApiClient,
  params: DriverDirectionParams,
): Promise<DriverDirectionResult> {
  const envelope = await client.post<Record<string, unknown>>('/driver/direction-data', {
    ...buildDriverDevicePayload(client),
    origin_latitude: String(params.pickupLatitude),
    origin_longitude: String(params.pickupLongitude),
    destination_latitude: String(params.dropLatitude),
    destination_longitude: String(params.dropLongitude),
  });
  const data = unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/direction-data');
  const routes = Array.isArray(data['routes']) ? data['routes'] : [];
  const firstRoute = routes.length > 0 ? readRecord(routes[0]) : undefined;
  const legs = Array.isArray(firstRoute?.['legs']) ? firstRoute?.['legs'] : [];
  const firstLeg = legs.length > 0 ? readRecord(legs[0]) : undefined;
  const distance = readRecord(firstLeg?.['distance']);
  const duration = readRecord(firstLeg?.['duration']);
  const poly = readRecord(firstRoute?.['overview_polyline']);
  return {
    distanceText: typeof distance?.['text'] === 'string' ? distance?.['text'] : '',
    distanceMeters: toNumber(distance?.['value'], 0),
    durationText: typeof duration?.['text'] === 'string' ? duration?.['text'] : '',
    durationSeconds: toNumber(duration?.['value'], 0),
    encodedPolyline:
      typeof poly?.['points'] === 'string'
        ? (poly?.['points'] as string)
        : typeof data['polyline'] === 'string'
          ? (data['polyline'] as string)
          : '',
    raw: data,
  };
}

// ---------------------------------------------------------------------------
// End booking  /driver/booking/end  (Api\BookingController@endBooking)
// ---------------------------------------------------------------------------

export async function driverEndBooking(
  client: ApiClient,
  bookingOrderId: string | number,
): Promise<unknown> {
  const envelope = await client.post<unknown>('/driver/booking/end', {
    ...buildDriverDevicePayload(client),
    booking_order_id: bookingOrderId,
  });
  return envelope.data;
}

// ---------------------------------------------------------------------------
// Payment info  /driver/get-booking-order-payment-info
// ---------------------------------------------------------------------------

export interface DriverPaymentInfo {
  payableAmount: string;
  currency: string;
  paymentMethods: string[];
  cashAmount: string;
  onlineAmount: string;
  raw: Record<string, unknown>;
}

export async function fetchDriverPaymentInfo(
  client: ApiClient,
  bookingOrderId: string | number,
): Promise<DriverPaymentInfo> {
  const envelope = await client.post<Record<string, unknown>>('/driver/get-booking-order-payment-info', {
    ...buildDriverDevicePayload(client),
    booking_order_id: bookingOrderId,
  });
  const data = unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/get-booking-order-payment-info');
  const methods: string[] = [];
  for (const key of ['payment_method', 'payment_methods', 'payment_mode']) {
    const value = data[key];
    if (typeof value === 'string' && value.length > 0) {
      methods.push(value);
    } else if (Array.isArray(value)) {
      for (const entry of value) {
        const record = readRecord(entry);
        const name = record?.['name'] ?? record?.['payment_method_name'];
        if (typeof name === 'string' && name.length > 0) {
          methods.push(name);
        }
      }
    }
    if (methods.length > 0) {
      break;
    }
  }
  const totalAmount = data['total_amount'] ?? data['amount'] ?? data['payable_amount'];
  return {
    payableAmount: typeof totalAmount === 'string' ? totalAmount : totalAmount === undefined ? '0' : String(totalAmount),
    currency: typeof data['currency'] === 'string' ? data['currency'] : '₹',
    paymentMethods: methods,
    cashAmount: typeof data['cash_amount'] === 'string' ? data['cash_amount'] : '',
    onlineAmount: typeof data['online_amount'] === 'string' ? data['online_amount'] : '',
    raw: data,
  };
}

// ---------------------------------------------------------------------------
// Payment confirmation  /driver/booking/payment-confirmation
// ---------------------------------------------------------------------------

export interface DriverConfirmPaymentParams {
  bookingOrderId: string | number;
  paymentBy: string;
}

export async function driverConfirmPayment(
  client: ApiClient,
  params: DriverConfirmPaymentParams,
): Promise<unknown> {
  const envelope = await client.post<unknown>('/driver/booking/payment-confirmation', {
    ...buildDriverDevicePayload(client),
    booking_order_id: params.bookingOrderId,
    payment_type: params.paymentBy,
    status: 1,
  });
  return envelope.data;
}

// ---------------------------------------------------------------------------
// Complete  /driver/complete-booking-order
// ---------------------------------------------------------------------------

export async function driverCompleteBookingOrder(
  client: ApiClient,
  bookingOrderId: string | number,
): Promise<unknown> {
  const envelope = await client.post<unknown>('/driver/complete-booking-order', {
    ...buildDriverDevicePayload(client),
    booking_order_id: bookingOrderId,
  });
  return envelope.data;
}

// ---------------------------------------------------------------------------
// Active / past bookings + detail
// ---------------------------------------------------------------------------

function parseBookingList(data: unknown, path: string): DriverBooking[] {
  if (data === null || typeof data !== 'object') {
    return [];
  }
  const record = data as Record<string, unknown>;
  const rawList =
    (Array.isArray(record['bookings']) && record['bookings']) ||
    (Array.isArray(record['orders']) && record['orders']) ||
    (Array.isArray(record['list']) && record['list']) ||
    (Array.isArray(record['data']) && record['data']) ||
    (Array.isArray(record['arr']) && record['arr']);
  if (Array.isArray(rawList)) {
    return rawList.flatMap((entry): DriverBooking[] => {
      const item = readRecord(entry);
      return item ? [parseDriverBooking(item)] : [];
    });
  }
  throw new Error(`API response for ${path} did not include a booking list`);
}

export async function fetchDriverActiveBookings(
  client: ApiClient,
): Promise<DriverBooking[]> {
  const envelope = await client.post<unknown>('/driver/get-active-booking-order', {
    ...buildDriverDevicePayload(client),
  });
  return parseBookingList(envelope.data, '/driver/get-active-booking-order');
}

export async function fetchDriverPastBookings(
  client: ApiClient,
): Promise<DriverBooking[]> {
  const envelope = await client.post<unknown>('/driver/get-past-booking-order', {
    ...buildDriverDevicePayload(client),
  });
  return parseBookingList(envelope.data, '/driver/get-past-booking-order');
}

export async function fetchDriverBookingDetails(
  client: ApiClient,
  bookingOrderId: string | number,
): Promise<DriverBooking> {
  const envelope = await client.post<Record<string, unknown>>('/driver/get-booking-order-details', {
    ...buildDriverDevicePayload(client),
    booking_order_id: bookingOrderId,
  });
  return parseDriverBooking(
    unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/get-booking-order-details'),
  );
}

// ---------------------------------------------------------------------------
// Registration wizard steps  (Api\DriverController)
//
// Mirrors the Android on-board flow: each step POSTs its form payload to the
// named Laravel route and returns a refreshed driver + next signup step.
// Bodies are passed through verbatim (envelope mocks in dev accept any shape).
// ---------------------------------------------------------------------------

export type DriverWizardStepParams = Record<string, unknown>;

export interface DriverWizardStepResult {
  driver: DriverProfile;
  raw: Record<string, unknown>;
}

function parseWizardStep(data: Record<string, unknown>, path: string): DriverWizardStepResult {
  const driverRecord = recordAt(data, 'driver') ?? data;
  return {
    driver: parseDriverProfile(driverRecord),
    raw: data,
  };
}

async function submitWizardStep(
  client: ApiClient,
  path: string,
  body: Record<string, unknown>,
): Promise<DriverWizardStepResult> {
  const envelope = await client.post<Record<string, unknown>>(path, {
    ...buildDriverDevicePayload(client),
    ...body,
  });
  return parseWizardStep(unwrapEnvelopeData<Record<string, unknown>>(envelope, path), path);
}

export interface DriverWizardStepSubmitter {
  (client: ApiClient, params: DriverWizardStepParams): Promise<DriverWizardStepResult>;
}

// signupStep 1 — personal details  /driver/reg-step-one
export async function submitDriverRegStepOne(
  client: ApiClient,
  params: DriverWizardStepParams,
): Promise<DriverWizardStepResult> {
  return submitWizardStep(client, '/driver/reg-step-one', params);
}

// signupStep 2 — personal documents  /driver/reg-step-two
export async function submitDriverRegStepTwo(
  client: ApiClient,
  params: DriverWizardStepParams,
): Promise<DriverWizardStepResult> {
  return submitWizardStep(client, '/driver/reg-step-two', params);
}

// signupStep 3 — vehicle details  /driver/reg-step-three
export async function submitDriverRegStepThree(
  client: ApiClient,
  params: DriverWizardStepParams,
): Promise<DriverWizardStepResult> {
  return submitWizardStep(client, '/driver/reg-step-three', params);
}

// signupStep 5 — service segments  /driver/reg-step-five
export async function submitDriverRegStepFive(
  client: ApiClient,
  params: DriverWizardStepParams,
): Promise<DriverWizardStepResult> {
  return submitWizardStep(client, '/driver/reg-step-five', params);
}

// signupStep 7 — segment config / availability /driver/save-segment-config
export async function saveDriverSegmentConfig(
  client: ApiClient,
  params: DriverWizardStepParams,
): Promise<DriverWizardStepResult> {
  return submitWizardStep(client, '/driver/save-segment-config', params);
}

// signupStep 7 — availability slots /driver/save-service-time-slot
export async function saveDriverServiceTimeSlot(
  client: ApiClient,
  params: DriverWizardStepParams,
): Promise<DriverWizardStepResult> {
  return submitWizardStep(client, '/driver/save-service-time-slot', params);
}

// ---------------------------------------------------------------------------
// Phase 14 — Driver documents  (Api\DriverController)
//
//   /driver/get-document-list   → { personal_doc, vehicle_doc, segment_doc }
//   /driver/add-document        → upload a personal/vehicle/segment doc
//   /driver/driver-all-document → flat list of every document uploaded
//   /driver/check-expired-document → documents past their expiry date
//   /driver/expiredocuments     → ExpireDocumentController index
// ---------------------------------------------------------------------------

export type DriverDocumentFor = 'PERSONAL' | 'SEGMENT' | 'VEHICLE';

export interface DriverDocumentItem {
  id: string;
  documentId?: string;
  documentName: string;
  documentFile?: string;
  mandatory: boolean;
  numberRequired: boolean;
  expireStatus: number;
  expireDate?: string;
  verificationStatusText: string;
  statusInt: number;
  tempDocStatus: number;
  tempDocumentFile?: string;
  tempVerificationStatusText: string;
  raw: Record<string, unknown>;
}

const driverDocumentSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    document_id: z.union([z.string(), z.number()]).optional(),
    documentname: z.string().optional(),
    document_file: z.unknown().optional(),
    document_mandatory: z.union([z.boolean(), z.string(), z.number()]).optional(),
    document_number_required: z.union([z.boolean(), z.string(), z.number()]).optional(),
    expire_status: z.union([z.string(), z.number()]).optional(),
    expire_date: z.union([z.string(), z.null()]).optional(),
    document_verification_status: z.string().optional(),
    document_status_int: z.union([z.string(), z.number()]).optional(),
    temp_doc_status: z.union([z.string(), z.number()]).optional(),
    temp_document_file: z.unknown().optional(),
    temp_document_verification_status: z.string().optional(),
  })
  .passthrough();

export function parseDriverDocument(data: Record<string, unknown>): DriverDocumentItem {
  const parsed = driverDocumentSchema.parse(data);
  return {
    id: String(parsed.id ?? parsed.document_id ?? ''),
    documentId: parsed.document_id === undefined ? undefined : String(parsed.document_id),
    documentName: String(parsed.documentname ?? data['document_name'] ?? data['name'] ?? ''),
    documentFile: pickImageUrl(parsed.document_file),
    mandatory: toBoolean(parsed.document_mandatory),
    numberRequired: toBoolean(parsed.document_number_required),
    expireStatus: toNumber(parsed.expire_status, 0),
    expireDate: typeof parsed.expire_date === 'string' ? parsed.expire_date : undefined,
    verificationStatusText: parsed.document_verification_status ?? '',
    statusInt: toNumber(parsed.document_status_int, 0),
    tempDocStatus: toNumber(parsed.temp_doc_status, 0),
    tempDocumentFile: pickImageUrl(parsed.temp_document_file),
    tempVerificationStatusText: parsed.temp_document_verification_status ?? '',
    raw: data,
  };
}

export interface DriverVehicleDocumentGroup {
  vehicleId: string;
  vehicleType: string;
  vehicleTypeImage?: string;
  vehicleNumber: string;
  vehicleStatus: string;
  documents: DriverDocumentItem[];
  raw: Record<string, unknown>;
}

export interface DriverSegmentDocumentGroup {
  segmentId: string;
  segmentName: string;
  icon?: string;
  checkable: boolean;
  documents: DriverDocumentItem[];
  raw: Record<string, unknown>;
}

export interface DriverDocumentsResult {
  personal: DriverDocumentItem[];
  vehicles: DriverVehicleDocumentGroup[];
  segments: DriverSegmentDocumentGroup[];
  hasAnyItem: boolean;
  raw: Record<string, unknown>;
}

function parseDocumentGroupList(
  value: unknown,
  key: 'documents' | 'document_list',
): DriverDocumentItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry): DriverDocumentItem[] => {
    const record = readRecord(entry);
    if (!record) {
      return [];
    }
    const inner =
      Array.isArray(record[key]) && (record[key] as unknown[]).length > 0 && Array.isArray(record[key])
        ? (record[key] as unknown[])
        : [record];
    return inner.flatMap((item): DriverDocumentItem[] => {
      const itemRecord = readRecord(item);
      return itemRecord ? [parseDriverDocument(itemRecord)] : [];
    });
  });
}

export function parseDriverDocuments(data: Record<string, unknown>): DriverDocumentsResult {
  const vehicles: DriverVehicleDocumentGroup[] = [];
  const rawVehicles = data['vehicle_doc'];
  if (Array.isArray(rawVehicles)) {
    for (const entry of rawVehicles) {
      const record = readRecord(entry);
      if (!record) {
        continue;
      }
      vehicles.push({
        vehicleId: String(record['vehicle_id'] ?? record['driver_vehicle_id'] ?? ''),
        vehicleType: String(record['vehicle_type'] ?? ''),
        vehicleTypeImage: pickImageUrl(record['vehicle_type_image']),
        vehicleNumber: String(record['vehicle_number'] ?? ''),
        vehicleStatus: String(record['vehicle_status'] ?? record['vehicle_verification_status'] ?? ''),
        documents: parseDocumentGroupList(record['document_list'], 'document_list'),
        raw: record,
      });
    }
  }

  const segments: DriverSegmentDocumentGroup[] = [];
  const rawSegments = data['segment_doc'];
  if (Array.isArray(rawSegments)) {
    for (const entry of rawSegments) {
      const record = readRecord(entry);
      if (!record) {
        continue;
      }
      segments.push({
        segmentId: String(record['segment_id'] ?? record['id'] ?? ''),
        segmentName: String(record['segment_name'] ?? record['name'] ?? ''),
        icon: pickImageUrl(record['icon']),
        checkable: toBoolean(record['checkable']),
        documents: parseDocumentGroupList(record['document_list'], 'document_list'),
        raw: record,
      });
    }
  }

  const personal = parseDocumentGroupList(data['personal_doc'], 'document_list');
  const docList = Array.isArray(data['doc']) ? data['doc'] : [];
  const docName =
    typeof recordAt(data, 'doc')?.['documentname'] === 'string'
      ? (recordAt(data, 'doc')?.['documentname'] as string)
      : '';

  return {
    personal,
    vehicles,
    segments,
    hasAnyItem: personal.length > 0 || vehicles.length > 0 || segments.length > 0 || docList.length > 0,
    raw: data,
  };
}

export interface FetchDriverDocumentsParams {
  documentFor: DriverDocumentFor | 'ALL';
  driverVehicleId?: string;
  segmentId?: string;
  id?: string | number;
  callFor?: string;
}

export async function fetchDriverDocuments(
  client: ApiClient,
  params: FetchDriverDocumentsParams,
): Promise<DriverDocumentsResult> {
  const envelope = await client.post<Record<string, unknown>>('/driver/get-document-list', {
    ...buildDriverDevicePayload(client),
    document_for: params.documentFor,
    ...(params.driverVehicleId ? { driver_vehicle_id: params.driverVehicleId } : {}),
    ...(params.segmentId ? { segment_id: params.segmentId } : {}),
    ...(params.id !== undefined ? { id: params.id } : {}),
    ...(params.callFor ? { call_for: params.callFor } : {}),
  });
  return parseDriverDocuments(
    unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/get-document-list'),
  );
}

export interface AddDriverDocumentParams {
  documentId?: string | number;
  documentFor?: DriverDocumentFor;
  documentImage?: string;
  documentNumber?: string;
  numberRequired?: boolean;
  expireStatus?: number;
  expireDate?: string;
  type?: number;
  driverVehicleId?: string;
  segmentId?: string;
  merchantId?: string | number;
}

export async function addDriverDocument(
  client: ApiClient,
  params: AddDriverDocumentParams,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/add-document', {
    ...buildDriverDevicePayload(client),
    ...(params.documentId !== undefined ? { document_id: params.documentId } : {}),
    ...(params.documentFor ? { document_for: params.documentFor } : {}),
    ...(params.documentImage ? { document_image: params.documentImage } : {}),
    ...(params.documentNumber ? { document_number: params.documentNumber } : {}),
    ...(params.numberRequired !== undefined ? { document_number_required: params.numberRequired ? 1 : 0 } : {}),
    ...(params.expireStatus !== undefined ? { expire_status: params.expireStatus } : {}),
    ...(params.expireDate ? { expire_date: params.expireDate } : {}),
    ...(params.type !== undefined ? { type: params.type } : {}),
    ...(params.driverVehicleId ? { driver_vehicle_id: params.driverVehicleId } : {}),
    ...(params.segmentId ? { segment_id: params.segmentId } : {}),
    ...(params.merchantId !== undefined ? { merchant_id: params.merchantId } : {}),
  });
  return envelope.data as Record<string, unknown>;
}

// Flat "every document uploaded" list  /driver/driver-all-document
export async function fetchDriverAllDocuments(client: ApiClient): Promise<DriverDocumentItem[]> {
  const envelope = await client.post<unknown>('/driver/driver-all-document', {
    ...buildDriverDevicePayload(client),
  });
  const data = envelope.data;
  const rawList = Array.isArray(data) ? data : recordAt(data as Record<string, unknown>, 'doc'); 
  if (Array.isArray(rawList)) {
    return rawList.flatMap((entry): DriverDocumentItem[] => {
      const record = readRecord(entry);
      return record ? [parseDriverDocument(record)] : [];
    });
  }
  return [];
}

// Documents nearing/after expiry  /driver/check-expired-document
export async function fetchDriverExpiredDocuments(client: ApiClient): Promise<DriverDocumentItem[]> {
  const envelope = await client.post<unknown>('/driver/check-expired-document', {
    ...buildDriverDevicePayload(client),
  });
  const data = envelope.data;
  const list = Array.isArray(data) ? data : readRecord(data as Record<string, unknown>)?.['doc'];
  if (Array.isArray(list)) {
    return list.flatMap((entry): DriverDocumentItem[] => {
      const record = readRecord(entry);
      return record ? [parseDriverDocument(record)] : [];
    });
  }
  return [];
}

// ---------------------------------------------------------------------------
// Phase 14 — Driver vehicles  (Api\DriverVehicleController)
//
//   /driver/vehicle-configuration → vehicle types + makes for the add form
//   /driver/vehicle-model         → models for a make/type
//   /driver/add-vehicle           → create vehicle, returns driver_vehicle_id
//   /driver/vehicle/otp           → vehicle-request OTP verification
//   /driver/vehicle-request       → attach a vehicle shared by sharing code
//   /driver/get-vehicle-list      → the driver's own vehicles
//   /driver/changeVehicle         → switch active vehicle
// ---------------------------------------------------------------------------

export interface DriverVehicleKindOption {
  id: string;
  name: string;
  image?: string;
  raw: Record<string, unknown>;
}

export interface DriverVehicleConfigurationResult {
  vehicleTypes: DriverVehicleKindOption[];
  vehicleMakes: DriverVehicleKindOption[];
  raw: Record<string, unknown>;
}

function parseKindOptions(value: unknown): DriverVehicleKindOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry): DriverVehicleKindOption[] => {
    const record = readRecord(entry);
    if (!record) {
      return [];
    }
    const id = record['id'] ?? record['vehicle_type_id'] ?? record['vehicle_make_id'];
    return [
      {
        id: String(id ?? ''),
        name: String(
          record['vehicle_type'] ??
            record['vehicle_type_name'] ??
            record['vehicle_make'] ??
            record['make_name'] ??
            record['name'] ??
            '',
        ),
        image: pickImageUrl(record['vehicle_type_image'] ?? record['vehicle_make_image'] ?? record['image']),
        raw: record,
      },
    ];
  });
}

export async function fetchVehicleConfiguration(
  client: ApiClient,
): Promise<DriverVehicleConfigurationResult> {
  const envelope = await client.post<Record<string, unknown>>('/driver/vehicle-configuration', {
    ...buildDriverDevicePayload(client),
  });
  const data = unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/vehicle-configuration');
  return {
    vehicleTypes: parseKindOptions(data['vehicle_type']),
    vehicleMakes: parseKindOptions(data['vehicle_make'] ?? data['marge_list'] ?? data['vehicle_makes']),
    raw: data,
  };
}

export interface DriverVehicleModelOption {
  id: string;
  name: string;
  raw: Record<string, unknown>;
}

export interface FetchVehicleModelsParams {
  vehicleTypeId?: string | number;
  vehicleMakeId?: string | number;
}

export async function fetchVehicleModels(
  client: ApiClient,
  params: FetchVehicleModelsParams,
): Promise<DriverVehicleModelOption[]> {
  const envelope = await client.post<unknown>('/driver/vehicle-model', {
    ...buildDriverDevicePayload(client),
    ...(params.vehicleTypeId !== undefined ? { vehicle_type_id: params.vehicleTypeId } : {}),
    ...(params.vehicleMakeId !== undefined ? { vehicle_make_id: params.vehicleMakeId } : {}),
  });
  const data = envelope.data;
  const list = Array.isArray(data) ? data : readRecord(data as Record<string, unknown>)?.['model'];
  if (!Array.isArray(list)) {
    return [];
  }
  return list.flatMap((entry): DriverVehicleModelOption[] => {
    const record = readRecord(entry);
    if (!record) {
      return [];
    }
    const id = record['id'] ?? record['vehicle_model_id'];
    return [
      {
        id: String(id ?? ''),
        name: String(
          record['vehicleTypeName'] ??
            record['vehicle_model_name'] ??
            record['vehicle_model'] ??
            record['model_name'] ??
            record['name'] ??
            '',
        ),
        raw: record,
      },
    ];
  });
}

export interface AddDriverVehicleParams {
  vehicleTypeId?: string | number;
  vehicleMakeId?: string | number;
  vehicleModelId?: string | number;
  vehicleNumber?: string;
  vehicleColor?: string;
  vehicleImage?: string;
  numberPlateImage?: string;
  vehicleSeat?: string | number;
  ownerId?: string;
  vehicleEngine?: string | number;
  vehicleColorImage?: string;
  vehicleSeatImage?: string;
  shareCode?: string;
  merchantId?: string | number;
  isEngineBased?: number;
}

export interface AddDriverVehicleResult {
  driverVehicleId?: string;
  raw: Record<string, unknown>;
}

export async function addDriverVehicle(
  client: ApiClient,
  params: AddDriverVehicleParams,
): Promise<AddDriverVehicleResult> {
  const envelope = await client.post<Record<string, unknown>>('/driver/add-vehicle', {
    ...buildDriverDevicePayload(client),
    ...(params.vehicleTypeId !== undefined ? { vehicle_type_id: params.vehicleTypeId } : {}),
    ...(params.vehicleMakeId !== undefined ? { vehicle_make_id: params.vehicleMakeId } : {}),
    ...(params.vehicleModelId !== undefined ? { vehicle_model_id: params.vehicleModelId } : {}),
    ...(params.vehicleNumber ? { vehicle_number: params.vehicleNumber } : {}),
    ...(params.vehicleColor ? { vehicle_color: params.vehicleColor } : {}),
    ...(params.vehicleImage ? { vehicle_image: params.vehicleImage } : {}),
    ...(params.numberPlateImage ? { vehicle_number_plate_image: params.numberPlateImage } : {}),
    ...(params.vehicleSeat !== undefined ? { vehicle_seat: params.vehicleSeat } : {}),
    ...(params.ownerId ? { owner_id: params.ownerId } : {}),
    ...(params.vehicleEngine !== undefined ? { vehicle_engine: params.vehicleEngine } : {}),
    ...(params.vehicleColorImage ? { vehicle_color_image: params.vehicleColorImage } : {}),
    ...(params.vehicleSeatImage ? { vehicle_seat_image: params.vehicleSeatImage } : {}),
    ...(params.shareCode ? { shareCode: params.shareCode } : {}),
    ...(params.merchantId !== undefined ? { merchant_id: params.merchantId } : {}),
    ...(params.isEngineBased !== undefined ? { is_engine_based: params.isEngineBased } : {}),
  });
  const data = envelope.data as Record<string, unknown>;
  const driverVehicleId =
    data['driver_vehicle_id'] === undefined ? undefined : String(data['driver_vehicle_id']);
  return { driverVehicleId, raw: data };
}

export interface VerifyDriverVehicleOtpParams {
  driverVehicleId: string;
  driverId?: string;
  otp: string;
}

export async function verifyDriverVehicleOtp(
  client: ApiClient,
  params: VerifyDriverVehicleOtpParams,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/vehicle/otp', {
    ...buildDriverDevicePayload(client),
    driver_vehicle_id: params.driverVehicleId,
    ...(params.driverId ? { driver_id: params.driverId } : {}),
    otp: params.otp,
  });
  return envelope.data as Record<string, unknown>;
}

export interface RequestDriverVehicleByCodeParams {
  code: string;
  driverId?: string;
  merchantId?: string | number;
}

export async function requestDriverVehicleByCode(
  client: ApiClient,
  params: RequestDriverVehicleByCodeParams,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/vehicle-request', {
    ...buildDriverDevicePayload(client),
    code: params.code,
    ...(params.driverId ? { driver_id: params.driverId } : {}),
    ...(params.merchantId !== undefined ? { merchant_id: params.merchantId } : {}),
  });
  return envelope.data as Record<string, unknown>;
}

export type DriverVehicleVerificationStatus = '0' | '1' | '2' | '3' | '4';

export interface DriverVehicleListItem {
  id: string;
  vehicleNumber: string;
  vehicleColor: string;
  vehicleType: string;
  vehicleTypeImage?: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleImage?: string;
  numberPlateImage?: string;
  verificationStatus: DriverVehicleVerificationStatus;
  activeStatus: 1 | 2 | 0;
  showMessage: string;
  messageBackgroundColor: string;
  otherPending: 0 | 1 | 2;
  poolEnabled: boolean;
  shareCode?: string;
  isDetached: boolean;
  isPrimary: boolean;
  expireDate?: string;
  registerDate?: string;
  raw: Record<string, unknown>;
}

const driverVehicleSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    driver_vehicle_id: z.union([z.string(), z.number()]).optional(),
    vehicle_number: z.string().optional(),
    vehicle_color: z.string().optional(),
    vehicle_type: z.string().optional(),
    vehicle_type_image: z.unknown().optional(),
    vehicle_make: z.string().optional(),
    vehicle_model: z.string().optional(),
    vehicle_image: z.unknown().optional(),
    vehicle_number_plate_image: z.unknown().optional(),
    vehicle_verification_status: z.union([z.string(), z.number()]).optional(),
    active_status: z.union([z.string(), z.number()]).optional(),
    show_message: z.string().optional(),
    message_background_color: z.string().optional(),
    other_pending: z.union([z.string(), z.number()]).optional(),
    pool_enable: z.union([z.boolean(), z.number(), z.string()]).optional(),
    shareCode: z.string().optional(),
    is_detached: z.union([z.boolean(), z.string(), z.number()]).optional(),
    is_primary: z.union([z.boolean(), z.string(), z.number()]).optional(),
    vehicle_expire_date: z.union([z.string(), z.null()]).optional(),
    vehicle_register_date: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();

export function parseDriverVehicle(data: Record<string, unknown>): DriverVehicleListItem {
  const parsed = driverVehicleSchema.parse(data);
  const id = parsed.id ?? parsed.driver_vehicle_id;
  const activeRaw = toNumber(parsed.active_status, 0);
  const pendingRaw = toNumber(parsed.other_pending, 0);
  return {
    id: String(id ?? ''),
    vehicleNumber: parsed.vehicle_number ?? '',
    vehicleColor: parsed.vehicle_color ?? '',
    vehicleType: parsed.vehicle_type ?? '',
    vehicleTypeImage: pickImageUrl(parsed.vehicle_type_image),
    vehicleMake: parsed.vehicle_make ?? '',
    vehicleModel: parsed.vehicle_model ?? '',
    vehicleImage: pickImageUrl(parsed.vehicle_image),
    numberPlateImage: pickImageUrl(parsed.vehicle_number_plate_image),
    verificationStatus: String(toNumber(parsed.vehicle_verification_status, 0)) as DriverVehicleVerificationStatus,
    activeStatus: (activeRaw === 1 || activeRaw === 2 ? activeRaw : 0) as 1 | 2 | 0,
    showMessage: parsed.show_message ?? '',
    messageBackgroundColor: parsed.message_background_color ?? '',
    otherPending: (pendingRaw === 1 || pendingRaw === 2 ? pendingRaw : 0) as 0 | 1 | 2,
    poolEnabled: toBoolean(parsed.pool_enable),
    shareCode: parsed.shareCode,
    isDetached: toBoolean(parsed.is_detached),
    isPrimary: toBoolean(parsed.is_primary),
    expireDate: parsed.vehicle_expire_date ?? undefined,
    registerDate: parsed.vehicle_register_date ?? undefined,
    raw: data,
  };
}

export async function fetchDriverVehicles(client: ApiClient): Promise<DriverVehicleListItem[]> {
  const envelope = await client.post<unknown>('/driver/get-vehicle-list', {
    ...buildDriverDevicePayload(client),
  });
  const data = envelope.data;
  const list = Array.isArray(data)
    ? data
    : readRecord(data as Record<string, unknown>)?.['vehicle'] ??
      readRecord(data as Record<string, unknown>)?.['vehicles'] ??
      readRecord(data as Record<string, unknown>)?.['list'];
  if (!Array.isArray(list)) {
    return [];
  }
  return list.flatMap((entry): DriverVehicleListItem[] => {
    const record = readRecord(entry);
    return record ? [parseDriverVehicle(record)] : [];
  });
}

export async function changeDriverVehicle(
  client: ApiClient,
  driverVehicleId: string,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/changeVehicle', {
    ...buildDriverDevicePayload(client),
    driver_vehicle: driverVehicleId,
  });
  return envelope.data as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Phase 14 — Driver segments  (Api\DriverController)
//
//   /driver/get-segment-list       → segments available to enroll in
//   /driver/get-enrolled-segments  → segments the driver already joined
//   /driver/get-segment-services   → per-segment services config
//   /driver/save-segment-config    → save services/price config (wizard pass-through)
//   /driver/service-slots          → availability time slots (by segment)
//   /driver/save-service-time-slot → save slots (wizard pass-through)
//   /driver/get-segment-gallery    → image gallery for a segment
//   /driver/save-segment-gallery   → upload image to gallery
//   /driver/delete-segment-gallery → remove image from gallery
// ---------------------------------------------------------------------------

export interface DriverSegmentListItem {
  id: string;
  segmentName: string;
  segmentSlug: string;
  icon?: string;
  selected: boolean;
  totalActiveServiceTypes: number;
  totalSelectedServices: number;
  totalTimeSlots: number;
  totalSelectedSlots: number;
  raw: Record<string, unknown>;
}

const segmentListEntrySchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    segment_id: z.union([z.string(), z.number()]).optional(),
    segment_name: z.union([z.string(), z.number()]).optional(),
    name: z.union([z.string(), z.number()]).optional(),
    segment_slug: z.union([z.string(), z.number()]).optional(),
    slug: z.union([z.string(), z.number()]).optional(),
    icon: z.unknown().optional(),
    selected: z.union([z.boolean(), z.string(), z.number()]).optional(),
    total_active_service_types: z.union([z.string(), z.number()]).optional(),
    total_selected_services: z.union([z.string(), z.number()]).optional(),
    total_time_slots: z.union([z.string(), z.number()]).optional(),
    total_selected_slots: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export function parseDriverSegment(data: Record<string, unknown>): DriverSegmentListItem {
  const parsed = segmentListEntrySchema.parse(data);
  const id = parsed.id ?? parsed.segment_id;
  return {
    id: String(id ?? ''),
    segmentName: String(parsed.segment_name ?? parsed.name ?? ''),
    segmentSlug: String(parsed.segment_slug ?? parsed.slug ?? ''),
    icon: pickImageUrl(parsed.icon),
    selected: toBoolean(parsed.selected),
    totalActiveServiceTypes: toNumber(parsed.total_active_service_types, 0),
    totalSelectedServices: toNumber(parsed.total_selected_services, 0),
    totalTimeSlots: toNumber(parsed.total_time_slots, 0),
    totalSelectedSlots: toNumber(parsed.total_selected_slots, 0),
    raw: data,
  };
}

export interface DriverVehicleBrief {
  driverVehicleId: string;
  vehicleNumber: string;
  vehicleColor: string;
  vehicleModel: string;
  vehicleType: string;
  image?: string;
  raw: Record<string, unknown>;
}

export interface DriverSegmentListResult {
  segments: DriverSegmentListItem[];
  vehicles: DriverVehicleBrief[];
  raw: Record<string, unknown>;
}

function parseVehicleBrief(value: unknown): DriverVehicleBrief[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry): DriverVehicleBrief[] => {
    const record = readRecord(entry);
    if (!record) {
      return [];
    }
    return [
      {
        driverVehicleId: String(record['driver_vehicle_id'] ?? record['id'] ?? ''),
        vehicleNumber: String(record['vehicle_number'] ?? ''),
        vehicleColor: String(record['vehicle_color'] ?? ''),
        vehicleModel: String(record['vehicle_model'] ?? ''),
        vehicleType: String(record['vehicle_type'] ?? ''),
        image: pickImageUrl(record['image']),
        raw: record,
      },
    ];
  });
}

export function parseDriverSegmentList(data: Record<string, unknown>): DriverSegmentListResult {
  const rawSegments = Array.isArray(data['arr_segment'])
    ? data['arr_segment']
    : Array.isArray(data['segments'])
      ? data['segments']
      : [];
  const segments = rawSegments.flatMap((entry): DriverSegmentListItem[] => {
    const record = readRecord(entry);
    return record ? [parseDriverSegment(record)] : [];
  });
  return {
    segments,
    vehicles: parseVehicleBrief(data['vehicle']),
    raw: data,
  };
}

export interface FetchDriverSegmentsParams {
  driverVehicleId?: string;
  callingFor?: string;
}

export async function fetchDriverSegments(
  client: ApiClient,
  params?: FetchDriverSegmentsParams,
): Promise<DriverSegmentListResult> {
  const envelope = await client.post<Record<string, unknown>>('/driver/get-segment-list', {
    ...buildDriverDevicePayload(client),
    ...(params?.driverVehicleId ? { driver_vehicle_id: params.driverVehicleId } : {}),
    ...(params?.callingFor ? { calling_for: params.callingFor } : {}),
  });
  return parseDriverSegmentList(
    unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/get-segment-list'),
  );
}

export async function fetchDriverEnrolledSegments(
  client: ApiClient,
): Promise<DriverSegmentListItem[]> {
  const envelope = await client.post<unknown>('/driver/get-enrolled-segments', {
    ...buildDriverDevicePayload(client),
  });
  const data = envelope.data;
  const list = Array.isArray(data)
    ? data
    : readRecord(data as Record<string, unknown>)?.['arr_segment'] ??
      readRecord(data as Record<string, unknown>)?.['segments'];
  if (!Array.isArray(list)) {
    return [];
  }
  return list.flatMap((entry): DriverSegmentListItem[] => {
    const record = readRecord(entry);
    return record ? [parseDriverSegment(record)] : [];
  });
}

export interface DriverSegmentServiceOption {
  id: string;
  serviceTypeId?: string;
  serviceName: string;
  price: string;
  priceType: string;
  selected: boolean;
  raw: Record<string, unknown>;
}

function parseSegmentServices(value: unknown): DriverSegmentServiceOption[] {
  const list = Array.isArray(value) ? value : [];
  return list.flatMap((entry): DriverSegmentServiceOption[] => {
    const record = readRecord(entry);
    if (!record) {
      return [];
    }
    const id = record['id'] ?? record['segment_service_id'] ?? record['service_type_id'];
    return [
      {
        id: String(id ?? ''),
        serviceTypeId:
          record['service_type_id'] === undefined ? undefined : String(record['service_type_id']),
        serviceName: String(record['service_name'] ?? record['name'] ?? ''),
        price: String(record['price'] ?? record['amount'] ?? ''),
        priceType: String(record['price_type'] ?? record['price_description'] ?? ''),
        selected: toBoolean(record['selected']),
        raw: record,
      },
    ];
  });
}

export interface DriverSegmentServicesConfig {
  segmentId: string;
  segmentName: string;
  currency: string;
  priceType: string;
  priceTypeText: string;
  minimumBookingAmount: string;
  hourlyAmount: string;
  segmentGroupId: string;
  priceCardOwner: string;
  mandatoryDocPending: boolean;
  services: DriverSegmentServiceOption[];
  raw: Record<string, unknown>;
}

export function parseDriverSegmentServicesConfig(data: Record<string, unknown>): DriverSegmentServicesConfig {
  const servicesRaw =
    data['arr_services'] ?? data['services'] ?? data['service_list'] ?? data['segment_services'];
  return {
    segmentId: String(data['segment_id'] ?? ''),
    segmentName: String(data['name'] ?? data['segment_name'] ?? ''),
    currency: String(data['currency'] ?? '₹'),
    priceType: String(data['price_type'] ?? ''),
    priceTypeText: String(data['price_type_text'] ?? ''),
    minimumBookingAmount: String(data['minimum_booking_amount'] ?? '0'),
    hourlyAmount: String(data['hourly_amount'] ?? '0'),
    segmentGroupId: String(data['segment_group_id'] ?? ''),
    priceCardOwner: String(data['price_card_owner'] ?? ''),
    mandatoryDocPending: toBoolean(data['mandatory_doc_pending']),
    services: parseSegmentServices(servicesRaw),
    raw: data,
  };
}

export interface FetchSegmentServicesConfigParams {
  segmentId: string;
  callingFor?: string;
  driverVehicleId?: string;
}

export async function fetchSegmentServicesConfig(
  client: ApiClient,
  params: FetchSegmentServicesConfigParams,
): Promise<DriverSegmentServicesConfig> {
  const envelope = await client.post<Record<string, unknown>>('/driver/get-segment-services', {
    ...buildDriverDevicePayload(client),
    segment_id: params.segmentId,
    ...(params.callingFor ? { calling_for: params.callingFor } : {}),
    ...(params.driverVehicleId ? { driver_vehicle_id: params.driverVehicleId } : {}),
  });
  return parseDriverSegmentServicesConfig(
    unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/get-segment-services'),
  );
}

export interface DriverTimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  selected: boolean;
  raw: Record<string, unknown>;
}

export interface DriverTimeSlotDay {
  day: string;
  dayName?: string;
  slots: DriverTimeSlot[];
  raw: Record<string, unknown>;
}

export interface DriverTimeSlotResult {
  days: DriverTimeSlotDay[];
  raw: Record<string, unknown>;
}

function parseTimeSlot(entry: Record<string, unknown>): DriverTimeSlot {
  const id = entry['id'] ?? entry['service_time_slot_id'];
  return {
    id: String(id ?? ''),
    startTime: String(entry['start_time'] ?? entry['from'] ?? ''),
    endTime: String(entry['end_time'] ?? entry['to'] ?? ''),
    selected: toBoolean(entry['selected']),
    raw: entry,
  };
}

function parseTimeSlotDay(entry: Record<string, unknown>): DriverTimeSlotDay | undefined {
  const nested = Array.isArray(entry['service_time_slot'])
    ? entry['service_time_slot']
    : Array.isArray(entry['slots'])
      ? entry['slots']
      : [];
  if (nested.length === 0) {
    const idCheck = entry['id'] ?? entry['service_time_slot_id'];
    if (idCheck === undefined) {
      return undefined;
    }
    return { day: String(entry['day'] ?? ''), dayName: undefined, slots: [parseTimeSlot(entry)], raw: entry };
  }
  const slots = nested.flatMap((slot): DriverTimeSlot[] => {
    const record = readRecord(slot);
    return record ? [parseTimeSlot(record)] : [];
  });
  return {
    day: String(entry['day'] ?? entry['day_name'] ?? entry['name'] ?? ''),
    dayName: String(entry['day_name'] ?? ''),
    slots,
    raw: entry,
  };
}

export function parseDriverTimeSlots(data: Record<string, unknown>): DriverTimeSlotResult {
  const rawSlots = data['time_slots'] ?? data['slots'] ?? data['arr_slot'];
  const days: DriverTimeSlotDay[] = [];
  if (Array.isArray(rawSlots)) {
    for (const entry of rawSlots) {
      const record = readRecord(entry);
      if (record) {
        const day = parseTimeSlotDay(record);
        if (day) {
          days.push(day);
        }
      }
    }
  }
  if (days.length === 0 && Array.isArray(rawSlots)) {
    const flat = rawSlots.flatMap((entry): DriverTimeSlot[] => {
      const record = readRecord(entry);
      return record ? [parseTimeSlot(record)] : [];
    });
    if (flat.length > 0) {
      days.push({ day: '', dayName: undefined, slots: flat, raw: {} });
    }
  }
  return { days, raw: data };
}

export interface FetchServiceTimeSlotsParams {
  segmentId: string;
  callingFor?: string;
  driverVehicleId?: string;
}

export async function fetchServiceTimeSlots(
  client: ApiClient,
  params: FetchServiceTimeSlotsParams,
): Promise<DriverTimeSlotResult> {
  const envelope = await client.post<Record<string, unknown>>('/driver/service-slots', {
    ...buildDriverDevicePayload(client),
    segment_id: params.segmentId,
    ...(params.callingFor ? { calling_for: params.callingFor } : {}),
    ...(params.driverVehicleId ? { driver_vehicle_id: params.driverVehicleId } : {}),
  });
  return parseDriverTimeSlots(
    unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/service-slots'),
  );
}

export interface SaveDriverTimeSlotsParams {
  segmentId: string;
  slotIds: string[];
}

export async function saveDriverTimeSlots(
  client: ApiClient,
  params: SaveDriverTimeSlotsParams,
): Promise<DriverWizardStepResult> {
  return submitWizardStep(client, '/driver/save-service-time-slot', {
    segment_id: params.segmentId,
    arr_slot_id: JSON.stringify(params.slotIds.map((id) => ({ id }))),
  });
}

export interface DriverGalleryImage {
  id: string;
  imageUrl?: string;
  imageTitle: string;
  raw: Record<string, unknown>;
}

function parseGalleryImages(data: unknown): DriverGalleryImage[] {
  const list = Array.isArray(data) ? data : [];
  return list.flatMap((entry): DriverGalleryImage[] => {
    const record = readRecord(entry);
    if (!record) {
      return [];
    }
    const id = record['id'] ?? record['image_id'];
    return [
      {
        id: String(id ?? ''),
        imageUrl: pickImageUrl(record['image'] ?? record['image_url']),
        imageTitle: String(record['image_title'] ?? record['title'] ?? ''),
        raw: record,
      },
    ];
  });
}

export interface FetchDriverGalleryParams {
  segmentId?: string;
  callingFor?: string;
}

export async function fetchDriverGallery(
  client: ApiClient,
  params: FetchDriverGalleryParams,
): Promise<DriverGalleryImage[]> {
  const envelope = await client.post<unknown>('/driver/get-segment-gallery', {
    ...buildDriverDevicePayload(client),
    ...(params.segmentId ? { segment_id: params.segmentId } : {}),
    ...(params.callingFor ? { calling_for: params.callingFor } : {}),
  });
  return parseGalleryImages(envelope.data);
}

export interface SaveDriverGalleryImageParams {
  segmentId: string;
  image: string;
  multiPart?: boolean;
  callingFor?: string;
}

export async function saveDriverGalleryImage(
  client: ApiClient,
  params: SaveDriverGalleryImageParams,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/save-segment-gallery', {
    ...buildDriverDevicePayload(client),
    segment_id: params.segmentId,
    image: params.image,
    multi_part: params.multiPart ? 1 : 0,
    ...(params.callingFor ? { calling_for: params.callingFor } : {}),
  });
  return envelope.data as Record<string, unknown>;
}

export interface DeleteDriverGalleryImageParams {
  imageId: string;
  segmentId?: string;
  callingFor?: string;
}

export async function deleteDriverGalleryImage(
  client: ApiClient,
  params: DeleteDriverGalleryImageParams,
): Promise<DriverGalleryImage[]> {
  const envelope = await client.post<unknown>('/driver/delete-segment-gallery', {
    ...buildDriverDevicePayload(client),
    image_id: params.imageId,
    ...(params.segmentId ? { segment_id: params.segmentId } : {}),
    ...(params.callingFor ? { calling_for: params.callingFor } : {}),
  });
  return parseGalleryImages(envelope.data);
}

// ---------------------------------------------------------------------------
// Phase 14 — Driver earnings / wallet
//
//   /driver/wallet/transaction        → wallet balance + filtered transactions
//   /driver/wallet/add-money          → top-up cash / UPI receipt
//   /driver/withdraw-driver-wallet    → withdraw wallet amount
//   /driver/account/earnings          → per-segment earnings statement
//   /driver/cashout/history           → cashout requests (DriverCashoutController)
//   /driver/cashout/request           → raise a cashout request
// ---------------------------------------------------------------------------

export type DriverWalletFilter = 1 | 2 | 3;
export type DriverWalletDuration =
  | 'today'
  | 'yesterday'
  | 'one_week'
  | 'one_month'
  | 'three_month'
  | 'six_month'
  | 'one_year'
  | 'custom';

export interface DriverWalletDetailLine {
  parameterName: string;
  value: string;
  colour: string;
  bold: boolean;
  narration: string;
  raw: Record<string, unknown>;
}

function parseWalletDetailLines(value: unknown): DriverWalletDetailLine[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry): DriverWalletDetailLine[] => {
    const record = readRecord(entry);
    if (!record) {
      return [];
    }
    return [
      {
        parameterName: String(record['parameter_name'] ?? ''),
        value: String(record['value'] ?? ''),
        colour: String(record['colour'] ?? record['color'] ?? ''),
        bold: toBoolean(record['bold']),
        narration: String(record['narration'] ?? ''),
        raw: record,
      },
    ];
  });
}

export interface DriverWalletTransactionItem {
  driverId: string;
  transactionType: string;
  paymentMethod: string;
  amount: string;
  platform: string;
  date: string;
  description: string;
  narration: string;
  valueColor: string;
  icon?: string;
  dateTimestamp?: number;
  walletDetails: DriverWalletDetailLine[];
  raw: Record<string, unknown>;
}

const walletTransactionSchema = z
  .object({
    driver_id: z.union([z.string(), z.number()]).optional(),
    transaction_type: z.string().optional(),
    payment_method: z.string().optional(),
    amount: z.union([z.string(), z.number()]).optional(),
    platform: z.string().optional(),
    date: z.string().optional(),
    description: z.string().optional(),
    narration: z.string().optional(),
    value_color: z.string().optional(),
    icon: z.unknown().optional(),
    date_timestamp: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export function parseDriverWalletTransaction(data: Record<string, unknown>): DriverWalletTransactionItem {
  const parsed = walletTransactionSchema.parse(data);
  return {
    driverId: String(parsed.driver_id ?? ''),
    transactionType: parsed.transaction_type ?? '',
    paymentMethod: parsed.payment_method ?? '',
    amount:
      typeof parsed.amount === 'string' || parsed.amount === undefined
        ? (parsed.amount ?? '')
        : String(parsed.amount),
    platform: parsed.platform ?? '',
    date: parsed.date ?? '',
    description: parsed.description ?? '',
    narration: parsed.narration ?? '',
    valueColor: parsed.value_color ?? '',
    icon: pickImageUrl(parsed.icon),
    dateTimestamp: toOptionalNumber(parsed.date_timestamp),
    walletDetails: parseWalletDetailLines(data['wallet_details']),
    raw: data,
  };
}

export interface DriverWalletResult {
  walletBalance: string;
  recentTransactions: DriverWalletTransactionItem[];
  totalPages: number;
  nextPageUrl?: string;
  currentPage: number;
  raw: Record<string, unknown>;
}

export async function fetchDriverWalletTransactions(
  client: ApiClient,
  params: {
    filter: DriverWalletFilter;
    duration: DriverWalletDuration;
    from?: string;
    to?: string;
    page?: number;
  },
): Promise<DriverWalletResult> {
  const envelope = await client.post<Record<string, unknown>>('/driver/wallet/transaction', {
    ...buildDriverDevicePayload(client),
    filter: params.filter,
    duration: params.duration,
    ...(params.from ? { from: params.from } : {}),
    ...(params.to ? { to: params.to } : {}),
    ...(params.page !== undefined ? { page: params.page } : {}),
  });
  const data = unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/wallet/transaction');
  const rawTransactions = Array.isArray(data['recent_transactions'])
    ? data['recent_transactions']
    : Array.isArray(data['transactions'])
      ? data['transactions']
      : [];
  return {
    walletBalance: String(data['wallet_money'] ?? '0'),
    recentTransactions: rawTransactions.flatMap((entry): DriverWalletTransactionItem[] => {
      const record = readRecord(entry);
      return record ? [parseDriverWalletTransaction(record)] : [];
    }),
    totalPages: toNumber(data['total_pages'], 1),
    nextPageUrl: typeof data['next_page_url'] === 'string' ? data['next_page_url'] : undefined,
    currentPage: toNumber(data['current_page'], 1),
    raw: data,
  };
}

export interface AddDriverWalletMoneyParams {
  amount: string | number;
  paymentMethod: 1 | 2;
  receiptNumber?: string;
  description?: string;
  timestampValue?: string;
}

export async function addDriverWalletMoney(
  client: ApiClient,
  params: AddDriverWalletMoneyParams,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/wallet/add-money', {
    ...buildDriverDevicePayload(client),
    amount: params.amount,
    payment_method: params.paymentMethod,
    ...(params.receiptNumber ? { receipt_number: params.receiptNumber } : {}),
    ...(params.description ? { description: params.description } : {}),
    ...(params.timestampValue ? { timestampvalue: params.timestampValue } : {}),
  });
  return envelope.data as Record<string, unknown>;
}

export async function withdrawDriverWallet(
  client: ApiClient,
  amount: string | number,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/withdraw-driver-wallet', {
    ...buildDriverDevicePayload(client),
    amount,
  });
  return envelope.data as Record<string, unknown>;
}

export interface DriverEarningsTrip {
  orderNo: string;
  orderId: string;
  timeOfBooking: string;
  orderName: string;
  segmentImage?: string;
  segmentSlug: string;
  subGroupForApp: string;
  amount: string;
  raw: Record<string, unknown>;
}

export interface DriverEarningsDay {
  timestamp?: number;
  dateText: string;
  completedRides: number;
  dayEarning: string;
  dayRating: string;
  trips: DriverEarningsTrip[];
  raw: Record<string, unknown>;
}

export interface DriverAccountEarnings {
  totalEarnings: string;
  receivedCash: string;
  receivedInWallet: string;
  fromTimestamp?: number;
  toTimestamp?: number;
  walletBalance: string;
  totalBilledToConsumer: string;
  holderData: DriverWalletDetailLine[];
  tripsDetails: {
    totalTripsInWeek: number;
    overallRatingInWeek: string;
    days: DriverEarningsDay[];
  };
  totalRides: number;
  completionRate: number;
  onlineTime: string;
  avgRating: string;
  raw: Record<string, unknown>;
}

function parseEarningsTrips(value: unknown): DriverEarningsTrip[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry): DriverEarningsTrip[] => {
    const record = readRecord(entry);
    if (!record) {
      return [];
    }
    return [
      {
        orderNo: String(record['order_no'] ?? ''),
        orderId: String(record['order_id'] ?? ''),
        timeOfBooking: String(record['time_of_booking'] ?? ''),
        orderName: String(record['order_name'] ?? record['service_name'] ?? ''),
        segmentImage: pickImageUrl(record['segment_image']),
        segmentSlug: String(record['segment_slug'] ?? ''),
        subGroupForApp: String(record['sub_group_for_app'] ?? ''),
        amount: String(record['amount'] ?? ''),
        raw: record,
      },
    ];
  });
}

export function parseDriverAccountEarnings(data: Record<string, unknown>): DriverAccountEarnings {
  const tripsDetails = readRecord(data['trips_details']) ?? {};
  const days: DriverEarningsDay[] = [];
  const rawDays = Array.isArray(tripsDetails['trips_data']) ? tripsDetails['trips_data'] : [];
  for (const entry of rawDays) {
    const record = readRecord(entry);
    if (!record) {
      continue;
    }
    days.push({
      timestamp: toOptionalNumber(record['timestamp']),
      dateText: String(record['date_text'] ?? ''),
      completedRides: toNumber(record['completed_rides'], 0),
      dayEarning: String(record['day_earning'] ?? ''),
      dayRating: String(record['day_rating'] ?? ''),
      trips: parseEarningsTrips(record['trips']),
      raw: record,
    });
  }
  return {
    totalEarnings: String(data['total_earnings'] ?? '0'),
    receivedCash: String(data['received_cash'] ?? '0'),
    receivedInWallet: String(data['received_in_wallet'] ?? '0'),
    fromTimestamp: toOptionalNumber(data['from_timestamp']),
    toTimestamp: toOptionalNumber(data['to_timestamp']),
    walletBalance: String(data['wallet_balance'] ?? '0'),
    totalBilledToConsumer: String(data['total_billed_to_consumer'] ?? ''),
    holderData: parseWalletDetailLines(data['holder_data']),
    tripsDetails: {
      totalTripsInWeek: toNumber(tripsDetails['total_trips_in_week'], 0),
      overallRatingInWeek: String(tripsDetails['overall_rating_in_week'] ?? ''),
      days,
    },
    totalRides: toNumber(data['total_rides'], 0),
    completionRate: toNumber(data['completion_rate'], 0),
    onlineTime: String(data['online_time'] ?? ''),
    avgRating: String(data['avg_rating'] ?? ''),
    raw: data,
  };
}

export interface FetchDriverAccountEarningsParams {
  segmentId: string;
  date?: string;
  isSearch?: boolean;
  fromDate?: string;
  toDate?: string;
}

export async function fetchDriverAccountEarnings(
  client: ApiClient,
  params: FetchDriverAccountEarningsParams,
): Promise<DriverAccountEarnings> {
  const envelope = await client.post<Record<string, unknown>>('/driver/account/earnings', {
    ...buildDriverDevicePayload(client),
    segment_id: params.segmentId,
    is_search: params.isSearch ? 1 : 0,
    ...(params.date ? { date: params.date } : {}),
    ...(params.isSearch ? { from_date: params.fromDate, to_date: params.toDate } : {}),
  });
  return parseDriverAccountEarnings(
    unwrapEnvelopeData<Record<string, unknown>>(envelope, '/driver/account/earnings'),
  );
}

export interface DriverCashoutHistoryItem {
  id: string;
  amount: string;
  cashoutStatus: string;
  actionBy?: string;
  transactionId?: string;
  comment: string;
  createdAt?: number;
  updatedAt?: number;
  raw: Record<string, unknown>;
}

function parseCashoutHistory(data: unknown): DriverCashoutHistoryItem[] {
  const list = Array.isArray(data) ? data : [];
  return list.flatMap((entry): DriverCashoutHistoryItem[] => {
    const record = readRecord(entry);
    if (!record) {
      return [];
    }
    return [
      {
        id: String(record['id'] ?? ''),
        amount: String(record['amount'] ?? ''),
        cashoutStatus: String(record['cashout_status'] ?? ''),
        actionBy: typeof record['action_by'] === 'string' ? record['action_by'] : undefined,
        transactionId:
          typeof record['transaction_id'] === 'string' && record['transaction_id'].length > 0
            ? record['transaction_id']
            : undefined,
        comment: String(record['comment'] ?? ''),
        createdAt: toOptionalNumber(record['created_at']),
        updatedAt: toOptionalNumber(record['updated_at']),
        raw: record,
      },
    ];
  });
}

export async function fetchDriverCashoutHistory(client: ApiClient): Promise<DriverCashoutHistoryItem[]> {
  const envelope = await client.post<unknown>('/driver/cashout/history', {
    ...buildDriverDevicePayload(client),
  });
  return parseCashoutHistory(envelope.data);
}

export interface RequestDriverCashoutParams {
  amount: string | number;
  creditAccountDetailId?: string;
  glomoMoneyTransactionId?: string;
}

export async function requestDriverCashout(
  client: ApiClient,
  params: RequestDriverCashoutParams,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/cashout/request', {
    ...buildDriverDevicePayload(client),
    amount: params.amount,
    ...(params.creditAccountDetailId ? { credit_account_detail_id: params.creditAccountDetailId } : {}),
    ...(params.glomoMoneyTransactionId
      ? { glomo_money_transaction_id: params.glomoMoneyTransactionId }
      : {}),
  });
  return envelope.data as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Phase 14 — Driver subscriptions  (Api\SubscriptionPackageController)
//
//   /driver/get-subscriptions-list    → packages available to the driver
//   /driver/get-subscriptions-history → past/carried-forward packages
//   /driver/get-active-subscription   → currently active packages
//   /driver/activate-subscription-package → buy/activate a package
// ---------------------------------------------------------------------------

export interface DriverSubscriptionPaymentMethod {
  id: string;
  name: string;
  icon?: string;
  raw: Record<string, unknown>;
}

export interface DriverSubscriptionPackDetails {
  id?: string;
  usedTrip: number;
  startTime: string;
  endTime: string;
  status: number;
  totalTrips: number;
  packageTrips: number;
  carryForwardedTrips: number;
  carryForwardedFrom?: string;
  carryStatus: boolean;
  raw: Record<string, unknown>;
}

export interface DriverSubscriptionPackageItem {
  id: string;
  name: string;
  expireDate?: string;
  packageType: string;
  description: string;
  showPrice: string;
  packageDurationName: string;
  image?: string;
  segmentName: string;
  vehicleType: string;
  maxTrip: number;
  text: string;
  status: number;
  amount: string;
  priceType: string;
  packDetails: DriverSubscriptionPackDetails | null;
  raw: Record<string, unknown>;
}

const subscriptionPackageEntrySchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    expire_date: z.union([z.string(), z.null()]).optional(),
    package_type: z.string().optional(),
    description: z.string().optional(),
    show_price: z.string().optional(),
    package_duration_name: z.string().optional(),
    image: z.unknown().optional(),
    segment_name: z.string().optional(),
    vehicle_type: z.string().optional(),
    max_trip: z.union([z.string(), z.number()]).optional(),
    text: z.string().optional(),
    status: z.union([z.string(), z.number()]).optional(),
    amount: z.union([z.string(), z.number()]).optional(),
    price_type: z.string().optional(),
  })
  .passthrough();

function parseSubscriptionPackDetails(value: unknown): DriverSubscriptionPackDetails | null {
  const record = readRecord(value);
  if (!record) {
    return null;
  }
  const summary = readRecord(record['total_trip_summary']) ?? {};
  return {
    id: record['id'] === undefined ? undefined : String(record['id']),
    usedTrip: toNumber(record['used_trip'], 0),
    startTime: String(record['start_time'] ?? ''),
    endTime: String(record['end_time'] ?? ''),
    status: toNumber(record['status'], 0),
    totalTrips: toNumber(summary['total_trips'], 0),
    packageTrips: toNumber(summary['package_trips'], 0),
    carryForwardedTrips: toNumber(summary['carry_forwarded_trips'], 0),
    carryForwardedFrom:
      typeof summary['carry_forwarded'] === 'string' ? summary['carry_forwarded'] : undefined,
    carryStatus: toBoolean(summary['status']),
    raw: record,
  };
}

export function parseDriverSubscriptionPackage(
  data: Record<string, unknown>,
): DriverSubscriptionPackageItem {
  const parsed = subscriptionPackageEntrySchema.parse(data);
  return {
    id: String(parsed.id ?? ''),
    name: parsed.name ?? '',
    expireDate: parsed.expire_date ?? undefined,
    packageType: parsed.package_type ?? '',
    description: parsed.description ?? '',
    showPrice: parsed.show_price ?? '',
    packageDurationName: parsed.package_duration_name ?? '',
    image: pickImageUrl(parsed.image),
    segmentName: parsed.segment_name ?? '',
    vehicleType: parsed.vehicle_type ?? '',
    maxTrip: toNumber(parsed.max_trip, 0),
    text: parsed.text ?? '',
    status: toNumber(parsed.status, 0),
    amount:
      typeof parsed.amount === 'string' || parsed.amount === undefined
        ? (parsed.amount ?? '')
        : String(parsed.amount),
    priceType: parsed.price_type ?? '',
    packDetails: parseSubscriptionPackDetails(data['pack_details']),
    raw: data,
  };
}

function parseSubscriptionPackages(data: unknown): DriverSubscriptionPackageItem[] {
  const record = readRecord(data);
  const list = readRecord(data)?.['all_packages'] ?? readRecord(data)?.['packages_history'] ?? (Array.isArray(data) ? data : []);
  if (!Array.isArray(list)) {
    return [];
  }
  return list.flatMap((entry): DriverSubscriptionPackageItem[] => {
    const item = readRecord(entry);
    return item ? [parseDriverSubscriptionPackage(item)] : [];
  });
}

function parseSubscriptionPaymentMethods(data: unknown): DriverSubscriptionPaymentMethod[] {
  const list = readRecord(data)?.['payment_methods'];
  if (!Array.isArray(list)) {
    return [];
  }
  return list.flatMap((entry): DriverSubscriptionPaymentMethod[] => {
    const record = readRecord(entry);
    if (!record) {
      return [];
    }
    return [
      {
        id: String(record['id'] ?? ''),
        name: String(record['payment_method'] ?? record['name'] ?? ''),
        icon: pickImageUrl(record['payment_icon']),
        raw: record,
      },
    ];
  });
}

export interface DriverSubscriptionPackagesResult {
  packages: DriverSubscriptionPackageItem[];
  paymentMethods: DriverSubscriptionPaymentMethod[];
  raw: Record<string, unknown>;
}

export interface FetchDriverSubscriptionPackagesParams {
  segmentId: string;
  vehicleTypeId?: string;
  callingFrom?: string;
}

export async function fetchDriverSubscriptionPackages(
  client: ApiClient,
  params: FetchDriverSubscriptionPackagesParams,
): Promise<DriverSubscriptionPackagesResult> {
  const envelope = await client.post<Record<string, unknown>>('/driver/get-subscriptions-list', {
    ...buildDriverDevicePayload(client),
    segment_id: params.segmentId,
    calling_from: params.callingFrom ?? 'DRIVER',
    ...(params.vehicleTypeId ? { vehicle_type_id: params.vehicleTypeId } : {}),
  });
  const data = unwrapEnvelopeData<Record<string, unknown>>(
    envelope,
    '/driver/get-subscriptions-list',
  );
  return {
    packages: parseSubscriptionPackages(data),
    paymentMethods: parseSubscriptionPaymentMethods(data),
    raw: data,
  };
}

export interface FetchDriverSubscriptionHistoryParams {
  segmentId: string;
  vehicleTypeId?: string;
}

export async function fetchDriverSubscriptionHistory(
  client: ApiClient,
  params: FetchDriverSubscriptionHistoryParams,
): Promise<DriverSubscriptionPackageItem[]> {
  const envelope = await client.post<unknown>('/driver/get-subscriptions-history', {
    ...buildDriverDevicePayload(client),
    segment_id: params.segmentId,
    calling_from: 'DRIVER',
    ...(params.vehicleTypeId ? { vehicle_type_id: params.vehicleTypeId } : {}),
  });
  return parseSubscriptionPackages(envelope.data);
}

export interface FetchDriverActiveSubscriptionParams {
  segmentId: string;
  vehicleTypeId?: string;
}

export async function fetchDriverActiveSubscription(
  client: ApiClient,
  params: FetchDriverActiveSubscriptionParams,
): Promise<DriverSubscriptionPackagesResult> {
  const envelope = await client.post<Record<string, unknown>>('/driver/get-active-subscription', {
    ...buildDriverDevicePayload(client),
    segment_id: params.segmentId,
    calling_from: 'DRIVER',
    ...(params.vehicleTypeId ? { vehicle_type_id: params.vehicleTypeId } : {}),
  });
  const data = unwrapEnvelopeData<Record<string, unknown>>(
    envelope,
    '/driver/get-active-subscription',
  );
  return {
    packages: parseSubscriptionPackages(data),
    paymentMethods: [],
    raw: data,
  };
}

export interface ActivateDriverSubscriptionParams {
  packageId: string;
  vehicleTypeId?: string;
  segmentId?: string;
  amount?: string | number;
  paymentMethod?: string | number;
}

export async function activateDriverSubscriptionPackage(
  client: ApiClient,
  params: ActivateDriverSubscriptionParams,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>(
    '/driver/activate-subscription-package',
    {
      ...buildDriverDevicePayload(client),
      package_id: params.packageId,
      ...(params.vehicleTypeId ? { vehicle_type_id: params.vehicleTypeId } : {}),
      ...(params.segmentId ? { segment_id: params.segmentId } : {}),
      ...(params.amount !== undefined ? { amount: params.amount } : {}),
      ...(params.paymentMethod !== undefined ? { payment_method: params.paymentMethod } : {}),
    },
  );
  return envelope.data as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Phase 14 — Driver chat  (booking-level chat with the user)
//   /driver/chat, /driver/chat/send_message
// ---------------------------------------------------------------------------

export interface DriverChatMessage {
  id: string;
  message: string;
  sentBy: 'driver' | 'user' | string;
  timestamp?: number;
  displayTime?: string;
  raw: Record<string, unknown>;
}

function parseChatMessages(data: unknown): DriverChatMessage[] {
  const record = readRecord(data);
  const list = (Array.isArray(data) ? data : undefined) ?? (Array.isArray(record?.['messages']) ? record?.['messages'] : []);
  if (!Array.isArray(list)) {
    return [];
  }
  return list.flatMap((entry): DriverChatMessage[] => {
    const item = readRecord(entry);
    if (!item) {
      return [];
    }
    const fromDriver = toBoolean(item['to_driver'] ?? item['from_driver']) || item['sender_type'] === 'driver';
    return [
      {
        id: String(item['id'] ?? ''),
        message: String(item['message'] ?? item['text'] ?? ''),
        sentBy: fromDriver ? 'driver' : String(item['sender_type'] ?? 'user'),
        timestamp: toOptionalNumber(item['date_timestamp'] ?? item['timestamp']),
        displayTime: typeof item['date'] === 'string' ? item['date'] : undefined,
        raw: item,
      },
    ];
  });
}

export interface FetchDriverChatParams {
  bookingOrderId?: string;
  merchantId?: string | number;
}

export async function fetchDriverChatHistory(
  client: ApiClient,
  params: FetchDriverChatParams,
): Promise<DriverChatMessage[]> {
  const envelope = await client.post<unknown>('/driver/chat', {
    ...buildDriverDevicePayload(client),
    ...(params.bookingOrderId ? { booking_order_id: params.bookingOrderId } : {}),
    ...(params.merchantId !== undefined ? { merchant_id: params.merchantId } : {}),
  });
  return parseChatMessages(envelope.data);
}

export interface SendDriverChatMessageParams {
  bookingOrderId?: string;
  message: string;
  merchantId?: string | number;
}

export async function sendDriverChatMessage(
  client: ApiClient,
  params: SendDriverChatMessageParams,
): Promise<DriverChatMessage | null> {
  const envelope = await client.post<Record<string, unknown>>('/driver/chat/send_message', {
    ...buildDriverDevicePayload(client),
    ...(params.bookingOrderId ? { booking_order_id: params.bookingOrderId } : {}),
    message: params.message,
    ...(params.merchantId !== undefined ? { merchant_id: params.merchantId } : {}),
  });
  const data = envelope.data;
  const record = readRecord(data);
  if (!record) {
    return null;
  }
  return {
    id: String(record['id'] ?? ''),
    message: String(record['message'] ?? params.message),
    sentBy: 'driver',
    timestamp: toOptionalNumber(record['date_timestamp'] ?? record['timestamp']),
    displayTime: typeof record['date'] === 'string' ? record['date'] : undefined,
    raw: record,
  };
}

// ---------------------------------------------------------------------------
// Phase 14 — Driver handyman lifecycle
//   /driver/handyman/get-orders, get-order, bid-order, accept-reject-order,
//   cancel-order, start-order-otp, start-order, arrive-order, end-order,
//   update-payment-order, complete-order, raise-concern, bidding/*
// ---------------------------------------------------------------------------

export interface DriverHandymanOrderParams {
  bookingOrderId?: string;
  bidAmount?: string | number;
  status?: string;
  concerns?: string;
  segmentSlug?: string;
  [key: string]: unknown;
}

export async function fetchDriverHandymanOrders(
  client: ApiClient,
  params?: { status?: string },
): Promise<Record<string, unknown>[]> {
  const envelope = await client.post<unknown>('/driver/handyman/get-orders', {
    ...buildDriverDevicePayload(client),
    ...(params?.status ? { status: params.status } : {}),
  });
  const data = envelope.data;
  const list = Array.isArray(data)
    ? data
    : readRecord(data as Record<string, unknown>)?.['data'] ??
      readRecord(data as Record<string, unknown>)?.['orders'];
  if (!Array.isArray(list)) {
    return [];
  }
  return list.flatMap((entry): Record<string, unknown>[] => {
    const record = readRecord(entry);
    return record ? [record] : [];
  });
}

export async function fetchDriverHandymanOrder(
  client: ApiClient,
  bookingOrderId: string | number,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/handyman/get-order', {
    ...buildDriverDevicePayload(client),
    booking_order_id: bookingOrderId,
  });
  const data = envelope.data;
  return readRecord(data)?.['data'] ? (readRecord(data)?.['data'] as Record<string, unknown>) : (data as Record<string, unknown>);
}

export async function bidDriverHandymanOrder(
  client: ApiClient,
  params: DriverHandymanOrderParams,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/handyman/bid-order', {
    ...buildDriverDevicePayload(client),
    ...params,
  });
  return envelope.data as Record<string, unknown>;
}

export async function acceptRejectDriverHandymanOrder(
  client: ApiClient,
  bookingOrderId: string | number,
  status: 'ACCEPT' | 'REJECT',
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/handyman/accept-reject-order', {
    ...buildDriverDevicePayload(client),
    booking_order_id: bookingOrderId,
    status,
  });
  return envelope.data as Record<string, unknown>;
}

export async function cancelDriverHandymanOrder(
  client: ApiClient,
  bookingOrderId: string | number,
  reason?: string,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/handyman/cancel-order', {
    ...buildDriverDevicePayload(client),
    booking_order_id: bookingOrderId,
    ...(reason ? { cancel_reason: reason } : {}),
  });
  return envelope.data as Record<string, unknown>;
}

export async function requestDriverHandymanStartOtp(
  client: ApiClient,
  bookingOrderId: string | number,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/handyman/start-order-otp', {
    ...buildDriverDevicePayload(client),
    booking_order_id: bookingOrderId,
  });
  return envelope.data as Record<string, unknown>;
}

export async function startDriverHandymanOrder(
  client: ApiClient,
  bookingOrderId: string | number,
  otp?: string,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/handyman/start-order', {
    ...buildDriverDevicePayload(client),
    booking_order_id: bookingOrderId,
    ...(otp ? { otp } : {}),
  });
  return envelope.data as Record<string, unknown>;
}

export async function arriveDriverHandymanOrder(
  client: ApiClient,
  bookingOrderId: string | number,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/handyman/arrive-order', {
    ...buildDriverDevicePayload(client),
    booking_order_id: bookingOrderId,
  });
  return envelope.data as Record<string, unknown>;
}

export async function endDriverHandymanOrder(
  client: ApiClient,
  bookingOrderId: string | number,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/handyman/end-order', {
    ...buildDriverDevicePayload(client),
    booking_order_id: bookingOrderId,
  });
  return envelope.data as Record<string, unknown>;
}

export async function updateDriverHandymanPaymentStatus(
  client: ApiClient,
  bookingOrderId: string | number,
  paymentMethod?: string,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/handyman/update-payment-order', {
    ...buildDriverDevicePayload(client),
    booking_order_id: bookingOrderId,
    ...(paymentMethod ? { payment_method: paymentMethod } : {}),
  });
  return envelope.data as Record<string, unknown>;
}

export async function completeDriverHandymanOrder(
  client: ApiClient,
  bookingOrderId: string | number,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/handyman/complete-order', {
    ...buildDriverDevicePayload(client),
    booking_order_id: bookingOrderId,
  });
  return envelope.data as Record<string, unknown>;
}

export async function raiseDriverHandymanConcern(
  client: ApiClient,
  bookingOrderId: string | number,
  concerns: string,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/handyman/raise-concern', {
    ...buildDriverDevicePayload(client),
    booking_order_id: bookingOrderId,
    concerns,
  });
  return envelope.data as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Phase 14 — Driver bus / shuttle
//   /driver/bus-booking/* (home-screen, get-bookings, get-booking,
//   get-booking-stop-detail, start-booking, pickup-drop, get-passenger-booking,
//   end-booking, bus-stop-status-update, master-bookings)
// ---------------------------------------------------------------------------

export async function fetchBusDriverHome(client: ApiClient): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/bus-booking/home-screen', {
    ...buildDriverDevicePayload(client),
  });
  return envelope.data as Record<string, unknown>;
}

export interface BusDriverBookingParams {
  bookingId?: string | number;
  stopId?: string | number;
  latitude?: string | number;
  longitude?: string | number;
  status?: string | number;
  [key: string]: unknown;
}

export async function fetchBusDriverBookings(
  client: ApiClient,
  params?: BusDriverBookingParams,
): Promise<Record<string, unknown>[]> {
  const envelope = await client.post<unknown>('/driver/bus-booking/get-bookings', {
    ...buildDriverDevicePayload(client),
    ...params,
  });
  const data = envelope.data;
  const list = Array.isArray(data)
    ? data
    : readRecord(data as Record<string, unknown>)?.['data'] ??
      readRecord(data as Record<string, unknown>)?.['bookings'];
  if (!Array.isArray(list)) {
    return [];
  }
  return list.flatMap((entry): Record<string, unknown>[] => {
    const record = readRecord(entry);
    return record ? [record] : [];
  });
}

export async function fetchBusDriverBooking(
  client: ApiClient,
  bookingId: string | number,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/bus-booking/get-booking', {
    ...buildDriverDevicePayload(client),
    booking_id: bookingId,
  });
  const data = envelope.data;
  return readRecord(data)?.['data'] ? (readRecord(data)?.['data'] as Record<string, unknown>) : (data as Record<string, unknown>);
}

export async function fetchBusBookingStopDetail(
  client: ApiClient,
  bookingId: string | number,
  stopId: string | number,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/bus-booking/get-booking-stop-detail', {
    ...buildDriverDevicePayload(client),
    booking_id: bookingId,
    stop_id: stopId,
  });
  return envelope.data as Record<string, unknown>;
}

export async function startBusDriverBooking(
  client: ApiClient,
  params: BusDriverBookingParams,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/bus-booking/start-booking', {
    ...buildDriverDevicePayload(client),
    ...params,
  });
  return envelope.data as Record<string, unknown>;
}

export async function pickupDropBusDriverBooking(
  client: ApiClient,
  params: BusDriverBookingParams,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/bus-booking/pickup-drop', {
    ...buildDriverDevicePayload(client),
    ...params,
  });
  return envelope.data as Record<string, unknown>;
}

export async function fetchBusPassengerBooking(
  client: ApiClient,
  bookingId: string | number,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/bus-booking/get-passenger-booking', {
    ...buildDriverDevicePayload(client),
    booking_id: bookingId,
  });
  return envelope.data as Record<string, unknown>;
}

export async function endBusDriverBooking(
  client: ApiClient,
  bookingId: string | number,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/bus-booking/end-booking', {
    ...buildDriverDevicePayload(client),
    booking_id: bookingId,
  });
  return envelope.data as Record<string, unknown>;
}

export async function updateBusStopStatus(
  client: ApiClient,
  params: BusDriverBookingParams,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/bus-booking/bus-stop-status-update', {
    ...buildDriverDevicePayload(client),
    ...params,
  });
  return envelope.data as Record<string, unknown>;
}

export async function fetchBusMasterBookings(
  client: ApiClient,
  params?: BusDriverBookingParams,
): Promise<Record<string, unknown>[]> {
  const envelope = await client.post<unknown>('/driver/bus-booking/master-bookings', {
    ...buildDriverDevicePayload(client),
    ...params,
  });
  const data = envelope.data;
  const list = Array.isArray(data)
    ? data
    : readRecord(data as Record<string, unknown>)?.['data'] ??
      readRecord(data as Record<string, unknown>)?.['bookings'];
  if (!Array.isArray(list)) {
    return [];
  }
  return list.flatMap((entry): Record<string, unknown>[] => {
    const record = readRecord(entry);
    return record ? [record] : [];
  });
}

// ---------------------------------------------------------------------------
// Phase 14 — Driver laundry-outlet delivery
//   /driver/laundry-outlet/order-otp-verification,
//   /driver/laundry-outlet/deliver-order
// ---------------------------------------------------------------------------

export interface LaundryDriverDeliveryParams {
  orderId?: string | number;
  otp?: string;
  [key: string]: unknown;
}

export async function verifyLaundryDriverDeliveryOtp(
  client: ApiClient,
  params: LaundryDriverDeliveryParams,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>(
    '/driver/laundry-outlet/order-otp-verification',
    {
      ...buildDriverDevicePayload(client),
      ...params,
    },
  );
  return envelope.data as Record<string, unknown>;
}

export async function deliverLaundryDriverOrder(
  client: ApiClient,
  params: LaundryDriverDeliveryParams,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>(
    '/driver/laundry-outlet/deliver-order',
    {
      ...buildDriverDevicePayload(client),
      ...params,
    },
  );
  return envelope.data as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Phase 14 — InDrive counter-offer  /driver/booking/in-drive-counter
// ---------------------------------------------------------------------------

export interface DriverInDriveCounterParams {
  bookingOrderId?: string;
  amount?: string | number;
  status?: string;
}

export async function sendDriverInDriveCounter(
  client: ApiClient,
  params: DriverInDriveCounterParams,
): Promise<Record<string, unknown>> {
  const envelope = await client.post<Record<string, unknown>>('/driver/booking/in-drive-counter', {
    ...buildDriverDevicePayload(client),
    ...(params.bookingOrderId ? { booking_order_id: params.bookingOrderId } : {}),
    ...(params.amount !== undefined ? { amount: params.amount } : {}),
    ...(params.status ? { status: params.status } : {}),
  });
  return envelope.data as Record<string, unknown>;
}