import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Fixcycle driver dev mock API — realistic fixtures for the whole Phase 13
// driver flow so the app is previewable end-to-end offline (no Laravel
// backend required).
//
// Wired via apps/driver/.env.local: NEXT_PUBLIC_API_BASE=/api/mock
// All ApiClient calls (POST /api/mock/driver/...) land here. Response bodies
// mirror the exact envelopes/field names the api-client parsers expect.
//
// NOTE: This is an envelope-shaped mock, not the Laravel backend. Real go-live
// swaps NEXT_PUBLIC_API_BASE back to the PHP API (see .env.local).
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

function onlyData(data: unknown): Ok {
  return ok(data);
}

// ---------------------------------------------------------------------------
// Demo driver state (lives on globalThis so it survives across requests)
// ---------------------------------------------------------------------------

interface MockDriver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  phone_code: string;
  segment_group_id: number;
  signup_step: number;
  online_enable: number;
  online_config_status: string;
  work_set: number;
  rating: string;
  UserProfileImage: string | null;
  profile_image: string | null;
  preference: { voice_alert_enable: number; auto_accept_enable: number; ride_accept_radius: number };
  segments: { segment_slug: string; segment_name: string }[];
}

interface MockState {
  driver: MockDriver;
  pendingChecks: number;
  bookingSeq: number;
  walletBalance: number;
  documentSeq: number;
  vehicleSeq: number;
  gallerySeq: number;
  cashoutSeq: number;
  documents: Record<string, unknown>[];
  vehicles: Record<string, unknown>[];
  gallery: Record<string, unknown>[];
  cashouts: Record<string, unknown>[];
  subscriptions: Record<string, unknown>[];
  activeSubscriptions: Record<string, unknown>[];
}

const g = globalThis as unknown as { __fixcycleDriverMock?: MockState };

function freshDemoDriver(): MockDriver {
  return {
    id: '9001',
    first_name: '',
    last_name: '',
    email: '',
    phone: '+91 98765 43210',
    phone_code: '+91',
    segment_group_id: 1,
    signup_step: 1,
    online_enable: 0,
    online_config_status: 'missing',
    work_set: 0,
    rating: '4.9',
    UserProfileImage: null,
    profile_image: null,
    preference: { voice_alert_enable: 1, auto_accept_enable: 0, ride_accept_radius: 5 },
    segments: [],
  };
}

function approvedDriver(): MockDriver {
  const driver = freshDemoDriver();
  driver.first_name = 'Vikram';
  driver.last_name = 'Sharma';
  driver.email = 'vikram@example.com';
  driver.signup_step = 9;
  driver.online_config_status = 'saved';
  driver.work_set = 1;
  driver.preference.ride_accept_radius = 5;
  driver.segments = [{ segment_slug: 'ride', segment_name: 'Ride' }];
  return driver;
}

function seedDocuments(): Record<string, unknown>[] {
  return [
    {
      id: 'pd-1',
      document_id: 'doc-personal-licence',
      documentname: 'Driving Licence',
      document_for: 'PERSONAL',
      document_mandatory: 1,
      document_number_required: 1,
      document_number: 'MH12 2023 45678',
      expire_status: 0,
      expire_date: '',
      document_file: '',
      document_image: '',
      type: 1,
      document_status_int: 1,
      document_verification_status: 'Approved',
      temp_doc_status: 0,
      temp_document_file: '',
      temp_document_verification_status: '',
    },
    {
      id: 'pd-2',
      document_id: 'doc-personal-aadhar',
      documentname: 'Aadhaar Card',
      document_for: 'PERSONAL',
      document_mandatory: 1,
      document_number_required: 1,
      document_number: 'XXXX XXXX 7890',
      expire_status: 0,
      expire_date: '',
      document_file: '',
      document_image: '',
      type: 1,
      document_status_int: 1,
      document_verification_status: 'Approved',
      temp_doc_status: 0,
      temp_document_file: '',
      temp_document_verification_status: '',
    },
  ];
}

function seedVehicles(): Record<string, unknown>[] {
  return [
    {
      id: 'dv-101',
      driver_vehicle_id: 'dv-101',
      vehicle_type: 'Four Seater',
      vehicle_type_image: '',
      vehicle_make: 'Maruti Suzuki',
      vehicle_model: 'Swift',
      vehicle_number: 'MH 12 AB 1234',
      vehicle_color: 'White',
      vehicle_image: '',
      vehicle_number_plate_image: '',
      vehicle_verification_status: 1,
      active_status: 1,
      show_message: 'Active',
      message_background_color: '#ffffff',
      other_pending: 0,
      pool_enable: 0,
      shareCode: 'VHC9001',
      is_detached: 0,
      vehicle_expire_date: '',
      vehicle_register_date: '2026-01-10',
    },
  ];
}

function seedCashouts(): Record<string, unknown>[] {
  return [
    {
      id: 'co-1',
      amount: '₹ 100.00',
      cashout_status: 'Success',
      action_by: 'admin',
      transaction_id: 'TXN-99881',
      comment: '',
      created_at: '2026-06-28 11:00:00',
      updated_at: '2026-06-28 11:05:00',
    },
    {
      id: 'co-2',
      amount: '₹ 150.00',
      cashout_status: 'Pending',
      action_by: '',
      transaction_id: '',
      comment: '',
      created_at: '2026-07-01 09:30:00',
      updated_at: '2026-07-01 09:30:00',
    },
  ];
}

function seedSubscriptions(): Record<string, unknown>[] {
  return [
    {
      id: 'sub-1',
      name: 'Weekly Ride Pack',
      expire_date: '',
      package_type: '2',
      description: 'Unlimited rides for 7 days',
      show_price: '₹ 499',
      package_duration_name: '7 Days',
      image: '',
      segment_name: 'Ride',
      vehicle_type: '',
      max_trip: 50,
      text: 'Buy / Activate',
      status: 0,
      amount: '499',
      price_type: '3',
      pack_details: {},
      active: true,
    },
    {
      id: 'sub-2',
      name: 'Monthly Ride Pack',
      expire_date: '',
      package_type: '2',
      description: 'Priority dispatch for 30 days',
      show_price: '₹ 1699',
      package_duration_name: '30 Days',
      image: '',
      segment_name: 'Ride',
      vehicle_type: '',
      max_trip: 250,
      text: 'Buy / Activate',
      status: 0,
      amount: '1699',
      price_type: '3',
      pack_details: {},
      active: false,
    },
    {
      id: 'sub-3',
      name: 'Delivery Pro',
      expire_date: '',
      package_type: '2',
      description: 'Delivery parcel benefits for 15 days',
      show_price: '₹ 899',
      package_duration_name: '15 Days',
      image: '',
      segment_name: 'Delivery',
      vehicle_type: '',
      max_trip: 120,
      text: 'Buy / Activate',
      status: 0,
      amount: '899',
      price_type: '3',
      pack_details: {},
      active: false,
    },
  ];
}

