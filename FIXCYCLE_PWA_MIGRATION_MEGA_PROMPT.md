# FIXCYCLE PWA MIGRATION MEGA PROMPT

**Document type:** Master implementation brief for a coding agent  
**Product:** Fixcycle (multi-service super-app currently shipped as Android apps + Laravel backend)  
**Goal:** Build an exact web replica as an installable Progressive Web App (PWA) for iOS and Android, plus a PostgreSQL-backed API layer that the PWA consumes.  
**LencoPay:** Do not implement LencoPay until the final phase. Cash, wallet, and card/online placeholders may exist earlier. LencoPay is Phase 16.  
**Emojis:** Forbidden in UI, copy, commits, README, comments, and icons. Use professional SVG icons only.  
**Pictures:** Do not invent photos, logos, banners, vehicle images, store photos, or people images. At the end of every phase, stop and request the exact image list from the product owner. They will drop files into a folder. Then continue.

---

## 0. How the coding agent must use this document

1. Read this entire file before writing any code.
2. Execute **one phase at a time**. Do not skip ahead. Do not start Phase N+1 until Phase N is complete, verified, and the owner has supplied any requested images.
3. After each phase:
   - Summarize what was built.
   - List files created or changed.
   - List API endpoints wired.
   - List screens that now exist.
   - List known gaps.
   - Output an **IMAGE REQUEST BLOCK** (see Section 8).
   - Wait for images before polishing visual assets for that phase.
4. Treat the existing Laravel codebase in this repository as the **source of truth for behavior**. Treat `Fixcycle Source Codes Android.zip` as the **source of truth for screens, navigation, copy, and interaction**. If the zip is not extracted, extract it into `android-source/` (do not commit the zip contents wholesale).
5. Replica means: same flows, same statuses, same fields, same business rules, same segment structure, same home-screen holders, same drawer items, same booking/order lifecycles. Visual language may be a clean modern web interpretation of the Android UI, but information architecture and feature set must match.
6. Slight improvements are allowed only when they do not change business rules. Allowed examples: better form validation, keyboard-friendly inputs, loading skeletons, accessible contrast, safer token storage, typed API client, empty states, retry on network failure. Forbidden examples: removing a segment, inventing a new payment flow before Phase 16, changing booking status codes, skipping OTP where the API requires it.
7. Do not rewrite the entire Laravel backend from scratch. That would destroy years of domain logic (400+ models, 615 migrations, 2000+ controllers). Keep Laravel as the API. Add PostgreSQL. Build the PWA as a new frontend that talks to the existing APIs.
8. Work in a new directory: `pwa/` at the repo root for the Next.js apps. Backend changes stay in the existing Laravel tree.
9. No emojis. Anywhere.
10. When a referenced PHP file is missing (this repo has some route targets that do not exist on disk, e.g. `Api\FoodController.php` and `Api\DeliveryController.php`), search the Android zip, `routes/api.php`, related traits, and sibling controllers. Reconstruct the client against the live API contract. If an endpoint 404s, document it and implement the UI against the nearest working sibling endpoint. Do not silently drop the feature.

---

## 1. What this system actually is

Fixcycle is **not** a single-purpose Android app. It repository is a **Laravel 9 / PHP 8.1 multi-tenant, multi-segment super-app backend** that already powers:

- Native Android user app
- Native Android driver / provider app
- Native Android business-segment (store / restaurant) app
- Merchant admin (already web, Blade)
- Additional web portals: taxi company, franchise, hotel, corporate, driver agency, agent, laundry outlet, handyman store

The PWA migration is the **customer-facing and provider-facing Android experience**, rebuilt as installable web apps, hosted on the public web, addable to the iOS and Android home screen.

### 1.1 Segment groups (from `database/seeds/SegmentGroupsTableSeeder.php`)

| ID | Group | Meaning |
|----|--------|---------|
| 1 | Vehicle Based | Service completed by a vehicle (taxi, delivery, food, grocery) |
| 2 | Helper Based | Service completed by a person (handyman, salon, plumber, towing) |
| 3 | Pooling Based | Carpooling |
| 4 | Bus Booking Based | Intercity / bus tickets |

### 1.2 Seeded segments (from `database/seeds/SegmentsTableSeeder.php`)

Live merchants may have more segments than the seeder. The PWA must render **whatever the merchant API returns**, not a hardcoded list.

| Slug | Name | Group | App sub-group |
|------|------|-------|---------------|
| TAXI | Taxi | Vehicle | 3 |
| DELIVERY | Delivery | Vehicle | 4 |
| FOOD | Food | Vehicle | 1 |
| GROCERY | Grocery | Vehicle | 2 |
| TOWING | Towing | Helper | null |
| SALON | Salon | Helper | null |
| PLUMBER | Plumber | Helper | null |

Also present in models, admin, and home-screen logic (must be supported if the merchant enables them):

- Handyman (helper jobs, time slots, cart, bidding)
- Laundry outlet
- Pharmacy (home screen treats `PHARMACY` separately from grocery stores)
- Bus booking
- Carpooling
- Handyman store
- InDrive / bidding taxi
- Rental, Transfer, Outstation, Pool (taxi service types)

### 1.3 Taxi service types (from `database/seeds/ServiceTypesTableSeeder.php`)

| Segment | Service name | `type` |
|---------|--------------|--------|
| Taxi | Normal | 1 |
| Taxi | Rental | 2 |
| Taxi | Transfer | 3 |
| Taxi | Outstation | 4 |
| Taxi | Pool | 5 |
| Delivery | Normal Delivery | 1 |
| Food | Normal Food | 1 |
| Grocery | Normal Grocery | 1 |
| Towing | Normal Towing | 1 |
| Salon | Normal Salon | 1 |

### 1.4 Home screen holders (from `database/seeds/HomeScreenHoldersTableSeeder.php`)

The user home is a **configurable cell list**, not a static page. Render cells in the order the API returns.

- `BANNER`
- `RECENTS`
- `ALL_SERVICES`
- `HORIZONTAL_ALL_SERVICES`
- `RECOMMENDED_SERVICE`
- `POPULAR_RESTAURANT`
- `POPULAR_STORE`
- `BOTTOM_BANNERS`
- `ADDMONEY`
- `ALL_SERVICES_V2`

`MainScreenController` also builds popular pharmacy, popular laundry, taxi categories mixed into all-services, and an active handyman booking holder. Support all of them.

### 1.5 User navigation drawer (from `database/seeds/AppNavigationDrawersTableSeeder.php`)

- Trip History
- Favourite Driver
- Price Card
- Wallet Activity
- Emergency Contacts
- Child List (family members)
- Card List
- Terms And Condition
- Refer And Earn
- Promotion Views
- Logout
- Contact Us
- About Us
- Privacy Policy
- Language
- Customer Support
- Reward Points
- Refund Policy
- Live Chat

