import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ALL_COUNTRIES } from '@fixcycle/config';
import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Fixcycle dev mock API Ã¢â‚¬â€ serves realistic fixtures for the whole ride flow so
// the PWA is previewable end-to-end offline (no Laravel backend required).
//
// Wired via apps/user/.env.local: NEXT_PUBLIC_API_BASE=/api/mock
// All ApiClient calls (POST /api/mock/...) land here. Response bodies mirror
// the exact envelopes/field names the api-client parsers expect.
// ---------------------------------------------------------------------------

interface Ok {
  version: string;
  result: string;
  message: string;
  data: unknown;
  time: number;
}

function ok(data: unknown, message = 'OK'): Ok {
  return { version: '1.0', result: '1', message, data, time: Date.now() };
}

function fail(data: unknown = {}, message = 'Not implemented'): Ok {
  return { version: '1.0', result: '0', message, data, time: Date.now() };
}

interface CheckoutRef {
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  pickupName: string;
  dropName: string;
  segmentId: string | number;
  serviceType: string | number;
  vehicleType: string | number;
  vehicleName: string;
  promoApplied: boolean;
}

interface Booking {
  id: string;
  checkoutId: string;
  createdAt: number;
  segmentId: string | number;
  amount: number;
}

interface Phase12Data {
  sosContacts: { id: string; name: string; number: string }[];
  sosContactSeq: number;
  favouriteDrivers: { driver_id: string; first_name: string; last_name: string; phone_number: string; rating: string }[];
  favouriteLocations: { id: string; location_name: string; address: string; latitude: number; longitude: number }[];
  favLocSeq: number;
  familyMembers: { id: string; name: string; phone: string; email: string; relation: string }[];
  familySeq: number;
  walletBalance: number;
  walletTxns: { transaction_name: string; type: string; amount: string; date: string; value_color: string; description: string }[];
  cards: { id: string; last_four: string; brand: string; name_on_card: string; is_default: number }[];
  cardSeq: number;
  cashouts: { id: string; amount: string; status: string; created_at: string; payment_method_name: string }[];
  cashoutSeq: number;
  docs: { id: number; document_id: number; document_number: string; name: string; expiry_date: string; status: string }[];
  docSeq: number;
  chatMessages: { booking_id: string; messages: { id: string; message: string; sender: string; sender_type: string; sender_name: string; created_at: string }[] }[];
  chatSeq: number;
  supportThreads: { id: string; subject: string; message: string; status: string; created_at: string }[];
  supportSeq: number;
  rewardPoints: number;
  rewardGifts: { id: string; name: string; points_required: number; description: string; image: string }[];
  rewardHistory: { id: string; points: number; action: string; date: string; gift_name: string }[];
  subscriptions: { id: string; name: string; price: number; duration: string; description: string }[];
  activeSubscription: { id: string; package_id: string; name: string; start_date: string; end_date: string } | null;
  referralCode: string;
}

interface MockState {
  checkouts: Map<string, CheckoutRef>;
  bookings: Map<string, Booking>;
  checkoutSeq: number;
  bookingSeq: number;
  handymanCarts: Map<string, HmCart>;
  handymanOrders: HmOrder[];
  handymanBidOrders: HmBidOrder[];
  handymanOrderSeq: number;
  handymanBidSeq: number;
  laundryCarts: Map<number, LdCart>;
  laundryOrders: LdOrder[];
  laundryOrderSeq: number;
  busBookings: BusBookingMock[];
  busBookingSeq: number;
  carpoolOffers: CarpoolRideMock[];
  carpoolTaken: CarpoolTakenMock[];
  carpoolOfferSeq: number;
  carpoolTakenSeq: number;
  phase12: Phase12Data;
}

// Next.js `next start` does NOT share module-level state between route-handler
// requests (each request gets an isolated module instance). `globalThis` IS
// shared within the server process, so the in-memory booking state lives there
// to survive across the checkout -> confirm -> tracking calls of one ride flow.
const g = globalThis as unknown as { __fixcycleMock?: MockState };

function state(): MockState {
  if (!g.__fixcycleMock) {
    g.__fixcycleMock = {
      checkouts: new Map<string, CheckoutRef>(),
      bookings: new Map<string, Booking>(),
      checkoutSeq: 1000,
      bookingSeq: 5000,
      handymanCarts: new Map<string, HmCart>(),
      handymanOrders: [],
      handymanBidOrders: [],
      handymanOrderSeq: 9013,
      handymanBidSeq: 1002,
      laundryCarts: new Map<number, LdCart>(),
      laundryOrders: [],
      laundryOrderSeq: 8021,
      busBookings: [],
      busBookingSeq: 6031,
      carpoolOffers: [],
      carpoolTaken: [],
      carpoolOfferSeq: 901,
      carpoolTakenSeq: 9501,
      phase12: {
        sosContacts: [
          { id: 's1', name: 'Mom', number: '+91 98765 43211' },
          { id: 's2', name: 'Emergency', number: '112' },
        ],
        sosContactSeq: 3,
        favouriteDrivers: [],
        favouriteLocations: [
          { id: 'fl1', location_name: 'Home', address: '12 MG Road, Mumbai', latitude: 19.076, longitude: 72.877 },
        ],
        favLocSeq: 2,
        familyMembers: [
          { id: 'fm1', name: 'Asha', phone: '+91 98765 11111', email: '', relation: 'Spouse' },
        ],
        familySeq: 2,
      walletBalance: 0,      walletTxns: [],
        cards: [
          { id: 'c1', last_four: '4242', brand: 'visa', name_on_card: 'Guest User', is_default: 1 },
        ],
        cardSeq: 2,
        cashouts: [],
        cashoutSeq: 1,
        docs: [
          { id: 1, document_id: 1, document_number: 'LIC-12345', name: 'Driving License', expiry_date: '2028-06-30', status: 'approved' },
        ],
        docSeq: 2,
        chatMessages: [
          {
            booking_id: 'general',
            messages: [
              { id: 'm1', message: 'Hi! How can we help you today?', sender: 'ADMIN', sender_type: 'ADMIN', sender_name: 'Fixcycle Support', created_at: '2026-03-10 09:00:00' },
              { id: 'm2', message: 'My last ride receipt looks incorrect.', sender: 'USER', sender_type: 'USER', sender_name: 'You', created_at: '2026-03-10 09:05:00' },
            ],
          },
        ],
        chatSeq: 3,
        supportThreads: [
          { id: 't1', subject: 'Welcome', message: 'How can we help you today?', status: 'RESOLVED', created_at: '2026-03-12 10:00:00' },
        ],
        supportSeq: 2,
        rewardPoints: 750,
        rewardGifts: [
          { id: 'rg1', name: 'Free Ride Discount', points_required: 500, description: 'K50 off your next ride', image: '' },
          { id: 'rg2', name: 'Coffee Voucher', points_required: 200, description: 'Free coffee at select outlets', image: '' },
        ],
        rewardHistory: [
          { id: 'rh1', points: 100, action: 'earned', date: '2026-03-15', gift_name: 'Ride completed' },
          { id: 'rh2', points: 50, action: 'earned', date: '2026-03-17', gift_name: 'Referral bonus' },
        ],
        subscriptions: [
          { id: 'sub1', name: 'Gold Monthly', price: 299, duration: '30 days', description: 'Unlimited free rides under K100 + priority support' },
          { id: 'sub2', name: 'Silver Weekly', price: 99, duration: '7 days', description: '3 free rides under K80' },
        ],
        activeSubscription: null,
        referralCode: 'GUEST2026',
      },
    };
  }
  return g.__fixcycleMock as MockState;
}

const CURRENCY = 'K';

const historyBookings = [
  {
    id: 'BK-5012',
    segment_id: 1,
    segment_name: 'Ride',
    service_type: 'Sedan',
    pickup_address: '12 MG Road, Mumbai',
    drop_address: 'Bandra West, Mumbai',
    booking_date: '2026-03-18 10:30:00',
    booking_status: 4,
    booking_status_label: 'completed',
    total_amount: '185',
    currency: CURRENCY,
    driver_name: 'Ravi Kumar',
    vehicle_type_name: 'Sedan',
    vehicle_number: 'MH-01-AB-1234',
    vehicle_color: 'White',
    rating: 5,
  },
  {
    id: 'BK-5020',
    segment_id: 4,
    segment_name: 'Delivery',
    service_type: 'Parcel',
    pickup_address: 'Pizza Hut, Andheri',
    drop_address: 'Office, BKC',
    booking_date: '2026-03-17 14:00:00',
    booking_status: 4,
    booking_status_label: 'completed',
    total_amount: '120',
    currency: CURRENCY,
    driver_name: 'Sara Ali',
    vehicle_type_name: 'Bike',
    vehicle_number: 'MH-02-CD-5678',
    vehicle_color: 'Black',
    rating: 4,
  },
  {
    id: 'BK-5031',
    segment_id: 1,
    segment_name: 'Ride',
    service_type: 'Mini',
    pickup_address: 'Airport T2',
    drop_address: 'Colaba, Mumbai',
    booking_date: '2026-03-19 08:15:00',
    booking_status: 2,
    booking_status_label: 'ongoing',
    total_amount: '0',
    currency: CURRENCY,
    driver_name: 'Amit Shah',
    vehicle_type_name: 'Mini',
    vehicle_number: 'MH-03-EF-9012',
    vehicle_color: 'Blue',
  },
];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function interpolate(aLat: number, aLng: number, bLat: number, bLng: number, t: number): { lat: number; lng: number } {
  const c = Math.max(0, Math.min(1, t));
  return { lat: aLat + (bLat - aLat) * c, lng: aLng + (bLng - aLng) * c };
}

// Encode a few interpolated points as a Google-encoded polyline string.
function encodePolyline(points: { lat: number; lng: number }[]): string {
  let result = '';
  let prevLat = 0;
  let prevLng = 0;
  for (const p of points) {
    const lat = Math.round(p.lat * 1e5);
    const lng = Math.round(p.lng * 1e5);
    result += encodeSigned(lat - prevLat);
    result += encodeSigned(lng - prevLng);
    prevLat = lat;
    prevLng = lng;
  }
  return result;
}

function encodeSigned(value: number): string {
  let shifted = value < 0 ? ~(value << 1) : value << 1;
  let output = '';
  while (shifted >= 0x20) {
    output += String.fromCharCode((0x20 | (shifted & 0x1f)) + 63);
    shifted >>= 5;
  }
  output += String.fromCharCode(shifted + 63);
  return output;
}

function polylineFor(ref: CheckoutRef, progress: number): string {
  const points: { lat: number; lng: number }[] = [];
  const steps = 6;
  for (let i = 0; i <= steps; i += 1) {
    points.push(interpolate(ref.pickupLat, ref.pickupLng, ref.dropLat, ref.dropLng, i / steps));
  }
  void progress;
  return encodePolyline(points);
}

// Booking lifecycle by elapsed seconds since creation.
function bookingStatusAt(booking: Booking): { status: string; progress: number } {
  const el = (Date.now() - booking.createdAt) / 1000;
  if (el < 12) return { status: '1001', progress: 0 };
  if (el < 20) return { status: '1002', progress: 0.2 };
  if (el < 28) return { status: '1003', progress: 0.4 };
  if (el < 44) return { status: '1004', progress: 0.6 };
  return { status: '1005', progress: 1 };
}

function getCheckoutRef(id: string): CheckoutRef | null {
  return state().checkouts.get(id) ?? null;
}

function checkoutDate(ref: CheckoutRef): Record<string, unknown> {
  const base = 8.0;
  const distance = ref.dropName.length > 0 ? 3.4 : 2.4;
  const fare = round2(base + distance * 12);
  const promo = ref.promoApplied ? '-K40.00' : 'K0.00';
  const afterPromo = ref.promoApplied ? round2(fare - 40) : fare;
  return {
    id: ref.segmentId,
    segment_id: ref.segmentId,
    service_type_id: ref.serviceType,
    vehicle_type_id: ref.vehicleType,
    total_drop_location: 1,
    number_of_rider: 1,
    payment_method_id: 1,
    card_id: null,
    pickup_latitude: ref.pickupLat,
    pickup_longitude: ref.pickupLng,
    pickup_location: ref.pickupName,
    drop_latitude: ref.dropLat,
    drop_longitude: ref.dropLng,
    drop_location: ref.dropName,
    waypoints: [],
    map_image: '',
    estimate_distance: `${distance.toFixed(1)}`,
    estimate_time: '14',
    estimate_driver_distance: '1.2',
    estimate_driver_time: '5',
    booking_type: 1,
    vehicleTypeName: ref.vehicleName,
    vehicleTypeImage: '',
    SelectedPaymentMethod: { id: 1, name: 'Cash', card_id: null, action: true, icon: '', message: '' },
    estimate_receipt: [
      { parameterType: 'text', amount: `${CURRENCY} ${base.toFixed(2)}`, type: 'base', code: 'base_fare', description: 'Base fare' },
      { parameterType: 'text', amount: `${CURRENCY} ${round2(distance * 12).toFixed(2)}`, type: 'distance', code: 'distance_fare', description: 'Distance fare' },
      { parameterType: 'text', amount: `${CURRENCY} 2.00`, type: 'tax', code: 'tax', description: 'Service tax' },
    ],
    promo_heading: 'Apply promo',
    estimates_header_text: 'Fare estimate',
    estimates_arrive_header_text: 'Driver is on the way',
    estimate_bill: `${CURRENCY} ${afterPromo.toFixed(2)}`,
    estimate_bill_without_format: afterPromo,
    promo_code: ref.promoApplied ? 'FIX10' : undefined,
    discounted_amout: ref.promoApplied ? '40.00' : undefined,
    discount_amount_formatted: promo,
    outstandAmount: '0',
    outstandShow: false,
    service_type_name: 'Taxi',
    service_package: 'Standard',
    in_drive_enable: true,
  };
}

function bookingData(booking: Booking): Record<string, unknown> {
  const ref = getCheckoutRef(booking.checkoutId);
  const { status, progress } = bookingStatusAt(booking);
  const hasDriver = status !== '1001';
  const base = ref ?? null;
  const driverPos = base ? interpolate(base.pickupLat, base.pickupLng, base.dropLat, base.dropLng, Math.max(0.05, progress)) : { lat: 19.076, lng: 72.877 };

  const baseAmount = booking.amount;

  return {
    id: booking.id,
    segment_id: booking.segmentId,
    estimate_price: `${CURRENCY} ${baseAmount.toFixed(2)}`,
    booking_status: status,
    ride_otp: hasDriver ? '1234' : undefined,
    ploy_points: base ? polylineFor(base, progress) : '',
    pickup_latitude: base?.pickupLat,
    pickup_longitude: base?.pickupLng,
    drop_latitude: base?.dropLat,
    drop_longitude: base?.dropLng,
    pickup_location: base?.pickupName,
    drop_location: base?.dropName,
    total_drop_location: 1,
    otp_enable: hasDriver,
    cancelable: status === '1001' || status === '1002',
    sos_visibility: hasDriver,
    shareable: hasDriver,
    tip_status: status === '1005',
    share_able_link: 'https://fixcycle.example/share',
    tip_already_paid: false,
    polydata: base
      ? { polyline_width: '5', polyline_color: '#f76f01', polyline: polylineFor(base, progress) }
      : {},
    still_marker: base
      ? { marker_type: 'dest', marker_lat: base.dropLat, marker_long: base.dropLng }
      : {},
    movable_marker: hasDriver
      ? {
          driver_marker_name: 'Vikram S.',
          driver_marker_type: 'taxi',
          driver_marker_lat: driverPos.lat,
          driver_marker_long: driverPos.lng,
          driver_marker_bearing: 45,
        }
      : {},
    driver: hasDriver
      ? {
          id: '88',
          first_name: 'Vikram',
          last_name: 'Sharma',
          phoneNumber: '+91 98765 43210',
          rating: '4.8',
          current_latitude: driverPos.lat,
          current_longitude: driverPos.lng,
          fullName: 'Vikram Sharma',
        }
      : { id: '0' },
    driver_vehicle: hasDriver
      ? { vehicle_color: 'White', vehicle_number_plate: 'MH 01 AB 1234', vehicle_side_view_image: '' }
      : {},
    vehicle_type: { vehicleTypeImage: '' },
    payment_method: { payment_method: 'Cash', payment_icon: '' },
    sos: [
      { id: '1', number: '+91 91234 56780', name: 'Emergency' },
      { id: '2', number: '+91 99887 76655', name: 'Family' },
    ],
    eta_pickup_and_dest: hasDriver ? '8 min' : undefined,
    waypoints: [],
    location: {},
  };
}

async function readBody(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const text = await req.text();
    if (!text) return {};
    const parsed = JSON.parse(text);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Handyman / Home services (Phase 9) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Mirrors backend/server.js Phase 9 engine exactly so both surfaces return
// identical JSON for identical requests.

const HM_SEGMENTS: Record<number, { title: string; biddingEnable: boolean }> = {
  6: { title: 'Handyman', biddingEnable: true },
  7: { title: 'Plumber', biddingEnable: false },
  8: { title: 'Salon & Spa', biddingEnable: false },
  9: { title: 'Vehicle Towing', biddingEnable: true },
};
const HM_SEGMENT_IDS = [6, 7, 8, 9];

const HM_SEGMENT_CATEGORIES: Record<number, [number, string][]> = {
  6: [[60, 'Home Repair'], [61, 'Furniture'], [62, 'Cleaning'], [63, 'Electrician'], [64, 'Other']],
  7: [[70, 'Repair'], [71, 'Installation'], [72, 'Emergency']],
  8: [[80, 'Hair'], [81, 'Skin'], [82, 'Nails'], [83, 'Spa']],
  9: [[90, 'Towing'], [91, 'Flat Tyre'], [92, 'Jump Start'], [93, 'Fuel Delivery']],
};

interface HmServiceDef { id: number; name: string; amount: number }
const HM_SERVICES: Record<number, HmServiceDef[]> = {
  6: [{ id: 101, name: 'Tub Change', amount: 149 }, { id: 102, name: 'Ceiling Fan', amount: 249 }, { id: 103, name: 'Door Lock', amount: 199 }, { id: 104, name: 'Wall Mounting', amount: 299 }, { id: 105, name: 'Furniture Assembly', amount: 349 }, { id: 106, name: 'Deep Cleaning', amount: 399 }, { id: 107, name: 'Disinfection', amount: 249 }, { id: 108, name: 'Geyser Repair', amount: 349 }],
  7: [{ id: 109, name: 'Pipe Fix', amount: 199 }, { id: 110, name: 'Tap Replace', amount: 149 }, { id: 111, name: 'Basin Install', amount: 249 }, { id: 112, name: 'Leak Detect', amount: 299 }, { id: 113, name: 'Water Heater', amount: 349 }, { id: 114, name: 'Emergency Pipe', amount: 499 }],
  8: [{ id: 115, name: 'Hair Cut', amount: 249 }, { id: 116, name: "Men's Grooming", amount: 399 }, { id: 117, name: 'Facial', amount: 499 }, { id: 118, name: 'Manicure', amount: 399 }, { id: 119, name: 'Pedicure', amount: 449 }, { id: 120, name: 'Full Body Massage', amount: 999 }, { id: 121, name: 'Waxing', amount: 349 }],
  9: [{ id: 122, name: 'Two-Wheeler Tow', amount: 499 }, { id: 123, name: 'Car Tow', amount: 799 }, { id: 124, name: 'Flat Tyre Assist', amount: 299 }, { id: 125, name: 'Jump Start', amount: 199 }, { id: 126, name: 'Fuel Delivery', amount: 249 }, { id: 127, name: 'Battery Replace', amount: 599 }],
};

interface HmProviderDef {
  id: number;
  first_name: string;
  last_name: string;
  business_name: string;
  rating: string;
  time_range: string;
  distance: string;
  current_latitude: string;
  current_longitude: string;
  image: string;
  is_favourite: number;
  hourly_amount: string;
  minimum_booking_amount: string;
  min_bill_description: string;
  price_type_text: string;
  price_type_slug: string;
  segment_price_card_id: number;
}
const HM_PROVIDERS: HmProviderDef[] = [
  { id: 501, first_name: 'Ravi', last_name: 'Kumar', business_name: 'Ravi Handyman Services', rating: '4.6', time_range: '09:00 AM - 06:00 PM', distance: '1.2 km', current_latitude: '19.0761', current_longitude: '72.8774', image: '', is_favourite: 0, hourly_amount: '0', minimum_booking_amount: '149', min_bill_description: 'Minimum booking amount of K149 applies', price_type_text: 'Fixed Price', price_type_slug: 'fixed-price', segment_price_card_id: 606 },
  { id: 502, first_name: 'Sunil', last_name: 'Sharma', business_name: 'Sunil Repairs & Cleaning', rating: '4.3', time_range: '08:00 AM - 05:00 PM', distance: '2.4 km', current_latitude: '19.078', current_longitude: '72.88', image: '', is_favourite: 1, hourly_amount: '0', minimum_booking_amount: '149', min_bill_description: 'Minimum booking amount of K149 applies', price_type_text: 'Fixed Price', price_type_slug: 'fixed-price', segment_price_card_id: 606 },
  { id: 503, first_name: 'Amit', last_name: 'Verma', business_name: 'Amit Electrical & Plumbing', rating: '4.8', time_range: '10:00 AM - 07:00 PM', distance: '1.9 km', current_latitude: '19.074', current_longitude: '72.875', image: '', is_favourite: 0, hourly_amount: '0', minimum_booking_amount: '149', min_bill_description: 'Minimum booking amount of K149 applies', price_type_text: 'Fixed Price', price_type_slug: 'fixed-price', segment_price_card_id: 606 },
  { id: 504, first_name: 'Priya', last_name: 'Nair', business_name: 'Priya Salon & Beauty', rating: '4.9', time_range: '09:30 AM - 08:00 PM', distance: '3.1 km', current_latitude: '19.081', current_longitude: '72.889', image: '', is_favourite: 0, hourly_amount: '0', minimum_booking_amount: '149', min_bill_description: 'Minimum booking amount of K149 applies', price_type_text: 'Fixed Price', price_type_slug: 'fixed-price', segment_price_card_id: 606 },
  { id: 505, first_name: 'Vikram', last_name: 'Singh', business_name: 'Vikram Tow & Assist', rating: '4.5', time_range: '24 Hours', distance: '0.8 km', current_latitude: '19.075', current_longitude: '72.876', image: '', is_favourite: 0, hourly_amount: '0', minimum_booking_amount: '149', min_bill_description: 'Minimum booking amount of K149 applies', price_type_text: 'Fixed Price', price_type_slug: 'fixed-price', segment_price_card_id: 606 },
];

const HM_PROVIDER_SERVICES: Record<number, number[]> = {
  501: [101, 102, 103, 104], 502: [101, 105, 106, 107], 503: [108, 109, 110, 111], 504: [115, 116, 117, 118, 119], 505: [122, 123, 124, 125],
};

function hmServiceById(id: number): HmServiceDef | undefined {
  for (const segId of HM_SEGMENT_IDS) { const found = (HM_SERVICES[segId] || []).find((s) => s.id === id); if (found) return found; }
  return undefined;
}
function hmProviderById(id: number): HmProviderDef | undefined { return HM_PROVIDERS.find((p) => p.id === id); }
function hmGetDate(): string { return new Date().toISOString().slice(0, 10); }
function hmGetTomorrow(): string { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); }
function hmOtp(): string { return String(Math.floor(1000 + Math.random() * 9000)); }

