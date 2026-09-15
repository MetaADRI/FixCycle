import type { ApiClient } from '../client';
import type { ApiEnvelope } from '../envelope';

// ---------------------------------------------------------------------------
// Phase 10 — Laundry (outlet-based garment care services).
// Mirror of the MockApiClient contract reconstructed from LaundryServiceTrait
// + LaundryOutlet/LaundryService models. Outlets, garment services, time
// slots, cart, promo, confirm, tracking with OTP verification, cancel, rate.
// All routes are prefixed /user/laundry/*.
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
function dataOf(envelope: ApiEnvelope<unknown>): Record<string, unknown> {
  return obj(envelope.data);
}
function toBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LaundryCategory {
  id: number;
  name: string;
  image: string;
}

export interface LaundryService {
  id: number;
  laundry_service_id: number;
  category_id: number;
  price: number;
  formatted_price: string;
  title: string;
  service_description: string;
  currency: string;
  image: string;
  service_availability: string;
  sequence: number;
}

export interface LaundryOutlet {
  id: number;
  laundry_outlet_id: number;
  segment_id: number;
  full_name: string;
  address: string;
  phone_number: string;
  latitude: number;
  longitude: number;
  rating: string;
  rating_number: number;
  distance: string;
  image: string;
  is_outlet_open: boolean;
  price_card_id: number;
  currency: string;
  background_color: string;
}

export interface LaundryTimeSlot {
  id: number;
  slot_time: string;
  date: string;
  is_selected: number;
}

export interface LaundryTimeSlotResponse {
  time_slots: LaundryTimeSlot[];
  instant_booking_time_slot_id: number | null;
  instant_booking_after_text: string;
}

export interface LaundryCartItem {
  laundry_service_id: number;
  quantity: number;
  title: string;
  price: number;
  image: string;
  category_id: number;
}

export interface LaundryCart {
  cart_id: number;
  laundry_outlet_id: number;
  segment_id: number;
  service_type_id: number;
  service_time_slot_detail_id: number;
  booking_date: string;
  slot_time_text: string;
  drop_location: string;
  latitude: string;
  longitude: string;
  user_address_id: number;
  payment_method_id: number;
  items: LaundryCartItem[];
  total_quantity: number;
  cart_amount: number;
  delivery_amount: number;
  tax: number;
  discount_amount: number;
  final_amount: number;
  applied_promo_code: string;
}

export interface LaundryOrderItem {
  id: number;
  laundry_service_id: number;
  title: string;
  price: string;
  quantity: number;
  total_amount: string;
  image: string;
}

export interface LaundryStatusStep {
  status_text: string;
  order_timestamp: string;
  status: boolean;
}

export interface LaundryPaymentDetail {
  cart_amount: string;
  delivery_amount: string;
  tax: string;
  final_amount_paid: string;
  discount_amount: string;
  total_pending_amount: string;
  pending_amount_status: boolean;
  pending_message: string;
  paid_status: boolean;
  payment_method_id: number;
  payment_mode: string;
}

export interface LaundryOrderDetail {
  order_id: number;
  merchant_order_id: string;
  laundry_outlet_id: number;
  outlet_name: string;
  outlet_address: string;
  outlet_image: string;
  outlet_phone_number: string;
  outlet_latitude: number;
  outlet_longitude: number;
  segment_id: number;
  segment_name: string;
  service_type_id: number;
  order_status_text: string;
  order_status: number;
  order_otp: string;
  otp_required: boolean;
  total_quantity: number;
  items: LaundryOrderItem[];
  drop_location: string;
  drop_latitude: string;
  drop_longitude: string;
  booking_date: string;
  slot_time_text: string;
  estimate_delivery_time: string;
  payment_detail: LaundryPaymentDetail;
  cancel_reason: LaundryCancelReason[];
  is_rated: boolean;
  arr_action: { cancel: boolean; pay: boolean; otp_required: boolean };
  status_prgress: LaundryStatusStep[];
  order_status_history: { order_status: number; order_timestamp: string }[];
}