The live drawer is merchant-configurable via `get-navigation-drawer`. Render API data. Use the seeder only as the default information architecture.

### 1.6 Portals that already exist on web (do not rebuild in early phases)

Merchant admin, taxi company, franchise, hotel, corporate, driver agency, agent, laundry outlet login, handyman store login. These stay on Laravel Blade unless a later optional phase is explicitly started. The PWA work is:

1. User super-app PWA
2. Driver / provider PWA
3. Store / restaurant PWA (business-segment)
4. Shared design system, PWA install, push, maps
5. PostgreSQL on the backend
6. LencoPay last

---

## 2. Architecture decision (locked)

### 2.1 Keep Laravel. Do not rewrite domain logic.

The backend already implements:

- Multi-tenant merchant resolution (`publicKey` + `secretKey`, or Passport token)
- Booking dispatch, radius search, ride-later cron, OTP, ratings
- Food / grocery orders, store accept/reject, driver pickup OTP
- Handyman cart, time slots, bidding
- Wallets, cashout, referrals, rewards, SOS, chat, documents
- 100+ payment gateways (ignore all of them except cash, wallet, card placeholder, until Phase 16 LencoPay)

Rebuilding this in a new Node API would take months and would not be an exact replica.

### 2.2 New frontend: Next.js PWA

Create:

```
pwa/
  apps/
    user/          # customer super-app (primary)
    driver/        # driver / handyman / delivery agent
    store/         # restaurant / grocery / pharmacy outlet
  packages/
    ui/            # design system, SVG icon set, tokens
    api-client/    # typed client for Laravel APIs
    maps/          # Google Maps wrapper
    pwa-core/      # service worker, manifest helpers, install prompt
    config/        # env, merchant keys, locale
```

Monorepo with pnpm workspaces or npm workspaces. TypeScript everywhere.

### 2.3 Database: PostgreSQL

Current default is MySQL (`config/database.php`). Laravel already has a `pgsql` connection. Phase 1 switches local/dev to PostgreSQL and documents production cutover.

Do **not** dump 615 migrations and rewrite them by hand in one sitting. Strategy:

1. Stand up PostgreSQL.
2. Point Laravel `DB_CONNECTION=pgsql`.
3. Fix PostgreSQL incompatibilities as they appear (backticks, `UNSIGNED`, `JSON` vs `JSONB`, `GROUP BY`, boolean `0/1`, `STRICT` mode differences, `ON UPDATE CURRENT_TIMESTAMP`, `enum`, fulltext).
4. Prefer a schema dump + data migration script over a big-bang rewrite of every migration file.
5. Keep Eloquent models unchanged unless a query is PostgreSQL-illegal.

### 2.4 Auth

- User PWA: Laravel Passport guard `api` (users)
- Driver PWA: Passport guard `api-driver`
- Store PWA: Passport guard `business-segment-api`
- Headers always include merchant `publicKey`, `secretKey`, and `locale`
- Store tokens in memory + `httpOnly` cookie if a BFF is added; otherwise encrypted local storage with a documented threat model. Prefer a Next.js Route Handler BFF that holds the refresh token in an httpOnly cookie. That is an allowed security improvement.

### 2.5 Realtime

Android uses OneSignal + polling of booking/order status + driver location posts.

PWA must:

- Poll `check-booking-status` / booking details / order details on active trips (same as app).
- Post user/driver location on an interval while a trip is active.
- Add Web Push (OneSignal Web SDK already exists in this repo: `OneSignalSDKWorker.js`) for ride accepted, driver arrived, order updates.
- Optional later: WebSocket. Do not block replica on it.

### 2.6 Maps

Use Google Maps JavaScript API. The backend already has `google_key` on `BookingConfiguration`, plus `/api/map-load`, `/api/static-map-load`, `/api/user/direction-data`, `/api/user/search/places`, `/api/user/search/places/suggestion`.

Do not hardcode map keys in the client if the backend can mint or proxy them. If the Android app uses a client key, replicate that pattern via env.

### 2.7 Hosting shape

- PWA: HTTPS only (required for install and service worker). Vercel, Netlify, or Nginx static + Node.
- Laravel API: existing host, CORS already `Access-Control-Allow-Origin: *` in `routes/api.php`.
- Apple: `apple-app-site-association` already exists in this repo. Extend it for PWA / universal links as needed.
- Android: Digital Asset Links (`assetlinks.json`) for TWA if later wrapped. PWA install still works without TWA.

---

## 3. Locked tech stack

### Frontend

- Next.js (App Router) + TypeScript
- Tailwind CSS + CSS variables for merchant theme colors (`bg_color_primary`, `bg_color_secondary`, `text_color_primary`, `text_color_secondary` from website/application config)
- Framer Motion only if it does not fight PWA performance. Prefer CSS transitions.
- TanStack Query for server state
- Zustand or similar for ephemeral UI state
- React Hook Form + Zod
- Google Maps JS
- next-pwa or Serwist for service worker
- Web App Manifest + Apple meta tags
- lucide-react is acceptable only if every icon is an SVG component. Do not use emoji fonts. Prefer a custom `packages/ui/icons` set so each **service slug** has a dedicated SVG (taxi, food, grocery, delivery, plumber, salon, towing, laundry, bus, carpool, pharmacy, handyman).

### Backend (existing)

- Laravel 9, PHP 8.1
- Laravel Passport
- Spatie permission (admin only)
- Eloquent
- OneSignal
- AWS S3 per merchant (`ApiS3Middleware`, `setS3Config`)
- Redis/Predis if already configured for queues/cache

### New backend work

- PostgreSQL
- CORS tightened for the PWA origin (improvement: stop using `*` once the PWA origin is known)
- LencoPay completion in Phase 16 only
- Web push registration endpoint if missing
- Optional Next.js BFF

### Payments until Phase 16

Show these methods if the API returns them:

- Cash (`payment_method_id` 1, slug `CASH`)
- Card (`CARD`) as UI only unless already working
- Wallet (`WALLET`)
- Online Payment (`ONLINE`) as a disabled or “coming in payments phase” state except for wallet top-up via existing generic `/user/online/make-payment` if needed for testing

Do not integrate Stripe, M-Pesa, Flutterwave, etc. in the PWA. Do not start LencoPay until Phase 16.

---

## 4. API contract the PWA must obey

Source: `documents/multi-service_technical_docs.md` and `routes/api.php`.

### 4.1 Base

All app APIs are under `/api`.

### 4.2 Headers

Public (pre-login):

```
publicKey: <merchant public key>
secretKey: <merchant secret key>
locale: en
Content-Type: application/json
```

Authenticated user:

```
Authorization: Bearer <passport token>
locale: en
```

Authenticated driver: same, using driver token. Store: business-segment token.

Middleware `ApiMiddleware` / `DriverApi` injects `merchant_id` and config flags into the request. The PWA does not send `merchant_id` unless a specific endpoint requires it.

### 4.3 Envelope

Success:

