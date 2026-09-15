<?php

namespace App\Http\Controllers\CronJob;

use App\Http\Controllers\Api\ChatPlatformController;
use App\Http\Controllers\Helper\BookingScheduleHelper;
use DateTime;
use DateTimeZone;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Driver;
use App\Models\Booking;
use App\Models\Onesignal;
use App\Models\BusBooking;
use App\Traits\OrderTrait;
use Carbon\CarbonTimeZone;
use App\Models\StripePayout;
use Illuminate\Http\Request;
use App\Models\HandymanOrder;
use App\Traits\HandymanTrait;
use App\Traits\MerchantTrait;
use App\Models\PackageDuration;
use App\Traits\BusBookingTrait;
use App\Models\BusBookingMaster;
use App\Models\MerchantWhatsapp;
use Illuminate\Support\Facades\DB;
use App\Models\SubscriptionPackage;
use App\Http\Controllers\Controller;
use App\Models\BookingConfiguration;
use App\Models\BookingRequestDriver;
use App\Models\BusinessSegment\Order;
use Illuminate\Support\Facades\Redis;
use App\Models\MerchantMembershipPlan;
use App\Models\UserSubscriptionRecord;
use Illuminate\Support\Facades\Schema;
use App\Events\WebPushNotificationEvent;
use App\Models\DriverSubscriptionRecord;
use App\Traits\SubscriptionPackageTrait;
use Aws\ClientSideMonitoring\Configuration;
use App\Http\Controllers\Api\GroceryController;
use App\Models\BusinessSegment\BusinessSegment;
use Illuminate\Support\Facades\Cache;
use App\Http\Controllers\Helper\WalletTransaction;
use App\Http\Controllers\Merchant\BookingController;
use App\Http\Controllers\PaymentSplit\StripeConnect;
use App\Http\Controllers\Helper\FindDriverController;
use App\Http\Controllers\Merchant\WhatsappController;
use App\Http\Controllers\Helper\BookingDataController;
use App\Models\BusinessSegment\BusinessSegmentConfigurations;
use App\Models\Merchant;
use App\Models\CountryArea;
use App\Http\Controllers\PaymentMethods\Payment;


class PerMinuteCronController extends Controller
{
    use OrderTrait, HandymanTrait, MerchantTrait, BusBookingTrait, SubscriptionPackageTrait;
    //    use HandymanTrait;
    /********** Expire old Booking's cron start ***************/

    public function dummy()
    {
        $this->CheckOrderStockUsingIQRetail();
    }
    public function booking()
    {
        $this->StripePayput();
        $this->expireOldBookedRides();
        // its for taxi and delivery
        $this->expireOldAndNotifyScheduledBooking();
        // expired partial accepted ride and send notification
        $this->expireOldAcceptedBookings();

        $this->expireNotAcceptedHandymanOrders();
        //  order of food and grocery
        $this->expirePlacedOrders();
        $this->expireNewRequestedRides(); //rides booked from whatsapp
        $this->rejectOrderRequest(); //reject order request
        $this->notifyHandymanOrders();
        $this->expireInDriverAndTaxiBooking();
        $this->expireSubscription(); //Expire the subscription plan for food and grocery
        $this->updateLatLonForDriver();
        $this->checkDriverAssignedForRideAdminLater();
        $this->activateAndExpireSubscriptionForDriver();
        $this->Subscribe_product_place();
        // $this->CheckOrderStockUsingIQRetail();
        $this->OfflineDriverMaxHoursOnline();
    }
    /********** Expire old Booking's cron end ***************/
    //expire InDrive Booking
    // public function expireInDriverAndTaxiBooking()
    // {
    //     $bookings = Booking::whereIn('booking_status', [1000, 1001])->where([['booking_type', '=', 1]])->get();
    //     if (!empty($bookings->toArray())) {
    //         foreach ($bookings as $booking):
    //             if ($booking->booking_status == 1001 || $booking->booking_status == 1000) {
    //                 $config = BookingConfiguration::select('driver_request_timeout')->where([['merchant_id', '=', $booking->merchant_id]])->first();
    //                 $string_file = $this->getStringFile($booking->merchant_id);
    //                 $driver_request_timeout = $config->driver_request_timeout;
    //                 if($booking->is_fake_booking == 1){
    //                     $driver_request_timeout = 20;
    //                 }

    //                 $dateTime = new \DateTime($booking->created_at, new \DateTimeZone('UTC'));
    //                 $dateTimeNow = new \DateTime('now', new \DateTimeZone('UTC'));
    //                 $interval = $dateTimeNow->diff($dateTime);
    //                 $secondsDiff = ($interval->days * 24 * 60 * 60) + ($interval->h * 60 * 60) + ($interval->i * 60) + $interval->s;

    //                 $diffIsGreater = $secondsDiff > $driver_request_timeout;

    //                 if ($diffIsGreater) {
    //                     $booking->booking_status = 1018;  // expired booking
    //                     $booking->save();

    //                     $segment_data = [
    //                         'id' => $booking->id,
    //                         'booking_status' => $booking->booking_status,
    //                     ];
    //                     $data = array('notification_type' => 'RIDE_EXPIRED', 'segment_type' => $booking->Segment->slag, 'segment_data' => $segment_data);
    //                     // $arr_param = array(
    //                     //     'user_id' => $booking->user_id,
    //                     //     'data'=>$data,
    //                     //     'message'=>trans("$string_file.ride_expired"),
    //                     //     'merchant_id'=>$booking->merchant_id,
    //                     //     'title' => '#'.$booking->merchant_booking_id .' '.trans("$string_file.ride_expired")
    //                     // );
    //                     // Onesignal::UserPushMessage($arr_param);
    //                 }
    //             }

    //         endforeach;
    //     }
    // }

    public function expireInDriverAndTaxiBooking()
    {
        try{
            $bookings = Booking::whereIn('booking_status', [1000, 1001])->where([['booking_type', '=', 1]])->get();
            if (!empty($bookings->toArray())) {
                foreach ($bookings as $booking):
                    if ($booking->booking_status == 1001 || $booking->booking_status == 1000) {
                        $config = BookingConfiguration::select('driver_request_timeout', 'user_request_timeout', 'driver_ride_radius_request', 'retry_ride_request')->where([['merchant_id', '=', $booking->merchant_id]])->first();
                        $string_file = $this->getStringFile($booking->merchant_id);
                        $driver_request_timeout = $config->driver_request_timeout;
                        $user_time_out = $config->user_request_timeout;
                        if($booking->is_fake_booking == 1){
                            $user_time_out = 20;
                        }


                        $driver_time_out  = $driver_request_timeout - 10;
                        $dateTime = new \DateTime($booking->created_at, new \DateTimeZone('UTC'));
                        $dateTimeNow = new \DateTime('now', new \DateTimeZone('UTC'));
                        $interval = $dateTimeNow->diff($dateTime);
                        $secondsDiff = ($interval->days * 24 * 60 * 60) + ($interval->h * 60 * 60) + ($interval->i * 60) + $interval->s;

                        $diffIsGreater = $secondsDiff > $user_time_out;
                        $user_time_out_greater = $secondsDiff > $driver_time_out;

                        if($booking->booking_status == 1001 && $config->retry_ride_request == 1 && $user_time_out_greater){
                            setS3Config($booking->Merchant);

                            $this->retryRideRequest($booking, $config, $string_file, 1);

                            \Log::channel('per_minute_cron_log')->emergency([
                                "cron_for" => "( retry_ride_request )",
                                "booking_id" => $booking->id,
                                "ist_time" => Carbon::now("Asia/kolkata")->format("y-m-d H:i:s"),
                            ]);
                        }

                        if ($diffIsGreater) {
                            $booking->booking_status = 1018;  // expired booking
                            $new_status = [
                                'booking_status'=>$booking->booking_status,
                                'booking_timestamp'=>time(),
                                'latitude'=>"",
                                'longitude'=>"",
                                'from' => "expireInDriverAndTaxiBooking cron"
                            ];

                            $status_history = !empty(json_decode($booking->booking_status_history, true)) ? json_decode($booking->booking_status_history, true) : [];
                            $status_history[] = $new_status;
                            $booking->booking_status_history = json_encode($status_history);
                            $booking->save();

                            $segment_data = [
                                'id' => $booking->id,
                                'booking_status' => $booking->booking_status,
                            ];
                            $data = array('notification_type' => 'RIDE_EXPIRED', 'segment_type' => $booking->Segment->slag, 'segment_data' => $segment_data);
                            // $arr_param = array(
                            //     'user_id' => $booking->user_id,
                            //     'data'=>$data,
                            //     'message'=>trans("$string_file.ride_expired"),
                            //     'merchant_id'=>$booking->merchant_id,
                            //     'title' => '#'.$booking->merchant_booking_id .' '.trans("$string_file.ride_expired")
                            // );
                            // Onesignal::UserPushMessage($arr_param);
                        }
                    }

                endforeach;
            }
        }
        catch (\Exception $e){
            \Log::channel('per_minute_cron_log')->emergency([
                "cron_fn" => "( expireInDriverAndTaxiBooking )",
                "error" => $e->getMessage(),
                "time" => Carbon::now("Asia/kolkata")->format("y-m-d H:i:s"),
            ]);
        }
    }

    // expired all booked rides which are not accepted yet.
    public  function expireOldBookedRides()
    {
        $bookings = Booking::whereIn('booking_status', [1001])
            ->where([['booking_type', '=', 1]])
            ->whereNull('driver_id')
            ->get();
        try {
            $expired = [];
            foreach ($bookings as $booking):
                date_default_timezone_set($booking->CountryArea['timezone']);
                if ($booking->booking_type == '1') {
                    $user_request_timeout = $booking->Merchant->BookingConfiguration->user_request_timeout ?? 60;
                    $expire_at = $booking->booking_timestamp + $user_request_timeout;
                    $now = time();

                    if ($now >= $expire_at) {
                        $booking->booking_status = 1016;

                        if (in_array($booking->merchant_id, [976, 548, 1180])) {
                            $chat_platform_controller = new ChatPlatformController();
                            $resp = $chat_platform_controller->sendNotificationForN8n($booking);
                        }

                        $new_status = [
                            'booking_status'=>$booking->booking_status,
                            'booking_timestamp'=>time(),
                            'latitude'=>"",
                            'longitude'=>"",
                            'from' => "expireOldBookedRides cron"
                        ];

                        $status_history = !empty(json_decode($booking->booking_status_history, true)) ? json_decode($booking->booking_status_history, true) : [];
                        $status_history[] = $new_status;
                        $booking->booking_status_history = json_encode($status_history);

                        $booking->save();
                        array_push($expired, $booking->id);
                    }
                }
            endforeach;
        } catch (\Exception $e) {
            $log_data = [
                'exception' => $e->getMessage(),
                'cron_fn' => "expireOldBookedRides",
                'timestamp' => time(),
            ];
            \Log::channel('per_minute_cron_log')->emergency($log_data);
        }
    }

