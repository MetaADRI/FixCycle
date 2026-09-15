import type { ApiClient } from '../client';
import type { ApiEnvelope } from '../envelope';

// ---------------------------------------------------------------------------
// Phase 9 — Handyman, plumber, salon, towing (helper-based services).
// Mirror of Api\PlumberController + Api\PlumberBiddingController behaviour.
// Person-based services: categories, providers, time slots, cart, confirm,
// bidding, tracking. All routes are prefixed /user/handyman/*.
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
function num1(value: unknown, fb = 1): number {
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HandymanCategory {
  id: number;
  name: string;
  image: string;
}

export interface HandymanService {
  id: number;
  name: string;
  price: number;
  amount_string: string;
  price_type: number;
  segment_price_card_id: number;
}

export interface HandymanProvider {
  id: number;
  first_name: string;
  last_name: string;
  business_name: string;
  distance: string;
  is_favourite: number;
  rating: string;
  rating_number: number;
  time_range: string;
  current_latitude: string;
  current_longitude: string;
  image: string;
  segment_price_card_id: number;
  hourly_amount: string;
  minimum_booking_amount: string;
  min_bill_description: string;
  price_type_text: string;
  price_type_slug: string;
  services: HandymanProviderService[];
}

export interface HandymanProviderService {
  id: number;
  name: string;
  amount: number;
  amount_string: string;
  segment_price_card_detail_id: number | null;
}

export interface HandymanTimeSlot {
  id: number;
  slot_time: string;
  date: string;
  is_selected: number;
}

export interface HandymanServicesResponse {
  segment_price_id: number;
  currency: string;
  price_type_text: string;
  price_type_slug: string;
  minimum_booking_amount: number;
  minimum_booking_amount_string: string;
  min_bill_description: string;
  hourly_amount: number;
  services: HandymanService[];
  handyman_bidding_enable: boolean;
}

export interface HandymanTimeSlotResponse {
  time_slots: HandymanTimeSlot[];
  instant_booking_time_slot_id: number | null;
  instant_booking_after_text: string;
}

export interface HandymanCartService {
  service_type_id: number;
  quantity: number;
  segment_price_card_detail_id: number;
  price: number;
  service_price: number;
  service_name: string;
}

export interface HandymanCart {
  total_quantity: number;
  total_amount: number;
  discount_amount: number;
  tax: number;
  tax_per: number;
  final_amount: number;
  ordered_services: HandymanCartService[];
  cart_id: number;
  service_time_slot_detail_id: number;
  driver_id: number | null;
  booking_date: string;
  payment_method_id: number;
  segment_price_card_id: number;
  latitude: string;
  longitude: string;
  drop_location: string;
  user_address_id: number;
  booking_time: string;
  driver_details: {
    id: number | null;
    image: string;
    first_name: string;
    last_name: string;
  };
  applied_promo_code: string;
}

export interface HandymanPromoResult {
  promo_code: string;
  valid: boolean;
  discount_amount: number;
  message: string;
}

export interface HandymanOrderService {
  id: number;
  name: string;
  amount: string;
  currency: string;
  price_type: number;
  segment_price_card_id: number;
}

export interface HandymanOrder {
  order_id: number;
  merchant_order_id: string;
  first_name: string;
  last_name: string;
  rating: string;
  profile_image: string;
  final_amount_paid: string;
  currency: string;
  total_services: number;
  order_status: string;
  numeric_order_status: number;
  booking_date: string;
  slot_time_text: string;
  segment_id: number;
  service_type: HandymanOrderService[];
  status_text?: string;
}

export interface HandymanOrderDetail {
  order_id: number;
  merchant_order_id: string;
  first_name: string;
  last_name: string;
  rating: string;
  profile_image: string;
  phone_number: string;
  drop_location: string;
  drop_latitude: string;
  drop_longitude: string;
  currency: string;
  total_services: number;
  order_status: string;
  status: number;
  order_otp: string;
  segment_name: string;
  booking_date: string;
  slot_time_text: string;
  service_type: HandymanOrderService[];
  segment_id: number;
  payment_detail: {
    cart_amount: string;
    dispute_settled_amount: string;
    tax: string;
    final_amount_paid: string;
    minimum_booking_amount: string;
    minimum_booking_amount_payment_status: boolean;
    total_pending_amount: string;
    pending_amount_status: boolean;
    pending_message: string;
    paid_status: boolean;
    payment_method_id: number;
    payment_mode: string;
    discount_amount: string;
    additional_amount: HandymanAdditionalCharge[];
    custom_additional_charge: string;
  };
  cancel_reason: HandymanCancelReason[];
  is_rated: boolean;
  arr_action: {
    cancel: boolean;
    pay: boolean;
    create_outstanding: string;
  };
  bidding_amount_accepted: string | null;
  bidding_amount: string | null;
  handyman_customer_details_visible: boolean;
  current_latitude: string;
  current_longitude: string;
}

export interface HandymanAdditionalCharge {
  id: number;
  charge_name: string;
  charge_amount: string;
  status: string;
}

export interface HandymanCancelReason {
  id: number;
  reason: string;
}

export interface HandymanBid {
  id: number;
  driver_id: number;
  first_name: string;
  last_name: string;
  profile_image: string;
  rating: string;
  bid_amount: string;
  amount: string;
  created_at: string;
  time_text: string;
  user_offer_price: string;
  status: string;
  numeric_status: number;
  message: string;
}

export interface HandymanBidOrder {
  id: number;
  bid_order_id: string;
  service_name: string;
  category_name: string;
  description: string;
  work_image_one: string;
  work_image_two: string;
  work_image_three: string;
  work_image_four: string;
  final_amount: string;
  status: string;
  numeric_status: number;
  created_at: string;
  booked_at: string;
  time_slot_text: string;
  user_offer_price: string;
  no_of_bids: number;
  segment_id: number;
  bids: HandymanBid[];
}

// ---------------------------------------------------------------------------
// Categories / Services / Providers / Slots
// ---------------------------------------------------------------------------

export async function fetchHandymanCategories(
  client: ApiClient,
  params: { segmentId: number | string; latitude?: number; longitude?: number; signal?: AbortSignal },
): Promise<HandymanCategory[]> {
  const body: Record<string, unknown> = {
    segment_id: params.segmentId,
    latitude: params.latitude ?? 19.076,
    longitude: params.longitude ?? 72.877,
  };
  const envelope = await client.post<unknown>('/user/handyman/get-categories', body, { scope: 'user', signal: params.signal });
  return arr(dataOf(envelope)['arr_categories']).map((c) => ({
    id: num0(c['id']),
    name: str0(c['name'], str0(c['category_name'])),
    image: str0(c['image'], str0(c['category_image'])),
  }));
}

export async function fetchHandymanServices(
  client: ApiClient,
  params: { segmentId: number | string; latitude?: number; longitude?: number; signal?: AbortSignal },
): Promise<HandymanServicesResponse> {
  const body: Record<string, unknown> = {
    segment_id: params.segmentId,
    latitude: params.latitude ?? 19.076,
    longitude: params.longitude ?? 72.877,
  };
  const envelope = await client.post<unknown>('/user/handyman/get-services', body, { scope: 'user', signal: params.signal });
  const d = dataOf(envelope);
  return {
    segment_price_id: num0(d['segment_price_id']),
    currency: str0(d['currency'], '₹'),
    price_type_text: str0(d['price_type_text']),
    price_type_slug: str0(d['price_type_slug']),
    minimum_booking_amount: num0(d['minimum_booking_amount']),
    minimum_booking_amount_string: str0(d['minimum_booking_amount_string']),
    min_bill_description: str0(d['min_bill_description']),
    hourly_amount: num0(d['hourly_amount']),
    services: arr(d['arr_services']).map((s) => ({
      id: num0(s['id'], num0(s['service_type_id'])),
      name: str0(s['name'], str0(s['service_name'])),
      price: num0(s['amount'], num0(s['price'])),
      amount_string: str0(s['amount_string']),
      price_type: num0(s['price_type'], 1),
      segment_price_card_id: num0(s['segment_price_card_id']),
    })),
    handyman_bidding_enable: d['handyman_bidding_enable'] === true || d['handyman_bidding_enable'] === 1,
  };
}

export async function fetchHandymanProviders(
  client: ApiClient,
  params: { segmentId: number | string; selectedServices: number[]; latitude?: number; longitude?: number; page?: number; signal?: AbortSignal },
): Promise<{ providers: HandymanProvider[]; totalPages: number; currentPage: number; taxPer: number; limit: number }> {
  const body: Record<string, unknown> = {
    segment_id: params.segmentId,
    latitude: params.latitude ?? 19.076,
    longitude: params.longitude ?? 72.877,
    pagination: 1,
    selected_services: params.selectedServices.map((id) => ({ service_type_id: id })),
  };
  if (params.page) body.page = params.page;
  const envelope = await client.post<unknown>('/user/handyman/get-providers', body, { scope: 'user', signal: params.signal });
  const d = obj(envelope.data);
  const list = Array.isArray(Array.isArray(envelope.data) ? envelope.data : d['providers'])
    ? (Array.isArray(envelope.data) ? (envelope.data as unknown[]) : d['providers'])
    : [];
  return {
    providers: (list as Record<string, unknown>[]).map((p) => ({
      id: num0(p['id']),
      first_name: str0(p['first_name']),
      last_name: str0(p['last_name']),
      business_name: str0(p['business_name']),
      distance: str0(p['distance']),
      is_favourite: num0(p['is_favourite']),
      rating: str0(p['rating'], '0'),
      rating_number: Number(str0(p['rating'], '0')),
      time_range: str0(p['time_range']),
      current_latitude: str0(p['current_latitude']),
      current_longitude: str0(p['current_longitude']),
      image: str0(p['image']),
      segment_price_card_id: num0(p['segment_price_card_id']),
      hourly_amount: str0(p['hourly_amount']),
      minimum_booking_amount: str0(p['minimum_booking_amount']),
      min_bill_description: str0(p['min_bill_description']),
      price_type_text: str0(p['price_type_text']),
      price_type_slug: str0(p['price_type_slug']),
      services: arr(p['service_type']).map((s) => ({
        id: num0(s['id']),
        name: str0(s['name']),
        amount: num0(s['amount']),
        amount_string: str0(s['amount_string']),
        segment_price_card_detail_id: s['segment_price_card_detail_id'] != null ? num0(s['segment_price_card_detail_id']) : null,
      })),
    })),
    totalPages: !Array.isArray(envelope.data) ? num0(d['total_pages']) : 1,
    currentPage: !Array.isArray(envelope.data) ? num0(d['current_page'], 1) : 1,
    taxPer: !Array.isArray(envelope.data) ? num0(d['tax_per']) : 0,
    limit: !Array.isArray(envelope.data) ? num0(d['limit'], 10) : 10,
  };
}

export async function fetchHandymanProviderDetail(
  client: ApiClient,
  params: { providerId: number | string; segmentId?: number | string; signal?: AbortSignal },
): Promise<HandymanProvider | null> {
  const body: Record<string, unknown> = { provider_id: params.providerId };
  if (params.segmentId) body.segment_id = params.segmentId;
  const envelope = await client.post<unknown>('/user/handyman/get-provider', body, { scope: 'user', signal: params.signal });
  const p = obj(envelope.data);
  if (!p || Object.keys(p).length === 0) return null;
  return {
    id: num0(p['id'], num0(p['provider_id'])),
    first_name: str0(p['first_name']),
    last_name: str0(p['last_name']),
    business_name: str0(p['business_name']),
    distance: str0(p['distance']),
    is_favourite: num0(p['is_favourite']),
    rating: str0(p['rating'], '0'),
    rating_number: Number(str0(p['rating'], '0')),
    time_range: str0(p['time_range']),
    current_latitude: str0(p['current_latitude']),
    current_longitude: str0(p['current_longitude']),
    image: str0(p['image']),
    segment_price_card_id: num0(p['segment_price_card_id']),
    hourly_amount: str0(p['hourly_amount']),
    minimum_booking_amount: str0(p['minimum_booking_amount']),
    min_bill_description: str0(p['min_bill_description']),
    price_type_text: str0(p['price_type_text']),
    price_type_slug: str0(p['price_type_slug']),
    services: arr(p['service_type']).map((s) => ({
      id: num0(s['id']),
      name: str0(s['name']),
      amount: num0(s['amount']),
      amount_string: str0(s['amount_string']),
      segment_price_card_detail_id: s['segment_price_card_detail_id'] != null ? num0(s['segment_price_card_detail_id']) : null,
    })),
  };
}

export async function fetchHandymanTimeSlots(
  client: ApiClient,
  params: { segmentId: number | string; latitude?: number; longitude?: number; signal?: AbortSignal },
): Promise<HandymanTimeSlotResponse> {
  const body: Record<string, unknown> = {
    segment_id: params.segmentId,
    latitude: params.latitude ?? 19.076,
    longitude: params.longitude ?? 72.877,
  };
  const envelope = await client.post<unknown>('/user/handyman/service-slots', body, { scope: 'user', signal: params.signal });
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

export function parseHandymanCart(d: Record<string, unknown>): HandymanCart {
  return {
    total_quantity: num0(d['total_quantity']),
    total_amount: num0(d['total_amount']),
    discount_amount: num0(d['discount_amount']),
    tax: num0(d['tax']),
    tax_per: num0(d['tax_per']),
    final_amount: num0(d['final_amount']),
    ordered_services: arr(d['ordered_services']).map((s) => ({
      service_type_id: num0(s['service_type_id'], num0(s['id'])),
      quantity: num0(s['quantity'], 1),
      segment_price_card_detail_id: num0(s['segment_price_card_detail_id']),
      price: num0(s['price'], num0(s['service_price'])),
      service_price: num0(s['service_price'], num0(s['price'])),
      service_name: str0(s['service_name'], str0(s['name'])),
    })),
    cart_id: num0(d['cart_id']),
    service_time_slot_detail_id: num0(d['service_time_slot_detail_id']),
    driver_id: d['driver_id'] != null ? num0(d['driver_id']) : null,
    booking_date: str0(d['booking_date']),
    payment_method_id: num0(d['payment_method_id'], 1),
    segment_price_card_id: num0(d['segment_price_card_id']),
    latitude: str0(d['latitude']),
    longitude: str0(d['longitude']),
    drop_location: str0(d['drop_location']),
    user_address_id: num0(d['user_address_id']),
    booking_time: str0(d['booking_time'], str0(d['slot_time_text'])),
    driver_details: {
      id: d['driver_details'] && obj(d['driver_details'])['id'] != null ? num0(obj(d['driver_details'])['id']) : null,
      image: str0(d['driver_details'] ? obj(d['driver_details'])['image'] : undefined),
      first_name: str0(d['driver_details'] ? obj(d['driver_details'])['first_name'] : undefined),
      last_name: str0(d['driver_details'] ? obj(d['driver_details'])['last_name'] : undefined),
    },
    applied_promo_code: str0(d['applied_promo_code']),
  };
}

export interface HandymanSaveCartParams {
  isUpdate: boolean;
  segmentId?: number | string;
  serviceTimeSlotDetailId?: number | null;
  segmentPriceCardId?: number;
  latitude?: number;
  longitude?: number;
  dropLocation?: string;
  bookingDate?: string;
  autoAssign?: number;
  driverId?: number | null;
  serviceTypeId?: number | null;
  cartId?: number;
  serviceDetails?: Record<string, unknown>;
  paymentMethodId?: number;
  userAddressId?: number;
  promoCode?: string;
  signal?: AbortSignal;
}

export async function saveHandymanCart(client: ApiClient, params: HandymanSaveCartParams): Promise<HandymanCart> {
  const body: Record<string, unknown> = {
    is_update: params.isUpdate ? 'YES' : 'NO',
  };
  if (params.segmentId != null) body.segment_id = params.segmentId;
  if (params.serviceTimeSlotDetailId != null) body.service_time_slot_detail_id = params.serviceTimeSlotDetailId;
  if (params.segmentPriceCardId != null) body.segment_price_card_id = params.segmentPriceCardId;
  if (params.latitude != null) body.latitude = params.latitude;
  if (params.longitude != null) body.longitude = params.longitude;
  if (params.dropLocation) body.drop_location = params.dropLocation;
  if (params.bookingDate) body.booking_date = params.bookingDate;
  if (params.autoAssign != null) body.auto_assign = params.autoAssign;
  if (params.driverId != null) body.driver_id = params.driverId;
  if (params.serviceTypeId != null) body.service_type_id = params.serviceTypeId;
  if (params.cartId != null) body.cart_id = params.cartId;
  if (params.serviceDetails) body.service_details = params.serviceDetails;
  if (params.paymentMethodId != null) body.payment_method_id = params.paymentMethodId;
  if (params.userAddressId != null) body.user_address_id = params.userAddressId;
  if (params.promoCode) body.promo_code = params.promoCode;
  const envelope = await client.post<unknown>('/user/handyman/save-booking-cart', body, { scope: 'user', signal: params.signal });
  return parseHandymanCart(dataOf(envelope));
}

export async function fetchHandymanCart(client: ApiClient, params: { cartId: number | string; signal?: AbortSignal }): Promise<HandymanCart> {
  const envelope = await client.post<unknown>('/user/handyman/get-cart', { cart_id: params.cartId }, { scope: 'user', signal: params.signal });
  return parseHandymanCart(dataOf(envelope));
}

export interface HandymanDeleteCartParams {
  cartId: number | string;
  deleteType: 'CART' | 'SERVICE';
  serviceTypeId?: number | null;
  signal?: AbortSignal;
}

export async function deleteHandymanCart(client: ApiClient, params: HandymanDeleteCartParams): Promise<HandymanCart | null> {
  const body: Record<string, unknown> = { cart_id: params.cartId, delete_type: params.deleteType };
  if (params.serviceTypeId != null) body.service_type_id = params.serviceTypeId;
  const envelope = await client.post<unknown>('/user/handyman/delete-cart', body, { scope: 'user', signal: params.signal });
  const d = dataOf(envelope);
  if (Object.keys(d).length === 0 || d['cart_id'] === undefined) return null;
  return parseHandymanCart(d);
}

export async function applyHandymanPromoWeb(
  client: ApiClient,
  params: { cartId: number | string; promoCode?: string; signal?: AbortSignal },
): Promise<{ cart: HandymanCart; promo: HandymanPromoResult }> {
  const body: Record<string, unknown> = { cart_id: params.cartId };
  if (params.promoCode) body.promo_code = params.promoCode;
  const envelope = await client.post<unknown>('/user/handyman/apply-remove-promo-code-web', body, { scope: 'user', signal: params.signal });
  const d = dataOf(envelope);
  return {
    cart: parseHandymanCart(d),
    promo: {
      promo_code: str0(params.promoCode, str0(d['applied_promo_code'])),
      valid: true,
      discount_amount: num0(d['discount_amount']),
      message: 'OK',
    },
  };
}

// ---------------------------------------------------------------------------
// Confirm / orders
// ---------------------------------------------------------------------------

export interface HandymanConfirmParams {
  cartId: number | string;
  paymentMethodId: number;
  latitude?: number;
  longitude?: number;
  dropLocation?: string;
  cardId?: number | string;
  advancePaymentOfMinBill?: number;
  additionalNotes?: string;
  signal?: AbortSignal;
}

export async function confirmHandymanOrderWeb(
  client: ApiClient,
  params: HandymanConfirmParams,
): Promise<{ order_id: number; order_status: number } | null> {
  const body: Record<string, unknown> = {
    cart_id: params.cartId,
    payment_method_id: params.paymentMethodId,
    latitude: params.latitude ?? 19.076,
    longitude: params.longitude ?? 72.877,
    drop_location: params.dropLocation ?? '',
    advance_payment_of_min_bill: params.advancePaymentOfMinBill ?? 0,
  };
  if (params.cardId != null) body.card_id = params.cardId;
  if (params.additionalNotes) body.additional_notes = params.additionalNotes;
  const envelope = await client.post<unknown>('/user/handyman/confirm-order-web', body, { scope: 'user', signal: params.signal });
  const d = dataOf(envelope);
  if (d['order_id'] == null) return null;
  return { order_id: num0(d['order_id']), order_status: num0(d['order_status'], 1) };
}

export interface HandymanOrderQuery {
  type: 'SCHEDULED' | 'ONGOING' | 'PAST';
  segmentId?: number | string;
  signal?: AbortSignal;
}

function parseOrder(o: Record<string, unknown>): HandymanOrder {
  return {
    order_id: num0(o['order_id']),
    merchant_order_id: str0(o['merchant_order_id']),
    first_name: str0(o['first_name']),
    last_name: str0(o['last_name']),
    rating: str0(o['rating']),
    profile_image: str0(o['profile_image']),
    final_amount_paid: str0(o['final_amount_paid']),
    currency: str0(o['currency']),
    total_services: num0(o['total_services']),
    order_status: str0(o['order_status']),
    numeric_order_status: num0(o['numeric_order_status']),
    booking_date: str0(o['booking_date']),
    slot_time_text: str0(o['slot_time_text']),
    segment_id: num0(o['segment_id']),
    service_type: arr(o['service_type']).map((s) => ({
      id: num0(s['id']),
      name: str0(s['name']),
      amount: str0(s['amount']),
      currency: str0(s['currency']),
      price_type: num0(s['price_type'], 1),
      segment_price_card_id: num0(s['segment_price_card_id']),
    })),
    status_text: str0(o['status_text'], str0(o['order_status'])),
  };
}

export async function fetchHandymanOrders(client: ApiClient, params: HandymanOrderQuery): Promise<HandymanOrder[]> {
  const body: Record<string, unknown> = { type: params.type };
  if (params.segmentId != null) body.segment_id = params.segmentId;
  const envelope = await client.post<unknown>('/user/handyman/get-orders', body, { scope: 'user', signal: params.signal });
  return arr(envelope.data).map(parseOrder);
}

function parseOrderDetail(o: Record<string, unknown>): HandymanOrderDetail {
  return {
    order_id: num0(o['order_id']),
    merchant_order_id: str0(o['merchant_order_id']),
    first_name: str0(o['first_name']),
    last_name: str0(o['last_name']),
    rating: str0(o['rating']),
    profile_image: str0(o['profile_image']),
    phone_number: str0(o['phone_number']),
    drop_location: str0(o['drop_location']),
    drop_latitude: str0(o['drop_latitude']),
    drop_longitude: str0(o['drop_longitude']),
    currency: str0(o['currency']),
    total_services: num0(o['total_services']),
    order_status: str0(o['order_status']),
    status: num0(o['status']),
    order_otp: str0(o['order_otp']),
    segment_name: str0(o['segment_name']),
    booking_date: str0(o['booking_date']),
    slot_time_text: str0(o['slot_time_text']),
    service_type: arr(o['service_type']).map((s) => ({
      id: num0(s['id']),
      name: str0(s['name']),
      amount: str0(s['amount']),
      currency: str0(s['currency']),
      price_type: num0(s['price_type'], 1),
      segment_price_card_id: num0(s['segment_price_card_id']),
    })),
    segment_id: num0(o['segment_id']),
    payment_detail: {
      cart_amount: str0(o['payment_detail'] ? obj(o['payment_detail'])['cart_amount'] : undefined),
      dispute_settled_amount: str0(o['payment_detail'] ? obj(o['payment_detail'])['dispute_settled_amount'] : undefined),
      tax: str0(o['payment_detail'] ? obj(o['payment_detail'])['tax'] : undefined),
      final_amount_paid: str0(o['payment_detail'] ? obj(o['payment_detail'])['final_amount_paid'] : undefined),
      minimum_booking_amount: str0(o['payment_detail'] ? obj(o['payment_detail'])['minimum_booking_amount'] : undefined),
      minimum_booking_amount_payment_status: o['payment_detail'] ? obj(o['payment_detail'])['minimum_booking_amount_payment_status'] === true || obj(o['payment_detail'])['minimum_booking_amount_payment_status'] === 1 : false,
      total_pending_amount: str0(o['payment_detail'] ? obj(o['payment_detail'])['total_pending_amount'] : undefined),
      pending_amount_status: o['payment_detail'] ? obj(o['payment_detail'])['pending_amount_status'] === true || obj(o['payment_detail'])['pending_amount_status'] === 1 : false,
      pending_message: str0(o['payment_detail'] ? obj(o['payment_detail'])['pending_message'] : undefined),
      paid_status: o['payment_detail'] ? obj(o['payment_detail'])['paid_status'] === true || obj(o['payment_detail'])['paid_status'] === 1 : false,
      payment_method_id: num0(o['payment_detail'] ? obj(o['payment_detail'])['payment_method_id'] : undefined, 1),
      payment_mode: str0(o['payment_detail'] ? obj(o['payment_detail'])['payment_mode'] : undefined, 'Cash'),
      discount_amount: str0(o['payment_detail'] ? obj(o['payment_detail'])['discount_amount'] : undefined),
      additional_amount: arr(o['payment_detail'] ? obj(o['payment_detail'])['additional_amount'] : undefined).map((a) => ({
        id: num0(a['id']),
        charge_name: str0(a['charge_name']),
        charge_amount: str0(a['charge_amount']),
        status: str0(a['status']),
      })),
      custom_additional_charge: str0(o['payment_detail'] ? obj(o['payment_detail'])['custom_additional_charge'] : undefined),
    },
    cancel_reason: arr(o['cancel_reason']).map((c) => ({ id: num0(c['id']), reason: str0(c['reason']) })),
    is_rated: o['is_rated'] === true || o['is_rated'] === 1,
    arr_action: {
      cancel: o['arr_action'] ? obj(o['arr_action'])['cancel'] === true || obj(o['arr_action'])['cancel'] === 1 : false,
      pay: o['arr_action'] ? obj(o['arr_action'])['pay'] === true || obj(o['arr_action'])['pay'] === 1 : false,
      create_outstanding: str0(o['arr_action'] ? obj(o['arr_action'])['create_outstanding'] : undefined),
    },
    bidding_amount_accepted: o['bidding_amount_accepted'] != null ? str0(o['bidding_amount_accepted']) : null,
    bidding_amount: o['bidding_amount'] != null ? str0(o['bidding_amount']) : null,
    handyman_customer_details_visible: o['handyman_customer_details_visible'] === true || o['handyman_customer_details_visible'] === 1,
    current_latitude: str0(o['current_latitude']),
    current_longitude: str0(o['current_longitude']),
  };
}

export async function fetchHandymanOrderDetail(client: ApiClient, params: { orderId: number | string; signal?: AbortSignal }): Promise<HandymanOrderDetail> {
  const envelope = await client.post<unknown>('/user/handyman/get-order-detail', { order_id: params.orderId }, { scope: 'user', signal: params.signal });
  return parseOrderDetail(dataOf(envelope));
}

export async function cancelHandymanOrder(
  client: ApiClient,
  params: { orderId: number | string; cancelReasonId: number; latitude?: number; longitude?: number; signal?: AbortSignal },
): Promise<void> {
  await client.post<unknown>(
    '/user/handyman/cancel-order',
    { order_id: params.orderId, cancel_reason_id: params.cancelReasonId, latitude: params.latitude ?? 19.076, longitude: params.longitude ?? 72.877 },
    { scope: 'user', signal: params.signal },
  );
}

export async function rateHandymanProvider(
  client: ApiClient,
  params: { orderId?: number | string; providerId?: number | string; rating: number; comment?: string; signal?: AbortSignal },
): Promise<void> {
  const body: Record<string, unknown> = { rating: params.rating };
  if (params.orderId != null) body.order_id = params.orderId;
  if (params.providerId != null) body.provider_id = params.providerId;
  if (params.comment) body.comment = params.comment;
  await client.post<unknown>('/user/handyman/rate/provider', body, { scope: 'user', signal: params.signal });
}

export interface HandymanPayResult {
  success: boolean;
  payment_status?: number;
  message?: string;
}

export async function payHandymanBooking(
  client: ApiClient,
  params: { orderId: number | string; amount: number | string; paymentMethodId: number; signal?: AbortSignal },
): Promise<HandymanPayResult> {
  const envelope = await client.post<unknown>(
    '/user/handyman/booking-payment',
    { order_id: params.orderId, amount: params.amount, payment_method_id: params.paymentMethodId },
    { scope: 'user', signal: params.signal },
  );
  const d = dataOf(envelope);
  return {
    success: d['payment_status'] == null || Number(d['payment_status']) === 0 || Number(d['payment_status']) === 1 ? true : d['success'] === true,
    payment_status: d['payment_status'] != null ? num0(d['payment_status']) : undefined,
    message: str0(d['message']),
  };
}

// ---------------------------------------------------------------------------
// Bidding
// ---------------------------------------------------------------------------

function parseBid(b: Record<string, unknown>): HandymanBid {
  return {
    id: num0(b['id'], num0(b['driver_bid_id'])),
    driver_id: num0(b['driver_id']),
    first_name: str0(b['first_name']),
    last_name: str0(b['last_name']),
    profile_image: str0(b['profile_image'], str0(b['image'])),
    rating: str0(b['rating'], '0'),
    bid_amount: str0(b['bid_amount'], str0(b['amount'])),
    amount: str0(b['amount'], str0(b['bid_amount'])),
    created_at: str0(b['created_at']),
    time_text: str0(b['time_text']),
    user_offer_price: str0(b['user_offer_price']),
    status: str0(b['status']),
    numeric_status: num0(b['numeric_status'], 1),
    message: str0(b['message']),
  };
}

function parseBidOrder(o: Record<string, unknown>): HandymanBidOrder {
  return {
    id: num0(o['id'], num0(o['bid_order_id'])),
    bid_order_id: str0(o['bid_order_id']),
    service_name: str0(o['service_name']),
    category_name: str0(o['category_name']),
    description: str0(o['description']),
    work_image_one: str0(o['work_image_one']),
    work_image_two: str0(o['work_image_two']),
    work_image_three: str0(o['work_image_three']),
    work_image_four: str0(o['work_image_four']),
    final_amount: str0(o['final_amount']),
    status: str0(o['status']),
    numeric_status: num0(o['numeric_status'], 1),
    created_at: str0(o['created_at']),
    booked_at: str0(o['booked_at']),
    time_slot_text: str0(o['time_slot_text']),
    user_offer_price: str0(o['user_offer_price']),
    no_of_bids: num0(o['no_of_bids']),
    segment_id: num0(o['segment_id'], num0(o['segmentId'])),
    bids: arr(o['bids']).map(parseBid),
  };
}

export interface HandymanCreateBidOrderParams {
  segmentId?: number | string;
  serviceTypeIds?: number[];
  description?: string;
  paymentMethodId?: number;
  serviceTimeSlotDetailId?: number;
  latitude?: number;
  longitude?: number;
  dropLocation?: string;
  bookingDate?: string;
  categoryId?: number | string;
  userOfferPrice?: number | string;
  serviceDetails?: Record<string, unknown>;
  signal?: AbortSignal;
}

export async function createHandymanBidOrder(client: ApiClient, params: HandymanCreateBidOrderParams): Promise<HandymanBidOrder> {
  const body: Record<string, unknown> = {
    segment_id: params.segmentId ?? 1,
    payment_method_id: params.paymentMethodId ?? 1,
    latitude: params.latitude ?? 19.076,
    longitude: params.longitude ?? 72.877,
    drop_location: params.dropLocation ?? '',
    booking_date: params.bookingDate ?? '',
  };
  if (params.serviceTypeIds) body.service_type_id = params.serviceTypeIds;
  if (params.description) body.description = params.description;
  if (params.serviceTimeSlotDetailId != null) body.service_time_slot_detail_id = params.serviceTimeSlotDetailId;
  if (params.categoryId != null) body.category_id = params.categoryId;
  if (params.userOfferPrice != null) body.user_offer_price = params.userOfferPrice;
  if (params.serviceDetails) body.service_details = params.serviceDetails;
  const envelope = await client.post<unknown>('/user/handyman/bidding/create-order', body, { scope: 'user', signal: params.signal });
  return parseBidOrder(dataOf(envelope));
}

export async function fetchHandymanBidOrders(
  client: ApiClient,
  params: { type: 'ACTIVE' | 'ALL'; segmentId?: number | string; signal?: AbortSignal },
): Promise<HandymanBidOrder[]> {
  const body: Record<string, unknown> = { type: params.type };
  if (params.segmentId != null) body.segment_id = params.segmentId;
  const envelope = await client.post<unknown>('/user/handyman/bidding/get-orders', body, { scope: 'user', signal: params.signal });
  return arr(envelope.data).map(parseBidOrder);
}

export async function fetchHandymanBidOrderDetail(client: ApiClient, params: { orderId: number | string; signal?: AbortSignal }): Promise<HandymanBidOrder> {
  const envelope = await client.post<unknown>('/user/handyman/bidding/get-order-detail', { order_id: params.orderId }, { scope: 'user', signal: params.signal });
  return parseBidOrder(dataOf(envelope));
}

export interface HandymanAcceptBidResult {
  success: boolean;
  orderId?: number;
  message?: string;
}

export async function counterBidHandymanOrder(
  client: ApiClient,
  params: { orderId: number | string; driverBidId?: number | string; amount: number | string; signal?: AbortSignal },
): Promise<void> {
  const body: Record<string, unknown> = { order_id: params.orderId, counter_amount: params.amount };
  if (params.driverBidId != null) body.driver_bid_id = params.driverBidId;
  await client.post<unknown>('/user/handyman/bidding/counter-bid-order', body, { scope: 'user', signal: params.signal });
}

export async function acceptHandymanBid(
  client: ApiClient,
  params: { orderId: number | string; driverId?: number | string; promoCode?: string; signal?: AbortSignal },
): Promise<HandymanAcceptBidResult> {
  const body: Record<string, unknown> = { order_id: params.orderId };
  if (params.driverId != null) body.driver_id = params.driverId;
  if (params.promoCode) body.promo_code = params.promoCode;
  const envelope = await client.post<unknown>('/user/handyman/bidding/accept-order', body, { scope: 'user', signal: params.signal });
  const d = dataOf(envelope);
  return {
    success: d['order_id'] != null || d['success'] === true,
    orderId: d['order_id'] != null ? num0(d['order_id']) : undefined,
    message: str0(d['message']),
  };
}

export async function cancelDeleteHandymanBidOrder(
  client: ApiClient,
  params: { orderId: number | string; action: 'CANCEL' | 'DELETE'; signal?: AbortSignal },
): Promise<void> {
  await client.post<unknown>(
    '/user/handyman/bidding/cancel-or-delete-order',
    { order_id: params.orderId, action: params.action },
    { scope: 'user', signal: params.signal },
  );
}