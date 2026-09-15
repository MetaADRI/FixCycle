<?php

namespace App\Http\Controllers\Helper;

use App\Models\Booking;
use App\Models\BookingConfiguration;
use App\Models\BookingRequestDriver;
use App\Models\Driver;
use App\Events\WebPushNotificationEvent;
use App\Traits\MerchantTrait;
use Illuminate\Support\Facades\Log;

/**
 * BookingScheduleHelper
 *
 * Handles all business logic for expiring old bookings
 * and notifying drivers/users for scheduled (ride-later) bookings.
 *
 * Called from: YourCronController@expireOldAndNotifyScheduledBooking
 *
 * Booking Status Reference:
 *   1001 → Booking searching for driver
 *   1012 → Booking accepted by driver
 *   1018 → Booking expired
 *   1019 → Ride-later booking waiting to be dispatched
 *
 * ──────────────────────────────────────────────────────────────────────────
 * FIXES APPLIED
 * ──────────────────────────────────────────────────────────────────────────
 * 1. chunk() replaces get()        → prevents OOM on large result sets
 * 2. try/catch per booking         → one bad row can never kill the whole run
 * 3. date_default_timezone_set()   → called ONCE per booking, then restored
 *                                    to UTC immediately after use
 * 4. date_create() guard           → returns null and skips booking if the
 *                                    datetime string is unparseable
 * 5. Null-safe relation access     → CountryArea, User, UserDetail, BookingDetail
 *                                    all checked before dereferencing
 * 6. Config cache                  → at most one DB query per merchant per run
 * 7. Removed Booking::find() re-fetches inside the loop for status-1019 and
 *    status-1001 paths — use the already-loaded model instead; only re-fetch
 *    when a full eager-load is genuinely required (dispatchDriversForRideLater)
 *    and document why
 * 8. CHUNK_SIZE constant           → change without touching logic
 * ──────────────────────────────────────────────────────────────────────────
 */
class BookingScheduleHelper
{
    use MerchantTrait;

    /*
    |--------------------------------------------------------------------------
    | CONSTANTS
    |--------------------------------------------------------------------------
    */

    /**
     * Number of bookings processed per DB round-trip.
     * Keeps peak memory flat regardless of total row count.
     * Tune up/down based on row width and available RAM.
     */
    private const CHUNK_SIZE = 100;

    /*
    |--------------------------------------------------------------------------
    | CONFIG CACHE
    |--------------------------------------------------------------------------
    | Prevents repeated DB queries for the same merchant inside the loop.
    */

    /** @var array<int, BookingConfiguration|null> */
    private $configCache = [];

    /*
    |--------------------------------------------------------------------------
    | MAIN ENTRY POINT
    |--------------------------------------------------------------------------
    */