    public function expireOldAndNotifyScheduledBooking()
    {
//        try{
//            $bookings = Booking::select('id', 'user_id', 'segment_id', 'merchant_id', 'driver_id', 'merchant_booking_id', 'country_area_id', 'booking_type', 'later_booking_date', 'later_booking_time', 'booking_status', 'upcoming_notify', 'corporate_id')->whereIn('booking_status', [1001, 1012, 1019])->where([['booking_type', '=', 2]])->get();
//            if (!empty($bookings->toArray())) {
//                foreach ($bookings as $booking):
//                    $string_file = $this->getStringFile($booking->merchant_id);
//                    date_default_timezone_set($booking->CountryArea['timezone']);
//                    $later_booking_time = preg_replace('/[\x00-\x1F\x7F\xA0\x{2000}-\x{200F}\x{2028}-\x{202F}\x{205F}\x{3000}]/u', '', $booking->later_booking_time);
//                    $booking_time = $booking->later_booking_date . ' ' . $later_booking_time;
//                    $current_date_time = date('Y-m-d H:i');
//                    $can_send_ride = true;
//
//                    if ($booking->booking_status == 1019) {
//                        $configuration = BookingConfiguration::where([['merchant_id', '=', $booking->merchant_id]])->first();
//
//                        $date1 = date_create($booking_time);
//                        $date2 = date_create($current_date_time);
//                        $timestamp1 = $date1->getTimestamp();
//                        $timestamp2 = $date2->getTimestamp();
//
//                        $seconds_diff = $timestamp1 - $timestamp2;
//                        $minutes_diff = $seconds_diff / 60;
//
//                        if(!empty($booking->corporate_id)){
//                            $user_time_out = $configuration->user_request_timeout;
//                            $date1 = date_create($booking_time);
//                            date_modify($date1, "+$user_time_out seconds");
//
//
//                            $user = $booking->User;
//                            $user_detail = $user->UserDetail;
//                            $is_instant_ride = isset($booking->BookingDetail) && $booking->BookingDetail->is_instant_corporate_ride == 1;
//
//                            if( isset($user_detail) && $user_detail->need_approval_for_corporate == 1 && $user_detail->is_default_corporate_user != 1 && empty($booking->corporate_ride_approver)){
//                                $can_send_ride = false;
//                            }
//                            if(!$is_instant_ride){ // "Time remaining for later to send the ride"
//                                if($seconds_diff > 0)
//                                    $can_send_ride = false;
//                            }
//                        }
//
//                        if($minutes_diff <= $configuration->ride_later_on_admin_request_time && $minutes_diff >= 0 && empty($booking->driver_id)  && $can_send_ride){
//                            $booking = Booking::find($booking->id);
//                            setS3Config($booking->Merchant);
//                            $limit = getSendDriverRequestLimit($booking);
//                            if (!empty($configuration->driver_ride_radius_request)) {
//                                $ride_radius = json_decode($configuration->driver_ride_radius_request, true);
//                                if ($limit == 1) {
//                                    if (!empty($booking->ride_radius)) {
//                                        $booking_ride_radius = explode(',', $booking->ride_radius);
//                                        $remain_ride_radius_slot[] = $booking_ride_radius[0];
//                                    } else {
//                                        $remain_ride_radius_slot = $ride_radius;
//                                    }
//                                } elseif ($limit > 1) {
//                                    if (!empty($booking->ride_radius)) {
//                                        $booking_ride_radius = explode(',', $booking->ride_radius);
//                                        $remain_ride_radius = array_diff($ride_radius, $booking_ride_radius);
//                                        $remain_ride_radius_slot = array_values($remain_ride_radius);
//                                    } else {
//                                        $remain_ride_radius_slot = $ride_radius;
//                                    }
//                                }
//                            } else {
//                                $remain_ride_radius_slot = array();
//                            }
//                            if ($configuration->normal_ride_later_request_type == 1 && $configuration->ride_later_on_admin == 1) {
//                                $param = [
//                                    'area' => $booking->country_area_id,
//                                    'segment_id' => $booking->segment_id,
//                                    'latitude' => $booking->pickup_latitude,
//                                    'longitude' => $booking->pickup_longitude,
//                                    'distance' => !empty($remain_ride_radius_slot) ? $remain_ride_radius_slot[0] : null,
//                                    // 'distance' => $configuration->normal_ride_later_radius,
//                                    'limit' => $configuration->normal_ride_later_request_driver,
//                                    'service_type' => $booking->service_type_id,
//                                    'vehicle_type' => $booking->vehicle_type_id,
//                                    'payment_method_id' => $booking->payment_method_id,
//                                    'estimate_bill' => $booking->estimate_bill,
//                                    'user_gender' => $booking->gender,
//                                    'booking_id'=> $booking->id,
//                                    'call_google_api'=> true,
//                                    'calling_from_cron'=> 1
//                                ];
//                                date_default_timezone_set("UTC");
//                                $drivers = Driver::GetNearestDriver($param);
//                                if(empty($drivers)){
//                                    if (!empty($configuration->driver_ride_radius_request)) {
//                                        $remain_ride_radius_slot = json_decode($configuration->driver_ride_radius_request, true);
//                                        if (!empty($remain_ride_radius_slot) && is_array($remain_ride_radius_slot) && (($remain_ride_radius_slot[1] != null) || ($remain_ride_radius_slot[2] != null)) && empty($drivers)) {
//                                            $param['distance'] = $remain_ride_radius_slot[1];
//                                            $drivers = Driver::GetNearestDriver($param);
//                                            if (empty($drivers)) {
//                                                $param['distance'] = $remain_ride_radius_slot[2];
//                                                $drivers = Driver::GetNearestDriver($param);
//                                            }
//                                        }
//                                    }
//                                }
//                                if (!empty($drivers) && $drivers->count() > 0) {
//                                    $booking->booking_status = 1001;
//                                    $booking->save();
//                                    $findDriver = new FindDriverController();
//                                    $findDriver->AssignRequest($drivers, $booking->id);
//                                    $bookingData = new BookingDataController();
//                                    $bookingData->SendNotificationToDrivers($booking, $drivers);
//
//                                    $booking->upcoming_notify = 1;
//                                    $booking->save();
//                                }
//                            }
//                        }
//                        else{
//                            if($minutes_diff < 0){
//                                if(!empty($booking->corporate_id)){
//                                    if(isset($booking->BookingDetail) && $booking->BookingDetail->is_instant_corporate_ride == 1){
//                                        if(count($booking->BookingRequestDriver)  >  0 ){
//                                            $booking->booking_status = 1018;  //corporate instant
//                                            $booking->save();
//
//                                            BookingRequestDriver::where("booking_id", $booking->id)
//                                                ->where("request_status", 1)
//                                                ->update(["request_status" => 3]);
//                                            if(!empty($booking->Driver)){
//                                                $booking->Driver->save();
//                                                $booking->Driver()->update([
//                                                    'last_ride_request_timestamp' => date("Y-m-d H:i:s", time() - 100)
//                                                ]);
//                                            }
//
//                                        }
//                                        else{
//                                            $booking->booking_status = 1018;  //corporate instant
//                                            $booking->save();
//
//                                        }
//                                    }
//                                    else{
//                                        $booking->booking_status = 1018;  //corporate ride later
//                                        $booking->save();
//                                    }
//                                }
//                                else{
//                                    $booking->booking_status = 1018;  // expired booking normal
//                                    $booking->save();
//                                }
//
//                            }
//                        }
//                    } else {
//
//                        $config = BookingConfiguration::select('driver_request_timeout', 'user_request_timeout', 'driver_ride_radius_request', 'retry_ride_request')->where([['merchant_id', '=', $booking->merchant_id]])->first();
//                        $user_time_out = $config->user_request_timeout;
//                        $d1 = date_create($booking_time);
//                        date_modify($d1, "+$user_time_out seconds");
//                        $d2 = date_create($current_date_time);
//                        $t1 = $d1->getTimestamp();
//                        $t2 = $d2->getTimestamp();
//                        $sec_diff = $t1 - $t2;
//                        $min_diff = $sec_diff / 60;
//
//                        if ($min_diff <= 0) {
//                            $booking->booking_status = 1018;  // expired booking
//
//                            $new_status = [
//                                'booking_status'=>$booking->booking_status,
//                                'booking_timestamp'=>time(),
//                                'latitude'=>"",
//                                'longitude'=>"",
//                                'from' => "expireOldAndNotifyScheduledBooking cron for 1001"
//                            ];
//
//                            $status_history = !empty(json_decode($booking->booking_status_history, true)) ? json_decode($booking->booking_status_history, true) : [];
//                            $status_history[] = $new_status;
//                            $booking->booking_status_history = json_encode($status_history);
//
//                            $booking->save();
//                            // send notification to user to inform that his ride has expired
//
//                            $segment_data = [
//                                'id' => $booking->id,
//                                'booking_status' => $booking->booking_status,
//                            ];
//                            // $data = array('notification_type' => 'RIDE_EXPIRED','segment_type' => $booking->Segment->slag,'segment_data'=>$segment_data);
//                            // $arr_param = array(
//                            //     'user_id' => $booking->user_id,
//                            //     'data'=>$data,
//                            //     'message'=>trans("$string_file.ride_expired"),
//                            //     'merchant_id'=>$booking->merchant_id,
//                            //     'title' => '#'.$booking->merchant_booking_id .' '.trans("$string_file.ride_expired")
//                            // );
//                            // Onesignal::UserPushMessage($arr_param);
//
//                        } elseif ($booking->booking_status == 1012 && !empty($booking->driver_id)) {
//                            $config = BookingConfiguration::where([['merchant_id', '=', $booking->merchant_id]])->first();
//                            switch ($booking['service_type_id']) {
//                                case "1":
//                                    $seconds = $config->normal_ride_later_time_before;
//                                    break;
//                                case "2":
//                                    $seconds = $config->rental_ride_later_time_before;
//                                    break;
//                                case "3":
//                                    $seconds = $config->transfer_ride_later_time_before;
//                                    break;
//                                case "4":
//                                    $seconds = $config->outstation_time_before;
//                                    break;
//                                default:
//                                    $seconds = $config->normal_ride_later_time_before;
//                                    break;
//                            }
//                            $minutes = $seconds / 60;
//                            if (($minutes_diff - $config->upcoming_notification_time) == $minutes) {
//                                $bookingData = new BookingDataController();
//                                $bookingData->SendNotificationToDrivers($booking);
//                                event(new WebPushNotificationEvent($booking->merchant_id, [], 1, $booking->service_type_id, $booking, $string_file, "UPCOMING_RIDE"));
//                            }
//                        } elseif ($booking->booking_status == 1001 && empty($booking->driver_id) && $booking->upcoming_notify != 1) {
//                            $date1 = date_create($booking_time);
//                            date_modify($d1, "+$user_time_out seconds");
//                            $date2 = date_create($current_date_time);
//
//                            $date1->sub(new \DateInterval('PT30M'));
//                            if ($date2 > $date1) {
//                                $configuration = BookingConfiguration::where([['merchant_id', '=', $booking->merchant_id]])->first();
//                                $booking = Booking::find($booking->id);
//                                if ($configuration->normal_ride_later_request_type == 1 && $configuration->ride_later_on_admin == 1) {
//                                    $param = [
//                                        'area' => $booking->country_area_id,
//                                        'segment_id' => $booking->segment_id,
//                                        'latitude' => $booking->pickup_latitude,
//                                        'longitude' => $booking->pickup_longitude,
//                                        'distance' => $configuration->normal_ride_later_radius,
//                                        'limit' => $configuration->normal_ride_later_request_driver,
//                                        'service_type' => $booking->service_type_id,
//                                        'vehicle_type' => $booking->vehicle_type_id,
//                                        'payment_method_id' => $booking->payment_method_id,
//                                        'estimate_bill' => $booking->estimate_bill,
//                                        'user_gender' => $booking->gender,
//                                    ];
//                                    date_default_timezone_set("UTC");
//                                    $drivers = Driver::GetNearestDriver($param);
//                                    if (!empty($drivers) && $drivers->count() > 0) {
//                                        $bookingData = new BookingDataController();
//                                        $bookingData->SendNotificationToDrivers($booking, $drivers);
//                                    }
//                                }
//                            }
//                            $booking->upcoming_notify = 1;
//                            $booking->save();
//                        }
//                    }
//
//                endforeach;
//            }
//        } catch (\Exception $e) {
//            $message = $e->getMessage();
//            $log_data = [
//               'cron_function'=>'schedule_notify',
//                'message'=> $message
//           ];
//           \Log::channel('per_minute_cron_log')->emergency($log_data);
//        }

    /* ──────────────────────────────────────────────────────────────────────────
    *  New Version in app/Http/Controllers/Helper/BookingScheduleHelper
    * ──────────────────────────────────────────────────────────────────────────
    */

        try {
            $helper = new BookingScheduleHelper();
            $helper->processAll();
        } catch (\Exception $e) {
            \Log::channel('per_minute_cron_log')->emergency(["time"=> \Carbon\Carbon::now()->setTimezone("Asia/Kolkata")->format("Y-m-d H:i:s"), "error" => $e->getMessage()]);
        }
    }


