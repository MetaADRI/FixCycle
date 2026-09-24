#!/usr/bin/env node
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Fixcycle standalone API server â€” zero dependencies
// Reimplements the Laravel API routes the PWA user app needs for the ride
// flow (boot â†’ auth â†’ home â†’ plan â†’ checkout â†’ confirm â†’ tracking â†’ receipt).
// Routes are derived from pwa/packages/api-client/src/endpoints/*.ts.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const http = require('node:http');
const { randomUUID, randomInt } = require('node:crypto');

// Load optional .env (e.g. DATABASE_URL) â€” guarded so a missing dotenv install
// never breaks the server when persistence is not configured.
try { require('dotenv').config(); } catch (_) { /* dotenv not installed â€” fine */ }

const PORT = Number(process.env.PORT) || 4001;

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ok(data, message = 'OK') {
  return { version: '1.5', result: '1', message, data, time: Date.now() };
}

function fail(message, data = {}) {
  return { version: '1.5', result: '0', message, data, time: Date.now() };
}

function pick(v, fallback) {
  if (typeof v === 'string' && v.length > 0) return v;
  if (typeof v === 'number') return String(v);
  return fallback;
}

function bool(v) {
  return v === true || v === 1 || v === '1';
}

function num(v, fallback) {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

// Simple polyline encoder for route polylines
function encodeSigned(value) {
  let shifted = value < 0 ? ~(value << 1) : value << 1;
  let output = '';
  while (shifted >= 0x20) {
    output += String.fromCharCode(0x20 | (shifted & 0x1f) + 63);
    shifted >>= 5;
  }
  output += String.fromCharCode(shifted + 63);
  return output;
}

function encodePolyline(points) {
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

function interpolate(aLat, aLng, bLat, bLng, t) {
  const c = Math.max(0, Math.min(1, t));
  return { lat: aLat + (bLat - aLat) * c, lng: aLng + (bLng - aLng) * c };
}

function polylineFor(ref, progress) {
  const pts = [];
  const steps = 6;
  for (let i = 0; i <= steps; i++) pts.push(interpolate(ref.pickupLat, ref.pickupLng, ref.dropLat, ref.dropLng, i / steps));
  return encodePolyline(pts);
}

const CURRENCY = 'â‚¹';
function round2(n) { return Math.round(n * 100) / 100; }
function fmtCurrency(n) { return `${CURRENCY} ${round2(n).toFixed(2)}`; }

// â”€â”€ Seed data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const COUNTRY = { id: 91, name: 'India', phonecode: '+91', country_code: 'IN', iso: 'IN', currency: 'INR', minNumPhone: 10, maxNumPhone: 10, country_status: 1 };

const LANGUAGES = [{ id: 1, name: 'English', short_name: 'EN' }];

const CONFIGURATION = {
  app_name: 'Fixcycle',
  business_logo: '',
  language: 'en',
  general_config: {
    splash_screen: 'Fixcycle',
    default_language: 'en',
    guest_user: 1,
    guest_user_country_id: 91,
    network_code_visibility: 0,
    referral_code_mandatory_user_signup: 0,
    user_cpf_number_enable: 0,
    password_length_for_app: 8,
    encrypt_decrypt_enable: 0,
    user_login: 'PHONE',
    user_signup_card_store_enable: 1,
    user_cars_update_time: 10,
    cms_pages: [],
  },
  theme_cofig: { primary_color_user: '#ff6b35', user_app_logo: '' },
  bg_color_primary: '#0b1b3f',
  bg_color_secondary: '#ff6b35',
  text_color_primary: '#101828',
  text_color_secondary: '#667085',
  login: { email: 0, phone: 1, otp: 1, skip_login: 0, ignore_login: 0 },
  register: { phone: 1, email: 0, gender: 0, userImage_enable: 0, smoker: 0, userEmailVisibility: 0, userEmailOtp: 0, userPhoneOtp: 1 },
  social: { enable: 0, google: 0, facebook: 0 },
  languages: LANGUAGES,
  countries: [{ ...COUNTRY }],
};

const AREAS = [
  { id: 1, country_id: 91, AreaName: 'Mumbai', latitude: 19.076, longitude: 72.8777, status: 1 },
  { id: 2, country_id: 91, AreaName: 'Delhi', latitude: 28.6139, longitude: 77.209, status: 1 },
];

const VEHICLES = [
  { id: 11, vehicleTypeName: 'Mini', vehicleTypeDescription: 'Small rides, low fare', vehicleTypeImage: '', vehicleTypeMapImage: '', ride_now: 1, ride_later: 1, estimate_fare: 145, sequence: 1 },
  { id: 12, vehicleTypeName: 'Sedan', vehicleTypeDescription: 'Comfortable sedans', vehicleTypeImage: '', vehicleTypeMapImage: '', ride_now: 1, ride_later: 1, estimate_fare: 185, sequence: 2 },
  { id: 13, vehicleTypeName: 'SUV', vehicleTypeDescription: 'Spacious for groups', vehicleTypeImage: '', vehicleTypeMapImage: '', ride_now: 1, ride_later: 1, estimate_fare: 240, sequence: 3 },
];

const SERVICE_TYPES = [
  { id: 1001, serviceName: 'Taxi', sequence: 1, type: 1, vehicles: VEHICLES, arr_category: [] },
  { id: 1002, serviceName: 'Premium', sequence: 2, type: 1, vehicles: [], arr_category: [] },
];

// Rental hour packages (per vehicle + area).
const SERVICE_PACKAGES = [
  { id: 1, PackageName: '4 hrs / 40 km', hours: 4, kms: 40 },
  { id: 2, PackageName: '8 hrs / 80 km', hours: 8, kms: 80 },
  { id: 3, PackageName: '12 hrs / 120 km', hours: 12, kms: 120 },
];

// Transfer hourly packages (airport / hourly transfer, per vehicle).
const TRANSFER_PACKAGES = [
  { id: 11, PackageName: '2 hrs / 30 km', hours: 2, kms: 30 },
  { id: 12, PackageName: '4 hrs / 60 km', hours: 4, kms: 60 },
  { id: 13, PackageName: '8 hrs / 120 km', hours: 8, kms: 120 },
];

// Transfer service type id (distinct from Taxi 1001 / Premium 1002).
const TRANSFER_SERVICE_TYPE = 1003;

// Pool (carpool) service type id â€” matches the Android app's pool segment.
const POOL_SERVICE_TYPE = 5;

// Delivery service type id.
const DELIVERY_SERVICE_TYPE = 6;

const DELIVERY_PACKAGES = [
  { id: 201, package_name: 'Small Envelope', weight: 0.5, price: 49, package_length: 30, package_width: 20, package_height: 5, engine_type: 'bike' },
  { id: 202, package_name: 'Medium Box', weight: 3, price: 99, package_length: 40, package_width: 30, package_height: 20, engine_type: 'bike' },
  { id: 203, package_name: 'Large Box', weight: 10, price: 179, package_length: 60, package_width: 40, package_height: 30, engine_type: 'van' },
  { id: 204, package_name: 'Extra Large Parcel', weight: 25, price: 299, package_length: 80, package_width: 50, package_height: 40, engine_type: 'van' },
];

const DELIVERY_PRODUCT_TYPES = [
  { id: 1, category_name: 'Documents' },
  { id: 2, category_name: 'Electronics' },
  { id: 3, category_name: 'Clothing' },
  { id: 4, category_name: 'Food & Groceries' },
  { id: 5, category_name: 'Fragile Items' },
  { id: 6, category_name: 'Medicines' },
  { id: 7, category_name: 'Other' },
];

const DELIVERY_PRODUCTS = [
  { id: 301, product_name: 'Documents / Letters', description: 'Papers, envelopes, legal docs', weight: 0.2, category_id: 1, price: 0 },
  { id: 302, product_name: 'Laptop / Tablet', description: 'Electronics up to 5kg', weight: 2, category_id: 2, price: 0 },
  { id: 303, product_name: 'Small Garment', description: 'Shirts, dresses, small clothing', weight: 0.5, category_id: 3, price: 0 },
  { id: 304, product_name: 'Meal / Tiffin', description: 'Home-cooked or restaurant food', weight: 1, category_id: 4, price: 0 },
  { id: 305, product_name: 'Glass / Ceramics', description: 'Fragile â€” handle with care', weight: 2, category_id: 5, price: 10 },
  { id: 306, product_name: 'Medicine / Prescription', description: 'Pharmacy items', weight: 0.3, category_id: 6, price: 0 },
  { id: 307, product_name: 'General Parcel', description: 'Anything else under 25kg', weight: 3, category_id: 7, price: 0 },
];

const DELIVERY_VEHICLES = [
  { id: 14, name: 'Bike Delivery', capacity_kg: 5, image: '', fare_per_km: 12, fare_per_min: 1, base_fare: 29, ride_fare: '29', ride_fare_text: 'From 29' },
  { id: 15, name: 'Auto Delivery', capacity_kg: 20, image: '', fare_per_km: 18, fare_per_min: 1.5, base_fare: 49, ride_fare: '49', ride_fare_text: 'From 49' },
  { id: 16, name: 'Van Delivery', capacity_kg: 50, image: '', fare_per_km: 25, fare_per_min: 2, base_fare: 99, ride_fare: '99', ride_fare_text: 'From 99' },
];

// â”€â”€ Food ordering mock data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const FOOD_SEGMENT_ID = 2;

const FOOD_STORES = [
  { id: 301, full_name: 'Spice Garden', address: '12 MG Road, Mumbai', latitude: 19.076, longitude: 72.877, rating: 4.5, review_count: 128, delivery_time_min: 25, delivery_time_max: 40, delivery_fee: 30, minimum_order: 150, is_open: 1, cuisines: 'Indian, Curry', business_logo: '', is_favourite: 0 },
  { id: 302, full_name: 'Pizza Palace', address: '45 Link Road, Mumbai', latitude: 19.059, longitude: 72.868, rating: 4.2, review_count: 96, delivery_time_min: 20, delivery_time_max: 35, delivery_fee: 25, minimum_order: 200, is_open: 1, cuisines: 'Italian, Pizza', business_logo: '', is_favourite: 0 },
  { id: 303, full_name: 'Burger Barn', address: '78 Hill Road, Mumbai', latitude: 19.052, longitude: 72.840, rating: 4.0, review_count: 74, delivery_time_min: 15, delivery_time_max: 30, delivery_fee: 20, minimum_order: 100, is_open: 1, cuisines: 'American, Burgers', business_logo: '', is_favourite: 0 },
  { id: 304, full_name: 'Green Leaf Cafe', address: '9 Bandra West, Mumbai', latitude: 19.054, longitude: 72.841, rating: 4.7, review_count: 52, delivery_time_min: 30, delivery_time_max: 45, delivery_fee: 35, minimum_order: 250, is_open: 0, cuisines: 'Healthy, Salads', business_logo: '', is_favourite: 0 },
];

const FOOD_CATEGORIES = [
  { id: 1, category_name: 'Starters', sequence: 1 },
  { id: 2, category_name: 'Main Course', sequence: 2 },
  { id: 3, category_name: 'Rice & Breads', sequence: 3 },
  { id: 4, category_name: 'Desserts', sequence: 4 },
  { id: 5, category_name: 'Beverages', sequence: 5 },
];

const FOOD_PRODUCTS = [
  { id: 501, product_name: 'Paneer Tikka', description: 'Grilled cottage cheese with spices', price: 220, category_id: 1, store_id: 301, is_veg: 1, is_available: 1, image: '', variants: [{ id: 601, name: 'Regular', price: 220 }, { id: 602, name: 'Large', price: 320 }], options: [{ id: 701, name: 'Spicy', price: 0, type: 'spice_level' }] },
  { id: 502, product_name: 'Chicken Tikka', description: 'Tender chicken marinated in yogurt spices', price: 280, category_id: 1, store_id: 301, is_veg: 0, is_available: 1, image: '', variants: [{ id: 603, name: 'Regular', price: 280 }], options: [] },
  { id: 503, product_name: 'Butter Chicken', description: 'Creamy tomato curry with chicken', price: 320, category_id: 2, store_id: 301, is_veg: 0, is_available: 1, image: '', variants: [{ id: 604, name: 'Half', price: 320 }, { id: 605, name: 'Full', price: 560 }], options: [{ id: 702, name: 'Extra Butter', price: 20, type: 'addon' }] },
  { id: 504, product_name: 'Dal Makhani', description: 'Slow-cooked black lentil curry', price: 180, category_id: 2, store_id: 301, is_veg: 1, is_available: 1, image: '', variants: [], options: [] },
  { id: 505, product_name: 'Jeera Rice', description: 'Cumin-flavored basmati rice', price: 120, category_id: 3, store_id: 301, is_veg: 1, is_available: 1, image: '', variants: [], options: [] },
  { id: 506, product_name: 'Butter Naan', description: 'Soft flatbread with butter', price: 40, category_id: 3, store_id: 301, is_veg: 1, is_available: 1, image: '', variants: [], options: [] },
  { id: 507, product_name: 'Gulab Jamun', description: 'Deep-fried milk dumplings in syrup', price: 80, category_id: 4, store_id: 301, is_veg: 1, is_available: 1, image: '', variants: [{ id: 606, name: '2 pcs', price: 80 }, { id: 607, name: '4 pcs', price: 150 }], options: [] },
  { id: 508, product_name: 'Mango Lassi', description: 'Fresh mango yogurt drink', price: 90, category_id: 5, store_id: 301, is_veg: 1, is_available: 1, image: '', variants: [], options: [] },
  { id: 511, product_name: 'Margherita Pizza', description: 'Classic cheese and tomato pizza', price: 250, category_id: 1, store_id: 302, is_veg: 1, is_available: 1, image: '', variants: [{ id: 611, name: 'Small', price: 250 }, { id: 612, name: 'Medium', price: 380 }, { id: 613, name: 'Large', price: 500 }], options: [{ id: 711, name: 'Extra Cheese', price: 60, type: 'addon' }] },
  { id: 512, product_name: 'Pepperoni Pizza', description: 'Spicy pepperoni with mozzarella', price: 350, category_id: 1, store_id: 302, is_veg: 0, is_available: 1, image: '', variants: [{ id: 614, name: 'Medium', price: 350 }, { id: 615, name: 'Large', price: 480 }], options: [] },
  { id: 521, product_name: 'Classic Burger', description: 'Beef patty with lettuce and sauce', price: 180, category_id: 1, store_id: 303, is_veg: 0, is_available: 1, image: '', variants: [{ id: 621, name: 'Single', price: 180 }, { id: 622, name: 'Double', price: 280 }], options: [{ id: 721, name: 'Cheese Slice', price: 30, type: 'addon' }, { id: 722, name: 'Bacon', price: 50, type: 'addon' }] },
  { id: 522, product_name: 'Veggie Burger', description: 'Plant-based patty with mayo', price: 160, category_id: 1, store_id: 303, is_veg: 1, is_available: 1, image: '', variants: [{ id: 623, name: 'Single', price: 160 }], options: [] },
];

const FOOD_PROMO_CODES = {
  'WELCOME10': { discount_type: 'percentage', discount_value: 10, max_discount: 50, min_order: 100 },
  'FLAT50': { discount_type: 'flat', discount_value: 50, max_discount: 50, min_order: 200 },
};

const FOOD_ORDER_STATUSES = {
  1: 'Placed', 3: 'Rejected by store', 5: 'Cancelled by driver',
  6: 'Accepted', 7: 'Arrived at store', 8: 'Cancelled by store',
  9: 'Preparing', 10: 'Picked up', 11: 'Delivered', 12: 'Expired',
};

const FOOD_CANCEL_REASONS = [
  { id: 1, reason: 'Changed my mind' },
  { id: 2, reason: 'Found a better deal' },
  { id: 3, reason: 'Taking too long' },
  { id: 4, reason: 'Wrong address' },
  { id: 5, reason: 'Other' },
];

// â”€â”€ Store ordering (Phase 8) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Grocery, pharmacy and generic stores. sub_group_for_app == 2 (vs food 1).
// The PHARMACY slug triggers prescription upload (config/custom.php
// prescription_image). Products carry weight units; orders can use time slots.
const STORE_SEGMENT_ID = 3;
const STORE_GROUP = 2;

const STORE_SLUGS = {
  grocery: { title: 'Grocery', icon: 'grocery' },
  pharmacy: { title: 'Pharmacy', icon: 'pharmacy', pharmacy: true },
  store: { title: 'Store', icon: 'grocery' },
};

const STORE_STORES = [
  { id: 401, slug: 'grocery', full_name: 'FreshMart Groceries', address: '22 Linking Road, Mumbai', latitude: 19.071, longitude: 72.875, rating: 4.3, review_count: 212, delivery_time_min: 20, delivery_time_max: 45, delivery_fee: 40, minimum_order: 99, is_open: 1, cuisines: 'Fruits, Vegetables, Dairy, Staples', business_logo: '', is_favourite: 0, sub_group_for_app: 2, use_time_slots: 1, opening_time: '07:00 AM', closing_time: '11:00 PM' },
  { id: 402, slug: 'pharmacy', full_name: 'MediCare Pharmacy', address: '5 Carter Road, Mumbai', latitude: 19.056, longitude: 72.833, rating: 4.6, review_count: 158, delivery_time_min: 25, delivery_time_max: 40, delivery_fee: 25, minimum_order: 50, is_open: 1, cuisines: 'Medicines, Health, Wellness', business_logo: '', is_favourite: 0, sub_group_for_app: 2, use_time_slots: 1, opening_time: '08:00 AM', closing_time: '10:00 PM' },
  { id: 403, slug: 'store', full_name: 'Everyday General Store', address: '7 TPS Road, Mumbai', latitude: 19.065, longitude: 72.860, rating: 4.1, review_count: 84, delivery_time_min: 30, delivery_time_max: 55, delivery_fee: 35, minimum_order: 149, is_open: 1, cuisines: 'Household, Snacks, Essentials', business_logo: '', is_favourite: 0, sub_group_for_app: 2, use_time_slots: 0, opening_time: '09:00 AM', closing_time: '10:30 PM' },
];

const STORE_CATEGORIES = [
  { id: 1, category_name: 'Fruits & Vegetables', sequence: 1 },
  { id: 2, category_name: 'Dairy & Eggs', sequence: 2 },
  { id: 3, category_name: 'Bakery', sequence: 3 },
  { id: 4, category_name: 'Beverages', sequence: 4 },
  { id: 5, category_name: 'Medicines', sequence: 5 },
  { id: 6, category_name: 'Health & Wellness', sequence: 6 },
  { id: 7, category_name: 'Household', sequence: 7 },
  { id: 8, category_name: 'Snacks', sequence: 8 },
];

const STORE_PRODUCTS = [
  // grocery (401)
  { id: 801, product_name: 'Bananas (1 kg)', description: 'Fresh ripe bananas', price: 49, category_id: 1, store_id: 401, is_veg: 1, is_available: 1, image: '', weight: '1 kg', variants: [], options: [] },
  { id: 802, product_name: 'Tomatoes (500 g)', description: 'Farm fresh tomatoes', price: 25, category_id: 1, store_id: 401, is_veg: 1, is_available: 1, image: '', weight: '500 g', variants: [{ id: 811, name: '500 g', price: 25 }, { id: 812, name: '1 kg', price: 45 }], options: [] },
  { id: 803, product_name: 'Milk (1 L)', description: 'Full cream dairy milk', price: 62, category_id: 2, store_id: 401, is_veg: 1, is_available: 1, image: '', weight: '1 L', variants: [{ id: 813, name: '250 ml', price: 20 }, { id: 814, name: '500 ml', price: 34 }, { id: 815, name: '1 L', price: 62 }], options: [] },
  { id: 804, product_name: 'Brown Bread', description: 'Whole wheat bread slice', price: 40, category_id: 3, store_id: 401, is_veg: 1, is_available: 1, image: '', weight: '400 g', variants: [], options: [] },
  { id: 805, product_name: 'Orange Juice (1 L)', description: 'Refreshing chilled orange juice', price: 95, category_id: 4, store_id: 401, is_veg: 1, is_available: 1, image: '', weight: '1 L', variants: [], options: [] },
  // pharmacy (402)
  { id: 806, product_name: 'Paracetamol 500mg', description: 'Pain relief tablets, pack of 15', price: 25, category_id: 5, store_id: 402, is_veg: 1, is_available: 1, image: '', weight: '15 tablets', variants: [], options: [] },
  { id: 807, product_name: 'Vitamin C Gummies', description: 'Daily immunity support', price: 199, category_id: 6, store_id: 402, is_veg: 1, is_available: 1, image: '', weight: '60 gummies', variants: [], options: [] },
  { id: 808, product_name: 'Pain Relief Balm', description: 'Topical balm for muscle pain', price: 89, category_id: 6, store_id: 402, is_veg: 1, is_available: 1, image: '', weight: '50 g', variants: [], options: [] },
  // store (403)
  { id: 809, product_name: 'Dishwash Liquid', description: 'Lemon scented, 750 ml', price: 99, category_id: 7, store_id: 403, is_veg: 1, is_available: 1, image: '', weight: '750 ml', variants: [], options: [] },
  { id: 810, product_name: 'Potato Chips', description: 'Classic salted chips', price: 30, category_id: 8, store_id: 403, is_veg: 1, is_available: 1, image: '', weight: '150 g', variants: [], options: [] },
];

const STORE_SLOTS = {
  401: [
    { id: 1, label: 'Today, 5:00 PM', date: 'TODAY', time: '17:00' },
    { id: 2, label: 'Today, 6:00 PM', date: 'TODAY', time: '18:00' },
    { id: 3, label: 'Tomorrow, 9:00 AM', date: 'TOMORROW', time: '09:00' },
    { id: 4, label: 'Tomorrow, 11:00 AM', date: 'TOMORROW', time: '11:00' },
  ],
  402: [
    { id: 1, label: 'Today, 5:30 PM', date: 'TODAY', time: '17:30' },
    { id: 2, label: 'Today, 7:00 PM', date: 'TODAY', time: '19:00' },
    { id: 3, label: 'Tomorrow, 10:00 AM', date: 'TOMORROW', time: '10:00' },
  ],
  403: [],
};


const SOS_NUMBERS = [
  { id: '1', number: '+91 91234 56780', name: 'Emergency' },
  { id: '2', number: '+91 99887 76655', name: 'Family' },
];

const CANCEL_REASONS = [
  { id: 1, reason: 'Driver is taking too long' },
  { id: 2, reason: 'Driver declined' },
  { id: 3, reason: 'Wrong address' },
  { id: 4, reason: 'Change of plans' },
];

const NAVIGATION_DRAWER = {
  id: '1',
  name: 'Main Menu',
  merchant_id: 1,
  config: {},
  menu_options: { home: '1', my_rides: '1', wallet: '1', support: '1', settings: '1' },
};

const NAVIGATION_DRAWER_CONFIG = {
  drawer_backgroud: '#0b1b3f',
  data: [
    { drawer_name: 'DRAWER_HEADER', drawer_definition: { title: 'Fixcycle', secondary_text: 'Ride with us', background_color: '#0b1b3f', text_color: '#ffffff', secondary_text_color: '#aabbcc' } },
    { drawer_name: 'DRAWER_ITEMS_TILE', drawer_definition: { uid: 'home', icon: 'home', title: 'Home', text_color: '#ffffff', icon_color: '#ff6b35' } },
    { drawer_name: 'DRAWER_ITEMS_TILE', drawer_definition: { uid: 'my_rides', icon: 'history', title: 'My Rides', text_color: '#ffffff', icon_color: '#ff6b35' } },
    { drawer_name: 'DRAWER_ITEMS_TILE', drawer_definition: { uid: 'wallet', icon: 'account-balance-wallet', title: 'Wallet', text_color: '#ffffff', icon_color: '#ff6b35' } },
    { drawer_name: 'DRAWER_ITEMS_TILE', drawer_definition: { uid: 'support', icon: 'headset-mic', title: 'Support', text_color: '#ffffff', icon_color: '#ff6b35' } },
    { drawer_name: 'DRAWER_ITEMS_TILE', drawer_definition: { uid: 'settings', icon: 'settings', title: 'Settings', text_color: '#ffffff', icon_color: '#ff6b35' } },
  ],
  logout_button: { background_color: '#dc2626', text_color: '#ffffff', text_size: '14', button_text: 'Logout', icon_color: '#ffffff' },
};

const LD_SEGMENT_ID = 5;
const LD_DEFAULT_IMAGE = '/assets/phase-10/outlet-default.svg';

const LD_OUTLETS = [
  { id: 601, full_name: 'Fresh & Fold', address: 'Shop 4, Link Road, Andheri West, Mumbai', phone_number: '+91 98201 00001', latitude: 19.1197, longitude: 72.8468, rating: '4.6', distance: '1.2 km', image: LD_DEFAULT_IMAGE, is_outlet_open: true, price_card_id: 600 },
  { id: 602, full_name: 'Starch & Steam', address: '14 Hill Road, Bandra West, Mumbai', phone_number: '+91 98201 00002', latitude: 19.0544, longitude: 72.8406, rating: '4.4', distance: '2.3 km', image: LD_DEFAULT_IMAGE, is_outlet_open: true, price_card_id: 600 },
  { id: 603, full_name: 'Dazzle Dry Cleaners', address: '27 Peddar Road, Colaba, Mumbai', phone_number: '+91 98201 00003', latitude: 18.9076, longitude: 72.8147, rating: '4.8', distance: '4.1 km', image: LD_DEFAULT_IMAGE, is_outlet_open: true, price_card_id: 600 },
  { id: 604, full_name: 'Urban Clean', address: '9 Veera Desai Road, Andheri West, Mumbai', phone_number: '+91 98201 00004', latitude: 19.1215, longitude: 72.8412, rating: '4.2', distance: '0.8 km', image: LD_DEFAULT_IMAGE, is_outlet_open: true, price_card_id: 600 },
];

function ldPopularOutletItems() {
  return LD_OUTLETS.slice(0, 3).map((o) => ({
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
  }));
}

const MAIN_SCREEN_CELLS = [
  {
    cell_title: 'ALL_SERVICES',
    cell_name: 'services',
    cell_title_text: 'Services',
    cell_icon: '',
    cell_contents: [
      { id: '1', title: 'Taxi', name: 'Taxi', segment_id: '1', segment_group_id: 'taxi', dynamic_url: '/ride?segment=taxi&area=1', price_card_owner: 'dynamic', multi_store: 0, is_coming_soon: 0, segment_background_gradient_1: '#ff6b35', segment_background_gradient_2: '#ff9a5c', segment_home_screen_image: '' },
      { id: '2', title: 'Food', name: 'Food', segment_id: '2', segment_group_id: 'food', dynamic_url: '/food', price_card_owner: '', multi_store: 1, is_coming_soon: 0 },
      { id: '3', title: 'Groceries', name: 'Groceries', segment_id: '3', segment_group_id: 'grocery', dynamic_url: '/store/3', price_card_owner: '', multi_store: 1, is_coming_soon: 0 },
      { id: '4', title: 'Pharmacy', name: 'Pharmacy', segment_id: '4', segment_group_id: 'pharmacy', dynamic_url: '/store/4', price_card_owner: '', multi_store: 1, is_coming_soon: 0 },
      { id: '6', title: 'Handyman', name: 'Handyman', segment_id: '6', segment_group_id: 'handyman', dynamic_url: '/handyman?segment=6', price_card_owner: '', multi_store: 0, is_coming_soon: 0 },
      { id: '7', title: 'Plumber', name: 'Plumber', segment_id: '7', segment_group_id: 'plumber', dynamic_url: '/handyman?segment=7', price_card_owner: '', multi_store: 0, is_coming_soon: 0 },
      { id: '8', title: 'Salon & Spa', name: 'Salon & Spa', segment_id: '8', segment_group_id: 'salon', dynamic_url: '/handyman?segment=8', price_card_owner: '', multi_store: 0, is_coming_soon: 0 },
      { id: '9', title: 'Vehicle Towing', name: 'Vehicle Towing', segment_id: '9', segment_group_id: 'towing', dynamic_url: '/handyman?segment=9', price_card_owner: '', multi_store: 0, is_coming_soon: 0 },
      { id: '5', title: 'Laundry', name: 'Laundry', segment_id: '5', segment_group_id: 'laundry', dynamic_url: '/laundry', price_card_owner: '', multi_store: 1, is_coming_soon: 0 },
    ],
  },
  {
    cell_title: 'RECOMMENDED_SERVICE',
    cell_name: 'recommended',
    cell_title_text: 'Recommended for you',
    cell_icon: '',
    cell_contents: [
      { id: 'rec-1', title: 'Taxi', name: 'Taxi', service_name: 'Taxi', description: 'Fast and reliable rides', is_coming_soon: 0, dynamic_url: '/ride?segment=taxi&area=1', segment_id: '1' },
    ],
  },
  {
    cell_title: 'POPULAR_LAUNDRY',
    cell_name: 'laundry',
    cell_title_text: 'Popular Laundry',
    cell_icon: '',
    cell_contents: [],
    arr_content_data: ldPopularOutletItems(),
  },
  {
    cell_title: 'ADDMONEY',
    cell_name: 'wallet',
    cell_title_text: 'Wallet',
    cell_icon: '',
    cell_contents: [{ id: 'add-1', btntext: 'Add Money', btncolor: '#16a34a' }],
  },
];

// â”€â”€ In-memory state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const state = {
  // token -> user record
  tokens: new Map(),
  // id -> user record
  users: new Map(),
  // guest users by country
  guestUsers: new Map(),
  // checkoutId -> checkout ref
  checkouts: new Map(),
  // bookingId -> booking record
  bookings: new Map(),
  // userId@storeId -> cart items
  foodCarts: new Map(),
  // orderId -> order record
  foodOrders: new Map(),
  // chatKey -> [{message,sender,timestamp}]
  foodChats: new Map(),
  // store carts / orders / chats (Phase 8)
  storeCarts: new Map(),
  storeOrders: new Map(),
  storeChats: new Map(),
  storeFavourites: new Set(),
  checkoutSeq: 1000,
  bookingSeq: 5000,
  userSeq: 100,
  foodOrderSeq: 7000,
  foodCartSeq: 8000,
  storeOrderSeq: 9000,
  storeCartSeq: 9100,
};


function issueToken(user) {
  const token = randomUUID();
  state.tokens.set(token, user);
  return token;
}

function getUserFromRequest(req) {
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    return state.tokens.get(token) || null;
  }
  return null;
}