```json
{ "version": "1.5", "result": "1", "message": "...", "data": {} }
```

Failure:

```json
{ "version": "1.5", "result": "0", "message": "..." }
```

Pending:

```json
{ "version": "1.5", "result": "2", "message": "..." }
```

`api-client` must parse `result` as string `"1"` / `"0"` / `"2"`. Never assume HTTP 401 is the only failure mode. Many endpoints return HTTP 200 with `result: "0"`.

### 4.4 User auth endpoints (prefix `/api/user`)

Merchant middleware (no user token):

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/configuration` | App config, theme, flags |
| POST | `/countryList` | Countries / dial codes |
| POST | `/otp` | Send OTP |
| POST | `/on-board` | Login |
| POST | `/on-board/otp` | Login via OTP |
| POST | `/on-board/otp-validate` | Validate OTP |
| POST | `/normal-reg` | Signup |
| POST | `/social-reg` | Social signup |
| POST | `/social-on-board` | Social login |
| POST | `/forgotpassword` | Forgot password |
| POST | `/guest/login` | Guest |
| POST | `/cms/pages` | CMS |
| POST | `/faq` | FAQ |
| POST | `/getString` | Language strings |
| POST | `/website/home-screen` | Marketing site data (optional) |
| POST | `/carsWithoutLogin` | Vehicles without login |

Also keep old aliases working in the client if the Android app still uses `/login`, `/signup`.

Auth:api + validuser (token required): too many to paste twice. The agent must generate an endpoint inventory from `routes/api.php` lines 900–1476. Critical ones:

- Home: `/cars`, `/driver`, `/homescree/driver`, `/areas`
- Booking: `/checkout`, `/checkout-additional-info`, `/checkout-payment`, `/confirm`, `/in-drive-confirm`, `/booking/details`, `/booking/tracking`, `/booking/cancel`, `/booking/change_address`, `/receipt`, `/rate-to-driver`, `/booking/active`, `/booking/history`, `/booking/history/detail`, `/add-tip`, `/payment-option`, `/checkout/apply-promo`, `/checkout/remove-promo`
- Delivery: `/delivery/checkout`, `/delivery/checkout-details`, `/confirm/delivery`, `/delivery/product-list`
- Handyman: `/handyman/*` and `/handyman/bidding/*`
- Wallet: `/wallet/transaction`, `/wallet/addMoney`, `/transfer-money`
- SOS: `/sos`, `/sos/create`, `/sos/distory`, `/sos/request`, `/sos-request`
- Profile: `/details`, `/UserDetail`, `/edit-profile`, `/change-password`, `/out-board`, `/account-delete`
- Cards, family, favourites, locations, documents, cashout, subscriptions, rewards, chat, customer support

Main screen segments: `MainScreenController@mainScreenSegments` exists. Find the route (search `MainScreenController` in `routes/api.php` and related files). If unrouted, add a Laravel route in Phase 3: `POST /api/user/main-screen` -> `Api\MainScreenController@mainScreenSegments`. That is an allowed backend addition because the Android home depends on it.

### 4.5 Driver endpoints (prefix `/api/driver`)

Registration steps 1–5, login, OTP, documents, vehicles, configuration.

Authenticated (`auth:api-driver`):

- `/get-main-screen-config`
- `/get-online-work-config`, `/save-online-work-config`
- `/get-segment-list`, `/get-enrolled-segments`, `/save-segment-config`
- `/location`
- `/booking-order-info`
- `/booking-order-accept-reject`
- `/arrived-at-pickup`
- `/booking-order-picked`
- `/booking/end`
- `/deliver-order`
- `/cancel-booking-order`
- `/complete-booking-order`
- `/get-active-booking-order`
- `/get-past-booking-order`
- `/handyman/*`
- wallet, cashout, earnings, subscriptions, gallery, bus-booking, laundry-outlet

### 4.6 Store endpoints (prefix `/api/business-segment`)

Login, orders, accept/reject/process, products, inventory, drivers assign, wallet, chat, cashout, membership.

### 4.7 Generic

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/check-booking-status` | Poll booking |
| POST | `/api/map-load` | Map |
| POST | `/api/country-list` | Countries |
| POST | `/api/get-navigation-drawer` | Drawer |
| POST | `/api/payment-gateway-list` | Gateways (Phase 16) |

---

## 5. Status machines (must be exact)

### 5.1 Taxi / delivery booking (`booking_status`)

| Code | Meaning |
|------|---------|
| 1000 | New InDrive booking |
| 1001 | New booking |
| 1002 | Accepted by driver |
| 1012 | Partial accepted |
| 1003 | Arrived at pickup |
| 1004 | Ride started |
| 1005 | Ride completed |
| 1006 | Cancelled by user |
| 1007 | Cancelled by driver |
| 1008 | Cancelled by admin |
| 1016 | Auto cancelled |
| 1018 | Expired by cron |

`booking_type`: `1` ride now, `2` ride later.

### 5.2 Food / grocery / store order (`order_status`) from `OrderTrait`

| Code | Meaning |
|------|---------|
| 1 | Placed / new |
| 3 | Rejected by store |
| 5 | Cancelled by driver |
| 6 | Accepted by driver |
| 7 | Arrived at pickup |
| 8 | Cancelled by store |
| 9 | In process (store preparing) |
| 10 | Picked |
| 11 | Delivered |
| 12 | Auto expired |

UI must show a stepper that matches these codes. Do not invent extra statuses.

### 5.3 Driver document status

0 pending, 1 uploaded, 2 approved, 3 rejected, 4 expired.

### 5.4 Driver signup flow status

1 basic info, 2 more info, 3 segment group, 4 personal document, 5 vehicle, 6 vehicle document, 7 segment + service, 8 availability mode, 9 approved.

### 5.5 Booking request driver status

1 sending, 2 accepted, 3 rejected, 4 cancelled.

---

## 6. Design system (no emojis, SVG only)

### 6.1 Visual rules

- Mobile-first. Max content width ~430px centered on desktop, with a subtle device frame optional on large screens. This is a phone app replica, not a wide marketing site.
- Bottom tab bar on user app: Home, Services or Orders, Wallet, Account (match Android if it uses a drawer-only pattern; if Android uses a drawer + home, replicate that: hamburger + home cells + optional bottom nav for History / Wallet / Profile).
- Safe-area insets for iOS notch and Android gesture bar (`env(safe-area-inset-*)`).
- Touch targets minimum 44px.
- Type: Inter or the merchant’s configured font. Fallback system UI.
- Colors: start with a professional Fixcycle palette (deep navy, clean white, one accent). Override from `/configuration` when merchant theme exists.
- Elevation: light shadows, 12–16px corner radius on cards.
- Maps: full-bleed on ride screens, bottom sheet for vehicle list (Android pattern).
- Never use emoji as icons. Never use emoji in empty states. Never use emoji in notifications.

### 6.2 Icon set (mandatory SVG per service)

Create `packages/ui/icons/services/`:

- `taxi.svg`
- `delivery.svg`
- `food.svg`
- `grocery.svg`
- `pharmacy.svg`
- `towing.svg`
- `salon.svg`
- `plumber.svg`
- `handyman.svg`
- `laundry.svg`
- `bus.svg`
- `carpool.svg`
- `rental.svg`
- `outstation.svg`
- `pool.svg`

Plus UI icons: back, menu, loc, dest, wallet, card, cash, sos, chat, star, clock, filter, search, close, check, chevron, phone, share, promo, history, user, settings, logout, bell, plus, minus, trash, camera, document, language, support.

If a real brand logo or photo is required, request it. Do not generate fake store photos.

### 6.3 Copy

Pull strings from `/api/user/getString` and `/get-key-value-strings` when logged in. Hardcode English only as fallback. Support `locale` header.

---

## 7. PWA install requirements (iOS and Android)

This is the product owner’s definition of “web publication that becomes an app on the home screen.”

### 7.1 Manifest (`manifest.webmanifest`)

- `name`, `short_name` (Fixcycle, or merchant app name from configuration)
- `start_url` `/`
- `display` `standalone`
- `display_override` `["standalone", "minimal-ui"]`
- `background_color`, `theme_color`
- `orientation` `portrait`
- `scope` `/`
- Icons: 192, 512 PNG **maskable** and any-purpose. Request these PNGs from the owner. Until then use a simple SVG-derived PNG placeholder labeled TEMP.
- `id` stable URL
- `categories` `["navigation", "lifestyle"]`
- `shortcuts` for “Book a ride”, “Orders”, “Wallet” once those routes exist

### 7.2 iOS

- `apple-mobile-web-app-capable` yes
- `apple-mobile-web-app-status-bar-style` default or black-translucent
- `apple-touch-icon` 180x180
- Splash screens for common iPhone sizes (request images)
- Add-to-home-screen instruction sheet (first visit, dismissible): explain Share button -> Add to Home Screen. No emoji in that sheet.
- `apple-app-site-association` keep working

### 7.3 Android

- Service worker with precache of shell, runtime cache for images, network-first for APIs
- `beforeinstallprompt` custom install banner
- Maskable icons
- Offline fallback page: “You are offline. Open an active trip if cached.”
- Optional later: Trusted Web Activity. Not required for replica.

### 7.4 Permissions

- Geolocation (required)
- Notifications (required after login)
- Camera only for document upload / profile photo (getUserMedia or file input). Prefer file input for iOS reliability.

---

## 8. Image request protocol (every phase)

At the end of every phase, print this block and stop for assets:

```
IMAGE REQUEST — PHASE <N> — <TITLE>
Place files in: pwa/apps/<app>/public/assets/phase-<N>/
Naming: kebab-case, no spaces.

Required now:
1. <filename> — <usage> — <recommended size>
2. ...

Optional:
- ...

Until these arrive, the UI must use SVG icons and solid-color placeholders. Do not download random stock photos. Do not generate fake people.
```

The owner will paste files into the folder. Then the agent wires `next/image` or `<img>` to those paths.

---

## 9. Phase completion gate

A phase is done only when:

1. Screens listed in that phase exist and are reachable.
2. They call real Laravel endpoints (or a clearly marked mock that matches the envelope, only if the endpoint is missing; replace mock before the phase is closed).
3. No emojis.
4. SVG icons for all chrome and services touched in the phase.
5. Mobile layout works at 360px, 390px, 430px.
6. Typecheck passes.
7. README section for the phase updated in `pwa/README.md`.
8. IMAGE REQUEST BLOCK emitted.
9. Booking/order status codes unchanged.

---

# PHASE 1 — Foundation: monorepo, PWA shell, PostgreSQL, API client, design tokens

**Objective:** Empty but installable PWA shell, talking to Laravel configuration endpoint, database on PostgreSQL, design system stub.

### Backend

1. Add `.env.example` keys: `DB_CONNECTION=pgsql`, `DB_PORT=5432`, PWA origin, Google maps key, OneSignal web key (unused until later).
2. Confirm `config/database.php` `pgsql` connection. Set `charset` utf8, `sslmode` prefer.
3. Create `database/pgsql/` notes: known MySQL-only SQL to hunt (`unsigned`, `enum`, `json` indexes, `GROUP BY` only-full-group-by, boolean tinyint).
4. Script `scripts/mysql-to-pgsql.md` describing dump/transform/restore. Do not run a destructive production migration. Local empty schema via `php artisan migrate` against pgsql is enough for Phase 1. Fix the first failing migrations until `migrate` completes on a blank PostgreSQL database. If a migration is hopeless, rewrite that single file for pgsql compatibility. Log every change.
5. Add CORS config for the PWA origin (improvement). Keep old `*` as fallback behind `CORS_ALLOW_ALL=true` for native apps.
6. If `POST /api/user/main-screen` is missing, add it to `routes/api.php` pointing at `MainScreenController@mainScreenSegments`.

### Frontend

1. Scaffold `pwa/` monorepo.
2. User app routes: `/` splash, `/install` (how to add to home screen), `/dev/status` (env + API ping).
3. Manifest, service worker, Apple meta, offline page.
4. `api-client`: fetch wrapper, merchant headers, envelope parser, token store.
5. Call `POST /api/user/configuration` on splash. Show merchant name if returned. Handle `result: "0"`.
6. Design tokens, layout chrome, SVG icon sprite, no real photos.
7. Geolocation permission helper.
8. i18n stub with English fallback.

### Improvements allowed

- Typed API errors
- Strict CSP in next.config (do not break Google Maps; add maps domains when maps land in Phase 4)
- Health check page

### Do not do yet

Auth screens beyond a button that routes to `/login` placeholder. No LencoPay. No maps booking.

### IMAGE REQUEST — PHASE 1

1. `logo-horizontal.png` — splash and header — 512x128 or SVG
2. `logo-mark.png` — app icon source — 1024x1024
3. `icon-192.png` — PWA icon
4. `icon-512.png` — PWA icon maskable
5. `apple-touch-icon.png` — 180x180
6. Splash backgrounds if a custom splash photo is required; otherwise SVG + color is fine

---

# PHASE 2 — User authentication and onboarding

**Objective:** Exact replica of Android user login, OTP, signup, social, forgot password, guest, CMS pages.

### Screens

1. Splash (from Phase 1, now waits on configuration)
2. Language select if configuration says multiple locales
3. Welcome / on-board
4. Login (phone/email per `login_type` from configuration)
5. OTP entry with resend countdown
6. Signup: first name, last name, phone, email, password, referral, country, gender/smoker if flags enabled, CPF if `user_cpf_enable`
7. Social login buttons only if configuration enables them. Do not fake Google/Apple. Wire later if keys exist. If keys missing, hide buttons.
8. Forgot password
9. Terms / privacy webview from `/cms/pages`
10. Guest login if enabled
11. Post-login profile bootstrap: `POST /details`

### Endpoints

Use the table in Section 4.4. Prefer new paths (`/on-board`, `/normal-reg`) with fallback to `/login`, `/signup`.

### Validation

Mirror `Account\UserController` rules. Phone formatting via country dial code from `/countryList`.

### Session

Save Passport token, user object, merchant config. On 401 or `result: "0"` unauthorised, clear and return to login.

### Improvements

- Password visibility toggle (SVG eye)
- Autofill / one-time-code for OTP (`autocomplete="one-time-code"`)
- Disable submit until valid
- Do not store password

### IMAGE REQUEST — PHASE 2

1. `onboarding-1.png` `onboarding-2.png` `onboarding-3.png` if Android has a carousel
2. Country flag images: **do not** download a 200-flag pack unless the owner provides one. Use a simple SVG globe + ISO code until flags are provided.
3. Social brand SVGs (Google, Apple, Facebook) only if those logins are enabled. Official simple icons, not photos.

---

# PHASE 3 — Super-app home, location, drawer, banners, service grid

**Objective:** The Android home screen replica: location bar, banners, all services, popular restaurants/stores, add money holder, drawer.

### Screens

1. Home
2. Location picker / search places
3. Service list (all services)
4. Side drawer
5. Banner landing (segment or business-segment or URL)
6. No-service-area state
7. Notifications list (`/promotion/notification`)

### Data

- `POST /api/user/main-screen` or `MainScreenController@mainScreenSegments` with `latitude`, `longitude`
- Fallback: `/api/user/cars` for vehicle home
- Drawer: `/api/get-navigation-drawer`
- Places: `/api/user/search/places`, `/search/places/suggestion`
- Area: `/api/user/areas`, `/api/user/check-droplocation/area`

### Behavior

- Ask location on first home view. If denied, show manual city/area picker.
- Render holders dynamically. Unknown `cell_title` should still render as a generic card row, not crash.
- Each service tile: SVG by slug + API `segment_icon` if the API returns a URL (that is a server image, not an owner photo request).
- Coming soon segments: visible, not tappable, dimmed.
- Add money holder shows wallet balance; button goes to wallet (Phase 12). Until Phase 12, route to a stub.
- Popular restaurants/stores/pharmacy/laundry: cards with logo from API, open/closed, rating, distance, favourite heart (SVG).

### Improvements

- Skeleton loaders matching cell types
- Pull to refresh
- Cache last home payload for offline shell

### IMAGE REQUEST — PHASE 3

1. Default banner placeholder if API banners fail — 1000x500
2. Empty-home illustration (SVG preferred)
3. Any custom category artwork the brand uses beyond segment icons

---

# PHASE 4 — Taxi Normal: map, estimate, vehicles, checkout, confirm, tracking, receipt, rating

**Objective:** End-to-end ride-now for service type Normal. This is the core of the replica.

### Screens

1. Ride map: pickup pin, drop search, current location
2. Stop points if configuration allows extra stops
3. Vehicle list bottom sheet from `POST /api/user/cars` (`HomeController@userHomeScreen`)
4. Nearby drivers `POST /api/user/driver` or `/homescree/driver`
5. Checkout estimate `POST /api/user/checkout`
6. Additional info: notes, baby seat, wheelchair, gender match, `CheckSeats`
7. Payment method select `POST /api/user/payment-option` (cash and wallet only for now)
8. Promo apply/remove
9. Confirm `POST /api/user/confirm`
10. Searching for driver (pulse animation, cancel)
11. Driver assigned: photo from API, plate, OTP, call, chat, SOS
12. Arrived / started / completed states from polling
13. Change drop `booking/change_address`
14. Receipt `POST /api/user/receipt`
15. Rate driver
16. Tip

### Tracking

- Poll `/api/user/booking/details` and `/api/user/booking/tracking` and `/api/check-booking-status`
- Draw polyline from API `poly_points`
- Driver marker from location payload
- Ride OTP display when merchant requires it

### Cancel

- Reasons from `/api/user/cancel-reasons`
- `POST /api/user/booking/cancel`
- Auto cancel `booking/autocancel`

### Status UI mapping

Use Section 5.1 exactly. Searching = 1001, accepted = 1002, arrived = 1003, trip = 1004, done = 1005.

### Improvements

- Bottom sheet snap points
- Keep screen awake during active trip (`wake lock` API) — allowed improvement
- Share trip link if Android has `share/ride` (`routes/web.php` already has `share/ride/{type}/{locale}/{code}`)

### IMAGE REQUEST — PHASE 4

1. Pickup pin, drop pin if custom (otherwise SVG)
2. Default vehicle side image if API vehicle image missing
3. Default driver avatar silhouette (SVG)
4. Receipt header logo (reuse Phase 1 logo)

---

# PHASE 5 — Taxi variants: Rental, Outstation, Transfer, Pool, InDrive, Ride later

**Objective:** Every taxi service type the Android app supports.

### Rental

- `POST /api/user/rental-cars`
- Package hours from service packages
- Same checkout/confirm pipeline with rental fields

### Outstation

- `POST /api/user/outstation-details` (`Services\OutstationController@outstationDetail`)
- Round trip / one way, dates, packages

### Transfer

- Airport / hourly transfer fields from `Services\TransferController` behavior. Read that controller and match payload.

### Pool

- Seat count, `CheckSeats`, pool list behavior from `Services\PoolController`

### InDrive

- User offers a fare
- `POST /api/user/in-drive-confirm`
- Driver counter: user sees incoming offers (poll booking details)
- Status 1000

### Ride later

- Date time picker, timezone from area
- `booking_type = 2`
- Pending list `pending-booking-approvals` for corporate if enabled

### Increase radius

- `POST /api/user/increaseRideRequestArea` while searching

### IMAGE REQUEST — PHASE 5

1. Service-type header images for rental/outstation/pool if the Android app has them
2. InDrive bid illustration (SVG ok)

---

# PHASE 6 — Parcel / courier delivery

**Objective:** Vehicle-based delivery replica.

### Screens

1. Delivery home (packages, product types)
2. Multi-drop checkout
3. Package size / product list `POST /api/user/delivery/product-list`
4. Category type `delivery/category-type`
5. `delivery/checkout`, `checkout-details`, `store-drop-details`, `vehicle-delivery-package`
6. Confirm `POST /api/user/confirm/delivery`
7. Tracking (reuse booking tracker with delivery copy)
8. Pickup OTP if API returns it

Read `Delivery\ApiController` and any remaining delivery trait if `Api\DeliveryController` is missing. Reconstruct payloads from Android zip network layer (search Retrofit/OkHttp service interfaces).

### IMAGE REQUEST — PHASE 6

1. Box / envelope SVGs (you may draw these; no photo required)
2. Proof-of-delivery placeholder

---

# PHASE 7 — Food ordering

**Objective:** Restaurant browse, menu, cart, place order, track, rate. Exact order status stepper.

### Screens

1. Food home: banners, popular restaurants, cuisines/styles if API returns them
2. Restaurant profile: hours, rating, favourite, open/closed
3. Menu: categories, products, variants, options, availability slabs
4. Product detail
5. Cart
6. Checkout: address, delivery vs self-pickup (`delivery_mode`), promo, payment cash/wallet
7. Place order
8. Live order tracker (statuses 1, 6, 9, 7, 10, 11, plus reject/cancel)
9. Reorder from history
10. Chat with store `chat/send_message_to_store`

### Endpoints

`FoodController` is referenced by routes but the file may be missing in this tree. Recover by:

1. Searching Android API paths containing `food`, `store`, `product`, `cart`, `order`
2. Reading `app/Traits/OrderTrait.php`, `app/Http/Controllers/Api/OrderController.php`, `BusinessSegment` models
3. Adding thin Laravel controllers only if the Android app calls endpoints that are not in `routes/api.php`

Minimum user order APIs to locate or restore:

- List stores by segment + lat/lng
- Store details + products
- Add/update/delete cart (`ProductCart` model exists)
- Apply promo
- Place order
- Order list / detail
- Cancel
- Rate

If you must add missing routes, put them under `/api/user/food/*` and keep payloads identical to Android.

### IMAGE REQUEST — PHASE 7

1. Default restaurant cover
2. Default dish placeholder
3. Empty cart SVG

Owner supplies real restaurant photos via API later; do not stock-photo burgers.

---

# PHASE 8 — Grocery, pharmacy, generic stores

**Objective:** Same engine as food with grocery UX: search, quantities, weight units, prescriptions for pharmacy.

### Differences from food

- `sub_group_for_app == 2` stores vs `1` restaurants
- `PHARMACY` slug: prescription upload (`config/custom.php` path `prescription_image`)
- Weight units, variants, inventory
- Minimum order amount
- Search `POST /api/user/search-store-products`

### Screens

1. Store list
2. Category aisle navigation
3. Product search
4. Quantity stepper
5. Prescription upload (pharmacy)
6. Checkout + slot if merchant uses time slots
7. Tracking (same order statuses)

### IMAGE REQUEST — PHASE 8

1. Default product placeholder
2. Prescription camera frame graphic (SVG)
3. Pharmacy caduceus SVG (not emoji)

---

# PHASE 9 — Handyman, plumber, salon, towing (helper-based)

**Objective:** Person-based services: categories, providers, time slots, cart, confirm, bidding, tracking.

### Screens

1. Helper segment home
2. Categories `POST /api/user/handyman/get-categories`
3. Services `get-services`
4. Provider list `get-providers` / `get-provider`
5. Provider gallery (driver gallery APIs)
6. Time slots `service-slots`
7. Cart `save-booking-cart`, `get-cart`, `delete-cart`
8. Promo `apply-remove-promo-code`
9. Confirm `confirm-order` (and `confirm-order-web` if it is the web variant — prefer it for PWA)
10. Orders list/detail, cancel, rate `rate/provider`, pay `booking-payment`
11. Bidding: create order, list bids, counter, accept, cancel (`/handyman/bidding/*`)
12. Towing: treat as helper or vehicle based according to segment_group_id from API, not assumptions

### Driver-side of handyman is Phase 13–14. This phase is user only.

### IMAGE REQUEST — PHASE 9

1. Category images if API has none: owner will provide plumber, electrician, cleaner, salon, towing
2. Default provider avatar SVG
3. Before/after placeholders only if Android has them

---

# PHASE 10 — Laundry

**Objective:** Outlet list, garment services, pickup/delivery, order tracking.

### Data

Home already has popular laundry in `MainScreenController`. Find laundry user APIs under `LaundryOutlet` namespace and `app/Traits/LaundryServiceTrait.php`.

### Screens

1. Outlet list
2. Service catalog (wash, dry clean, iron, quantities)
3. Pickup address and slot
4. Cart
5. Tracking including outlet processing states
6. Delivery OTP if used (`laundry-outlet` driver APIs exist for pickup verify and deliver)

### IMAGE REQUEST — PHASE 10

1. Garment type icons (SVG: shirt, trousers, suit, duvet)
2. Outlet cover default

---

# PHASE 11 — Bus booking and carpooling

**Objective:** The two remaining segment groups.

### Bus (user)

Find user bus routes (driver bus routes live at `/api/driver/bus-booking/*`). Search `BusBooking` in `routes/api.php` and `app/Http/Controllers`. Implement:

1. Search routes / stops
2. Calendar
3. Seat map
4. Passenger details (`BusTraveller`)
5. Checkout and ticket
6. Ticket history / QR or code if API returns one

### Carpooling (user)

User vehicle + document APIs already exist:

- `/get-document-list`, `/add-document`, `/skip-document-step`
- `/vehicle-configuration`, `/add-vehicle`, `/get-vehicle-list`
- Offer ride / take ride: read `CarpoolingTrait` and merchant carpooling controllers, then expose/consume the user APIs the Android app uses

### IMAGE REQUEST — PHASE 11

1. Bus side image
2. Seat available / taken / selected SVGs
3. Carpool car icon

---

# PHASE 12 — Account, wallet, history, SOS, chat, referrals, rewards, family, cards

**Objective:** Close the user app drawer. After this phase the customer PWA is feature-complete except LencoPay.

### Screens and endpoints

| Feature | Endpoints |
|---------|-----------|
| Profile view/edit | `/details`, `/UserDetail`, `/edit-profile` |
| Change password | `/change-password` |
| Documents | `/userDocList`, `/userDocSave` |
| History | `/booking/history`, `/booking/history/detail`, handyman orders, store orders |
| Active jobs | `/booking/active` |
| Wallet ledger | `/wallet/transaction` |
| Add money UI | `/wallet/addMoney` — **cash/test only; real LencoPay in Phase 16** |
| Transfer | `/check-user`, `/transfer-money` |
| Cashout | `/cashout/request`, `/cashout/history` |
| Cards list | `/cards`, `/card/delete` — display only |
| SOS list/create/delete/request | `/sos*` |
| Favourite drivers | `/favourite-driver`, `/get-favourite-driver` |
| Favourite locations | `/get-favourite-location`, add, delete |
| Favourite stores | `/favourite-business-segment` |
| Family / child list | `AddFamilyMember`, `DeleteFamilyMember`, `ListFamilyMember` |
| Refer | `/refer` |
| Rewards | `/reward-points`, `/redeem-points`, `/reward-gift-list`, history |
| Subscriptions | `/get-subscriptions-list`, activate, history |
| Chat | `/chat`, `/chat/send_message` |
| Support | `/customer_support` |
| CMS | already in Phase 2 |
| Language | header `locale` + string files |
| Delete account | `/account-delete` |
| Logout | `/out-board` |
| Price card | `/pricecard` |
| Promotions | `/promotion/notification` |

### Improvements

- Confirmation modal on delete account
- SOS large tap target and confirm
- Wallet amounts formatted via merchant currency (API `isoCode`)

### IMAGE REQUEST — PHASE 12

1. Referral share image (optional)
2. Empty wallet SVG
3. SOS shield SVG

---

# PHASE 13 — Driver PWA core: login, online, accept, navigate, complete

**Objective:** Driver can go online and finish a taxi or delivery job.

### Screens

1. Driver login / OTP / demo-onboard
2. Registration wizard matching signup flow statuses 1–9
3. Pending approval screen
4. Main screen `get-main-screen-config`
5. Online / offline toggle `get-online-work-config` / `save-online-work-config`
6. Incoming request modal (sound: request files from owner; `public/sound` has mp3s — reuse if license allows)
7. Accept / reject `booking-order-accept-reject`
8. Navigate to pickup (Google Maps directions via `/direction-data` plus `geo:` / Google Maps app deep link)
9. Arrived `arrived-at-pickup`
10. Start / pick `booking-order-picked`
11. End `booking/end`
12. Collect payment confirmation `booking/payment-confirmation` (cash)
13. Complete `complete-booking-order`
14. Active and past jobs
15. Location uploader every N seconds while online (`POST /api/driver/location`)

### Sound

Use `public/sound/*.mp3` if present. Do not autoplay against browser policy; unlock on first tap.

### IMAGE REQUEST — PHASE 13

1. Driver app logo if different from user
2. Online/offline illustrations
3. Request-alert icon

---

# PHASE 14 — Driver PWA advanced: documents, vehicles, segments, earnings, handyman jobs, bus, laundry

**Objective:** Driver app feature parity with Android.

### Modules

- Documents upload/list, expiry
- Vehicles add/list/default, vehicle documents, OTP verify
- Segment enrollment `get-segment-list`, `save-segment-config`, time slots, gallery
- Earnings `DriverEarningController`, wallet, withdraw, cashout
- Subscriptions for drivers
- Handyman job lifecycle: get-orders, accept-reject, arrive, start OTP, end, complete, bid
- Bus driver home ` /api/driver/bus-booking/home-screen`, stop status updates
- Laundry pickup OTP and deliver
- Chat with user
- InDrive counter `booking/in-drive-counter`
- Stripe connect screens: skip unless already required; do not add LencoPay here

### IMAGE REQUEST — PHASE 14

1. Document silhouette guides (ID, license, vehicle)
2. Earnings empty state SVG

---

# PHASE 15 — Store PWA (restaurants / grocery) + PWA hardening

**Objective:** Business-segment Android replica, then make all three apps installable and production-hard.

### Store screens

1. Login `/api/business-segment/on-board`
2. Orders list/detail
3. Accept, reject, process, cancel
4. Assign driver auto/manual
5. Pickup OTP
6. Self pickup accept/deliver
7. Products CRUD steps 1–3
8. Options
9. Open/close
10. Wallet, cashout, stats, earnings
11. Chat with customer
12. Membership plan if API returns one

### Hardening for all apps

- Lighthouse PWA checks
- Install banners iOS + Android
- Push: OneSignal web, bind player id to user/driver/store device APIs (`UserDevice`, `Onesignal` models)
- Offline: cache shell, last home, active trip
- App-like navigation: prevent pull-to-refresh breaking maps; handle back button
- Deep links: `/ride/:id`, `/order/:id`, `/handyman/:id`
- Security: token refresh, logout all tabs, hide secrets from client bundle (merchant secret key is already used by the Android app in headers; still load it from env at runtime, not commit it)
- Performance: code split per segment
- Accessibility: labels on icon buttons
- Error boundaries
- `pwa/README.md` runbook

### IMAGE REQUEST — PHASE 15

1. Store app icon
2. Push notification icons 96x96
3. iOS splash PNGs for 1290x2796, 1179x2556, 1170x2532 if the owner wants branded splashes

---

# PHASE 16 — LencoPay (FINAL PHASE)

**Do not start this phase early.**

**Objective:** LencoPay is the live online payment rail for wallet top-up, ride payment, order payment, handyman payment, driver subscription if applicable.

### What already exists in Laravel

- `app/Http/Controllers/PaymentMethods/LencoPay/LencoPayController.php`
- View `resources/views/payment/lencopay/lencopay.blade.php`
- Routes:

```
/api/lencopay/success
/api/lencopay/failed
/api/lencopay/webview
```

- Config lookup: `PaymentOption` slug `LENCOPAY`
- `paymentInitiate` returns `NEED_TO_OPEN_WEBVIEW` with a webview URL
- Inline JS: `https://pay.lenco.co/js/v1/inline.js` or sandbox `https://pay.sandbox.lenco.co/js/v1/inline.js`
- Channels: `card`, `mobile-money`
- Transactions row inserted as PENDING, then SUCCESS/FAIL on callback

### Owner has API keys

Do not hardcode keys in the PWA. Store them on `payment_options_configurations` for the merchant (admin already has payment option screens). PWA never ships the secret key.

### Work in this phase

1. Confirm `LENCOPAY` row in `payment_options` and merchant configuration (`api_public_key`, `api_secret_key`, `gateway_condition` 1 live / 2 sandbox).
2. Hook LencoPay into `PaymentMethods\Payment@onlinePayment` switch/case if not already selected by slug. Read `Payment.php` fully and add a `LENCOPAY` branch that calls `LencoPayController@paymentInitiate`.
3. PWA payment sheet: when user selects Online / LencoPay, call `POST /api/user/online/make-payment` with amount, currency, booking_id / order_id / handyman_order_id, `calling_from` USER.
4. Open the returned URL in an in-app browser sheet (not a new tab if possible). On iOS Safari, a full-screen route `/pay/lenco` that loads Lenco inline.js is more reliable than a WebView iframe.
5. Prefer **native inline LencoPay.js inside the PWA** using the public key from a dedicated backend endpoint that returns only the public key + reference + amount. Do not put the secret in JavaScript.
6. On `onSuccess`, hit success URL / poll `POST /api/user/online/payment-status` or `/check-transaction-status`.
7. On close/fail, mark UI failed, allow retry.
8. Wallet add money: same initiate with no booking_id.
9. Driver side: `calling_from` DRIVER for subscriptions / cash add if Android supports it.
10. Webhooks: improve `Success`/`Fail` to return JSON for the PWA instead of raw `<h3>Success</h3>` (allowed improvement). Keep the HTML for old webviews.
11. Logging: existing `\Log::channel('lenco_pay')`. Add the channel in `config/logging.php` if missing.
12. Never log full card data.
13. Test sandbox first (`gateway_condition = 2`).
14. Show LencoPay SVG mark (request official logo).
15. Disable other online gateways in the PWA payment list (they remain in Laravel for native apps).

### LencoPay UX

- Amount, currency, email, phone, first/last name from the logged-in user
- Reference generated server-side (`REF_MERCHANT_` + time is already used; improvement: use UUID to avoid collision)
- Success screen: reuse `public/basic-images/payment-done.png` only if the owner confirms; otherwise SVG check
- Failure screen with retry and “pay with cash/wallet instead” if the booking allows

### IMAGE REQUEST — PHASE 16

1. Official LencoPay logo SVG/PNG
2. Payment success / fail graphics if not using SVG checks
3. Mobile money operator marks only if Lenco returns them and licensing allows; otherwise text names

---

## 10. Suggested slight improvements (apply in the phase they belong to)

These are the only “enhancements” the agent should add without asking. Everything else stays replica.

1. PostgreSQL instead of MySQL.
2. Typed API client and envelope handling.
3. httpOnly cookie BFF for tokens.
4. CORS allowlist for PWA origin.
5. Skeleton loaders, empty states, retry.
6. `autocomplete="one-time-code"` for OTP.
7. Screen Wake Lock during active trips.
8. iOS add-to-home-screen explainer.
9. LencoPay UUID references and JSON callbacks.
10. Accessible 44px targets, visible focus rings.
11. Do not use `alert()` (LencoPay Blade currently uses `alert` for pending confirmation — replace with in-app modal in the PWA).
12. Central error toast, no raw exception text.
13. Lazy-load maps.
14. Reduce location poll frequency on battery (`visibilitychange`).
15. Professional SVG service icons instead of the old `holder_taxi.png` reused for every segment in the seeder.

---

## 11. Explicit non-goals (until the owner asks)

- Rebuilding merchant admin in Next.js
- Rebuilding hotel / corporate / franchise / taxi-company portals
- Integrating the 100+ other payment gateways in the PWA
- Changing booking or order status numbers
- New social network, new AI features, new segments
- Dark mode unless Android has it (if configuration has a dark theme, follow it)
- Desktop-wide dashboard layout for the user app

---

## 12. Repository map for the agent (read these first)

| Path | Why |
|------|-----|
| `routes/api.php` | Every mobile endpoint |
| `routes/web.php` | Admin + share ride + crons |
| `documents/multi-service_technical_docs.md` | Architecture, tenancy, statuses |
| `app/Http/Controllers/Api/*` | User/driver APIs |
| `app/Http/Controllers/Account/*` | Login/signup |
| `app/Http/Controllers/PaymentMethods/LencoPay/*` | Phase 16 |
| `app/Http/Controllers/PaymentMethods/Payment.php` | Online payment router |
| `app/Traits/BookingTrait.php` | Ride logic |
| `app/Traits/OrderTrait.php` | Food/grocery orders |
| `app/Traits/HandymanTrait.php` | Helper jobs |
| `app/Models/Booking.php` | Ride entity |
| `app/Models/BusinessSegment/*` | Stores, products, orders |
| `app/Models/Segment.php` | Segments |
| `database/seeds/SegmentsTableSeeder.php` | Default segments |
| `database/seeds/HomeScreenHoldersTableSeeder.php` | Home cells |
| `database/seeds/AppNavigationDrawersTableSeeder.php` | Drawer |
| `database/seeds/PaymentMethodsTableSeeder.php` | Cash/card/wallet/online |
| `config/custom.php` | S3 image path keys |
| `config/auth.php` | Guards |
| `public/basic-images/` | Existing raster assets (use only if owner agrees) |
| `Fixcycle Source Codes Android.zip` | Pixel and flow source for Android |

Extract Android zip to `android-source/` and search for:

- Retrofit interface paths
- Activities/Fragments for Home, Checkout, Tracking, Food, Handyman
- Color XML / theme
- Drawer menu XML

---

## 13. Environment variables the agent must document

```
# Laravel
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=fixcycle
DB_USERNAME=
DB_PASSWORD=
PWA_ORIGIN=https://app.example.com
GOOGLE_MAPS_KEY=
ONESIGNAL_APP_ID=
ONESIGNAL_REST_KEY=

# PWA (public)
NEXT_PUBLIC_API_BASE=https://api.example.com/api
NEXT_PUBLIC_MERCHANT_PUBLIC_KEY=
NEXT_PUBLIC_ONESIGNAL_APP_ID=
NEXT_PUBLIC_GOOGLE_MAPS_KEY=

# PWA (server only, BFF)
MERCHANT_SECRET_KEY=
LENCO_PUBLIC_KEY_FALLBACK=
```

Lenco secret stays in Laravel `payment_options_configurations`, never in Next.js.

---

## 14. Order of implementation (do not reorder)

1. Foundation + PostgreSQL + PWA shell  
2. User auth  
3. Home + drawer  
4. Taxi normal live trip  
5. Taxi variants  
6. Delivery  
7. Food  
8. Grocery / pharmacy  
9. Handyman / salon / plumber / towing  
10. Laundry  
11. Bus + carpool  
12. Account / wallet / SOS / chat / rewards  
13. Driver core  
14. Driver advanced  
15. Store PWA + install hardening  
16. LencoPay  

Each phase builds on the previous. Taxi tracking components are reused by delivery. Food cart is reused by grocery. Driver job modal is reused by handyman. Payment sheet is reused by LencoPay.

---

## 15. Definition of done for the whole program

- User can install the PWA on iPhone (Add to Home Screen) and Android (Install app) and use it fullscreen.
- User can register, login, see home services, book a taxi, track it, pay cash or wallet, rate.
- User can order food and grocery, book a handyman, and open wallet history.
- Driver can go online, accept, complete.
- Store can accept and process an order.
- PostgreSQL is the database for local/dev.
- No emojis in the product.
- Every service has an SVG icon.
- Photos are either from the live API or from the owner-supplied folder.
- LencoPay is the only new online gateway in the PWA and is the last phase.

---

## 16. First message the coding agent should send back to the owner

Before coding, confirm:

1. Merchant `publicKey` / `secretKey` for the target tenant.
2. Whether one merchant or multi-merchant (if multi, `alias_name` subdomain or query).
3. Google Maps key availability.
4. Whether to extract `Fixcycle Source Codes Android.zip` into `android-source/`.
5. Brand colors if they should override API theme.
6. Confirmation that LencoPay waits until Phase 16.
7. PostgreSQL connection string for local.

Then start Phase 1 only.

---

## 17. Coding standards for the PWA

- TypeScript strict
- No `any` except at the Laravel JSON boundary, and even then wrap in zod
- Named exports
- Server Components by default; maps and payment widgets are client components
- All user-visible strings through an i18n function
- Conventional commits without emojis: `feat(user): add ride checkout sheet`
- Do not commit `.env`, keys, or the Android zip
- Do not run `rm -rf` on Laravel `vendor/` or `storage/`
- Do not “clean up” unused payment gateways in Laravel; native apps still need them

---

End of mega prompt. Execute Phase 1 next.