    // expire old  accepted booking
    public function expireOldAcceptedBookings()
    {
        $all_bookings = Booking::select('id', 'merchant_id', 'segment_id', 'later_booking_date', 'later_booking_time', 'country_area_id', 'driver_id', 'booking_status', 'segment_id', 'user_id')
            //            ->whereHas('Merchant', function ($q) {
            //                $q->whereHas('BookingConfiguration', function ($query) {
            //                    $query->where('auto_cancel_expired_rides', 1);
            //                });
            //            })
            ->where([['booking_type', 2]])->whereIn('booking_status', [1012])->get();

        //        if ($all_bookings->isNotEmpty()):
        //            $booking_ids = $all_bookings->map(function ($item, $key) {
        //                date_default_timezone_set($item->CountryArea['timezone']);
        //                $now = new \DateTime();
        //                $booking_time = new \DateTime($item->later_booking_date . ' ' . $item->later_booking_time);
        //                return ($now > $booking_time) ? $item->id : null;
        //            })->filter()->values();
        //            if ($booking_ids->isNotEmpty()):
        //                Booking::whereIn('id', $booking_ids->toArray())
        //                    ->update([
        //                        'booking_status' => '1018', // Add as many as you need
        //                    ]);
        //                $all_bookings = Booking::whereIn("id",$booking_ids->toArray())->get();
        //                $bookingData = new BookingDataController();
        //                foreach ($all_bookings as $booking)
        //                {
        //                    $bookingData->SendNotificationToDrivers($booking);
        //                }
        //            endif;
        //        endif;

        foreach ($all_bookings as $booking):
            setLocal($booking->driver->language);
            $string_file = $this->getStringFile($booking->merchant_id);
            $minutes = 30; //minutes
            date_default_timezone_set($booking->CountryArea['timezone']);
            $booking_time = $booking->later_booking_date . ' ' . $booking->later_booking_time;
            $current_date_time = date('Y-m-d H:i');
            $date1 = date_create($booking_time);
            $date2 = date_create($current_date_time);
            $diff = date_diff($date1, $date2);
            $diff_minute = $diff->i;
            if ($current_date_time > $booking_time) {
                $segment_data = [
                    'id' => $booking->id,
                    'booking_status' => $booking->booking_status,
                ];
                if (!empty($booking->driver_id)) {
                    $data = array('booking_id' => $booking->id, 'notification_type' => 'RIDE_EXPIRED', 'segment_type' => $booking->Segment->slag, 'segment_data' => $segment_data);
                    $arr_param = array(
                        'driver_id' => $booking->driver_id,
                        'data' => $data,
                        'message' => trans("$string_file.ride_expired"),
                        'merchant_id' => $booking->merchant_id,
                        'title' => '#' . $booking->merchant_booking_id . ' ' . trans("$string_file.ride_expired_title"),
                    );
                    Onesignal::DriverPushMessage($arr_param);
                }

                $data = array('notification_type' => 'RIDE_EXPIRED', 'segment_type' => $booking->Segment->slag, 'segment_data' => $segment_data);
                // $arr_param = array(
                //     'user_id' => $booking->user_id,
                //     'data'=>$data,
                //     'message'=>trans("$string_file.ride_expired"),
                //     'merchant_id'=>$booking->merchant_id,
                //     'title' => '#'.$booking->merchant_booking_id .' '.trans("$string_file.ride_expired_title")
                // );
                // Onesignal::UserPushMessage($arr_param);
                $booking->booking_status = 1018;  // expired booking
                $booking->save();
            } elseif ($diff_minute == $minutes) {
                if (!empty($booking->driver_id)) {
                    $segment_data = [
                        'id' => $booking->id,
                        'booking_status' => $booking->booking_status,
                    ];
                    $data = array('booking_id' => $booking->id, 'notification_type' => 'UPCOMING_RIDE', 'segment_type' => $booking->Segment->slag, 'segment_data' => $segment_data);
                    $arr_param = array(
                        'driver_id' => $booking->driver_id,
                        'data' => $data,
                        'message' => trans("$string_file.upcoming_ride_at") . ' ' . $booking_time,
                        'merchant_id' => $booking->merchant_id,
                        'title' => '#' . $booking->merchant_booking_id . ' ' . trans("$string_file.new_upcoming_ride"),
                    );
                    Onesignal::DriverPushMessage($arr_param);
                }
            }
        endforeach;
    }

    // expire not accepted handyman orders
    public function expireNotAcceptedHandymanOrders()
    {
        $query = HandymanOrder::select('id', 'merchant_id', 'segment_id', 'drop_location', 'user_id', 'booking_date', 'booking_timestamp', 'service_time_slot_detail_id')
            ->with(['ServiceTimeSlotDetail' => function ($q) {
                $q->addSelect('id', 'to_time', 'from_time');
            }])->where([['order_status', '=', 1], ['created_at', '=', date('Y-m-d')]]);
        $arr_orders = $query->get();
        if ($arr_orders->isNotEmpty()):
            $arr_orders = $arr_orders->map(function ($item, $key) {
                date_default_timezone_set($item->CountryArea['timezone']);
                $job_expire_status = $this->calculateExpireTime(strtotime($item->ServiceTimeSlotDetail->from_time), $item->booking_timestamp, 'CRON');
                return $job_expire_status ? $item->id : NULL;
            })->filter()->values();
            if ($arr_orders->isNotEmpty()):

                $log_data = [
                    'handyman_order_id' => $arr_orders->toArray(),
                    'request_type' => "placed handyman order expire request"
                ];
                \Log::channel('per_minute_cron_log')->emergency($log_data);

                HandymanOrder::whereIn('id', $arr_orders->toArray())
                    ->update([
                        'order_status' => '8',
                    ]);
            endif;
        endif;
        $handman_orders = HandymanOrder::whereIn('id', $arr_orders->toArray())->get();
        foreach ($handman_orders as $order) {
            $request = (object)array('notification_type' => 'EXPIRE_ORDER');
            $this->sendNotificationToUser($request, $order);
        }
    }