// â”€â”€ PostgreSQL (Neon) persistence â€” optional â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// When process.env.DATABASE_URL is set, phone/password accounts are persisted
// in a real Postgres `users` table (schema bootstrapped idempotently on first
// use). When it is NOT set, the server keeps today's purely in-memory
// behaviour (accept any phone/password combo for dev) â€” see the fallback logs
// and the `dbEnabled` guards below.
// NODE_ENV/PORT note: this stays a zero-surprise mock when unconfigured.

const DATABASE_URL = String(process.env.DATABASE_URL || '').trim();

// bcryptjs â€” pure JS bcrypt, no native build (only required when DB enabled).
let bcrypt = null;
try { bcrypt = require('bcryptjs'); } catch (_) { /* not installed */ }

// Neon query function â€” created lazily and only when a URL is present.
let db = null;
if (DATABASE_URL) {
  try {
    const { neon } = require('@neondatabase/serverless');
    db = neon(DATABASE_URL);
  } catch (err) {
    db = null;
    console.error('[fixcycle-backend] Neon init failed â€” falling back to in-memory accounts:', err.message);
  }
}

const dbEnabled = !!db && !!bcrypt;

if (DATABASE_URL && dbEnabled) {
  console.log('[fixcycle-backend] PostgreSQL (Neon) persistence ENABLED');
} else if (DATABASE_URL) {
  console.log('[fixcycle-backend] DATABASE_URL present but Neon/bcryptjs not available â€” falling back to in-memory accounts (no persistence)');
}
if (!DATABASE_URL) {
  console.log('[fixcycle-backend] DATABASE_URL not set â€” falling back to in-memory accounts (no persistence)');
}

// Schema bootstrapped once per process, lazily, only when the DB is enabled.
const USERS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(32) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) DEFAULT '',
    last_name VARCHAR(100) DEFAULT '',
    email VARCHAR(191) DEFAULT '',
    country_id INT DEFAULT 91,
    signup_status VARCHAR(10) DEFAULT '1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (phone)
  )