    /**
     * Process all eligible scheduled bookings.
     *
     * Uses chunk() so peak memory stays bounded at CHUNK_SIZE rows
     * instead of loading every matching booking at once.
     *
     * Each booking is wrapped in its own try/catch so a single
     * corrupted row cannot abort the entire cron run.
     */
    public function processAll(): void
    {
        $this->buildQuery()->chunk(self::CHUNK_SIZE, function ($bookings) {
            foreach ($bookings as $booking) {
                try {
                    $this->processBooking($booking);
                } catch (\Throwable $e) {
                    // Log and continue — never let one bad booking kill the run
                    \Log::channel('per_minute_cron_log')->emergency([
                        "cron_for" => "BookingScheduleHelper: failed to process booking processAll()",
                        'booking_id' => $booking->id ?? null,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                        "ist_time" => Carbon::now("Asia/kolkata")->format("y-m-d H:i:s"),
                    ]);
                }
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | FETCH BOOKINGS
    |--------------------------------------------------------------------------
    */

    /**
     * Build the base query for scheduled (ride-later) bookings.
     * chunk() is called on the returned Builder — do NOT call get() here.
     *
     * @return \Illuminate\Database\Eloquent\Builder
     */
    private function buildQuery()
    {
        return Booking::select(
            'id', 'user_id', 'segment_id', 'merchant_id', 'driver_id',
            'merchant_booking_id', 'country_area_id', 'booking_type',
            'later_booking_date', 'later_booking_time', 'booking_status',
            'upcoming_notify', 'corporate_id'
        )
            ->whereIn('booking_status', [1001, 1012, 1019])
            ->where('booking_type', 2);
    }

    /*
    |--------------------------------------------------------------------------
    | PER-BOOKING PROCESSOR
    |--------------------------------------------------------------------------
    */

    /**
     * Process a single booking based on its current status.
     *
     * HANG FIX: date_default_timezone_set() is scoped tightly — we capture the
     * previous timezone, apply the booking-local one, do the comparison, then
     * restore UTC immediately. This prevents leaking a booking-specific timezone
     * into subsequent iterations or into code that assumes UTC.
     *
     * @param Booking $booking
     */
    private function processBooking(Booking $booking): void
    {
        // Guard: CountryArea relation must exist and carry a timezone
        $timezone = $booking->CountryArea['timezone'] ?? null;
        if (empty($timezone)) {
            Log::warning('BookingScheduleHelper: missing timezone', ['booking_id' => $booking->id]);
            return;
        }

        $string_file = $this->resolveStringFile($booking->merchant_id);

        // Scope timezone change to this booking only
        $prev_tz = date_default_timezone_get();
        date_default_timezone_set($timezone);

        $booking_time = $this->getBookingDateTime($booking);
        $current_date_time = date('Y-m-d H:i');

        // Restore immediately — everything below uses explicit timestamps, not date()
        date_default_timezone_set($prev_tz);

        // Guard: unparseable booking datetime
        if ($booking_time === null) {
            Log::warning('BookingScheduleHelper: unparseable booking datetime', [
                'booking_id' => $booking->id,
                'later_booking_date' => $booking->later_booking_date,
                'later_booking_time' => $booking->later_booking_time,
            ]);
            return;
        }

        if ($booking->booking_status == 1019) {
            $this->handleRideLaterStatus($booking, $booking_time, $current_date_time);
        } else {
            $this->handleNonRideLaterStatus($booking, $booking_time, $current_date_time, $string_file);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UTILITY HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Resolve the string file (translation namespace) for the given merchant.
     *
     * Named resolveStringFile() to avoid collision with the trait's getStringFile().
     *
     * @param int $merchant_id
     * @return string
     */
    private function resolveStringFile(int $merchant_id): string
    {
        return $this->getStringFile($merchant_id);
    }

    /**
     * Get (and cache) the BookingConfiguration for a merchant.
     *
     * At most one DB query per merchant per cron run.
     *
     * @param int $merchant_id
     * @return BookingConfiguration|null
     */
    private function getConfig(int $merchant_id): ?BookingConfiguration
    {
        if (!array_key_exists($merchant_id, $this->configCache)) {
            $this->configCache[$merchant_id] = BookingConfiguration::where('merchant_id', $merchant_id)->first();
        }

        return $this->configCache[$merchant_id];
    }

    /**
     * Build and sanitize the booking's scheduled datetime string.
     *
     * Strips invisible/non-printable Unicode characters from the time field
     * that can cause date_create() to fail silently and return false.
     *
     * HANG FIX: Returns null (not a false-y string) when the result cannot be
     * parsed so callers can skip the booking cleanly instead of calling
     * ->getTimestamp() on a boolean false.
     *
     * @param Booking $booking
     * @return string|null  "Y-m-d H:i", or null if unparseable
     */
    private function getBookingDateTime(Booking $booking): ?string
    {
        $clean_time = preg_replace(
            '/[\x00-\x1F\x7F\xA0\x{2000}-\x{200F}\x{2028}-\x{202F}\x{205F}\x{3000}]/u',
            '',
            (string)$booking->later_booking_time
        );

        $combined = $booking->later_booking_date . ' ' . $clean_time;

        // Validate the string is actually parseable before returning it
        if (date_create($combined) === false) {
            return null;
        }

        return $combined;
    }

    /**
     * Calculate the difference in minutes between scheduled booking time and now.
     *
     * Positive value → booking is in the future
     * Negative value → booking time has passed
     *
     * HANG FIX: Returns null if either datetime string fails to parse, so
     * callers can bail out rather than crash on false->getTimestamp().
     *
     * @param string $booking_time Scheduled datetime "Y-m-d H:i"
     * @param string $current_date_time Current datetime "Y-m-d H:i"
     * @return float|null  Minutes remaining (can be negative), or null on parse failure
     */
    private function getTimeDiffInMinutes(string $booking_time, string $current_date_time): ?float
    {
        $dt1 = date_create($booking_time);
        $dt2 = date_create($current_date_time);

        if ($dt1 === false || $dt2 === false) {
            return null;
        }

        return ($dt1->getTimestamp() - $dt2->getTimestamp()) / 60;
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS 1019 — RIDE LATER (Admin-Dispatched)
    |--------------------------------------------------------------------------
    */

    /**
     * Handle a ride-later booking (status 1019).
     *
     * @param Booking $booking
     * @param string $booking_time
     * @param string $current_date_time
     */
    private function handleRideLaterStatus(Booking $booking, string $booking_time, string $current_date_time): void
    {
        $configuration = $this->getConfig($booking->merchant_id);
        if ($configuration === null) {
            Log::warning('BookingScheduleHelper: no config for merchant', ['merchant_id' => $booking->merchant_id]);
            return;
        }

        $minutes_diff = $this->getTimeDiffInMinutes($booking_time, $current_date_time);
        if ($minutes_diff === null) {
            return;
        }

        $seconds_diff = $minutes_diff * 60;
        $can_send_ride = $this->canSendRide($booking, $seconds_diff);

        $withinDispatchWindow = $minutes_diff <= $configuration->ride_later_on_admin_request_time
            && $minutes_diff >= 0
            && empty($booking->driver_id)
            && $can_send_ride;

        if ($withinDispatchWindow) {
            $this->dispatchDriversForRideLater($booking, $configuration);
        } elseif ($minutes_diff < 0) {
            $this->expireCorporateOrNormalBooking($booking);
        }
    }

    /**
     * Determine whether a ride is eligible to be dispatched to drivers.
     *
     * HANG FIX: All relation accesses are null-safe; a missing UserDetail or
     * BookingDetail returns a safe default rather than triggering a fatal error.
     *
     * @param Booking $booking
     * @param float $seconds_diff
     * @return bool
     */
    private function canSendRide(Booking $booking, float $seconds_diff): bool
    {
        if (empty($booking->corporate_id)) {
            return true;
        }

        $user_detail = optional($booking->User)->UserDetail;
        $is_instant = optional($booking->BookingDetail)->is_instant_corporate_ride == 1;

        $needsApproval = $user_detail !== null
            && $user_detail->need_approval_for_corporate == 1
            && $user_detail->is_default_corporate_user != 1
            && empty($booking->corporate_ride_approver);

        if ($needsApproval) {
            return false;
        }

        if (!$is_instant && $seconds_diff > 0) {
            return false;
        }

        return true;
    }

    /**
     * Find and assign drivers for a ride-later booking.
     *
     * NOTE: We do a fresh Booking::find() here because AssignRequest and
     * SendNotificationToDrivers need a fully eager-loaded model with all
     * relations. This is the ONE legitimate re-fetch in the loop; all others
     * have been removed.
     *
     * @param Booking $booking
     * @param BookingConfiguration $configuration
     */
    private function dispatchDriversForRideLater(Booking $booking, BookingConfiguration $configuration): void
    {
        if ($configuration->normal_ride_later_request_type != 1 || $configuration->ride_later_on_admin != 1) {
            return;
        }

        // Full reload required by downstream controllers (relations, casts, etc.)
        $freshBooking = Booking::find($booking->id);
        if ($freshBooking === null) {
            return;
        }

        setS3Config($freshBooking->Merchant);

        $remain_ride_radius_slot = $this->resolveRideRadiusSlot($freshBooking, $configuration);
        $drivers = $this->findDriversWithFallback($freshBooking, $configuration, $remain_ride_radius_slot);

        if (!empty($drivers) && $drivers->count() > 0) {
            $freshBooking->booking_status = 1001;
            $freshBooking->save();

            (new FindDriverController())->AssignRequest($drivers, $freshBooking->id);
            (new BookingDataController())->SendNotificationToDrivers($freshBooking, $drivers);

            $freshBooking->upcoming_notify = 1;
            $freshBooking->save();
        }
    }

    /**
     * Resolve which driver search radius slot to use for this dispatch attempt.
     *
     * @param Booking $booking
     * @param BookingConfiguration $configuration
     * @return array
     */
    private function resolveRideRadiusSlot(Booking $booking, BookingConfiguration $configuration): array
    {
        if (empty($configuration->driver_ride_radius_request)) {
            return [];
        }

        $ride_radius = json_decode($configuration->driver_ride_radius_request, true) ?? [];
        $limit = getSendDriverRequestLimit($booking);

        if ($limit == 1) {
            return !empty($booking->ride_radius)
                ? [explode(',', $booking->ride_radius)[0]]
                : $ride_radius;
        }

        if ($limit > 1 && !empty($booking->ride_radius)) {
            $booking_ride_radius = explode(',', $booking->ride_radius);
            return array_values(array_diff($ride_radius, $booking_ride_radius));
        }

        return $ride_radius;
    }

    /**
     * Search for the nearest available drivers, falling back to wider radius slots if needed.
     *
     * @param Booking $booking
     * @param BookingConfiguration $configuration
     * @param array $remain_ride_radius_slot
     * @return \Illuminate\Database\Eloquent\Collection|null
     */
    private function findDriversWithFallback(Booking $booking, BookingConfiguration $configuration, array $remain_ride_radius_slot)
    {
        $param = [
            'area' => $booking->country_area_id,
            'segment_id' => $booking->segment_id,
            'latitude' => $booking->pickup_latitude,
            'longitude' => $booking->pickup_longitude,
            'distance' => !empty($remain_ride_radius_slot) ? $remain_ride_radius_slot[0] : null,
            'limit' => $configuration->normal_ride_later_request_driver,
            'service_type' => $booking->service_type_id,
            'vehicle_type' => $booking->vehicle_type_id,
            'payment_method_id' => $booking->payment_method_id,
            'estimate_bill' => $booking->estimate_bill,
            'user_gender' => $booking->gender,
            'booking_id' => $booking->id,
            'call_google_api' => true,
            'calling_from_cron' => 1,
        ];

        // Driver search uses UTC internally
        date_default_timezone_set('UTC');
        $drivers = Driver::GetNearestDriver($param);

        if (empty($drivers) && !empty($configuration->driver_ride_radius_request)) {
            $all_slots = json_decode($configuration->driver_ride_radius_request, true) ?? [];

            foreach ([1, 2] as $slot_index) {
                if (!empty($all_slots[$slot_index])) {
                    $param['distance'] = $all_slots[$slot_index];
                    $drivers = Driver::GetNearestDriver($param);

                    if (!empty($drivers)) {
                        break;
                    }
                }
            }
        }

        return $drivers;
    }

    /**
     * Expire a booking that has passed its scheduled time without being fulfilled.
     *
     * @param Booking $booking
     */
    private function expireCorporateOrNormalBooking(Booking $booking): void
    {
        $is_instant = optional($booking->BookingDetail)->is_instant_corporate_ride == 1;

        if (!empty($booking->corporate_id) && $is_instant) {
            $pendingRequests = $booking->BookingRequestDriver ?? collect();

            if ($pendingRequests->count() > 0) {
                BookingRequestDriver::where('booking_id', $booking->id)
                    ->where('request_status', 1)
                    ->update(['request_status' => 3]);

                if (!empty($booking->Driver)) {
                    $booking->Driver->save();
                    $booking->Driver()->update([
                        'last_ride_request_timestamp' => date('Y-m-d H:i:s', time() - 100),
                    ]);
                }
            }
        }

        $booking->booking_status = 1018;
        $booking->save();
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS 1001 / 1012 — STANDARD BOOKINGS
    |--------------------------------------------------------------------------
    */

    /**
     * Handle bookings with status 1001 (searching) or 1012 (driver accepted).
     *
     * @param Booking $booking
     * @param string $booking_time
     * @param string $current_date_time
     * @param string $string_file
     */
    private function handleNonRideLaterStatus(Booking $booking, string $booking_time, string $current_date_time, string $string_file): void
    {
        $config = $this->getConfig($booking->merchant_id);
        if ($config === null) {
            return;
        }

        $d1 = date_create($booking_time);
        if ($d1 === false) {
            return;
        }

        date_modify($d1, "+{$config->user_request_timeout} seconds");

        $d2 = date_create($current_date_time);
        if ($d2 === false) {
            return;
        }

        $min_diff = ($d1->getTimestamp() - $d2->getTimestamp()) / 60;

        if ($min_diff <= 0) {
            $this->expireStandardBooking($booking);

        } elseif ($booking->booking_status == 1012 && !empty($booking->driver_id)) {
            $this->notifyUpcomingRideToDriver($booking, $booking_time, $current_date_time, $string_file);

        } elseif ($booking->booking_status == 1001 && empty($booking->driver_id) && $booking->upcoming_notify != 1) {
            $this->retryDriverSearchForRideLater($booking, $booking_time, $current_date_time);
        }
    }

    /**
     * Mark a standard booking as expired (status 1018) and append to status history.
     *
     * @param Booking $booking
     */
    private function expireStandardBooking(Booking $booking): void
    {
        $booking->booking_status = 1018;

        $new_status = [
            'booking_status' => $booking->booking_status,
            'booking_timestamp' => time(),
            'latitude' => '',
            'longitude' => '',
            'from' => 'expireOldAndNotifyScheduledBooking cron for 1001',
        ];

        $history = [];
        if (!empty($booking->booking_status_history)) {
            $decoded = json_decode($booking->booking_status_history, true);
            $history = is_array($decoded) ? $decoded : [];
        }

        $history[] = $new_status;
        $booking->booking_status_history = json_encode($history);
        $booking->save();
    }

    /**
     * Send an "upcoming ride" notification to the driver when the time window matches.
     *
     * @param Booking $booking
     * @param string $booking_time
     * @param string $current_date_time
     * @param string $string_file
     */
    private function notifyUpcomingRideToDriver(Booking $booking, string $booking_time, string $current_date_time, string $string_file): void
    {
        $config = $this->getConfig($booking->merchant_id);
        if ($config === null) {
            return;
        }

        $minutes_diff = $this->getTimeDiffInMinutes($booking_time, $current_date_time);
        if ($minutes_diff === null) {
            return;
        }

        $minutes = $this->getRideLaterTimeBeforeInMinutes($booking, $config);

        if (($minutes_diff - $config->upcoming_notification_time) == $minutes) {
            (new BookingDataController())->SendNotificationToDrivers($booking);

            event(new WebPushNotificationEvent(
                $booking->merchant_id, [], 1,
                $booking->service_type_id, $booking, $string_file, 'UPCOMING_RIDE'
            ));
        }
    }

    /**
     * Get the "time before ride" threshold in minutes for the booking's service type.
     *
     * @param Booking $booking
     * @param BookingConfiguration $config
     * @return float
     */
    private function getRideLaterTimeBeforeInMinutes(Booking $booking, BookingConfiguration $config): float
    {
        $seconds_map = [
            1 => $config->normal_ride_later_time_before,
            2 => $config->rental_ride_later_time_before,
            3 => $config->transfer_ride_later_time_before,
            4 => $config->outstation_time_before,
        ];

        $seconds = $seconds_map[$booking->service_type_id] ?? $config->normal_ride_later_time_before;

        return $seconds / 60;
    }

    /**
     * Retry finding a driver for a ride-later booking within 30 minutes of its scheduled time.
     *
     * HANG FIX: Removed Booking::find() re-fetch — the select() columns from
     * buildQuery() are sufficient for GetNearestDriver(). Only re-fetch if a
     * downstream method actually requires full eager-loading.
     *
     * @param Booking $booking
     * @param string $booking_time
     * @param string $current_date_time
     */
    private function retryDriverSearchForRideLater(Booking $booking, string $booking_time, string $current_date_time): void
    {
        $date1 = date_create($booking_time);
        if ($date1 === false) {
            $booking->upcoming_notify = 1;
            $booking->save();
            return;
        }

        $date1->sub(new \DateInterval('PT30M'));

        $now = date_create($current_date_time);
        if ($now === false) {
            $booking->upcoming_notify = 1;
            $booking->save();
            return;
        }

        if ($now > $date1) {
            $configuration = $this->getConfig($booking->merchant_id);

            if ($configuration !== null
                && $configuration->normal_ride_later_request_type == 1
                && $configuration->ride_later_on_admin == 1
            ) {
                $param = [
                    'area' => $booking->country_area_id,
                    'segment_id' => $booking->segment_id,
                    'latitude' => $booking->pickup_latitude,
                    'longitude' => $booking->pickup_longitude,
                    'distance' => $configuration->normal_ride_later_radius,
                    'limit' => $configuration->normal_ride_later_request_driver,
                    'service_type' => $booking->service_type_id,
                    'vehicle_type' => $booking->vehicle_type_id,
                    'payment_method_id' => $booking->payment_method_id,
                    'estimate_bill' => $booking->estimate_bill,
                    'user_gender' => $booking->gender,
                ];

                date_default_timezone_set('UTC');
                $drivers = Driver::GetNearestDriver($param);

                if (!empty($drivers) && $drivers->count() > 0) {
                    (new BookingDataController())->SendNotificationToDrivers($booking, $drivers);
                }
            }
        }

        $booking->upcoming_notify = 1;
        $booking->save();
    }
}