function state(): MockState {
  if (!g.__fixcycleDriverMock) {
    g.__fixcycleDriverMock = {
      driver: approvedDriver(),
      pendingChecks: 0,
      bookingSeq: 9001,
      walletBalance: 250,
      documentSeq: 10,
      vehicleSeq: 200,
      gallerySeq: 1,
      cashoutSeq: 3,
      documents: seedDocuments(),
      vehicles: seedVehicles(),
      gallery: [
        { id: 'g-1', image: '', image_title: 'Front view' },
        { id: 'g-2', image: '', image_title: 'Interior' },
      ],
      cashouts: seedCashouts(),
      subscriptions: seedSubscriptions(),
      activeSubscriptions: [],
    };
  }
  const s = g.__fixcycleDriverMock;
  if (s.walletBalance === undefined || !Array.isArray(s.documents)) {
    s.walletBalance = 250;
    s.documentSeq = 10;
    s.vehicleSeq = 200;
    s.gallerySeq = 1;
    s.cashoutSeq = 3;
    s.documents = seedDocuments();
    s.vehicles = seedVehicles();
    s.gallery = [
      { id: 'g-1', image: '', image_title: 'Front view' },
      { id: 'g-2', image: '', image_title: 'Interior' },
    ];
    s.cashouts = seedCashouts();
    s.subscriptions = seedSubscriptions();
    s.activeSubscriptions = [];
  }
  return s;
}

function driverResource(driver: MockDriver): Record<string, unknown> {
  return {
    id: driver.id,
    first_name: driver.first_name,
    last_name: driver.last_name,
    email: driver.email,
    phone: driver.phone,
    phone_code: driver.phone_code,
    segment_group_id: driver.segment_group_id,
    signup_step: driver.signup_step,
    online_enable: driver.online_enable,
    online_config_status: driver.online_config_status,
    work_set: driver.work_set,
    rating: driver.rating,
    UserProfileImage: driver.UserProfileImage,
    profile_image: driver.profile_image,
  };
}

function tokenPayload(driver: MockDriver): Record<string, unknown> {
  return {
    access_token: `mock-driver-token-${driver.id}`,
    driver: driverResource(driver),
    push_notification: { token: '' },
  };
}

const APPROVED_STEPS = [
  ['REG-1', 'Registration', 'Profile verified', 5, 'MANAGE_REGISTRATION', '0', ''],
  ['REG-PD', 'Personal documents', 'Verified', 5, 'MANAGE_PERSONAL_DOCUMENT', '0', ''],
  ['REG-V', 'Vehicle details', 'Verified', 5, 'MANAGE_VEHICLE', '0', ''],
  ['REG-VD', 'Vehicle documents', 'Verified', 5, 'MANAGE_VEHICLE_DOCUMENT', '0', ''],
  ['REG-S', 'Services', 'Active', 5, 'MANAGE_SEGMENT_SERVICES', '0', ''],
].map(([name, label, desc, status, type, _d, _t]) =>
  buildStep(String(name), String(label), String(desc), Number(status), String(type), String(_d), String(_t)),
);

function buildStep(
  name: string,
  label: string,
  description: string,
  status: number,
  type: string,
  buttonDisplay: string,
  buttonText: string,
): Record<string, unknown> {
  return {
    step_name: label,
    step_description: description,
    step_status: status,
    step_type: type,
    button_display: buttonDisplay,
    button_text: buttonText,
  };
}

function mainScreenConfig(driver: MockDriver): Record<string, unknown> {
  if (driver.signup_step >= 9) {
    return { driver_vehicle_id: 'dv-101', configuration: APPROVED_STEPS };
  }
  const pending = driver.signup_step === 8;
  const statusOf = (allowed: boolean): number => {
    if (allowed) return pending ? 4 : 5;
    return pending ? 4 : 1;
  };
  const steps: Record<string, unknown>[] = [
    buildStep('registration', 'Registration', 'Complete your profile', statusOf(driver.signup_step >= 2), 'MANAGE_REGISTRATION', '1', 'Go'),
    buildStep('personal', 'Personal documents', 'Add your ID document', statusOf(driver.signup_step >= 3), 'MANAGE_PERSONAL_DOCUMENT', '1', 'Go'),
    buildStep('vehicle', 'Vehicle details', 'Add your vehicle', statusOf(driver.signup_step >= 5), 'MANAGE_VEHICLE', '1', 'Go'),
    buildStep('vehicleDocs', 'Vehicle documents', 'Add vehicle papers', statusOf(driver.signup_step >= 5), 'MANAGE_VEHICLE_DOCUMENT', '1', 'Go'),
    buildStep('services', 'Your services', 'Pick your segments', statusOf(driver.signup_step >= 7), 'MANAGE_SEGMENT_SERVICES', '1', 'Go'),
  ];
  if (pending) {
    steps.push(buildStep('availability', 'Availability', 'We are reviewing your slots', 4, 'MANAGE_AVAILABILITY_SLOT', '1', 'Go'));
  }
  return { driver_vehicle_id: 'dv-101', configuration: steps };
}

// ---------------------------------------------------------------------------
// Booking fixtures
// ---------------------------------------------------------------------------

interface MockBooking {
  [key: string]: unknown;
}

const donePickup = '12 Marine Drive, Mumbai';
const doneDrop = 'Nariman Point, Mumbai';

function bookingFixture(): MockBooking {
  const s = state();
  const id = s.bookingSeq++;
  const b: MockBooking = {
    id,
    booking_order_id: `bk-${id}`,
    segment_slug: 'ride',
    segment_name: 'Ride',
    service_name: 'Sedan',
    pickup_address: donePickup,
    drop_address: doneDrop,
    pickup_latitude: '18.9438',
    pickup_longitude: '72.8246',
    drop_latitude: '18.9244',
    drop_longitude: '72.8111',
    user_first_name: 'Ananya',
    user_phone: '+91 98100 00001',
    total_amount: '185',
    currency: '₹',
    otp: '1234',
    booking_status: 1,
    status_text: 'New',
    created_at: new Date().toISOString(),
  };
  return b;
}