    // expire placed orders
    public function expirePlacedOrders()
    {
        //  DB::beginTransaction();
        try {
            $all_orders = Order::select('id', 'business_segment_id', 'merchant_id', 'order_type', 'service_time_slot_detail_id', 'order_timestamp', 'country_area_id', 'driver_id', 'order_status', 'segment_id', 'user_id', 'order_date')
                ->whereIn('order_status', [1,4])->whereNot('order_type', 3)->get();
            // p($all_orders);
            $current_time_stamp = NULL;
            if ($all_orders->isNotEmpty()) {
                $order_ids = $all_orders->map(function ($item, $key) {
                    $config = BusinessSegmentConfigurations::where('business_segment_id', $item->business_segment_id)->first();
                    if ($item->segment_id == 3) { // for food
                        $current_time_stamp =  time();
                        // $config = BusinessSegmentConfigurations::where('business_segment_id', $item->business_segment_id)->first();
                        if (!empty($config)) {
                            $minute = $config->order_expire_time * 60;
                        } else {
                            $minute = 10 * 60;
                        }
                        $order_time = $item->order_timestamp;
                        $expire_order_time = $order_time + $minute; // 5 minutes after older placed
                    } else {

                        $current_time_stamp  = NULL;
                        $expire_order_time = "";
                        if (!empty($item->ServiceTimeSlotDetail)) {
                            date_default_timezone_set($item->BusinessSegment->CountryArea['timezone']);
                            $current_time_stamp =  time();

                            $slot_time = $item->ServiceTimeSlotDetail->to_time;
                            $expire_order_time = strtotime($item->order_date . ' ' . $slot_time);
                            if ($item->order_type == 1) {
                                // $config = BusinessSegmentConfigurations::where('business_segment_id', $item->business_segment_id)->first();
                                if (!empty($config)) {
                                    $minute = $config->order_expire_time * 60;
                                } else {
                                    $minute = 10 * 60;
                                }
                                $order_time = (int)$item->order_timestamp;
                                $expire_order_time = $expire_order_time + $minute;
                            }else{
                                if($item->order_type == 2 && isset($item->Merchant->BookingConfiguration->schedule_order_expired) && $item->Merchant->BookingConfiguration->schedule_order_expired == 1){
                                    if (!empty($config)) {
                                        $minute = $config->order_expire_time * 60;
                                    } else {
                                        $minute = 10 * 60;
                                    }
                                    $order_time = (int)$item->order_timestamp;
                                    $expire_order_time = $expire_order_time + $minute;
                                }
                            }
                            // p($item->id.' '.$item->order_date.' '.$slot_time,0);
                        } else {
                            date_default_timezone_set($item->BusinessSegment->CountryArea['timezone']);
                            $current_time_stamp =  time();
                            // $config = BusinessSegmentConfigurations::where('business_segment_id', $item->business_segment_id)->first();
                            if (!empty($config)) {
                                $minute = $config->order_expire_time * 60;
                            } else {
                                $minute = 10 * 60;
                            }
                            $order_time = (int)$item->order_timestamp;
                            $expire_order_time = $order_time + $minute;
                        }
                    }
                    return ($current_time_stamp > $expire_order_time) ? $item->id : null;
                })->filter()->values();
                // p($order_ids);
                // p('end');
                if ($order_ids->count() > 0) {
                    //                $log_data =[
                    //                    'order_id'=>$order_ids->toArray(),
                    //                    'request_type'=>"placed order expire request"
                    //                ];
                    //                \Log::channel('per_minute_cron_log')->emergency($log_data);

                    Order::whereIn('id', $order_ids->toArray())
                        ->update([
                            'order_status' => '12', //auto expired
                        ]);
                    $arr_orders = Order::
                    // select('id','merchant_id','merchant_order_id','order_status','segment_id','user_id','payment_method_id','payment_option_id')->
                    whereIn('id', $order_ids->toArray())->get();
                    //   p($arr_orders);
                    foreach ($arr_orders as $order) {
                        // p($order);
                        $this->sendNotificationToUser($order);
                        // p($order);
                        // refund credit to user wallet if payment done while placing order
                        // var_dump((!empty($order->payment_method_id) && in_array($order->payment_method_id,[2,4,3])));
                        // p('end');
                        if(!empty($order->payment_method_id) && $order->payment_method_id == 4){
                            $payment = new Payment();
                            $payment->RefundPaymentOption($order);
                        }
                        elseif (!empty($order->payment_method_id) && in_array($order->payment_method_id, [2,3])) {
                            $user = User::select('wallet_balance', 'id', 'merchant_id')->where('id', $order->user_id)->first();
                            $user->wallet_balance = $user->wallet_balance + $order->final_paid_amount;
                            $user->save();
                            // send wallet credit notification
                            $paramArray = array(
                                'user_id' => $user->id,
                                'merchant_id' => $user->merchant_id,
                                'booking_id' => NULL,
                                'amount' => $order->final_amount_paid,
                                'order_id' => $order->id,
                                'narration' => 11,
                                'platform' => 2,
                                'payment_method' => $order->payment_method_id,
                                'payment_option_id' => $order->payment_option_id,
                                'transaction_id' => NULL
                            );
                            // p($paramArray);
                            WalletTransaction::UserWalletCredit($paramArray);
                        }
                    }
                }
            }
            //  DB::commit();
        } catch (\Exception $e) {
            $message = $e->getMessage();
            DB::rollBack();
        }
    }

