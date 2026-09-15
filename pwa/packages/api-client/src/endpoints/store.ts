import type { ApiClient } from '../client';
import type { ApiEnvelope } from '../envelope';

// ---------------------------------------------------------------------------
// Phase 8 — Store ordering (Grocery / Pharmacy / Generic).
// Mirror of Api\FoodController:ShopController behaviour via the same engine,
// parameterized by store segment. sub_group_for_app == 2, PRESCRIPTION for
// pharmacy and weight units. All routes are prefixed /user/store/*.
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
  const d = obj(envelope.data);
  return d;
}

// ---------------------------------------------------------------------------
// Store list / details / search
// ---------------------------------------------------------------------------

export type StoreSlug = 'grocery' | 'pharmacy' | 'store';

export interface Store {
  id: number;
  full_name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  review_count: number;
  delivery_time_min: number;
  delivery_time_max: number;
  delivery_fee: number;
  minimum_order: number;
  is_open: number;
  cuisines: string;
  business_logo: string;
  is_favourite: number;
  sub_group_for_app: number;
  slug: StoreSlug;
  use_time_slots: number;
  opening_time?: string;
  closing_time?: string;
}

export interface StoreServiceOption {
  id: number;
  name: string;
  price: number;
}

export interface StoreProduct {
  id: number;
  product_name: string;
  description: string;
  price: number;
  category_id: number;
  store_id: number;
  is_veg: number;
  is_available: number;
  image: string;
  weight: string;
  variants: StoreServiceOption[];
  options: (StoreServiceOption & { type?: string })[];
}

export interface StoreCategory {
  id: number;
  category_name: string;
  sequence: number;
}

export interface StoreTimeSlot {
  id: number;
  label: string;
  date: string;
  time: string;
}

export interface StoreDetails {
  store: Store | null;
  categories: StoreCategory[];
  products: StoreProduct[];
  time_slots: StoreTimeSlot[];
  use_time_slots: number;
}

export interface StoreSearchResult {
  products: StoreProduct[];
  categories: StoreCategory[];
  keyword: string;
}

function parseStore(record: Record<string, unknown>): Store {
  return {
    id: num0(record['id']),
    full_name: str0(record['full_name']),
    address: str0(record['address']),
    latitude: num0(record['latitude']),
    longitude: num0(record['longitude']),
    rating: num0(record['rating']),
    review_count: num0(record['review_count']),
    delivery_time_min: num0(record['delivery_time_min']),
    delivery_time_max: num0(record['delivery_time_max']),
    delivery_fee: num0(record['delivery_fee']),
    minimum_order: num0(record['minimum_order']),
    is_open: num0(record['is_open'], 1),
    cuisines: str0(record['cuisines']),
    business_logo: str0(record['business_logo']),
    is_favourite: num0(record['is_favourite']),
    sub_group_for_app: num0(record['sub_group_for_app'], 2),
    slug: (str(record['slug']) as StoreSlug) ?? 'grocery',
    use_time_slots: num0(record['use_time_slots']),
    opening_time: str(record['opening_time']),
    closing_time: str(record['closing_time']),
  };
}

function parseProduct(record: Record<string, unknown>): StoreProduct {
  return {
    id: num0(record['id']),
    product_name: str0(record['product_name']),
    description: str0(record['description']),
    price: num0(record['price']),
    category_id: num0(record['category_id']),
    store_id: num0(record['store_id']),
    is_veg: num0(record['is_veg'], 1),
    is_available: num0(record['is_available'], 1),
    image: str0(record['image']),
    weight: str0(record['weight']),
    variants: arr(record['variants']).map((v) => ({ id: num0(v['id']), name: str0(v['name']), price: num0(v['price']) })),
    options: arr(record['options']).map((o) => ({ id: num0(o['id']), name: str0(o['name']), price: num0(o['price']), type: str(o['type']) })),
  };
}