function pastBookings(): MockBooking[] {
  return [
    {
      id: 'bk-8001',
      booking_order_id: 'bk-8001',
      segment_slug: 'ride',
      segment_name: 'Ride',
      service_name: 'Sedan',
      pickup_address: 'Andheri West Station',
      drop_address: 'BKC, Mumbai',
      pickup_latitude: '19.1197',
      pickup_longitude: '72.8464',
      drop_latitude: '19.0733',
      drop_longitude: '72.8558',
      user_first_name: 'Kiran',
      user_phone: '+91 98100 00004',
      total_amount: '220',
      currency: '₹',
      booking_status: 4,
      status_text: 'Completed',
      created_at: '2026-07-02 09:12:00',
    },
    {
      id: 'bk-8002',
      booking_order_id: 'bk-8002',
      segment_slug: 'delivery',
      segment_name: 'Delivery',
      service_name: 'Parcel',
      pickup_address: 'Worli Depot',
      drop_address: 'Lower Parel Office',
      pickup_latitude: '19.0178',
      pickup_longitude: '72.8478',
      drop_latitude: '18.9941',
      drop_longitude: '72.8245',
      user_first_name: 'Meera',
      user_phone: '+91 98100 00005',
      total_amount: '99',
      currency: '₹',
      booking_status: 4,
      status_text: 'Completed',
      created_at: '2026-07-01 18:40:00',
    },
    {
      id: 'bk-8003',
      booking_order_id: 'bk-8003',
      segment_slug: 'towing',
      segment_name: 'Vehicle Towing',
      service_name: 'Bike Tow',
      pickup_address: 'Dadar East',
      drop_address: 'Workshop, Worli',
      pickup_latitude: '19.0178',
      pickup_longitude: '72.8478',
      drop_latitude: '19.0253',
      drop_longitude: '72.8232',
      user_first_name: 'Akash',
      user_phone: '+91 98100 00006',
      total_amount: '499',
      currency: '₹',
      booking_status: 3,
      status_text: 'Completed',
      created_at: '2026-06-29 15:10:00',
    },
  ];
}

function findBooking(id: string | number | undefined): MockBooking {
  if (id === undefined || id === '') {
    return bookingFixture();
  }
  const all = [...pastBookings()];
  return all.find((b) => String(b.booking_order_id) === String(id) || String(b.id) === String(id)) ?? bookingFixture();
}

// ---------------------------------------------------------------------------
// Polyline encoder (draws the route layer in the SVG map, no geo library)
// ---------------------------------------------------------------------------

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