    // expire subscription
    public function expireSubscription()
    {
        try {
            $businessSegment = BusinessSegment::select('id', 'merchant_id', 'membership_plan_id', 'subscription_expired', 'order_based_on', 'subscription_date_timestamp')->where('order_based_on', 2)->whereNotNull('subscription_date_timestamp')->get();
            foreach ($businessSegment as $bs) {
                $membershipPlanId = $bs->membership_plan_id;
                $merchantPlan = MerchantMembershipPlan::where('id', $membershipPlanId)->first();
                $merchant_id = $merchantPlan->merchant_id;
                $period = $merchantPlan->period;  //in days
                $no_of_order = $merchantPlan->number_of_order;
                $subscriptionDate = $bs->subscription_date_timestamp;
                \Log::channel('per_minute_cron_log')->emergency(['bs_id' => $bs->id, 'merchant_id' => $bs->merchant_id, 'subscriptionDate' => $subscriptionDate]);
                $date = \Carbon\Carbon::createFromTimestamp($subscriptionDate);
                $expiryDateForSubscription = $date->addDays($period)->timestamp;
                $currentTimestamp = time();

                if ($currentTimestamp >= $expiryDateForSubscription) {
                    $bs->subscription_expired = 1; //1:expired 2:not expired
                    $bs->save();
                    $log_data = [
                        'subscription_expired' => $bs->subscription_expired,
                        'plan_id' => $membershipPlanId,
                        'period' => $period,
                        'merchant_id' => $merchant_id
                    ];
                    \Log::channel('per_minute_cron_log')->emergency($log_data);
                    $this->sendSubscriptionNotificationtoBs($merchantPlan, $bs);
                } else {
                    if ($merchantPlan->plan_type == 2) {
                        $all_orders = Order::select('id', 'business_segment_id', 'merchant_id', 'service_time_slot_detail_id', 'order_timestamp', 'country_area_id', 'driver_id', 'order_status', 'segment_id', 'user_id', 'order_date', 'final_amount_paid')
                            ->whereIn('order_status', [11])->where('merchant_id', $merchant_id)->where('order_timestamp', '>', $subscriptionDate)->get();
                        $countOrders = count($all_orders);
                        $max_amount = 0.00;
                        if (count($all_orders) > 0) {
                            $max_amount = array_sum(array_column($all_orders->toArray(), 'final_amount_paid'));
                        }
                        $log_data = [
                            'subscription_expired' => $bs->subscription_expired,
                            'plan_id' => $membershipPlanId,
                            'period' => $period,
                            'merchant_id' => $merchant_id,
                            'no_of_order' => $merchantPlan->number_of_order,
                        ];
                        \Log::channel('per_minute_cron_log')->emergency($log_data);
                        if ($countOrders >= $merchantPlan->number_of_order) {
                            $bs->subscription_expired = 1;
                            $bs->save();
                            \Log::channel('per_minute_cron_log')->emergency($bs);
                            $this->sendSubscriptionNotificationtoBs($merchantPlan, $bs);
                        } elseif ($max_amount >= $merchantPlan->max_amount_valid) {
                            $this->sendSubscriptionNotificationtoBs($merchantPlan, $bs, $max_amount);
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            $message = $e->getMessage();
            DB::rollBack();
        }
    }



    public function testCron()
    {
        \Log::channel('onesignal')->emergency(array(
            "text" => "Hello",
            "message" => "Your most welcome!"
        ));
    }

    // ride quest from whatsapp
    public function expireNewRequestedRides()
    {
        $bookings = Booking::select('id', 'merchant_id', 'driver_id', 'merchant_booking_id', 'country_area_id', 'booking_status', 'created_at', 'bill_details', 'estimate_bill', 'whatsapp_process_step', 'final_amount_paid')
            ->where([
                ['platform', '=', 3],
                ['booking_type', '=', 1],
            ])
            ->whereIn('whatsapp_process_step', [0, 1, 2]) // Check for whatsapp_process_step 0, 1, 2, or 3
            ->get();

        if (!$bookings->isEmpty()) {
            $minutes = 1; //minutes
            $log_data = [
                'booking_id' => $bookings->toArray(),
                'request_type' => "whatsapp booking"
            ];

            foreach ($bookings as $booking) {
                $string_file = $this->getStringFile($booking->merchant_id);
                $merchant = MerchantWhatsApp::where('merchant_id', $booking->merchant_id)->where('is_active', 1)->first();
                if (empty($merchant)) {
                    continue;
                }
                $currency = $booking->CountryArea->Country->isoCode;
                $whatsApp = new WhatsappController;
                $userPhone = DB::table('bookings')
                    ->join('users', 'bookings.user_id', '=', 'users.id')
                    ->where('bookings.id', $booking->id)
                    ->value('users.UserPhone');

                \Log::channel('per_minute_cron_log')->emergency($userPhone);

                if ($booking->booking_status == 1003) {
                    if (isset($userPhone) && !empty($userPhone)) {
                        $data['msg']        = "🚗 *Your driver has arrived!*\n\n"
                            . "The driver is now at your pickup location. Please head outside to meet them. 😊\n"
                            . "Have a great ride! 🚖";
                        $data['account_id'] = $merchant->sid;
                        $data['auth_token'] = $merchant->token;
                        $data['from']       = $merchant->from;
                        $data['WaId']       = 'whatsapp:' . $userPhone;
                        \Log::channel('per_minute_cron_log')->emergency($data);
                        $whatsApp->sendWhatsApp($data);
                        DB::table('bookings')
                            ->where('id', $booking->id)
                            ->update(['whatsapp_process_step' => 1]);
                    }
                } elseif ($booking->booking_status == 1004) {
                    if (isset($userPhone) && !empty($userPhone)) {
                        $data['msg']        = "🚖 *Your ride has started!*\n\n"
                            . "You’re on your way! Sit back, relax, and enjoy the ride. 😊\n"
                            . "Safe travels! 🛣️";
                        $data['account_id'] = $merchant->sid;
                        $data['auth_token'] = $merchant->token;
                        $data['from']       = $merchant->from;
                        $data['WaId']       = 'whatsapp:' . $userPhone;
                        \Log::channel('per_minute_cron_log')->emergency($data);
                        $whatsApp->sendWhatsApp($data);
                        DB::table('bookings')
                            ->where('id', $booking->id)
                            ->update(['whatsapp_process_step' => 2]);
                    }
                } elseif ($booking->booking_status == 1005) {
                    \Log::channel('per_minute_cron_log')->emergency("completed");
                    \Log::channel('per_minute_cron_log')->emergency($booking->User);
                    if (isset($userPhone) && !empty($userPhone)) {
                        $data['msg']        = "🎉 Ride Completed!\n\n"
                            . "Thank you for riding with us! 🛺\n\n"
                            . "Here’s the final breakdown of your ride charges:\n"
                            . "📊 Final Amount: $currency . $booking->final_amount_paid\n\n"
                            . "Please proceed to pay the final amount at your convenience. 💳\n"
                            . "If you need any assistance, feel free to reach out. 🙌\n\n"
                            . "Thanks again and have a great day! 😊";
                        $data['account_id'] = $merchant->sid;
                        $data['auth_token'] = $merchant->token;
                        $data['from']       = $merchant->from;
                        $data['WaId']       = 'whatsapp:' . $userPhone;
                        \Log::channel('per_minute_cron_log')->emergency($data);
                        $whatsApp->sendWhatsApp($data);
                        DB::table('bookings')
                            ->where('id', $booking->id)
                            ->update(['whatsapp_process_step' => 3]);
                    }
                }
            }
        }
    }

    public function rejectOrderRequest()
    {
        $all_orders = BookingRequestDriver::select('id', 'order_id', 'request_status', 'driver_id', 'created_at')->where('order_id', '!=', NULL)
            ->where('request_status', 1)->get();
        // p($all_orders);
        if ($all_orders->isNotEmpty()) {
            $order_ids = $all_orders->map(function ($item, $key) {
                $current_time_stamp = time();
                $expire_order_time = (strtotime($item->created_at) + 60); // after 60 sec
                return ($current_time_stamp > $expire_order_time) ? $item->id : null;
            })->filter()->values();
            // p($order_ids);
            if ($order_ids->count() > 0) {
                $log_data = [
                    'order_id' => $order_ids->toArray(),
                    'request_type' => "order request reject"
                ];
                \Log::channel('per_minute_cron_log')->emergency($log_data);
                BookingRequestDriver::whereIn('id', $order_ids->toArray())
                    ->update([
                        'request_status' => 3, //request expired or rejected automatically
                    ]);
            }
        }
    }

    public function notifyHandymanOrders()
    {
        $query = HandymanOrder::select('id', 'merchant_id', 'segment_id', 'driver_id', 'country_area_id', 'drop_location', 'user_id', 'booking_date', 'booking_timestamp', 'service_time_slot_detail_id', 'order_status')
            ->with(['ServiceTimeSlotDetail' => function ($q) {
                $q->addSelect('id', 'to_time', 'from_time');
            }])->where([['order_status', '=', 4], ['booking_date', '=', date('Y-m-d')]]);
        $arr_orders = $query->get();
        foreach ($arr_orders as $order) {
            date_default_timezone_set($order->CountryArea['timezone']);
            $from_time = date('Y-m-d H:i', strtotime($order->ServiceTimeSlotDetail->from_time));
            $to_time = date('Y-m-d H:i');
            $notify_time = date('Y-m-d H:i', strtotime($from_time . ' -1 hour'));
            if (strtotime($notify_time) == strtotime($to_time)) {
                $time = date('h:i a', strtotime($order->ServiceTimeSlotDetail->from_time));
                $string_file = $this->getStringFile($order->merchant_id);
                // reminder notification driver
                $segment_data = [
                    'id' => $order->id,
                    'order_status' => $order->order_status,
                ];
                $data = array('order_id' => $order->id, 'notification_type' => 'HANDYMAN_ORDER_REMINDER', 'segment_type' => $order->Segment->slag, 'segment_data' => $segment_data);
                $arr_param = array(
                    'driver_id' => $order->driver_id,
                    'data' => $data,
                    'message' => trans("$string_file.upcoming_order_reminder"),
                    'merchant_id' => $order->merchant_id,
                    'title' => trans("$string_file.upcoming_order_reminder_msg") . ' ' . $time,
                );
                Onesignal::DriverPushMessage($arr_param);
            }
        }
    }

    public function checkDriverAssignedForRideAdminLater()
    {
        $bookings = Booking::select('id', 'user_id', 'segment_id', 'merchant_id', 'driver_id', 'merchant_booking_id', 'country_area_id', 'booking_type', 'later_booking_date', 'later_booking_time', 'booking_status', 'upcoming_notify', 'booking_timestamp')
            ->whereIn('booking_status', [1001, 1007])
            ->where('booking_type', 2)
            ->where('ride_later_via_admin', 1)->get();
        if (!empty($bookings->toArray())) {
            foreach ($bookings as $booking) {
                $string_file = $this->getStringFile($booking->merchant_id);
                date_default_timezone_set($booking->CountryArea['timezone']);
                $booking_time = $booking->later_booking_date . ' ' . $booking->later_booking_time;
                $current_date_time = date('Y-m-d H:i');

                $date1 = date_create($booking_time);
                $date1->modify('-60 minutes');
                $date2 = date_create($current_date_time);
                $timestamp1 = $date1->getTimestamp();
                $timestamp2 = $date2->getTimestamp();


                if (empty($booking->driver_id) && $timestamp2 < $timestamp1) {
                    $booking->booking_status = 1019;
                    $booking->upcoming_notify = 0;
                    $booking->save();
                }
            }
        }
    }


    // expire bus bookings
     public function busBooking()
     {
         $this->expireBusBooking();
//         $this->notifyUserUpcomingBooking();
         $this->notifyDriverUpcomingBooking();
    //     //        $this->notifyMerchantForAllocateBusBookingDriver();
     }

     public function expireBusBooking()
     {
          DB::BeginTransaction();
         try {
             $bus_bookings = BusBookingMaster::where("status", 1)->get();
             $updated_ids = [];
             foreach ($bus_bookings as $bus_booking) {//                     dd($date2 > $date1);
                 date_default_timezone_set($bus_booking->BusRoute->CountryArea['timezone']);
                 $booking_time = $bus_booking->booking_date . ' ' . $bus_booking->ServiceTimeSlotDetail->from_time;
                 $current_date_time = date('Y-m-d H:i:s');
                 $date1 = date_create($booking_time);
                 $date1->modify('+30 minute');
                 $booking_time = $date1->format("Y-m-d H:i:s");
                 $date2=date_create($current_date_time);
                 $diff=date_diff($date1,$date2);
                 if ($date2 > $date1) {
                     $bus_booking->status = 5; // Expired
                     $bus_booking->save();
                     $bookings = BusBooking::where("bus_booking_master_id", $bus_booking->id)->where("status", 1)->get();
                     foreach ($bookings as $booking) {
                         $booking->status = 5; // Admin Cancelled / Expired
                         $booking->save();
                         array_push($booking->id, $updated_ids);

                         $this->notifyBusBookingUser($booking, "BUS_BOOKING_MASTER_CANCEL");

                         $paramArray = array(
                             'merchant_id' => $bus_booking->merchant_id,
                             'user_id' => $booking->user_id,
                             'bus_booking_id' => $booking->id,
                             'amount' => $booking->total_amount,
                             'narration' => 9,
                             'platform' => 1,
                             'payment_method' => 2,
                         );
                         WalletTransaction::UserWalletCredit($paramArray);
                     }
                 }
             }
             
             $log_data = [
                 'updated_ids' => $updated_ids,
                 'cron_fn' => "expireBusBooking",
                 'timestamp' => now()->format('Y-m-d H:i:s'),
             ];
         } catch (\Exception $e) {
             $log_data = [
                 'exception' => $e->getMessage(),
                 'cron_fn' => "expireBusBooking",
                 'timestamp' => now()->format('Y-m-d H:i:s'),
             ];
             \Log::channel('per_minute_cron_log')->emergency($log_data);
              DB::rollback();
         }
          DB::commit();
     }

     public function notifyDriverUpcomingBooking()
     {
          DB::BeginTransaction();
         try {
             $bus_bookings = BusBookingMaster::where("status", 1)->whereNull("notify_status")->whereNotNull("driver_id")->get();
             $updated_ids = [];
             foreach ($bus_bookings as $bus_booking) {
                 date_default_timezone_set($bus_booking->BusRoute->CountryArea['timezone']);
                 $booking_time = $bus_booking->booking_date . ' ' . $bus_booking->ServiceTimeSlotDetail->from_time;
                 $current_date_time = date('Y-m-d H:i:s');
                 $date1 = date_create($booking_time);
                 $date1->modify('-30 minute');
                 $date2=date_create($current_date_time);
                 $booking_time = $date1->format("Y-m-d H:i:s");
                 if ($date2 > $date1) {
                     $bus_booking->notify_status = 1; // Notify status
                     $bus_booking->save();
                    array_push($bus_booking->id, $updated_ids);
                     $this->notifyBusBookingDriver($bus_booking, "BOOKING_NOTIFY");
                 }
             }
             $log_data = [
                 'updated_ids' => $updated_ids,
                 'cron_fn' => "notifyDriverUpcomingBooking",
                 'timestamp' => now()->format('Y-m-d H:i:s'),
             ];
         } catch (\Exception $e) {
             //            p($e->getMessage());
             $log_data = [
                 'exception' => $e->getMessage(),
                 'cron_fn' => "notifyDriverUpcomingBooking",
                 'timestamp' => now()->format('Y-m-d H:i:s'),
             ];
             \Log::channel('per_minute_cron_log')->emergency($log_data);
              DB::rollback();
         }
          DB::commit();
     }

    // public function notifyUserUpcomingBooking()
    // {
    //     // DB::BeginTransaction();
    //     try {
    //         $bookings = BusBooking::where("status", 1)->whereNull("notify_status")->get();
    //         foreach ($bookings as $booking) {
    //             date_default_timezone_set($booking->BusBookingMaster->BusRoute->CountryArea['timezone']);
    //             $booking_time = $booking->BusBookingMaster->booking_date . ' ' . $booking->BusBookingMaster->ServiceTimeSlotDetail->from_time;
    //             $current_date_time = date('Y-m-d H:i:s');
    //             $date1 = date_create($booking_time);
    //             $date1->modify('-30 minute');
    //             $booking_time = $date1->format("Y-m-d H:i:s");
    //             $date2=date_create($current_date_time);
    //             if ($date2 > $date1) {
    //                 $booking->notify_status = 1; // Notify status
    //                 $booking->save();

    //                 $this->notifyBusBookingUser($booking, "BUS_BOOKING_NOTIFY");
    //             }
    //         }
    //     } catch (\Exception $e) {
    //         //            p($e->getMessage());
    //         $log_data = [
    //             'exception' => $e->getMessage(),
    //             'cron_fn' => "notifyUserUpcomingBooking",
    //             'timestamp' => now()->format('Y-m-d H:i:s'),
    //         ];
    //         \Log::channel('per_minute_cron_log')->emergency($log_data);
    //         // DB::rollback();
    //     }
    //     // DB::commit();
    // }

    //    public function notifyMerchantForAllocateBusBookingDriver(){
    //
    //    }


    public function clearTelescopeEntries(): void
    {
        if (!Schema::hasTable('telescope_entries')) {
            return;
        }

        $batchSize = 1000;
        $totalDeleted = 0;

        do {
            $deleted = DB::table('telescope_entries')
                ->where('created_at', '<', now()->subHours(1))
                ->limit($batchSize)
                ->delete();

            $totalDeleted += $deleted;
        } while ($deleted > 0);
    }


    public function updateLatLonForDriver(): void
    {
        try {

            // every 10th minute (00, 10, 20)
            if ((int) now()->format('i') % 10 !== 0) {
                return;
            }

            $cursor = null;
            $pattern = 'driver_location:*';
            $updated_driver_ids = 0;

            do {
                [$cursor, $keys] = Redis::scan($cursor ?: 0, [
                    'match' => $pattern,
                    'count' => 100,
                ]);
                foreach ($keys as $key) {
                    $data = Redis::hgetall($key);
                    if (!isset($data['driver_id'], $data['latitude'], $data['longitude'])) continue;

                    $driverId = (int) $data['driver_id'];
                    $latitude = $data['latitude'];
                    $longitude = $data['longitude'];

                    DB::table('drivers')
                        ->where('id', $driverId)
                        ->update([
                            'current_latitude' => $latitude,
                            'current_longitude' => $longitude,
                        ]);
                    $updated_driver_ids++;
                }
            } while ($cursor != 0);

            $log_data = [
                'updated_driver_ids' => $updated_driver_ids,
                'cron_fn' => "updateLatLonForDriver (Updated  Location From Redis)",
                'timestamp' => now()->format('Y-m-d H:i:s'),
            ];
            \Log::channel('per_minute_cron_log')->emergency($log_data);
        } catch (\Exception $e) {
            $log_data = [
                'exception' => $e->getMessage(),
                'cron_fn' => "DriveLatLng",
                'timestamp' => now()->format('Y-m-d H:i:s'),
            ];
            \Log::channel('per_minute_cron_log')->emergency($log_data);
        }
    }


    public function activateAndExpireSubscriptionForDriver()
    {
        $subscriptionPackage = SubscriptionPackage::where([['package_for', "=", 2], ['status', '=', 1]])->get();
        foreach ($subscriptionPackage as $package) {
            $driver_record = new DriverSubscriptionRecord;
            $merchant_id = $package->merchant_id;
            $string_file = $this->getStringFile($merchant_id);
            if ($package->package_type == 3) {
                $vehicle_type_id = $package->vehicle_type_id;
                $package_duration = PackageDuration::find($package->package_duration_id);
                $days = $package_duration->sequence; // number of days
                $duration_data = ['start_date_time' => date('Y-m-d H:i:s'), 'end_date_time' => (new \DateTime(date('Y-m-d H:i:s')))->modify("+$days day")->format('Y-m-d H:i:s')];

                // get active package of driver
                $active_package = DriverSubscriptionRecord::where('package_type', 3)->where('segment_id', $package->segment_id)->where('status', 2)->where('end_date_time', ">=", date('Y-m-d'))->orderBy('id', 'DESC')->first();
                if($active_package){
                    $driver_id = $active_package->driver_id;
                    $driver = Driver::where('id', $driver_id)->first();
                    $wallet_money = !empty($driver->wallet_money) ? $driver->wallet_money : 0;
                    $wallet_money_times = $package->min_wallet_subscription ?? 3;
                    $packageChargeLimit = $wallet_money_times * $package->price;
                    if (($wallet_money <= -($packageChargeLimit)) && !empty($driver->Configuration->subscription_package_type) && $driver->Configuration->subscription_package_type == 3) {
                        $driver->online_offline = 2;
                        $driver->save();
                        // $data = array('booking_id' => "", 'notification_type' => 'ONLINE_OFFLINE', 'segment_type' => "ONLINE_OFFLINE", 'segment_data' => 1, 'notification_gen_time' => time());
                        // $arr_param = array(
                        //     'driver_id' => $driver->id,
                        //     'data' => $data,
                        //     'message' => trans("$string_file.daily_limit_exceeded_wallet_amount_now_offline"),
                        //     'merchant_id' => $driver->merchant_id,
                        //     'title' => trans("$string_file.offline_now")
                        // );
                        // Onesignal::DriverPushMessage($arr_param);
                    }
                }
            }
        }
    }
    public function Subscribe_product_place()
    {
        try {
            // Fetch all active subscriptions with required relationships eager loaded
            $subscriptions = UserSubscriptionRecord::with('User.CountryArea')
                ->where('status', 1)
                ->whereNotNull('product_id')
                ->get();

            // Group subscriptions by user_id
            $subscriptionsGrouped = $subscriptions->groupBy('user_id');

            foreach ($subscriptionsGrouped as $userId => $userSubscriptions) {
                $user = $userSubscriptions->first()->User;
                $timezone = $user->CountryArea->timezone ?? 'UTC';
                $wallet_balance = $user->wallet_balance;
                if ($wallet_balance > 0) {
                    // Get today's date in user's timezone
                    $todayInUserTz = Carbon::now(new CarbonTimeZone($timezone))->toDateString();

                    $lastOrder = Order::where('user_id', $userId)
                        ->where('order_type', 3)
                        ->orderByDesc('id')
                        ->first();

                    $allowOrder = true;

                    if ($lastOrder) {
                        $lastOrderTime = Carbon::parse($lastOrder->created_at);
                        $nowTime = Carbon::now(new CarbonTimeZone($timezone));

                        if ($lastOrderTime->diffInHours($nowTime) < 24) {
                            $allowOrder = false;
                        }
                    }

                    if (!$allowOrder) {
                        continue; // skip to next user
                    }

                    // Filter subscriptions that should start today or earlier
                    $dueSubscriptions = $userSubscriptions->filter(function ($subscription) use ($timezone, $todayInUserTz) {
                        $startDateUtc = Carbon::parse($subscription->start_date, 'UTC');
                        $startDateInUserTz = $startDateUtc->copy()->setTimezone(new CarbonTimeZone($timezone));
                        return $startDateInUserTz->toDateString() <= $todayInUserTz;
                    });
                    $user_order = [];
                    if ($dueSubscriptions->isNotEmpty()) {
                        foreach ($dueSubscriptions as $subscription) {
                            $business_segment_id = $subscription->ProductVariant->Product->business_segment_id;
                            $segment_id = $subscription->ProductVariant->Product->segment_id;
                            $merchant_id = $subscription->ProductVariant->Product->merchant_id;
                            $country_area_id = $subscription->ProductVariant->Product->BusinessSegment->country_area_id;
                            if ($subscription->selected_plan == 1) {
                                $total_price = $subscription->ProductVariant->ProductInventory->product_selling_price * (int)$subscription->day_quantity;
                                if ($wallet_balance >= $total_price) {
                                    $user_order[] = ['segment_id' => $segment_id, 'merchant_id' => $merchant_id, 'business_segment_id' => $business_segment_id, 'country_area_id' => $country_area_id, 'product_id' => $subscription->product_id, 'quantity' => (int)$subscription->day_quantity, 'in_stock' => $subscription->ProductVariant->ProductInventory->current_stock >= (int)$subscription->day_quantity ? true : false, 'price' => $subscription->ProductVariant->ProductInventory->product_selling_price, 'total_price' => $total_price];
                                }
                            } elseif ($subscription->selected_plan == 2) {
                                $raw = $subscription->day_quantity;

                                // Step 1: Strip outer quotes and unescape
                                $cleaned = stripslashes($raw);

                                // Step 2: Decode cleaned JSON
                                $dayQuantityArray = json_decode($cleaned, true);

                                // Step 3: Handle any errors
                                if (json_last_error() !== JSON_ERROR_NONE) {
                                    // dd('JSON decode error: ' . json_last_error_msg(), $cleaned);
                                    \Log::channel('per_minute_cron_log')->emergency([
                                        'exception' => 'JSON decode error: ' . json_last_error_msg(),
                                        'cron_fn'   => "Subscribe_product_place",
                                        'timestamp' => now()->toDateTimeString(),
                                    ]);
                                }

                                $todayDay = strtolower(Carbon::now(new \DateTimeZone($timezone))->format('D'));

                                $hasToday = false;

                                foreach ($dayQuantityArray as $dayQuantity) {
                                    if (
                                        isset($dayQuantity['day'], $dayQuantity['quantity']) &&
                                        strtolower($dayQuantity['day']) === $todayDay &&
                                        $dayQuantity['quantity'] > 0
                                    ) {
                                        $hasToday = true;
                                        break;
                                    }
                                }

                                if ($hasToday) {
                                    $total_price = $subscription->ProductVariant->ProductInventory->product_selling_price * (int)$dayQuantity['quantity'];
                                    if ($wallet_balance >= $total_price) {

                                        $user_order[] = ['segment_id' => $segment_id, 'merchant_id' => $merchant_id, 'business_segment_id' => $business_segment_id, 'country_area_id' => $country_area_id, 'product_id' => $subscription->product_id, 'quantity' => (int)$dayQuantity['quantity'], 'in_stock' => $subscription->ProductVariant->ProductInventory->current_stock >= (int)$subscription->day_quantity ? true : false, 'price' => $subscription->ProductVariant->ProductInventory->product_selling_price, 'total_price' => $total_price];
                                    }
                                }
                            } elseif ($subscription->selected_plan == 3) {
                                $startDate = Carbon::parse($subscription->start_date, 'UTC')
                                    ->setTimezone(new \DateTimeZone($timezone))
                                    ->startOfDay();

                                $today = Carbon::now(new \DateTimeZone($timezone))->startOfDay();

                                $daysDiff = $startDate->diffInDays($today);

                                if ($daysDiff % 2 === 0) {
                                    $total_price = $subscription->ProductVariant->ProductInventory->product_selling_price * (int)$subscription->day_quantity;
                                    if ($wallet_balance >= $total_price) {
                                        $user_order[] = ['segment_id' => $segment_id, 'merchant_id' => $merchant_id, 'business_segment_id' => $business_segment_id, 'country_area_id' => $country_area_id, 'product_id' => $subscription->product_id, 'quantity' => (int)$subscription->day_quantity, 'in_stock' => $subscription->ProductVariant->ProductInventory->current_stock >= (int)$subscription->day_quantity ? true : false, 'price' => $subscription->ProductVariant->ProductInventory->product_selling_price, 'total_price' => $total_price];
                                    }
                                }
                            } elseif ($subscription->selected_plan == 4) {

                                $startDate = Carbon::parse($subscription->start_date, 'UTC')
                                    ->setTimezone(new \DateTimeZone($timezone))
                                    ->startOfDay();

                                $today = Carbon::now(new \DateTimeZone($timezone))->startOfDay();

                                // Compare day of month
                                if ($today->day === $startDate->day) {
                                    $total_price = $subscription->ProductVariant->ProductInventory->product_selling_price * (int)$subscription->day_quantity;
                                    if ($wallet_balance >= $total_price) {
                                        $user_order[] = ['segment_id' => $segment_id, 'merchant_id' => $merchant_id, 'business_segment_id' => $business_segment_id, 'country_area_id' => $country_area_id, 'product_id' => $subscription->product_id, 'quantity' => (int)$subscription->day_quantity, 'in_stock' => $subscription->ProductVariant->ProductInventory->current_stock >= (int)$subscription->day_quantity ? true : false, 'price' => $subscription->ProductVariant->ProductInventory->product_selling_price, 'total_price' => $total_price];
                                    }
                                }
                            }
                        }
                    }

                    // Step 1: Group orders by business_segment_id
                    $grouped = [];

                    foreach ($user_order as $order) {
                        $segment_id = $order['business_segment_id'];
                        $grouped[$segment_id][] = $order;
                    }

                    $result = [];

                    foreach ($grouped as $segment_id => $products) {
                        // Sort each segment's products by total_price ascending
                        usort($products, function ($a, $b) {
                            return $a['total_price'] <=> $b['total_price'];
                        });

                        $segment_products = [];
                        $total = 0;

                        foreach ($products as $product) {
                            if ($total + $product['total_price'] <= $wallet_balance) {
                                $segment_products[] = $product;
                                $total += $product['total_price'];
                            } else {
                                break;
                            }
                        }

                        if (!empty($segment_products)) {

                            $result[] = [
                                'segment_id' => $products[0]['segment_id'],
                                'business_segment_id' => $segment_id,
                                'merchant_id' => $products[0]['merchant_id'],
                                'country_area_id' => $products[0]['country_area_id'],
                                'products' => $segment_products,
                            ];
                        }
                    }

                    foreach ($result as  $data) {
                        $productDetails = [];
                        foreach ($data['products'] as $product) {
                            $productDetails[] = [
                                'product_variant_id' => $product['product_id'],
                                'quantity' => $product['quantity'],
                            ];
                        }

                        $address = $user->UserAddress->where('category', 1)->first() ?? [];
                        $payload = [
                            'cart_id' => '',
                            'empty_bottle_quantity' => 0,
                            'latitude' => $address->latitude ?? 0,
                            'longitude' => $address->longitude ?? 0,
                            'product_details' => json_encode($productDetails),
                            'product_update' => 'NO',
                            'product_variant_id' => 0,
                            'quantity' => 0,
                            'segment_id' => $data['segment_id'],
                            'service_type_id' =>  8,
                            'merchant_id' => $data['merchant_id'],
                        ];

                        setS3Config(Merchant::find($data['merchant_id']));
                        $request = new \Illuminate\Http\Request($payload);
                        $request->setUserResolver(function () use ($user) {
                            return $user;
                        });
                        $grocery = new GroceryController();
                        $res = ($grocery->saveProductCart($request))->getData();


                        if ($res->result == 1) {
                            $payload2 = [
                                'merchant_id' => $data['merchant_id'],
                                'cart_id' => $res->data->id,
                                'payment_method_id' => 3,
                                'segment_id' => $res->data->business_segment_id,
                                'address' => $address->address,
                                'service_type_id' => 8,
                                'latitude' => $address->latitude ?? 0,
                                'longitude' => $address->longitude ?? 0,
                            ];

                            $request = new \Illuminate\Http\Request($payload2);
                            $request->setUserResolver(function () use ($user) {
                                return $user;
                            });
                            $res = ($grocery->placeOrder($request))->getData();
                            if ($res->result == 1) {
                                $order = Order::find($res->data->order_id);
                                $order->order_type = 3;
                                $order->save();

                                \Log::channel('per_minute_cron_log')->emergency([
                                    'message' => 'Order Placed',
                                    'data'   => json_encode($res),
                                    'timestamp' => now()->toDateTimeString(),
                                ]);
                            }
                        }
                    }
                } else {
                    \Log::channel('per_minute_cron_log')->emergency([
                        'exception' => 'Low Balance',
                        'cron_fn'   => "Subscribe_product_place",
                        'timestamp' => now()->toDateTimeString(),
                    ]);
                }
            }
        } catch (\Exception $e) {
            \Log::channel('per_minute_cron_log')->emergency([
                'exception' => $e->getMessage(),
                'cron_fn'   => "Subscribe_product_place",
                'timestamp' => now()->toDateTimeString(),
            ]);
        }
    }

    public function StripePayput()
    {
        $payouts = StripePayout::where('status', 0)
            ->where('created_at', '<=', now()->subMinutes(5))
            ->get();

        \Log::info('🕔 Running StripePayput — Found payouts to process', [
            'count' => $payouts->count(),
        ]);

        foreach ($payouts as $payout) {
            \Log::info('⏳ Processing payout', [
                'id' => $payout->id,
                'amount' => $payout->amount,
                'currency' => $payout->currency,
                'stripe_account' => $payout->stripe_account,
            ]);

            if (StripeConnect::instant_payout($payout)) {
                $payout->update(['status' => 1]);

                \Log::info('✅ Payout successful', [
                    'id' => $payout->id,
                    'stripe_account' => $payout->stripe_account,
                ]);
            } else {
                $payout->update(['status' => 2]);

                \Log::warning('❌ Payout failed', [
                    'id' => $payout->id,
                    'stripe_account' => $payout->stripe_account,
                ]);
            }
        }
    }

    // public function CheckOrderStockUsingIQRetail(){
    //     try {

    //         $today = Carbon::now()->toDateString(); // e.g., '2025-07-07'
    //         $cacheRunCountKey = "order_stock_run_count_" . $today;
    //         $cacheLastRunKey = "order_stock_last_run_" . $today;
            
    //         $runCount = Cache::get($cacheRunCountKey, 0);
    //         $lastRun = Cache::get($cacheLastRunKey);
    //         //Check if run count already reached 4
    //         if ($runCount >= 4) {
    //             // echo 'runCount';
    //             return;
    //         }

    //         // Check if last run was within 6 hours
    //         if ($lastRun && Carbon::parse($lastRun)->diffInHours(now()) < 6) {
    //             // echo 'last_run';
    //             return;
    //         }
    //         $apiSuccess = false;
    //         $warehousebs = BusinessSegment::where('is_warehouse',1)->get();
    //         if($warehousebs){
    //             foreach($warehousebs as $warehouse){
    //                 $warehouseId = $warehouse->warehouse_unique_id;
    //                 $warehousebsId = $warehouse->id;
    //                 $url = 'http://197.242.64.139:8091/IQRetailRestAPI/v1/IQ_API_Request_Stock_Attributes?callformat=JSON';
    
    //                 $data = [
    //                     "IQ_API" => [
    //                         "IQ_API_Request_Stock" => [
    //                             "IQ_Company_Number" => $warehouseId,
    //                             "IQ_Terminal_Number" => 8091,
    //                             "IQ_User_Number" => 8091,
    //                             "IQ_User_Password" => "844D40C86D7E710EACFFB54F8CC6445D8D59A5C5",
    //                             "IQ_Partner_Passphrase" => ""
    //                         ]
    //                     ]
    //                 ];
                    
                    
    //                 $curl = curl_init();
    
    //                 curl_setopt_array($curl, [
    //                     CURLOPT_URL => $url,
    //                     CURLOPT_RETURNTRANSFER => true,
    //                     CURLOPT_ENCODING => '',
    //                     CURLOPT_MAXREDIRS => 10,
    //                     CURLOPT_TIMEOUT => 60,
    //                     CURLOPT_FOLLOWLOCATION => true,
    //                     CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    //                     CURLOPT_CUSTOMREQUEST => 'POST',
    //                     CURLOPT_POSTFIELDS => json_encode($data),
    //                     CURLOPT_HTTPHEADER => [
    //                         'Authorization: Basic OTk6QVBJVGVzdA==',
    //                         'Content-Type: application/json',
    //                     ],
    //                 ]);
        
    //                 $response = curl_exec($curl);
    //                 curl_close($curl);
                    
    //                 $result = json_decode($response, true);
    //                 \Log::channel('iq_retail')->emergency(['merchant_id'=>$warehouseId.' 1045','cron_api_1'=>'cron_api','api_response'=> json_encode($result),'current_time'=> time()]);
    //                 if(isset($result['iq_api_error'][0]['iq_error_code']) && $result['iq_api_error'][0]['iq_error_code'] == 0){
    //                     $stock_master = $result['iq_api_result_data']['iq_root_json']['stock_master'];
    //                     foreach($stock_master as $stockData){
    //                         $sku_id = $stockData['stock_code'];
    //                         $stock = $stockData['onhand'];
    //                         $index1_price = collect($stockData['sell_prices'])->firstWhere('index', 1);
    //                         if ($index1_price) {
    //                             $inclusive = $index1_price['inclusive'];
    //                             $exclusive = $index1_price['exclusive'];
    //                         }
    //                         $contain_bs = \App\Models\BusinessSegment\BusinessSegmentWareHouse::with('BusinessSegment')
    //                                     ->where('business_segment_warehouse_id', $warehousebsId)
    //                                     ->get();
                                
    //                         foreach($contain_bs as $bs){
    //                             $variant = \App\Models\BusinessSegment\ProductVariant::with(['Product','Product.BusinessSegment', 'ProductInventory'])
    //                                         ->whereHas('Product', function ($query) use ($bs) {
    //                                             $query->whereNull('delete')
    //                                                   ->where('business_segment_id', $bs->business_segment_id);
    //                                         })
    //                                         ->whereNull('delete')
    //                                         ->where('sku_id',$sku_id)->first();
    //                             if ($variant) {
    //                                     if ($variant->ProductInventory && round($variant->product_price, 2) == round($inclusive, 2) && round($variant->ProductInventory->product_selling_price, 2) == round($inclusive, 2) && $variant->ProductInventory->current_stock != $stock) {
    //                                         // Update stock
    //                                         $variant->ProductInventory->current_stock = $stock;
    //                                         $variant->ProductInventory->save();
    //                                     }
    //                             }
    //                         }
                            
    //                     }

    //                     $apiSuccess = true;
    //                 }else{
                        
    //                 }
    //             }
    //         }
            
    //             if($apiSuccess){
    //                 Cache::put($cacheRunCountKey, $runCount + 1, now()->endOfDay());
    //                 Cache::put($cacheLastRunKey, now()->toDateTimeString(), now()->endOfDay());
    //             }
    //         //}else{
    //             // Cache::put("order_stock_run_count_{$today}", 0, now()->endOfDay());
    //             // Cache::put("order_stock_last_run_{$today}", null, now()->endOfDay());
    //         //}
            
            
        
        
    //      } catch (\Exception $e) {
    //         \Log::channel('per_minute_cron_log')->emergency([
    //             'exception' => $e->getMessage(),
    //             'cron_fn'   => "Check Order Stack IQ RETAIL",
    //             'timestamp' => now()->toDateTimeString(),
    //         ]);
    //     }
    // }



    public function retryRideRequest($booking, $config, $string_file, $calling_from_cron = 2){

        $is_checked_for_area = true;
        $countryArea = CountryArea::find($booking->country_area_id);
        if(isset($countryArea->is_geofence) && $countryArea->is_geofence == 1){
            $is_checked_for_area = false;
        }
        $remain_ride_radius_slot = json_decode($config->driver_ride_radius_request, true);
        $dist = !empty($remain_ride_radius_slot) ? $remain_ride_radius_slot[1] : null;
        $already_last_slot = false;
        if($booking->ride_radius == $dist){
            $dist = !empty($remain_ride_radius_slot) ? $remain_ride_radius_slot[2] : null;
            $already_last_slot = true;
        }

        $req_parameter = [
            'area' => isset($booking->country_area_id) ? $booking->country_area_id : null,
            'segment_id' => isset($booking->segment_id) ? $booking->segment_id : null,
            'latitude' => isset($booking->pickup_latitude) ? $booking->pickup_latitude : null,
            'longitude' => isset($booking->pickup_longitude) ? $booking->pickup_longitude : null,
            'distance' => $dist,
            'limit' => $booking->BookingConfiguration->normal_ride_now_request_driver ?? null,
            'service_type' => isset($booking->service_type_id) ? $booking->service_type_id : null,
            'vehicle_type' => isset($booking->vehicle_type_id) ? $booking->vehicle_type_id : null,
            'baby_seat' => isset($booking->baby_seat_enable) ? $booking->baby_seat_enable : null,
            'gender_match' =>  isset($booking->gender) ? $booking->gender : null,
            'user_gender' => isset($booking->gender) ? $booking->gender : null,
            'drop_lat' => isset($booking->drop_latitude) ? $booking->drop_latitude : null,
            'drop_long' => isset($booking->drop_longitude) ? $booking->drop_longitude : null,
            'booking_id' => isset($booking->id) ? $booking->id : null,
            'calling_from_cron'=> $calling_from_cron,
            'wheel_chair' => isset($booking->wheel_chair_enable) ? $booking->wheel_chair_enable : null,
            'payment_method_id' => isset($booking->payment_method_id) ? $booking->payment_method_id : null,
            'estimate_bill' => isset($booking->estimate_bill) ? $booking->estimate_bill : null,
            'ac_nonac' => isset($booking->ac_nonac) ? $booking->ac_nonac : null,
            'string_file' => $string_file,
            'is_checked_for_area' => $is_checked_for_area
        ];

        $drivers = Driver::GetNearestDriver($req_parameter);
        if (empty($drivers) && !$already_last_slot) {
            $dist =  $remain_ride_radius_slot[2];
            $req_parameter['distance'] = $dist;
            $drivers = Driver::GetNearestDriver($req_parameter);
        }

        if(!empty($drivers)){
            $findDriver = new FindDriverController();
            $findDriver->AssignRequest($drivers,$booking->id);
            $booking->ride_radius = $dist;
            $booking->booking_timestamp = time();
            $booking->save();


            $bookingData = new BookingDataController();
            $bookingData->SendNotificationToDrivers($booking, $drivers,"", "", null);
        }
    }

    public function OfflineDriverMaxHoursOnline()
    {
        $merchantIds = BookingConfiguration::where('check_online_offline_time', 1)
            ->pluck('merchant_id');
    
        if ($merchantIds->isEmpty()) {
            return;
        }
    
        Driver::with([
            'Merchant.BookingConfiguration',
            'CountryArea'
        ])
        ->whereIn('merchant_id', $merchantIds)
        ->where('free_busy', 2) // free
        ->select('id', 'merchant_id', 'free_busy', 'online_offline', 'country_area_id')
        ->chunk(200, function ($drivers) {
            foreach ($drivers as $driver) {
                $string_file = $this->getStringFile($driver->merchant_id);
                $timezone = 'UTC';
                $startOfDay = Carbon::now($timezone)->startOfDay();
                $endOfDay   = Carbon::now($timezone)->endOfDay();
                $driverOnline = \App\Models\DriverOnlineTime::where('driver_id', $driver->id)
                    ->whereBetween('created_at', [$startOfDay, $endOfDay])
                    ->first();
                if (!$driverOnline) {
                    continue;
                }
                $maxHours = $driver->Merchant->BookingConfiguration->max_hours_for_online_driver ?? 12;
                $minimumRestHours = $driver->Merchant->BookingConfiguration->min_rest_hours_for_driver ?? 5;
                $totalMinutes = ($driverOnline->hours * 60) + $driverOnline->minutes;
                $time_intervals = $driverOnline->time_intervals;
                $countIntervals = count($driverOnline->time_intervals);
                $closedMinutes = 0;
                foreach ($time_intervals as $interval) {
                    if (!empty($interval['offline_time'])) {
                        // Only count closed sessions
                        $on  = Carbon::createFromFormat('d-m-Y H:i', $interval['online_time']);
                        $off = Carbon::createFromFormat('d-m-Y H:i', $interval['offline_time']);
                        $closedMinutes += $on->diffInMinutes($off);
                    }
                }
                
                $lastInterval = $time_intervals[$countIntervals - 1];
                $lastOfflineTime = $lastInterval['offline_time'] ?? null;
                $lastOnlineTime  = $lastInterval['online_time'];

                $secondLastInterval  = $time_intervals[$countIntervals - 2] ?? null;
                $lastOfflineSecondTime = $secondLastInterval['offline_time'] ?? null;

                 // =====================================================
                //Check if driver completed rest after max hours
                // If yes, skip this driver - they are allowed to be online
                // =====================================================
                if ($closedMinutes >= $maxHours * 60) {
                    // Driver has already hit max hours in closed sessions
                    // Check if last interval has offline_time (they rested)
                    if (!empty($lastOfflineSecondTime)) {
                        $lastOffline     = Carbon::createFromFormat('d-m-Y H:i', $lastOfflineSecondTime, 'UTC');
                        $currentTime     = Carbon::now('UTC');
                        $restedMinutes   = $lastOffline->diffInMinutes($lastOnlineTime);
                        $minimumRestMins = $minimumRestHours * 60;
                        if ($restedMinutes >= $minimumRestMins) {
                            // Driver has completed rest - they are allowed online
                            // Skip this driver, do not force offline
                            continue;
                        }
                    }
                }

                // Current open session
                if (!empty($lastOfflineTime)) {
                    $totalTimeInMin = $closedMinutes;
                } else {
                    date_default_timezone_set('UTC');
                    $givenTime      = Carbon::createFromFormat('d-m-Y H:i', $lastOnlineTime, 'UTC');
                    $currentTime    = Carbon::now('UTC');
                    $diffInMinutes  = $givenTime->diffInMinutes($currentTime);
                    $totalTimeInMin = $closedMinutes + $diffInMinutes;
                }
                if ($totalTimeInMin >= $maxHours * 60) {
                    $modify = $driverOnline->time_intervals;
                    $last_one = end($modify);
                    if(empty($last_one['offline_time'])){
                        $driver->online_offline = 2;
                        $driver->save();
                        $last_one['offline_time'] = Carbon::now('UTC')->format('d-m-Y H:i');
                        $last_one['hours'] = (new DateTime($last_one['offline_time']))->diff((new DateTime($last_one['online_time'])))->format('%H');
                        $last_one['minutes'] = (new DateTime($last_one['offline_time']))->diff((new DateTime($last_one['online_time'])))->format('%i');
            
                        array_pop($modify);
                        array_push($modify, $last_one);
            
                        $driverOnline->time_intervals = $modify;
                        $driverOnline->hours = array_sum(array_column($modify, 'hours'));
                        $driverOnline->minutes = array_sum(array_column($modify, 'minutes'));
                        if($driverOnline->minutes > 60):
                            ++$driverOnline->hours;
                            $driverOnline->minutes = ($driverOnline->minutes - 60);
                        endif;
                        $driverOnline->save();
                        
                        $data = array('booking_id' => "", 'notification_type' => 'MAX_ONLINE_TIME_EXCEEDED', 'segment_type' => "MAX_ONLINE_TIME_EXCEEDED", 'segment_data' => 1, 'notification_gen_time' => time());
                        $arr_param = array(
                            'driver_id' => $driver->id,
                            'data' => $data,
                            'message' => trans("$string_file.you_have_exceeded").' '.$maxHours .' '.trans('hour') .' ' .trans('for_today'),
                            'merchant_id' => $driver->merchant_id,
                            'title' => trans("$string_file.offline_now")
                        );
                        Onesignal::DriverPushMessage($arr_param);
                        
                    }
                }
                
            }
        });
    }

}
