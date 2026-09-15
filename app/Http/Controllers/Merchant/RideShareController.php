<?php

namespace App\Http\Controllers\Merchant;

use App\Models\Booking;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class RideShareController extends Controller
{
    public function index(Request $request,$type,$locale,$code)
    {
        \App::SetLocale($locale);
        $booking = Booking::where([['unique_id', '=', $code]])->first();
        if (empty($booking)) {
            return "Sorry No Record";
        }
        $sharable_link_expire_time_after_end_ride = $booking->Merchant->BookingConfiguration->sharable_link_expire_time_after_end_ride ?? 10;
        $sos_enable = $booking->Merchant->ApplicationConfiguration->sos_user_driver == 1 ?? false;
        $checkExpire = false;
        if($booking->BookingDetail->end_timestamp && $sos_enable){
            $endTime = \Carbon\Carbon::createFromTimestamp($booking->BookingDetail->end_timestamp, 'UTC');
            $now = \Carbon\Carbon::now();
            $checkExpire = $now->greaterThan($endTime->addMinutes($sharable_link_expire_time_after_end_ride));
        }
        
        if($checkExpire && $sos_enable){
            return "Sorry!! Ride Data Not Available";
        }elseif(($booking->booking_closure == 1 || !in_array($booking->booking_status, array(1004, 1005))) && !$sos_enable){
            return "Sorry!! Ride Data Not Available";
        }
        
        // if ($booking->booking_closure == 1 || !in_array($booking->booking_status, array(1004, 1005))) {
        //     return "Sorry!! Ride Data Not Available";
        // }
        setS3Config($booking->Merchant);
        return view('map', compact('booking','type'));
    }
}