function directionData(origin: Record<string, unknown> | undefined, destination: Record<string, unknown> | undefined): Record<string, unknown> {
  const oLat = Number(origin?.['origin_latitude'] ?? 18.9438);
  const oLng = Number(origin?.['origin_longitude'] ?? 72.8246);
  const dLat = Number(destination?.['destination_latitude'] ?? 18.9244);
  const dLng = Number(destination?.['destination_longitude'] ?? 72.8111);
  const points: { lat: number; lng: number }[] = [];
  const steps = 6;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    points.push({ lat: oLat + (dLat - oLat) * t, lng: oLng + (dLng - oLng) * t });
  }
  const meters = Math.round(
    6371000 *
      2 *
      Math.atan2(
        Math.sqrt(
          Math.sin(((dLat - oLat) * Math.PI) / 360) ** 2 +
            Math.cos((oLat * Math.PI) / 180) * Math.cos((dLat * Math.PI) / 180) * Math.sin(((dLng - oLng) * Math.PI) / 360) ** 2,
        ),
        1,
      ),
  );
  return {
    routes: [
      {
        legs: [
          {
            distance: { text: `${(meters / 1000).toFixed(1)} km`, value: meters },
            duration: { text: `${Math.round(meters / 1000 / 0.3)} mins`, value: Math.round(meters / (1000 / 30)) },
          },
        ],
        overview_polyline: { points: encodePolyline(points) },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Request handling
// ---------------------------------------------------------------------------

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

function num(value: unknown, fallback: number): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value);
  return fallback;
}

function maybeAdvanceApproval(s: MockState): void {
  if (s.driver.signup_step === 8) {
    s.pendingChecks += 1;
    if (s.pendingChecks >= 3) {
      s.driver.signup_step = 9;
      s.driver.online_config_status = 'saved';
    }
  }
}

// ---------------------------------------------------------------------------
// Phase 14 fixtures (documents, vehicles, segments, earnings, subscriptions)
// ---------------------------------------------------------------------------

function moneyText(amount: number): string {
  return `₹ ${amount.toFixed(2)}`;
}

function segmentListFixture(): Record<string, unknown>[] {
  return [
    { id: 'sg-1', segment_id: 'sg-1', segment_name: 'Ride', segment_slug: 'ride', icon: '', selected: 1, total_active_service_types: 2, total_selected_services: 2, total_time_slots: 7, total_selected_slots: 7 },
    { id: 'sg-2', segment_id: 'sg-2', segment_name: 'Delivery', segment_slug: 'delivery', icon: '', selected: 0, total_active_service_types: 3, total_selected_services: 0, total_time_slots: 7, total_selected_slots: 0 },
    { id: 'sg-3', segment_id: 'sg-3', segment_name: 'City Taxi', segment_slug: 'city-taxi', icon: '', selected: 0, total_active_service_types: 1, total_selected_services: 0, total_time_slots: 7, total_selected_slots: 0 },
    { id: 'sg-4', segment_id: 'sg-4', segment_name: 'Vehicle Towing', segment_slug: 'towing', icon: '', selected: 0, total_active_service_types: 2, total_selected_services: 0, total_time_slots: 7, total_selected_slots: 0 },
    { id: 'sg-5', segment_id: 'sg-5', segment_name: 'Handyman', segment_slug: 'handyman', icon: '', selected: 0, total_active_service_types: 4, total_selected_services: 0, total_time_slots: 0, total_selected_slots: 0 },
  ];
}

function vehicleBriefFixture(): Record<string, unknown>[] {
  const s = state();
  return s.vehicles.map((v) => ({
    driver_vehicle_id: String(v['driver_vehicle_id'] ?? v['id'] ?? ''),
    vehicle_number: String(v['vehicle_number'] ?? ''),
    vehicle_color: String(v['vehicle_color'] ?? ''),
    vehicle_model: String(v['vehicle_model'] ?? ''),
    vehicle_type: String(v['vehicle_type'] ?? ''),
    image: String(v['vehicle_image'] ?? ''),
  }));
}

function servicesForSegment(segmentId: string): Record<string, unknown>[] {
  switch (String(segmentId)) {
    case 'sg-2':
      return [
        { id: 'svc-2-1', service_type_id: 'svc-2-1', service_name: 'Parcel', price: '40', price_type: 'Negotiable', selected: 0 },
        { id: 'svc-2-2', service_type_id: 'svc-2-2', service_name: 'Letter', price: '20', price_type: 'Negotiable', selected: 0 },
        { id: 'svc-2-3', service_type_id: 'svc-2-3', service_name: 'Document', price: '25', price_type: 'Negotiable', selected: 0 },
      ];
    case 'sg-3':
      return [
        { id: 'svc-3-1', service_type_id: 'svc-3-1', service_name: 'City Taxi', price: '12', price_type: 'Per KM', selected: 0 },
      ];
    case 'sg-4':
      return [
        { id: 'svc-4-1', service_type_id: 'svc-4-1', service_name: 'Bike Tow', price: '499', price_type: 'Fixed', selected: 0 },
        { id: 'svc-4-2', service_type_id: 'svc-4-2', service_name: 'Car Tow', price: '999', price_type: 'Fixed', selected: 0 },
      ];
    case 'sg-5':
      return [
        { id: 'svc-5-1', service_type_id: 'svc-5-1', service_name: 'Plumbing', price: '350', price_type: 'Per Visit', selected: 0 },
        { id: 'svc-5-2', service_type_id: 'svc-5-2', service_name: 'Electrical', price: '300', price_type: 'Per Visit', selected: 0 },
        { id: 'svc-5-3', service_type_id: 'svc-5-3', service_name: 'Salon at home', price: '250', price_type: 'Per Visit', selected: 0 },
      ];
    default:
      return [
        { id: 'svc-1-1', service_type_id: 'svc-1-1', service_name: 'Hatchback', price: '9', price_type: 'Negotiable', selected: 1 },
        { id: 'svc-1-2', service_type_id: 'svc-1-2', service_name: 'Sedan', price: '12', price_type: 'Negotiable', selected: 1 },
      ];
  }
}

function segmentServicesConfigFixture(segmentId: string): Record<string, unknown> {
  const names: Record<string, string> = {
    'sg-1': 'Ride',
    'sg-2': 'Delivery',
    'sg-3': 'City Taxi',
    'sg-4': 'Vehicle Towing',
    'sg-5': 'Handyman',
  };
  const selected =
    segmentId === 'sg-1'
      ? servicesForSegment(segmentId)
      : servicesForSegment(segmentId).map((svc) => ({ ...svc, selected: 0 }));
  return {
    segment_id: segmentId,
    name: names[String(segmentId)] ?? 'Ride',
    currency: '₹',
    price_type: '2',
    price_type_text: 'Negotiable',
    minimum_booking_amount: '0',
    hourly_amount: '0',
    segment_group_id: '1',
    price_card_owner: '1',
    mandatory_doc_pending: 0,
    segment_doc_list: [],
    arr_services: selected,
  };
}

function timeSlotFixture(): Record<string, unknown> {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const time_slots = days.map((day, index) => ({
    id: `ts-day-${index + 1}`,
    day: day,
    day_name: day,
    is_selected: 1,
    service_time_slot: [
      { id: `ts-${index + 1}-1`, start_time: '06:00', end_time: '10:00', selected: 1 },
      { id: `ts-${index + 1}-2`, start_time: '17:00', end_time: '22:00', selected: 1 },
    ],
  }));
  return { time_slots };
}

function walletTransactionFixture(): Record<string, unknown>[] {
  const s = state();
  return [
    {
      driver_id: drvId(),
      transaction_type: 'Credit',
      payment_method: 'Cash',
      amount: moneyText(120.0),
      platform: 'Ride',
      date: 'Today, 09:41 AM',
      description: 'Earnings from #bk-9001',
      narration: 'Trip earnings',
      value_color: '#198754',
      icon: '',
      date_timestamp: Math.floor(Date.now() / 1000),
      wallet_details: [
        { parameter_name: 'Trip fare', value: moneyText(220.0), colour: '#212529', bold: 1, narration: 'Basic fare' },
        { parameter_name: 'Wallet credit', value: moneyText(120.0), colour: '#198754', bold: 0, narration: '50% cash collected' },
      ],
    },
    {
      driver_id: drvId(),
      transaction_type: 'Debit',
      payment_method: 'Wallet',
      amount: moneyText(50.0),
      platform: 'Cashout',
      date: 'Yesterday, 06:15 PM',
      description: 'Requested cashout',
      narration: 'Wallet to bank',
      value_color: '#dc3545',
      icon: '',
      date_timestamp: Math.floor(Date.now() / 1000) - 86400,
      wallet_details: [
        { parameter_name: 'Paid to', value: 'Self bank', colour: '#212529', bold: 0, narration: 'Cashout' },
        { parameter_name: 'Debited', value: moneyText(50.0), colour: '#dc3545', bold: 1, narration: 'Cashout' },
      ],
    },
    {
      driver_id: drvId(),
      transaction_type: 'Credit',
      payment_method: 'Wallet',
      amount: moneyText(25.0),
      platform: 'Ride',
      date: 'Mon, 09:12 AM',
      description: 'Earnings from #bk-8010',
      narration: 'Trip earnings',
      value_color: '#198754',
      icon: '',
      date_timestamp: Math.floor(Date.now() / 1000) - 5 * 86400,
      wallet_details: [
        { parameter_name: 'Trip fare', value: moneyText(99.0), colour: '#212529', bold: 1, narration: 'Basic fare' },
        { parameter_name: 'Wallet credit', value: moneyText(25.0), colour: '#198754', bold: 0, narration: 'Cash collected' },
      ],
    },
  ];
}

function drvId(): string {
  return state().driver.id;
}

function accountEarningsFixture(): Record<string, unknown> {
  return {
    total_earnings: '₹ 1,240.00',
    received_cash: '₹ 360.00',
    received_in_wallet: '₹ 880.00',
    from_timestamp: Math.floor(Date.now() / 1000) - 6 * 86400,
    to_timestamp: Math.floor(Date.now() / 1000),
    wallet_balance: moneyText(state().walletBalance),
    total_billed_to_consumer: '₹ 1,840.00',
    holder_data: [
      { parameter_name: 'Gross earnings', value: '₹ 1,840.00', colour: '#212529', bold: 1, narration: 'Total billed this week' },
      { parameter_name: 'Commission', value: '₹ 600.00', colour: '#dc3545', bold: 0, narration: 'Fixcycle service fee' },
      { parameter_name: 'Net earnings', value: '₹ 1,240.00', colour: '#198754', bold: 1, narration: 'Driver take home' },
    ],
    trips_details: {
      total_trips_in_week: 14,
      overall_rating_in_week: '4.9',
      trips_data: [
        {
          timestamp: Math.floor(Date.now() / 1000) - 86400,
          date_text: 'Mon, 06 Jul',
          completed_rides: 6,
          day_earning: '₹ 620.00',
          day_rating: '5.0',
          trips: [
            { order_no: '#bk-9010', order_id: 'bk-9010', time_of_booking: '09:12 AM', order_name: 'Hatchback', segment_image: '', segment_slug: 'ride', sub_group_for_app: 'Ride', amount: '₹ 160.00' },
            { order_no: '#bk-9011', order_id: 'bk-9011', time_of_booking: '12:40 PM', order_name: 'Sedan', segment_image: '', segment_slug: 'ride', sub_group_for_app: 'Ride', amount: '₹ 220.00' },
          ],
        },
        {
          timestamp: Math.floor(Date.now() / 1000) - 2 * 86400,
          date_text: 'Sun, 05 Jul',
          completed_rides: 8,
          day_earning: '₹ 620.00',
          day_rating: '4.8',
          trips: [
            { order_no: '#bk-9006', order_id: 'bk-9006', time_of_booking: '10:05 AM', order_name: 'Hatchback', segment_image: '', segment_slug: 'ride', sub_group_for_app: 'Ride', amount: '₹ 140.00' },
          ],
        },
      ],
    },
    total_rides: 14,
    completion_rate: 96,
    online_time: '42h 10m',
    avg_rating: '4.9',
  };
}

function packageListItem(pkg: Record<string, unknown>, packDetails: Record<string, unknown>, text: string, status: number): Record<string, unknown> {
  return {
    id: String(pkg['id']),
    name: String(pkg['name']),
    expire_date: String(pkg['expire_date'] ?? ''),
    package_type: String(pkg['package_type'] ?? ''),
    description: String(pkg['description'] ?? ''),
    show_price: String(pkg['show_price'] ?? ''),
    package_duration_name: String(pkg['package_duration_name'] ?? ''),
    image: String(pkg['image'] ?? ''),
    segment_name: String(pkg['segment_name'] ?? ''),
    vehicle_type: String(pkg['vehicle_type'] ?? ''),
    max_trip: num(pkg['max_trip'], 0),
    text,
    status,
    pack_details: packDetails,
    amount: String(pkg['amount'] ?? ''),
    price_type: String(pkg['price_type'] ?? ''),
  };
}

function activePackDetails(totalTrips: number, used: number): Record<string, unknown> {
  return {
    id: 'sub-rec-1',
    used_trip: used,
    start_time: '2026-07-01 00:00:00',
    end_time: '2026-07-07 23:59:59',
    status: 2,
    total_trip_summary: {
      carry_forwarded: '',
      status: 0,
      total_trips: totalTrips,
      package_trips: 50,
      carry_forwarded_trips: totalTrips - used,
    },
  };
}

function subscriptionPackagesFixture(): Record<string, unknown>[] {
  const s = state();
  return s.subscriptions.map((pkg) => {
    const active = s.activeSubscriptions.find((a) => String(a['id']) === String(pkg['id']));
    if (active) {
      return packageListItem(pkg, activePackDetails(num(pkg['max_trip'], 50), 12), 'Activated', 2);
    }
    return packageListItem(pkg, {}, 'Buy / Activate', 0);
  });
}

function subscriptionHistoryFixture(): Record<string, unknown>[] {
  const s = state();
  const used = s.subscriptions[0];
  if (!used) {
    return [];
  }
  return [
    packageListItem(used, activePackDetails(50, 50), 'Expired', 3),
  ];
}

function handleDriver(path: string[], body: Record<string, unknown>): Ok {
  const s = state();
  const d = s.driver;
  switch (path[1]) {
    case 'configuration':
      return onlyData({
        app_name: 'Fixcycle',
        business_logo: '',
        general_config: { splash_screen: '' },
        system_code: 'fixcycle',
      });

    case 'otp':
      return onlyData({ auto_fill: true, otp: '123456', default_otp_enable: true, default_otp: '123456' });

    case 'login':
      // /driver/login/otp, /driver/login/password (fallback), etc.
      return onlyData(tokenPayload(d));

    case 'on-board': {
      const phone = String(body['phone'] || '').replace(/\D/g, '');
      if (phone.length < 8) {
        return onlyData({ message: 'Enter a valid phone number' });
      }
      return onlyData(tokenPayload(d));
    }

    case 'demo-onboard': {
      s.driver = freshDemoDriver();
      return onlyData(tokenPayload(s.driver));
    }

    case 'details':
      maybeAdvanceApproval(s);
      return onlyData(driverResource(d));

    case 'out-board':
      return onlyData({ message: 'Logged out' });

    case 'reg-step-one': {
      d.first_name = String(body['first_name'] ?? d.first_name);
      d.last_name = String(body['last_name'] ?? d.last_name);
      d.email = String(body['email'] ?? d.email);
      d.signup_step = 2;
      return onlyData({ driver: driverResource(d) });
    }
    case 'reg-step-two': {
      d.signup_step = 3;
      return onlyData({ driver: driverResource(d) });
    }
    case 'reg-step-three': {
      d.signup_step = 5;
      return onlyData({ driver: driverResource(d) });
    }
    case 'reg-step-five': {
      const segmentList = body['segments'];
      if (Array.isArray(segmentList)) {
        d.segments = segmentList.flatMap((entry) => {
          const record = typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>) : null;
          if (!record) return [];
          return [{ segment_slug: String(record['segment_slug'] ?? record['slug'] ?? ''), segment_name: String(record['segment_name'] ?? '') }];
        });
      }
      d.signup_step = 7;
      d.work_set = 1;
      return onlyData({ driver: driverResource(d) });
    }
    case 'save-segment-config': {
      d.signup_step = 7;
      d.work_set = 1;
      return onlyData({ driver: driverResource(d) });
    }
    case 'save-service-time-slot': {
      d.signup_step = 8;
      s.pendingChecks = 0;
      return onlyData({ driver: driverResource(d) });
    }

    case 'get-main-screen-config':
      maybeAdvanceApproval(s);
      return onlyData(mainScreenConfig(d));

    case 'get-online-work-config': {
      const segments = d.segments.length > 0 ? d.segments : [{ segment_slug: 'ride', segment_name: 'Ride' }];
      return onlyData({ ...d.preference, segments });
    }

    case 'save-online-work-config': {
      d.preference.voice_alert_enable = body['voice_alert_enable'] !== undefined ? num(body['voice_alert_enable'], 1) : d.preference.voice_alert_enable;
      d.preference.auto_accept_enable = body['auto_accept_enable'] !== undefined ? num(body['auto_accept_enable'], 0) : d.preference.auto_accept_enable;
      d.preference.ride_accept_radius = body['ride_accept_radius'] !== undefined ? num(body['ride_accept_radius'], 5) : d.preference.ride_accept_radius;
      d.online_config_status = 'saved';
      return onlyData({ saved: 1 });
    }

    case 'location':
      return onlyData({ saved: 1 });

    case 'online-offline': {
      const value = num(body['provider_online'], 0);
      d.online_enable = value === 1 ? 1 : 0;
      return onlyData({ provider_online: d.online_enable });
    }

    case 'booking-order-info': {
      const booking = findBooking(body['booking_order_id'] as string | number | undefined);
      return onlyData(booking);
    }

    case 'booking-order-accept-reject': {
      const status = String(body['status'] || 'ACCEPT');
      return onlyData({ message: status === 'REJECT' ? 'Request declined' : 'Request accepted' });
    }

    case 'arrived-at-pickup':
      return onlyData({ message: 'Arrived' });

    case 'booking-order-picked':
      return onlyData({ message: 'Picked up' });

    case 'direction-data':
      return onlyData(directionData(body, body));

    case 'booking':
      // /driver/booking/end, /driver/booking/payment-confirmation, /driver/booking/in-drive-counter
      if (path[2] === 'payment-confirmation') {
        return onlyData({ message: 'Payment confirmed' });
      }
      if (path[2] === 'in-drive-counter') {
        return onlyData({ message: 'Counter offer sent' });
      }
      return onlyData({ message: 'Trip ended' });

    case 'get-active-booking-order': {
      const active: MockBooking[] = [bookingFixture()];
      return onlyData({ bookings: active });
    }

    case 'get-past-booking-order':
      return onlyData({ bookings: pastBookings() });

    case 'get-booking-order-details': {
      const booking = findBooking(body['booking_order_id'] as string | number | undefined);
      return onlyData(booking);
    }

    case 'get-booking-order-payment-info': {
      const booking = findBooking(body['booking_order_id'] as string | number | undefined);
      return onlyData({
        total_amount: String(booking['total_amount'] ?? '185'),
        currency: '₹',
        payment_method: 'Cash',
        cash_amount: String(booking['total_amount'] ?? '185'),
        online_amount: '0',
      });
    }

    case 'complete-booking-order':
      return onlyData({ message: 'Booking completed' });

    case 'get-document-list': {
      const docFor = String(body['document_for'] ?? 'ALL');
      const byFor = (forType: string): Record<string, unknown>[] =>
        s.documents.filter((d) => String(d['document_for']) === forType);
      const vehicleDoc = s.vehicles.map((v) => ({
        vehicle_id: v['id'],
        driver_vehicle_id: v['driver_vehicle_id'] ?? v['id'],
        vehicle_type: String(v['vehicle_type'] ?? ''),
        vehicle_type_image: String(v['vehicle_type_image'] ?? ''),
        vehicle_number: String(v['vehicle_number'] ?? ''),
        vehicle_status: 'Pending approval',
        document_list: byFor('VEHICLE').filter(
          (d) => d['driver_vehicle_id'] === (v['driver_vehicle_id'] ?? v['id']),
        ),
      }));
      const segmentDoc = segmentListFixture().map((seg) => ({
        segment_id: String(seg['segment_id'] ?? seg['id']),
        segment_name: String(seg['segment_name'] ?? ''),
        icon: String(seg['icon'] ?? ''),
        checkable: seg['segment_slug'] !== 'handyman' ? 1 : 0,
        document_list: byFor('SEGMENT').filter(
          (d) => String(d['segment_id']) === String(seg['segment_id'] ?? seg['id']),
        ),
      }));
      return onlyData({
        personal_doc: docFor === 'ALL' || docFor === 'PERSONAL' ? byFor('PERSONAL') : [],
        vehicle_doc: docFor === 'ALL' || docFor === 'VEHICLE' ? vehicleDoc : [],
        segment_doc: docFor === 'ALL' || docFor === 'SEGMENT' ? segmentDoc : [],
      });
    }

    case 'add-document': {
      const docId = `pd-${s.documentSeq++}`;
      const type = num(body['type'], 1);
      const uploadKey = type === 2 ? 'temp_document_file' : 'document_file';
      const statusKey = type === 2 ? 'temp_document_verification_status' : 'document_verification_status';
      const file = String(body['document_image'] ?? '');
      const doc: Record<string, unknown> = {
        id: docId,
        document_id: String(body['document_id'] ?? ''),
        documentname: String(body['document_name'] ?? ''),
        document_for: String(body['document_for'] ?? 'PERSONAL'),
        document_mandatory: 1,
        document_number_required: num(body['document_number_required'], 0),
        document_number: String(body['document_number'] ?? ''),
        expire_status: num(body['expire_status'], 0),
        expire_date: String(body['expire_date'] ?? ''),
        type,
        [uploadKey]: file,
        [statusKey]: 'Pending',
        document_status_int: 3,
        temp_doc_status: type === 2 ? 3 : 0,
      };
      if (body['driver_vehicle_id']) {
        doc['driver_vehicle_id'] = String(body['driver_vehicle_id']);
      }
      if (body['segment_id']) {
        doc['segment_id'] = String(body['segment_id']);
      }
      s.documents.push(doc);
      return onlyData({ message: 'Document submitted for review', id: docId });
    }

    case 'driver-all-document':
      return onlyData(s.documents);

    case 'check-expired-document':
      return onlyData(s.documents.filter((d) => num(d['expire_status'], 0) === 1));

    case 'expiredocuments':
      return onlyData(s.documents.filter((d) => num(d['expire_status'], 0) === 1));

    case 'vehicle-configuration':
      return onlyData({
        vehicle_type: [
          { id: 'vt-1', vehicle_type: 'Four Seater', vehicle_type_image: '' },
          { id: 'vt-2', vehicle_type: 'Five Seater', vehicle_type_image: '' },
          { id: 'vt-3', vehicle_type: 'Bicycle', vehicle_type_image: '' },
        ],
        vehicle_make: [
          { id: 'vm-1', vehicle_make: 'Maruti Suzuki' },
          { id: 'vm-2', vehicle_make: 'Tata' },
          { id: 'vm-3', vehicle_make: 'Hyundai' },
          { id: 'vm-4', vehicle_make: 'Hero' },
        ],
      });

    case 'vehicle-model': {
      const make = String(body['vehicle_make_id'] ?? '');
      const models: Record<string, string>[] =
        make === 'vm-2'
          ? [
              { id: 'mod-2-1', vehicleTypeName: 'Nexon' },
              { id: 'mod-2-2', vehicleTypeName: 'Tiago' },
              { id: 'mod-2-3', vehicleTypeName: 'Altroz' },
            ]
          : make === 'vm-3'
            ? [
                { id: 'mod-3-1', vehicleTypeName: 'i20' },
                { id: 'mod-3-2', vehicleTypeName: 'Creta' },
                { id: 'mod-3-3', vehicleTypeName: 'Verna' },
              ]
            : make === 'vm-4'
              ? [
                  { id: 'mod-4-1', vehicleTypeName: 'Splendor' },
                  { id: 'mod-4-2', vehicleTypeName: 'Passion Pro' },
                  { id: 'mod-4-3', vehicleTypeName: 'HF Deluxe' },
                ]
              : [
                  { id: 'mod-1-1', vehicleTypeName: 'Swift' },
                  { id: 'mod-1-2', vehicleTypeName: 'Wagon R' },
                  { id: 'mod-1-3', vehicleTypeName: 'Dzire' },
                ];
      return onlyData({ model: models });
    }

    case 'add-vehicle': {
      const vehicleId = `dv-${s.vehicleSeq++}`;
      const vehicle: Record<string, unknown> = {
        id: vehicleId,
        driver_vehicle_id: vehicleId,
        vehicle_type: String(body['vehicle_type'] ?? 'Four Seater'),
        vehicle_type_image: String(body['vehicle_type_image'] ?? ''),
        vehicle_make: String(body['vehicle_make'] ?? ''),
        vehicle_model: String(body['vehicle_model'] ?? ''),
        vehicle_number: String(body['vehicle_number'] ?? ''),
        vehicle_color: String(body['vehicle_color'] ?? ''),
        vehicle_image: String(body['vehicle_image'] ?? ''),
        vehicle_number_plate_image: String(body['vehicle_number_plate_image'] ?? ''),
        vehicle_seat: String(body['vehicle_seat'] ?? '4'),
        vehicle_verification_status: 2,
        active_status: 2,
        show_message: 'In review',
        message_background_color: '#fff3cd',
        other_pending: 0,
        pool_enable: num(body['pool_enable'], 0),
        shareCode: `VHC${9000 + s.vehicleSeq}`,
        is_detached: 0,
        vehicle_expire_date: '',
        vehicle_register_date: new Date().toISOString().slice(0, 10),
      };
      s.vehicles.push(vehicle);
      return onlyData({ driver_vehicle_id: vehicleId, message: 'Vehicle submitted for approval' });
    }

    case 'vehicle': {
      if (path[2] === 'otp') {
        const otp = String(body['otp'] ?? '');
        const vid = String(body['driver_vehicle_id'] ?? '');
        const v = s.vehicles.find((x) => x['driver_vehicle_id'] === vid || x['id'] === vid);
        if (otp === '1234') {
          if (v) {
            v['vehicle_verification_status'] = 3;
            v['show_message'] = 'Pending approval';
            v['message_background_color'] = '#fff3cd';
          }
          return onlyData({ message: 'OTP verified', verified: 1 });
        }
        return onlyData({ message: 'Invalid OTP', verified: 0 });
      }
      return ok({ path }, 'Mock vehicle endpoint');
    }

    case 'vehicle-request': {
      const code = String(body['code'] ?? '');
      const existing = s.vehicles.find((v) => String(v['shareCode']) === code);
      if (existing) {
        existing['active_status'] = 1;
        existing['vehicle_verification_status'] = 1;
        return onlyData({ message: 'Vehicle attached', vehicle: existing });
      }
      return onlyData({ message: 'Vehicle not found. Check the share code.' });
    }

    case 'get-vehicle-list':
      return onlyData(s.vehicles);

    case 'changeVehicle': {
      const vid = String(body['driver_vehicle'] ?? '');
      s.vehicles.forEach((v) => {
        v['active_status'] =
          String(v['driver_vehicle_id']) === vid || String(v['id']) === vid ? 1 : 2;
      });
      return onlyData({ message: 'Active vehicle updated' });
    }

    case 'get-segment-list':
      return onlyData({
        arr_segment: segmentListFixture(),
        vehicle: vehicleBriefFixture(),
      });

    case 'get-enrolled-segments':
      return onlyData(segmentListFixture().filter((seg) => num(seg['selected'], 0) === 1));

    case 'get-segment-services':
      return onlyData(segmentServicesConfigFixture(String(body['segment_id'] ?? 'sg-1')));

    case 'service-slots':
      return onlyData(timeSlotFixture());

    case 'get-segment-gallery':
      return onlyData(s.gallery);

    case 'save-segment-gallery': {
      s.gallery.push({
        id: `g-${s.gallerySeq++}`,
        image: String(body['image'] ?? ''),
        image_title: String(body['image_title'] ?? ''),
      });
      return onlyData(s.gallery);
    }

    case 'delete-segment-gallery': {
      const imageId = String(body['image_id'] ?? '');
      s.gallery = s.gallery.filter((g) => String(g['id']) !== imageId);
      return onlyData(s.gallery);
    }

    case 'wallet': {
      switch (path[2]) {
        case 'transaction':
          return onlyData({
            wallet_money: moneyText(s.walletBalance),
            recent_transactions: walletTransactionFixture(),
            total_pages: 1,
            next_page_url: null,
            current_page: 1,
          });
        case 'add-money': {
          const amount = num(body['amount'], 0);
          if (amount > 0) {
            s.walletBalance += amount;
          }
          return onlyData({ wallet_money: moneyText(s.walletBalance), message: 'Amount added to wallet' });
        }
        default:
          return ok({ path }, 'Mock wallet endpoint');
      }
    }

    case 'withdraw-driver-wallet': {
      const amount = num(body['amount'], 0);
      if (amount <= 0 || amount > s.walletBalance) {
        return onlyData({ message: 'Insufficient wallet balance' });
      }
      s.walletBalance -= amount;
      return onlyData({ message: 'Withdrawal initiated' });
    }

    case 'account': {
      if (path[2] === 'earnings') {
        return onlyData(accountEarningsFixture());
      }
      return ok({ path }, 'Mock account endpoint');
    }

    case 'cashout': {
      switch (path[2]) {
        case 'history':
          return onlyData(s.cashouts);
        case 'request': {
          const amount = num(body['amount'], 0);
          if (amount <= 0 || amount > s.walletBalance) {
            return onlyData({ message: 'Insufficient wallet balance' });
          }
          s.walletBalance -= amount;
          s.cashouts.unshift({
            id: `co-${s.cashoutSeq++}`,
            amount: moneyText(amount),
            cashout_status: 'Pending',
            action_by: '',
            transaction_id: '',
            comment: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          return onlyData({ message: 'Cashout request submitted' });
        }
        default:
          return ok({ path }, 'Mock cashout endpoint');
      }
    }

    case 'get-subscriptions-list':
      return onlyData({
        all_packages: subscriptionPackagesFixture(),
        payment_methods: [{ id: '1', payment_method: 'Wallet', payment_icon: '' }],
      });

    case 'get-subscriptions-history':
      return onlyData({ packages_history: subscriptionHistoryFixture() });

    case 'get-active-subscription': {
      const active = s.subscriptions
        .filter((pkg) => s.activeSubscriptions.some((a) => a['id'] === pkg['id']))
        .map((pkg) => packageListItem(pkg, activePackDetails(num(pkg['max_trip'], 50), 12), 'Activated', 2));
      return onlyData({ all_packages: active, packages: active });
    }

    case 'activate-subscription-package': {
      const pid = String(body['package_id'] ?? '');
      const found = s.subscriptions.find((pkg) => String(pkg['id']) === pid);
      if (!found) {
        return onlyData({ message: 'Package not found' });
      }
      if (!s.activeSubscriptions.some((a) => a['id'] === pid)) {
        s.activeSubscriptions.push({ id: pid });
      }
      return onlyData({ message: 'Package activated successfully' });
    }

    case 'chat': {
      if (path[2] === 'send_message') {
        return onlyData({
          id: `cm-${Date.now()}`,
          message: String(body['message'] ?? ''),
          to_driver: 0,
          date_timestamp: Math.floor(Date.now() / 1000),
          date: 'Just now',
        });
      }
      const now = Math.floor(Date.now() / 1000);
      return onlyData({
        messages: [
          { id: 'cm-1', message: 'Hi, I am near the pickup point.', to_driver: 1, date_timestamp: now - 300, date: '09:15 AM' },
          { id: 'cm-2', message: "Great, I'll be there in 2 minutes.", to_driver: 0, date_timestamp: now - 240, date: '09:16 AM' },
        ],
      });
    }

    case 'handyman': {
      switch (path[2]) {
        case 'get-orders':
          return onlyData([
            {
              id: 'hm-1',
              booking_order_id: 'hm-1',
              service_name: 'Plumbing repair',
              user_first_name: 'Rohan',
              pickup_address: 'Bandra West, Mumbai',
              drop_address: 'Bandra West, Mumbai',
              total_amount: '350',
              currency: '₹',
              otp: '4321',
              booking_status: 1001,
              status_text: 'New',
              created_at: new Date().toISOString(),
            },
          ]);
        case 'get-order':
          return onlyData({
            data: {
              id: 'hm-1',
              booking_order_id: 'hm-1',
              service_name: 'Plumbing repair',
              user_first_name: 'Rohan',
              user_phone: '+91 98100 00009',
              pickup_address: 'Bandra West, Mumbai',
              drop_address: 'Bandra West, Mumbai',
              total_amount: '350',
              currency: '₹',
              otp: '4321',
              booking_status: 1001,
              status_text: 'New',
              created_at: new Date().toISOString(),
            },
          });
        case 'bid-order':
          return onlyData({ message: 'Bid submitted' });
        case 'accept-reject-order':
          return onlyData({ message: 'Handyman order updated' });
        case 'cancel-order':
          return onlyData({ message: 'Handyman order cancelled' });
        case 'start-order-otp':
          return onlyData({ auto_fill: true, otp: '1234' });
        case 'start-order':
          return onlyData({ message: 'Handyman order started' });
        case 'arrive-order':
          return onlyData({ message: 'Marked arrived' });
        case 'end-order':
          return onlyData({ message: 'Handyman order ended' });
        case 'update-payment-order':
          return onlyData({ message: 'Payment status updated' });
        case 'complete-order':
          return onlyData({ message: 'Handyman order completed' });
        case 'raise-concern':
          return onlyData({ message: 'Concern raised' });
        default:
          return ok({ path }, 'Mock handyman endpoint');
      }
    }

    case 'bus-booking': {
      switch (path[2]) {
        case 'home-screen':
          return onlyData({
            bus: {
              id: 'bus-1',
              bus_number: 'MH-01-BUS-1',
              route_name: 'CST → Bandra',
              available: 1,
            },
          });
        case 'get-bookings':
        case 'master-bookings':
          return onlyData([
            {
              id: 'bb-1',
              booking_id: 'bb-1',
              passenger_name: 'Sneha',
              pickup_stop: 'CST',
              drop_stop: 'Bandra',
              seat_number: '12',
              booking_status: 1001,
              status_text: 'New',
              created_at: new Date().toISOString(),
            },
          ]);
        case 'get-booking':
          return onlyData({
            data: {
              id: 'bb-1',
              booking_id: 'bb-1',
              passenger_name: 'Sneha',
              pickup_stop: 'CST',
              drop_stop: 'Bandra',
              seat_number: '12',
              booking_status: 1001,
              status_text: 'New',
              created_at: new Date().toISOString(),
            },
          });
        case 'get-booking-stop-detail':
          return onlyData({
            stop: { id: 'stop-1', name: 'CST', arrival_time: '09:00' },
            passengers: [{ seat_number: '12', passenger_name: 'Sneha' }],
          });
        case 'start-booking':
          return onlyData({ message: 'Bus trip started' });
        case 'pickup-drop':
          return onlyData({ message: 'Passenger picked up' });
        case 'get-passenger-booking':
          return onlyData({ passenger: { seat_number: '12', passenger_name: 'Sneha' } });
        case 'end-booking':
          return onlyData({ message: 'Bus trip ended' });
        case 'bus-stop-status-update':
          return onlyData({ message: 'Stop status updated' });
        default:
          return ok({ path }, 'Mock bus-booking endpoint');
      }
    }

    case 'laundry-outlet': {
      if (path[2] === 'order-otp-verification') {
        return onlyData({ message: 'Delivery OTP verified', verified: 1 });
      }
      if (path[2] === 'deliver-order') {
        return onlyData({ message: 'Laundry order delivered' });
      }
      return ok({ path }, 'Mock laundry-outlet endpoint');
    }

    default:
      return ok({ path }, 'Mock driver endpoint');
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path = [] } = await ctx.params;
  let payload: Ok;
  if (path[0] === 'driver') {
    const body = await readBody(req);
    payload = handleDriver(path, body);
  } else {
    payload = onlyData({ path, note: 'Unknown mock path' });
  }
  return NextResponse.json(payload);
}