interface HmCartService {
  service_type_id: number;
  quantity: number;
  segment_price_card_detail_id: number;
  service_price: number;
  service_name: string;
}

interface HmCart {
  total_quantity: number;
  total_amount: number;
  discount_amount: number;
  tax: number;
  tax_per: number;
  final_amount: number;
  ordered_services: HmCartService[];
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
  slot_time_text: string;
  driver_details: { id: number | null; image: string; first_name: string; last_name: string };
  applied_promo_code: string;
}

interface HmOrderService { id: number; name: string; amount: string; currency: string; price_type: number; segment_price_card_id: number }
interface HmAdditionalCharge { id: number; charge_name: string; charge_amount: string; status: string }
interface HmPaymentDetail {
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
  additional_amount: HmAdditionalCharge[];
  custom_additional_charge: string;
}
interface HmOrder {
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
  order_status_text: string;
  numeric_order_status: number;
  status: number;
  booking_date: string;
  slot_time_text: string;
  service_type: HmOrderService[];
  segment_id: number;
  segment_name: string;
  order_otp: string;
  current_latitude: string;
  current_longitude: string;
  is_rated: boolean;
  arr_action: { cancel: boolean; pay: boolean; create_outstanding: string };
  payment_detail: HmPaymentDetail;
}

interface HmBid {
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
interface HmBidOrder {
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
  bids: HmBid[];
}

const HM_SLOT_MAP: Record<number, string> = { 501: '09:00 AM', 502: '11:30 AM', 503: '02:00 PM', 504: '05:30 PM', 505: '07:00 PM' };

const HM_CANCEL_REASONS = [
  { id: 1, reason: 'Wrong date / time' },
  { id: 2, reason: 'Service no longer needed' },
  { id: 3, reason: 'Found another provider' },
  { id: 4, reason: 'Other' },
];

function hmBuildCart(segId: number, body: Record<string, unknown>): HmCart {
  const key = String(segId);
  const existing = state().handymanCarts.get(key);
  const cart: HmCart = existing || {
    total_quantity: 0, total_amount: 0, discount_amount: 0, tax: 0, tax_per: 0, final_amount: 0, ordered_services: [],
    cart_id: segId * 100, service_time_slot_detail_id: 501, driver_id: null, booking_date: hmGetDate(), payment_method_id: 1,
    segment_price_card_id: segId * 100 + 11, latitude: '19.076', longitude: '72.877', drop_location: 'Home', user_address_id: 12,
    slot_time_text: '09:00 AM', driver_details: { id: null, image: '', first_name: '', last_name: '' }, applied_promo_code: '',
  };
  if (body.service_time_slot_detail_id != null) cart.service_time_slot_detail_id = num(body.service_time_slot_detail_id, cart.service_time_slot_detail_id);
  if (body.segment_price_card_id != null) cart.segment_price_card_id = num(body.segment_price_card_id, cart.segment_price_card_id);
  if (body.latitude != null) cart.latitude = String(body.latitude);
  if (body.longitude != null) cart.longitude = String(body.longitude);
  if (body.drop_location != null) cart.drop_location = String(body.drop_location);
  if (body.booking_date != null) cart.booking_date = String(body.booking_date);
  if (body.payment_method_id != null) cart.payment_method_id = num(body.payment_method_id, 1);
  if (body.user_address_id != null) cart.user_address_id = num(body.user_address_id, 12);
  if (body.driver_id != null) cart.driver_id = num(body.driver_id, 0);
  state().handymanCarts.set(key, cart);
  return cart;
}

function hmRecalcCart(cart: HmCart): void {
  cart.total_quantity = cart.ordered_services.reduce((s, svc) => s + svc.quantity, 0);
  cart.total_amount = cart.ordered_services.reduce((s, svc) => s + svc.quantity * svc.service_price, 0);
  if (cart.applied_promo_code === 'WELCOME10') cart.discount_amount = Math.min(Math.round(cart.total_amount * 0.1 * 100) / 100, cart.total_amount);
  else if (cart.applied_promo_code === 'FLAT25') cart.discount_amount = Math.min(25, cart.total_amount);
  else cart.discount_amount = 0;
  cart.final_amount = Math.max(0, cart.total_amount - cart.discount_amount);
  cart.slot_time_text = HM_SLOT_MAP[cart.service_time_slot_detail_id] || '09:00 AM';
}

function hmBuildCartResponse(cart: HmCart): Record<string, unknown> { return { ...cart, booking_time: cart.slot_time_text }; }

function hmGetSlots(): { id: number; slot_time: string; date: string; is_selected: number }[] {
  return [
    { id: 501, slot_time: '09:00 AM', date: hmGetDate(), is_selected: 0 },
    { id: 502, slot_time: '11:30 AM', date: hmGetDate(), is_selected: 0 },
    { id: 503, slot_time: '02:00 PM', date: hmGetDate(), is_selected: 0 },
    { id: 504, slot_time: '05:30 PM', date: hmGetDate(), is_selected: 0 },
    { id: 505, slot_time: '07:00 PM', date: hmGetTomorrow(), is_selected: 0 },
  ];
}

interface HmProviderServiceView { id: number; name: string; amount: number; amount_string: string; segment_price_card_detail_id: number }

function hmProviderResponse(p: HmProviderDef, segId: number): Record<string, unknown> {
  const svcIds = HM_PROVIDER_SERVICES[p.id] || [];
  const segSvcs = HM_SERVICES[segId] || HM_SERVICES[6] || [];
  const serviceType = svcIds.map((svcId): HmProviderServiceView | null => { const s = segSvcs.find((x) => x.id === svcId); return s ? { id: s.id, name: s.name, amount: s.amount, amount_string: `K${s.amount}`, segment_price_card_detail_id: s.id } : null; }).filter((x): x is HmProviderServiceView => x !== null);
  return { id: p.id, first_name: p.first_name, last_name: p.last_name, business_name: p.business_name, distance: p.distance, is_favourite: p.is_favourite, rating: p.rating, rating_number: Number(p.rating), time_range: p.time_range, current_latitude: p.current_latitude, current_longitude: p.current_longitude, image: p.image, segment_price_card_id: p.segment_price_card_id, hourly_amount: p.hourly_amount, minimum_booking_amount: p.minimum_booking_amount, min_bill_description: p.min_bill_description, price_type_text: p.price_type_text, price_type_slug: p.price_type_slug, service_type: serviceType };
}

function hmBuildOrderResponse(order: HmOrder): Record<string, unknown> {
  return { order_id: order.order_id, merchant_order_id: order.merchant_order_id, first_name: order.first_name, last_name: order.last_name, profile_image: order.profile_image, phone_number: order.phone_number, drop_location: order.drop_location, drop_latitude: order.drop_latitude, drop_longitude: order.drop_longitude, currency: 'K', total_services: order.total_services, order_status: order.order_status_text, status: order.numeric_order_status, order_otp: order.order_otp, segment_name: order.segment_name, booking_date: order.booking_date, slot_time_text: order.slot_time_text, service_type: order.service_type, segment_id: order.segment_id, payment_detail: order.payment_detail, cancel_reason: HM_CANCEL_REASONS, is_rated: order.is_rated, arr_action: order.arr_action, bidding_amount_accepted: null, bidding_amount: null, handyman_customer_details_visible: true, current_latitude: order.current_latitude, current_longitude: order.current_longitude, rating: order.rating };
}

// Seed demo handyman orders (mirrors server.js)
function hmSeed(): void {
  const s = state();
  if (s.handymanOrders.length > 0) return;
  s.handymanOrders.push({
    order_id: 9011, merchant_order_id: 'hm-9011', first_name: 'Ravi', last_name: 'Kumar', rating: '4.6', profile_image: '', phone_number: '+91 98200 00000',
    drop_location: 'Home', drop_latitude: '19.076', drop_longitude: '72.877', currency: 'K', total_services: 1, order_status_text: 'Delivered', numeric_order_status: 11, status: 11,
    booking_date: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })(), slot_time_text: '11:30 AM',
    service_type: [{ id: 101, name: 'Tub Change', amount: 'K149', currency: 'K', price_type: 1, segment_price_card_id: 606 }],
    segment_id: 6, segment_name: 'Handyman', order_otp: '4587', current_latitude: '19.0761', current_longitude: '72.8774', is_rated: true,
    arr_action: { cancel: false, pay: false, create_outstanding: '' },
    payment_detail: { cart_amount: '149', dispute_settled_amount: '0.0', tax: '0.0', final_amount_paid: '149', minimum_booking_amount: '149', minimum_booking_amount_payment_status: true, total_pending_amount: '0.0', pending_amount_status: false, pending_message: '', paid_status: true, payment_method_id: 1, payment_mode: 'Cash', discount_amount: '0', additional_amount: [], custom_additional_charge: '' },
  });
  s.handymanOrders.push({
    order_id: 9012, merchant_order_id: 'hm-9012', first_name: 'Ravi', last_name: 'Kumar', rating: '0', profile_image: '', phone_number: '+91 98200 00000',
    drop_location: 'Home', drop_latitude: '19.076', drop_longitude: '72.877', currency: 'K', total_services: 1, order_status_text: 'Placed', numeric_order_status: 1, status: 1,
    booking_date: hmGetDate(), slot_time_text: '02:00 PM',
    service_type: [{ id: 102, name: 'Ceiling Fan', amount: 'K249', currency: 'K', price_type: 1, segment_price_card_id: 606 }],
    segment_id: 6, segment_name: 'Handyman', order_otp: '3312', current_latitude: '19.0761', current_longitude: '72.8774', is_rated: false,
    arr_action: { cancel: true, pay: false, create_outstanding: '' },
    payment_detail: { cart_amount: '249', dispute_settled_amount: '0.0', tax: '0.0', final_amount_paid: '249', minimum_booking_amount: '149', minimum_booking_amount_payment_status: false, total_pending_amount: '249', pending_amount_status: true, pending_message: 'Balance payable to the provider after service', paid_status: false, payment_method_id: 1, payment_mode: 'Cash', discount_amount: '0', additional_amount: [], custom_additional_charge: '' },
  });
  s.handymanBidOrders.push({
    id: 1001, bid_order_id: 'bdo-1001', service_name: 'Ceiling Fan Fixing', category_name: 'Home Repair', description: 'Two ceiling fans not working',
    work_image_one: '', work_image_two: '', work_image_three: '', work_image_four: '', final_amount: '200', status: 'Active', numeric_status: 1,
    created_at: new Date().toISOString(), booked_at: '', time_slot_text: '02:00 PM', user_offer_price: '200', no_of_bids: 2, segment_id: 6,
    bids: [
      { id: 8001, driver_id: 501, first_name: 'Ravi', last_name: 'Kumar', profile_image: '', rating: '4.6', bid_amount: 'K180', amount: '180', created_at: new Date().toISOString(), time_text: '2 min ago', user_offer_price: '200', status: 'Active', numeric_status: 1, message: '' },
      { id: 8002, driver_id: 503, first_name: 'Amit', last_name: 'Verma', profile_image: '', rating: '4.8', bid_amount: 'K165', amount: '165', created_at: new Date().toISOString(), time_text: '8 min ago', user_offer_price: '200', status: 'Active', numeric_status: 1, message: '' },
    ],
  });
  s.handymanBidOrders.push({
    id: 1000, bid_order_id: 'bdo-1000', service_name: 'Kitchen Tap Replacement', category_name: 'Repair', description: 'Leaking kitchen tap',
    work_image_one: '', work_image_two: '', work_image_three: '', work_image_four: '', final_amount: '210', status: 'Booked', numeric_status: 3,
    created_at: new Date().toISOString(), booked_at: new Date().toISOString(), time_slot_text: '11:30 AM', user_offer_price: '250', no_of_bids: 1, segment_id: 7,
    bids: [
      { id: 8000, driver_id: 502, first_name: 'Sunil', last_name: 'Sharma', profile_image: '', rating: '4.3', bid_amount: 'K210', amount: '210', created_at: new Date().toISOString(), time_text: '15 min ago', user_offer_price: '250', status: 'Accepted', numeric_status: 2, message: '' },
    ],
  });
}
hmSeed();

// Ã¢â€â‚¬Ã¢â€â‚¬ Handyman handler functions Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function hmHandleGetCategories(body: Record<string, unknown>): Ok {
  const segId = num(body.segment_id, 6);
  return ok({ arr_categories: (HM_SEGMENT_CATEGORIES[segId] || []).map(([id, name]) => ({ id, name, image: '' })) });
}

function hmHandleGetServices(body: Record<string, unknown>): Ok {
  const segId = num(body.segment_id, 6);
  const svcs = (HM_SERVICES[segId] || []).map((s) => ({ id: s.id, name: s.name, amount: s.amount, amount_string: `K${s.amount}`, price_type: 1, segment_price_card_id: 600 + segId }));
  return ok({ segment_price_id: segId * 100 + 11, currency: 'K', price_type_text: 'Fixed Price', price_type_slug: 'fixed-price', minimum_booking_amount: 149, minimum_booking_amount_string: 'K149', min_bill_description: 'Minimum booking amount of K149 applies', hourly_amount: 0, arr_services: svcs, handyman_bidding_enable: !!HM_SEGMENTS[segId]?.biddingEnable });
}

function hmHandleGetProviders(body: Record<string, unknown>): Ok {
  const segId = num(body.segment_id, 6);
  const selected = Array.isArray(body.selected_services) ? body.selected_services.map((s) => num((s as Record<string, unknown>).service_type_id, 0)).filter(Boolean) : [];
  let list = HM_PROVIDERS.map((p) => hmProviderResponse(p, segId));
  if (selected.length > 0) {
    const filtered = list.filter((p) => selected.every((sid: number) => (p['service_type'] as { id: number }[]).some((s) => s.id === sid)));
    if (filtered.length > 0) list = filtered;
  }
  return ok({ providers: list, total_pages: 1, current_page: 1, tax_per: 0, limit: 10 });
}

function hmHandleGetProvider(body: Record<string, unknown>): Ok {
  const providerId = num(body.provider_id, 0);
  const segId = num(body.segment_id, 6);
  const p = hmProviderById(providerId);
  if (!p) return fail({}, 'Provider not found');
  return ok(hmProviderResponse(p, segId));
}

function hmHandleServiceSlots(): Ok {
  return ok({ time_slots: hmGetSlots(), instant_booking_time_slot_id: 503, instant_booking_after_text: 'Available now' });
}

function hmHandleSaveBookingCart(body: Record<string, unknown>): Ok {
  const segId = num(body.segment_id, 6);
  const isUpdate = String(body.is_update || '').toUpperCase() === 'YES';
  const cart = hmBuildCart(segId, body);
  if (body.service_type_id != null) {
    const svcId = num(body.service_type_id, 0);
    const svc = hmServiceById(svcId);
    if (svc) {
      const existing = cart.ordered_services.find((s) => s.service_type_id === svcId);
      const details = body.service_details ? (body.service_details as Record<string, unknown>)[String(svcId)] : null;
      let qty = 1;
      if (details && Array.isArray(details) && details.length > 0) {
        const first = (details as Array<Record<string, unknown>>)[0];
        if (first && first.quantity != null) qty = num(first.quantity, 1);
      }
      if (isUpdate) {
        if (existing) {
          if (qty <= 0) { cart.ordered_services = cart.ordered_services.filter((s) => s.service_type_id !== svcId); }
          else { existing.quantity = qty; }
        }
      } else {
        if (existing) { existing.quantity += qty; }
        else { cart.ordered_services.push({ service_type_id: svcId, quantity: qty, segment_price_card_detail_id: svcId, service_price: svc.amount, service_name: svc.name }); }
      }
    }
  }
  hmRecalcCart(cart);
  return ok(hmBuildCartResponse(cart));
}

function hmHandleGetCart(body: Record<string, unknown>): Ok {
  const cartId = num(body.cart_id, 0);
  for (const cart of Array.from(state().handymanCarts.values())) {
    if (cart.cart_id === cartId) return ok(hmBuildCartResponse(cart));
  }
  return fail({}, 'Cart not found');
}

function hmHandleDeleteCart(body: Record<string, unknown>): Ok {
  const cartId = num(body.cart_id, 0);
  const deleteType = String(body.delete_type || '').toUpperCase();
  const s = state();
  for (const [key, cart] of Array.from(s.handymanCarts.entries())) {
    if (cart.cart_id === cartId) {
      if (deleteType === 'CART') { s.handymanCarts.delete(key); return ok({}); }
      else if (deleteType === 'SERVICE') {
        const svcId = num(body.service_type_id, 0);
        cart.ordered_services = cart.ordered_services.filter((sv) => sv.service_type_id !== svcId);
        hmRecalcCart(cart);
        return ok(hmBuildCartResponse(cart));
      }
    }
  }
  return fail({}, 'Cart not found');
}

function hmHandleApplyPromo(body: Record<string, unknown>): Ok {
  const cartId = num(body.cart_id, 0);
  for (const cart of Array.from(state().handymanCarts.values())) {
    if (cart.cart_id === cartId) {
      const code = String(body.promo_code || '').toUpperCase();
      if (code === 'WELCOME10' || code === 'FLAT25') { cart.applied_promo_code = code; }
      else { cart.applied_promo_code = ''; }
      hmRecalcCart(cart);
      return ok(hmBuildCartResponse(cart));
    }
  }
  return fail({}, 'Cart not found');
}

function hmHandleConfirmOrder(body: Record<string, unknown>): Ok {
  const cartId = num(body.cart_id, 0);
  let cart: HmCart | null = null;
  for (const c of Array.from(state().handymanCarts.values())) { if (c.cart_id === cartId) { cart = c; break; } }
  if (!cart || cart.ordered_services.length === 0) return fail({}, 'Cart is empty');
  const segId = Math.floor(cartId / 100);
  const prov = hmProviderById(segId === 6 ? 501 : segId === 7 ? 502 : segId === 8 ? 504 : 505);
  if (!prov) return fail({}, 'Provider not found');
  const pmtId = num(body.payment_method_id, 1);
  const adv = num(body.advance_payment_of_min_bill, 0);
  const final = cart.final_amount;
  const pending = adv > 0 ? Math.max(0, final - adv) : 0;
  const paid = pmtId === 3 || adv >= final;
  const s = state();
  const orderId = s.handymanOrderSeq++;
  const order: HmOrder = {
    order_id: orderId, merchant_order_id: `hm-${orderId}`, first_name: prov.first_name, last_name: prov.last_name, rating: '0', profile_image: '',
    phone_number: '+91 98200 00000', drop_location: String(body.drop_location || cart.drop_location || 'Home'),
    drop_latitude: String(body.latitude || cart.latitude || '19.076'), drop_longitude: String(body.longitude || cart.longitude || '72.877'),
    currency: 'K', total_services: cart.total_quantity, order_status_text: 'Placed', numeric_order_status: 1, status: 1, booking_date: cart.booking_date, slot_time_text: cart.slot_time_text,
    service_type: cart.ordered_services.map((sv) => { const svc = hmServiceById(sv.service_type_id); return { id: sv.service_type_id, name: sv.service_name, amount: `K${svc ? svc.amount : sv.service_price}`, currency: 'K', price_type: 1, segment_price_card_id: 600 + segId }; }),
    segment_id: segId, segment_name: HM_SEGMENTS[segId]?.title || 'Handyman', order_otp: hmOtp(),
    current_latitude: String(body.latitude || cart.latitude || '19.0761'), current_longitude: String(body.longitude || cart.longitude || '72.8774'),
    is_rated: false, arr_action: { cancel: true, pay: false, create_outstanding: '' },
    payment_detail: { cart_amount: String(cart.total_amount), dispute_settled_amount: '0.0', tax: '0.0', final_amount_paid: String(final), minimum_booking_amount: '149', minimum_booking_amount_payment_status: adv >= 149, total_pending_amount: pending > 0 ? String(pending) : '0.0', pending_amount_status: pending > 0, pending_message: pending > 0 ? 'Balance payable to the provider after service' : '', paid_status: paid, payment_method_id: pmtId, payment_mode: pmtId === 3 ? 'Online' : 'Cash', discount_amount: String(cart.discount_amount), additional_amount: [], custom_additional_charge: '' },
  };
  s.handymanOrders.push(order);
  s.handymanCarts.delete(String(segId));
  return ok({ order_id: orderId, order_status: 1 });
}

function hmHandleGetOrders(body: Record<string, unknown>): Ok {
  const type = String(body.type || 'SCHEDULED').toUpperCase();
  const segId = body.segment_id != null ? num(body.segment_id, 0) : 0;
  let list = state().handymanOrders;
  if (type === 'SCHEDULED') list = list.filter((o) => o.numeric_order_status === 1);
  else if (type === 'ONGOING') list = list.filter((o) => [6, 7, 9, 10].includes(o.numeric_order_status));
  else if (type === 'PAST') list = list.filter((o) => [2, 3, 5, 8, 11, 12].includes(o.numeric_order_status));
  if (segId) list = list.filter((o) => o.segment_id === segId);
  return ok(list.map((o) => ({ order_id: o.order_id, merchant_order_id: o.merchant_order_id, first_name: o.first_name, last_name: o.last_name, rating: o.rating, profile_image: o.profile_image, final_amount_paid: String(o.payment_detail.final_amount_paid), currency: 'K', total_services: o.total_services, order_status: o.order_status_text, numeric_order_status: o.numeric_order_status, booking_date: o.booking_date, slot_time_text: o.slot_time_text, segment_id: o.segment_id, service_type: o.service_type })));
}

function hmHandleGetOrderDetail(body: Record<string, unknown>): Ok {
  const orderId = num(body.order_id, 0);
  const order = state().handymanOrders.find((o) => o.order_id === orderId);
  if (!order) return fail({}, 'Order not found');
  return ok(hmBuildOrderResponse(order));
}

function hmHandleCancelOrder(body: Record<string, unknown>): Ok {
  const orderId = num(body.order_id, 0);
  const order = state().handymanOrders.find((o) => o.order_id === orderId);
  if (!order) return fail({}, 'Order not found');
  order.numeric_order_status = 2; order.status = 2; order.order_status_text = 'Cancelled';
  order.arr_action = { cancel: false, pay: false, create_outstanding: '' };
  return ok({ message: 'Order cancelled' });
}

function hmHandleRateProvider(body: Record<string, unknown>): Ok {
  const orderId = num(body.order_id, 0);
  const order = state().handymanOrders.find((o) => o.order_id === orderId);
  if (!order) return fail({}, 'Order not found');
  order.is_rated = true; order.rating = String(body.rating || 5);
  return ok({ message: 'Thank you for your feedback' });
}

function hmHandleBookingPayment(body: Record<string, unknown>): Ok {
  const orderId = num(body.order_id, 0);
  const order = state().handymanOrders.find((o) => o.order_id === orderId);
  if (!order) return fail({}, 'Order not found');
  order.payment_detail.paid_status = true; order.payment_detail.total_pending_amount = '0.0'; order.payment_detail.pending_amount_status = false; order.payment_detail.pending_message = '';
  return ok({ payment_status: 1 });
}

