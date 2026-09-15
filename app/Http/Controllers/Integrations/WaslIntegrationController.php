<?php

namespace App\Http\Controllers\Integrations;

use App\Http\Controllers\Controller;
use App\Traits\DriverTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;


class WaslIntegrationController extends Controller
{
    //
    use DriverTrait;

    protected $payload;

    public function __construct($data)
    {
        $this->payload = $data;
        $calling_for = $this->payload['calling_for'];
        $config = $this->payload['config'];

        $headers = [
            'Content-Type: application/json',
            'client-id: '.$config->api_key,
            'app-id: '.$config->auth_token,
            'app-key: '.$config->api_secret
        ];


        switch ($calling_for){
            case 'DISPATCHING_DRIVERS':
                $this->dispatchingDrivers($this->payload, $headers);
                break;
            case "DISPATCHING_TRIPS":
                $this->dispatchingTrip($this->payload, $headers);
                break;
            case "TRIPS_UPDATE":
                $this->tripsUpdate($this->payload, $headers);
                break;
        }

    }


    public function dispatchingDrivers($payload, $headers)
    {
        $request = $payload['request'];
        $driver = $request = $payload['driver'];
        $vehicle = $request = $payload['vehicle'];

        $driver_registration_doc = $driver->DriverDocument()
            ->whereHas('Document', function ($q) {
                $q->where('required_for_third_party_integration', 1);
            })
            ->first();
        
        if(empty($driver_registration_doc)) throw new \Exception("Document Not Found");
        
        $timezone = $driver->CountryArea->timezone;
        $gregorianDob = $driver->dob ?? '1997-02-08';
        $hijriDob = $this->gregorianToHijriDMY($gregorianDob,$timezone);
        
        $data = [
            "driver" => [
                "identityNumber" => $driver_registration_doc->document_number,
                "dateOfBirthHijri" => !empty($hijriDob) ? $hijriDob : "30-10-1417",
                // "dateOfBirthHijri" => "1411/01/01",
                // "dateOfBirthGregorian" => "1990-01-01",
                "emailAddress" => $driver->email,
                "mobileNumber" => $driver->phoneNumber
            ],
            "vehicle" => [
                "sequenceNumber" => $vehicle->vehicle_body_number,
                "plateLetterRight" => strtoupper($vehicle->plate_letter_right) ?? "R",
                "plateLetterMiddle" => strtoupper($vehicle->plate_letter_middle) ?? "H",
                "plateLetterLeft" => strtoupper($vehicle->plate_letter_left) ?? "H",
                "plateNumber" => $vehicle->vehicle_number ?? "4600",
                "plateType" => (string)$vehicle->plate_type ?? "1"
            ]
        ];


        $curl = curl_init();

        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://wasl.api.elm.sa/api/dispatching/v2/drivers',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => $headers
        ));

        $resp = curl_exec($curl);
        curl_close($curl);

        \Log::channel('integration_logger')->emergency([
            "Integration_type" => "WASL",
            "merchant_id" => $driver->merchant_id,
            "driver_id" => $driver->id,
            "ist_time" => \Carbon\Carbon::now("Asia/kolkata")->format("y-m-d H:i:s"),
            "function" =>  "dispatchingDrivers",
            "response" => $resp,
            "data"=> $data
        ]);

        $response = json_decode($resp, true);
        $is_valid = false;
        $eligiblity = "";
        if(isset($response['success']) && isset($response['resultCode'])  && $response['success'] && isset($response['resultCode'])  == "success"){
            if(isset($response['result']) && isset($response['result']['eligibility'])){
                if($response['result']['eligibility'] == "VALID"){
                    $is_valid = true;
                }
                else{
                    $eligiblity = $response['result']['eligibility'];
                }
            }
        }
        else if(isset($response['resultCode'])){
            throw new \Exception($response['resultCode']);
        }
        else{
            throw new \Exception("Unknown Error Occured during WASL registration");
        }

        if(!$is_valid){
            throw new \Exception("Eligibility ".$eligiblity);
        }

    }

    public function gregorianToHijriDMY($gregorianDate,$timezone)
        {
            $date = new \DateTime($gregorianDate);

            $formatter = new \IntlDateFormatter(
                "ar_SA@calendar=islamic-umalqura;numbers=latn",
                \IntlDateFormatter::NONE,
                \IntlDateFormatter::NONE,
                $timezone,
                \IntlDateFormatter::TRADITIONAL,
                'dd-MM-yyyy'
            );

            return $formatter->format($date);
        }


    public function dispatchingTrip($payload, $headers){

        $request = $payload['request'];
        $booking = $payload['booking'];

        $vehicle = \App\Models\DriverVehicle::find($booking->driver_vehicle_id);
        $driver = $booking->Driver;
        $booking_detail = $booking->BookingDetail;
        $timezone = $booking->CountryArea->timezone;
        $distance_str = strtolower($booking->travel_distance);
        $numeric = (Integer) preg_replace('/[^0-9.]/', '', $distance_str);
        $distance_str = strtolower($distance_str);
        $numeric = (float) preg_replace('/[^0-9.]/', '', $distance_str);
        $distanceInMeters =  str_contains($distance_str, 'km') ? (int) ceil($numeric * 1000) : (int) ceil($numeric);
        $distanceInMeters = max(1, $distanceInMeters);

        $travel_time_sec = (int) max(1, round($booking->travel_time_min * 60));
        $wait_time_sec =   (int) max(1, round($booking->BookingDetail->wait_time * 60));
        
        $driver_registration_doc = $driver->DriverDocument()
            ->whereHas('Document', function ($q) {
                $q->where('required_for_third_party_integration', 1);
            })
            ->first();
        
        if(empty($driver_registration_doc)) throw new \Exception("Document Not Found");

        // For all your timestamps
        $pickupIso = $this->waslIso($booking_detail->start_timestamp,$timezone);
        
        $dropIso = $this->waslIso($booking_detail->end_timestamp, $timezone);

        $driverArriveIso = $this->waslIso($booking_detail->arrive_timestamp, $timezone);
        
        $driverAcceptIso = $this->waslIso($booking_detail->accept_timestamp, $timezone);


        // $pickupIso = Carbon::createFromTimestamp($booking_detail->start_timestamp)
        //     ->setTimezone($timezone)
        //     ->format('Y-m-d\TH:i:s.v\Z');

        // $dropIso = Carbon::createFromTimestamp($booking_detail->end_timestamp)
        //     ->setTimezone($timezone)
        //     ->format('Y-m-d\TH:i:s.v\Z');
            
        // $driverArriveIso = Carbon::createFromTimestamp($booking_detail->arrive_timestamp)
        //     ->setTimezone($timezone)
        //     ->format('Y-m-d\TH:i:s.v\Z');
            
        // $driverAcceptIso = Carbon::createFromTimestamp($booking_detail->accept_timestamp)
        //     ->setTimezone($timezone)
        //     ->format('Y-m-d\TH:i:s.v\Z');

        $startedWhen = Carbon::parse($booking_detail->created_at)
            ->setTimezone($timezone)
            ->format('Y-m-d\TH:i:s') . '.000';


        $data = [
            "sequenceNumber" => $vehicle->vehicle_body_number ?? "",
            "driverId" => (string) $driver_registration_doc->document_number,
            "tripId" => (string) $booking->id,
            "distanceInMeters" => $distanceInMeters,
            "durationInSeconds" => $travel_time_sec,
            "customerRating" => isset($booking->BookingRating) ? (double)($booking->BookingRating->user_rating_points ?? (double) 0) :(double) 0 ,
            "customerWaitingTimeInSeconds" => $wait_time_sec,
            // "originCityNameInArabic" => "الرياض",  //optional
            // "destinationCityNameInArabic" => "الرياض", ////optional
            "originLatitude" => (double) $booking->pickup_latitude,
            "originLongitude" => (double) $booking->pickup_longitude,
            "destinationLatitude" => (double) $booking->drop_latitude,
            "destinationLongitude" => (double) $booking->drop_longitude,
            "pickupTimestamp" => $pickupIso,
            "dropoffTimestamp" => $dropIso,
            "startedWhen" => $startedWhen,
            "tripCost" => (double) $booking->final_amount_paid,
            "driverArrivalTime"=> $driverArriveIso,
            "driverAssignTime" => $driverAcceptIso,
            "provinceId"=> isset($driver->province_id) && !empty($driver->province_id) ? $driver->province_id : 14
        ];
        


        $curl = curl_init();

        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://wasl.api.elm.sa/api/dispatching/v2/trips',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => $headers,
        ));

        $resp = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        $errno = curl_errno($curl);
        curl_close($curl);
        
        \Log::channel('integration_logger')->emergency([
            "Integration_type" => "WASL",
            "merchant_id" => $driver->merchant_id,
            "driver_id" => $driver->id,
            "ist_time" => \Carbon\Carbon::now("Asia/kolkata")->format("y-m-d H:i:s"),
            "function" =>  "dispatchingTrips",
            "response" => $resp,
        ]);
        
        $response = json_decode($resp, true);
        if(isset($response['success']) && isset($response['resultCode'])  && $response['success'] && isset($response['resultCode'])  == "success"){
            
        }else if(isset($response['success']) && isset($response['resultCode'])  && $response['success'] == false){
            throw new \Exception($response['resultCode']);
        }
        else{
            throw new \Exception("Unknown Error Occured during WASL registration");
        }

        // Debug output
        // dd([
        //     'response' => $resp,
        //     'http_code' => $httpCode,
        //     'curl_error' => $error,
        //     'curl_errno' => $errno,
        //     'data_sent' => $data,
        //     'headers_sent' => $headers
        // ]);

    }
    
    function waslIso($timestamp, $timezone)
    {
        return Carbon::createFromTimestamp($timestamp)
            ->setTimezone($timezone)
            ->format('Y-m-d\TH:i:s') . '.000';
    }

    public function tripsUpdate($payload, $headers){
        $trips = $payload['trips_data'];

        $curl = curl_init();

        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://wasl.api.elm.sa/api/dispatching/v2/trips',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => json_encode(["trips"=> $trips]),
            CURLOPT_HTTPHEADER => $headers,
        ));

        $resp = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        $errno = curl_errno($curl);
        curl_close($curl);

        // Debug output
        dd([
            'response' => $resp,
            'http_code' => $httpCode,
            'curl_error' => $error,
            'curl_errno' => $errno,
            'data_sent' => $trips,
            'headers_sent' => $headers
        ]);
    }
}