`;

let schemaReady = null;

function ensureSchema() {
  if (!dbEnabled) return Promise.resolve();
  if (!schemaReady) {
    schemaReady = db(USERS_TABLE_SQL)
      .then(() => {
        console.log('[fixcycle-backend] users table ensured on Neon');
      })
      .catch((err) => {
        schemaReady = null; // allow a later retry
        throw err;
      });
  }
  return schemaReady;
}

// Map a Postgres row into the in-memory user shape the rest of the mock reads
// (handleDetails etc. still work because login/signup populate state.users).
function userFromDbRow(row) {
  return {
    id: Number(row.id),
    firstName: row.first_name || 'New',
    lastName: row.last_name || 'User',
    email: row.email || '',
    phone: row.phone || '',
    phoneCode: '+91',
    countryCode: 'IN',
    gender: '',
    smokerType: 'no',
    networkCode: '',
    referralCode: '',
    signupStatus: row.signup_status || '1',
    walletBalance: '0',
    outstandingAmount: '0',
    country_id: Number(row.country_id) || 91,
    merchant_id: 1,
    user_type: 1,
    is_guest: false,
    passwordHash: row.password_hash || '',
  };
}

// Password for a signup row. DB rows require a non-null password_hash; when the
// register payload omits a password we use the same dev default the in-memory
// DEMO_USER uses ('12345678') so the account stays usable for the mock flow.
// Frontends that send a password always get that one hashed instead.
async function signupPasswordFor(body) {
  const pw = typeof body.password === 'string' && body.password.length > 0 ? body.password : '12345678';
  return bcrypt.hash(pw, 10);
}

// Regular signup is an UPSERT keyed on phone: re-registering the same phone
// updates the stored password + profile (matches the "normal-reg" update
// semantics the Laravel API exhibits) while returning the same envelope.
async function persistUser(body) {
  const phone = pick(body.phone, '');
  if (!dbEnabled || !phone) return null;
  await ensureSchema();
  await db(
    `INSERT INTO users (phone, password_hash, first_name, last_name, email, country_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (phone) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       first_name = EXCLUDED.first_name,
       last_name = EXCLUDED.last_name,
       email = EXCLUDED.email,
       country_id = EXCLUDED.country_id`,
    [phone, await signupPasswordFor(body), pick(body.first_name, 'New'), pick(body.last_name, 'User'), pick(body.email, ''), num(body.country_id, 91)],
  );
  const rows = await db('SELECT * FROM users WHERE phone = $1', [phone]);
  return rows[0] ? userFromDbRow(rows[0]) : null;
}

// SELECT a single user row from the DB (used by login / login-otp). Returns the
// mapped in-memory user, or null when the phone is not registered.
async function findUserByPhone(phone) {
  if (!dbEnabled || !phone) return null;
  await ensureSchema();
  const rows = await db('SELECT * FROM users WHERE phone = $1', [phone]);
  return rows[0] ? userFromDbRow(rows[0]) : null;
}

// â”€â”€ Booking lifecycle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function bookingStatusAt(booking) {
  const el = (Date.now() - booking.createdAt) / 1000;
  if (el < 12) return { status: '1001', progress: 0 };
  if (el < 20) return { status: '1002', progress: 0.2 };
  if (el < 28) return { status: '1003', progress: 0.4 };
  if (el < 44) return { status: '1004', progress: 0.6 };
  return { status: '1005', progress: 1 };
}

function buildCheckoutData(ref) {
  const isPool = ref.serviceType === POOL_SERVICE_TYPE;
  const isTransfer = ref.serviceType === TRANSFER_SERVICE_TYPE && !!ref.servicePackageId;
  const isRental = !!ref.servicePackageId && !isTransfer;
  const isOutstation = ref.tripWay === '2' || ref.outstationFare > 0 || !!ref.returnDate;
  const base = 8.0;
  const distance = (ref.dropName && ref.dropName.length > 0) ? 3.4 : 2.4;
  const riderCount = Math.max(1, ref.riderCount || 1);
  let fare;
  if (isPool) {
    const poolPerSeat = { 11: 45, 12: 60, 13: 85 }[ref.vehicleType] || 45;
    fare = round2(poolPerSeat * riderCount + base);
  } else if (isTransfer) {
    const tpkg = TRANSFER_PACKAGES.find((p) => p.id === ref.servicePackageId) || TRANSFER_PACKAGES[0];
    const tBase = { 11: 599, 12: 799, 13: 1099 }[ref.vehicleType] || 599;
    fare = tBase + (tpkg.hours - 2) * 90;
    ref.packageName = tpkg.PackageName;
    ref.packageFare = fare;
  } else if (isRental) {
    fare = Number(ref.packageFare || (499 + ((ref.servicePackageId || 1) - 1) * 60));
  } else if (ref.outstationFare > 0) {
    fare = round2(ref.outstationFare * (isOutstation && ref.tripWay === '2' ? 2 : 1));
  } else {
    fare = round2(base + distance * 12);
  }
  const promo = ref.promoApplied ? -40 : 0;
  const afterPromo = round2(fare + promo);
  const bookingType = ref.bookingType === 2 ? 2 : 1;

  return {
    id: ref.id,
    segment_id: ref.segmentId,
    service_type_id: ref.serviceType,
    vehicle_type_id: ref.vehicleType,
    total_drop_location: 1,
    number_of_rider: isPool ? riderCount : 1,
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
    estimate_distance: distance.toFixed(1),
    estimate_time: '14',
    estimate_driver_distance: '1.2',
    estimate_driver_time: '5',
    booking_type: bookingType,
    later_date: bookingType === 2 ? (ref.laterDate || '') : undefined,
    later_time: bookingType === 2 ? (ref.laterTime || '') : undefined,
    vehicleTypeName: ref.vehicleName,
    vehicleTypeImage: '',
    SelectedPaymentMethod: { id: 1, name: 'Cash', card_id: null, action: true, icon: '', message: '' },
    estimate_receipt: [
      { parameterType: 'text', amount: fmtCurrency(base), type: 'base', code: 'base_fare', description: 'Base fare' },
      { parameterType: 'text', amount: fmtCurrency(round2(distance * 12)), type: 'distance', code: 'distance_fare', description: 'Distance fare' },
      { parameterType: 'text', amount: fmtCurrency(2.0), type: 'tax', code: 'tax', description: 'Service tax' },
    ],
    promo_heading: 'Apply promo',
    estimates_header_text: 'Fare estimate',
    estimates_arrive_header_text: 'Driver is on the way',
    estimate_bill: fmtCurrency(afterPromo),
    estimate_bill_without_format: afterPromo,
    promo_code: ref.promoApplied ? 'FIX10' : undefined,
    discounted_amout: ref.promoApplied ? '40.00' : undefined,
    discount_amount_formatted: ref.promoApplied ? '-â‚¹40.00' : 'â‚¹0.00',
    outstandAmount: '0',
    outstandShow: false,
    service_type_name: isPool ? 'Pool' : (isTransfer ? 'Transfer' : (isRental ? 'Rental' : (isOutstation ? 'Outstation' : 'Taxi'))),
    service_package_id: ref.servicePackageId || undefined,
    service_package: isTransfer || isRental || ref.servicePackageId ? (ref.packageName || `Package ${ref.servicePackageId}`) : 'Standard',
    trip_way: isOutstation ? ref.tripWay : undefined,
    return_date: isOutstation && ref.returnDate ? ref.returnDate : undefined,
    return_time: isOutstation && ref.returnTime ? ref.returnTime : undefined,
    in_drive_enable: !isRental && !isOutstation && !isTransfer && !isPool,
  };
}

function buildBookingData(booking) {
  const ref = state.checkouts.get(booking.checkoutId);
  const { status, progress } = bookingStatusAt(booking);
  const hasDriver = status !== '1001';
  const driverPos = ref ? interpolate(ref.pickupLat, ref.pickupLng, ref.dropLat, ref.dropLng, Math.max(0.05, progress)) : { lat: 19.076, lng: 72.877 };

  return {
    id: booking.id,
    segment_id: booking.segmentId,
    estimate_price: fmtCurrency(booking.amount),
    booking_status: status,
    ride_otp: hasDriver ? '1234' : undefined,
    ploy_points: ref ? polylineFor(ref, progress) : '',
    pickup_latitude: ref?.pickupLat,
    pickup_longitude: ref?.pickupLng,
    drop_latitude: ref?.dropLat,
    drop_longitude: ref?.dropLng,
    pickup_location: ref?.pickupName,
    drop_location: ref?.dropName,
    total_drop_location: 1,
    otp_enable: hasDriver,
    cancelable: status === '1001' || status === '1002',
    sos_visibility: hasDriver,
    shareable: hasDriver,
    tip_status: status === '1005',
    share_able_link: 'https://fixcycle.example/share',
    tip_already_paid: false,
    polydata: ref ? { polyline_width: '5', polyline_color: '#ff6b35', polyline: polylineFor(ref, progress) } : {},
    still_marker: ref ? { marker_type: 'dest', marker_lat: ref.dropLat, marker_long: ref.dropLng } : {},
    movable_marker: hasDriver ? {
      driver_marker_name: 'Vikram S.',
      driver_marker_type: 'taxi',
      driver_marker_lat: driverPos.lat,
      driver_marker_long: driverPos.lng,
      driver_marker_bearing: 45,
    } : {},
    driver: hasDriver ? {
      id: '88', first_name: 'Vikram', last_name: 'Sharma', phoneNumber: '+91 98765 43210',
      rating: '4.8', current_latitude: driverPos.lat, current_longitude: driverPos.lng, fullName: 'Vikram Sharma',
    } : { id: '0' },
    driver_vehicle: hasDriver ? { vehicle_color: 'White', vehicle_number_plate: 'MH 01 AB 1234', vehicle_side_view_image: '' } : {},
    vehicle_type: { vehicleTypeImage: '' },
    payment_method: { payment_method: 'Cash', payment_icon: '' },
    sos: SOS_NUMBERS,
    eta_pickup_and_dest: hasDriver ? '8 min' : undefined,
    waypoints: [],
    location: {},
  };
}

function buildTrackingData(booking) {
  const { status, progress } = bookingStatusAt(booking);
  const ref = state.checkouts.get(booking.checkoutId);
  const driverPos = ref ? interpolate(ref.pickupLat, ref.pickupLng, ref.dropLat, ref.dropLng, Math.max(0.05, progress)) : { lat: 19.076, lng: 72.877 };
  const hasDriver = status !== '1001';

  return {
    booking_status: status,
    cancelable: status === '1001' || status === '1002',
    movable_marker_type: hasDriver ? {
      driver_marker_name: 'Vikram Sharma',
      driver_marker_type: 'taxi',
      driver_marker_lat: driverPos.lat,
      driver_marker_long: driverPos.lng,
      driver_marker_bearing: 45,
    } : {},
    polydata: ref ? { polyline_width: '5', polyline_color: '#ff6b35', polyline: polylineFor(ref, progress) } : {},
    location: {},
    location_updates: hasDriver ? {
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
    } : {},
    live_distance: `${((1 - progress) * 3.4).toFixed(1)} km`,
    live_time: `${Math.max(1, Math.round((1 - progress) * 20))} min`,
    speed: `${Math.round(28 + progress * 12)} km/h`,
  };
}

function buildReceiptData(booking) {
  const amount = booking.amount;
  return {
    estimate_price: fmtCurrency(amount),
    holder_ride_info: {
      value_text: fmtCurrency(amount),
      left_text: 'Trip fare',
      right_text: 'Paid in cash',
      pick_locaion: 'Pickup',
      drop_location: 'Drop',
      circular_text: 'Trip completed',
      circular_image: '',
      static_values: [
        { parameterType: 'text', parameter: 'Base fare', amount: fmtCurrency(80), type: 'row' },
        { parameterType: 'text', parameter: 'Distance (3.4 km)', amount: fmtCurrency(40.80), type: 'row' },
        { parameterType: 'text', parameter: 'Taxes & fees', amount: fmtCurrency(0.20), type: 'row' },
        { parameterType: 'divider' },
        { parameterType: 'total', parameter: 'Total', amount: fmtCurrency(amount), type: 'total' },
      ],
      multiple_drop_location: [],
    },
    holder_driver_rating: {
      driver_data: { booking_id: booking.id, text: 'How was your ride with Vikram?', image: '' },
    },
    holder_driver_favourite: {
      driver_data: { driver_id: '88', already_added: 0, text: 'Save this driver', image: '' },
    },
    holder_bottom_button: { text: 'Done', action: 'DONE', payment_method_id: 1 },
    ride_tip: { text: 'Add a tip', action: 'TIP', data: { text: 'Add a tip', action: 'TIP' } },
  };
}

// â”€â”€ Route handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function handleConfiguration() {
  return ok(CONFIGURATION);
}

function handleOtp(body) {
  const otp = String(randomInt(111111, 999999));
  return ok({
    auto_fill: true,
    otp,
    default_otp_enable: 1,
    default_otp: '082025',
    is_number_registered: true,
  });
}

async function handleLogin(body) {
  const { phone, password } = body;
  let user = null;

  if (dbEnabled) {
    // Real persistence mode: the account must exist in Postgres and the
    // password must match its bcrypt hash. Failure keeps the file's existing
    // `fail(...)` envelope style (HTTP stays 200, result:'0' signals failure).
    user = await findUserByPhone(pick(phone, ''));
    if (!user) return fail('Invalid credentials');
    const match = await bcrypt.compare(password || '', user.passwordHash || '');
    if (!match) return fail('Invalid credentials');
  } else {
    // Dev fallback: accept any phone/password combo for dev.
    user = { ...DEMO_USER, phone: phone || DEMO_USER.phone };
    const id = ++state.userSeq;
    user.id = id;
  }

  state.users.set(user.id, user);
  const token = issueToken(user);
  return ok({
    access_token: token,
    user_card: false,
    user_signup_card_store: true,
    push_notification: {},
    is_guest: false,
  });
}

async function handleLoginOtp(body) {
  const { phone } = body;
  let user = null;

  if (dbEnabled) {
    // OTP login still accepts the dev default OTP ('082025' via /user/otp),
    // but the account must exist in Postgres to be issued a token.
    user = await findUserByPhone(pick(phone, ''));
    if (!user) return fail('Invalid credentials');
  } else {
    // Dev fallback: any phone accepted.
    user = { ...DEMO_USER, phone: phone || DEMO_USER.phone };
    const id = ++state.userSeq;
    user.id = id;
  }

  state.users.set(user.id, user);
  const token = issueToken(user);
  return ok({
    access_token: token,
    push_notification: {},
    is_guest: false,
  });
}

function handleGuestLogin(body) {
  const countryId = body.country_id || CONFIGURATION.general_config.guest_user_country_id || 91;
  let guest = state.guestUsers.get(countryId);
  if (!guest) {
    const id = ++state.userSeq;
    guest = {
      id,
      firstName: 'Guest',
      lastName: 'User',
      email: `guest${id}@fixcycle.com`,
      phone: `98765${String(id).padStart(5, '0')}`,
      phoneCode: '+91',
      countryCode: 'IN',
      gender: '',
      smokerType: 'no',
      networkCode: '',
      referralCode: '',
      signupStatus: '1',
      walletBalance: '0',
      outstandingAmount: '0',
      country_id: countryId,
      merchant_id: 1,
      user_type: 2,
      is_guest: true,
    };
    state.users.set(id, guest);
    state.guestUsers.set(countryId, guest);
  }
  const token = issueToken(guest);
  return ok({
    access_token: token,
    user_card: false,
    user_signup_card_store: true,
    push_notification: {},
    is_guest: true,
  });
}

function handleDetails(body, user) {
  if (!user) return fail('Unauthorized');
  return ok({
    id: user.id,
    firstName: user.firstName || 'Guest',
    lastName: user.lastName || 'User',
    UserProfileImage: '',
    profile_image: '',
    email: user.email || null,
    UserEmail: user.email || null,
    UserPhone: user.phone || '',
    phone_code: user.phoneCode || '+91',
    country_code: user.countryCode || 'IN',
    user_gender: user.gender || '',
    smoker_type: user.smokerType || 'no',
    network_code: user.networkCode || '',
    ReferralCode: user.referralCode || '',
    signup_status: user.signupStatus || '1',
    wallet_balance: user.walletBalance || '0',
    outstanding_amount: user.outstandingAmount || '0',
  });
}

function handleLogout(body, user) {
  if (user) {
    // Remove token from state
    for (const [token, u] of state.tokens) {
      if (u === user) { state.tokens.delete(token); break; }
    }
  }
  return ok({});
}

async function handleSignup(body) {
  let user = await persistUser(body);

  if (!user) {
    // In-memory fallback (no DATABASE_URL, or signup payload has no phone).
    const id = ++state.userSeq;
    user = {
      id,
      firstName: body.first_name || 'New',
      lastName: body.last_name || 'User',
      email: body.email || '',
      phone: body.phone || '',
      phoneCode: '+91',
      countryCode: 'IN',
      gender: body.user_gender || '',
      smokerType: body.smoker_type || 'no',
      networkCode: body.network_code || '',
      referralCode: body.referral_code || '',
      signupStatus: '1',
      walletBalance: '0',
      outstandingAmount: '0',
      country_id: body.country_id || 91,
      merchant_id: 1,
      user_type: 1,
      is_guest: false,
    };
  }

  state.users.set(user.id, user);
  const token = issueToken(user);
  return ok({
    access_token: token,
    user_card: false,
    user_signup_card_store: true,
    push_notification: {},
    is_guest: false,
  });
}

function handleCountryList() {
  return ok({ countries: [{ ...COUNTRY, isoCode: COUNTRY.iso }] });
}

function handleCmsPage(body) {
  const slug = body.slug || 'terms';
  return ok({ slug, title: slug, description: 'CMS page content placeholder', name: slug });
}

function handleMainScreen(body) {
  return ok(MAIN_SCREEN_CELLS);
}

function handleAreas() {
  return ok(AREAS);
}

function handleSearchPlaces(body) {
  const keyword = String(body.keyword || '');
  return ok([{
    keyword,
    google_response: [
      { place_id: 'ch-1', structured_formatting: { main_text: `${keyword || 'Andheri'} West`, secondary_text: 'Mumbai, Maharashtra' }, geometry: { location: { lat: 19.1197, lng: 72.8468 } } },
      { place_id: 'ch-2', structured_formatting: { main_text: `${keyword || 'Bandra'} West`, secondary_text: 'Mumbai, Maharashtra' }, geometry: { location: { lat: 19.0544, lng: 72.8406 } } },
      { place_id: 'ch-3', structured_formatting: { main_text: `${keyword || 'Colaba'} Causeway`, secondary_text: 'Mumbai, Maharashtra' }, geometry: { location: { lat: 18.9076, lng: 72.8147 } } },
    ],
  }]);
}

function handlePromotions() { return ok([]); }

function handleCars(body) {
  return ok({
    config_data: { currency: CURRENCY, is_geofence: 0 },
    response_data: {
      id: body.segment_id || 1,
      country_id: 91,
      merchant_id: 1,
      service_types: SERVICE_TYPES,
    },
  });
}

function handleDrivers(body) {
  const lat = num(body.latitude, 19.076);
  const lng = num(body.longitude, 72.877);
  return ok({
    term_status: 1,
    response_data: [
      { id: '501', driver_id: '88', current_latitude: lat + 0.004, current_longitude: lng + 0.004, vehicleTypeMapImage: '', last_location_update_time: 'now' },
      { id: '502', driver_id: '99', current_latitude: lat - 0.006, current_longitude: lng + 0.008, vehicleTypeMapImage: '', last_location_update_time: 'now' },
      { id: '503', driver_id: '77', current_latitude: lat + 0.01, current_longitude: lng - 0.007, vehicleTypeMapImage: '', last_location_update_time: 'now' },
    ],
    vehicle: {},
    user_cars_update_time: 10,
  });
}

// ---------------------------------------------------------------------------
// Rental cars â€” POST /user/rental-cars  (Api\HomeController@rentalCars)
// ---------------------------------------------------------------------------
function handleRentalCars(body) {
  const areaId = num(body.area_id, 1);
  const baseRate = {
    11: 499, // Mini
    12: 649, // Sedan
    13: 899, // SUV
  };
  const vehicles = VEHICLES.filter((v) => body.vehicle_type ? v.id === num(body.vehicle_type) : true).map((v) => {
    const arr_package = SERVICE_PACKAGES.map((p) => {
      const estimate_fare = (baseRate[v.id] || 499) + (p.hours - 4) * 60;
      return {
        id: p.id,
        package_name: p.PackageName,
        estimate_fare: estimate_fare,
        estimate_fare_text: fmtCurrency(estimate_fare),
      };
    });
    return {
      vehicle_type_id: v.id,
      vehicle_type_name: v.vehicleTypeName,
      vehicle_type_image: '',
      ride_now: 1,
      ride_later: 1,
      arr_package,
    };
  });
  return ok(vehicles);
}

// ---------------------------------------------------------------------------
// Outstation details â€” POST /user/outstation-details  (OutstationController@outstationDetail)
// Returns { single: [package vehicles], round: [per-km vehicles], return_time }
// ---------------------------------------------------------------------------
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function handleOutstationDetails(body) {
  const lat1 = num(body.pickup_lat, 19.076);
  const lng1 = num(body.pickup_long, 72.8777);
  const lat2 = num(body.drop_lat, 18.96);
  const lng2 = num(body.drop_long, 72.826);
  const distance = body.estimate_distance ? num(body.estimate_distance, 0) : Math.max(5, haversineKm(lat1, lng1, lat2, lng2));
  const timeSmall = Math.max(20, Math.round(distance * 1.4));
  const perKmRate = { 11: 12, 12: 14, 13: 17 };
  const packageBase = { 11: 1599, 12: 1999, 13: 2899 };

  const single = VEHICLES.map((v) => {
    const pkg = SERVICE_PACKAGES[0]; // one-way package
    const amount = (packageBase[v.id] || 1599) + (Number(pkg.hours) - 4) * 90;
    return {
      id: `${v.id}-${pkg.id}`,
      vehicle_type_id: v.id,
      service_package_id: pkg.id,
      vechile_name: v.vehicleTypeName,
      vechile_description: v.vehicleTypeDescription,
      vechile_image: '',
      base_fare: fmtCurrency(amount),
      base_fare_amount: amount,
      package_name: pkg.PackageName,
    };
  });

  const round = VEHICLES.map((v) => {
    const amount = round2((perKmRate[v.id] || 14) * distance + 80);
    return {
      id: `od-${v.id}`,
      vehicle_type_id: v.id,
      vechile_name: v.vehicleTypeName,
      vechile_description: v.vehicleTypeDescription,
      vechile_image: '',
      base_fare: fmtCurrency(amount),
      base_fare_amount: amount,
      estimate_distance: distance,
    };
  });

  return ok({ single, round, return_time: String(timeSmall) });
}

// ---------------------------------------------------------------------------
// Transfer details â€” POST /user/transfer-details  (TransferController@transferDetail)
// Airport / hourly transfer: returns per-vehicle hourly packages.
// ---------------------------------------------------------------------------
function handleTransferDetails(body) {
  const baseRate = {
    11: 599, // Mini
    12: 799, // Sedan
    13: 1099, // SUV
  };
  const vehicles = VEHICLES.filter((v) => body.vehicle_type ? v.id === num(body.vehicle_type) : true).map((v) => {
    const arr_package = TRANSFER_PACKAGES.map((p) => {
      const estimate_fare = (baseRate[v.id] || 599) + (p.hours - 2) * 90;
      return {
        id: p.id,
        package_name: p.PackageName,
        estimate_fare: estimate_fare,
        estimate_fare_text: fmtCurrency(estimate_fare),
      };
    });
    return {
      vehicle_type_id: v.id,
      vehicle_type_name: v.vehicleTypeName,
      vehicle_type_image: '',
      ride_now: 1,
      ride_later: 1,
      arr_package,
    };
  });
  return ok(vehicles);
}

// ---------------------------------------------------------------------------
// Pool details â€” POST /user/pool-details  (PoolController-like behaviour)
// Returns pool-enabled vehicles with seat capacity and per-seat fare estimate.
// ---------------------------------------------------------------------------
function handlePoolDetails(body) {
  const seatCapacity = { 11: 3, 12: 4, 13: 6 };
  const perSeatFare = { 11: 45, 12: 60, 13: 85 };
  const vehicles = VEHICLES.filter((v) => body.vehicle_type ? v.id === num(body.vehicle_type) : true).map((v) => {
    const seats = seatCapacity[v.id] || 3;
    const fare = perSeatFare[v.id] || 45;
    return {
      vehicle_type_id: v.id,
      vehicle_type_name: v.vehicleTypeName,
      vehicle_type_image: '',
      vehicle_seat: seats,
      passenger_seat_capacity: seats,
      ride_fare: fare,
      ride_fare_text: `${fmtCurrency(fare)}/seat`,
      ride_now: 1,
      ride_later: 1,
    };
  });
  return ok(vehicles);
}

// ---------------------------------------------------------------------------
// CheckSeats â€” POST /user/CheckSeats  (UserController@CheckSeats)
// Validates seat availability for pool rides against checkout and rider count.
// ---------------------------------------------------------------------------
function handleCheckSeats(body) {
  const checkoutId = pick(body.checkout_id, '');
  const noOfPerson = Math.max(1, num(body.no_of_person, 1));
  const noOfChildren = Math.max(0, num(body.no_of_children, 0));
  const totalSeats = noOfPerson + noOfChildren;
  const ref = state.checkouts.get(checkoutId);

  if (!ref) {
    return ok({ seats_available: 0, total_seats: 0 });
  }

  const maxSeats = { 11: 3, 12: 4, 13: 6 }[ref.vehicleType] || 3;
  const seatsAvailable = Math.max(0, maxSeats - totalSeats);

  return ok({ seats_available: seatsAvailable, total_seats: maxSeats });
}

function handleCheckout(body) {
  const ref = {
    id: `ck-${(state.checkoutSeq += 1)}`,
    pickupLat: num(body.pickup_latitude, 19.076),
    pickupLng: num(body.pickup_longitude, 72.877),
    dropLat: num(body.drop_latitude, 19.05),
    dropLng: num(body.drop_longitude, 72.84),
    pickupName: pick(body.pick_up_location, 'Pickup'),
    dropName: pick(body.drop_location, 'Drop'),
    segmentId: body.segment_id || 1,
    serviceType: body.service_type || 1001,
    vehicleType: body.vehicle_type || 11,
    vehicleName: 'Mini',
    bookingType: num(body.booking_type, 1),
    laterDate: pick(body.later_date, ''),
    laterTime: pick(body.later_time, ''),
    servicePackageId: num(body.service_package_id, 0),
    tripWay: String(body.trip_way || '1'),
    returnDate: pick(body.return_date, ''),
    returnTime: pick(body.return_time, ''),
    outstationFare: num(body.estimate_fare, 0),
    riderCount: Math.max(1, num(body.number_of_rider, 1)),
    promoApplied: false,
  };
  const pkgId = ref.servicePackageId || 0;
  if (pkgId) {
    if (ref.serviceType === TRANSFER_SERVICE_TYPE) {
      const tBase = { 11: 599, 12: 799, 13: 1099 }[ref.vehicleType] || 599;
      const tpkg = TRANSFER_PACKAGES.find((p) => p.id === pkgId) || TRANSFER_PACKAGES[0];
      ref.packageFare = tBase + (tpkg.hours - 2) * 90;
      ref.packageName = tpkg.PackageName;
    } else {
      const baseRate = { 11: 499, 12: 649, 13: 899 };
      const pkg = SERVICE_PACKAGES.find((p) => p.id === pkgId);
      const pkgFare = (baseRate[ref.vehicleType] || 499) + ((pkg ? pkg.hours : 4) - 4) * 60;
      ref.packageFare = pkgFare;
      ref.packageName = pkg ? pkg.PackageName : `Package ${pkgId}`;
    }
  }
  state.checkouts.set(ref.id, ref);
  const data = buildCheckoutData(ref);
  data.id = ref.id;
  return ok(data);
}

function handleApplyPromo(body) {
  const id = pick(body.checkout_id || body.id, '');
  const ref = state.checkouts.get(id);
  if (!ref) return ok({});
  ref.promoApplied = true;
  const data = buildCheckoutData(ref);
  data.id = id;
  return ok(data);
}

function handleRemovePromo(body) {
  const id = pick(body.checkout_id || body.id, '');
  const ref = state.checkouts.get(id);
  if (!ref) return ok({});
  ref.promoApplied = false;
  const data = buildCheckoutData(ref);
  data.id = id;
  return ok(data);
}

function handlePaymentOption() {
  return ok([
    { id: 1, name: 'Cash', card_id: null, action: true, icon: '', message: '' },
    { id: 2, name: 'Wallet', card_id: null, action: true, icon: '', message: '' },
  ]);
}

function handleCheckoutPayment(body) {
  const id = pick(body.checkout || body.checkout_id, '');
  const ref = state.checkouts.get(id);
  if (!ref) return ok({});
  const data = buildCheckoutData(ref);
  data.id = id;
  return ok(data);
}

function handleCheckoutAdditionalInfo() {
  return ok({ ok: true, message: 'Saved' });
}

function handleConfirm(body) {
  const checkoutId = pick(body.checkout, '');
  const ref = state.checkouts.get(checkoutId);
  const id = `bk-${(state.bookingSeq += 1)}`;
  const amount = ref ? (buildCheckoutData(ref).estimate_bill_without_format || 118) : 118;
  const bookingType = ref?.bookingType === 2 ? 2 : 1;
  const servicePackageId = ref?.servicePackageId || 0;
  const tripWay = ref?.tripWay || '1';
  const returnDate = ref?.returnDate || '';
  const returnTime = ref?.returnTime || '';
  state.bookings.set(id, {
    id, checkoutId, createdAt: Date.now(),
    segmentId: ref?.segmentId || body.segment_id || 1, amount,
    bookingType,
    laterDate: ref?.laterDate || '',
    laterTime: ref?.laterTime || '',
    scheduled: bookingType === 2,
    servicePackageId,
    tripWay,
    returnDate,
    returnTime,
  });
  return ok({ id, booking_type: bookingType, merchant_booking_id: 987654, service_package_id: servicePackageId || undefined, trip_way: tripWay, return_date: returnDate || undefined, return_time: returnTime || undefined });
}

function handlePendingBookingApprovals(body, user) {
  // Ride-later bookings awaiting confirmation (corporate approval if enabled).
  const pending = [];

  for (const [id, booking] of state.bookings) {
    if (booking && booking.scheduled) {
      const ref = state.checkouts.get(booking.checkoutId);
      pending.push({
        id,
        booking_id: id,
        merchant_booking_id: 987654,
        booking_type: 2,
        estimate_price: fmtCurrency(booking.amount),
        pickup_location: ref?.pickupName || 'Pickup',
        drop_location: ref?.dropName || 'Drop',
        pickup_latitude: ref?.pickupLat,
        pickup_longitude: ref?.pickupLng,
        drop_latitude: ref?.dropLat,
        drop_longitude: ref?.dropLng,
        later_date: booking.laterDate || '',
        later_time: booking.laterTime || '',
        booking_status: '1001',
        approve_status: 0,
        vehicleTypeName: ref?.vehicleName || 'Mini',
        service_type_name: 'Taxi',
      });
    }
  }

  return ok({ response_data: pending, code: '4400' });
}

function handleCheckBookingStatus(body) {
  const booking = state.bookings.get(pick(body.booking_id, ''));
  return ok({ booking_status: booking ? bookingStatusAt(booking).status : '1001' });
}

function handleBookingDetails(body) {
  const booking = state.bookings.get(pick(body.booking_id, ''));
  return ok(booking ? buildBookingData(booking) : {});
}

function handleBookingTracking(body) {
  const booking = state.bookings.get(pick(body.booking_id, ''));
  if (!booking) return ok({ booking_status: '1001', cancelable: true, polydata: {}, movable_marker_type: {}, location_updates: {} });
  return ok(buildTrackingData(booking));
}

function handleReceipt(body) {
  const booking = state.bookings.get(pick(body.booking_id, 'bk-5001'));
  const amount = booking?.amount || 118;
  const ref = booking ? state.checkouts.get(booking.checkoutId) : null;
  return ok({
    estimate_price: fmtCurrency(amount),
    holder_ride_info: {
      value_text: fmtCurrency(amount),
      left_text: 'Trip fare',
      right_text: 'Paid in cash',
      pick_locaion: ref?.pickupName || 'Pickup',
      drop_location: ref?.dropName || 'Drop',
      circular_text: 'Trip completed',
      circular_image: '',
      static_values: [
        { parameterType: 'text', parameter: 'Base fare', amount: fmtCurrency(80), type: 'row' },
        { parameterType: 'text', parameter: 'Distance (3.4 km)', amount: fmtCurrency(40.80), type: 'row' },
        { parameterType: 'text', parameter: 'Taxes & fees', amount: fmtCurrency(0.20), type: 'row' },
        { parameterType: 'divider' },
        { parameterType: 'total', parameter: 'Total', amount: fmtCurrency(amount), type: 'total' },
      ],
      multiple_drop_location: [],
    },
    holder_driver_rating: { driver_data: { booking_id: booking?.id || 'bk-5001', text: 'How was your ride with Vikram?', image: '' } },
    holder_driver_favourite: { driver_data: { driver_id: '88', already_added: 0, text: 'Save this driver', image: '' } },
    holder_bottom_button: { text: 'Done', action: 'DONE', payment_method_id: 1 },
    ride_tip: { text: 'Add a tip', action: 'TIP', data: { text: 'Add a tip', action: 'TIP' } },
  });
}

function handleAddTip() { return ok({ ok: true }); }

function handleCancelReasons() {
  return ok({ response_data: CANCEL_REASONS, code: '4400', cancel_charges: '0' });
}

function handleCancel(body) {
  const id = pick(body.booking_id, '');
  if (id) state.bookings.delete(id);
  return ok({ booking_id: id, booking_status: '1016' });
}

function handleAutoCancel(body) {
  const id = pick(body.booking_id, '');
  if (id) state.bookings.delete(id);
  return ok({ booking_id: id, booking_status: '0' });
}

function handleChangeAddress() { return ok({ ok: true }); }

function handleIncreaseRideRequestArea() { return ok({ ok: true }); }

function handleRateToDriver(body) { return ok({ ok: true, message: 'Thanks for your feedback' }); }

function handleSos() { return ok(SOS_NUMBERS); }

function handleSosRequest(body) {
  return ok({
    id: `sos-${Date.now()}`,
    number: pick(body.number, ''),
    latitude: num(body.latitude, 0),
    longitude: num(body.longitude, 0),
    location_name: pick(body.location_name, ''),
  });
}

function handleGetNavigationDrawer() { return ok(NAVIGATION_DRAWER); }
function handleGetNavigationDrawerConfig() { return ok(NAVIGATION_DRAWER_CONFIG); }
function handleSaveNavigationDrawer() { return ok({ ok: true }); }

// â”€â”€ Delivery handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function handleDeliveryPackage() {
  return ok(DELIVERY_PACKAGES.map((p) => ({
    id: p.id,
    package_name: p.package_name,
    dead_weight: p.weight,
    package_length: p.package_length,
    package_width: p.package_width,
    package_height: p.package_height,
    volumetric_capacity: p.package_length * p.package_width * p.package_height / 5000,
    package_image: '',
    engine_type: p.engine_type,
  })));
}

function handleDeliveryProductList(body) {
  let products = DELIVERY_PRODUCTS;
  if (body.category_id) {
    products = products.filter((p) => p.category_id === Number(body.category_id));
  }
  return ok(products.map((p) => ({
    id: p.id,
    product_name: p.product_name,
    description: p.description,
    weight: p.weight,
    price: p.price,
    category_id: p.category_id,
  })));
}

function handleDeliveryCategoryType() {
  return ok(DELIVERY_PRODUCT_TYPES.map((c) => ({
    id: c.id,
    category_name: c.category_name,
  })));
}

function handleDeliveryVehiclePackage(body) {
  const packageId = num(body.delivery_package_id, 0);
  const pkg = DELIVERY_PACKAGES.find((p) => p.id === packageId) || DELIVERY_PACKAGES[0];
  const vehicles = DELIVERY_VEHICLES.filter((v) => {
    if (pkg.engine_type === 'bike') return v.id === 14;
    if (pkg.engine_type === 'van') return v.id === 16;
    return v.id === 15;
  });
  if (vehicles.length === 0) vehicles.push(DELIVERY_VEHICLES[0]);
  return ok(vehicles.map((v) => ({
    vehicle_type_id: v.id,
    vehicle_type_name: v.name,
    vehicle_type_image: v.image,
    capacity_kg: v.capacity_kg,
    ride_fare: v.base_fare,
    ride_fare_text: v.ride_fare_text,
  })));
}

function handleDeliveryCheckout(body) {
  const id = `dck-${(state.checkoutSeq += 1)}`;
  const drops = typeof body.drop_location === 'string' ? (() => { try { return JSON.parse(body.drop_location); } catch { return []; } })() : (body.drop_location || []);

  const ref = {
    id,
    segmentId: 2,
    serviceType: DELIVERY_SERVICE_TYPE,
    vehicleType: num(body.vehicle_type, 14),
    vehicleName: 'Bike Delivery',
    pickupLat: num(body.pickup_latitude, 19.076),
    pickupLng: num(body.pickup_longitude, 72.877),
    pickupName: pick(body.pick_up_location, 'Pickup'),
    drops: drops.map((d) => ({
      lat: num(d.drop_latitude, 19.05),
      lng: num(d.drop_longitude, 72.84),
      name: pick(d.drop_location, 'Drop'),
      contact_name: pick(d.contact_name, ''),
      contact_phone: pick(d.contact_phone, ''),
      instruction: pick(d.instruction, ''),
    })),
    totalDropLocation: drops.length || 1,
    productId: num(body.product_id, 307),
    categoryId: num(body.category_id, 7),
    packageId: num(body.delivery_package_id, 202),
    weight: num(body.weight, 1),
    bookingType: num(body.booking_type, 1),
    promoApplied: false,
  };

  const pkg = DELIVERY_PACKAGES.find((p) => p.id === ref.packageId) || DELIVERY_PACKAGES[2];
  const veh = DELIVERY_VEHICLES.find((v) => v.id === ref.vehicleType) || DELIVERY_VEHICLES[0];
  ref.baseFare = veh.base_fare;
  ref.packageFare = pkg.price;
  ref.estimatedFare = veh.base_fare + pkg.price + drops.length * 15;

  state.checkouts.set(id, ref);

  return ok({
    id,
    segment_id: ref.segmentId,
    service_type: ref.serviceType,
    service_type_name: 'Delivery',
    vehicle_type_id: ref.vehicleType,
    vehicle_type_name: veh.name,
    vehicle_type_image: veh.image,
    pickup_location: ref.pickupName,
    pickup_latitude: ref.pickupLat,
    pickup_longitude: ref.pickupLng,
    drop_location: ref.drops,
    total_drop_location: ref.totalDropLocation,
    product_id: ref.productId,
    category_id: ref.categoryId,
    delivery_package_id: ref.packageId,
    package_name: pkg.package_name,
    weight: ref.weight,
    estimate_fare: ref.estimatedFare,
    estimate_fare_text: `${ref.estimatedFare}`,
    base_fare: ref.baseFare,
    package_fare: ref.packageFare,
    booking_type: ref.bookingType,
    payment_methods: [{ id: '1', name: 'Cash', card_id: null }],
  });
}

function handleDeliveryCheckoutDetails(body) {
  const id = pick(body.checkout_id || body.id, '');
  const ref = state.checkouts.get(id);
  if (!ref) return ok({ message: 'Checkout not found' });
  return ok({
    id: ref.id,
    estimate_fare: ref.estimatedFare,
    estimate_fare_text: `${ref.estimatedFare}`,
    pickup_location: ref.pickupName,
    drop_location: ref.drops,
    vehicle_type_name: ref.vehicleName,
    package_name: DELIVERY_PACKAGES.find((p) => p.id === ref.packageId)?.package_name || '',
    weight: ref.weight,
    booking_type: ref.bookingType,
    payment_methods: [{ id: '1', name: 'Cash', card_id: null }],
  });
}

function handleDeliveryStoreDropDetails(body) {
  const id = pick(body.checkout_id || body.id, '');
  const ref = state.checkouts.get(id);
  if (!ref) return ok({ message: 'Checkout not found' });
  const index = num(body.drop_index, 0);
  const drop = ref.drops[index] || ref.drops[0] || { lat: 19.05, lng: 72.84, name: 'Drop' };
  return ok({
    checkout_id: ref.id,
    drop_index: index,
    drop_latitude: drop.lat,
    drop_longitude: drop.lng,
    drop_location: drop.name,
    contact_name: drop.contact_name,
    contact_phone: drop.contact_phone,
    instruction: drop.instruction,
  });
}

function handleConfirmDelivery(body) {
  const id = pick(body.checkout_id || body.id || body.booking_id, '');
  const ref = state.checkouts.get(id);
  if (!ref) {
    const bookingId = `bk-${(state.bookingSeq += 1)}`;
    state.bookings.set(bookingId, { id: bookingId, status: 1001, serviceType: DELIVERY_SERVICE_TYPE });
    return ok({ id: bookingId, booking_id: bookingId, booking_status: 1001, service_type_name: 'Delivery' });
  }
  const bookingId = `bk-${(state.bookingSeq += 1)}`;
  const booking = { id: bookingId, status: 1001, ...ref };
  state.bookings.set(bookingId, booking);
  state.checkouts.delete(ref.id);
  return ok({
    id: bookingId,
    booking_id: bookingId,
    booking_status: 1001,
    service_type_name: 'Delivery',
    message: 'Delivery booking confirmed',
  });
}

// â”€â”€ Food handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function cartKey(user) {
  const uid = user && user.id ? user.id : 'guest';
  return `${uid}`;
}

function getFoodCart(user) {
  const key = cartKey(user);
  if (!state.foodCarts.has(key)) state.foodCarts.set(key, []);
  return { key, items: state.foodCarts.get(key) };
}

function foodStoreById(id) {
  return FOOD_STORES.find((s) => s.id === Number(id)) || null;
}

function foodProductById(id) {
  return FOOD_PRODUCTS.find((p) => p.id === Number(id)) || null;
}

function handleStoreList(body) {
  const segmentId = num(body.segment_id, FOOD_SEGMENT_ID);
  let stores = FOOD_STORES;
  if (body.is_open !== undefined) stores = stores.filter((s) => s.is_open === bool(body.is_open) ? 1 : 0);
  return ok({
    business_segments: stores.map((s) => ({
      id: s.id,
      full_name: s.full_name,
      address: s.address,
      latitude: s.latitude,
      longitude: s.longitude,
      rating: s.rating,
      review_count: s.review_count,
      delivery_time_min: s.delivery_time_min,
      delivery_time_max: s.delivery_time_max,
      delivery_fee: s.delivery_fee,
      minimum_order: s.minimum_order,
      is_open: s.is_open,
      cuisines: s.cuisines,
      business_logo: s.business_logo,
      is_favourite: s.is_favourite,
      worked_on: false,
    })),
  });
}

function handleStoreDetails(body) {
  const store = foodStoreById(body.business_segment_id || body.id);
  if (!store) return ok({ business_segment: null, products: [] });
  const products = FOOD_PRODUCTS.filter((p) => p.store_id === store.id);
  const categories = FOOD_CATEGORIES.filter((c) => products.some((p) => p.category_id === c.id));
  return ok({
    business_segment: {
      id: store.id,
      full_name: store.full_name,
      address: store.address,
      latitude: store.latitude,
      longitude: store.longitude,
      rating: store.rating,
      review_count: store.review_count,
      delivery_time_min: store.delivery_time_min,
      delivery_time_max: store.delivery_time_max,
      delivery_fee: store.delivery_fee,
      minimum_order: store.minimum_order,
      is_open: store.is_open,
      cuisines: store.cuisines,
      business_logo: store.business_logo,
      is_favourite: store.is_favourite,
      opening_time: '10:00 AM',
      closing_time: '11:00 PM',
      worked_on: false,
    },
    categories: categories.map((c) => ({ id: c.id, category_name: c.category_name, sequence: c.sequence })),
    products: products.map((p) => foodProductPayload(p)),
  });
}

function foodProductPayload(p) {
  return {
    id: p.id,
    product_name: p.product_name,
    description: p.description,
    price: p.price,
    category_id: p.category_id,
    store_id: p.store_id,
    is_veg: p.is_veg,
    is_available: p.is_available,
    image: p.image,
    variants: p.variants.map((v) => ({ id: v.id, name: v.name, price: v.price })),
    options: p.options.map((o) => ({ id: o.id, name: o.name, price: o.price, type: o.type })),
  };
}

function foodProductDetails(body) {
  const p = foodProductById(body.product_id || body.id);
  if (!p) return ok(null);
  return ok(foodProductPayload(p));
}

function handleGetCart(user) {
  const { items } = getFoodCart(user);
  return ok({ products: items.map(cartItemPayload), total_items: items.length });
}

function cartItemPayload(item) {
  const p = foodProductById(item.product_id) || { product_name: 'Item', price: item.price || 0 };
  return {
    cart_id: item.cart_id,
    product_id: item.product_id,
    product_name: p.product_name,
    price: item.price,
    quantity: item.quantity,
    variant_id: item.variant_id || null,
    variant_name: item.variant_name || '',
    option_ids: item.option_ids || [],
    total_amount: Math.round(item.price * item.quantity * 100) / 100,
    is_veg: p.is_veg,
    image: p.image,
    store_id: p.store_id,
  };
}

function handleAddToCart(body, user) {
  const { items } = getFoodCart(user);
  const p = foodProductById(body.product_id);
  if (!p) return ok(items.map(cartItemPayload));
  let variant = p.variants[0] || { id: 0, name: '', price: p.price };
  if (body.variant_id) variant = p.variants.find((v) => v.id === Number(body.variant_id)) || variant;
  const options = (Array.isArray(body.option_ids) ? body.option_ids : []).map((oid) => {
    const o = p.options.find((x) => x.id === Number(oid));
    return o ? { id: o.id, name: o.name, price: o.price } : null;
  }).filter(Boolean);
  const unitPrice = variant.price + options.reduce((sum, o) => sum + o.price, 0);
  const existing = items.find((i) => i.product_id === p.id && i.variant_id === variant.id);
  if (existing) {
    existing.quantity += num(body.quantity, 1);
  } else {
    items.push({
      cart_id: `fc-${(state.foodCartSeq += 1)}`,
      product_id: p.id,
      quantity: num(body.quantity, 1),
      price: unitPrice,
      variant_id: variant.id || null,
      variant_name: variant.name,
      option_ids: options.map((o) => o.id),
    });
  }
  return ok({ products: items.map(cartItemPayload), total_items: items.length });
}

function handleUpdateCart(body, user) {
  const { items } = getFoodCart(user);
  const idx = items.findIndex((i) => String(i.cart_id) === String(body.cart_id));
  if (idx === -1) return ok({ products: items.map(cartItemPayload), total_items: items.length });
  if (num(body.quantity, 0) <= 0) {
    items.splice(idx, 1);
  } else {
    items[idx].quantity = num(body.quantity, items[idx].quantity);
  }
  return ok({ products: items.map(cartItemPayload), total_items: items.length });
}

function handleRemoveCart(body, user) {
  const { items } = getFoodCart(user);
  const idx = items.findIndex((i) => String(i.cart_id) === String(body.cart_id));
  if (idx !== -1) items.splice(idx, 1);
  return ok({ products: items.map(cartItemPayload), total_items: items.length });
}

function handleClearCart(user) {
  const { items } = getFoodCart(user);
  items.length = 0;
  return ok({ products: [], total_items: 0 });
}

function handleApplyFoodPromo(body) {
  const code = pick(body.promo_code || body.promoCode, '');
  const promo = FOOD_PROMO_CODES[String(code).toUpperCase()];
  if (!promo) return fail('Invalid or expired promo code');
  return ok({
    promo_code: String(code).toUpperCase(),
    valid: true,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    max_discount: promo.max_discount,
    min_order: promo.min_order,
    message: 'Promo applied',
  });
}

function handleFoodCheckout(body, user) {
  const { items } = getFoodCart(user);
  const store = foodStoreById(body.business_segment_id);
  if (!store) return fail('Store not found');
  if (items.length === 0) return fail('Cart is empty');
  const id = `fck-${(state.checkoutSeq += 1)}`;
  const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
  const deliveryMode = num(body.delivery_mode, 1);
  const deliveryFee = deliveryMode === 2 ? 0 : store.delivery_fee;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const promoCode = pick(body.promo_code, '');
  let discount = 0;
  const validPromo = FOOD_PROMO_CODES[String(promoCode).toUpperCase()];
  if (validPromo && subtotal >= validPromo.min_order) {
    discount = validPromo.discount_type === 'percentage'
      ? Math.round(Math.min(subtotal * validPromo.discount_value / 100, validPromo.max_discount) * 100) / 100
      : validPromo.discount_value;
  }
  const total = Math.round((subtotal + deliveryFee + tax - discount) * 100) / 100;
  const ref = {
    id,
    storeId: store.id,
    storeName: store.full_name,
    items: items.map((i) => ({ ...i })),
    subtotal,
    deliveryFee,
    tax,
    discount,
    promoCode: discount > 0 ? String(promoCode).toUpperCase() : '',
    total,
    deliveryMode,
    paymentMode: pick(body.payment_mode, '1'),
    address: pick(body.address || body.drop_location, ''),
    latitude: num(body.latitude, store.latitude),
    longitude: num(body.longitude, store.longitude),
  };
  state.checkouts.set(id, ref);
  return ok(foodCheckoutPayload(ref));
}

function foodCheckoutPayload(ref) {
  return {
    id: ref.id,
    store_id: ref.storeId,
    store_name: ref.storeName,
    products: ref.items.map(cartItemPayload),
    subtotal: ref.subtotal,
    delivery_fee: ref.deliveryFee,
    tax: ref.tax,
    discount_amount: ref.discount,
    promo_code: ref.promoCode,
    total_amount: ref.total,
    delivery_mode: ref.deliveryMode,
    payment_mode: ref.paymentMode,
    address: ref.address,
    latitude: ref.latitude,
    longitude: ref.longitude,
    payment_methods: [{ id: '1', name: 'Cash', card_id: null }, { id: '2', name: 'Wallet', card_id: null }],
  };
}

function handlePlaceOrder(body, user) {
  const checkoutId = pick(body.checkout_id || body.id, '');
  let ref = state.checkouts.get(checkoutId);
  if (!ref) {
    const { items } = getFoodCart(user);
    const store = foodStoreById(body.business_segment_id || ref?.storeId);
    if (!store) return fail('Checkout not found');
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryMode = num(body.delivery_mode, 1);
    ref = {
      id: checkoutId || `fck-${(state.checkoutSeq += 1)}`,
      storeId: store.id,
      storeName: store.full_name,
      items: items.map((i) => ({ ...i })),
      subtotal,
      deliveryFee: deliveryMode === 2 ? 0 : store.delivery_fee,
      tax: Math.round(subtotal * 0.05 * 100) / 100,
      discount: 0,
      promoCode: '',
      total: Math.round((subtotal + (deliveryMode === 2 ? 0 : store.delivery_fee) + Math.round(subtotal * 0.05)) * 100) / 100,
      deliveryMode,
      paymentMode: pick(body.payment_mode, '1'),
      address: pick(body.address || body.drop_location, ''),
      latitude: num(body.latitude, store.latitude),
      longitude: num(body.longitude, store.longitude),
    };
  }
  const orderId = `fo-${(state.foodOrderSeq += 1)}`;
  const order = {
    id: orderId,
    merchant_order_id: state.foodOrderSeq,
    business_segment_id: ref.storeId,
    store_name: ref.storeName,
    order_status: 1,
    status_history: [],
    products: ref.items.map(cartItemPayload),
    subtotal: ref.subtotal,
    delivery_fee: ref.deliveryFee,
    tax: ref.tax,
    discount_amount: ref.discount,
    promo_code: ref.promoCode,
    total_amount: ref.total,
    delivery_mode: ref.deliveryMode,
    payment_mode: ref.paymentMode,
    address: ref.address,
    latitude: ref.latitude,
    longitude: ref.longitude,
    merchant_order_id: state.foodOrderSeq,
    created_at: Date.now(),
    updated_at: Date.now(),
    rate: null,
    user_id: user && user.id ? user.id : (state.foodOrderSeq - 1),
  };
  state.foodOrders.set(orderId, order);
  state.checkouts.delete(ref.id);
  if (user) {
    const { items } = getFoodCart(user);
    items.length = 0;
  }
  return ok({ id: orderId, order_number: order.merchant_order_id, order_status: 1, message: 'Order placed' });
}

function orderTicket(order) {
  const statusTimes = { 1: 0, 6: 12, 9: 22, 7: 30, 10: 60, 11: 75 };
  return statusTimes[order.order_status] ?? 0;
}

function orderStatusPayload(order) {
  const store = foodStoreById(order.business_segment_id);
  return {
    id: order.id,
    order_number: order.merchant_order_id,
    order_status: order.order_status,
    store_id: order.business_segment_id,
    store_name: order.store_name,
    full_name: order.store_name,
    store_address: store ? store.address : '',
    products: order.products,
    subtotal: order.subtotal,
    delivery_fee: order.delivery_fee,
    tax: order.tax,
    discount_amount: order.discount_amount,
    promo_code: order.promo_code,
    total_amount: order.total_amount,
    delivery_mode: order.delivery_mode,
    payment_mode: order.payment_mode,
    payment_mode_name: order.payment_mode === '2' ? 'Wallet' : 'Cash',
    address: order.address,
    latitude: order.latitude,
    longitude: order.longitude,
    created_at: order.created_at,
    cancel_able: order.order_status < 7,
    rate: order.rate,
    status_text: FOOD_ORDER_STATUSES[order.order_status] || 'Placed',
    ticket: orderTicket(order),
  };
}

function handleFoodOrderDetail(body) {
  const id = pick(body.order_id || body.id, '');
  const order = state.foodOrders.get(id);
  if (!order) return ok(null);
  return ok(orderStatusPayload(order));
}

function handleFoodOrderList(body, user) {
  const myOrders = Array.from(state.foodOrders.values())
    .filter((o) => (user && user.id ? o.user_id === user.id : true))
    .sort((a, b) => b.created_at - a.created_at);
  const status = body.status; // 'ACTIVE' | 'PAST' | undefined
  let orders = myOrders;
  if (status === 'ACTIVE') orders = orders.filter((o) => o.order_status !== 11);
  if (status === 'PAST') orders = orders.filter((o) => o.order_status === 11);
  return ok(orders.map(orderStatusPayload));
}

function handleFoodCancel(body) {
  const id = pick(body.order_id || body.id, '');
  const order = state.foodOrders.get(id);
  if (!order) return fail('Order not found');
  order.order_status = body.cancelled_by === 'store' ? 8 : 2;
  order.updated_at = Date.now();
  return ok({ id: order.id, order_status: order.order_status, message: 'Order cancelled' });
}

function handleFoodTrack(body) {
  const id = pick(body.order_id || body.id, '');
  const order = state.foodOrders.get(id);
  if (!order) return ok(null);
  return ok(orderStatusPayload(order));
}

function handleFoodRate(body) {
  const id = pick(body.order_id || body.id, '');
  const order = state.foodOrders.get(id);
  if (!order) return fail('Order not found');
  order.rate = { rating: num(body.rating, 5), comment: pick(body.comment, '') };
  return ok({ ok: true, message: 'Thanks for your feedback' });
}

function handleFoodReorder(body, user) {
  const id = pick(body.order_id || body.id, '');
  const order = state.foodOrders.get(id);
  if (!order) return fail('Order not found');
  const { items } = getFoodCart(user);
  order.products.forEach((cp) => {
    const existing = items.find((i) => i.product_id === cp.product_id && (i.variant_id || null) === (cp.variant_id || null));
    if (existing) existing.quantity += cp.quantity;
    else items.push({
      cart_id: `fc-${(state.foodCartSeq += 1)}`,
      product_id: cp.product_id,
      quantity: cp.quantity,
      price: cp.price,
      variant_id: cp.variant_id || null,
      variant_name: cp.variant_name || '',
      option_ids: [],
    });
  });
  return ok({ products: items.map(cartItemPayload), total_items: items.length });
}

function handleFoodChatHistory(body) {
  const key = `${pick(body.business_segment_id, '')}:${cartKey(null)}`;
  const msgs = state.foodChats.get(key) || [];
  const store = foodStoreById(body.business_segment_id);
  return ok({
    user_name: store ? store.full_name : 'Store',
    user_image: '',
    chat: msgs,
  });
}

function handleFoodSendChat(body) {
  const store = foodStoreById(body.business_segment_id);
  const key = `${pick(body.business_segment_id, '')}:${cartKey(null)}`;
  const msgs = state.foodChats.get(key) || [];
  msgs.push({ message: pick(body.message, ''), sender: 'USER', timestamp: Math.floor(Date.now() / 1000), business_segment: store ? store.full_name : '' });
  state.foodChats.set(key, msgs);
  return ok({ ok: true, message: 'Sent' });
}

function handleFavouriteBusinessSegment(body) {
  const id = num(body.business_segment_id, 0);
  if (id) {
    if (state.storeFavourites.has(id)) state.storeFavourites.delete(id);
    else state.storeFavourites.add(id);
  }
  return ok({ ok: true, message: 'Favourite updated' });
}

function handleGetFavouriteBusinessSegment() {
  return ok([]);
}

// â”€â”€ Store (grocery / pharmacy / generic) handlers â€” Phase 8 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function storeCartKey(user) {
  const uid = user && user.id ? user.id : 'guest';
  return `${uid}`;
}

function getStoreCart(user) {
  const key = storeCartKey(user);
  if (!state.storeCarts.has(key)) state.storeCarts.set(key, []);
  return { key, items: state.storeCarts.get(key) };
}

function storeById(id) {
  return STORE_STORES.find((s) => s.id === Number(id)) || null;
}

function storeProductById(id) {
  return STORE_PRODUCTS.find((p) => p.id === Number(id)) || null;
}

function storeSlugFor(body) {
  const slug = pick(body.slug, body.segment_slug, '');
  const s = slug ? STORE_STORES.find((x) => x.slug === slug) : null;
  return s ? s.slug : 'grocery';
}

function storePayload(s) {
  return {
    id: s.id,
    full_name: s.full_name,
    address: s.address,
    latitude: s.latitude,
    longitude: s.longitude,
    rating: s.rating,
    review_count: s.review_count,
    delivery_time_min: s.delivery_time_min,
    delivery_time_max: s.delivery_time_max,
    delivery_fee: s.delivery_fee,
    minimum_order: s.minimum_order,
    is_open: s.is_open,
    cuisines: s.cuisines,
    business_logo: s.business_logo,
    is_favourite: state.storeFavourites.has(s.id) ? 1 : 0,
    sub_group_for_app: s.sub_group_for_app,
    slug: s.slug,
    use_time_slots: s.use_time_slots,
    opening_time: s.opening_time,
    closing_time: s.closing_time,
  };
}

function storeProductPayload(p) {
  return {
    id: p.id,
    product_name: p.product_name,
    description: p.description,
    price: p.price,
    category_id: p.category_id,
    store_id: p.store_id,
    is_veg: p.is_veg,
    is_available: p.is_available,
    image: p.image,
    weight: p.weight,
    variants: p.variants.map((v) => ({ id: v.id, name: v.name, price: v.price })),
    options: p.options.map((o) => ({ id: o.id, name: o.name, price: o.price, type: o.type })),
  };
}

function handleStoreList(body) {
  const slug = storeSlugFor(body);
  const segmentSlug = slug || 'grocery';
  const group = num(body.sub_group_for_app, STORE_GROUP);
  let stores = STORE_STORES.filter((s) => s.slug === segmentSlug);
  if (body.is_open !== undefined) stores = stores.filter((s) => s.is_open === (bool(body.is_open) ? 1 : 0));
  return ok({
    business_segments: stores.map(storePayload),
  });
}

function handleStoreDetails(body) {
  const store = storeById(body.business_segment_id || body.id);
  if (!store) return ok({ business_segment: null, products: [] });
  const products = STORE_PRODUCTS.filter((p) => p.store_id === store.id);
  const categories = STORE_CATEGORIES.filter((c) => products.some((p) => p.category_id === c.id));
  return ok({
    business_segment: storePayload(store),
    categories: categories.map((c) => ({ id: c.id, category_name: c.category_name, sequence: c.sequence })),
    products: products.map(storeProductPayload),
    time_slots: STORE_SLOTS[store.id] || [],
    use_time_slots: store.use_time_slots,
  });
}

function handleSearchStoreProducts(body) {
  const store = storeById(body.business_segment_id || body.id);
  if (!store) return ok({ products: [], categories: [] });
  const keyword = String(body.keyword || body.search || '').toLowerCase();
  let products = STORE_PRODUCTS.filter((p) => p.store_id === store.id);
  if (keyword) {
    products = products.filter((p) =>
      (p.product_name || '').toLowerCase().includes(keyword) ||
      (p.description || '').toLowerCase().includes(keyword)
    );
  }
  const categories = STORE_CATEGORIES.filter((c) => products.some((p) => p.category_id === c.id));
  return ok({
    products: products.map(storeProductPayload),
    categories: categories.map((c) => ({ id: c.id, category_name: c.category_name, sequence: c.sequence })),
    keyword: String(body.keyword || body.search || ''),
  });
}

function storeCartItemPayload(item) {
  const p = storeProductById(item.product_id) || { product_name: item.product_name || 'Item', price: item.price || 0, is_veg: 1, image: '', store_id: item.store_id, weight: '' };
  return {
    cart_id: item.cart_id,
    product_id: item.product_id,
    product_name: p.product_name,
    price: item.price,
    quantity: item.quantity,
    variant_id: item.variant_id || null,
    variant_name: item.variant_name || '',
    option_ids: item.option_ids || [],
    total_amount: Math.round(item.price * item.quantity * 100) / 100,
    is_veg: p.is_veg,
    image: p.image,
    store_id: p.store_id,
    weight: item.weight || p.weight || '',
  };
}

function handleStoreGetCart(user) {
  const { items } = getStoreCart(user);
  return ok({ products: items.map(storeCartItemPayload), total_items: items.length });
}

function handleStoreAddToCart(body, user) {
  const { items } = getStoreCart(user);
  const p = storeProductById(body.product_id);
  if (!p) return ok({ products: items.map(storeCartItemPayload), total_items: items.length });
  let variant = p.variants[0] || { id: 0, name: p.weight || '', price: p.price };
  if (body.variant_id) variant = p.variants.find((v) => v.id === Number(body.variant_id)) || variant;
  const options = (Array.isArray(body.option_ids) ? body.option_ids : []).map((oid) => {
    const o = p.options.find((x) => x.id === Number(oid));
    return o ? { id: o.id, name: o.name, price: o.price } : null;
  }).filter(Boolean);
  const unitPrice = variant.price + options.reduce((sum, o) => sum + o.price, 0);
  const existing = items.find((i) => i.product_id === p.id && i.variant_id === variant.id);
  const qty = num(body.quantity, 1);
  const weight = body.variant_id ? pick(variant.name, p.weight) : p.weight;
  if (existing) {
    existing.quantity += qty;
  } else {
    items.push({
      cart_id: `sc-${(state.storeCartSeq += 1)}`,
      product_id: p.id,
      quantity: qty,
      price: unitPrice,
      weight: weight || '',
      variant_id: variant.id || null,
      variant_name: variant.name,
      option_ids: options.map((o) => o.id),
      store_id: p.store_id,
    });
  }
  return ok({ products: items.map(storeCartItemPayload), total_items: items.length });
}

function handleStoreUpdateCart(body, user) {
  const { items } = getStoreCart(user);
  const idx = items.findIndex((i) => String(i.cart_id) === String(body.cart_id));
  if (idx === -1) return ok({ products: items.map(storeCartItemPayload), total_items: items.length });
  if (num(body.quantity, 0) <= 0) {
    items.splice(idx, 1);
  } else {
    items[idx].quantity = num(body.quantity, items[idx].quantity);
  }
  return ok({ products: items.map(storeCartItemPayload), total_items: items.length });
}

function handleStoreRemoveCart(body, user) {
  const { items } = getStoreCart(user);
  const idx = items.findIndex((i) => String(i.cart_id) === String(body.cart_id));
  if (idx !== -1) items.splice(idx, 1);
  return ok({ products: items.map(storeCartItemPayload), total_items: items.length });
}

function handleStoreClearCart(user) {
  const { items } = getStoreCart(user);
  items.length = 0;
  return ok({ products: [], total_items: 0 });
}

function handleStoreApplyPromo(body) {
  const code = pick(body.promo_code || body.promoCode, '');
  const promo = FOOD_PROMO_CODES[String(code).toUpperCase()];
  if (!promo) return fail('Invalid or expired promo code');
  return ok({
    promo_code: String(code).toUpperCase(),
    valid: true,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    max_discount: promo.max_discount,
    min_order: promo.min_order,
    message: 'Promo applied',
  });
}

function handleStoreCheckout(body, user) {
  const { items } = getStoreCart(user);
  const store = storeById(body.business_segment_id);
  if (!store) return fail('Store not found');
  if (items.length === 0) return fail('Cart is empty');
  const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
  if (subtotal < store.minimum_order) {
    return fail(`Minimum order is â‚¹ ${store.minimum_order}`);
  }
  const id = `sck-${(state.checkoutSeq += 1)}`;
  const deliveryMode = num(body.delivery_mode, 1);
  const deliveryFee = deliveryMode === 2 ? 0 : store.delivery_fee;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const promoCode = pick(body.promo_code, '');
  let discount = 0;
  const validPromo = FOOD_PROMO_CODES[String(promoCode).toUpperCase()];
  if (validPromo && subtotal >= validPromo.min_order) {
    discount = validPromo.discount_type === 'percentage'
      ? Math.round(Math.min(subtotal * validPromo.discount_value / 100, validPromo.max_discount) * 100) / 100
      : validPromo.discount_value;
  }
  const total = Math.round((subtotal + deliveryFee + tax - discount) * 100) / 100;
  const slot = num(body.time_slot_id, 0);
  const slotObj = (STORE_SLOTS[store.id] || []).find((s) => s.id === slot) || null;
  const ref = {
    id,
    storeId: store.id,
    storeName: store.full_name,
    items: items.map((i) => ({ ...i })),
    subtotal,
    deliveryFee,
    tax,
    discount,
    promoCode: discount > 0 ? String(promoCode).toUpperCase() : '',
    total,
    deliveryMode,
    paymentMode: pick(body.payment_mode, '1'),
    address: pick(body.address || body.drop_location, ''),
    latitude: num(body.latitude, store.latitude),
    longitude: num(body.longitude, store.longitude),
    minOrder: store.minimum_order,
    timeSlotId: slot,
    timeSlotLabel: slotObj ? slotObj.label : '',
    prescriptionImage: pick(body.prescription_image, ''),
  };
  state.checkouts.set(id, ref);
  return ok(storeCheckoutPayload(ref, store));
}

function storeCheckoutPayload(ref, store) {
  const slotObj = (STORE_SLOTS[store.id] || []).find((s) => s.id === ref.timeSlotId) || null;
  return {
    id: ref.id,
    store_id: ref.storeId,
    store_name: ref.storeName,
    products: ref.items.map(storeCartItemPayload),
    subtotal: ref.subtotal,
    delivery_fee: ref.deliveryFee,
    tax: ref.tax,
    discount_amount: ref.discount,
    promo_code: ref.promoCode,
    total_amount: ref.total,
    delivery_mode: ref.deliveryMode,
    payment_mode: ref.paymentMode,
    address: ref.address,
    latitude: ref.latitude,
    longitude: ref.longitude,
    minimum_order: ref.minOrder,
    time_slot_id: ref.timeSlotId,
    time_slot_label: slotObj ? slotObj.label : ref.timeSlotLabel,
    prescription_image: ref.prescriptionImage,
    pharmacy: store.slug === 'pharmacy',
    use_time_slots: store.use_time_slots,
    payment_methods: [{ id: '1', name: 'Cash', card_id: null }, { id: '2', name: 'Wallet', card_id: null }],
  };
}

function handleStorePlaceOrder(body, user) {
  const checkoutId = pick(body.checkout_id || body.id, '');
  let ref = state.checkouts.get(checkoutId);
  if (!ref) {
    const { items } = getStoreCart(user);
    const store = storeById(body.business_segment_id || 0);
    if (!store) return fail('Checkout not found');
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    if (subtotal < store.minimum_order) return fail(`Minimum order is â‚¹ ${store.minimum_order}`);
    const deliveryMode = num(body.delivery_mode, 1);
    const slot = num(body.time_slot_id, 0);
    const slotObj = (STORE_SLOTS[store.id] || []).find((s) => s.id === slot) || null;
    ref = {
      id: checkoutId || `sck-${(state.checkoutSeq += 1)}`,
      storeId: store.id,
      storeName: store.full_name,
      items: items.map((i) => ({ ...i })),
      subtotal,
      deliveryFee: deliveryMode === 2 ? 0 : store.delivery_fee,
      tax: Math.round(subtotal * 0.05 * 100) / 100,
      discount: 0,
      promoCode: '',
      total: Math.round((subtotal + (deliveryMode === 2 ? 0 : store.delivery_fee) + Math.round(subtotal * 0.05)) * 100) / 100,
      deliveryMode,
      paymentMode: pick(body.payment_mode, '1'),
      address: pick(body.address || body.drop_location, ''),
      latitude: num(body.latitude, store.latitude),
      longitude: num(body.longitude, store.longitude),
      minOrder: store.minimum_order,
      timeSlotId: slot,
      timeSlotLabel: slotObj ? slotObj.label : '',
      prescriptionImage: pick(body.prescription_image, ''),
    };
  }
  const orderId = `so-${(state.storeOrderSeq += 1)}`;
  const order = {
    id: orderId,
    merchant_order_id: state.storeOrderSeq,
    business_segment_id: ref.storeId,
    store_name: ref.storeName,
    order_status: 1,
    status_history: [],
    products: ref.items.map(storeCartItemPayload),
    subtotal: ref.subtotal,
    delivery_fee: ref.deliveryFee,
    tax: ref.tax,
    discount_amount: ref.discount,
    promo_code: ref.promoCode,
    total_amount: ref.total,
    delivery_mode: ref.deliveryMode,
    payment_mode: ref.paymentMode,
    address: ref.address,
    latitude: ref.latitude,
    longitude: ref.longitude,
    min_order: ref.minOrder,
    time_slot_id: ref.timeSlotId,
    time_slot_label: ref.timeSlotLabel,
    prescription_image: ref.prescriptionImage,
    pharmacy: storeById(ref.storeId) ? storeById(ref.storeId).slug === 'pharmacy' : false,
    created_at: Date.now(),
    updated_at: Date.now(),
    rate: null,
    user_id: user && user.id ? user.id : (state.storeOrderSeq - 1),
  };
  state.storeOrders.set(orderId, order);
  state.checkouts.delete(ref.id);
  if (user) {
    const { items } = getStoreCart(user);
    items.length = 0;
  }
  return ok({ id: orderId, order_number: order.merchant_order_id, order_status: 1, message: 'Order placed' });
}

function storeOrderStatusPayload(order) {
  const store = storeById(order.business_segment_id);
  return {
    id: order.id,
    order_number: order.merchant_order_id,
    order_status: order.order_status,
    store_id: order.business_segment_id,
    store_name: order.store_name,
    full_name: order.store_name,
    store_address: store ? store.address : '',
    products: order.products,
    subtotal: order.subtotal,
    delivery_fee: order.delivery_fee,
    tax: order.tax,
    discount_amount: order.discount_amount,
    promo_code: order.promo_code,
    total_amount: order.total_amount,
    delivery_mode: order.delivery_mode,
    payment_mode: order.payment_mode,
    payment_mode_name: order.payment_mode === '2' ? 'Wallet' : 'Cash',
    address: order.address,
    latitude: order.latitude,
    longitude: order.longitude,
    created_at: order.created_at,
    cancel_able: order.order_status < 7,
    rate: order.rate,
    status_text: FOOD_ORDER_STATUSES[order.order_status] || 'Placed',
    ticket: orderTicket(order),
    min_order: order.min_order,
    time_slot_id: order.time_slot_id,
    time_slot_label: order.time_slot_label,
    prescription_image: order.prescription_image,
    pharmacy: order.pharmacy,
  };
}

function handleStoreOrderDetail(body) {
  const id = pick(body.order_id || body.id, '');
  const order = state.storeOrders.get(id);
  if (!order) return ok(null);
  return ok(storeOrderStatusPayload(order));
}

function handleStoreOrderList(body, user) {
  const myOrders = Array.from(state.storeOrders.values())
    .filter((o) => (user && user.id ? o.user_id === user.id : true))
    .sort((a, b) => b.created_at - a.created_at);
  const status = body.status;
  let orders = myOrders;
  if (status === 'ACTIVE') orders = orders.filter((o) => o.order_status !== 11);
  if (status === 'PAST') orders = orders.filter((o) => o.order_status === 11);
  return ok(orders.map(storeOrderStatusPayload));
}

function handleStoreCancel(body) {
  const id = pick(body.order_id || body.id, '');
  const order = state.storeOrders.get(id);
  if (!order) return fail('Order not found');
  order.order_status = body.cancelled_by === 'store' ? 8 : 2;
  order.updated_at = Date.now();
  return ok({ id: order.id, order_status: order.order_status, message: 'Order cancelled' });
}

function handleStoreTrack(body) {
  const id = pick(body.order_id || body.id, '');
  const order = state.storeOrders.get(id);
  if (!order) return ok(null);
  return ok(storeOrderStatusPayload(order));
}

function handleStoreRate(body) {
  const id = pick(body.order_id || body.id, '');
  const order = state.storeOrders.get(id);
  if (!order) return fail('Order not found');
  order.rate = { rating: num(body.rating, 5), comment: pick(body.comment, '') };
  return ok({ ok: true, message: 'Thanks for your feedback' });
}

function handleStoreReorder(body, user) {
  const id = pick(body.order_id || body.id, '');
  const order = state.storeOrders.get(id);
  if (!order) return fail('Order not found');
  const { items } = getStoreCart(user);
  order.products.forEach((cp) => {
    const existing = items.find((i) => i.product_id === cp.product_id && (i.variant_id || null) === (cp.variant_id || null));
    if (existing) existing.quantity += cp.quantity;
    else items.push({
      cart_id: `sc-${(state.storeCartSeq += 1)}`,
      product_id: cp.product_id,
      quantity: cp.quantity,
      price: cp.price,
      weight: cp.weight || '',
      variant_id: cp.variant_id || null,
      variant_name: cp.variant_name || '',
      option_ids: [],
      store_id: cp.store_id,
    });
  });
  return ok({ products: items.map(storeCartItemPayload), total_items: items.length });
}

function handleStoreChatHistory(body) {
  const key = `${pick(body.business_segment_id, '')}:${storeCartKey(null)}`;
  const msgs = state.storeChats.get(key) || [];
  const store = storeById(body.business_segment_id);
  return ok({
    user_name: store ? store.full_name : 'Store',
    user_image: '',
    chat: msgs,
  });
}

function handleStoreSendChat(body) {
  const store = storeById(body.business_segment_id);
  const key = `${pick(body.business_segment_id, '')}:${storeCartKey(null)}`;
  const msgs = state.storeChats.get(key) || [];
  msgs.push({ message: pick(body.message, ''), sender: 'USER', timestamp: Math.floor(Date.now() / 1000), business_segment: store ? store.full_name : '' });
  state.storeChats.set(key, msgs);
  return ok({ ok: true, message: 'Sent' });
}

// â”€â”€ Phase 9 â€” Handyman / plumber / salon / towing engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const HM_SEGMENTS = { 6: { title: 'Handyman', biddingEnable: true }, 7: { title: 'Plumber', biddingEnable: false }, 8: { title: 'Salon & Spa', biddingEnable: false }, 9: { title: 'Vehicle Towing', biddingEnable: true } };
const HM_SEGMENT_IDS = [6, 7, 8, 9];

const HM_SEGMENT_CATEGORIES = {
  6: [[60, 'Home Repair'], [61, 'Furniture'], [62, 'Cleaning'], [63, 'Electrician'], [64, 'Other']],
  7: [[70, 'Repair'], [71, 'Installation'], [72, 'Emergency']],
  8: [[80, 'Hair'], [81, 'Skin'], [82, 'Nails'], [83, 'Spa']],
  9: [[90, 'Towing'], [91, 'Flat Tyre'], [92, 'Jump Start'], [93, 'Fuel Delivery']],
};

const HM_SERVICES = {
  6: [{ id: 101, name: 'Tub Change', amount: 149 }, { id: 102, name: 'Ceiling Fan', amount: 249 }, { id: 103, name: 'Door Lock', amount: 199 }, { id: 104, name: 'Wall Mounting', amount: 299 }, { id: 105, name: 'Furniture Assembly', amount: 349 }, { id: 106, name: 'Deep Cleaning', amount: 399 }, { id: 107, name: 'Disinfection', amount: 249 }, { id: 108, name: 'Geyser Repair', amount: 349 }],
  7: [{ id: 109, name: 'Pipe Fix', amount: 199 }, { id: 110, name: 'Tap Replace', amount: 149 }, { id: 111, name: 'Basin Install', amount: 249 }, { id: 112, name: 'Leak Detect', amount: 299 }, { id: 113, name: 'Water Heater', amount: 349 }, { id: 114, name: 'Emergency Pipe', amount: 499 }],
  8: [{ id: 115, name: 'Hair Cut', amount: 249 }, { id: 116, name: "Men's Grooming", amount: 399 }, { id: 117, name: 'Facial', amount: 499 }, { id: 118, name: 'Manicure', amount: 399 }, { id: 119, name: 'Pedicure', amount: 449 }, { id: 120, name: 'Full Body Massage', amount: 999 }, { id: 121, name: 'Waxing', amount: 349 }],
  9: [{ id: 122, name: 'Two-Wheeler Tow', amount: 499 }, { id: 123, name: 'Car Tow', amount: 799 }, { id: 124, name: 'Flat Tyre Assist', amount: 299 }, { id: 125, name: 'Jump Start', amount: 199 }, { id: 126, name: 'Fuel Delivery', amount: 249 }, { id: 127, name: 'Battery Replace', amount: 599 }],
};

const HM_PROVIDERS = [
  { id: 501, first_name: 'Ravi', last_name: 'Kumar', business_name: 'Ravi Handyman Services', rating: '4.6', time_range: '09:00 AM - 06:00 PM', distance: '1.2 km', current_latitude: '19.0761', current_longitude: '72.8774', image: '', is_favourite: 0, hourly_amount: '0', minimum_booking_amount: '149', min_bill_description: 'Minimum booking amount of â‚¹149 applies', price_type_text: 'Fixed Price', price_type_slug: 'fixed-price', segment_price_card_id: 606 },
  { id: 502, first_name: 'Sunil', last_name: 'Sharma', business_name: 'Sunil Repairs & Cleaning', rating: '4.3', time_range: '08:00 AM - 05:00 PM', distance: '2.4 km', current_latitude: '19.078', current_longitude: '72.88', image: '', is_favourite: 1, hourly_amount: '0', minimum_booking_amount: '149', min_bill_description: 'Minimum booking amount of â‚¹149 applies', price_type_text: 'Fixed Price', price_type_slug: 'fixed-price', segment_price_card_id: 606 },
  { id: 503, first_name: 'Amit', last_name: 'Verma', business_name: 'Amit Electrical & Plumbing', rating: '4.8', time_range: '10:00 AM - 07:00 PM', distance: '1.9 km', current_latitude: '19.074', current_longitude: '72.875', image: '', is_favourite: 0, hourly_amount: '0', minimum_booking_amount: '149', min_bill_description: 'Minimum booking amount of â‚¹149 applies', price_type_text: 'Fixed Price', price_type_slug: 'fixed-price', segment_price_card_id: 606 },
  { id: 504, first_name: 'Priya', last_name: 'Nair', business_name: 'Priya Salon & Beauty', rating: '4.9', time_range: '09:30 AM - 08:00 PM', distance: '3.1 km', current_latitude: '19.081', current_longitude: '72.889', image: '', is_favourite: 0, hourly_amount: '0', minimum_booking_amount: '149', min_bill_description: 'Minimum booking amount of â‚¹149 applies', price_type_text: 'Fixed Price', price_type_slug: 'fixed-price', segment_price_card_id: 606 },
  { id: 505, first_name: 'Vikram', last_name: 'Singh', business_name: 'Vikram Tow & Assist', rating: '4.5', time_range: '24 Hours', distance: '0.8 km', current_latitude: '19.075', current_longitude: '72.876', image: '', is_favourite: 0, hourly_amount: '0', minimum_booking_amount: '149', min_bill_description: 'Minimum booking amount of â‚¹149 applies', price_type_text: 'Fixed Price', price_type_slug: 'fixed-price', segment_price_card_id: 606 },
];

const HM_PROVIDER_SERVICES = {
  501: [101, 102, 103, 104], 502: [101, 105, 106, 107], 503: [108, 109, 110, 111], 504: [115, 116, 117, 118, 119], 505: [122, 123, 124, 125],
};

function hmServiceById(id) { for (const seg of HM_SEGMENT_IDS) { const found = HM_SERVICES[seg]?.find((s) => s.id === id); if (found) return found; } return null; }
function hmServiceBySegment(segId, svcId) { return (HM_SERVICES[segId] || []).find((s) => s.id === svcId) || null; }
function hmGetDate() { return new Date().toISOString().slice(0, 10); }
function hmGetTomorrow() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); }

const HANDYMAN_CARTS = {};
let HANDYMAN_ORDERS = [];
let HANDYMAN_ORDER_SEQ = 9013;
let HANDYMAN_BID_ORDERS = [];
let HANDYMAN_BID_SEQ = 1002;

function hmBuildCart(segId, body) {
  const cid = segId * 100;
  const existing = HANDYMAN_CARTS[String(segId)];
  const cart = existing || { total_quantity: 0, total_amount: 0, discount_amount: 0, tax: 0, tax_per: 0, final_amount: 0, ordered_services: [], cart_id: cid, service_time_slot_detail_id: 501, driver_id: null, booking_date: hmGetDate(), payment_method_id: 1, segment_price_card_id: segId * 100 + 11, latitude: '19.076', longitude: '72.877', drop_location: 'Home', user_address_id: 12, slot_time_text: '09:00 AM', driver_details: { id: null, image: '', first_name: '', last_name: '' }, applied_promo_code: '' };
  if (body.service_time_slot_detail_id != null) cart.service_time_slot_detail_id = num(body.service_time_slot_detail_id, cart.service_time_slot_detail_id);
  if (body.segment_price_card_id != null) cart.segment_price_card_id = num(body.segment_price_card_id, cart.segment_price_card_id);
  if (body.latitude != null) cart.latitude = String(body.latitude);
  if (body.longitude != null) cart.longitude = String(body.longitude);
  if (body.drop_location != null) cart.drop_location = String(body.drop_location);
  if (body.booking_date != null) cart.booking_date = String(body.booking_date);
  if (body.payment_method_id != null) cart.payment_method_id = num(body.payment_method_id, 1);
  if (body.user_address_id != null) cart.user_address_id = num(body.user_address_id, 12);
  if (body.driver_id != null) cart.driver_id = num(body.driver_id, null);
  HANDYMAN_CARTS[String(segId)] = cart;
  return cart;
}

function hmRecalcCart(cart) {
  cart.total_quantity = cart.ordered_services.reduce((s, svc) => s + svc.quantity, 0);
  cart.total_amount = cart.ordered_services.reduce((s, svc) => s + svc.quantity * svc.service_price, 0);
  if (cart.applied_promo_code === 'WELCOME10') cart.discount_amount = Math.min(Math.round(cart.total_amount * 0.1 * 100) / 100, cart.total_amount);
  else if (cart.applied_promo_code === 'FLAT25') cart.discount_amount = Math.min(25, cart.total_amount);
  else cart.discount_amount = 0;
  cart.final_amount = Math.max(0, cart.total_amount - cart.discount_amount);
  cart.slot_time_text = (HM_SLOT_MAP || {})[cart.service_time_slot_detail_id] || '09:00 AM';
}

function hmBuildCartResponse(cart) { return { ...cart, booking_time: cart.slot_time_text }; }

function hmGetSlots() { return [
  { id: 501, slot_time: '09:00 AM', date: hmGetDate(), is_selected: 0 },
  { id: 502, slot_time: '11:30 AM', date: hmGetDate(), is_selected: 0 },
  { id: 503, slot_time: '02:00 PM', date: hmGetDate(), is_selected: 0 },
  { id: 504, slot_time: '05:30 PM', date: hmGetDate(), is_selected: 0 },
  { id: 505, slot_time: '07:00 PM', date: hmGetTomorrow(), is_selected: 0 },
]; }
const HM_SLOT_MAP = { 501: '09:00 AM', 502: '11:30 AM', 503: '02:00 PM', 504: '05:30 PM', 505: '07:00 PM' };

function hmProviderById(id) { return HM_PROVIDERS.find((p) => p.id === id) || null; }

function hmProviderResponse(p, segId) {
  const svcIds = HM_PROVIDER_SERVICES[p.id] || [];
  const segSvcs = HM_SERVICES[segId] || HM_SERVICES[6];
  const serviceType = svcIds.map((svcId) => { const s = segSvcs.find((x) => x.id === svcId); return s ? { id: s.id, name: s.name, amount: s.amount, amount_string: `â‚¹${s.amount}`, segment_price_card_detail_id: s.id } : null; }).filter(Boolean);
  return { id: p.id, first_name: p.first_name, last_name: p.last_name, business_name: p.business_name, distance: p.distance, is_favourite: p.is_favourite, rating: p.rating, rating_number: Number(p.rating), time_range: p.time_range, current_latitude: p.current_latitude, current_longitude: p.current_longitude, image: p.image, segment_price_card_id: p.segment_price_card_id, hourly_amount: p.hourly_amount, minimum_booking_amount: p.minimum_booking_amount, min_bill_description: p.min_bill_description, price_type_text: p.price_type_text, price_type_slug: p.price_type_slug, service_type: serviceType };
}

function hmBuildOrderResponse(order) {
  return { order_id: order.order_id, merchant_order_id: order.merchant_order_id, first_name: order.first_name, last_name: order.last_name, rating: order.rating, profile_image: order.profile_image, phone_number: order.phone_number, drop_location: order.drop_location, drop_latitude: order.drop_latitude, drop_longitude: order.drop_longitude, currency: 'â‚¹', total_services: order.total_services, order_status: order.order_status_text, status: order.numeric_order_status, order_otp: order.order_otp, segment_name: order.segment_name, booking_date: order.booking_date, slot_time_text: order.slot_time_text, service_type: order.service_type, segment_id: order.segment_id, payment_detail: order.payment_detail, cancel_reason: HM_CANCEL_REASONS, is_rated: order.is_rated, arr_action: order.arr_action, bidding_amount_accepted: null, bidding_amount: null, handyman_customer_details_visible: true, current_latitude: order.current_latitude, current_longitude: order.current_longitude, rating: order.rating };
}

// Seed demo orders
HANDYMAN_ORDERS = [
  { order_id: 9011, merchant_order_id: 'hm-9011', first_name: 'Ravi', last_name: 'Kumar', rating: '4.6', profile_image: '', phone_number: '+91 98200 00000', drop_location: 'Home', drop_latitude: '19.076', drop_longitude: '72.877', total_services: 1, order_status_text: 'Delivered', numeric_order_status: 11, booking_date: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })(), slot_time_text: '11:30 AM', service_type: [{ id: 101, name: 'Tub Change', amount: 'â‚¹149', currency: 'â‚¹', price_type: 1, segment_price_card_id: 606 }], segment_id: 6, segment_name: 'Handyman', order_otp: '4587', current_latitude: '19.0761', current_longitude: '72.8774', is_rated: true, arr_action: { cancel: false, pay: false, create_outstanding: '' }, payment_detail: { cart_amount: '149', dispute_settled_amount: '0.0', tax: '0.0', final_amount_paid: '149', minimum_booking_amount: '149', minimum_booking_amount_payment_status: true, total_pending_amount: '0.0', pending_amount_status: false, pending_message: '', paid_status: true, payment_method_id: 1, payment_mode: 'Cash', discount_amount: '0', additional_amount: [], custom_additional_charge: '' } },
  { order_id: 9012, merchant_order_id: 'hm-9012', first_name: 'Ravi', last_name: 'Kumar', rating: '0', profile_image: '', phone_number: '+91 98200 00000', drop_location: 'Home', drop_latitude: '19.076', drop_longitude: '72.877', total_services: 1, order_status_text: 'Placed', numeric_order_status: 1, booking_date: hmGetDate(), slot_time_text: '02:00 PM', service_type: [{ id: 102, name: 'Ceiling Fan', amount: 'â‚¹249', currency: 'â‚¹', price_type: 1, segment_price_card_id: 606 }], segment_id: 6, segment_name: 'Handyman', order_otp: '3312', current_latitude: '19.0761', current_longitude: '72.8774', is_rated: false, arr_action: { cancel: true, pay: false, create_outstanding: '' }, payment_detail: { cart_amount: '249', dispute_settled_amount: '0.0', tax: '0.0', final_amount_paid: '249', minimum_booking_amount: '149', minimum_booking_amount_payment_status: false, total_pending_amount: '249', pending_amount_status: true, pending_message: 'Balance payable to the provider after service', paid_status: false, payment_method_id: 1, payment_mode: 'Cash', discount_amount: '0', additional_amount: [], custom_additional_charge: '' } },
];

HANDYMAN_BID_ORDERS = [
  { id: 1001, bid_order_id: 'bdo-1001', service_name: 'Ceiling Fan Fixing', category_name: 'Home Repair', description: 'Two ceiling fans not working', work_image_one: '', work_image_two: '', work_image_three: '', work_image_four: '', final_amount: '200', status: 'Active', numeric_status: 1, created_at: new Date().toISOString(), booked_at: '', time_slot_text: '02:00 PM', user_offer_price: '200', no_of_bids: 2, segment_id: 6, bids: [
    { id: 8001, driver_id: 501, first_name: 'Ravi', last_name: 'Kumar', profile_image: '', rating: '4.6', bid_amount: 'â‚¹180', amount: '180', created_at: new Date().toISOString(), time_text: '2 min ago', user_offer_price: '200', status: 'Active', numeric_status: 1, message: '' },
    { id: 8002, driver_id: 503, first_name: 'Amit', last_name: 'Verma', profile_image: '', rating: '4.8', bid_amount: 'â‚¹165', amount: '165', created_at: new Date().toISOString(), time_text: '8 min ago', user_offer_price: '200', status: 'Active', numeric_status: 1, message: '' },
  ] },
  { id: 1000, bid_order_id: 'bdo-1000', service_name: 'Kitchen Tap Replacement', category_name: 'Repair', description: 'Leaking kitchen tap', work_image_one: '', work_image_two: '', work_image_three: '', work_image_four: '', final_amount: '210', status: 'Booked', numeric_status: 3, created_at: new Date().toISOString(), booked_at: new Date().toISOString(), time_slot_text: '11:30 AM', user_offer_price: '250', no_of_bids: 1, segment_id: 7, bids: [
    { id: 8000, driver_id: 502, first_name: 'Sunil', last_name: 'Sharma', profile_image: '', rating: '4.3', bid_amount: 'â‚¹210', amount: '210', created_at: new Date().toISOString(), time_text: '15 min ago', user_offer_price: '250', status: 'Accepted', numeric_status: 2, message: '' },
  ] },
];

const HM_CANCEL_REASONS = [
  { id: 1, reason: 'Wrong date / time' },
  { id: 2, reason: 'Service no longer needed' },
  { id: 3, reason: 'Found another provider' },
  { id: 4, reason: 'Other' },
];

function handleHandymanGetCategories(body) { const segId = num(body.segment_id, 6); return ok({ arr_categories: (HM_SEGMENT_CATEGORIES[segId] || []).map(([id, name]) => ({ id, name, image: '' })) }); }
function handleHandymanGetServices(body) { const segId = num(body.segment_id, 6); const svcs = (HM_SERVICES[segId] || []).map((s) => ({ id: s.id, name: s.name, amount: s.amount, amount_string: `â‚¹${s.amount}`, price_type: 1, segment_price_card_id: 600 + segId })); return ok({ segment_price_id: segId * 100 + 11, currency: 'â‚¹', price_type_text: 'Fixed Price', price_type_slug: 'fixed-price', minimum_booking_amount: 149, minimum_booking_amount_string: 'â‚¹149', min_bill_description: 'Minimum booking amount of â‚¹149 applies', hourly_amount: 0, arr_services: svcs, handyman_bidding_enable: !!HM_SEGMENTS[segId]?.biddingEnable }); }
function handleHandymanGetProviders(body) { const segId = num(body.segment_id, 6); const selected = Array.isArray(body.selected_services) ? body.selected_services.map((s) => num(s.service_type_id, 0)).filter(Boolean) : []; let list = HM_PROVIDERS.map((p) => hmProviderResponse(p, segId)); if (selected.length > 0) { const filtered = list.filter((p) => selected.every((sid) => p.service_type.some((s) => s.id === sid))); if (filtered.length > 0) list = filtered; } return ok({ providers: list, total_pages: 1, current_page: 1, tax_per: 0, limit: 10 }); }
function handleHandymanGetProvider(body) { const providerId = num(body.provider_id, 0); const segId = num(body.segment_id, 6); const p = hmProviderById(providerId); if (!p) return fail('Provider not found'); return ok(hmProviderResponse(p, segId)); }
function handleHandymanServiceSlots(body) { return ok({ time_slots: hmGetSlots(), instant_booking_time_slot_id: 503, instant_booking_after_text: 'Available now' }); }
function handleHandymanSaveBookingCart(body) { const segId = num(body.segment_id, 6); const isUpdate = String(body.is_update || '').toUpperCase() === 'YES'; const cart = hmBuildCart(segId, body); if (body.service_type_id != null) { const svcId = num(body.service_type_id, 0); const svc = hmServiceById(svcId); if (svc) { const existing = cart.ordered_services.find((s) => s.service_type_id === svcId); const details = body.service_details ? body.service_details[String(svcId)] : null; const qty = (details && details[0] && details[0].quantity != null) ? num(details[0].quantity, 1) : 1; if (isUpdate) { if (existing) { if (qty <= 0) { cart.ordered_services = cart.ordered_services.filter((s) => s.service_type_id !== svcId); } else { existing.quantity = qty; } } } else { if (existing) { existing.quantity += qty; } else { cart.ordered_services.push({ service_type_id: svcId, quantity: qty, segment_price_card_detail_id: svcId, service_price: svc.amount, service_name: svc.name }); } } } } hmRecalcCart(cart); return ok(hmBuildCartResponse(cart)); }
function handleHandymanGetCart(body) { const cartId = num(body.cart_id, 0); for (const key of Object.keys(HANDYMAN_CARTS)) { if (HANDYMAN_CARTS[key].cart_id === cartId) return ok(hmBuildCartResponse(HANDYMAN_CARTS[key])); } return fail('Cart not found'); }
function handleHandymanDeleteCart(body) { const cartId = num(body.cart_id, 0); const deleteType = String(body.delete_type || '').toUpperCase(); for (const key of Object.keys(HANDYMAN_CARTS)) { if (HANDYMAN_CARTS[key].cart_id === cartId) { const cart = HANDYMAN_CARTS[key]; if (deleteType === 'CART') { delete HANDYMAN_CARTS[key]; return ok({}); } else if (deleteType === 'SERVICE') { const svcId = num(body.service_type_id, 0); cart.ordered_services = cart.ordered_services.filter((s) => s.service_type_id !== svcId); hmRecalcCart(cart); return ok(hmBuildCartResponse(cart)); } } } return fail('Cart not found'); }
function handleHandymanApplyPromo(body) { const cartId = num(body.cart_id, 0); for (const key of Object.keys(HANDYMAN_CARTS)) { if (HANDYMAN_CARTS[key].cart_id === cartId) { const cart = HANDYMAN_CARTS[key]; const code = String(body.promo_code || '').toUpperCase(); if (code === 'WELCOME10' || code === 'FLAT25') { cart.applied_promo_code = code; } else { cart.applied_promo_code = ''; } hmRecalcCart(cart); return ok(hmBuildCartResponse(cart)); } } return fail('Cart not found'); }
function handleHandymanConfirmOrder(body) { const cartId = num(body.cart_id, 0); let cart = null; for (const key of Object.keys(HANDYMAN_CARTS)) { if (HANDYMAN_CARTS[key].cart_id === cartId) { cart = HANDYMAN_CARTS[key]; break; } } if (!cart || cart.ordered_services.length === 0) return fail('Cart is empty'); const segId = Math.floor(cartId / 100); const prov = hmProviderById(segId === 6 ? 501 : segId === 7 ? 502 : segId === 8 ? 504 : 505); const pmtId = num(body.payment_method_id, 1); const adv = num(body.advance_payment_of_min_bill, 0); const final = cart.final_amount; const pending = adv > 0 ? Math.max(0, final - adv) : 0; const paid = pmtId === 3 || adv >= final; const orderId = HANDYMAN_ORDER_SEQ++; const advance = num(body.advance_payment_of_min_bill, 0); const order = { order_id: orderId, merchant_order_id: `hm-${orderId}`, first_name: prov.first_name, last_name: prov.last_name, rating: '0', profile_image: '', phone_number: '+91 98200 00000', drop_location: body.drop_location || cart.drop_location || 'Home', drop_latitude: String(body.latitude || cart.latitude || '19.076'), drop_longitude: String(body.longitude || cart.longitude || '72.877'), currency: 'â‚¹', total_services: cart.total_quantity, order_status_text: 'Placed', numeric_order_status: 1, status: 1, booking_date: cart.booking_date, slot_time_text: cart.slot_time_text, service_type: cart.ordered_services.map((s) => { const svc = hmServiceById(s.service_type_id); return { id: s.service_type_id, name: s.service_name, amount: `â‚¹${svc ? svc.amount : s.service_price}`, currency: 'â‚¹', price_type: 1, segment_price_card_id: 600 + segId }; }), segment_id: segId, segment_name: HM_SEGMENTS[segId]?.title || 'Handyman', order_otp: String(randomInt(1000, 9999)), current_latitude: String(body.latitude || cart.latitude || '19.0761'), current_longitude: String(body.longitude || cart.longitude || '72.8774'), is_rated: false, arr_action: { cancel: true, pay: false, create_outstanding: '' }, payment_detail: { cart_amount: String(cart.total_amount), dispute_settled_amount: '0.0', tax: '0.0', final_amount_paid: String(final), minimum_booking_amount: '149', minimum_booking_amount_payment_status: advance >= 149, total_pending_amount: pending > 0 ? String(pending) : '0.0', pending_amount_status: pending > 0, pending_message: pending > 0 ? 'Balance payable to the provider after service' : '', paid_status: paid, payment_method_id: pmtId, payment_mode: pmtId === 3 ? 'Online' : 'Cash', discount_amount: String(cart.discount_amount), additional_amount: [], custom_additional_charge: '' } }; HANDYMAN_ORDERS.push(order); delete HANDYMAN_CARTS[String(segId)]; return ok({ order_id: orderId, order_status: 1 }); }
function handleHandymanGetOrders(body) { const type = String(body.type || 'SCHEDULED').toUpperCase(); const segId = body.segment_id != null ? num(body.segment_id, 0) : 0; let list = HANDYMAN_ORDERS; if (type === 'SCHEDULED') list = list.filter((o) => o.numeric_order_status === 1); else if (type === 'ONGOING') list = list.filter((o) => [6, 7, 9, 10].includes(o.numeric_order_status)); else if (type === 'PAST') list = list.filter((o) => [2, 3, 5, 8, 11, 12].includes(o.numeric_order_status)); if (segId) list = list.filter((o) => o.segment_id === segId); return ok(list.map((o) => ({ order_id: o.order_id, merchant_order_id: o.merchant_order_id, first_name: o.first_name, last_name: o.last_name, rating: o.rating, profile_image: o.profile_image, final_amount_paid: String(o.payment_detail.final_amount_paid), currency: 'â‚¹', total_services: o.total_services, order_status: o.order_status_text, numeric_order_status: o.numeric_order_status, booking_date: o.booking_date, slot_time_text: o.slot_time_text, segment_id: o.segment_id, service_type: o.service_type }))); }
function handleHandymanGetOrderDetail(body) { const orderId = num(body.order_id, 0); const order = HANDYMAN_ORDERS.find((o) => o.order_id === orderId); if (!order) return fail('Order not found'); return ok(hmBuildOrderResponse(order)); }
function handleHandymanCancelOrder(body) { const orderId = num(body.order_id, 0); const order = HANDYMAN_ORDERS.find((o) => o.order_id === orderId); if (!order) return fail('Order not found'); order.numeric_order_status = 2; order.status = 2; order.order_status_text = 'Cancelled'; order.arr_action = { cancel: false, pay: false, create_outstanding: '' }; return ok({ message: 'Order cancelled' }); }
function handleHandymanRateProvider(body) { const orderId = num(body.order_id, 0); const order = HANDYMAN_ORDERS.find((o) => o.order_id === orderId); if (!order) return fail('Order not found'); order.is_rated = true; order.rating = String(body.rating || 5); return ok({ message: 'Thank you for your feedback' }); }
function handleHandymanBookingPayment(body) { const orderId = num(body.order_id, 0); const order = HANDYMAN_ORDERS.find((o) => o.order_id === orderId); if (!order) return fail('Order not found'); order.payment_detail.paid_status = true; order.payment_detail.total_pending_amount = '0.0'; order.payment_detail.pending_amount_status = false; order.payment_detail.pending_message = ''; return ok({ payment_status: 1 }); }
function handleHandymanBiddingCreateOrder(body) { const segId = num(body.segment_id, 6); const catId = num(body.category_id, 0); const svcId = num(body.service_type_id, 0); const svc = hmServiceById(svcId); const catMap = { 60: 'Home Repair', 70: 'Repair', 90: 'Towing' }; const id = HANDYMAN_BID_SEQ++; const bidOrder = { id, bid_order_id: `bdo-${id}`, service_name: svc ? svc.name : 'General Work Request', category_name: catMap[catId] || 'Request', description: body.description || '', work_image_one: '', work_image_two: '', work_image_three: '', work_image_four: '', final_amount: String(body.user_offer_price || 0), status: 'Active', numeric_status: 1, created_at: new Date().toISOString(), booked_at: '', time_slot_text: (HM_SLOT_MAP || {})[num(body.service_time_slot_detail_id, 501)] || '09:00 AM', user_offer_price: String(body.user_offer_price || 0), no_of_bids: 0, segment_id: segId, bids: [] }; HANDYMAN_BID_ORDERS.push(bidOrder); return ok(bidOrder); }
function handleHandymanBiddingGetOrders(body) { const type = String(body.type || 'ALL').toUpperCase(); let list = HANDYMAN_BID_ORDERS; if (type === 'ACTIVE') list = list.filter((o) => o.numeric_status === 1); return ok(list); }
function handleHandymanBiddingGetOrderDetail(body) { const orderId = body.order_id; const bidOrder = HANDYMAN_BID_ORDERS.find((o) => o.bid_order_id === orderId || o.id === orderId); if (!bidOrder) return fail('Bid order not found'); return ok(bidOrder); }
function handleHandymanBiddingCounterBid(body) { const orderId = body.order_id; const bidOrderId = body.driver_bid_id; const counterAmount = num(body.counter_amount, 0); for (const bo of HANDYMAN_BID_ORDERS) { if (bo.bid_order_id === orderId || bo.id === orderId) { for (const bid of bo.bids) { if (bid.id === bidOrderId || bid.driver_id === bidOrderId) { bid.amount = String(counterAmount); bid.bid_amount = `â‚¹${counterAmount}`; break; } } break; } } return ok({ message: 'Counter offer sent to the driver' }); }
function handleHandymanBiddingAcceptOrder(body) { const orderId = body.order_id; const driverId = num(body.driver_id, 0); const bidOrder = HANDYMAN_BID_ORDERS.find((o) => o.bid_order_id === orderId || o.id === orderId); if (!bidOrder) return fail('Bid order not found'); bidOrder.numeric_status = 3; bidOrder.status = 'Booked'; bidOrder.booked_at = new Date().toISOString(); const winBid = bidOrder.bids.find((b) => b.driver_id === driverId) || bidOrder.bids[0]; const prov = hmProviderById(driverId) || hmProviderById(501); const pmtId = num(body.payment_method_id, 1); const total = Number(winBid ? winBid.amount : bidOrder.final_amount); const orderId2 = HANDYMAN_ORDER_SEQ++; const advance = num(body.advance_payment_of_min_bill, 0); const pending = advance > 0 ? Math.max(0, total - advance) : 0; const paid = pmtId === 3 || advance >= total; const order = { order_id: orderId2, merchant_order_id: `hm-${orderId2}`, first_name: prov.first_name, last_name: prov.last_name, rating: '0', profile_image: '', phone_number: '+91 98200 00000', drop_location: 'Home', drop_latitude: '19.076', drop_longitude: '72.877', currency: 'â‚¹', total_services: 1, order_status_text: 'Placed', numeric_order_status: 1, status: 1, booking_date: hmGetDate(), slot_time_text: bidOrder.time_slot_text, service_type: [{ id: 0, name: bidOrder.service_name, amount: `â‚¹${total}`, currency: 'â‚¹', price_type: 1, segment_price_card_id: 600 + bidOrder.segment_id }], segment_id: bidOrder.segment_id, segment_name: HM_SEGMENTS[bidOrder.segment_id]?.title || 'Handyman', order_otp: String(randomInt(1000, 9999)), current_latitude: '19.0761', current_longitude: '72.8774', is_rated: false, arr_action: { cancel: true, pay: false, create_outstanding: '' }, payment_detail: { cart_amount: String(total), dispute_settled_amount: '0.0', tax: '0.0', final_amount_paid: String(total), minimum_booking_amount: '149', minimum_booking_amount_payment_status: advance >= 149, total_pending_amount: pending > 0 ? String(pending) : '0.0', pending_amount_status: pending > 0, pending_message: pending > 0 ? 'Balance payable to the provider after service' : '', paid_status: paid, payment_method_id: pmtId, payment_mode: pmtId === 3 ? 'Online' : 'Cash', discount_amount: '0', additional_amount: [], custom_additional_charge: '' } }; HANDYMAN_ORDERS.push(order); return ok({ order_id: orderId2, message: 'Bid accepted' }); }
function handleHandymanBiddingCancelDelete(body) { const orderId = body.order_id; const action = String(body.action || 'CANCEL').toUpperCase(); const idx = HANDYMAN_BID_ORDERS.findIndex((o) => o.bid_order_id === orderId || o.id === orderId); if (idx === -1) return fail('Bid order not found'); if (action === 'DELETE') { HANDYMAN_BID_ORDERS.splice(idx, 1); return ok({ message: 'Bid order deleted' }); } else { HANDYMAN_BID_ORDERS[idx].numeric_status = 4; HANDYMAN_BID_ORDERS[idx].status = 'Cancelled'; return ok({ message: 'Bid order cancelled' }); } }

// â”€â”€ Phase 10 â€” Laundry engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Mirrors the route.ts mock so both surfaces return identical JSON.

const LD_OUTLET_BY_ID = new Map(LD_OUTLETS.map((o) => [o.id, o]));

const LD_CATEGORIES = [
  [11, 'Wash & Fold'],
  [12, 'Dry Clean'],
  [13, 'Ironing'],
  [14, 'Special Care'],
];

const LD_SERVICES = [
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

const LD_SLOT_MAP = { 501: '09:00 AM', 502: '11:30 AM', 503: '02:00 PM', 504: '05:30 PM', 505: '07:00 PM' };

const LD_CANCEL_REASONS = [
  { id: 1, reason: 'Changed my mind' },
  { id: 2, reason: 'Placed by mistake' },
  { id: 3, reason: 'Pickup time does not work' },
  { id: 4, reason: 'Found another outlet' },
];

const LD_HOME_STEPS = [1, 6, 10, 7, 13, 15, 16];
const LD_HOME_TH = [0, 8, 16, 24, 32, 40, 48];
const LD_SELF_STEPS = [1, 7, 9, 13];
const LD_SELF_TH = [0, 8, 16, 24];

const LD_HOME_DEFS = [
  [1, ['Order placed']],
  [6, ['Order accepted by outlet', 'Waiting to assign driver', 'Driver assigned']],
  [10, ['Order picked by driver']],
  [7, ['Arrived at outlet']],
  [13, ['In process']],
  [15, ['Dispatched']],
  [16, ['Out for delivery']],
  [14, ['Completed']],
];
const LD_SELF_DEFS = [
  [1, ['Order placed']],
  [7, ['Arrived at outlet']],
  [9, ['Pending pickup verification']],
  [13, ['In process']],
  [14, ['Completed']],
];

const LD_STATUS_TEXT = { 1: 'Placed', 2: 'Cancelled', 3: 'Rejected', 4: 'Accepted', 6: 'Accepted', 7: 'Arrived at outlet', 9: 'Verify pickup OTP', 10: 'Picked by driver', 12: 'Expired', 13: 'In process', 14: 'Completed', 15: 'Dispatched', 16: 'Out for delivery', 17: 'Delivered' };

function ldStatusText(status) { return LD_STATUS_TEXT[status] || 'Placed'; }
function ldServiceById(id) { return LD_SERVICES.find((s) => s.id === id) || null; }

function ldServiceImage(categoryId) {
  if (categoryId === 12) return '/assets/phase-10/suit.svg';
  if (categoryId === 13) return '/assets/phase-10/shirt.svg';
  if (categoryId === 14) return '/assets/phase-10/duvet.svg';
  return '/assets/phase-10/shirt.svg';
}

const LAUNDRY_CARTS = {};
let LAUNDRY_ORDERS = [];
let LAUNDRY_ORDER_SEQ = 8021;

function ldGetCart(outletId) { return LAUNDRY_CARTS[String(outletId)] || null; }

function ldNewCart(outletId) {
  const existing = ldGetCart(outletId);
  if (existing) return existing;
  const cart = {
    cart_id: outletId,
    laundry_outlet_id: outletId,
    segment_id: LD_SEGMENT_ID,
    service_type_id: 1,
    service_time_slot_detail_id: 501,
    booking_date: hmGetDate(),
    slot_time_text: '09:00 AM',
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
  LAUNDRY_CARTS[String(outletId)] = cart;
  return cart;
}

function ldRecalcCart(cart) {
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

function ldBuildCartResponse(cart) {
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

function ldOutletResponse(o) {
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
    currency: 'â‚¹',
    background_color: '#0ea5e9',
  };
}

function ldServiceResponse(s) {
  return {
    id: s.id,
    laundry_service_id: s.id,
    category_id: s.category_id,
    price: s.price,
    formatted_price: `â‚¹${s.price}`,
    title: s.title,
    service_description: s.description,
    currency: 'â‚¹',
    image: ldServiceImage(s.category_id),
    service_image: '',
    service_availability: '1',
    sequence: s.sequence,
  };
}

function ldBuildProgress(order) {
  const defs = order.service_type_id === 6 ? LD_SELF_DEFS : LD_HOME_DEFS;
  const histMap = new Map();
  for (const h of order.order_status_history) {
    if (!histMap.has(h.order_status)) histMap.set(h.order_status, h.order_timestamp);
  }
  const out = [];
  for (const [status, texts] of defs) {
    const done = histMap.has(status);
    for (const text of texts) {
      out.push({ status_text: text, order_timestamp: done ? histMap.get(status) : '', status: done });
    }
  }
  return out;
}

function ldCanCancel(order) { return ![2, 3, 12, 14].includes(order.order_status); }

function ldPushHistory(order, status) {
  if (!order.order_status_history.some((h) => h.order_status === status)) {
    order.order_status_history.push({ order_status: status, order_timestamp: new Date().toISOString() });
  }
}

function ldElapsed(order) { return (Date.now() - order.created_at) / 1000; }

function ldAdvance(order) {
  if ([2, 3, 12, 14].includes(order.order_status)) return;
  const steps = order.service_type_id === 6 ? LD_SELF_STEPS : LD_HOME_STEPS;
  const th = order.service_type_id === 6 ? LD_SELF_TH : LD_HOME_TH;
  const el = ldElapsed(order);
  let reached = steps[0];
  for (let i = 0; i < steps.length; i += 1) {
    if (el >= th[i]) reached = steps[i];
  }
  if (reached !== order.order_status) {
    order.order_status = reached;
    ldPushHistory(order, reached);
  }
  if (order.service_type_id === 6) {
    if (order.order_status === 13 && order.user_confirmed_otp_for_pickup === 1 && el >= LD_SELF_TH[LD_SELF_STEPS.indexOf(13)] + 12) {
      order.order_status = 14;
      ldPushHistory(order, 14);
    }
  } else {
    if (order.order_status === 16 && order.user_confirmed_otp_for_pickup === 1 && el >= LD_HOME_TH[LD_HOME_STEPS.indexOf(16)] + 14) {
      order.order_status = 17;
      ldPushHistory(order, 17);
    }
    if (order.order_status === 17 && el >= LD_HOME_TH[LD_HOME_STEPS.indexOf(16)] + 20) {
      order.order_status = 14;
      ldPushHistory(order, 14);
    }
  }
}

function ldBuildOrderResponse(order) {
  const outlet = LD_OUTLET_BY_ID.get(order.laundry_outlet_id) || {};
  const paid = order.payment_status === 1;
  return {
    order_id: order.order_id,
    merchant_order_id: order.merchant_order_id,
    laundry_outlet_id: order.laundry_outlet_id,
    outlet_name: outlet.full_name || 'Laundry Outlet',
    outlet_address: outlet.address || '',
    outlet_image: outlet.image || LD_DEFAULT_IMAGE,
    outlet_phone_number: outlet.phone_number || '',
    outlet_latitude: outlet.latitude || 0,
    outlet_longitude: outlet.longitude || 0,
    segment_id: order.segment_id,
    segment_name: 'Laundry',
    service_type_id: order.service_type_id,
    order_status_text: ldStatusText(order.order_status),
    order_status: order.order_status,
    order_otp: order.otp_for_pickup,
    otp_required: order.order_status === 9 || order.order_status === 16,
    total_quantity: order.total_quantity,
    items: order.items,
    drop_location: order.drop_location,
    drop_latitude: order.drop_latitude,
    drop_longitude: order.drop_longitude,
    booking_date: order.booking_date,
    slot_time_text: order.slot_time_text,
    estimate_delivery_time: order.estimate_delivery_time,
    payment_detail: {
      cart_amount: String(order.cart_amount),
      delivery_amount: String(order.delivery_amount),
      tax: String(order.tax),
      final_amount_paid: String(order.final_amount_paid),
      discount_amount: String(order.discount_amount),
      total_pending_amount: paid ? '0.0' : String(order.final_amount_paid),
      pending_amount_status: !paid,
      pending_message: paid ? '' : 'Balance payable on delivery',
      paid_status: paid,
      payment_method_id: order.payment_method_id,
      payment_mode: order.payment_method_id === 3 ? 'Online' : 'Cash',
    },
    cancel_reason: LD_CANCEL_REASONS,
    is_rated: order.is_rated,
    arr_action: { cancel: ldCanCancel(order), pay: false, otp_required: order.order_status === 9 || order.order_status === 16 },
    status_prgress: ldBuildProgress(order),
    order_status_history: order.order_status_history,
  };
}

// Seed demo laundry orders
(function ldSeed() {
  if (LAUNDRY_ORDERS.length > 0) return;
  const pastItems = [{ id: 1, laundry_service_id: 202, title: 'Wash & Iron', price: 'â‚¹55.00', quantity: 3, total_amount: 'â‚¹165.00', image: '/assets/phase-10/shirt.svg' }];
  LAUNDRY_ORDERS.push({
    order_id: 8019, merchant_order_id: 'ld-8019', laundry_outlet_id: 601, segment_id: LD_SEGMENT_ID, service_type_id: 1,
    order_status: 14, order_status_history: [1, 6, 10, 7, 13, 15, 16, 14].map((st) => ({ order_status: st, order_timestamp: new Date(Date.now() - 2 * 86400 * 1000 + st * 1000).toISOString() })),
    cart_amount: 165, delivery_amount: 39, tax: 10.2, discount_amount: 0, final_amount_paid: 214.2, total_quantity: 3,
    drop_location: 'Home', drop_latitude: '19.076', drop_longitude: '72.877', booking_date: hmGetDate(), slot_time_text: '11:30 AM', estimate_delivery_time: 'Today, 6:00 PM',
    otp_for_pickup: '3847', user_confirmed_otp_for_pickup: 1, payment_method_id: 1, payment_status: 1,
    created_at: Date.now() - 2 * 86400 * 1000, is_rated: true, items: pastItems,
  });
  const ongoingItems = [{ id: 1, laundry_service_id: 203, title: 'Dry Clean Shirt', price: 'â‚¹80.00', quantity: 2, total_amount: 'â‚¹160.00', image: '/assets/phase-10/suit.svg' }];
  LAUNDRY_ORDERS.push({
    order_id: 8020, merchant_order_id: 'ld-8020', laundry_outlet_id: 602, segment_id: LD_SEGMENT_ID, service_type_id: 1,
    order_status: 13, order_status_history: [1, 6, 10, 7, 13].map((st) => ({ order_status: st, order_timestamp: new Date(Date.now() - 35000 + st * 1000).toISOString() })),
    cart_amount: 160, delivery_amount: 39, tax: 9.95, discount_amount: 0, final_amount_paid: 208.95, total_quantity: 2,
    drop_location: 'Home', drop_latitude: '19.076', drop_longitude: '72.877', booking_date: hmGetDate(), slot_time_text: '02:00 PM', estimate_delivery_time: 'Today, 7:00 PM',
    otp_for_pickup: '4521', user_confirmed_otp_for_pickup: 0, payment_method_id: 1, payment_status: 0,
    created_at: Date.now() - 35000, is_rated: false, items: ongoingItems,
  });
})();

function handleLaundryGetCategories(body) { return ok({ arr_categories: LD_CATEGORIES.map(([id, name]) => ({ id, name, image: '' })) }); }
function handleLaundryGetServices(body) {
  const categoryId = num(body.category_id, 0);
  let services = LD_SERVICES;
  if (categoryId > 0) services = services.filter((s) => s.category_id === categoryId);
  return ok({ categories: LD_CATEGORIES.map(([id, name]) => ({ id, name, image: '' })), currency: 'â‚¹', services: services.map(ldServiceResponse) });
}
function handleLaundryGetOutlets(body) { return ok({ outlets: LD_OUTLETS.map(ldOutletResponse), total_pages: 1, current_page: 1 }); }
function handleLaundryGetOutlet(body) {
  const outlet = LD_OUTLET_BY_ID.get(num(body.laundry_outlet_id, 0));
  if (!outlet) return fail('Outlet not found');
  return ok(ldOutletResponse(outlet));
}
function handleLaundryServiceSlots(body) {
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
function handleLaundrySaveCart(body) {
  const outletId = num(body.laundry_outlet_id, 0);
  if (!LD_OUTLET_BY_ID.has(outletId)) return fail('Outlet not found');
  const cart = ldNewCart(outletId);
  if (body.service_type_id != null) cart.service_type_id = num(body.service_type_id, 1) === 6 ? 6 : 1;
  if (body.service_time_slot_detail_id != null) cart.service_time_slot_detail_id = num(body.service_time_slot_detail_id, cart.service_time_slot_detail_id);
  if (body.booking_date != null) cart.booking_date = String(body.booking_date);
  if (body.drop_location != null) cart.drop_location = String(body.drop_location);
  if (body.latitude != null) cart.latitude = String(body.latitude);
  if (body.longitude != null) cart.longitude = String(body.longitude);
  if (body.user_address_id != null) cart.user_address_id = num(body.user_address_id, 12);
  if (body.payment_method_id != null) cart.payment_method_id = num(body.payment_method_id, 1);
  if (Array.isArray(body.items)) {
    const fresh = [];
    for (const raw of body.items) {
      const svc = ldServiceById(num(raw && raw.laundry_service_id, 0));
      if (svc) {
        fresh.push({
          laundry_service_id: svc.id,
          quantity: Math.max(1, num(raw && raw.quantity, 1)),
          title: svc.title,
          price: svc.price,
          image: ldServiceImage(svc.category_id),
          category_id: svc.category_id,
        });
      }
    }
    cart.items = fresh;
  }
  ldRecalcCart(cart);
  return ok(ldBuildCartResponse(cart));
}
function handleLaundryGetCart(body) {
  const outletId = num(body.laundry_outlet_id, 0);
  const cart = ldGetCart(outletId) || ldNewCart(outletId);
  return ok(ldBuildCartResponse(cart));
}
function handleLaundryDeleteCart(body) {
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
function handleLaundryApplyPromo(body) {
  const outletId = num(body.laundry_outlet_id, 0);
  const cart = ldGetCart(outletId);
  if (!cart) return fail('Cart not found');
  const code = String(body.promo_code || '').toUpperCase();
  cart.applied_promo_code = code === 'WELCOME10' || code === 'FLAT25' ? code : '';
  ldRecalcCart(cart);
  return ok(ldBuildCartResponse(cart));
}
function handleLaundryConfirmOrder(body) {
  const outletId = num(body.laundry_outlet_id, 0);
  const cart = ldGetCart(outletId);
  if (!cart || cart.items.length === 0) return fail('Cart is empty');
  const outlet = LD_OUTLET_BY_ID.get(outletId);
  if (!outlet) return fail('Outlet not found');
  const pmtId = num(body.payment_method_id, cart.payment_method_id);
  const orderId = LAUNDRY_ORDER_SEQ++;
  const order = {
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
    otp_for_pickup: String(randomInt(1000, 9999)),
    user_confirmed_otp_for_pickup: 0,
    payment_method_id: pmtId,
    payment_status: pmtId === 3 ? 1 : 0,
    created_at: Date.now(),
    is_rated: false,
    items: cart.items.map((i, idx) => ({ id: idx + 1, laundry_service_id: i.laundry_service_id, title: i.title, price: `â‚¹${i.price.toFixed(2)}`, quantity: i.quantity, total_amount: `â‚¹${(i.price * i.quantity).toFixed(2)}`, image: i.image })),
  };
  LAUNDRY_ORDERS.push(order);
  delete LAUNDRY_CARTS[String(outletId)];
  return ok({ order_id: orderId, order_status: 1 });
}
function handleLaundryGetOrders(body) {
  const type = String(body.type || 'ONGOING').toUpperCase();
  const ongoing = [1, 4, 6, 7, 9, 10, 13, 15, 16, 17];
  const past = [2, 3, 5, 8, 11, 12, 14];
  let list = LAUNDRY_ORDERS;
  if (type === 'ONGOING') list = list.filter((o) => ongoing.includes(o.order_status));
  else if (type === 'PAST') list = list.filter((o) => past.includes(o.order_status));
  return ok(list.map((o) => {
    const outlet = LD_OUTLET_BY_ID.get(o.laundry_outlet_id) || {};
    return {
      order_id: o.order_id,
      merchant_order_id: o.merchant_order_id,
      laundry_outlet_id: o.laundry_outlet_id,
      outlet_name: outlet.full_name || 'Laundry Outlet',
      outlet_image: outlet.image || LD_DEFAULT_IMAGE,
      outlet_address: outlet.address || '',
      segment_id: o.segment_id,
      segment_name: 'Laundry',
      service_type_id: o.service_type_id,
      order_status_text: ldStatusText(o.order_status),
      order_status: o.order_status,
      total_quantity: o.total_quantity,
      items_count: o.items.length,
      final_amount_paid: String(o.final_amount_paid),
      currency: 'â‚¹',
      booking_date: o.booking_date,
      slot_time_text: o.slot_time_text,
      is_rated: o.is_rated,
    };
  }));
}
function handleLaundryGetOrderDetail(body) {
  const orderId = num(body.order_id, num(body.laundry_outlet_order_id, 0));
  const order = LAUNDRY_ORDERS.find((o) => o.order_id === orderId || o.merchant_order_id === String(body.order_id));
  if (!order) return fail('Order not found');
  ldAdvance(order);
  return ok(ldBuildOrderResponse(order));
}
function handleLaundryVerifyOtp(body) {
  const order = LAUNDRY_ORDERS.find((o) => o.order_id === num(body.order_id, 0));
  if (!order) return fail('Order not found');
  if (String(body.otp || '') !== order.otp_for_pickup) return fail('Invalid OTP');
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
function handleLaundryCancelOrder(body) {
  const order = LAUNDRY_ORDERS.find((o) => o.order_id === num(body.order_id, 0));
  if (!order) return fail('Order not found');
  if (!ldCanCancel(order)) return fail('Order cannot be cancelled');
  order.order_status = 2;
  ldPushHistory(order, 2);
  return ok({ message: 'Order cancelled' });
}
function handleLaundryRateOutlet(body) {
  const order = LAUNDRY_ORDERS.find((o) => o.order_id === num(body.order_id, 0));
  if (!order) return fail('Order not found');
  order.is_rated = true;
  return ok({ message: 'Thank you for your feedback' });
}

// â”€â”€ Route table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PUBLIC_ROUTES = new Set([
  '/api/user/configuration',
  '/api/user/otp',
  '/api/user/on-board',
  '/api/user/on-board/otp',
  '/api/user/guest/login',
  '/api/user/normal-reg',
  '/api/user/social-on-board',
  '/api/user/social-reg',
  '/api/user/forgotpassword',
  '/api/user/countryList',
  '/api/user/cms/pages',
  '/api/get-navigation-drawer',
  '/api/get-navigation-drawer-config',
  '/api/save-navigation-drawer',
]);

const routes = {
  '/api/user/configuration': handleConfiguration,
  '/api/user/otp': handleOtp,
  '/api/user/on-board': handleLogin,
  '/api/user/on-board/otp': handleLoginOtp,
  '/api/user/guest/login': handleGuestLogin,
  '/api/user/details': handleDetails,
  '/api/user/logout': handleLogout,
  '/api/user/normal-reg': handleSignup,
  '/api/user/social-on-board': handleLogin,
  '/api/user/social-reg': handleSignup,
  '/api/user/forgotpassword': (body) => ok({ message: 'Password reset link sent' }),
  '/api/user/countryList': handleCountryList,
  '/api/user/cms/pages': handleCmsPage,
  '/api/user/main-screen': handleMainScreen,
  '/api/user/areas': handleAreas,
  '/api/user/search/places': handleSearchPlaces,
  '/api/user/search/places/suggestion': handleSearchPlaces,
  '/api/user/promotion/notification': handlePromotions,
  '/api/user/cars': handleCars,
  '/api/user/rental-cars': handleRentalCars,
  '/api/user/outstation-details': handleOutstationDetails,
  '/api/user/transfer-details': handleTransferDetails,
  '/api/user/pool-details': handlePoolDetails,
  '/api/user/CheckSeats': handleCheckSeats,
  '/api/user/driver': handleDrivers,
  '/api/user/checkout': handleCheckout,
  '/api/user/checkout/apply-promo': handleApplyPromo,
  '/api/user/checkout/remove-promo': handleRemovePromo,
  '/api/user/payment-option': handlePaymentOption,
  '/api/user/checkout-payment': handleCheckoutPayment,
  '/api/user/checkout-additional-info': handleCheckoutAdditionalInfo,
  '/api/user/confirm': handleConfirm,
  '/api/user/pending-booking-approvals': handlePendingBookingApprovals,
  '/api/user/check-booking-status': handleCheckBookingStatus,
  '/api/user/booking/details': handleBookingDetails,
  '/api/user/booking/tracking': handleBookingTracking,
  '/api/user/receipt': handleReceipt,
  '/api/user/add-tip': handleAddTip,
  '/api/user/cancel-reasons': handleCancelReasons,
  '/api/user/booking/cancel': handleCancel,
  '/api/user/booking/autocancel': handleAutoCancel,
  '/api/user/booking/change_address': handleChangeAddress,
  '/api/user/booking/approval-request-change-drop-address': handleChangeAddress,
  '/api/user/increaseRideRequestArea': handleIncreaseRideRequestArea,
  '/api/user/rate-to-driver': handleRateToDriver,
  '/api/user/sos': handleSos,
  '/api/user/sos/request': handleSosRequest,
  '/api/user/sos/create': handleSosRequest,
  '/api/get-navigation-drawer': handleGetNavigationDrawer,
  '/api/get-navigation-drawer-config': handleGetNavigationDrawerConfig,
  '/api/save-navigation-drawer': handleSaveNavigationDrawer,
  '/api/user/get-delivery-package': handleDeliveryPackage,
  '/api/user/delivery/product-list': handleDeliveryProductList,
  '/api/user/delivery/category-type': handleDeliveryCategoryType,
  '/api/user/delivery/checkout': handleDeliveryCheckout,
  '/api/user/delivery/checkout-details': handleDeliveryCheckoutDetails,
  '/api/user/delivery/checkout/store-drop-details': handleDeliveryStoreDropDetails,
  '/api/user/delivery/checkout/vehicle-delivery-package': handleDeliveryVehiclePackage,
  '/api/user/confirm/delivery': handleConfirmDelivery,
  // Food ordering (Phase 7)
  '/api/user/food/store-list': (body) => handleStoreList(body),
  '/api/user/food/store-details': (body) => handleStoreDetails(body),
  '/api/user/food/product-details': (body) => foodProductDetails(body),
  '/api/user/food/cart': (body, user) => handleGetCart(user),
  '/api/user/food/cart/add': (body, user) => handleAddToCart(body, user),
  '/api/user/food/cart/update': (body, user) => handleUpdateCart(body, user),
  '/api/user/food/cart/remove': (body, user) => handleRemoveCart(body, user),
  '/api/user/food/cart/clear': (body, user) => handleClearCart(user),
  '/api/user/food/apply-promo': (body) => handleApplyFoodPromo(body),
  '/api/user/food/checkout': (body, user) => handleFoodCheckout(body, user),
  '/api/user/food/place-order': (body, user) => handlePlaceOrder(body, user),
  '/api/user/food/order-detail': (body) => handleFoodOrderDetail(body),
  '/api/user/food/orders': (body, user) => handleFoodOrderList(body, user),
  '/api/user/food/cancel': (body) => handleFoodCancel(body),
  '/api/user/food/track': (body) => handleFoodTrack(body),
  '/api/user/food/rate': (body) => handleFoodRate(body),
  '/api/user/food/reorder': (body, user) => handleFoodReorder(body, user),
  '/api/user/food/chat': (body) => handleFoodChatHistory(body),
  '/api/user/food/chat/send': (body) => handleFoodSendChat(body),
  '/api/user/favourite-business-segment': (body) => handleFavouriteBusinessSegment(body),
  '/api/user/get-favourite-business-segment': () => handleGetFavouriteBusinessSegment(),
  // Store ordering (Phase 8) â€” grocery / pharmacy / generic
  '/api/user/store/store-list': (body) => handleStoreList(body),
  '/api/user/store/store-details': (body) => handleStoreDetails(body),
  '/api/user/store/search-store-products': (body) => handleSearchStoreProducts(body),
  '/api/user/search-store-products': (body) => handleSearchStoreProducts(body),
  '/api/user/store/cart': (body, user) => handleStoreGetCart(user),
  '/api/user/store/cart/add': (body, user) => handleStoreAddToCart(body, user),
  '/api/user/store/cart/update': (body, user) => handleStoreUpdateCart(body, user),
  '/api/user/store/cart/remove': (body, user) => handleStoreRemoveCart(body, user),
  '/api/user/store/cart/clear': (body, user) => handleStoreClearCart(user),
  '/api/user/store/apply-promo': (body) => handleStoreApplyPromo(body),
  '/api/user/store/checkout': (body, user) => handleStoreCheckout(body, user),
  '/api/user/store/place-order': (body, user) => handleStorePlaceOrder(body, user),
  '/api/user/store/order-detail': (body) => handleStoreOrderDetail(body),
  '/api/user/store/orders': (body, user) => handleStoreOrderList(body, user),
  '/api/user/store/cancel': (body) => handleStoreCancel(body),
  '/api/user/store/track': (body) => handleStoreTrack(body),
  '/api/user/store/rate': (body) => handleStoreRate(body),
  '/api/user/store/reorder': (body, user) => handleStoreReorder(body, user),
  '/api/user/store/chat': (body) => handleStoreChatHistory(body),
  '/api/user/store/chat/send': (body) => handleStoreSendChat(body),
  // Handyman / Home services (Phase 9)
  '/api/user/handyman/get-categories': (body) => handleHandymanGetCategories(body),
  '/api/user/handyman/get-services': (body) => handleHandymanGetServices(body),
  '/api/user/handyman/get-providers': (body) => handleHandymanGetProviders(body),
  '/api/user/handyman/get-provider': (body) => handleHandymanGetProvider(body),
  '/api/user/handyman/service-slots': (body) => handleHandymanServiceSlots(body),
  '/api/user/handyman/save-booking-cart': (body) => handleHandymanSaveBookingCart(body),
  '/api/user/handyman/get-cart': (body) => handleHandymanGetCart(body),
  '/api/user/handyman/delete-cart': (body) => handleHandymanDeleteCart(body),
  '/api/user/handyman/apply-promo': (body) => handleHandymanApplyPromo(body),
  '/api/user/handyman/apply-remove-promo-code-web': (body) => handleHandymanApplyPromo(body),
  '/api/user/handyman/confirm-order': (body) => handleHandymanConfirmOrder(body),
  '/api/user/handyman/confirm-order-web': (body) => handleHandymanConfirmOrder(body),
  '/api/user/handyman/get-orders': (body) => handleHandymanGetOrders(body),
  '/api/user/handyman/get-order-detail': (body) => handleHandymanGetOrderDetail(body),
  '/api/user/handyman/cancel-order': (body) => handleHandymanCancelOrder(body),
  '/api/user/handyman/rate-provider': (body) => handleHandymanRateProvider(body),
  '/api/user/handyman/rate/provider': (body) => handleHandymanRateProvider(body),
  '/api/user/handyman/booking-payment': (body) => handleHandymanBookingPayment(body),
  '/api/user/handyman/bidding/create-order': (body) => handleHandymanBiddingCreateOrder(body),
  '/api/user/handyman/bidding/get-orders': (body) => handleHandymanBiddingGetOrders(body),
  '/api/user/handyman/bidding/get-order-detail': (body) => handleHandymanBiddingGetOrderDetail(body),
  '/api/user/handyman/bidding/counter-bid': (body) => handleHandymanBiddingCounterBid(body),
  '/api/user/handyman/bidding/counter-bid-order': (body) => handleHandymanBiddingCounterBid(body),
  '/api/user/handyman/bidding/accept-order': (body) => handleHandymanBiddingAcceptOrder(body),
  '/api/user/handyman/bidding/cancel-delete': (body) => handleHandymanBiddingCancelDelete(body),
  '/api/user/handyman/bidding/cancel-or-delete-order': (body) => handleHandymanBiddingCancelDelete(body),
  // Laundry (Phase 10)
  '/api/user/laundry/get-categories': (body) => handleLaundryGetCategories(body),
  '/api/user/laundry/get-services': (body) => handleLaundryGetServices(body),
  '/api/user/laundry/get-outlets': (body) => handleLaundryGetOutlets(body),
  '/api/user/laundry/get-outlet': (body) => handleLaundryGetOutlet(body),
  '/api/user/laundry/service-slots': (body) => handleLaundryServiceSlots(body),
  '/api/user/laundry/save-cart': (body) => handleLaundrySaveCart(body),
  '/api/user/laundry/get-cart': (body) => handleLaundryGetCart(body),
  '/api/user/laundry/delete-cart': (body) => handleLaundryDeleteCart(body),
  '/api/user/laundry/apply-promo': (body) => handleLaundryApplyPromo(body),
  '/api/user/laundry/apply-remove-promo-code-web': (body) => handleLaundryApplyPromo(body),
  '/api/user/laundry/confirm-order': (body) => handleLaundryConfirmOrder(body),
  '/api/user/laundry/confirm-order-web': (body) => handleLaundryConfirmOrder(body),
  '/api/user/laundry/get-orders': (body) => handleLaundryGetOrders(body),
  '/api/user/laundry/get-order-detail': (body) => handleLaundryGetOrderDetail(body),
  '/api/user/laundry/verify-otp': (body) => handleLaundryVerifyOtp(body),
  '/api/user/laundry/cancel-order': (body) => handleLaundryCancelOrder(body),
  '/api/user/laundry/rate-outlet': (body) => handleLaundryRateOutlet(body),
  '/api/user/laundry/rate': (body) => handleLaundryRateOutlet(body),
};

// â”€â”€ HTTP server â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, publicKey, secretKey, locale');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Health check
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', port: PORT }));
    return;
  }

  // Only POST is expected (all Laravel routes are POST)
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(fail('Method not allowed')));
    return;
  }

  const handler = routes[pathname];
  if (!handler) {
    console.log(`[404] ${pathname}`);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(fail(`Not found: ${pathname}`)));
    return;
  }

  try {
    const body = await readBody(req);
    const user = PUBLIC_ROUTES.has(pathname) ? null : getUserFromRequest(req);
    // Handlers may be sync (in-memory fallback) or async (Postgres mode);
    // `await` resolves both.
    const result = await handler(body, user);
    const json = JSON.stringify(result);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) });
    res.end(json);
    console.log(`[200] ${pathname}`);
  } catch (err) {
    console.error(`[500] ${pathname}`, err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(fail(err.message || 'Internal error')));
  }
});

server.listen(PORT, () => {
  console.log(`\n  Fixcycle API server running at http://localhost:${PORT}/api`);
  console.log(`  Health check: http://localhost:${PORT}/health\n`);
});