function hmHandleBiddingCreateOrder(body: Record<string, unknown>): Ok {
  const segId = num(body.segment_id, 6);
  const catId = num(body.category_id, 0);
  const svcId = num(body.service_type_id, 0);
  const svc = hmServiceById(svcId);
  const catMap: Record<number, string> = { 60: 'Home Repair', 70: 'Repair', 90: 'Towing' };
  const s = state();
  const id = s.handymanBidSeq++;
  const bidOrder: HmBidOrder = {
    id, bid_order_id: `bdo-${id}`, service_name: svc ? svc.name : 'General Work Request', category_name: catMap[catId] || 'Request', description: String(body.description || ''),
    work_image_one: '', work_image_two: '', work_image_three: '', work_image_four: '',
    final_amount: String(body.user_offer_price || 0), status: 'Active', numeric_status: 1, created_at: new Date().toISOString(), booked_at: '',
    time_slot_text: HM_SLOT_MAP[num(body.service_time_slot_detail_id, 501)] || '09:00 AM',
    user_offer_price: String(body.user_offer_price || 0), no_of_bids: 0, segment_id: segId, bids: [],
  };
  s.handymanBidOrders.push(bidOrder);
  return ok(bidOrder);
}

function hmHandleBiddingGetOrders(body: Record<string, unknown>): Ok {
  const type = String(body.type || 'ALL').toUpperCase();
  let list = state().handymanBidOrders;
  if (type === 'ACTIVE') list = list.filter((o) => o.numeric_status === 1);
  return ok(list);
}

function hmHandleBiddingGetOrderDetail(body: Record<string, unknown>): Ok {
  const orderId = body.order_id as string | number;
  const bidOrder = state().handymanBidOrders.find((o) => o.bid_order_id === orderId || o.id === orderId);
  if (!bidOrder) return fail({}, 'Bid order not found');
  return ok(bidOrder);
}

function hmHandleBiddingCounterBid(body: Record<string, unknown>): Ok {
  const orderId = body.order_id as string | number;
  const bidOrderId = body.driver_bid_id as string | number | undefined;
  const counterAmount = num(body.counter_amount, 0);
  for (const bo of state().handymanBidOrders) {
    if (bo.bid_order_id === orderId || bo.id === orderId) {
      for (const bid of bo.bids) {
        if (bid.id === bidOrderId || bid.driver_id === bidOrderId) {
          bid.amount = String(counterAmount); bid.bid_amount = `K${counterAmount}`;
          break;
        }
      }
      break;
    }
  }
  return ok({ message: 'Counter offer sent to the driver' });
}

function hmHandleBiddingAcceptOrder(body: Record<string, unknown>): Ok {
  const orderId = body.order_id as string | number;
  const driverId = num(body.driver_id, 0);
  const bidOrder = state().handymanBidOrders.find((o) => o.bid_order_id === orderId || o.id === orderId);
  if (!bidOrder) return fail({}, 'Bid order not found');
  bidOrder.numeric_status = 3; bidOrder.status = 'Booked'; bidOrder.booked_at = new Date().toISOString();
  const winBid = bidOrder.bids.find((b) => b.driver_id === driverId) || bidOrder.bids[0];
  const prov = hmProviderById(driverId) || hmProviderById(501);
  if (!prov) return fail({}, 'Provider not found');
  const pmtId = num(body.payment_method_id, 1);
  const total = Number(winBid ? winBid.amount : bidOrder.final_amount);
  const s = state();
  const orderId2 = s.handymanOrderSeq++;
  const advance = num(body.advance_payment_of_min_bill, 0);
  const pending = advance > 0 ? Math.max(0, total - advance) : 0;
  const paid = pmtId === 3 || advance >= total;
  const order: HmOrder = {
    order_id: orderId2, merchant_order_id: `hm-${orderId2}`, first_name: prov.first_name, last_name: prov.last_name, rating: '0', profile_image: '',
    phone_number: '+91 98200 00000', drop_location: 'Home', drop_latitude: '19.076', drop_longitude: '72.877',
    currency: 'K', total_services: 1, order_status_text: 'Placed', numeric_order_status: 1, status: 1, booking_date: hmGetDate(), slot_time_text: bidOrder.time_slot_text,
    service_type: [{ id: 0, name: bidOrder.service_name, amount: `K${total}`, currency: 'K', price_type: 1, segment_price_card_id: 600 + bidOrder.segment_id }],
    segment_id: bidOrder.segment_id, segment_name: HM_SEGMENTS[bidOrder.segment_id]?.title || 'Handyman', order_otp: hmOtp(),
    current_latitude: '19.0761', current_longitude: '72.8774', is_rated: false,
    arr_action: { cancel: true, pay: false, create_outstanding: '' },
    payment_detail: { cart_amount: String(total), dispute_settled_amount: '0.0', tax: '0.0', final_amount_paid: String(total), minimum_booking_amount: '149', minimum_booking_amount_payment_status: advance >= 149, total_pending_amount: pending > 0 ? String(pending) : '0.0', pending_amount_status: pending > 0, pending_message: pending > 0 ? 'Balance payable to the provider after service' : '', paid_status: paid, payment_method_id: pmtId, payment_mode: pmtId === 3 ? 'Online' : 'Cash', discount_amount: '0', additional_amount: [], custom_additional_charge: '' },
  };
  s.handymanOrders.push(order);
  return ok({ order_id: orderId2, message: 'Bid accepted' });
}