function parseCategory(record: Record<string, unknown>): StoreCategory {
  return { id: num0(record['id']), category_name: str0(record['category_name']), sequence: num0(record['sequence']) };
}

function parseSlot(record: Record<string, unknown>): StoreTimeSlot {
  return { id: num0(record['id']), label: str0(record['label']), date: str0(record['date']), time: str0(record['time']) };
}

function parseDetails(d: Record<string, unknown>): StoreDetails {
  const bs = d['business_segment'];
  return {
    store: obj(bs).id !== undefined ? parseStore(obj(bs)) : null,
    categories: (Array.isArray(d['categories']) ? d['categories'] : []).map(parseCategory),
    products: (Array.isArray(d['products']) ? d['products'] : []).map((p) => parseProduct(obj(p))),
    time_slots: (Array.isArray(d['time_slots']) ? d['time_slots'] : []).map(parseSlot),
    use_time_slots: num0(d['use_time_slots'], (Array.isArray(d['time_slots']) ? d['time_slots'] : []).length > 0 ? 1 : 0),
  };
}

export async function fetchStores(
  client: ApiClient,
  params: { slug: 'grocery' | 'pharmacy' | 'store' | string; signal?: AbortSignal } = { slug: 'grocery' },
): Promise<Store[]> {
  const envelope = await client.post<unknown>('/user/store/store-list', { slug: params.slug }, { scope: 'user', signal: params.signal });
  const d = dataOf(envelope);
  const records = Array.isArray(d['business_segments']) ? d['business_segments'] : (Array.isArray(d) ? d : []);
  return records.map((r) => parseStore(obj(r)));
}

export async function fetchStoreDetails(
  client: ApiClient,
  params: { storeId: number | string; signal?: AbortSignal },
): Promise<StoreDetails> {
  const envelope = await client.post<unknown>('/user/store/store-details', { business_segment_id: params.storeId }, { scope: 'user', signal: params.signal });
  return parseDetails(dataOf(envelope));
}