export interface LaundryOrder {
  order_id: number;
  merchant_order_id: string;
  laundry_outlet_id: number;
  outlet_name: string;
  outlet_image: string;
  outlet_address: string;
  segment_id: number;
  segment_name: string;
  service_type_id: number;
  order_status_text: string;
  order_status: number;
  total_quantity: number;
  items_count: number;
  final_amount_paid: string;
  currency: string;
  booking_date: string;
  slot_time_text: string;
  is_rated: boolean;
}

export interface LaundryCancelReason {
  id: number;
  reason: string;
}

export interface LaundryConfirmResult {
  order_id: number | undefined;
  order_status: number;
  success: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// Outlets / categories / services / slots
// ---------------------------------------------------------------------------

export async function fetchLaundryCategories(
  client: ApiClient,
  params: { segmentId?: number | string; signal?: AbortSignal },
): Promise<LaundryCategory[]> {
  const body: Record<string, unknown> = { segment_id: params.segmentId ?? 5 };
  const envelope = await client.post<unknown>('/user/laundry/get-categories', body, { scope: 'user', signal: params.signal });
  return arr(dataOf(envelope)['arr_categories']).map((c) => ({
    id: num0(c['id']),
    name: str0(c['name'], str0(c['category_name'])),
    image: str0(c['image'], str0(c['category_image'])),
  }));
}

export async function fetchLaundryServices(
  client: ApiClient,
  params: { segmentId?: number | string; categoryId?: number | string; signal?: AbortSignal },
): Promise<{ categories: LaundryCategory[]; currency: string; services: LaundryService[] }> {
  const body: Record<string, unknown> = { segment_id: params.segmentId ?? 5 };
  if (params.categoryId != null) body.category_id = params.categoryId;
  const envelope = await client.post<unknown>('/user/laundry/get-services', body, { scope: 'user', signal: params.signal });
  const d = dataOf(envelope);
  return {
    categories: arr(d['categories']).map((c) => ({
      id: num0(c['id']),
      name: str0(c['name'], str0(c['category_name'])),
      image: str0(c['image']),
    })),
    currency: str0(d['currency'], '₹'),
    services: arr(d['services']).map((s) => ({
      id: num0(s['id'], num0(s['laundry_service_id'])),
      laundry_service_id: num0(s['laundry_service_id'], num0(s['id'])),
      category_id: num0(s['category_id']),
      price: num0(s['price']),
      formatted_price: str0(s['formatted_price']),
      title: str0(s['title'], str0(s['name'])),
      service_description: str0(s['service_description']),
      currency: str0(s['currency'], '₹'),
      image: str0(s['image']),
      service_availability: str0(s['service_availability'], '1'),
      sequence: num0(s['sequence'], 0),
    })),
  };
}

export async function fetchLaundryOutlets(
  client: ApiClient,
  params: { segmentId?: number | string; latitude?: number; longitude?: number; signal?: AbortSignal },
): Promise<LaundryOutlet[]> {
  const body: Record<string, unknown> = {
    segment_id: params.segmentId ?? 5,
    latitude: params.latitude ?? 19.076,
    longitude: params.longitude ?? 72.877,
  };
  const envelope = await client.post<unknown>('/user/laundry/get-outlets', body, { scope: 'user', signal: params.signal });
  const d = obj(envelope.data);
  const list = Array.isArray(envelope.data) ? (envelope.data as unknown[]) : arr(d['outlets']);
  return (list as Record<string, unknown>[]).map((o) => ({
    id: num0(o['id'], num0(o['laundry_outlet_id'])),
    laundry_outlet_id: num0(o['laundry_outlet_id'], num0(o['id'])),
    segment_id: num0(o['segment_id'], 5),
    full_name: str0(o['full_name'], str0(o['title'])),
    address: str0(o['address'], str0(o['full_address'])),
    phone_number: str0(o['phone_number']),
    latitude: num0(o['latitude']),
    longitude: num0(o['longitude']),
    rating: str0(o['rating'], String(o['rating_number'] ?? '0')),
    rating_number: num0(o['rating_number'], Number(o['rating'] ?? 0)),
    distance: str0(o['distance']),
    image: str0(o['image']),
    is_outlet_open: toBool(o['is_outlet_open']),
    price_card_id: num0(o['price_card_id']),
    currency: str0(o['currency'], '₹'),
    background_color: str0(o['background_color']),
  }));
}

export async function fetchLaundryOutletDetail(
  client: ApiClient,
  params: { outletId: number | string; signal?: AbortSignal },
): Promise<LaundryOutlet | null> {
  const envelope = await client.post<unknown>('/user/laundry/get-outlet', { laundry_outlet_id: params.outletId }, { scope: 'user', signal: params.signal });
  const o = obj(envelope.data);
  if (!o || Object.keys(o).length === 0) return null;
  return {
    id: num0(o['id'], num0(o['laundry_outlet_id'])),
    laundry_outlet_id: num0(o['laundry_outlet_id'], num0(o['id'])),
    segment_id: num0(o['segment_id'], 5),
    full_name: str0(o['full_name'], str0(o['title'])),
    address: str0(o['address']),
    phone_number: str0(o['phone_number']),
    latitude: num0(o['latitude']),
    longitude: num0(o['longitude']),
    rating: str0(o['rating'], '0'),
    rating_number: num0(o['rating_number'], Number(o['rating'] ?? 0)),
    distance: str0(o['distance']),
    image: str0(o['image']),
    is_outlet_open: toBool(o['is_outlet_open']),
    price_card_id: num0(o['price_card_id']),
    currency: str0(o['currency'], '₹'),
    background_color: str0(o['background_color']),
  };
}

export async function fetchLaundryTimeSlots(
  client: ApiClient,
  params: { segmentId?: number | string; signal?: AbortSignal },
): Promise<LaundryTimeSlotResponse> {
  const body: Record<string, unknown> = { segment_id: params.segmentId ?? 5 };
  const envelope = await client.post<unknown>('/user/laundry/service-slots', body, { scope: 'user', signal: params.signal });
  const d = dataOf(envelope);
  return {
    time_slots: arr(d['time_slots']).map((s) => ({
      id: num0(s['id'], num0(s['service_time_slot_detail_id'])),
      slot_time: str0(s['slot_time'], str0(s['slot_text'])),
      date: str0(s['date']),
      is_selected: num0(s['is_selected'], 0),
    })),
    instant_booking_time_slot_id: d['instant_booking_time_slot_id'] != null ? num0(d['instant_booking_time_slot_id']) : null,
    instant_booking_after_text: str0(d['instant_booking_after_text']),
  };
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

function parseLaundryCart(d: Record<string, unknown>): LaundryCart {
  return {
    cart_id: num0(d['cart_id']),
    laundry_outlet_id: num0(d['laundry_outlet_id']),
    segment_id: num0(d['segment_id'], 5),
    service_type_id: num0(d['service_type_id'], 1),
    service_time_slot_detail_id: num0(d['service_time_slot_detail_id']),
    booking_date: str0(d['booking_date']),
    slot_time_text: str0(d['slot_time_text']),
    drop_location: str0(d['drop_location']),
    latitude: str0(d['latitude']),
    longitude: str0(d['longitude']),
    user_address_id: num0(d['user_address_id'], 12),
    payment_method_id: num0(d['payment_method_id'], 1),
    items: arr(d['items']).map((i) => ({
      laundry_service_id: num0(i['laundry_service_id'], num0(i['id'])),
      quantity: num0(i['quantity'], 1),
      title: str0(i['title']),
      price: num0(i['price']),
      image: str0(i['image']),
      category_id: num0(i['category_id']),
    })),
    total_quantity: num0(d['total_quantity']),
    cart_amount: num0(d['cart_amount']),
    delivery_amount: num0(d['delivery_amount']),
    tax: num0(d['tax']),
    discount_amount: num0(d['discount_amount']),
    final_amount: num0(d['final_amount']),
    applied_promo_code: str0(d['applied_promo_code']),
  };
}

export interface LaundrySaveCartItem {
  laundryServiceId: number;
  quantity: number;
}

export interface LaundrySaveCartParams {
  outletId: number | string;
  segmentId?: number | string;
  items?: LaundrySaveCartItem[];
  serviceTypeId?: number;
  serviceTimeSlotDetailId?: number;
  bookingDate?: string;
  dropLocation?: string;
  latitude?: number | string;
  longitude?: number | string;
  userAddressId?: number;
  paymentMethodId?: number;
  signal?: AbortSignal;
}

export async function saveLaundryCart(client: ApiClient, params: LaundrySaveCartParams): Promise<LaundryCart> {
  const body: Record<string, unknown> = { laundry_outlet_id: params.outletId };
  if (params.segmentId != null) body.segment_id = params.segmentId;
  if (params.items != null) body.items = params.items.map((i) => ({ laundry_service_id: i.laundryServiceId, quantity: i.quantity }));
  if (params.serviceTypeId != null) body.service_type_id = params.serviceTypeId;
  if (params.serviceTimeSlotDetailId != null) body.service_time_slot_detail_id = params.serviceTimeSlotDetailId;
  if (params.bookingDate) body.booking_date = params.bookingDate;
  if (params.dropLocation != null) body.drop_location = params.dropLocation;
  if (params.latitude != null) body.latitude = params.latitude;
  if (params.longitude != null) body.longitude = params.longitude;
  if (params.userAddressId != null) body.user_address_id = params.userAddressId;
  if (params.paymentMethodId != null) body.payment_method_id = params.paymentMethodId;
  const envelope = await client.post<unknown>('/user/laundry/save-cart', body, { scope: 'user', signal: params.signal });
  return parseLaundryCart(dataOf(envelope));
}

export async function fetchLaundryCart(client: ApiClient, params: { outletId: number | string; signal?: AbortSignal }): Promise<LaundryCart> {
  const envelope = await client.post<unknown>('/user/laundry/get-cart', { laundry_outlet_id: params.outletId }, { scope: 'user', signal: params.signal });
  return parseLaundryCart(dataOf(envelope));
}

export interface LaundryDeleteCartParams {
  outletId: number | string;
  laundryServiceId?: number | null;
  signal?: AbortSignal;
}

export async function deleteLaundryCart(client: ApiClient, params: LaundryDeleteCartParams): Promise<LaundryCart> {
  const body: Record<string, unknown> = { laundry_outlet_id: params.outletId };
  if (params.laundryServiceId != null) body.laundry_service_id = params.laundryServiceId;
  const envelope = await client.post<unknown>('/user/laundry/delete-cart', body, { scope: 'user', signal: params.signal });
  return parseLaundryCart(dataOf(envelope));
}

export async function applyLaundryPromo(
  client: ApiClient,
  params: { outletId: number | string; promoCode?: string; signal?: AbortSignal },
): Promise<LaundryCart> {
  const body: Record<string, unknown> = { laundry_outlet_id: params.outletId };
  if (params.promoCode) body.promo_code = params.promoCode;
  const envelope = await client.post<unknown>('/user/laundry/apply-promo', body, { scope: 'user', signal: params.signal });
  return parseLaundryCart(dataOf(envelope));
}

// ---------------------------------------------------------------------------
// Confirm / orders
// ---------------------------------------------------------------------------

export interface LaundryConfirmParams {
  outletId: number | string;
  paymentMethodId: number;
  latitude?: number | string;
  longitude?: number | string;
  dropLocation?: string;
  cardId?: number | string;
  additionalNotes?: string;
  signal?: AbortSignal;
}

export async function confirmLaundryOrder(client: ApiClient, params: LaundryConfirmParams): Promise<LaundryConfirmResult> {
  const body: Record<string, unknown> = {
    laundry_outlet_id: params.outletId,
    payment_method_id: params.paymentMethodId,
    latitude: params.latitude ?? 19.076,
    longitude: params.longitude ?? 72.877,
    drop_location: params.dropLocation ?? '',
  };
  if (params.cardId != null) body.card_id = params.cardId;
  if (params.additionalNotes != null) body.additional_notes = params.additionalNotes;
  const envelope = await client.post<unknown>('/user/laundry/confirm-order', body, { scope: 'user', signal: params.signal });
  const d = dataOf(envelope);
  return {
    order_id: d['order_id'] != null ? num0(d['order_id']) : undefined,
    order_status: num0(d['order_status'], 1),
    success: d['order_id'] != null,
    message: str0(d['message'], envelope.result === '1' ? 'OK' : 'Order could not be placed'),
  };
}

export interface LaundryOrderQuery {
  type: 'ONGOING' | 'PAST';
  signal?: AbortSignal;
}

function parseOrder(o: Record<string, unknown>): LaundryOrder {
  return {
    order_id: num0(o['order_id']),
    merchant_order_id: str0(o['merchant_order_id']),
    laundry_outlet_id: num0(o['laundry_outlet_id']),
    outlet_name: str0(o['outlet_name']),
    outlet_image: str0(o['outlet_image']),
    outlet_address: str0(o['outlet_address']),
    segment_id: num0(o['segment_id'], 5),
    segment_name: str0(o['segment_name'], 'Laundry'),
    service_type_id: num0(o['service_type_id'], 1),
    order_status_text: str0(o['order_status_text']),
    order_status: num0(o['order_status']),
    total_quantity: num0(o['total_quantity']),
    items_count: num0(o['items_count']),
    final_amount_paid: str0(o['final_amount_paid']),
    currency: str0(o['currency'], '₹'),
    booking_date: str0(o['booking_date']),
    slot_time_text: str0(o['slot_time_text']),
    is_rated: toBool(o['is_rated']),
  };
}

export async function fetchLaundryOrders(client: ApiClient, params: LaundryOrderQuery): Promise<LaundryOrder[]> {
  const envelope = await client.post<unknown>('/user/laundry/get-orders', { type: params.type }, { scope: 'user', signal: params.signal });
  return arr(envelope.data).map(parseOrder);
}

function parseOrderDetail(d: Record<string, unknown>): LaundryOrderDetail {
  const pd = obj(d['payment_detail']);
  return {
    order_id: num0(d['order_id']),
    merchant_order_id: str0(d['merchant_order_id']),
    laundry_outlet_id: num0(d['laundry_outlet_id']),
    outlet_name: str0(d['outlet_name']),
    outlet_address: str0(d['outlet_address']),
    outlet_image: str0(d['outlet_image']),
    outlet_phone_number: str0(d['outlet_phone_number']),
    outlet_latitude: num0(d['outlet_latitude']),
    outlet_longitude: num0(d['outlet_longitude']),
    segment_id: num0(d['segment_id'], 5),
    segment_name: str0(d['segment_name'], 'Laundry'),
    service_type_id: num0(d['service_type_id'], 1),
    order_status_text: str0(d['order_status_text']),
    order_status: num0(d['order_status']),
    order_otp: str0(d['order_otp']),
    otp_required: toBool(d['otp_required']),
    total_quantity: num0(d['total_quantity']),
    items: arr(d['items']).map((i) => ({
      id: num0(i['id']),
      laundry_service_id: num0(i['laundry_service_id']),
      title: str0(i['title']),
      price: str0(i['price']),
      quantity: num0(i['quantity'], 1),
      total_amount: str0(i['total_amount']),
      image: str0(i['image']),
    })),
    drop_location: str0(d['drop_location']),
    drop_latitude: str0(d['drop_latitude']),
    drop_longitude: str0(d['drop_longitude']),
    booking_date: str0(d['booking_date']),
    slot_time_text: str0(d['slot_time_text']),
    estimate_delivery_time: str0(d['estimate_delivery_time']),
    payment_detail: {
      cart_amount: str0(pd['cart_amount']),
      delivery_amount: str0(pd['delivery_amount']),
      tax: str0(pd['tax']),
      final_amount_paid: str0(pd['final_amount_paid']),
      discount_amount: str0(pd['discount_amount']),
      total_pending_amount: str0(pd['total_pending_amount']),
      pending_amount_status: toBool(pd['pending_amount_status']),
      pending_message: str0(pd['pending_message']),
      paid_status: toBool(pd['paid_status']),
      payment_method_id: num0(pd['payment_method_id'], 1),
      payment_mode: str0(pd['payment_mode'], 'Cash'),
    },
    cancel_reason: arr(d['cancel_reason']).map((c) => ({ id: num0(c['id']), reason: str0(c['reason']) })),
    is_rated: toBool(d['is_rated']),
    arr_action: {
      cancel: toBool(obj(d['arr_action'])['cancel']),
      pay: toBool(obj(d['arr_action'])['pay']),
      otp_required: toBool(obj(d['arr_action'])['otp_required']),
    },
    status_prgress: arr(d['status_prgress']).map((s) => ({
      status_text: str0(s['status_text']),
      order_timestamp: str0(s['order_timestamp']),
      status: toBool(s['status']),
    })),
    order_status_history: arr(d['order_status_history']).map((h) => ({
      order_status: num0(h['order_status']),
      order_timestamp: str0(h['order_timestamp']),
    })),
  };
}

export async function fetchLaundryOrderDetail(client: ApiClient, params: { orderId: number | string; signal?: AbortSignal }): Promise<LaundryOrderDetail> {
  const envelope = await client.post<unknown>('/user/laundry/get-order-detail', { order_id: params.orderId }, { scope: 'user', signal: params.signal });
  return parseOrderDetail(dataOf(envelope));
}

export interface LaundryOtpResult {
  valid: boolean;
  order?: LaundryOrderDetail;
  message: string;
}

export async function verifyLaundryOtp(client: ApiClient, params: { orderId: number | string; otp: string; signal?: AbortSignal }): Promise<LaundryOtpResult> {
  const envelope = await client.post<unknown>('/user/laundry/verify-otp', { order_id: params.orderId, otp: params.otp }, { scope: 'user', signal: params.signal });
  if (envelope.result !== '1') return { valid: false, message: str0(envelope.message, 'Invalid OTP') };
  return { valid: true, order: parseOrderDetail(dataOf(envelope)), message: 'OK' };
}

export async function cancelLaundryOrder(
  client: ApiClient,
  params: { orderId: number | string; cancelReasonId: number; signal?: AbortSignal },
): Promise<{ success: boolean; message: string }> {
  const envelope = await client.post<unknown>(
    '/user/laundry/cancel-order',
    { order_id: params.orderId, cancel_reason_id: params.cancelReasonId },
    { scope: 'user', signal: params.signal },
  );
  return { success: envelope.result === '1', message: str0(envelope.message, 'Cancel failed') };
}

export async function rateLaundryOutlet(
  client: ApiClient,
  params: { orderId: number | string; rating: number; comment?: string; signal?: AbortSignal },
): Promise<void> {
  const body: Record<string, unknown> = { order_id: params.orderId, rating: params.rating };
  if (params.comment) body.comment = params.comment;
  await client.post<unknown>('/user/laundry/rate-outlet', body, { scope: 'user', signal: params.signal });
}