function hmHandleBiddingCancelDelete(body: Record<string, unknown>): Ok {
  const orderId = body.order_id as string | number;
  const action = String(body.action || 'CANCEL').toUpperCase();
  const s = state();
  const idx = s.handymanBidOrders.findIndex((o) => o.bid_order_id === orderId || o.id === orderId);
  const order = s.handymanBidOrders[idx];
  if (!order) return fail({}, 'Bid order not found');
  if (action === 'DELETE') { s.handymanBidOrders.splice(idx, 1); return ok({ message: 'Bid order deleted' }); }
  else { order.numeric_status = 4; order.status = 'Cancelled'; return ok({ message: 'Bid order cancelled' }); }
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Laundry (Phase 10) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Mirrors backend/server.js Phase 10 engine exactly so both surfaces return
// identical JSON for identical requests. Reconstructed from LaundryServiceTrait
// + LaundryOutlet/LaundryService model field names (user API routes are absent
// from routes/api.php, same gap as Food / Store).

const LD_SEGMENT_ID = 5;
const LD_DEFAULT_IMAGE = '/assets/phase-10/outlet-default.svg';

interface LdOutletDef {
  id: number;
  full_name: string;
  address: string;
  phone_number: string;
  latitude: number;
  longitude: number;
  rating: string;
  distance: string;
  image: string;
  is_outlet_open: boolean;
  price_card_id: number;
}

const LD_OUTLETS: LdOutletDef[] = [
  { id: 601, full_name: 'Fresh & Fold', address: 'Shop 4, Link Road, Andheri West, Mumbai', phone_number: '+91 98201 00001', latitude: 19.1197, longitude: 72.8468, rating: '4.6', distance: '1.2 km', image: LD_DEFAULT_IMAGE, is_outlet_open: true, price_card_id: 600 },
  { id: 602, full_name: 'Starch & Steam', address: '14 Hill Road, Bandra West, Mumbai', phone_number: '+91 98201 00002', latitude: 19.0544, longitude: 72.8406, rating: '4.4', distance: '2.3 km', image: LD_DEFAULT_IMAGE, is_outlet_open: true, price_card_id: 600 },
  { id: 603, full_name: 'Dazzle Dry Cleaners', address: '27 Peddar Road, Colaba, Mumbai', phone_number: '+91 98201 00003', latitude: 18.9076, longitude: 72.8147, rating: '4.8', distance: '4.1 km', image: LD_DEFAULT_IMAGE, is_outlet_open: true, price_card_id: 600 },
  { id: 604, full_name: 'Urban Clean', address: '9 Veera Desai Road, Andheri West, Mumbai', phone_number: '+91 98201 00004', latitude: 19.1215, longitude: 72.8412, rating: '4.2', distance: '0.8 km', image: LD_DEFAULT_IMAGE, is_outlet_open: true, price_card_id: 600 },
];

const LD_OUTLET_BY_ID = new Map<number, LdOutletDef>(LD_OUTLETS.map((o) => [o.id, o]));

const LD_CATEGORIES: [number, string][] = [
  [11, 'Wash & Fold'],
  [12, 'Dry Clean'],
  [13, 'Ironing'],
  [14, 'Special Care'],
];

interface LdServiceDef {
  id: number;
  category_id: number;
  title: string;
  description: string;
  price: number;
  sequence: number;
}

const LD_SERVICES: LdServiceDef[] = [
  { id: 201, category_id: 11, title: 'Wash & Fold', description: 'Machine wash, machine dry and neatly folded per piece', price: 40, sequence: 1 },
  { id: 202, category_id: 11, title: 'Wash & Iron', description: 'Machine wash followed by steam ironing per piece', price: 55, sequence: 2 },
  { id: 203, category_id: 12, title: 'Dry Clean Shirt', description: 'Professional dry cleaning for shirts, stains handled', price: 80, sequence: 3 },
  { id: 204, category_id: 12, title: 'Dry Clean Suit', description: 'Two-piece suit dry cleaned and pressed', price: 180, sequence: 4 },
  { id: 205, category_id: 12, title: 'Dry Clean Duvet', description: 'King size duvet dry cleaned and folded', price: 220, sequence: 5 },
  { id: 206, category_id: 13, title: 'Iron Only', description: 'Press and fold per piece with fabric care', price: 25, sequence: 6 },
  { id: 207, category_id: 13, title: 'Steam Press', description: 'Fresh steam press for shirts and trousers', price: 45, sequence: 7 },
  { id: 208, category_id: 14, title: 'Shoe Clean', description: 'Sneaker deep clean and deodorise per pair', price: 90, sequence: 8 },
  { id: 209, category_id: 14, title: 'Leather Care', description: 'Leather jacket conditioning and polish', price: 250, sequence: 9 },
];

function ldServiceById(id: number): LdServiceDef | undefined {
  return LD_SERVICES.find((s) => s.id === id);
}

const LD_SLOT_MAP: Record<number, string> = { 501: '09:00 AM', 502: '11:30 AM', 503: '02:00 PM', 504: '05:30 PM', 505: '07:00 PM' };

const LD_CANCEL_REASONS = [
  { id: 1, reason: 'Changed my mind' },
  { id: 2, reason: 'Placed by mistake' },
  { id: 3, reason: 'Pickup time does not work' },
  { id: 4, reason: 'Found another outlet' },
];

const LD_HOME_STEPS: number[] = [1, 6, 10, 7, 13, 15, 16];
const LD_HOME_TH: number[] = [0, 8, 16, 24, 32, 40, 48];
const LD_SELF_STEPS: number[] = [1, 7, 9, 13];
const LD_SELF_TH: number[] = [0, 8, 16, 24];

const LD_HOME_DEFS: Array<[number, string[]]> = [
  [1, ['Order placed']],
  [6, ['Order accepted by outlet', 'Waiting to assign driver', 'Driver assigned']],
  [10, ['Order picked by driver']],
  [7, ['Arrived at outlet']],
  [13, ['In process']],
  [15, ['Dispatched']],
  [16, ['Out for delivery']],
  [14, ['Completed']],
];
const LD_SELF_DEFS: Array<[number, string[]]> = [
  [1, ['Order placed']],
  [7, ['Arrived at outlet']],
  [9, ['Pending pickup verification']],
  [13, ['In process']],
  [14, ['Completed']],
];

function ldStatusText(status: number): string {
  const map: Record<number, string> = { 1: 'Placed', 2: 'Cancelled', 3: 'Rejected', 4: 'Accepted', 6: 'Accepted', 7: 'Arrived at outlet', 9: 'Verify pickup OTP', 10: 'Picked by driver', 12: 'Expired', 13: 'In process', 14: 'Completed', 15: 'Dispatched', 16: 'Out for delivery', 17: 'Delivered' };
  return map[status] ?? 'Placed';
}

interface LdCartItem {
  laundry_service_id: number;
  quantity: number;
  title: string;
  price: number;
  image: string;
  category_id: number;
}

interface LdCart {
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
  items: LdCartItem[];
  total_quantity: number;
  cart_amount: number;
  delivery_amount: number;
  tax: number;
  discount_amount: number;
  final_amount: number;
  applied_promo_code: string;
}

interface LdOrderItem {
  id: number;
  laundry_service_id: number;
  title: string;
  price: string;
  quantity: number;
  total_amount: string;
  image: string;
}

interface LdHistoryStep {
  order_status: number;
  order_timestamp: string;
}

interface LdOrder {
  order_id: number;
  merchant_order_id: string;
  laundry_outlet_id: number;
  segment_id: number;
  service_type_id: number;
  order_status: number;
  order_status_history: LdHistoryStep[];
  cart_amount: number;
  delivery_amount: number;
  tax: number;
  discount_amount: number;
  final_amount_paid: number;
  total_quantity: number;
  drop_location: string;
  drop_latitude: string;
  drop_longitude: string;
  booking_date: string;
  slot_time_text: string;
  estimate_delivery_time: string;
  otp_for_pickup: string;
  user_confirmed_otp_for_pickup: number;
  payment_method_id: number;
  payment_status: number;
  created_at: number;
  is_rated: boolean;
  items: LdOrderItem[];
}

function ldCartKey(outletId: number): number {
  return outletId;
}

function ldGetCart(outletId: number): LdCart | null {
  return state().laundryCarts.get(ldCartKey(outletId)) ?? null;
}

function ldNewCart(outletId: number): LdCart {
  const s = state();
  const existing = ldGetCart(outletId);
  if (existing) return existing;
  const cart: LdCart = {
    cart_id: outletId,
    laundry_outlet_id: outletId,
    segment_id: LD_SEGMENT_ID,
    service_type_id: 1,
    service_time_slot_detail_id: 501,
    booking_date: hmGetDate(),
    slot_time_text: LD_SLOT_MAP[501] ?? '09:00 AM',
    drop_location: 'Home',
    latitude: '19.076',
    longitude: '72.877',
    user_address_id: 12,
    payment_method_id: 1,
    items: [],
    total_quantity: 0,
    cart_amount: 0,
    delivery_amount: 39,
    tax: 0,
    discount_amount: 0,
    final_amount: 0,
    applied_promo_code: '',
  };
  s.laundryCarts.set(ldCartKey(outletId), cart);
  return cart;
}

function ldRecalcCart(cart: LdCart): void {
  cart.total_quantity = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  cart.cart_amount = cart.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  cart.delivery_amount = cart.service_type_id === 6 ? 0 : 39;
  const taxable = cart.cart_amount + cart.delivery_amount;
  if (cart.applied_promo_code === 'WELCOME10') cart.discount_amount = Math.min(round2(taxable * 0.1), taxable);
  else if (cart.applied_promo_code === 'FLAT25') cart.discount_amount = Math.min(25, taxable);
  else cart.discount_amount = 0;
  cart.tax = round2(Math.max(0, taxable - cart.discount_amount) * 0.05);
  cart.final_amount = round2(Math.max(0, taxable - cart.discount_amount) + cart.tax);
  cart.slot_time_text = LD_SLOT_MAP[cart.service_time_slot_detail_id] || '09:00 AM';
}

function ldBuildCartResponse(cart: LdCart): Record<string, unknown> {
  return {
    cart_id: cart.cart_id,
    laundry_outlet_id: cart.laundry_outlet_id,
    segment_id: cart.segment_id,
    service_type_id: cart.service_type_id,
    service_time_slot_detail_id: cart.service_time_slot_detail_id,
    booking_date: cart.booking_date,
    slot_time_text: cart.slot_time_text,
    drop_location: cart.drop_location,
    latitude: cart.latitude,
    longitude: cart.longitude,
    user_address_id: cart.user_address_id,
    payment_method_id: cart.payment_method_id,
    items: cart.items,
    total_quantity: cart.total_quantity,
    cart_amount: cart.cart_amount,
    delivery_amount: cart.delivery_amount,
    tax: cart.tax,
    discount_amount: cart.discount_amount,
    final_amount: cart.final_amount,
    applied_promo_code: cart.applied_promo_code,
  };
}

function ldOutletResponse(o: LdOutletDef): Record<string, unknown> {
  return {
    id: o.id,
    laundry_outlet_id: o.id,
    segment_id: LD_SEGMENT_ID,
    full_name: o.full_name,
    address: o.address,
    phone_number: o.phone_number,
    latitude: o.latitude,
    longitude: o.longitude,
    rating: o.rating,
    rating_number: Number(o.rating),
    distance: o.distance,
    image: o.image,
    is_outlet_open: o.is_outlet_open,
    is_admin_outlet_open: true,
    price_card_id: o.price_card_id,
    currency: 'K',
    background_color: '#0ea5e9',
  };
}

function ldServiceResponse(s: LdServiceDef): Record<string, unknown> {
  return {
    id: s.id,
    laundry_service_id: s.id,
    category_id: s.category_id,
    price: s.price,
    formatted_price: `K${s.price}`,
    title: s.title,
    service_description: s.description,
    currency: 'K',
    image: `/assets/phase-10/${s.category_id === 11 ? 'shirt' : s.category_id === 12 ? 'suit' : s.category_id === 13 ? 'shirt' : 'duvet'}.svg`,
    service_image: '',
    service_availability: '1',
    sequence: s.sequence,
  };
}

function ldPushHistory(o: LdOrder, status: number): void {
  const already = o.order_status_history.some((h) => h.order_status === status);
  if (!already) {
    o.order_status_history.push({ order_status: status, order_timestamp: new Date().toISOString() });
  }
}

function ldElapsed(o: LdOrder): number {
  return (Date.now() - o.created_at) / 1000;
}

// Advance an order through outlet processing states by elapsed time.
function ldAdvance(o: LdOrder): void {
  if ([2, 3, 12, 14].includes(o.order_status)) return;
  const steps = o.service_type_id === 6 ? LD_SELF_STEPS : LD_HOME_STEPS;
  const th = o.service_type_id === 6 ? LD_SELF_TH : LD_HOME_TH;
  const el = ldElapsed(o);
  let reached = steps[0] ?? 1;
  for (let i = 0; i < steps.length; i += 1) {
    if (el >= (th[i] ?? Infinity)) reached = steps[i] ?? reached;
  }
  if (reached !== o.order_status) {
    o.order_status = reached;
    ldPushHistory(o, reached);
  }
  if (o.service_type_id === 6) {
    if (o.order_status === 13 && o.user_confirmed_otp_for_pickup === 1 && el >= (LD_SELF_TH[LD_SELF_STEPS.indexOf(13)] ?? 0) + 12) {
      o.order_status = 14;
      ldPushHistory(o, 14);
    }
  } else {
    if (o.order_status === 16 && o.user_confirmed_otp_for_pickup === 1 && el >= (LD_HOME_TH[LD_HOME_STEPS.indexOf(16)] ?? 0) + 14) {
      o.order_status = 17;
      ldPushHistory(o, 17);
    }
    if (o.order_status === 17 && el >= (LD_HOME_TH[LD_HOME_STEPS.indexOf(16)] ?? 0) + 20) {
      o.order_status = 14;
      ldPushHistory(o, 14);
    }
  }
}

function ldBuildProgress(o: LdOrder): { status_text: string; order_timestamp: string; status: boolean }[] {
  const defs = o.service_type_id === 6 ? LD_SELF_DEFS : LD_HOME_DEFS;
  const histMap = new Map<number, string>();
  for (const h of o.order_status_history) {
    if (!histMap.has(h.order_status)) histMap.set(h.order_status, h.order_timestamp);
  }
  const out: { status_text: string; order_timestamp: string; status: boolean }[] = [];
  for (const [status, texts] of defs) {
    const done = histMap.has(status);
    text: for (const text of texts) {
      out.push({ status_text: text, order_timestamp: done ? (histMap.get(status) as string) : '', status: done });
    }
  }
  return out;
}

function ldCanCancel(o: LdOrder): boolean {
  return ![2, 3, 12, 14].includes(o.order_status);
}

function ldBuildOrderResponse(o: LdOrder): Record<string, unknown> {
  const outlet = LD_OUTLET_BY_ID.get(o.laundry_outlet_id);
  const paid = o.payment_status === 1;
  return {
    order_id: o.order_id,
    merchant_order_id: o.merchant_order_id,
    laundry_outlet_id: o.laundry_outlet_id,
    outlet_name: outlet?.full_name ?? 'Laundry Outlet',
    outlet_address: outlet?.address ?? '',
    outlet_image: outlet?.image ?? LD_DEFAULT_IMAGE,
    outlet_phone_number: outlet?.phone_number ?? '',
    outlet_latitude: outlet?.latitude ?? 0,
    outlet_longitude: outlet?.longitude ?? 0,
    segment_id: o.segment_id,
    segment_name: 'Laundry',
    service_type_id: o.service_type_id,
    order_status_text: ldStatusText(o.order_status),
    order_status: o.order_status,
    order_otp: o.otp_for_pickup,
    otp_required: o.order_status === 9 || o.order_status === 16,
    total_quantity: o.total_quantity,
    items: o.items,
    drop_location: o.drop_location,
    drop_latitude: o.drop_latitude,
    drop_longitude: o.drop_longitude,
    booking_date: o.booking_date,
    slot_time_text: o.slot_time_text,
    estimate_delivery_time: o.estimate_delivery_time,
    payment_detail: {
      cart_amount: String(o.cart_amount),
      delivery_amount: String(o.delivery_amount),
      tax: String(o.tax),
      final_amount_paid: String(o.final_amount_paid),
      discount_amount: String(o.discount_amount),
      total_pending_amount: paid ? '0.0' : String(o.final_amount_paid),
      pending_amount_status: !paid,
      pending_message: paid ? '' : 'Balance payable on delivery',
      paid_status: paid,
      payment_method_id: o.payment_method_id,
      payment_mode: o.payment_method_id === 3 ? 'Online' : 'Cash',
    },
    cancel_reason: LD_CANCEL_REASONS,
    is_rated: o.is_rated,
    arr_action: { cancel: ldCanCancel(o), pay: false, otp_required: o.order_status === 9 || o.order_status === 16 },
    status_prgress: ldBuildProgress(o),
    order_status_history: o.order_status_history,
  };
}

function ldBuildListOrder(o: LdOrder): Record<string, unknown> {
  const outlet = LD_OUTLET_BY_ID.get(o.laundry_outlet_id);
  return {
    order_id: o.order_id,
    merchant_order_id: o.merchant_order_id,
    laundry_outlet_id: o.laundry_outlet_id,
    outlet_name: outlet?.full_name ?? 'Laundry Outlet',
    outlet_image: outlet?.image ?? LD_DEFAULT_IMAGE,
    outlet_address: outlet?.address ?? '',
    segment_id: o.segment_id,
    segment_name: 'Laundry',
    service_type_id: o.service_type_id,
    order_status_text: ldStatusText(o.order_status),
    order_status: o.order_status,
    total_quantity: o.total_quantity,
    items_count: o.items.length,
    final_amount_paid: String(o.final_amount_paid),
    currency: 'K',
    booking_date: o.booking_date,
    slot_time_text: o.slot_time_text,
    is_rated: o.is_rated,
  };
}

// Seed demo laundry orders (mirrors server.js)
function ldSeed(): void {
  const s = state();
  if (s.laundryOrders.length > 0) return;
  const pastItems: LdOrderItem[] = [{ id: 1, laundry_service_id: 202, title: 'Wash & Iron', price: 'K55.00', quantity: 3, total_amount: 'K165.00', image: '/assets/phase-10/shirt.svg' }];
  s.laundryOrders.push({
    order_id: 8019, merchant_order_id: 'ld-8019', laundry_outlet_id: 601, segment_id: LD_SEGMENT_ID, service_type_id: 1,
    order_status: 14, order_status_history: [1, 6, 10, 7, 13, 15, 16, 14].map((st) => ({ order_status: st, order_timestamp: new Date(Date.now() - 2 * 86400 * 1000 + st * 1000).toISOString() })),
    cart_amount: 165, delivery_amount: 39, tax: 10.2, discount_amount: 0, final_amount_paid: 214.2, total_quantity: 3,
    drop_location: 'Home', drop_latitude: '19.076', drop_longitude: '72.877', booking_date: hmGetDate(), slot_time_text: '11:30 AM', estimate_delivery_time: 'Today, 6:00 PM',
    otp_for_pickup: '3847', user_confirmed_otp_for_pickup: 1, payment_method_id: 1, payment_status: 1,
    created_at: Date.now() - 2 * 86400 * 1000, is_rated: true, items: pastItems,
  });
  const ongoingItems: LdOrderItem[] = [{ id: 1, laundry_service_id: 203, title: 'Dry Clean Shirt', price: 'K80.00', quantity: 2, total_amount: 'K160.00', image: '/assets/phase-10/suit.svg' }];
  s.laundryOrders.push({
    order_id: 8020, merchant_order_id: 'ld-8020', laundry_outlet_id: 602, segment_id: LD_SEGMENT_ID, service_type_id: 1,
    order_status: 13, order_status_history: [1, 6, 10, 7, 13].map((st) => ({ order_status: st, order_timestamp: new Date(Date.now() - 35000 + st * 1000).toISOString() })),
    cart_amount: 160, delivery_amount: 39, tax: 9.95, discount_amount: 0, final_amount_paid: 208.95, total_quantity: 2,
    drop_location: 'Home', drop_latitude: '19.076', drop_longitude: '72.877', booking_date: hmGetDate(), slot_time_text: '02:00 PM', estimate_delivery_time: 'Today, 7:00 PM',
    otp_for_pickup: '4521', user_confirmed_otp_for_pickup: 0, payment_method_id: 1, payment_status: 0,
    created_at: Date.now() - 35000, is_rated: false, items: ongoingItems,
  });
}
ldSeed();

function ldHandleGetCategories(body: Record<string, unknown>): Ok {
  void body;
  return ok({ arr_categories: LD_CATEGORIES.map(([id, name]) => ({ id, name, image: '' })) });
}

function ldHandleGetServices(body: Record<string, unknown>): Ok {
  const categoryId = num(body.category_id, 0);
  let services = LD_SERVICES;
  if (categoryId > 0) services = services.filter((s) => s.category_id === categoryId);
  return ok({
    categories: LD_CATEGORIES.map(([id, name]) => ({ id, name, image: '' })),
    currency: 'K',
    services: services.map(ldServiceResponse),
  });
}

function ldHandleGetOutlets(body: Record<string, unknown>): Ok {
  void body;
  return ok({ outlets: LD_OUTLETS.map((o) => ldOutletResponse(o)), total_pages: 1, current_page: 1 });
}

function ldHandleGetOutlet(body: Record<string, unknown>): Ok {
  const outletId = num(body.laundry_outlet_id, 0);
  const outlet = LD_OUTLET_BY_ID.get(outletId);
  if (!outlet) return fail({}, 'Outlet not found');
  return ok(ldOutletResponse(outlet));
}

function ldHandleServiceSlots(): Ok {
  return ok({
    time_slots: [
      { id: 501, slot_time: '09:00 AM', date: hmGetDate(), is_selected: 0 },
      { id: 502, slot_time: '11:30 AM', date: hmGetDate(), is_selected: 0 },
      { id: 503, slot_time: '02:00 PM', date: hmGetDate(), is_selected: 0 },
      { id: 504, slot_time: '05:30 PM', date: hmGetDate(), is_selected: 0 },
      { id: 505, slot_time: '07:00 PM', date: hmGetTomorrow(), is_selected: 0 },
    ],
    instant_booking_time_slot_id: 503,
    instant_booking_after_text: 'Pickup available at this slot',
  });
}

function ldHandleSaveCart(body: Record<string, unknown>): Ok {
  const outletId = num(body.laundry_outlet_id, 0);
  if (!LD_OUTLET_BY_ID.has(outletId)) return fail({}, 'Outlet not found');
  const cart = ldNewCart(outletId);
  if (body.service_type_id != null) {
    const st = num(body.service_type_id, 1);
    cart.service_type_id = st === 6 ? 6 : 1;
  }
  if (body.service_time_slot_detail_id != null) cart.service_time_slot_detail_id = num(body.service_time_slot_detail_id, cart.service_time_slot_detail_id);
  if (body.booking_date != null) cart.booking_date = String(body.booking_date);
  if (body.drop_location != null) cart.drop_location = String(body.drop_location);
  if (body.latitude != null) cart.latitude = String(body.latitude);
  if (body.longitude != null) cart.longitude = String(body.longitude);
  if (body.user_address_id != null) cart.user_address_id = num(body.user_address_id, 12);
  if (body.payment_method_id != null) cart.payment_method_id = num(body.payment_method_id, 1);
  if (Array.isArray(body.items)) {
    const fresh: LdCartItem[] = [];
    for (const raw of body.items as Array<Record<string, unknown>>) {
      const svcId = num(raw['laundry_service_id'], 0);
      const svc = ldServiceById(svcId);
      if (svc) {
        fresh.push({
          laundry_service_id: svc.id,
          quantity: Math.max(1, num(raw['quantity'], 1)),
          title: svc.title,
          price: svc.price,
          image: ldServiceResponse(svc)['image'] as string,
          category_id: svc.category_id,
        });
      }
    }
    cart.items = fresh;
  }
  ldRecalcCart(cart);
  return ok(ldBuildCartResponse(cart));
}

function ldHandleGetCart(body: Record<string, unknown>): Ok {
  const outletId = num(body.laundry_outlet_id, 0);
  const cart = ldGetCart(outletId) ?? ldNewCart(outletId);
  return ok(ldBuildCartResponse(cart));
}

function ldHandleDeleteCart(body: Record<string, unknown>): Ok {
  const outletId = num(body.laundry_outlet_id, 0);
  const cart = ldGetCart(outletId);
  if (!cart) return ok(ldBuildCartResponse(ldNewCart(outletId)));
  const itemId = num(body.laundry_service_id, 0);
  if (itemId > 0) {
    cart.items = cart.items.filter((i) => i.laundry_service_id !== itemId);
    ldRecalcCart(cart);
    return ok(ldBuildCartResponse(cart));
  }
  cart.items = [];
  ldRecalcCart(cart);
  return ok(ldBuildCartResponse(cart));
}

function ldHandleApplyPromo(body: Record<string, unknown>): Ok {
  const outletId = num(body.laundry_outlet_id, 0);
  const cart = ldGetCart(outletId);
  if (!cart) return fail({}, 'Cart not found');
  const code = String(body.promo_code || '').toUpperCase();
  cart.applied_promo_code = code === 'WELCOME10' || code === 'FLAT25' ? code : '';
  ldRecalcCart(cart);
  return ok(ldBuildCartResponse(cart));
}

function ldHandleConfirmOrder(body: Record<string, unknown>): Ok {
  const outletId = num(body.laundry_outlet_id, 0);
  const cart = ldGetCart(outletId);
  if (!cart || cart.items.length === 0) return fail({}, 'Cart is empty');
  const outlet = LD_OUTLET_BY_ID.get(outletId);
  if (!outlet) return fail({}, 'Outlet not found');
  const pmtId = num(body.payment_method_id, cart.payment_method_id);
  const s = state();
  const orderId = s.laundryOrderSeq++;
  const order: LdOrder = {
    order_id: orderId,
    merchant_order_id: `ld-${orderId}`,
    laundry_outlet_id: outletId,
    segment_id: LD_SEGMENT_ID,
    service_type_id: cart.service_type_id,
    order_status: 1,
    order_status_history: [{ order_status: 1, order_timestamp: new Date().toISOString() }],
    cart_amount: cart.cart_amount,
    delivery_amount: cart.delivery_amount,
    tax: cart.tax,
    discount_amount: cart.discount_amount,
    final_amount_paid: cart.final_amount,
    total_quantity: cart.total_quantity,
    drop_location: String(body.drop_location || cart.drop_location || outlet.address),
    drop_latitude: String(body.latitude || cart.latitude || outlet.latitude),
    drop_longitude: String(body.longitude || cart.longitude || outlet.longitude),
    booking_date: cart.booking_date,
    slot_time_text: cart.slot_time_text,
    estimate_delivery_time: cart.service_type_id === 6 ? 'Today, 6:00 PM' : 'Today, 7:00 PM',
    otp_for_pickup: hmOtp(),
    user_confirmed_otp_for_pickup: 0,
    payment_method_id: pmtId,
    payment_status: pmtId === 3 ? 1 : 0,
    created_at: Date.now(),
    is_rated: false,
    items: cart.items.map((i, idx) => ({
      id: idx + 1,
      laundry_service_id: i.laundry_service_id,
      title: i.title,
      price: `K${i.price.toFixed(2)}`,
      quantity: i.quantity,
      total_amount: `K${(i.price * i.quantity).toFixed(2)}`,
      image: i.image,
    })),
  };
  s.laundryOrders.push(order);
  s.laundryCarts.delete(ldCartKey(outletId));
  return ok({ order_id: orderId, order_status: 1 });
}

function ldHandleGetOrders(body: Record<string, unknown>): Ok {
  const type = String(body.type || 'ONGOING').toUpperCase();
  const ongoing = [1, 4, 6, 7, 9, 10, 13, 15, 16, 17];
  const past = [2, 3, 5, 8, 11, 12, 14];
  let list = state().laundryOrders;
  if (type === 'ONGOING') list = list.filter((o) => ongoing.includes(o.order_status));
  else if (type === 'PAST') list = list.filter((o) => past.includes(o.order_status));
  return ok(list.map(ldBuildListOrder));
}

function ldHandleGetOrderDetail(body: Record<string, unknown>): Ok {
  const orderId = num(body.order_id, num(body.laundry_outlet_order_id, 0));
  const order = state().laundryOrders.find((o) => o.order_id === orderId || o.merchant_order_id === String(body.order_id));
  if (!order) return fail({}, 'Order not found');
  ldAdvance(order);
  return ok(ldBuildOrderResponse(order));
}

function ldHandleVerifyOtp(body: Record<string, unknown>): Ok {
  const orderId = num(body.order_id, 0);
  const order = state().laundryOrders.find((o) => o.order_id === orderId);
  if (!order) return fail({}, 'Order not found');
  const otp = String(body.otp || '');
  if (otp !== order.otp_for_pickup) return fail({}, 'Invalid OTP');
  if (order.order_status === 9 && order.service_type_id === 6) {
    order.user_confirmed_otp_for_pickup = 1;
    order.order_status = 13;
    ldPushHistory(order, 13);
  } else if (order.order_status === 16 && order.service_type_id !== 6) {
    order.user_confirmed_otp_for_pickup = 1;
    ldPushHistory(order, 16);
  }
  ldAdvance(order);
  return ok(ldBuildOrderResponse(order));
}

function ldHandleCancelOrder(body: Record<string, unknown>): Ok {
  const orderId = num(body.order_id, 0);
  const order = state().laundryOrders.find((o) => o.order_id === orderId);
  if (!order) return fail({}, 'Order not found');
  if (!ldCanCancel(order)) return fail({}, 'Order cannot be cancelled');
  order.order_status = 2;
  ldPushHistory(order, 2);
  return ok({ message: 'Order cancelled' });
}

function ldHandleRateOutlet(body: Record<string, unknown>): Ok {
  const orderId = num(body.order_id, 0);
  const order = state().laundryOrders.find((o) => o.order_id === orderId);
  if (!order) return fail({}, 'Order not found');
  order.is_rated = true;
  return ok({ message: 'Thank you for your feedback' });
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Bus booking (Phase 11) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Mirrors the field names used by BusController (Services/BusServiceController
// + BusTrait). `route_id`/`bus_id` are Route::id / Bus::id, NOT segment ids.

interface BusStopMock { id: number; stop_name: string; latitude: number; longitude: number; time: string; sequence: number; }
interface BusSeatMock { seat_no: string; seat_type: string; type_slug: string; seat_status: string; seat_price: number; formatted_price: string; deck: string; }

const BUS_SEAT_CHARS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2', 'E1', 'E2', 'F1', 'F2', 'G1', 'G2', 'H1', 'H2', 'J1', 'J2', 'K1', 'K2', 'L1', 'L2', 'M1', 'M2', 'N1', 'N2'] as const;

const BUS_DEFAULT_BOARDING: BusStopMock[] = [
  { id: 7001, stop_name: 'Mumbai Central Station', latitude: 18.9696, longitude: 72.8199, time: '21:00', sequence: 1 },
  { id: 7002, stop_name: 'Lamington Road', latitude: 18.9637, longitude: 72.8196, time: '21:20', sequence: 2 },
  { id: 7003, stop_name: 'Sion Circle', latitude: 19.0438, longitude: 72.8617, time: '21:45', sequence: 3 },
];

const BUS_DEFAULT_DROPPING: BusStopMock[] = [
  { id: 7011, stop_name: 'Pune Station', latitude: 18.5289, longitude: 73.8735, time: '01:10', sequence: 1 },
  { id: 7012, stop_name: 'Swargate', latitude: 18.5089, longitude: 73.8558, time: '01:30', sequence: 2 },
  { id: 7013, stop_name: 'Chinchwad', latitude: 18.6278, longitude: 73.813, time: '02:00', sequence: 3 },
];

interface BusBookingMock {
  id: number;
  booking_number: string;
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
  pickup_location: string;
  drop_location: string;
  status: number;
  status_text: string;
  total_amount: number;
  formatted_amount: string;
  booking_created_at: string;
  base_amount?: number;
  tax?: number;
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

function busDefaultRoutes(): Record<string, unknown>[] {
  return [
    { id: 701, route_id: 701, route_name: 'Mumbai Central Ã¢â€ â€™ Pune', service_type_id: 1, segment_id: 4, start_point: 'Mumbai Central', end_point: 'Pune', start_latitude: 18.9696, start_longitude: 72.8199, end_latitude: 18.5289, end_longitude: 73.8735, start_stop_id: 7001, end_stop_id: 7011, distance: '149 km' },
    { id: 702, route_id: 702, route_name: 'Pune Ã¢â€ â€™ Mumbai Central', service_type_id: 1, segment_id: 4, start_point: 'Pune', end_point: 'Mumbai Central', start_latitude: 18.5289, start_longitude: 73.8735, end_latitude: 18.9696, end_longitude: 72.8199, start_stop_id: 7011, end_stop_id: 7001, distance: '149 km' },
    { id: 703, route_id: 703, route_name: 'Andheri Ã¢â€ â€™ Nashik', service_type_id: 1, segment_id: 4, start_point: 'Andheri', end_point: 'Nashik', start_latitude: 19.1197, start_longitude: 72.8468, end_latitude: 19.9975, end_longitude: 73.7898, start_stop_id: 7002, end_stop_id: 7012, distance: '167 km' },
    { id: 704, route_id: 704, route_name: 'Nashik Ã¢â€ â€™ Andheri', service_type_id: 1, segment_id: 4, start_point: 'Nashik', end_point: 'Andheri', start_latitude: 19.9975, start_longitude: 73.7898, end_latitude: 19.1197, end_longitude: 72.8468, start_stop_id: 7012, end_stop_id: 7002, distance: '167 km' },
  ];
}

function busDefaultBus(id: number, available: number): Record<string, unknown> {
  const buses = [
    { id: 7101, bus_id: 7101, bus_name: 'Raj Express Luxury', bus_number: 'MH-02-AR-7701', service_type_id: 1, bus_type: 'AC Sleeper 2+1', departure_time: '21:30', arrival_time: '01:10', price: 749, formatted_price: 'K749', available_seats: 14, total_seats: 26, seat_layout: 'SLEEPER', bus_design_type: 2, service_name: 'AC Sleeper', service_short_name: 'AC SL' },
    { id: 7102, bus_id: 7102, bus_name: 'Sai Shraddha Travels', bus_number: 'MH-12-DE-5522', service_type_id: 1, bus_type: 'AC Seater 2+2', departure_time: '22:45', arrival_time: '02:25', price: 649, formatted_price: 'K649', available_seats: 9, total_seats: 26, seat_layout: 'SEATER', bus_design_type: 1, service_name: 'AC Seater', service_short_name: 'AC SE' },
    { id: 7103, bus_id: 7103, bus_name: 'Greenline Volvo', bus_number: 'MH-04-JP-3311', service_type_id: 1, bus_type: 'Non AC Sleeper 2+1', departure_time: '23:15', arrival_time: '03:00', price: 549, formatted_price: 'K549', available_seats: 21, total_seats: 26, seat_layout: 'SLEEPER', bus_design_type: 2, service_name: 'Non AC Sleeper', service_short_name: 'NA SL' },
  ];
  const bus = buses.find((b) => b.id === id) ?? buses[1];
  if (!bus) return {};
  return { ...bus, available_seats: Math.min(bus.available_seats as number, Math.max(0, available)) };
}

function busSeatDetails(busId: number): BusSeatMock[] {
  const bus = busDefaultBus(busId, 14);
  const available = bus.available_seats as number;
  const price = bus.price as number;
  return BUS_SEAT_CHARS.map((name, i) => ({
    seat_no: name,
    seat_type: `Seat ${Math.floor(i / 2) + 1}`,
    type_slug: 'seat',
    seat_status: i < available ? 'available' : 'booked',
    seat_price: price,
    formatted_price: `${CURRENCY}${price}`,
    deck: 'upper',
  }));
}

function busBookingPayload(body: Record<string, unknown>): BusBookingMock {
  const s = state();
  const seatNames = Array.isArray(body.seat_numbers) && (body.seat_numbers as unknown[]).length > 0
    ? (body.seat_numbers as unknown[]).join(', ')
    : 'A1';
  const seatCount = seatNames.split(',').length;
  const seats = Math.max(1, num(body.seat_count, seatCount));
  const seatFare = num(body.seat_price, num(body.price, 749));
  const bus = busDefaultBus(num(body.bus_id, 7102), seats);
  const base = seats * seatFare;
  const tax = Math.round(base * 0.05);
  const boarding = BUS_DEFAULT_BOARDING.find((b) => b.id === num(body.boarding_point_id, 7001)) ?? BUS_DEFAULT_BOARDING[0];
  const dropping = BUS_DEFAULT_DROPPING.find((d) => d.id === num(body.dropping_point_id, 7011)) ?? BUS_DEFAULT_DROPPING[0];
  if (!boarding || !dropping) return {} as unknown as BusBookingMock;
  return {
    id: s.busBookingSeq++,
    booking_number: `BUS-${s.busBookingSeq}`,
    bus_id: bus.bus_id as number,
    bus_name: bus.bus_name as string,
    bus_number: bus.bus_number as string,
    route_id: num(body.route_id, 701),
    route_name: str(body.route_name, 'Mumbai Central Ã¢â€ â€™ Pune'),
    service_type_id: 1,
    booking_date: str(body.booking_date, hmGetDate()),
    departure_time: bus.departure_time as string,
    arrival_time: bus.arrival_time as string,
    seat_numbers: seatNames,
    seat_count: seats,
    boarding_point: boarding.stop_name,
    dropping_point: dropping.stop_name,
    pickup_location: str(body.pickup_location, boarding.stop_name),
    drop_location: str(body.drop_location, dropping.stop_name),
    status: 1,
    status_text: 'New',
    total_amount: base + tax,
    formatted_amount: `${CURRENCY}${base + tax}`,
    booking_created_at: new Date().toISOString(),
    base_amount: base,
    tax,
    pickup_latitude: boarding.latitude,
    pickup_longitude: boarding.longitude,
    drop_latitude: dropping.latitude,
    drop_longitude: dropping.longitude,
    pickup_stop_name: boarding.stop_name,
    drop_stop_name: dropping.stop_name,
    cancellation_policy: 'Free cancellation before 12 hours of departure.',
    rating: 4.5,
    passenger_name: str(body.passenger_name, 'User'),
    passenger_phone: str(body.passenger_phone, '+91 98200 00000'),
  };
}

function busHandleSearchRoutes(body: Record<string, unknown>): Ok {
  const from = str(body.pickup_location, '').trim().toLowerCase();
  const to = str(body.drop_location, '').trim().toLowerCase();
  const routes = busDefaultRoutes().filter((r) => (!from || (r.start_point as string).toLowerCase().includes(from)) && (!to || (r.end_point as string).toLowerCase().includes(to)));
  return ok({ routes });
}

function busHandleRouteStops(body: Record<string, unknown>): Ok {
  const routeId = num(body.route_id, 701);
  const reverse = routeId === 702 || routeId === 704;
  return ok({
    stops: (reverse ? [...BUS_DEFAULT_DROPPING, ...BUS_DEFAULT_BOARDING] : [...BUS_DEFAULT_BOARDING, ...BUS_DEFAULT_DROPPING]).map((s) => ({
      id: s.id, stop_name: s.stop_name, stop_latitude: s.latitude, stop_longitude: s.longitude, stop_time: s.time, stop_no: s.sequence,
    })),
  });
}

function busHandleAvailableBuses(body: Record<string, unknown>): Ok {
  const buses = [7101, 7102, 7103].map((id) => {
    const b = busDefaultBus(id, num(body.available_seats, 10));
    return { ...b, boarding_points: BUS_DEFAULT_BOARDING.map((s) => ({ id: s.id, stop_name: s.stop_name, stop_latitude: s.latitude, stop_longitude: s.longitude, stop_time: s.time, stop_no: s.sequence })), dropping_points: BUS_DEFAULT_DROPPING.map((s) => ({ id: s.id, stop_name: s.stop_name, stop_latitude: s.latitude, stop_longitude: s.longitude, stop_time: s.time, stop_no: s.sequence })), seat_details: busSeatDetails(id) };
  });
  return ok({ buses });
}

function busHandleSeatMap(body: Record<string, unknown>): Ok {
  const busId = num(body.bus_id, 7102);
  const bus = busDefaultBus(busId, num(body.available_seats, 10));
  return ok({
    bus_id: bus.bus_id, bus_name: bus.bus_name, bus_number: bus.bus_number, bus_type: bus.bus_type,
    boarding_points: BUS_DEFAULT_BOARDING.map((s) => ({ id: s.id, stop_name: s.stop_name, stop_latitude: s.latitude, stop_longitude: s.longitude, stop_time: s.time, stop_no: s.sequence })),
    dropping_points: BUS_DEFAULT_DROPPING.map((s) => ({ id: s.id, stop_name: s.stop_name, stop_latitude: s.latitude, stop_longitude: s.longitude, stop_time: s.time, stop_no: s.sequence })),
    seat_details: busSeatDetails(busId),
    available_seats: bus.available_seats,
    total_seats: bus.total_seats,
    seat_price: bus.price,
    formatted_price: bus.formatted_price,
    seat_layout: bus.seat_layout,
    bus_design_type: bus.bus_design_type,
  });
}

function busHandleCheckout(body: Record<string, unknown>): Ok {
  const seats = Array.isArray(body.seat_numbers) && (body.seat_numbers as unknown[]).length > 0 ? (body.seat_numbers as unknown[]).length : Math.max(1, num(body.seat_count, 1));
  const fare = num(body.seat_price, num(body.price, 749));
  const sub = seats * fare;
  const tax = Math.round(sub * 0.05);
  return ok({
    sub_total: sub,
    tax,
    discount_amount: 0,
    discount: 0,
    grand_total: sub + tax,
    total_amount: sub + tax,
    formatted_total: `${CURRENCY}${sub + tax}`,
    formatted_amount: `${CURRENCY}${sub + tax}`,
    seat_prices: (Array.isArray(body.seat_numbers) ? body.seat_numbers as unknown[] : ['A1']).map((seatNo) => ({ seat_no: String(seatNo), seat_price: fare, price: fare, formatted_price: `${CURRENCY}${fare}` })),
    currency: CURRENCY,
  });
}

function busHandleConfirm(body: Record<string, unknown>): Ok {
  const booking = busBookingPayload(body);
  state().busBookings.push(booking);
  return ok({ bus_booking_id: booking.id, status: 'Booking confirmed' });
}

function busHandleBookings(): Ok {
  const list = [...state().busBookings].reverse();
  return ok({ bookings: list });
}

function busHandleBookingDetail(body: Record<string, unknown>): Ok {
  const id = num(body.bus_booking_id, 0);
  const b = state().busBookings.find((x) => x.id === id || x.booking_number === String(body.bus_booking_id));
  if (!b) return fail({}, 'Bus booking not found');
  return ok({ booking: { ...b } });
}

function busHandleCancelBooking(body: Record<string, unknown>): Ok {
  const id = num(body.bus_booking_id, 0);
  const b = state().busBookings.find((x) => x.id === id || x.booking_number === String(body.bus_booking_id));
  if (!b) return fail({}, 'Bus booking not found');
  b.status = 4;
  b.status_text = 'Cancelled';
  return ok(true);
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Carpooling (Phase 11) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Mirrors CarpoolingController responses (CarpoolingTrait calculations).
// Ride status: 1=Offer, 2=Booked, 3=Ongoing, 4=End, 5=Cancel, 6=Cancel (passenger), 7=Expired.

interface CarpoolVehicleMock { make: string; model: string; color: string; number: string; }

interface CarpoolRoutePointMock {
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

interface CarpoolRideMock {
  id: number;
  merchant_ride_id: number;
  ride_date: string;
  start_location: string;
  end_location: string;
  available_seats: number;
  booked_seats: number;
  per_seat_price: number;
  ride_status: number;
  ride_status_text: string;
  driver_name: string;
  vehicle: CarpoolVehicleMock;
  route_points: CarpoolRoutePointMock[];
}

interface CarpoolTakenMock {
  id: number;
  carpooling_ride_id: number;
  ride_status: number;
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
  start_location: string;
  end_location: string;
  driver_name: string;
  vehicle: CarpoolVehicleMock;
  bill: { base_fare: number; distance_charge: number; time_charge: number; tax: number; total: number; formatted: string };
}

const CARPOOL_BASE_RIDES: CarpoolRideMock[] = [
  {
    id: 811, merchant_ride_id: 811, ride_date: hmGetDate(), start_location: 'Andheri West', end_location: 'Pune Station',
    available_seats: 3, booked_seats: 3, per_seat_price: 150, ride_status: 1, ride_status_text: 'Offer',
    driver_name: 'Amit Sharma', vehicle: { make: 'Toyota', model: 'Innova Crysta', color: 'Silver', number: 'MH-02-AB-1122' },
    route_points: [
      { id: 9001, drop_no: 1, from_location: 'Andheri West', to_location: 'Bandra', from_latitude: 19.1197, from_longitude: 72.8468, to_latitude: 19.0544, to_longitude: 72.8406, estimate_distance: 8.4, final_charges: 450 },
      { id: 9002, drop_no: 2, from_location: 'Andheri West', to_location: 'Kurla', from_latitude: 19.1197, from_longitude: 72.8468, to_latitude: 19.0754, to_longitude: 72.8825, estimate_distance: 11.2, final_charges: 600 },
    ],
  },
  {
    id: 812, merchant_ride_id: 812, ride_date: hmGetDate(), start_location: 'Bandra West', end_location: 'Pune Shivaji Nagar',
    available_seats: 2, booked_seats: 4, per_seat_price: 180, ride_status: 1, ride_status_text: 'Offer',
    driver_name: 'Rahul Verma', vehicle: { make: 'Maruti', model: 'Ertiga', color: 'White', number: 'MH-01-CB-3344' },
    route_points: [
      { id: 9011, drop_no: 1, from_location: 'Bandra West', to_location: 'Dadar', from_latitude: 19.0544, from_longitude: 72.8406, to_latitude: 19.0178, to_longitude: 72.8478, estimate_distance: 4.6, final_charges: 540 },
      { id: 9012, drop_no: 2, from_location: 'Bandra West', to_location: 'Pune Shivaji Nagar', from_latitude: 19.0544, from_longitude: 72.8406, to_latitude: 18.5302, to_longitude: 73.8463, estimate_distance: 151, final_charges: 720 },
    ],
  },
  {
    id: 813, merchant_ride_id: 813, ride_date: hmGetDate(), start_location: 'Kurla', end_location: 'Pune Swargate',
    available_seats: 4, booked_seats: 1, per_seat_price: 160, ride_status: 1, ride_status_text: 'Offer',
    driver_name: 'Priya Nair', vehicle: { make: 'Hyundai', model: 'Creta', color: 'Red', number: 'MH-04-DE-5566' },
    route_points: [
      { id: 9021, drop_no: 1, from_location: 'Kurla', to_location: 'Pune Swargate', from_latitude: 19.0754, from_longitude: 72.8825, to_latitude: 18.5089, to_longitude: 73.8558, estimate_distance: 154, final_charges: 640 },
    ],
  },
];

function carpoolNewOfferMock(body: Record<string, unknown>): CarpoolRideMock {
  const s = state();
  const id = s.carpoolOfferSeq++;
  const seats = Math.max(1, num(body.available_seats, 4));
  const fare = Math.max(1, num(body.estimated_amount, 120));
  return {
    id,
    merchant_ride_id: id,
    ride_date: hmGetDate(),
    start_location: str(body.start_location, 'Andheri West'),
    end_location: str(body.end_location, 'Pune Station'),
    available_seats: seats,
    booked_seats: 0,
    per_seat_price: fare,
    ride_status: 1,
    ride_status_text: 'Offer',
    driver_name: 'You',
    vehicle: { make: 'Maruti', model: 'Ertiga', color: 'White', number: str(body.vehicle_number, 'MH-01-BB-0000') },
    route_points: [
      { id: 9300 + id, drop_no: 1, from_location: str(body.start_location, 'Andheri West'), to_location: str(body.end_location, 'Pune Station'), from_latitude: 19.1197, from_longitude: 72.8468, to_latitude: 18.5204, to_longitude: 73.8567, estimate_distance: 149, final_charges: seats * fare },
    ],
  };
}

function carpoolBuildTakenMock(ride: CarpoolRideMock, seats: number, fare: number): CarpoolTakenMock {
  const base = seats * 40;
  const dist = seats * fare;
  const tax = Math.round((base + dist) * 0.05);
  const total = base + dist + tax;
  return {
    id: state().carpoolTakenSeq++,
    carpooling_ride_id: ride.id,
    ride_status: 2,
    ride_status_text: 'Booked',
    booked_seats: seats,
    total_amount: total,
    formatted_amount: `${CURRENCY}${total}`,
    pickup_location: ride.start_location,
    drop_location: ride.end_location,
    pickup_latitude: 19.1197,
    pickup_longitude: 72.8468,
    drop_latitude: 18.5204,
    drop_longitude: 73.8567,
    ride_date: ride.ride_date,
    start_location: ride.start_location,
    end_location: ride.end_location,
    driver_name: ride.driver_name,
    vehicle: ride.vehicle,
    bill: { base_fare: base, distance_charge: dist, time_charge: 0, tax, total, formatted: `${CURRENCY}${total}` },
  };
}

function carpoolHandleSearchRides(body: Record<string, unknown>): Ok {
  const from = String(body.pickup_location || '').trim().toLowerCase();
  const to = String(body.drop_location || '').trim().toLowerCase();
  const list = CARPOOL_BASE_RIDES.filter(
    (r) => (!from || r.start_location.toLowerCase().includes(from)) && (!to || r.end_location.toLowerCase().includes(to)),
  );
  return ok({ rides: list });
}

function carpoolHandleOfferRide(body: Record<string, unknown>): Ok {
  const ride = carpoolNewOfferMock(body);
  state().carpoolOffers.push(ride);
  return ok({ offer_ride: { id: ride.id, ride_status: ride.ride_status } });
}

function carpoolHandleBookRide(body: Record<string, unknown>): Ok {
  const s = state();
  const rideId = num(body.carpooling_ride_id, 811);
  const ride = CARPOOL_BASE_RIDES.find((r) => r.id === rideId) ?? CARPOOL_BASE_RIDES[0];
  if (!ride) return fail({}, 'Carpool ride not found');
  const seats = Math.max(1, num(body.booked_seats, 1));
  const taken = carpoolBuildTakenMock(ride, seats, ride.per_seat_price);
  s.carpoolTaken.push(taken);
  return ok({ booking: { carpooling_ride_user_detail_id: taken.id, ride_status: taken.ride_status, total_amount: `${taken.total_amount}` } });
}

function carpoolHandleOfferedRides(): Ok {
  const list = [...state().carpoolOffers].reverse();
  return ok({ rides: list });
}

function carpoolHandleTakenRides(): Ok {
  const list = [...state().carpoolTaken].reverse();
  return ok({ rides: list });
}

function carpoolHandleRideDetail(body: Record<string, unknown>): Ok {
  const id = num(body.carpooling_ride_user_detail_id, 0);
  const taken = state().carpoolTaken.find((t) => t.id === id || t.carpooling_ride_id === id);
  const off = state().carpoolOffers.find((o) => o.id === id);
  if (taken) return ok({ ride: taken });
  if (off) return ok({ ride: off });
  return fail({}, 'Carpool ride not found');
}

function carpoolHandleCancelRide(body: Record<string, unknown>): Ok {
  const id = num(body.carpooling_ride_user_detail_id, 0);
  const taken = state().carpoolTaken.find((t) => t.id === id || t.carpooling_ride_id === id);
  if (taken) { taken.ride_status = 6; taken.ride_status_text = 'Cancelled'; return ok(true); }
  return fail({}, 'Carpool ride not found');
}

function carpoolHandleCancelOffer(body: Record<string, unknown>): Ok {
  const id = num(body.carpooling_ride_id, 0);
  const off = state().carpoolOffers.find((o) => o.id === id || o.merchant_ride_id === id);
  if (!off) return fail({}, 'Carpool offer not found');
  off.ride_status = 5;
  off.ride_status_text = 'Cancelled';
  return ok(true);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }): Promise<NextResponse> {
  const { path } = await ctx.params;
  const route = path.join('/');
  const body = await readBody(req);

  try {
    const s = state();
    let data: unknown = {};
    let message = 'OK';

    switch (route) {
      // ------------------------------------------------------------------
      // Boot / auth
      // ------------------------------------------------------------------
      case 'user/configuration': {
        data = {
          app_name: 'Fixcycle',
          business_logo: '',
          language: 'en',
          general_config: {
            splash_screen: 'Fixcycle',
            default_language: 'en',
            guest_user: 1,
            network_code_visibility: 0,
            referral_code_mandatory_user_signup: 0,
            user_cpf_number_enable: 0,
            password_length_for_app: 8,
            encrypt_decrypt_enable: 0,
            cms_pages: [],
          },
          theme_cofig: {
            primary_color_user: '#287e0a',
            user_app_logo: '',
          },
          bg_color_primary: '#1a383b',
          text_color_primary: '#1a383b',
          text_color_secondary: '#4a5953',
          login: { email: 0, phone: 1, otp: 1, skip_login: 0, ignore_login: 0 },
          register: { phone: 1, email: 0, gender: 0, userImage_enable: 0 },
          social: { enable: 0, google: 0, facebook: 0 },
          languages: [{ id: 1, name: 'English', short_name: 'EN' }],
          countries: ALL_COUNTRIES,
        };
        break;
      }

      case 'user/guest/login': {
        data = { access_token: 'mock-guest-token-1', is_guest: true };
        break;
      }

      case 'user/details': {
        const p = s.phase12;
        data = {
          id: 1,
          first_name: 'Guest',
          last_name: 'User',
          UserPhone: '+91 98765 43210',
          phone_code: '+91',
          country_code: 'IN',
          email: 'guest@fixcycle.com',
          user_gender: 'male',
          smoker_type: 'no',
          network_code: '',
          ReferralCode: p.referralCode,
          signup_status: '1',
          wallet_balance: String(p.walletBalance),
          outstanding_amount: '0',
          UserProfileImage: '',
          created_at: '2026-01-10',
        };
        break;
      }

      case 'user/logout': {
        data = {};
        break;
      }

      case 'user/countryList': {
        data = { countries: ALL_COUNTRIES };
        break;
      }

      case 'user/on-board': {
        data = { access_token: 'mock-user-token-1', is_guest: false };
        break;
      }

      case 'user/normal-reg': {
        data = {};
        break;
      }

      // ------------------------------------------------------------------
      // Home
      // ------------------------------------------------------------------
      case 'user/main-screen': {
        data = [
          {
            cell_title: 'ALL_SERVICES',
            cell_name: 'services',
            cell_title_text: 'Services',
            cell_icon: '',
            cell_contents: [
              {
                id: 'taxi',
                title: 'Taxi',
                name: 'Taxi',
                segment_id: '1',
                segment_group_id: 'taxi',
                dynamic_url: '/',
                price_card_owner: 'dynamic',
                multi_store: 0,
                is_coming_soon: 0,
                segment_background_gradient_1: '#287e0a',
                segment_background_gradient_2: '#4ea031',
              },
              {
                id: 'food',
                title: 'Food',
                segment_id: '2',
                segment_group_id: 'food',
                dynamic_url: '/food',
                price_card_owner: '',
                multi_store: 1,
                is_coming_soon: 0,
              },
              {
                id: 'grocery',
                title: 'Groceries',
                segment_id: '3',
                segment_group_id: 'grocery',
                dynamic_url: '/store/3',
                price_card_owner: '',
                multi_store: 1,
                is_coming_soon: 0,
              },
              {
                id: 'pharmacy',
                title: 'Pharmacy',
                segment_id: '4',
                segment_group_id: 'store',
                dynamic_url: '/store/4',
                price_card_owner: '',
                multi_store: 1,
                is_coming_soon: 0,
              },
              {
                id: 'handyman',
                title: 'Handyman',
                segment_id: '6',
                segment_group_id: 'handyman',
                dynamic_url: '/handyman/6',
                price_card_owner: '',
                multi_store: 0,
                is_coming_soon: 0,
              },
              {
                id: 'plumber',
                title: 'Plumber',
                segment_id: '7',
                segment_group_id: 'plumber',
                dynamic_url: '/handyman/7',
                price_card_owner: '',
                multi_store: 0,
                is_coming_soon: 0,
              },
              {
                id: 'salon',
                title: 'Salon & Spa',
                segment_id: '8',
                segment_group_id: 'salon',
                dynamic_url: '/handyman/8',
                price_card_owner: '',
                multi_store: 0,
                is_coming_soon: 0,
              },
              {
                id: 'towing',
                title: 'Vehicle Towing',
                segment_id: '9',
                segment_group_id: 'towing',
                dynamic_url: '/handyman/9',
                price_card_owner: '',
                multi_store: 0,
                is_coming_soon: 0,
              },
              {
                id: 'laundry',
                title: 'Laundry',
                segment_id: '5',
                segment_group_id: 'laundry',
                dynamic_url: '/laundry',
                price_card_owner: '',
                multi_store: 1,
                is_coming_soon: 0,
              },
            ],
          },
          {
            cell_title: 'RECOMMENDED_SERVICE',
            cell_name: 'recommended',
            cell_title_text: 'Recommended for you',
            cell_icon: '',
            cell_contents: [
              { id: 'rec-1', service_name: 'Taxi', description: 'Fast and reliable rides', is_coming_soon: 0, dynamic_url: '/' },
              { id: 'svc-handyman', service_name: 'Handyman', title: 'Handyman & Home Services', business_segment_id: 6, segment_group_id: 2, segment_id: 6, is_coming_soon: 0, dynamic_url: '/handyman/6' },
            ],
          },
          {
            cell_title: 'POPULAR_LAUNDRY',
            cell_name: 'laundry',
            cell_title_text: 'Popular Laundry',
            cell_icon: '',
            cell_contents: [],
            arr_content_data: LD_OUTLETS.slice(0, 3).map((o) => ({
              id: LD_SEGMENT_ID,
              laundry_outlet_id: o.id,
              full_name: o.full_name,
              title: o.full_name,
              image: o.image,
              distance: o.distance,
              is_outlet_open: o.is_outlet_open,
              full_address: o.address,
              latitude: o.latitude,
              longitude: o.longitude,
              rating: Number(o.rating),
              rating_number: Number(o.rating),
              delivery_time: '1 hr',
              delivery_charges: '39',
            })),
          },
          {
            cell_title: 'ADDMONEY',
            cell_name: 'wallet',
            cell_title_text: 'Wallet',
            cell_icon: '',
            cell_contents: [{ id: 'add-1', btntext: 'Add Money', btncolor: '#16a34a' }],
          },
        ];
        break;
      }

      case 'user/areas': {
        // Manual location picker area list. Source: Api\HomeController@Areas /user/areas
        // Zambia (country_id 239) first Ã¢â‚¬â€ provinces + >=10 districts each.
        const zm = (aid: number, province: string, district: string, lat: number, lng: number) => ({
          id: `zm-${aid}`,
          country_id: 239,
          AreaName: district,
          AreaID: `zm-${aid}`,
          AreaName_Parent: province,
          latitude: lat,
          longitude: lng,
        });
        data = [
          // --- Lusaka Province (10 districts) ---
          zm(1001, 'Lusaka', 'Lusaka', -15.3875, 28.3228),
          zm(1002, 'Lusaka', 'Chilanga', -15.5731, 28.3159),
          zm(1003, 'Lusaka', 'Chirundu', -16.3128, 28.7969),
          zm(1004, 'Lusaka', 'Chongwe', -15.33, 28.68),
          zm(1005, 'Lusaka', 'Kafue', -15.7689, 28.1813),
          zm(1006, 'Lusaka', 'Luangwa', -15.6083, 30.3089),
          zm(1007, 'Lusaka', 'Rufunsa', -15.2056, 29.2828),
          zm(1008, 'Lusaka', 'Shibuyunji', -15.4514, 27.6),
          zm(1009, 'Lusaka', 'Kabwe Rural', -14.641, 28.4),
          zm(1010, 'Lusaka', 'Chifwema', -15.5728, 29.5043),
          // --- Copperbelt Province (10 districts) ---
          zm(1101, 'Copperbelt', 'Kitwe', -12.8024, 28.2132),
          zm(1102, 'Copperbelt', 'Ndola', -12.9587, 28.6366),
          zm(1103, 'Copperbelt', 'Chingola', -12.5284, 27.8788),
          zm(1104, 'Copperbelt', 'Mufulira', -12.5408, 28.2513),
          zm(1105, 'Copperbelt', 'Luanshya', -13.1385, 28.3916),
          zm(1106, 'Copperbelt', 'Kalulushi', -12.8415, 28.1025),
          zm(1107, 'Copperbelt', 'Chililabombwe', -12.3666, 27.7988),
          zm(1108, 'Copperbelt', 'Mpongwe', -13.1785, 28.0995),
          zm(1109, 'Copperbelt', 'Masaiti', -13.15, 28.7),
          zm(1110, 'Copperbelt', 'Lufwanyama', -13.6167, 27.5667),
          // --- Central Province (10 districts) ---
          zm(1201, 'Central', 'Kabwe', -14.4499, 28.4464),
          zm(1202, 'Central', 'Chibombo', -14.1969, 28.0247),
          zm(1203, 'Central', 'Kapiri Mposhi', -13.8681, 28.8994),
          zm(1204, 'Central', 'Mkushi', -13.6022, 29.4378),
          zm(1205, 'Central', 'Mumbwa', -14.9995, 27.3073),
          zm(1206, 'Central', 'Serenje', -13.1878, 30.1846),
          zm(1207, 'Central', 'Chisamba', -14.6069, 28.3375),
          zm(1208, 'Central', 'Itezhi-Tezhi', -15.8843, 26.0194),
          zm(1209, 'Central', 'Ngabwe', -14.0125, 28.9639),
          zm(1210, 'Central', 'Luano', -13.5, 29.2),
          // --- Eastern Province (10 districts) ---
          zm(1301, 'Eastern', 'Chipata', -13.6333, 32.65),
          zm(1302, 'Eastern', 'Katete', -14.0778, 32.0369),
          zm(1303, 'Eastern', 'Lundazi', -12.1, 33.05),
          zm(1304, 'Eastern', 'Chadiza', -14.0689, 32.5378),
          zm(1305, 'Eastern', 'Chama', -11.05, 33.4333),
          zm(1306, 'Eastern', 'Petauke', -14.0214, 31.9073),
          zm(1307, 'Eastern', 'Nyimba', -14.2992, 31.4419),
          zm(1308, 'Eastern', 'Mambwe', -13.3708, 31.585),
          zm(1309, 'Eastern', 'Lumezi', -12.0667, 32.5),
          zm(1310, 'Eastern', 'Kasenengwa', -13.5581, 31.6497),
          // --- Luapula Province (10 districts) ---
          zm(1401, 'Luapula', 'Mansa', -11.1422, 28.8742),
          zm(1402, 'Luapula', 'Samfya', -11.3586, 29.4658),
          zm(1403, 'Luapula', 'Nchelenge', -9.7577, 28.03),
          zm(1404, 'Luapula', 'Kawambwa', -9.7897, 29.0783),
          zm(1405, 'Luapula', 'Mwense', -10.3247, 28.2392),
          zm(1406, 'Luapula', 'Milenge', -11.1603, 28.45),
          zm(1407, 'Luapula', 'Chiengi', -9.9689, 28.2422),
          zm(1408, 'Luapula', 'Chembe', -11.7003, 28.7492),
          zm(1409, 'Luapula', 'Chipili', -10.0833, 28.6833),
          zm(1410, 'Luapula', 'Lunga', -10.2, 28.9),
          // --- Muchinga Province (10 districts) ---
          zm(1501, 'Muchinga', 'Chinsali', -10.5419, 32.1486),
          zm(1502, 'Muchinga', 'Mpika', -11.6133, 31.12),
          zm(1503, 'Muchinga', 'Isoka', -10.0822, 32.366),
          zm(1504, 'Muchinga', 'Nakonde', -9.5481, 32.4369),
          zm(1505, 'Muchinga', 'Mafinga', -9.7361, 32.8856),
          zm(1506, 'Muchinga', 'Kanchibiya', -11.2979, 31.5),
          zm(1507, 'Muchinga', 'Lavushimanda', -12.9167, 30.2),
          zm(1508, 'Muchinga', "Shiwang'andu", -10.1344, 32.3681),
          zm(1509, 'Muchinga', 'Chilinda', -11.05, 32.05),
          zm(1510, 'Muchinga', 'Nsama', -9.1572, 32.4),
          // --- Northern Province (10 districts) ---
          zm(1601, 'Northern', 'Kasama', -10.5651, 30.7358),
          zm(1602, 'Northern', 'Mbala', -8.8374, 31.3912),
          zm(1603, 'Northern', 'Mporokoso', -9.6286, 30.9925),
          zm(1604, 'Northern', 'Mpulungu', -8.806, 31.29),
          zm(1605, 'Northern', 'Kaputa', -9.3841, 29.8),
          zm(1606, 'Northern', 'Lupososhi', -11.8, 31.15),
          zm(1607, 'Northern', 'Senga Hill', -8.7839, 30.7742),
          zm(1608, 'Northern', 'Luwingu', -10.08, 29.33),
          zm(1609, 'Northern', 'Mungwi', -9.8, 31.85),
          zm(1610, 'Northern', 'Chilubi', -11.0406, 29.6822),
          // --- North-Western Province (10 districts) ---
          zm(1701, 'North-Western', 'Solwezi', -12.3328, 26.2011),
          zm(1702, 'North-Western', 'Kasempa', -13.05, 25.6),
          zm(1703, 'North-Western', 'Kabompo', -13.3, 24.2),
          zm(1704, 'North-Western', 'Mufumbwe', -11.7, 24.8631),
          zm(1705, 'North-Western', 'Mwinilunga', -11.25, 24.3561),
          zm(1706, 'North-Western', 'Chavuma', -13.1333, 23.4167),
          zm(1707, 'North-Western', 'Ikelenge', -11.06, 24.03),
          zm(1708, 'North-Western', 'Zambezi', -13.3386, 23.1489),
          zm(1709, 'North-Western', 'Manyinga', -12.55, 24.2),
          zm(1710, 'North-Western', 'Mushindamo', -12.25, 26.4),
          // --- Southern Province (10 districts) ---
          zm(1801, 'Southern', 'Choma', -16.8488, 26.98),
          zm(1802, 'Southern', 'Livingstone', -17.8546, 25.8502),
          zm(1803, 'Southern', 'Mazabuka', -15.8354, 27.7),
          zm(1804, 'Southern', 'Monze', -16.2628, 27.856),
          zm(1805, 'Southern', 'Kalomo', -17.0758, 26.7803),
          zm(1806, 'Southern', 'Namwala', -15.4142, 26.5342),
          zm(1807, 'Southern', 'Siavonga', -16.3, 28.4),
          zm(1808, 'Southern', 'Chikankata', -16.3, 27.9814),
          zm(1809, 'Southern', 'Gwembe', -16.4658, 27.9022),
          zm(1810, 'Southern', 'Sinazongwe', -16.0981, 27.6131),
          // --- Western Province (10 districts) ---
          zm(1901, 'Western', 'Mongu', -15.9306, 23.4978),
          zm(1902, 'Western', 'Kaoma', -15.6823, 24.72),
          zm(1903, 'Western', 'Senanga', -16.15, 23.99),
          zm(1904, 'Western', 'Kalabo', -15.0231, 22.2192),
          zm(1905, 'Western', 'Limulunga', -15.08, 23.1792),
          zm(1906, 'Western', 'Lukulu', -14.3942, 23.0586),
          zm(1907, 'Western', 'Sesheke', -17.4579, 24.3091),
          zm(1908, 'Western', 'Shangombo', -16.3397, 23.0112),
          zm(1909, 'Western', 'Nalolo', -15.0544, 23.5272),
          zm(1910, 'Western', 'Sikongo', -14.0875, 22.8069),
          // --- India (unchanged, no coords -> services stay gated off) ---
          { id: '1', country_id: 91, name: 'Mumbai' },
          { id: '2', country_id: 91, name: 'Delhi' },
        ];
        break;
      }

      case 'user/search/places': {
        const keyword = String(body['keyword'] ?? '');
        const place = (id: string, mainText: string, secondaryText: string, lat: number, lng: number) => ({
          place_id: id,
          structured_formatting: { main_text: mainText, secondary_text: secondaryText },
          geometry: { location: { lat, lng } },
        });
        const places = [
          // Zambia Ã¢â‚¬â€ Lusaka first (country_id 239)
          place('zm-1', 'Lusaka City Centre', 'Lusaka, Zambia', -15.3875, 28.3228),
          place('zm-2', 'Woodlands, Lusaka', 'Lusaka, Zambia', -15.4126, 28.2685),
          place('zm-3', 'Kabulonga, Lusaka', 'Lusaka, Zambia', -15.4331, 28.2993),
          place('zm-4', 'Roma, Lusaka', 'Lusaka, Zambia', -15.3946, 28.2899),
          place('zm-5', 'Ibex Hill, Lusaka', 'Lusaka, Zambia', -15.4086, 28.3341),
          place('zm-6', 'Chelston, Lusaka', 'Lusaka, Zambia', -15.369, 28.383),
          place('zm-7', 'Makeni, Lusaka', 'Lusaka, Zambia', -15.4606, 28.2592),
          place('zm-8', 'Longacres, Lusaka', 'Lusaka, Zambia', -15.4014, 28.3228),
          place('zm-9', 'Chilanga', 'Lusaka, Zambia', -15.5731, 28.3159),
          place('zm-10', 'Chongwe', 'Lusaka, Zambia', -15.33, 28.68),
          place('zm-11', 'Kafue', 'Lusaka, Zambia', -15.7689, 28.1813),
          place('zm-12', 'Kitwe', 'Copperbelt, Zambia', -12.8024, 28.2132),
          // India Ã¢â‚¬â€ unchanged
          place('ch-1', 'Andheri West', 'Mumbai, Maharashtra', 19.1197, 72.8468),
          place('ch-2', 'Bandra West', 'Mumbai, Maharashtra', 19.0544, 72.8406),
          place('ch-3', 'Colaba Causeway', 'Mumbai, Maharashtra', 18.9076, 72.8147),
        ];
        const needle = keyword.trim().toLowerCase();
        const matched =
          needle.length > 0
            ? places.filter((p) => p.structured_formatting.main_text.toLowerCase().includes(needle) || p.structured_formatting.secondary_text.toLowerCase().includes(needle))
            : places;
        data = [{ keyword, google_response: matched.length > 0 ? matched : places }];
        break;
      }

      case 'user/promotion/notification': {
        data = [
          { id: '1', title: 'Welcome Bonus!', description: 'Get K100 off on your first 3 rides. Use code WELCOME.', image: '', expiry_date: '2026-06-30', created_at: '2026-03-01' },
          { id: '2', title: 'Refer & Earn', description: 'Invite friends and earn K200 for each successful referral.', image: '', expiry_date: '2026-12-31', created_at: '2026-03-10' },
        ];
        break;
      }

      case 'get-navigation-drawer-config': {
        const item = (uid: string, icon: string, title: string, screenName: string) => ({
          drawer_name: 'DRAWER_ITEMS_TILE',
          drawer_definition: { uid, type: 'icon', icon, title, screen_name: screenName },
        });
        data = {
          drawer_backgroud: '#1a383b',
          data: [
            { drawer_name: 'DRAWER_HEADER', drawer_definition: { image: '', background_color: '#1a383b', text_color: '#ffffff', secondary_text_color: '#cbd5e1' } },
            { ...item('p12-profile', 'account', 'My Profile', 'PROFILE') },
            { ...item('p12-history', 'history', 'My History', 'MY_HISTORY') },
            { ...item('p12-wallet', 'wallet', 'Wallet', 'WALLET') },
            { ...item('p12-cards', 'card', 'My Cards', 'CARDS') },
            { ...item('p12-sos', 'sos', 'SOS Contacts', 'SOS') },
            { ...item('p12-favourites', 'star', 'Favourites', 'FAVOURITES') },
            { ...item('p12-family', 'user', 'Family', 'FAMILY') },
            { ...item('p12-refer', 'promo', 'Refer & Earn', 'REFER') },
            { ...item('p12-rewards', 'star', 'Rewards', 'REWARDS') },
            { ...item('p12-subscriptions', 'card', 'Subscriptions', 'SUBSCRIPTIONS') },
            { ...item('p12-chat', 'chat', 'Live Chat', 'CHAT') },
            { ...item('p12-support', 'support', 'Support', 'SUPPORT') },
            { ...item('p12-pricecard', 'document', 'Price Card', 'PRICECARD') },
            { ...item('p12-promotions', 'promo', 'Promotions', 'PROMOTIONS') },
            { ...item('p12-settings', 'settings', 'Settings', 'SETTINGS') },
          ],
          logout_button: { background_color: '#dc2626', text_color: '#ffffff', button_text: 'Logout' },
        };
        break;
      }

      case 'get-navigation-drawer': {
        data = {
          id: '1',
          name: 'Fixcycle User Menu',
          merchant_id: '1',
          config: {},
          menu_options: { WALLET: '/wallet', MY_HISTORY: '/history', PROFILE: '/profile' },
        };
        break;
      }

      // ------------------------------------------------------------------
      // Ride: plan
      // ------------------------------------------------------------------
      case 'user/cars': {
        const vehicles = [
          { id: '11', vehicleTypeName: 'Mini', vehicleTypeDescription: 'Small rides, low fare', vehicleTypeImage: '', ride_now: 1, ride_later: 1, estimate_fare: `${CURRENCY} 145` },
          { id: '12', vehicleTypeName: 'Sedan', vehicleTypeDescription: 'Comfortable sedans', vehicleTypeImage: '', ride_now: 1, ride_later: 1, estimate_fare: `${CURRENCY} 185` },
          { id: '13', vehicleTypeName: 'SUV', vehicleTypeDescription: 'Spacious for groups', vehicleTypeImage: '', ride_now: 1, ride_later: 1, estimate_fare: `${CURRENCY} 240` },
        ];
        data = {
          config_data: { currency: CURRENCY, is_geofence: 0 },
          response_data: {
            id: body['segment_id'] ?? '1',
            country_id: '91',
            merchant_id: '1',
            service_types: [
              { id: '1001', serviceName: 'Taxi', sequence: 1, type: '1', vehicles, arr_category: [] },
              { id: '1002', serviceName: 'Premium', sequence: 2, type: '1', vehicles: [], arr_category: [] },
            ],
          },
        };
        break;
      }

      case 'user/driver': {
        const lat = num(body['latitude'], 19.076);
        const lng = num(body['longitude'], 72.877);
        data = {
          response_data: [
            { id: '501', driver_id: '88', current_latitude: lat + 0.004, current_longitude: lng + 0.004, vehicleTypeMapImage: '', last_location_update_time: 'now' },
            { id: '502', driver_id: '99', current_latitude: lat - 0.006, current_longitude: lng + 0.008, vehicleTypeMapImage: '', last_location_update_time: 'now' },
            { id: '503', driver_id: '77', current_latitude: lat + 0.01, current_longitude: lng - 0.007, vehicleTypeMapImage: '', last_location_update_time: 'now' },
          ],
        };
        break;
      }

      // ------------------------------------------------------------------
      // Ride: checkout -> confirm
      // ------------------------------------------------------------------
      case 'user/checkout': {
        const invoiceId = `ck-${(s.checkoutSeq += 1)}`;
        const ref: CheckoutRef = {
          pickupLat: num(body['pickup_latitude'], 19.076),
          pickupLng: num(body['pickup_longitude'], 72.877),
          dropLat: num(body['drop_latitude'] ?? parseDrop(body, 'drop_latitude'), 19.05),
          dropLng: num(body['drop_longitude'] ?? parseDrop(body, 'drop_longitude'), 72.84),
          pickupName: str(body['pick_up_location'], 'Pickup'),
          dropName: str(body['drop_location'] ?? parseDrop(body, 'drop_location') ?? '', 'Drop'),
          segmentId: (body['segment_id'] as string | number | undefined) ?? '1',
          serviceType: (body['service_type'] as string | number | undefined) ?? '1001',
          vehicleType: (body['vehicle_type'] as string | number | undefined) ?? '11',
          vehicleName: 'Mini',
          promoApplied: false,
        };
        s.checkouts.set(invoiceId, ref);
        const result = checkoutDate(ref);
        result['id'] = invoiceId;
        data = result;
        break;
      }

      case 'user/checkout/apply-promo': {
        const id = str(body['checkout_id'], '');
        const ref = getCheckoutRef(id);
        if (ref) {
          ref.promoApplied = true;
          const result = checkoutDate(ref);
          result['id'] = id;
          data = result;
        } else {
          data = {};
        }
        break;
      }

      case 'user/checkout/remove-promo': {
        const id = str(body['checkout_id'], '');
        const ref = getCheckoutRef(id);
        if (ref) {
          ref.promoApplied = false;
          const result = checkoutDate(ref);
          result['id'] = id;
          data = result;
        } else {
          data = {};
        }
        break;
      }

      case 'user/payment-option': {
        data = [
          { id: 1, name: 'Cash', card_id: null, action: true, icon: '', message: '' },
          { id: 2, name: 'Wallet', card_id: null, action: true, icon: '', message: '' },
        ];
        break;
      }

      case 'user/checkout-payment': {
        const ref = getCheckoutRef(String(body['checkout'] ?? ''));
        const result = ref ? checkoutDate(ref) : {};
        result['id'] = body['checkout'];
        data = result;
        break;
      }

      case 'user/checkout-additional-info': {
        data = { ok: true, message: 'Saved' };
        break;
      }

      case 'user/confirm': {
        const checkoutId = str(body['checkout'], '');
        const ref = getCheckoutRef(checkoutId);
        const id = `bk-${(s.bookingSeq += 1)}`;
        const amount = ref ? Number((checkoutDate(ref)['estimate_bill_without_format'] as number) ?? 118) : 118;
        s.bookings.set(id, { id, checkoutId, createdAt: Date.now(), segmentId: ref?.segmentId ?? (body['segment_id'] as string | number | undefined) ?? '1', amount });
        data = { id, booking_type: 1, merchant_booking_id: 987654 };
        break;
      }

      case 'user/check-booking-status': {
        const booking = s.bookings.get(str(body['booking_id'], ''));
        data = { booking_status: booking ? bookingStatusAt(booking).status : '1001' };
        break;
      }

      // ------------------------------------------------------------------
      // Ride: tracking / receipt / cancel / sos / rate
      // ------------------------------------------------------------------
      case 'user/booking/details': {
        const booking = s.bookings.get(str(body['booking_id'], ''));
        data = booking ? bookingData(booking) : {};
        break;
      }

      case 'user/booking/tracking': {
        const booking = s.bookings.get(str(body['booking_id'], ''));
        if (!booking) {
          data = {
            booking_status: '1001',
            cancelable: true,
            polydata: {},
            movable_marker_type: {},
            location_updates: {},
          };
          break;
        }
        const { status, progress } = bookingStatusAt(booking);
        const ref = getCheckoutRef(booking.checkoutId);
        const driverPos = ref ? interpolate(ref.pickupLat, ref.pickupLng, ref.dropLat, ref.dropLng, Math.max(0.05, progress)) : { lat: 19.076, lng: 72.877 };
        data = {
          booking_status: status,
          cancelable: status === '1001' || status === '1002',
          movable_marker_type:
            status === '1001'
              ? {}
              : {
                  driver_marker_name: 'Vikram Sharma',
                  driver_marker_type: 'taxi',
                  driver_marker_lat: driverPos.lat,
                  driver_marker_long: driverPos.lng,
                  driver_marker_bearing: 45,
                },
          polydata: ref ? { polyline_width: '5', polyline_color: '#f76f01', polyline: polylineFor(ref, progress) } : {},
          location: {},
          location_updates:
            status === '1001'
              ? {}
              : {
                  eta: `${Math.max(1, Math.round((1 - progress) * 20))} min`,
                  distance: `${((1 - progress) * 3.4).toFixed(1)} km`,
                  distance_in_meter: Math.round((1 - progress) * 3400),
                  time_in_min: String(Math.max(1, Math.round((1 - progress) * 20))),
                  driver_full_name: 'Vikram Sharma',
                  vehicle: 'Maruti WagonR',
                  vehicle_color: 'White',
                  vehicle_number: 'MH 01 AB 1234',
                  vehicle_image: '',
                  driver_image: '',
                },
          live_distance: `${((1 - progress) * 3.4).toFixed(1)} km`,
          live_time: `${Math.max(1, Math.round((1 - progress) * 20))} min`,
          speed: `${Math.round(28 + progress * 12)} km/h`,
        };
        break;
      }

      case 'user/receipt': {
        const booking = s.bookings.get(str(body['booking_id'], ''));
        const status = booking ? bookingStatusAt(booking).status : '1005';
        const amount = booking?.amount ?? 118;
        data = {
          estimate_price: `${CURRENCY} ${amount.toFixed(2)}`,
          holder_ride_info: {
            value_text: `${CURRENCY} ${amount.toFixed(2)}`,
            left_text: 'Trip fare',
            right_text: 'Paid in cash',
            pick_locaion: 'Pickup',
            drop_location: 'Drop',
            circular_text: 'Trip completed',
            circular_image: '',
            static_values: [
              { parameterType: 'text', parameter: 'Base fare', amount: `${CURRENCY} 80.00`, type: 'row' },
              { parameterType: 'text', parameter: 'Distance (3.4 km)', amount: `${CURRENCY} 40.80`, type: 'row' },
              { parameterType: 'text', parameter: 'Taxes & fees', amount: `${CURRENCY} 0.20`, type: 'row' },
              { parameterType: 'divider' },
              { parameterType: 'total', parameter: 'Total', amount: `${CURRENCY} ${amount.toFixed(2)}`, type: 'total' },
            ],
            multiple_drop_location: [],
          },
          holder_driver_rating: {
            driver_data: { booking_id: booking?.id ?? 'bk-1', text: 'How was your ride with Vikram?', image: '' },
          },
          holder_driver_favourite: {
            driver_data: { driver_id: '88', already_added: 0, text: 'Save this driver', image: '' },
          },
          holder_bottom_button: { text: 'Done', action: 'DONE', payment_method_id: 1 },
          ride_tip: { text: 'Add a tip', action: 'TIP', data: { text: 'Add a tip', action: 'TIP' } },
        };
        void status;
        break;
      }

      case 'user/add-tip': {
        data = { ok: true };
        break;
      }

      case 'user/cancel-reasons': {
        data = {
          response_data: [
            { id: '1', reason: 'Driver is taking too long' },
            { id: '2', reason: 'Driver declined' },
            { id: '3', reason: 'Wrong address' },
            { id: '4', reason: 'Change of plans' },
          ],
          code: '4400',
          cancel_charges: '0',
        };
        break;
      }

      case 'user/booking/cancel': {
        s.bookings.delete(str(body['booking_id'], ''));
        data = { ok: true };
        break;
      }

      case 'user/booking/autocancel': {
        s.bookings.delete(str(body['booking_id'], ''));
        data = { booking_status: '0' };
        break;
      }

      case 'user/increaseRideRequestArea': {
        data = { ok: true };
        break;
      }

      case 'user/booking/change_address': {
        data = { ok: true };
        break;
      }

      case 'sos': {
        data = [
          { id: '1', number: '+91 91234 56780', name: 'Emergency' },
          { id: '2', number: '+91 99887 76655', name: 'Family' },
        ];
        break;
      }

      case 'user/sos/request': {
        data = {
          id: 'sos-1',
          number: str(body['number'], ''),
          latitude: num(body['latitude'], 0),
          longitude: num(body['longitude'], 0),
          location_name: str(body['location_name'], ''),
        };
        break;
      }

      case 'user/rate-to-driver': {
        data = { ok: true, message: 'Thanks for your feedback' };
        break;
      }

      // ------------------------------------------------------------------
      // Food ordering (Phase 7)
      // ------------------------------------------------------------------
      case 'user/food/store-list': {
        const stores = [
          { id: 301, full_name: 'Spice Garden', address: '12 MG Road, Mumbai', latitude: 19.076, longitude: 72.877, rating: 4.5, review_count: 120, delivery_time_min: 25, delivery_time_max: 40, delivery_fee: 30, minimum_order: 150, is_open: 1, cuisines: 'North Indian, Mughlai', business_logo: '', is_favourite: 0 },
          { id: 302, full_name: 'Pizza Palace', address: '45 Link Road, Mumbai', latitude: 19.08, longitude: 72.88, rating: 4.2, review_count: 85, delivery_time_min: 30, delivery_time_max: 45, delivery_fee: 40, minimum_order: 200, is_open: 1, cuisines: 'Italian, Pizza, Pasta', business_logo: '', is_favourite: 0 },
          { id: 303, full_name: 'Burger Barn', address: '78 Hill Road, Mumbai', latitude: 19.07, longitude: 72.87, rating: 4.0, review_count: 60, delivery_time_min: 20, delivery_time_max: 35, delivery_fee: 25, minimum_order: 100, is_open: 1, cuisines: 'Burgers, Fast Food', business_logo: '', is_favourite: 0 },
          { id: 304, full_name: 'Green Leaf Cafe', address: '9 Marine Drive, Mumbai', latitude: 19.06, longitude: 72.86, rating: 4.6, review_count: 40, delivery_time_min: 20, delivery_time_max: 30, delivery_fee: 20, minimum_order: 120, is_open: 0, cuisines: 'Healthy, Salads, Juices', business_logo: '', is_favourite: 0 },
        ];
        data = { business_segments: stores };
        break;
      }

      case 'user/food/store-details': {
        const sid = num(body['business_segment_id'] ?? body['id'], 301);
        const allProducts: Record<number, Array<Record<string, unknown>>> = {
          301: [
            { id: 501, product_name: 'Butter Chicken', description: 'Creamy tomato curry with tender chicken', price: 280, category_id: 101, store_id: 301, is_veg: 0, is_available: 1, image: '', variants: [{ id: 601, name: 'Regular', price: 280 }, { id: 602, name: 'Large', price: 420 }], options: [{ id: 701, name: 'Extra Naan', price: 40, type: 'addon' }, { id: 702, name: 'Raita', price: 30, type: 'addon' }] },
            { id: 502, product_name: 'Paneer Tikka', description: 'Smoky grilled cottage cheese cubes', price: 220, category_id: 101, store_id: 301, is_veg: 1, is_available: 1, image: '', variants: [], options: [] },
            { id: 503, product_name: 'Dal Makhani', description: 'Slow-cooked black lentils in butter', price: 180, category_id: 102, store_id: 301, is_veg: 1, is_available: 1, image: '', variants: [], options: [] },
            { id: 504, product_name: 'Biryani', description: 'Aromatic basmati rice with spices', price: 250, category_id: 102, store_id: 301, is_veg: 0, is_available: 1, image: '', variants: [{ id: 603, name: 'Regular', price: 250 }, { id: 604, name: 'Family', price: 450 }], options: [{ id: 703, name: 'Boiled Egg', price: 20, type: 'addon' }] },
            { id: 505, product_name: 'Gulab Jamun', description: 'Soft milk dumplings in sugar syrup', price: 80, category_id: 103, store_id: 301, is_veg: 1, is_available: 1, image: '', variants: [], options: [] },
            { id: 506, product_name: 'Masala Chai', description: 'Hot spiced milk tea', price: 40, category_id: 104, store_id: 301, is_veg: 1, is_available: 1, image: '', variants: [], options: [] },
          ],
          302: [
            { id: 511, product_name: 'Margherita Pizza', description: 'Classic tomato and mozzarella', price: 199, category_id: 105, store_id: 302, is_veg: 1, is_available: 1, image: '', variants: [{ id: 611, name: 'Regular', price: 199 }, { id: 612, name: 'Large', price: 349 }], options: [{ id: 711, name: 'Extra Cheese', price: 60, type: 'addon' }] },
            { id: 512, product_name: 'Pepperoni Pizza', description: 'Loaded with pepperoni and cheese', price: 299, category_id: 105, store_id: 302, is_veg: 0, is_available: 1, image: '', variants: [{ id: 613, name: 'Regular', price: 299 }, { id: 614, name: 'Large', price: 449 }], options: [] },
          ],
          303: [
            { id: 521, product_name: 'Classic Burger', description: 'Beef patty, lettuce, tomato, special sauce', price: 149, category_id: 106, store_id: 303, is_veg: 0, is_available: 1, image: '', variants: [{ id: 621, name: 'Single', price: 149 }, { id: 622, name: 'Double', price: 249 }], options: [{ id: 721, name: 'Cheese Slice', price: 25, type: 'addon' }, { id: 722, name: 'Bacon', price: 50, type: 'addon' }] },
            { id: 522, product_name: 'Crispy Fries', description: 'Golden fried potato fries', price: 99, category_id: 106, store_id: 303, is_veg: 1, is_available: 1, image: '', variants: [], options: [] },
          ],
        };
        const cats: Record<number, Array<Record<string, unknown>>> = {
          301: [{ id: 101, category_name: 'Starters', sequence: 1 }, { id: 102, category_name: 'Main Course', sequence: 2 }, { id: 103, category_name: 'Desserts', sequence: 3 }, { id: 104, category_name: 'Beverages', sequence: 4 }],
          302: [{ id: 105, category_name: 'Pizzas', sequence: 1 }],
          303: [{ id: 106, category_name: 'Burgers & Sides', sequence: 1 }],
        };
        const storeList = [
          { id: 301, full_name: 'Spice Garden', address: '12 MG Road, Mumbai', latitude: 19.076, longitude: 72.877, rating: 4.5, review_count: 120, delivery_time_min: 25, delivery_time_max: 40, delivery_fee: 30, minimum_order: 150, is_open: 1, cuisines: 'North Indian, Mughlai', business_logo: '', is_favourite: 0, opening_time: '10:00 AM', closing_time: '11:00 PM' },
          { id: 302, full_name: 'Pizza Palace', address: '45 Link Road, Mumbai', latitude: 19.08, longitude: 72.88, rating: 4.2, review_count: 85, delivery_time_min: 30, delivery_time_max: 45, delivery_fee: 40, minimum_order: 200, is_open: 1, cuisines: 'Italian, Pizza, Pasta', business_logo: '', is_favourite: 0 },
          { id: 303, full_name: 'Burger Barn', address: '78 Hill Road, Mumbai', latitude: 19.07, longitude: 72.87, rating: 4.0, review_count: 60, delivery_time_min: 20, delivery_time_max: 35, delivery_fee: 25, minimum_order: 100, is_open: 1, cuisines: 'Burgers, Fast Food', business_logo: '', is_favourite: 0 },
        ];
        const store = storeList.find((s) => s.id === sid) ?? storeList[0];
        data = {
          business_segment: store,
          categories: (cats[sid] ?? cats[301]),
          products: (allProducts[sid] ?? allProducts[301]),
        };
        break;
      }

      case 'user/food/cart':
      case 'user/food/cart/add':
      case 'user/food/cart/update':
      case 'user/food/cart/remove':
      case 'user/food/cart/clear': {
        const key = `food_cart:${str(body['_mockUser'], 'guest')}`;
        let cart = (s as unknown as Record<string, unknown>)[key] as Array<Record<string, unknown>> | undefined;
        if (!cart) {
          cart = [];
          (s as unknown as Record<string, unknown>)[key] = cart;
        }
        if (route === 'user/food/cart/add') {
          const pid = num(body['product_id'], 0);
          const qty = num(body['quantity'], 1);
          const vid = body['variant_id'] != null ? num(body['variant_id'], 0) : null;
          const oids = Array.isArray(body['option_ids']) ? (body['option_ids'] as number[]) : [];
          const price = pid >= 500 ? 200 : 150;
          cart.push({ cart_id: `fc-${Date.now()}`, product_id: pid, product_name: pid >= 500 ? 'Butter Chicken' : 'Item', price, quantity: qty, variant_id: vid, variant_name: '', option_ids: oids, total_amount: price * qty, is_veg: 1, image: '', store_id: 301 });
        } else if (route === 'user/food/cart/update') {
          const cid = str(body['cart_id'], '');
          const item = cart.find((i) => String(i['cart_id']) === cid);
          if (item) item['quantity'] = num(body['quantity'], 1);
        } else if (route === 'user/food/cart/remove') {
          const cid = str(body['cart_id'], '');
          const idx = cart.findIndex((i) => String(i['cart_id']) === cid);
          if (idx >= 0) cart.splice(idx, 1);
        } else if (route === 'user/food/cart/clear') {
          cart.length = 0;
        }
        data = { products: cart, total_items: cart.length };
        break;
      }

      case 'user/food/apply-promo': {
        const code = String(body['promo_code'] ?? '').toUpperCase();
        if (code === 'WELCOME10') data = { promo_code: 'WELCOME10', valid: true, discount_type: 'percentage', discount_value: 10, max_discount: 50, min_order: 100, message: 'Promo applied' };
        else if (code === 'FLAT50') data = { promo_code: 'FLAT50', valid: true, discount_type: 'flat', discount_value: 50, max_discount: 50, min_order: 200, message: 'Promo applied' };
        else { data = {}; return NextResponse.json(fail(data, 'Invalid promo code')); }
        break;
      }

      case 'user/food/checkout': {
        const oid = `fck-${Date.now()}`;
        data = { id: oid, store_id: num(body['business_segment_id'], 301), store_name: 'Spice Garden', products: [], subtotal: 280, delivery_fee: 30, tax: 14, discount_amount: 0, promo_code: '', total_amount: 324, delivery_mode: num(body['delivery_mode'], 1), payment_mode: str(body['payment_mode'], '1'), address: str(body['address'], ''), latitude: 19.076, longitude: 72.877, payment_methods: [{ id: '1', name: 'Cash', card_id: null }, { id: '2', name: 'Wallet', card_id: null }] };
        break;
      }

      case 'user/food/place-order': {
        const orderId = `fo-${Date.now()}`;
        data = { id: orderId, order_number: Math.floor(Date.now() / 1000), order_status: 1, message: 'Order placed' };
        break;
      }

      case 'user/food/order-detail':
      case 'user/food/track': {
        const oid = str(body['order_id'] ?? body['id'], 'fo-1');
        data = { id: oid, order_number: Math.floor(Date.now() / 1000), order_status: 1, store_id: 301, store_name: 'Spice Garden', full_name: 'Spice Garden', store_address: '12 MG Road, Mumbai', products: [{ cart_id: 'fc-1', product_id: 501, product_name: 'Butter Chicken', price: 280, quantity: 1, variant_id: 601, variant_name: 'Regular', option_ids: [], total_amount: 280, is_veg: 0, image: '', store_id: 301 }], subtotal: 280, delivery_fee: 30, tax: 14, discount_amount: 0, promo_code: '', total_amount: 324, delivery_mode: 1, payment_mode: '1', payment_mode_name: 'Cash', address: 'Home', latitude: 19.076, longitude: 72.877, created_at: Date.now() - 30000, cancel_able: true, rate: null, status_text: 'Placed', ticket: 0 };
        break;
      }

      case 'user/food/orders': {
        data = [];
        break;
      }

      case 'user/food/cancel': {
        data = { id: str(body['order_id'], ''), order_status: 2, message: 'Order cancelled' };
        break;
      }

      case 'user/food/rate': {
        data = { ok: true, message: 'Thanks for your feedback' };
        break;
      }

      case 'user/food/reorder': {
        data = { products: [], total_items: 0 };
        break;
      }

      case 'user/food/chat': {
        data = { user_name: 'Spice Garden', user_image: '', chat: [] };
        break;
      }

      case 'user/food/chat/send': {
        data = { ok: true, message: 'Sent' };
        break;
      }

      // ------------------------------------------------------------------
      // Store ordering (Phase 8 Ã¢â‚¬â€ grocery, pharmacy, generic)
      // ------------------------------------------------------------------
      case 'user/store/store-list': {
        const slug = String(body['slug'] ?? 'grocery');
        const base = slug === 'pharmacy' ? 400 : slug === 'store' ? 400 : 400;
        data = {
          business_segments: [
            { id: base + 1, full_name: slug === 'pharmacy' ? 'MedPlus Pharmacy' : 'QuickMart', address: '15 Linking Road, Mumbai', latitude: 19.076, longitude: 72.877, rating: 4.3, review_count: 80, delivery_time_min: 20, delivery_time_max: 40, delivery_fee: 25, minimum_order: 99, is_open: 1, sub_group_for_app: 2, business_logo: '', is_favourite: 0, slug },
            { id: base + 2, full_name: slug === 'pharmacy' ? 'Wellness Drugstore' : 'FreshBazaar', address: '22 SV Road, Andheri', latitude: 19.08, longitude: 72.88, rating: 4.1, review_count: 55, delivery_time_min: 25, delivery_time_max: 45, delivery_fee: 30, minimum_order: 149, is_open: 1, sub_group_for_app: 2, business_logo: '', is_favourite: 0, slug },
            { id: base + 3, full_name: slug === 'pharmacy' ? 'LifeCare Chemist' : 'GreenBasket', address: '7 Hill Road, Bandra', latitude: 19.07, longitude: 72.87, rating: 4.5, review_count: 120, delivery_time_min: 15, delivery_time_max: 30, delivery_fee: 20, minimum_order: 79, is_open: 0, sub_group_for_app: 2, business_logo: '', is_favourite: 0, slug },
          ],
        };
        break;
      }

      case 'user/store/store-details': {
        const sid = num(body['business_segment_id'] ?? body['store_id'] ?? body['id'], 401);
        const isPharmacyStore = sid >= 400 && sid <= 499;
        const storeProducts: Record<number, Array<Record<string, unknown>>> = {
          401: [
            { id: 701, product_name: 'Organic Apples', description: 'Fresh 1 kg pack', price: 180, category_id: 801, store_id: 401, is_veg: 1, is_available: 1, image: '', weight: '1 kg', variants: [{ id: 801, name: '500 g', price: 95 }, { id: 802, name: '1 kg', price: 180 }], options: [{ id: 901, name: 'Gift Wrap', price: 15, type: 'addon' }] },
            { id: 702, product_name: 'Whole Wheat Bread', description: '500 g loaf', price: 45, category_id: 801, store_id: 401, is_veg: 1, is_available: 1, image: '', weight: '500 g', variants: [], options: [] },
            { id: 703, product_name: 'Almond Milk', description: 'Unsweetened 1 L', price: 120, category_id: 802, store_id: 401, is_veg: 1, is_available: 1, image: '', weight: '1 L', variants: [], options: [] },
            { id: 704, product_name: 'Greek Yogurt', description: 'Natural 400 g', price: 85, category_id: 802, store_id: 401, is_veg: 1, is_available: 1, image: '', weight: '400 g', variants: [{ id: 803, name: '200 g', price: 50 }, { id: 804, name: '400 g', price: 85 }], options: [] },
            { id: 705, product_name: 'Chicken Breast', description: 'Boneless 500 g', price: 260, category_id: 803, store_id: 401, is_veg: 0, is_available: 1, image: '', weight: '500 g', variants: [], options: [] },
            { id: 706, product_name: 'Basmati Rice', description: 'Premium 1 kg', price: 150, category_id: 804, store_id: 401, is_veg: 1, is_available: 1, image: '', weight: '1 kg', variants: [{ id: 805, name: '1 kg', price: 150 }, { id: 806, name: '5 kg', price: 680 }], options: [] },
          ],
          402: [
            { id: 711, product_name: 'Paracetamol 500mg', description: 'Strip of 10 tablets', price: 25, category_id: 805, store_id: 402, is_veg: 1, is_available: 1, image: '', weight: '10 tabs', variants: [], options: [], prescription: 0 },
            { id: 712, product_name: 'Cetirizine 10mg', description: 'Strip of 10 tablets', price: 35, category_id: 805, store_id: 402, is_veg: 1, is_available: 1, image: '', weight: '10 tabs', variants: [], options: [], prescription: 0 },
            { id: 713, product_name: 'Amoxicillin 250mg', description: 'Capsules Ã¢â‚¬â€ prescription required', price: 120, category_id: 806, store_id: 402, is_veg: 1, is_available: 1, image: '', weight: '15 caps', variants: [], options: [], prescription: 1 },
            { id: 714, product_name: 'Vitamin D3', description: '60,000 IU softgel', price: 199, category_id: 807, store_id: 402, is_veg: 1, is_available: 1, image: '', weight: '4 caps', variants: [], options: [] },
          ],
          403: [
            { id: 721, product_name: 'Dishwashing Liquid', description: '500 ml', price: 99, category_id: 808, store_id: 403, is_veg: 1, is_available: 1, image: '', weight: '500 ml', variants: [{ id: 811, name: '250 ml', price: 55 }, { id: 812, name: '500 ml', price: 99 }], options: [] },
            { id: 722, product_name: 'Paper Towels', description: '6-roll pack', price: 180, category_id: 808, store_id: 403, is_veg: 1, is_available: 1, image: '', weight: '6 rolls', variants: [], options: [] },
          ],
        };
        const storeCats: Record<number, Array<Record<string, unknown>>> = {
          401: [{ id: 801, category_name: 'Fruits & Bakery', sequence: 1 }, { id: 802, category_name: 'Dairy & Beverages', sequence: 2 }, { id: 803, category_name: 'Meat & Seafood', sequence: 3 }, { id: 804, category_name: 'Staples', sequence: 4 }],
          402: [{ id: 805, category_name: 'OTC Medicines', sequence: 1 }, { id: 806, category_name: 'Prescription', sequence: 2 }, { id: 807, category_name: 'Wellness', sequence: 3 }],
          403: [{ id: 808, category_name: 'Household', sequence: 1 }],
        };
        const storeMeta: Record<number, Record<string, unknown>> = {
          401: { id: 401, full_name: 'QuickMart', address: '15 Linking Road, Mumbai', latitude: 19.076, longitude: 72.877, rating: 4.3, review_count: 80, delivery_time_min: 20, delivery_time_max: 40, delivery_fee: 25, minimum_order: 99, is_open: 1, sub_group_for_app: 2, business_logo: '', is_favourite: 0, opening_time: '08:00 AM', closing_time: '10:00 PM', slug: 'grocery' },
          402: { id: 402, full_name: 'MedPlus Pharmacy', address: '22 Linking Road, Mumbai', latitude: 19.08, longitude: 72.88, rating: 4.1, review_count: 55, delivery_time_min: 25, delivery_time_max: 45, delivery_fee: 30, minimum_order: 149, is_open: 1, sub_group_for_app: 2, business_logo: '', is_favourite: 0, slug: 'pharmacy' },
          403: { id: 403, full_name: 'FreshBazaar', address: '7 Hill Road, Bandra', latitude: 19.07, longitude: 72.87, rating: 4.5, review_count: 120, delivery_time_min: 15, delivery_time_max: 30, delivery_fee: 20, minimum_order: 79, is_open: 0, sub_group_for_app: 2, business_logo: '', is_favourite: 0, slug: 'grocery' },
        };
        const store = storeMeta[sid] ?? storeMeta[401];
        data = {
          business_segment: store,
          categories: storeCats[sid] ?? storeCats[401],
          products: storeProducts[sid] ?? storeProducts[401],
          time_slots: [
            { id: 101, label: 'Morning 8 AM Ã¢â‚¬â€œ 12 PM', start: '08:00', end: '12:00', is_active: 1 },
            { id: 102, label: 'Afternoon 12 PM Ã¢â‚¬â€œ 4 PM', start: '12:00', end: '16:00', is_active: 1 },
            { id: 103, label: 'Evening 4 PM Ã¢â‚¬â€œ 8 PM', start: '16:00', end: '20:00', is_active: 1 },
          ],
          use_time_slots: 1,
          is_pharmacy: isPharmacyStore,
        };
        break;
      }

      case 'user/store/search-store-products': {
        const keyword = String(body['keyword'] ?? '').toLowerCase();
        data = [
          { id: 701, product_name: 'Organic Apples', description: 'Fresh 1 kg pack', price: 180, category_id: 801, store_id: 401, is_veg: 1, is_available: 1, image: '', weight: '1 kg', variants: [{ id: 801, name: '500 g', price: 95 }, { id: 802, name: '1 kg', price: 180 }], options: [] },
          { id: 702, product_name: 'Whole Wheat Bread', description: '500 g loaf', price: 45, category_id: 801, store_id: 401, is_veg: 1, is_available: 1, image: '', weight: '500 g', variants: [], options: [] },
        ].filter((p) => !keyword || p.product_name.toLowerCase().includes(keyword));
        break;
      }

      case 'user/store/cart':
      case 'user/store/cart/add':
      case 'user/store/cart/update':
      case 'user/store/cart/remove':
      case 'user/store/cart/clear': {
        const sKey = `store_cart:${str(body['_mockUser'], 'guest')}`;
        let sCart = (s as unknown as Record<string, unknown>)[sKey] as Array<Record<string, unknown>> | undefined;
        if (!sCart) { sCart = []; (s as unknown as Record<string, unknown>)[sKey] = sCart; }
        if (route === 'user/store/cart/add') {
          const pid = num(body['product_id'], 0);
          const qty = num(body['quantity'], 1);
          const vid = body['variant_id'] != null ? num(body['variant_id'], 0) : null;
          const vName = vid && vid >= 801 && vid <= 806 ? (vid === 801 || vid === 803 || vid === 805 ? 'Small' : 'Large') : '';
          const price = pid >= 711 && pid <= 714 ? 30 + (pid - 711) * 30 : 80 + (pid - 701) * 20;
          const wts = pid >= 711 ? '10 tabs' : vid === 801 || vid === 803 ? '500 g' : vid === 805 ? '1 kg' : '1 kg';
          sCart.push({ cart_id: `sc-${Date.now()}-${pid}`, product_id: pid, product_name: pid >= 711 ? 'Medicine' : 'Product', price, quantity: qty, variant_id: vid, variant_name: vName, option_ids: body['option_ids'] ?? [], total_amount: price * qty, is_veg: 1, image: '', store_id: body['store_id'] ?? 401, weight: wts });
        } else if (route === 'user/store/cart/update') {
          const cid = str(body['cart_id'], '');
          const item = sCart.find((i) => String(i['cart_id']) === cid);
          if (item) item['quantity'] = num(body['quantity'], 1);
        } else if (route === 'user/store/cart/remove') {
          const cid = str(body['cart_id'], '');
          const idx = sCart.findIndex((i) => String(i['cart_id']) === cid);
          if (idx >= 0) sCart.splice(idx, 1);
        } else if (route === 'user/store/cart/clear') {
          sCart.length = 0;
        }
        data = { products: sCart, total_items: sCart.length };
        break;
      }

      case 'user/store/apply-promo': {
        const code = String(body['promo_code'] ?? '').toUpperCase();
        if (code === 'WELCOME10') data = { promo_code: 'WELCOME10', valid: true, discount_type: 'percentage', discount_value: 10, max_discount: 50, min_order: 99, message: 'Promo applied' };
        else if (code === 'FLAT25') data = { promo_code: 'FLAT25', valid: true, discount_type: 'flat', discount_value: 25, max_discount: 25, min_order: 150, message: 'Promo applied' };
        else { data = {}; return NextResponse.json(fail(data, 'Invalid promo code')); }
        break;
      }

      case 'user/store/checkout': {
        const cid = `sck-${Date.now()}`;
        const minOrd = num(body['minimum_order'], 99);
        data = { id: cid, store_id: num(body['store_id'], 401), store_name: 'QuickMart', products: [], subtotal: 280, delivery_fee: 25, tax: 14, discount_amount: 0, promo_code: '', total_amount: 319, delivery_mode: num(body['delivery_mode'], 1), payment_mode: str(body['payment_mode'], '1'), address: str(body['address'], ''), latitude: 19.076, longitude: 72.877, is_pharmacy: false, minimum_order: minOrd, prescription_image: str(body['prescription_image'], ''), payment_methods: [{ id: '1', name: 'Cash', card_id: null }, { id: '2', name: 'Wallet', card_id: null }] };
        break;
      }

      case 'user/store/place-order': {
        const oid = `so-${Date.now()}`;
        data = { id: oid, order_number: Math.floor(Date.now() / 1000), order_status: 1, message: 'Order placed' };
        break;
      }

      case 'user/store/order-detail':
      case 'user/store/track': {
        const oid = str(body['order_id'] ?? body['id'], 'so-1');
        data = { id: oid, order_number: Math.floor(Date.now() / 1000), order_status: 1, store_id: 401, store_name: 'QuickMart', full_name: 'QuickMart', store_address: '15 Linking Road, Mumbai', products: [{ cart_id: 'sc-1', product_id: 701, product_name: 'Organic Apples', price: 180, quantity: 2, variant_id: 802, variant_name: '1 kg', option_ids: [], total_amount: 360, is_veg: 1, image: '', store_id: 401, weight: '1 kg' }], subtotal: 360, delivery_fee: 25, tax: 18, discount_amount: 0, promo_code: '', total_amount: 403, delivery_mode: 1, payment_mode: '1', payment_mode_name: 'Cash', address: 'Home', latitude: 19.076, longitude: 72.877, created_at: Date.now() - 30000, cancel_able: true, rate: null, status_text: 'Placed', ticket: 0, time_slot_label: 'Morning 8 AM Ã¢â‚¬â€œ 12 PM', prescription_image: '' };
        break;
      }

      case 'user/store/orders': {
        data = [];
        break;
      }

      case 'user/store/cancel': {
        data = { id: str(body['order_id'], ''), order_status: 3, message: 'Order cancelled' };
        break;
      }

      case 'user/store/rate': {
        data = { ok: true, message: 'Thanks for your feedback' };
        break;
      }

      case 'user/store/reorder': {
        data = { products: [], total_items: 0 };
        break;
      }

      case 'user/store/chat': {
        data = { user_name: 'QuickMart', user_image: '', chat: [] };
        break;
      }

      case 'user/store/chat/send': {
        data = { ok: true, message: 'Sent' };
        break;
      }

      case 'user/favourite-business-segment': {
        data = { ok: true };
        break;
      }

      case 'user/get-favourite-business-segment': {
        data = [];
        break;
      }

      // ------------------------------------------------------------------
      // Handyman / Home services (Phase 9)
      // ------------------------------------------------------------------
      case 'user/handyman/get-categories': {
        data = hmHandleGetCategories(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/get-services': {
        data = hmHandleGetServices(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/get-providers': {
        data = hmHandleGetProviders(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/get-provider': {
        data = hmHandleGetProvider(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/service-slots': {
        data = hmHandleServiceSlots();
        return NextResponse.json(data);
      }
      case 'user/handyman/save-booking-cart': {
        data = hmHandleSaveBookingCart(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/get-cart': {
        data = hmHandleGetCart(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/delete-cart': {
        data = hmHandleDeleteCart(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/apply-promo': {
        data = hmHandleApplyPromo(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/apply-remove-promo-code-web': {
        data = hmHandleApplyPromo(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/confirm-order': {
        data = hmHandleConfirmOrder(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/confirm-order-web': {
        data = hmHandleConfirmOrder(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/get-orders': {
        data = hmHandleGetOrders(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/get-order-detail': {
        data = hmHandleGetOrderDetail(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/cancel-order': {
        data = hmHandleCancelOrder(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/rate-provider': {
        data = hmHandleRateProvider(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/rate/provider': {
        data = hmHandleRateProvider(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/booking-payment': {
        data = hmHandleBookingPayment(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/bidding/create-order': {
        data = hmHandleBiddingCreateOrder(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/bidding/get-orders': {
        data = hmHandleBiddingGetOrders(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/bidding/get-order-detail': {
        data = hmHandleBiddingGetOrderDetail(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/bidding/counter-bid': {
        data = hmHandleBiddingCounterBid(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/bidding/counter-bid-order': {
        data = hmHandleBiddingCounterBid(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/bidding/accept-order': {
        data = hmHandleBiddingAcceptOrder(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/bidding/cancel-delete': {
        data = hmHandleBiddingCancelDelete(body);
        return NextResponse.json(data);
      }
      case 'user/handyman/bidding/cancel-or-delete-order': {
        data = hmHandleBiddingCancelDelete(body);
        return NextResponse.json(data);
      }

      // Ã¢â€â‚¬Ã¢â€â‚¬ Laundry (Phase 10) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
      case 'user/laundry/get-categories': {
        data = ldHandleGetCategories(body);
        return NextResponse.json(data);
      }
      case 'user/laundry/get-services': {
        data = ldHandleGetServices(body);
        return NextResponse.json(data);
      }
      case 'user/laundry/get-outlets': {
        data = ldHandleGetOutlets(body);
        return NextResponse.json(data);
      }
      case 'user/laundry/get-outlet': {
        data = ldHandleGetOutlet(body);
        return NextResponse.json(data);
      }
      case 'user/laundry/service-slots': {
        data = ldHandleServiceSlots();
        return NextResponse.json(data);
      }
      case 'user/laundry/save-cart': {
        data = ldHandleSaveCart(body);
        return NextResponse.json(data);
      }
      case 'user/laundry/get-cart': {
        data = ldHandleGetCart(body);
        return NextResponse.json(data);
      }
      case 'user/laundry/delete-cart': {
        data = ldHandleDeleteCart(body);
        return NextResponse.json(data);
      }
      case 'user/laundry/apply-promo':
      case 'user/laundry/apply-remove-promo-code-web': {
        data = ldHandleApplyPromo(body);
        return NextResponse.json(data);
      }
      case 'user/laundry/confirm-order':
      case 'user/laundry/confirm-order-web': {
        data = ldHandleConfirmOrder(body);
        return NextResponse.json(data);
      }
      case 'user/laundry/get-orders': {
        data = ldHandleGetOrders(body);
        return NextResponse.json(data);
      }
      case 'user/laundry/get-order-detail': {
        data = ldHandleGetOrderDetail(body);
        return NextResponse.json(data);
      }
      case 'user/laundry/verify-otp': {
        data = ldHandleVerifyOtp(body);
        return NextResponse.json(data);
      }
      case 'user/laundry/cancel-order': {
        data = ldHandleCancelOrder(body);
        return NextResponse.json(data);
      }
      case 'user/laundry/rate-outlet':
      case 'user/laundry/rate': {
        data = ldHandleRateOutlet(body);
        return NextResponse.json(data);
      }

      // ------------------------------------------------------------------
      // Bus booking (Phase 11)
      // ------------------------------------------------------------------
      case 'user/bus/search-routes': {
        data = busHandleSearchRoutes(body);
        return NextResponse.json(data);
      }
      case 'user/bus/route-stops': {
        data = busHandleRouteStops(body);
        return NextResponse.json(data);
      }
      case 'user/bus/available-buses': {
        data = busHandleAvailableBuses(body);
        return NextResponse.json(data);
      }
      case 'user/bus/seat-map': {
        data = busHandleSeatMap(body);
        return NextResponse.json(data);
      }
      case 'user/bus/checkout': {
        data = busHandleCheckout(body);
        return NextResponse.json(data);
      }
      case 'user/bus/confirm': {
        data = busHandleConfirm(body);
        return NextResponse.json(data);
      }
      case 'user/bus/bookings': {
        data = busHandleBookings();
        return NextResponse.json(data);
      }
      case 'user/bus/booking-detail': {
        data = busHandleBookingDetail(body);
        return NextResponse.json(data);
      }
      case 'user/bus/cancel-booking': {
        data = busHandleCancelBooking(body);
        return NextResponse.json(data);
      }

      // ------------------------------------------------------------------
      // Carpooling (Phase 11)
      // ------------------------------------------------------------------
      case 'user/carpool/search-rides': {
        data = carpoolHandleSearchRides(body);
        return NextResponse.json(data);
      }
      case 'user/carpool/offer-ride': {
        data = carpoolHandleOfferRide(body);
        return NextResponse.json(data);
      }
      case 'user/carpool/book-ride': {
        data = carpoolHandleBookRide(body);
        return NextResponse.json(data);
      }
      case 'user/carpool/offer-rides': {
        data = carpoolHandleOfferedRides();
        return NextResponse.json(data);
      }
      case 'user/carpool/taken-rides': {
        data = carpoolHandleTakenRides();
        return NextResponse.json(data);
      }
      case 'user/carpool/ride-detail': {
        data = carpoolHandleRideDetail(body);
        return NextResponse.json(data);
      }
      case 'user/carpool/cancel-ride': {
        data = carpoolHandleCancelRide(body);
        return NextResponse.json(data);
      }
      case 'user/carpool/cancel-offer-ride': {
        data = carpoolHandleCancelOffer(body);
        return NextResponse.json(data);
      }

      // ------------------------------------------------------------------
      // Phase 12 Ã¢â‚¬â€ Account, wallet, history, SOS, favourites, family, etc.
      // ------------------------------------------------------------------
      case 'user/booking/history': {
        const segmentId = num(body['segment_id'], 0);
        const requestType = str(body['request_type'], 'ongoing');
        const list = historyBookings.filter((b) => {
          if (requestType === 'past' && b.booking_status !== 4) return false;
          if (requestType === 'ongoing' && b.booking_status === 4) return false;
          if (segmentId && b.segment_id !== segmentId) return false;
          return true;
        });
        data = { data: list };
        break;
      }
      case 'user/booking/history/detail': {
        const id = str(body['booking_id'], '');
        const b = historyBookings.find((x) => x.id === id);
        data = { booking: b ?? historyBookings[0], sos: [] };
        break;
      }
      case 'user/booking/active': {
        data = { data: historyBookings.filter((b) => b.booking_status !== 4) };
        break;
      }
      case 'user/UserDetail': {
        const p = s.phase12;
        data = {
          id: 1,
          first_name: 'Guest',
          last_name: 'User',
          UserPhone: '+91 98765 43210',
          phone_code: '+91',
          country_code: 'IN',
          email: 'guest@fixcycle.com',
          user_gender: 'male',
          smoker_type: 'no',
          ReferralCode: p.referralCode,
          wallet_balance: String(p.walletBalance),
          outstanding_amount: '0',
          UserProfileImage: '',
          created_at: '2026-01-10',
        };
        break;
      }
      case 'user/edit-profile': {
        data = {
          id: 1,
          first_name: str(body['first_name'], 'Guest'),
          last_name: str(body['last_name'], 'User'),
          UserPhone: str(body['phone'], '+91 98765 43210'),
          phone_code: '+91',
          country_code: 'IN',
          email: str(body['email'], 'guest@fixcycle.com'),
          user_gender: str(body['user_gender'], 'male'),
          smoker_type: str(body['smoker_type'], 'no'),
          ReferralCode: s.phase12.referralCode,
          wallet_balance: String(s.phase12.walletBalance),
          outstanding_amount: '0',
          UserProfileImage: '',
        };
        break;
      }
      case 'user/change-password': {
        data = { message: 'Password changed' };
        break;
      }
      case 'user/userDocList': {
        data = s.phase12.docs;
        break;
      }
      case 'user/userDocSave': {
        const docId = num(body['document_id'], s.phase12.docSeq);
        s.phase12.docs.push({
          id: docId,
          document_id: docId,
          document_number: str(body['document_number'], ''),
          name: 'Document',
          expiry_date: str(body['expiry_date'], ''),
          status: 'pending',
        });
        data = { message: 'Document saved' };
        break;
      }
      case 'user/account-delete': {
        data = { message: 'Account deleted' };
        break;
      }
      // Wallet
      case 'user/wallet/transaction': {
        const filter = num(body['filter'], 1);
        const txns = s.phase12.walletTxns.filter((t) => {
          if (filter === 1) return true; // all
          return t.type === String(filter);
        });
        data = {
          wallet_balance: String(s.phase12.walletBalance),
          tap_customer_token: '',
          recent_transactoin: txns,
        };
        break;
      }
      case 'user/wallet/addMoney': {
        const amt = num(body['amount'], 0);
        s.phase12.walletBalance += amt;
        s.phase12.walletTxns.unshift({
          transaction_name: 'Wallet Top-Up',
          type: '1',
          amount: `${CURRENCY} ${amt.toFixed(2)}`,
          date: new Date().toISOString().slice(0, 10),
          value_color: '#16a34a',
          description: 'Cash top-up',
        });
        data = { message: 'Money added' };
        break;
      }
      case 'user/check-user': {
        const searchBy = str(body['search_by'], '');
        if (!searchBy || searchBy.length < 3) {
          return NextResponse.json(fail({}, 'User not found'));
        }
        data = {
          id: 101,
          first_name: 'Ravi',
          last_name: 'Kumar',
          UserPhone: '+91 98765 22222',
          email: 'ravi@example.com',
        };
        break;
      }
      case 'user/transfer-money': {
        const amt = num(body['amount'], 0);
        if (amt > s.phase12.walletBalance) {
          return NextResponse.json(fail({}, 'Insufficient balance'));
        }
        s.phase12.walletBalance -= amt;
        s.phase12.walletTxns.unshift({
          transaction_name: 'Wallet Transfer',
          type: '4',
          amount: `${CURRENCY} ${amt.toFixed(2)}`,
          date: new Date().toISOString().slice(0, 10),
          value_color: '#dc2626',
          description: `Transferred to user ${body['receiver_id']}`,
        });
        data = { message: 'Transfer successful' };
        break;
      }
      case 'user/cashout/request': {
        const amt = num(body['amount'], 0);
        if (amt > s.phase12.walletBalance) {
          return NextResponse.json(fail({}, 'Insufficient balance'));
        }
        s.phase12.walletBalance -= amt;
        s.phase12.cashouts.push({
          id: `co${s.phase12.cashoutSeq++}`,
          amount: `${CURRENCY} ${amt.toFixed(2)}`,
          status: 'pending',
          created_at: new Date().toISOString().slice(0, 10),
          payment_method_name: str(body['payment_method_name'], 'Bank Transfer'),
        });
        data = { message: 'Cashout requested' };
        break;
      }
      case 'user/cashout/history': {
        data = s.phase12.cashouts;
        break;
      }
      case 'user/get-cashout-method': {
        data = [
          { id: 1, name: 'Bank Transfer', is_active: 1 },
          { id: 2, name: 'Mobile Money', is_active: 1 },
        ];
        break;
      }
      // Cards
      case 'user/cards': {
        data = s.phase12.cards;
        break;
      }
      case 'user/card/delete': {
        const cardId = str(body['card_id'], '');
        s.phase12.cards = s.phase12.cards.filter((c) => c.id !== cardId);
        data = { message: 'Card deleted' };
        break;
      }
      // SOS
      case 'user/sos': {
        data = s.phase12.sosContacts;
        break;
      }
      case 'user/sos/create': {
        const id = `s${s.phase12.sosContactSeq++}`;
        const contact = { id, name: str(body['name'], ''), number: str(body['number'], '') };
        s.phase12.sosContacts.push(contact);
        data = contact;
        break;
      }
      case 'user/sos/distory': {
        const cid = str(body['id'], '');
        s.phase12.sosContacts = s.phase12.sosContacts.filter((c) => c.id !== cid);
        data = { message: 'Contact deleted' };
        break;
      }
      case 'user/sos-request': {
        data = { message: 'SOS request sent' };
        break;
      }
      // Favourites
      case 'user/get-favourite-driver': {
        data = s.phase12.favouriteDrivers;
        break;
      }
      case 'user/favourite-driver': {
        const driverId = str(body['driver_id'], '');
        const action = num(body['action'], 1);
        if (action === 2) {
          s.phase12.favouriteDrivers = s.phase12.favouriteDrivers.filter((d) => d.driver_id !== driverId);
          data = { message: 'Removed from favourites' };
        } else {
          const exists = s.phase12.favouriteDrivers.find((d) => d.driver_id === driverId);
          if (!exists) {
            s.phase12.favouriteDrivers.push({
              driver_id: driverId,
              first_name: 'Driver',
              last_name: driverId,
              phone_number: '+91 98765 00000',
              rating: '4.8',
            });
          }
          data = { message: 'Added to favourites' };
        }
        break;
      }
      case 'user/get-favourite-location': {
        data = { locations: s.phase12.favouriteLocations };
        break;
      }
      case 'user/add-favourite-location': {
        const id = `fl${s.phase12.favLocSeq++}`;
        s.phase12.favouriteLocations.push({
          id,
          location_name: str(body['location_name'], ''),
          address: str(body['address'], ''),
          latitude: num(body['latitude'], 0),
          longitude: num(body['longitude'], 0),
        });
        data = { message: 'Location saved' };
        break;
      }
      case 'user/delete-favourite-location': {
        const lid = str(body['favourite_location_id'], '');
        s.phase12.favouriteLocations = s.phase12.favouriteLocations.filter((l) => l.id !== lid);
        data = { message: 'Location deleted' };
        break;
      }
      // Family
      case 'user/ListFamilyMember': {
        data = { members: s.phase12.familyMembers };
        break;
      }
      case 'user/AddFamilyMember': {
        const id = `fm${s.phase12.familySeq++}`;
        const member = {
          id,
          name: str(body['name'], ''),
          phone: str(body['phone'], ''),
          email: str(body['email'], ''),
          relation: str(body['relation'], ''),
        };
        s.phase12.familyMembers.push(member);
        data = member;
        break;
      }
      case 'user/DeleteFamilyMember': {
        const mid = str(body['id'], '');
        s.phase12.familyMembers = s.phase12.familyMembers.filter((m) => m.id !== mid);
        data = { message: 'Member deleted' };
        break;
      }
      // Referral
      case 'user/refer': {
        data = {
          refer_image: '',
          refer_heading: 'Refer & Earn',
          refer_explanation: 'Share your referral code and both of you earn rewards',
          start_date: '2026-01-01',
          end_date: '2026-12-31',
          refer_code: s.phase12.referralCode,
          refer_status: '1',
          refer_offer: 'Your friend gets K100 off; you earn K200',
          sharing_text: `Use my referral code ${s.phase12.referralCode} on Fixcycle and earn rewards!`,
          referral_count: 3,
        };
        break;
      }
      // Rewards
      case 'user/reward-points': {
        data = { points: s.phase12.rewardPoints };
        break;
      }
      case 'user/redeem-points': {
        const pts = num(body['points'], 0);
        if (pts > s.phase12.rewardPoints) {
          return NextResponse.json(fail({}, 'Not enough points'));
        }
        s.phase12.rewardPoints -= pts;
        s.phase12.rewardHistory.unshift({
          id: `rh${Date.now()}`,
          points: pts,
          action: 'redeemed',
          date: new Date().toISOString().slice(0, 10),
          gift_name: str(body['gift_name'], 'Points redemption'),
        });
        data = { message: 'Points redeemed', remaining_points: s.phase12.rewardPoints };
        break;
      }
      case 'user/reward-gift-list': {
        data = s.phase12.rewardGifts;
        break;
      }
      case 'user/redeem-reward-gift': {
        const giftId = str(body['gift_id'], '');
        const gift = s.phase12.rewardGifts.find((g) => g.id === giftId);
        if (!gift || gift.points_required > s.phase12.rewardPoints) {
          return NextResponse.json(fail({}, 'Not enough points'));
        }
        s.phase12.rewardPoints -= gift.points_required;
        s.phase12.rewardHistory.unshift({
          id: `rh${Date.now()}`,
          points: gift.points_required,
          action: 'gift_redeemed',
          date: new Date().toISOString().slice(0, 10),
          gift_name: gift.name,
        });
        data = { message: 'Gift redeemed' };
        break;
      }
      case 'user/reward-history': {
        data = s.phase12.rewardHistory;
        break;
      }
      case 'user/redeemed-rewards': {
        data = s.phase12.rewardHistory.filter((h) => h.action === 'gift_redeemed');
        break;
      }
      // Subscriptions
      case 'user/get-subscriptions-list': {
        data = s.phase12.subscriptions;
        break;
      }
      case 'user/get-subscriptions-history': {
        data = [];
        break;
      }
      case 'user/get-active-subscription': {
        data = s.phase12.activeSubscription;
        break;
      }
      case 'user/activate-subscription-package': {
        const pkgId = str(body['package_id'], '');
        const pkg = s.phase12.subscriptions.find((s2) => s2.id === pkgId);
        if (!pkg) {
          return NextResponse.json(fail({}, 'Package not found'));
        }
        const now = new Date();
        const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        s.phase12.activeSubscription = {
          id: `as${Date.now()}`,
          package_id: pkg.id,
          name: pkg.name,
          start_date: now.toISOString().slice(0, 10),
          end_date: end.toISOString().slice(0, 10),
        };
        data = { message: 'Subscription activated' };
        break;
      }
      // Chat
      case 'user/chat': {
        const bookingId = str(body['booking_id'], '');
        if (bookingId) {
          const chat = s.phase12.chatMessages.find((c) => c.booking_id === bookingId);
          data = { messages: chat?.messages ?? [] };
        } else {
          data = { messages: s.phase12.chatMessages[0]?.messages ?? [] };
        }
        break;
      }
      case 'user/chat/send_message': {
        const bookingId = str(body['booking_id'], '') || 'general';
        let chat = s.phase12.chatMessages.find((c) => c.booking_id === bookingId);
        if (!chat) {
          chat = { booking_id: bookingId, messages: [] };
          s.phase12.chatMessages.push(chat);
        }
        const msg = { id: `m${s.phase12.chatSeq++}`, message: str(body['message'], ''), sender: 'USER', sender_type: 'USER', sender_name: 'You', created_at: new Date().toISOString().slice(0, 19).replace('T', ' ') };
        chat.messages.push(msg);
        data = msg;
        break;
      }
      // Support
      case 'user/customer_support/channels': {
        data = [
          { id: '1', name: 'Phone', value: '+1 800 555 0101' },
          { id: '2', name: 'Email', value: 'support@fixcycle.app' },
          { id: '3', name: 'WhatsApp', value: '+1 800 555 0102' },
        ];
        break;
      }
      case 'user/customer_support': {
        const subject = str(body['subject'], '');
        const message = str(body['message'], '');
        if (message) {
          s.phase12.supportThreads.push({
            id: `t${s.phase12.supportSeq++}`,
            subject,
            message,
            status: 'OPEN',
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          });
        }
        data = s.phase12.supportThreads;
        break;
      }
      // Pricecard
      case 'user/pricecard': {
        const area = str(body['area'], '');
        const segmentId = num(body['segment_id'], 1);
        data = [
          {
            serviceName: 'Standard',
            vehicle_type: [
              {
                vehicleTypeName: 'Mini',
                vehicleTypeDescription: 'Compact hatchback',
                vehicleTypeImage: '',
                price_card_values: [
                  { parameter_price: `${CURRENCY} 15.0/km`, pricing_parameter: 'Per km', description: 'Distance charge' },
                  { parameter_price: `${CURRENCY} 2.0/min`, pricing_parameter: 'Per min', description: 'Time charge' },
                  { parameter_price: `${CURRENCY} 50.0`, pricing_parameter: 'Base fare', description: 'Base fare' },
                ],
              },
              {
                vehicleTypeName: 'Sedan',
                vehicleTypeDescription: 'Comfortable sedan',
                vehicleTypeImage: '',
                price_card_values: [
                  { parameter_price: `${CURRENCY} 20.0/km`, pricing_parameter: 'Per km', description: 'Distance charge' },
                  { parameter_price: `${CURRENCY} 2.5/min`, pricing_parameter: 'Per min', description: 'Time charge' },
                  { parameter_price: `${CURRENCY} 75.0`, pricing_parameter: 'Base fare', description: 'Base fare' },
                ],
              },
            ],
          },
        ];
        break;
      }

      // Non-critical endpoints (drawer/notifications etc.) fail gracefully.
      default: {
        data = {};
        return NextResponse.json(fail(data, `Not mocked: ${route}`));
      }
    }

    return NextResponse.json(ok(data, message));
  } catch (error) {
    return NextResponse.json(fail({}, error instanceof Error ? error.message : 'Mock error'), { status: 500 });
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }): Promise<NextResponse> {
  const { path } = await ctx.params;
  return NextResponse.json(fail({}, `Not mocked (GET): ${path.join('/')}`));
}

// Small helpers
function str(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}
function num(value: unknown, fallback: number): number {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}
function parseDrop(body: Record<string, unknown>, key: string): unknown {
  const raw = body['drop_location'];
  if (typeof raw !== 'string') return undefined;
  try {
    const parsed = JSON.parse(raw);
    const first = Array.isArray(parsed) ? parsed[0] : parsed;
    if (first && typeof first === 'object') {
      const rec = first as Record<string, unknown>;
      if (key === 'drop_latitude') return rec['dropLatitude'];
      if (key === 'drop_longitude') return rec['dropLongitude'];
      if (key === 'drop_location') return rec['dropLocation'];
    }
  } catch {
    return undefined;
  }
  return undefined;
}