export async function searchStoreProducts(
  client: ApiClient,
  params: { storeId: number | string; keyword: string; signal?: AbortSignal },
): Promise<StoreSearchResult> {
  const envelope = await client.post<unknown>('/user/store/search-store-products', { business_segment_id: params.storeId, keyword: params.keyword }, { scope: 'user', signal: params.signal });
  const d = dataOf(envelope);
  return {
    products: (Array.isArray(d['products']) ? d['products'] : []).map((p) => parseProduct(obj(p))),
    categories: (Array.isArray(d['categories']) ? d['categories'] : []).map(parseCategory),
    keyword: str0(d['keyword'], params.keyword),
  };
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export interface StoreCartItem {
  cart_id: string;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  variant_id: number | null;
  variant_name: string;
  option_ids: number[];
  total_amount: number;
  is_veg: number;
  image: string;
  store_id: number;
  weight: string;
}

export interface StoreCart {
  products: StoreCartItem[];
  total_items: number;
}

function parseCartItem(record: Record<string, unknown>): StoreCartItem {
  return {
    cart_id: String(record['cart_id'] ?? ''),
    product_id: num0(record['product_id']),
    product_name: str0(record['product_name']),
    price: num0(record['price']),
    quantity: num0(record['quantity'], 1),
    variant_id: record['variant_id'] != null ? num0(record['variant_id']) : null,
    variant_name: str0(record['variant_name']),
    option_ids: Array.isArray(record['option_ids']) ? (record['option_ids'] as number[]) : [],
    total_amount: num0(record['total_amount'], num0(record['price'], 0) * num0(record['quantity'], 1)),
    is_veg: num0(record['is_veg'], 1),
    image: str0(record['image']),
    store_id: num0(record['store_id']),
    weight: str0(record['weight']),
  };
}

function parseCart(data: Record<string, unknown>): StoreCart {
  return {
    products: (Array.isArray(data['products']) ? data['products'] : (Array.isArray(data) ? data : [])).map((p) => parseCartItem(obj(p))),
    total_items: num0(data['total_items'], (Array.isArray(data['products']) ? data['products'] : []).length),
  };
}

export async function fetchStoreCart(client: ApiClient, opts?: { signal?: AbortSignal }): Promise<StoreCart> {
  const envelope = await client.post<unknown>('/user/store/cart', {}, { scope: 'user', signal: opts?.signal });
  return parseCart(dataOf(envelope));
}

export async function addToStoreCart(
  client: ApiClient,
  params: { productId: number | string; quantity?: number; variantId?: number | string; optionIds?: number[]; signal?: AbortSignal },
): Promise<StoreCart> {
  const body: Record<string, unknown> = {
    product_id: params.productId,
    quantity: params.quantity ?? 1,
  };
  if (params.variantId) body.variant_id = params.variantId;
  if (params.optionIds && params.optionIds.length) body.option_ids = params.optionIds;
  const envelope = await client.post<unknown>('/user/store/cart/add', body, { scope: 'user', signal: params.signal });
  return parseCart(dataOf(envelope));
}

export async function updateStoreCart(
  client: ApiClient,
  params: { cartId: string; quantity: number; signal?: AbortSignal },
): Promise<StoreCart> {
  const envelope = await client.post<unknown>('/user/store/cart/update', { cart_id: params.cartId, quantity: params.quantity }, { scope: 'user', signal: params.signal });
  return parseCart(dataOf(envelope));
}

export async function removeFromStoreCart(
  client: ApiClient,
  params: { cartId: string; signal?: AbortSignal },
): Promise<StoreCart> {
  const envelope = await client.post<unknown>('/user/store/cart/remove', { cart_id: params.cartId }, { scope: 'user', signal: params.signal });
  return parseCart(dataOf(envelope));
}

export async function clearStoreCart(client: ApiClient, opts?: { signal?: AbortSignal }): Promise<StoreCart> {
  const envelope = await client.post<unknown>('/user/store/cart/clear', {}, { scope: 'user', signal: opts?.signal });
  return parseCart(dataOf(envelope));
}

// ---------------------------------------------------------------------------
// Promo / checkout / order
// ---------------------------------------------------------------------------

export interface StorePromoResult {
  promo_code: string;
  valid: boolean;
  discount_type: string;
  discount_value: number;
  max_discount: number;
  min_order: number;
  message: string;
}

export async function applyStorePromo(
  client: ApiClient,
  params: { promoCode: string; signal?: AbortSignal },
): Promise<StorePromoResult> {
  const envelope = await client.post<unknown>('/user/store/apply-promo', { promo_code: params.promoCode }, { scope: 'user', signal: params.signal });
  const d = dataOf(envelope);
  return {
    promo_code: str0(d['promo_code'], params.promoCode),
    valid: true,
    discount_type: str0(d['discount_type'], 'flat'),
    discount_value: num0(d['discount_value']),
    max_discount: num0(d['max_discount']),
    min_order: num0(d['min_order']),
    message: str0(d['message']),
  };
}

export interface StoreCheckoutResult {
  id: string;
  store_id: number;
  store_name: string;
  products: StoreCartItem[];
  subtotal: number;
  delivery_fee: number;
  tax: number;
  discount_amount: number;
  promo_code: string;
  total_amount: number;
  delivery_mode: number;
  payment_mode: string;
  address: string;
  latitude: number;
  longitude: number;
  minimum_order: number;
  time_slot_id: number;
  time_slot_label: string;
  prescription_image: string;
  pharmacy: boolean;
  use_time_slots: number;
  payment_methods: { id: string; name: string; card_id: string | null }[];
}

export interface StoreCheckoutParams {
  storeId: number | string;
  deliveryMode: number;
  paymentMode: string;
  address: string;
  latitude?: number;
  longitude?: number;
  promoCode?: string;
  timeSlotId?: number;
  prescriptionImage?: string;
  signal?: AbortSignal;
}

function parseStoreCheckout(d: Record<string, unknown>, fallbackId = ''): StoreCheckoutResult {
  return {
    id: str0(d['id'], fallbackId),
    store_id: num0(d['store_id']),
    store_name: str0(d['store_name']),
    products: (Array.isArray(d['products']) ? d['products'] : []).map((p) => parseCartItem(obj(p))),
    subtotal: num0(d['subtotal']),
    delivery_fee: num0(d['delivery_fee']),
    tax: num0(d['tax']),
    discount_amount: num0(d['discount_amount']),
    promo_code: str0(d['promo_code']),
    total_amount: num0(d['total_amount']),
    delivery_mode: num0(d['delivery_mode'], 1),
    payment_mode: String(d['payment_mode'] ?? '1'),
    address: str0(d['address']),
    latitude: num0(d['latitude']),
    longitude: num0(d['longitude']),
    minimum_order: num0(d['minimum_order']),
    time_slot_id: num0(d['time_slot_id']),
    time_slot_label: str0(d['time_slot_label']),
    prescription_image: str0(d['prescription_image']),
    pharmacy: d['pharmacy'] === true || d['pharmacy'] === 1,
    use_time_slots: num0(d['use_time_slots']),
    payment_methods: (Array.isArray(d['payment_methods']) ? d['payment_methods'] : [{ id: '1', name: 'Cash', card_id: null }, { id: '2', name: 'Wallet', card_id: null }]).map((pm) => ({
      id: str0(pm['id']),
      name: str0(pm['name']),
      card_id: str(pm['card_id']) ?? null,
    })),
  };
}

export async function fetchStoreCheckout(
  client: ApiClient,
  params: StoreCheckoutParams,
): Promise<StoreCheckoutResult> {
  const body: Record<string, unknown> = {
    business_segment_id: params.storeId,
    delivery_mode: params.deliveryMode,
    payment_mode: params.paymentMode,
    address: params.address,
  };
  if (params.latitude != null) body.latitude = params.latitude;
  if (params.longitude != null) body.longitude = params.longitude;
  if (params.promoCode) body.promo_code = params.promoCode;
  if (params.timeSlotId) body.time_slot_id = params.timeSlotId;
  if (params.prescriptionImage) body.prescription_image = params.prescriptionImage;
  const envelope = await client.post<unknown>('/user/store/checkout', body, { scope: 'user', signal: params.signal });
  return parseStoreCheckout(dataOf(envelope));
}

export interface StoreOrder {
  id: string;
  order_number: number;
  order_status: number;
  store_id: number;
  store_name: string;
  full_name: string;
  store_address: string;
  products: StoreCartItem[];
  subtotal: number;
  delivery_fee: number;
  tax: number;
  discount_amount: number;
  promo_code: string;
  total_amount: number;
  delivery_mode: number;
  payment_mode: string;
  payment_mode_name: string;
  address: string;
  latitude: number;
  longitude: number;
  created_at: number;
  cancel_able: boolean;
  rate: { rating: number; comment: string } | null;
  status_text: string;
  ticket: number;
  min_order: number;
  time_slot_id: number;
  time_slot_label: string;
  prescription_image: string;
  pharmacy: boolean;
}

export interface StorePlaceOrderParams {
  storeId?: number | string;
  checkoutId?: string;
  deliveryMode: number;
  paymentMode: string;
  address: string;
  latitude?: number;
  longitude?: number;
  timeSlotId?: number;
  prescriptionImage?: string;
  signal?: AbortSignal;
}

function parseStoreOrder(d: Record<string, unknown>): StoreOrder {
  return {
    id: str0(d['id']),
    order_number: num0(d['order_number']),
    order_status: num0(d['order_status'], 1),
    store_id: num0(d['store_id']),
    store_name: str0(d['store_name']),
    full_name: str0(d['full_name'], str0(d['store_name'])),
    store_address: str0(d['store_address']),
    products: (Array.isArray(d['products']) ? d['products'] : []).map((p) => parseCartItem(obj(p))),
    subtotal: num0(d['subtotal']),
    delivery_fee: num0(d['delivery_fee']),
    tax: num0(d['tax']),
    discount_amount: num0(d['discount_amount']),
    promo_code: str0(d['promo_code']),
    total_amount: num0(d['total_amount']),
    delivery_mode: num0(d['delivery_mode'], 1),
    payment_mode: str0(d['payment_mode'], '1'),
    payment_mode_name: str0(d['payment_mode_name'], d['payment_mode'] === '2' ? 'Wallet' : 'Cash'),
    address: str0(d['address']),
    latitude: num0(d['latitude']),
    longitude: num0(d['longitude']),
    created_at: num0(d['created_at'], Date.now()),
    cancel_able: d['cancel_able'] === true || d['cancel_able'] === 1 || d['cancel_able'] === '1',
    rate: d['rate'] && typeof d['rate'] === 'object'
      ? { rating: num0(obj(d['rate'])['rating']), comment: str0(obj(d['rate'])['comment']) }
      : null,
    status_text: str0(d['status_text'], 'Placed'),
    ticket: num0(d['ticket']),
    min_order: num0(d['min_order']),
    time_slot_id: num0(d['time_slot_id']),
    time_slot_label: str0(d['time_slot_label']),
    prescription_image: str0(d['prescription_image']),
    pharmacy: d['pharmacy'] === true || d['pharmacy'] === 1,
  };
}

export async function placeStoreOrder(
  client: ApiClient,
  params: StorePlaceOrderParams,
): Promise<StoreOrder> {
  const body: Record<string, unknown> = {
    delivery_mode: params.deliveryMode,
    payment_mode: params.paymentMode,
    address: params.address,
  };
  if (params.storeId != null) body.business_segment_id = params.storeId;
  if (params.checkoutId) body.checkout_id = params.checkoutId;
  if (params.latitude != null) body.latitude = params.latitude;
  if (params.longitude != null) body.longitude = params.longitude;
  if (params.timeSlotId) body.time_slot_id = params.timeSlotId;
  if (params.prescriptionImage) body.prescription_image = params.prescriptionImage;
  const envelope = await client.post<unknown>('/user/store/place-order', body, { scope: 'user', signal: params.signal });
  const d = dataOf(envelope);
  if (!d['id']) {
    return {
      id: str0(d['order_id'], ''),
      order_number: num0(d['order_number']),
      order_status: num0(d['order_status'], 1),
      store_id: 0,
      store_name: '',
      full_name: '',
      store_address: '',
      products: [],
      subtotal: 0,
      delivery_fee: 0,
      tax: 0,
      discount_amount: 0,
      promo_code: '',
      total_amount: 0,
      delivery_mode: params.deliveryMode,
      payment_mode: params.paymentMode,
      payment_mode_name: params.paymentMode === '2' ? 'Wallet' : 'Cash',
      address: params.address,
      latitude: num0(params.latitude),
      longitude: num0(params.longitude),
      created_at: Date.now(),
      cancel_able: true,
      rate: null,
      status_text: 'Placed',
      ticket: 0,
      min_order: 0,
      time_slot_id: 0,
      time_slot_label: '',
      prescription_image: params.prescriptionImage ?? '',
      pharmacy: false,
    };
  }
  return parseStoreOrder(d);
}

export async function fetchStoreOrderDetail(
  client: ApiClient,
  params: { orderId: string; signal?: AbortSignal },
): Promise<StoreOrder | null> {
  const envelope = await client.post<unknown>('/user/store/order-detail', { order_id: params.orderId }, { scope: 'user', signal: params.signal });
  const d = dataOf(envelope);
  if (!d || d['id'] === undefined) return null;
  return parseStoreOrder(d);
}

export async function fetchStoreOrders(
  client: ApiClient,
  params: { status?: 'ACTIVE' | 'PAST'; signal?: AbortSignal } = {},
): Promise<StoreOrder[]> {
  const body: Record<string, unknown> = {};
  if (params.status) body.status = params.status;
  const envelope = await client.post<unknown>('/user/store/orders', body, { scope: 'user', signal: params.signal });
  const d = dataOf(envelope);
  const records = Array.isArray(d) ? d : (Array.isArray(d['orders']) ? d['orders'] : []);
  return records.map((r) => parseStoreOrder(obj(r)));
}

export async function cancelStoreOrder(
  client: ApiClient,
  params: { orderId: string; cancelledBy?: 'user' | 'store'; signal?: AbortSignal },
): Promise<{ id: string; order_status: number }> {
  const envelope = await client.post<unknown>('/user/store/cancel', { order_id: params.orderId, cancelled_by: params.cancelledBy ?? 'user' }, { scope: 'user', signal: params.signal });
  const d = dataOf(envelope);
  return { id: str0(d['id'], params.orderId), order_status: num0(d['order_status']) };
}

export async function trackStoreOrder(
  client: ApiClient,
  params: { orderId: string; signal?: AbortSignal },
): Promise<StoreOrder | null> {
  const envelope = await client.post<unknown>('/user/store/track', { order_id: params.orderId }, { scope: 'user', signal: params.signal });
  const d = dataOf(envelope);
  if (!d || d['id'] === undefined) return null;
  return parseStoreOrder(d);
}

export async function rateStoreOrder(
  client: ApiClient,
  params: { orderId: string; rating: number; comment?: string; signal?: AbortSignal },
): Promise<boolean> {
  const body: Record<string, unknown> = { order_id: params.orderId, rating: params.rating };
  if (params.comment) body.comment = params.comment;
  await client.post<unknown>('/user/store/rate', body, { scope: 'user', signal: params.signal });
  return true;
}

export async function reorderStore(
  client: ApiClient,
  params: { orderId: string; signal?: AbortSignal },
): Promise<StoreCart> {
  const envelope = await client.post<unknown>('/user/store/reorder', { order_id: params.orderId }, { scope: 'user', signal: params.signal });
  return parseCart(dataOf(envelope));
}

export async function favouriteStoreSegment(
  client: ApiClient,
  params: { businessSegmentId: number | string; signal?: AbortSignal },
): Promise<boolean> {
  await client.post<unknown>('/user/favourite-business-segment', { business_segment_id: params.businessSegmentId }, { scope: 'user', signal: params.signal });
  return true;
}

// ---------------------------------------------------------------------------
// Chat with store
// ---------------------------------------------------------------------------

export interface StoreChatMessage {
  message: string;
  sender: 'USER' | 'BUSINESS_SEGMENT';
  timestamp: number;
  username?: string;
}

export interface StoreChatHistory {
  user_name: string;
  user_image: string;
  chat: StoreChatMessage[];
}

export async function fetchStoreChatHistory(
  client: ApiClient,
  params: { storeId: number | string; signal?: AbortSignal },
): Promise<StoreChatHistory> {
  const envelope = await client.post<unknown>('/user/store/chat', { business_segment_id: params.storeId }, { scope: 'user', signal: params.signal });
  const d = dataOf(envelope);
  return {
    user_name: str0(d['user_name']),
    user_image: str0(d['user_image']),
    chat: (Array.isArray(d['chat']) ? d['chat'] : []).map((m) => ({
      message: str0(m['message']),
      sender: m['sender'] === 'BUSINESS_SEGMENT' ? 'BUSINESS_SEGMENT' : 'USER',
      timestamp: num0(m['timestamp']),
      username: str(m['username']),
    })),
  };
}

export async function sendStoreChatMessage(
  client: ApiClient,
  params: { storeId: number | string; message: string; signal?: AbortSignal },
): Promise<boolean> {
  await client.post<unknown>('/user/store/chat/send', { business_segment_id: params.storeId, message: params.message }, { scope: 'user', signal: params.signal });
  return true;
}
