<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Helper\BookingDataController;
use App\Http\Controllers\Helper\Estimate;
use App\Http\Controllers\Helper\FindDriverController;
use App\Http\Controllers\Helper\GoogleController;
use App\Http\Controllers\Helper\MapBoxController;
use App\Http\Controllers\Helper\PolygenController;
use App\Models\BookingConfiguration;
use App\Models\BookingDetail;
use App\Models\Driver;
use App\Models\PriceCard;
use App\Models\Segment;
use App\Models\ServicePackage;
use App\Models\User;
use App\Models\VehicleType;
use App\Traits\BookingTrait;
use App\Traits\ManualDispatchTrait;
use App\Traits\MerchantTrait;
use App\Models\CountryArea;
use App\Models\Merchant;
use App\Traits\ApiResponseTrait;
use App\Http\Controllers\Api\HomeController;
use App\Http\Controllers\Helper\CommonController;
use DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ChatPlatformController extends Controller
{
    use ApiResponseTrait, MerchantTrait, ManualDispatchTrait, BookingTrait;

    //
    public function cars(Request $request)
    {
        $merchant_id = NULL;
        if ($request->hasHeader('publicKey') && $request->hasHeader('secretKey')) {
            $merchant = Merchant::find($request->merchant_id);
            $merchant_id = $merchant->id;
        } else {
            return $this->failedResponse("unauthorized");
        }
        $validator = Validator::make($request->all(), [
            'latitude' => 'required|string',
            'longitude' => 'required|string',
        ]);
        if ($validator->fails()) {
            $errors = $validator->messages()->all();
            return response()->json(['result' => "0", 'message' => $errors[0], 'data' => []]);
        }
        $string_file = $this->getStringFile($merchant_id);
        $area = PolygenController::Area($request->latitude, $request->longitude, $merchant_id);
        if (empty($area)) {
            return response()->json(['result' => "0", 'message' => trans("$string_file.no_service_area"), 'data' => []]);
        }
        $area_id = $area['id'];
        $areas = CountryArea::with('ServiceTypes')->find($area_id);
        $currency = $areas->Country->isoCode;

        $areas = $this->ServiceType($areas, $merchant, $request, "", $string_file);

        if (isset($areas->AreaCoordinates)) {
            unset($areas->AreaCoordinates);
        }
        return response()->json(['result' => "1", 'home_screen' => 2, 'message' => "cars", 'currency' => $currency, 'data' => $areas]);
    }


    public function ServiceType($areas, $merchant, $request, $currency = null,$string_file = "")
    {

        try {
            $segment = Segment::find($request->segment_id);
            $merchant_id = $merchant->id;
            $service_types = $areas->ServiceTypes->where('segment_id',$request->segment_id)->sortBy('id');
            // dd($areas,$service_types);
            $pool = $service_types->filter(function ($service) {
                return $service->id == 5;
            });

            $service_types = $service_types->filter(function ($service) {
                return $service->id != 5;
            });

//            $merchant = Merchant::find($merchant_id);
            $configuration = $merchant->Configuration;
            $app_configuration = $merchant->ApplicationConfiguration;
            $booking_config = $merchant->BookingConfiguration;

            if(count($service_types) > 0)
            {
                /**Get time according to pickup and drop location*/
                $drop_locationArray = [];
                if (!empty($request->drop_location)) {
                    $drop_locationArray = json_decode($request->drop_location, true);
                }

                if($configuration->drop_outside_area == 1 && $configuration->outside_area_ratecard == 1){
                    $dropLocation = isset($drop_locationArray[0]) ? $drop_locationArray[0] : '';
                    $drop_lat = isset($dropLocation['drop_latitude']) ? $dropLocation['drop_latitude'] : '';
                    $drop_long = isset($dropLocation['drop_longitude']) ? $dropLocation['drop_longitude'] :'';
                    $drop_location_outside_area = 2;
                    $ploygon = new PolygenController();
                    $checkArea = $ploygon->CheckArea($drop_lat, $drop_long, $areas->AreaCoordinates);
                    if(!$checkArea){
                        $drop_location_outside_area = 1;
                    }
                    $request->request->add(['drop_location_outside_area' => $drop_location_outside_area]);
                }

                $googleArray = ['total_distance' => 0, 'total_distance_text' => "", 'total_time' => 0, 'total_time_minutes' => 0, 'total_time_text' => "", 'image' => ""];

                if($booking_config->eta_calculation_method == 2 || (empty($request->estimate_distance) || empty($request->estimate_time))){
                    $selected_map = getSelectedMap($merchant, "CARS");
                    if($selected_map == "GOOGLE"){
                        $key = get_merchant_google_key($merchant_id,'api');
                        $googleArray = GoogleController::GoogleStaticImageAndDistance($request->latitude, $request->longitude, $drop_locationArray, $key,"",$string_file);

                    }
                    else{
                        $key = get_merchant_google_key($merchant_id,'api', "MAP_BOX");
                        $googleArray = MapBoxController::MapBoxStaticImageAndDistance($request->latitude, $request->longitude, $drop_locationArray, $key,"",$string_file);

                    }
                    saveApiLog($merchant->id, "directions" , "CARS", $selected_map);
                }
                else if($booking_config->eta_calculation_method == 1 && !empty($request->estimate_distance) && !empty($request->estimate_time)){
                    $total_distance = (float)$request->estimate_distance;
                    $total_time = (float)$request->estimate_time;

                    $total_distance_text = round($total_distance / 1000);
                    $total_time_minutes = round($total_time / 60);
                    $total_time_text = $total_time_minutes.' mins';
                    if($total_time_minutes > 60){
                        $total_time_text = round($total_time_minutes / 60).' hr';
                    }
                    $googleArray = ['total_distance' => $total_distance, 'total_distance_text' => $total_distance_text, 'total_time' => $total_time, 'total_time_minutes' => $total_time_minutes, 'total_time_text' => $total_time_text, 'image' => "" ];
                }

                $service_type_id = array_column($service_types->toArray(),'id');
                // need to check it for live projects
                if(empty($pool) && !in_array(5,$service_type_id))
                {
                    $pool = NULL;
                }
                // p($pool);
                $vehicles = CountryArea::select('vt.id','vt.vehicleTypeImage','vt.ride_now','vt.ride_later','vt.is_gallery_image_upload','vt.volumetric_capacity','vt.package_weight_range','vt.engine_type')
                    ->addSelect('cavt.service_type_id','cavt.vehicle_type_id as id','country_areas.merchant_id','lvt.vehicleTypeName','lvt.vehicleTypeDescription')
                    ->where('country_areas.merchant_id',$merchant_id)
                    ->where('country_areas.id',$areas->id)
                    ->join('country_area_vehicle_type as cavt','cavt.country_area_id','=','country_areas.id')
                    ->join('vehicle_types as vt','vt.id','=','cavt.vehicle_type_id')
                    ->join('language_vehicle_types as lvt','vt.id','=','lvt.vehicle_type_id')
                    ->join('price_cards as pc','vt.id','=','pc.vehicle_type_id')
                    ->whereIn('cavt.service_type_id',$service_type_id)
                    ->where('cavt.status',1) // Which vehicle type is active
                    ->where('pc.country_area_id',$areas->id)
                    ->where('pc.merchant_id',$merchant_id)
                    ->where('vt.admin_delete',NULL)
                    ->where('vt.vehicleTypeStatus',1)
                    ->whereIn('pc.service_type_id',$service_type_id)
                    ->groupBy('cavt.vehicle_type_id')
                    ->groupBy('cavt.service_type_id')
                    ->orderBy('vt.sequence')
                    ->get();

                if($vehicles->count() > 0){
                    // we are calling images here other aws will take more time to return image response
                    foreach($vehicles as $key => $value){
                        if($value->is_gallery_image_upload == 1){
                            $value->vehicleTypeImage = get_image($value->vehicleTypeImage, 'vehicle',$value->merchant_id,true,true,"",'gallery_image');
                        }else{
                            $value->vehicleTypeImage = get_image($value->vehicleTypeImage,'vehicle',$value->merchant_id);
                        }
                    }
                }

                foreach ($service_types as $key => $value) {
                    $serviceName = $value->ServiceName($merchant_id);
                    // dd($value,$segment->sub_group_for_app,$app_configuration->home_screen_view);
                    if ($segment->sub_group_for_app == 3){ // Taxi Based Segment // $request->segment_id == 1
                        if($app_configuration->home_screen_view == 1)
                        {
                            $service_data = $this->vehicleForTaxiWithCategory($value,$vehicles,$request,$configuration,$merchant_id,$areas,$currency,$pool,$googleArray);
                        }
                        else
                        {
                            $service_data = $this->vehicleForTaxi($value,$vehicles,$request,$configuration,$merchant_id,$areas,$currency,$pool,$googleArray);
                        }
                    }else if ($segment->sub_group_for_app == 4){ // Delivery Based Segment // $request->segment_id == 2
                        if($app_configuration->delivery_home_screen_view == 1)
                        {
                            $service_data = $this->vehicleForDeliveryWithCategory($value,$vehicles,$request,$configuration,$merchant_id,$areas,$currency,$googleArray);
                        }
                        else
                        {
                            $service_data = $this->vehicleForDelivery($value,$vehicles,$request,$configuration,$merchant_id,$areas,$currency,$googleArray);
                        }
                    }

                    $sequence = 1;
                    $pivot = DB::table('merchant_service_type')->where([['merchant_id', '=', $merchant_id], ['service_type_id', '=', $value->id], ['segment_id', '=', $request->segment_id]])->first();
                    if(!empty($pivot)){
                        $sequence = !empty($pivot->sequence) ? $pivot->sequence : 1;
                    }

                    $value->serviceName = $serviceName;
                    $value->sequence = $sequence;
                    unset($value->parent_id);
                    unset($value->segment_id);
                    unset($value->serviceStatus);
                    unset($value->additional_support);
                    unset($value->owner);
                    unset($value->owner_id);
                    unset($value->created_at);
                    unset($value->updated_at);
                    $service_types[$key] = $value;
                    if($app_configuration->home_screen_view == 1 && $segment->sub_group_for_app == 3) // $request->segment_id == 1
                    {
                        $service_types[$key]['arr_category'] = $service_data;
                    }
                    elseif($app_configuration->delivery_home_screen_view == 1 && $segment->sub_group_for_app == 4){
                        $service_types[$key]['arr_category'] = $service_data;
                    }
                    else
                    {
                        $service_types[$key]['vehicles'] = $service_data['vehicle'];
                        $service_types[$key]['package'] = $service_data['packages'];
                    }
                }
            }

            $service_types = $service_types->sortBy("sequence");

            // we have to change key of  $service_types thats why executed extra loop
            $a = array();
//            foreach ($service_types as $value) {
//                // If vehicles or packages not exist for service then that will not show on app.
//                if(($app_configuration->home_screen_view == 2 && (!empty($value->vehicles) || !empty($value->package))) || ($app_configuration->home_screen_view == 1 && !empty($value->arr_category))){
//                    $a[] = $value;
//                }
//            }

            if($segment->sub_group_for_app == 3) //For Taxi based segment $request->segment_id == 1
            {
                foreach ($service_types as $value) {
                    // If vehicles or packages not exist for service then that will not show on app.
                    if((($app_configuration->home_screen_view == 2 || $app_configuration->home_screen_view == 3 || $app_configuration->home_screen_view == 4 || $app_configuration->home_screen_view == 5) && (!empty($value->vehicles) || !empty($value->package))) || ($app_configuration->home_screen_view == 1 && !empty($value->arr_category))){
                        $a[] = $value;
                    }
                }
            }
            elseif($segment->sub_group_for_app == 4) //For Delivery based segment // $request->segment_id == 2
            {
                foreach ($service_types as $value) {
                    // If vehicles or packages not exist for service then that will not show on app.
                    if(!empty($value->vehicles) || ($app_configuration->delivery_home_screen_view == 1 && !empty($value->arr_category))){
                        $a[] = $value;
                    }
                }
            }

            $areas->service_types = $a;
            return $areas;

        }catch(\Exception $e)
        {
            throw new \Exception($e->getMessage());
        }
    }


    public function vehicleForTaxi($serviceType,$vehicles,$request,$configuration,$merchant_id,$areas,$currency,$pool,$googleArray){
        $service_id = $serviceType->id;
        $type = $serviceType->type;
        $segment_id = $request->segment_id;
        $vehicle = array();
        $packages = array();
        $estimateController = new Estimate();
        $eta = "";
        // dd($type);
        switch ($type) {
            case "1": //Normal
                $vehiclesList = $vehicles->filter(function ($vehicle) use ($service_id) {
                    return $vehicle->service_type_id == $service_id;
                });
                foreach ($vehiclesList as $v) {
                    $vehicle_type_id = $v->id;
                    $vehicle_type = VehicleType::find($vehicle_type_id);
                    $eta = ($configuration->homescreen_eta == 1) ? $estimateController->Eta($merchant_id, $service_id, $areas->id, $request->latitude, $request->longitude, $vehicle_type_id, $segment_id,$request->drop_location,$is_taxi = 1) : "";
                    $competitor_price_card = ($configuration->competitor_pricecard == 1) ? $estimateController->getEstimateCompetitorPrice($merchant_id, $service_id, $areas->id, $vehicle_type_id, $googleArray, $request->drop_location) : "";
//                    $estimate_fare = ($configuration->homescreen_estimate_fare == 1 && !empty($request->drop_location)) ? $estimateController->Estimate($merchant_id, $service_id, $areas->id, $request->latitude, $request->longitude, $request->drop_location, $vehicle_type_id, $currency,null,$googleArray,$request->drop_location_outside_area) : "";
                    $estimate_fare = "";
                    if (!empty($request->drop_location)){
                        if ($configuration->homescreen_estimate_fare == 1){
                            $estimate_fare = $estimateController->Estimate($merchant_id, $service_id, $areas->id, $request->latitude, $request->longitude, $request->drop_location, $vehicle_type_id, $currency,null,$googleArray);
                        }elseif($configuration->homescreen_estimate_fare == 2){
                            $estimate_fare = $estimateController->Estimate($merchant_id, $service_id, $areas->id, $request->latitude, $request->longitude, $request->drop_location, $vehicle_type_id, $currency,null,$googleArray);
                            $estimate_fare = $this->getPriceRange($estimate_fare,$currency);
                        }elseif($configuration->homescreen_estimate_fare == 3){
                            $common_controller = new \App\Http\Controllers\Api\CommonController();
                            $estimate_fare = $estimateController->Estimate($merchant_id, $service_id, $areas->id, $request->latitude, $request->longitude, $request->drop_location, $vehicle_type_id, $currency,null,$googleArray);
                            $estimate_fare = $common_controller->getPriceRangeForEstimate($estimate_fare, $areas->Country->isoCode, 3);
                        }

                    }
                    $seatCapacity = "";
                    if(isset($vehicle_type->passenger_seat_capacity) && !empty($vehicle_type->passenger_seat_capacity)){
                        $seatCapacity = $vehicle_type->passenger_seat_capacity;
                        // $v->vehicleTypeName = $vehicle_type->VehicleTypeName . ' (' .($seatCapacity . 'ðŸ‘¤'). ')';
                        $v->vehicleTypeName = $vehicle_type->VehicleTypeName . ' ' .('ðŸ‘¤'.$seatCapacity);
                    }
                    else{
                        $v->vehicleTypeName = $vehicle_type->VehicleTypeName;
                    }
                    $v->service_type_id = $service_id;
                    $v->surcharge = $this->surCharge($areas->id, $service_id, $v->id, $currency);
                    $v->eta = isset($eta['time']) ? $eta['time'] : "";
                    $v->vehicleTypeDescription = isset($vehicle_type->VehicleTypeDescription) && !empty($vehicle_type->VehicleTypeDescription) ? $vehicle_type->VehicleTypeDescription : "";
                    $v->estimate_fare = $estimate_fare;
//                    $v->competitor_estimate_fare = $competitor_price_card;
                    $v->competitor_estimate_fare = "";
                    $v->service_type_id = $service_id;
                    $v->map_icon = explode_image_path($v->vehicleTypeMapImage);

                    $vehicle[] = $v;
                }
                if (!empty($pool) && !empty($pool->toArray())) {
                    $home_controller = new HomeController();
                    $pool_vehicle[] = $home_controller->staticVehicle($pool->first(), $merchant_id);
                    array_splice($vehicle, $areas->pool_postion - 1, 0, $pool_vehicle);
                }
                break;
            case "2": //Rental
                $packageList = ServicePackage :: select('id','service_type_id')->where('packageStatus',1)->with(['PriceCard'=>function($q) use ($service_id,$areas,$request){
                    $q->select('service_type_id','service_package_id','id','vehicle_type_id')
                        ->where([['country_area_id','=',$areas->id],['service_type_id','=',$service_id],
                            ['service_package_id','!=',NULL],['outstation_type','=',NULL],['segment_id','=',$request->segment_id]]);
                }])
                    ->whereHas('PriceCard',function($q) use ($service_id,$areas,$request){
                        $q->select('service_type_id','service_package_id','id')
                            ->where([['country_area_id','=',$areas->id],['service_type_id','=',$service_id],
                                ['service_package_id','!=',NULL],['outstation_type','=',NULL],['segment_id','=',$request->segment_id],['status','=',1]]);
                    })
                    ->get();
                $packages = [];
                foreach ($packageList as $login) {
                    $package_id = $login->id;
                    $packagevehicle = array();
                    $login->name = $login->PackageName;
                    $vehicle_type_for_package = array_column($login->PriceCard->toArray(),'vehicle_type_id');
                    $vehiclesList = $vehicles->filter(function ($vehicle) use ($service_id,$vehicle_type_for_package) {
//                                 check vehicle type for package from price card configuration
//                                && in_array($vehicle->id,$vehicle_type_for_package)
                        return $vehicle->service_type_id == $service_id && in_array($vehicle->id,$vehicle_type_for_package);
                    });
                    foreach ($vehiclesList as $item) {
                        unset($item->PriceCard);
                        $vehicle_type = $item->id;
                        $vehicle_type_obj = VehicleType::find($vehicle_type);
                        $eta = ($configuration->homescreen_estimate_fare == 1 && !empty($request->drop_location)) ? $estimateController->Eta($merchant_id, $service_id, $areas->id, $request->latitude, $request->longitude,  null) : "";
                        $estimate_fare = $configuration->homescreen_estimate_fare == 1 ? $estimateController->Estimate($merchant_id, $service_id, $areas->id, $request->latitude, $request->longitude, $request->drop_location, $vehicle_type, $currency,$package_id,$googleArray) : "";
                        $competitor_price_card = ($configuration->competitor_pricecard == 1) ? $estimateController->getEstimateCompetitorPrice($merchant_id, $service_id, $areas->id, $vehicle_type, $googleArray, $request->drop_location) : "";
                        $temp_item = (object)[];
                        $temp_item->id = $item->id;
                        $temp_item->service_type_id = $item->service_type_id;
                        $temp_item->vehicleTypeImage = $item->vehicleTypeImage;
                        $temp_item->ride_now = !empty($item->ride_now) ? $item->ride_now : 0;
                        $temp_item->ride_later = !empty($item->ride_later) ? $item->ride_later : 0;
                        $temp_item->vehicleTypeName = $item->vehicleTypeName;
                        $temp_item->vehicleTypeDescription = isset($item->vehicleTypeDescription) && !empty($item->vehicleTypeDescription) ? $item->vehicleTypeDescription : "";
                        $temp_item->surcharge = $this->surCharge($areas->id, $service_id, $item->id, $currency);
                        $temp_item->eta =  isset($eta['time']) ? $eta['time'] : "";
                        $temp_item->estimate_fare = $estimate_fare;
//                        $temp_item->competitor_estimate_fare = $competitor_price_card;
                        $temp_item->competitor_estimate_fare = "";
                        $temp_item->map_icon = explode_image_path($item->vehicleTypeMapImage);
                        $temp_item->vehicleTypeName = $vehicle_type_obj->VehicleTypeName;
                        $packagevehicle[] = $temp_item;
                    }
                    $login->vehicles =[];
                    $login->vehicles = $packagevehicle;
                    unset($login->PriceCard);
                    if(!empty($packagevehicle))
                    {
                        $packages[] = $login;
                    }
                }
                break;
            case "3": //transfer
                $home_controller = new HomeController();
                $vehicle[] = $home_controller->StaticVehicle($serviceType, $merchant_id);
                break;
            case "4": //Outstation
                $home_controller = new HomeController();
                $vehicle[] = $home_controller->StaticVehicle($serviceType, $merchant_id);
            default:
        }
        return array('vehicle' => $vehicle,'packages' => $packages);
    }

    public function surCharge($country_area_id, $service_type_id, $vehicle_type_id, $currency = null)
    {
        $response = "";
        $surchargeData = PriceCard::where([['country_area_id', '=', $country_area_id], ['service_type_id', '=', $service_type_id], ['vehicle_type_id', '=', $vehicle_type_id]])->first();
        if (empty($surchargeData)) {
            return $response;
        }
        if ($surchargeData->sub_charge_status == 1) {
            $response = $surchargeData->sub_charge_type == 1 ? trans('api.sub_charge_type', ['amount' => $currency . " " . $surchargeData->sub_charge_value]) : trans('api.sub_charge_type2', ['amount' => $surchargeData->sub_charge_value]);
        }
        return $response;
    }


    public function ConfirmBooking(Request $request){
        DB::beginTransaction();
        $booking_id = NULL;
        try{
            $merchant_id = NULL;
            $user = User::find(45670);

            if ($request->hasHeader('publicKey') && $request->hasHeader('secretKey')) {
                $merchant = Merchant::find($request->merchant_id);
                $merchant_id = $merchant->id;
            } else {
                return $this->failedResponse("unauthorized");
            }
            $validator = Validator::make($request->all(), [
                'pickup_latitude' => 'required|string',
                'pickup_longitude' => 'required|string',
                'drop_latitude' => 'required|string',
                'drop_longitude' => 'required|string',
                'vehicle_type_id' => 'required',
            ]);
            if ($validator->fails()) {
                $errors = $validator->messages()->all();
                return response()->json(['result' => "0", 'message' => $errors[0], 'data' => []]);
            }

            $msg = " Driver Not Found!"
                . "Oops! We couldn't find the driver details you were looking for."
                . "Don't worry, let's try again!"
                . "Tip: Just reply with *Hi* to restart the process, and we'll help you out!"
                . "Looking forward to hearing from you!";

            $vehicle_type_id = $request->vehicle_type_id;
            $pickup_latitude = $request->pickup_latitude;
            $pickup_longitude = $request->pickup_longitude;
            $drop_latitude = $request->drop_latitude;
            $drop_longitude = $request->drop_longitude;
            $chat_id  = $request->chat_id;
            $area = PolygenController::Area($pickup_latitude, $pickup_longitude, $merchant_id);
            if($area)
                $area_id = $area['id'];
            else
                return response()->json(['result' => "0", 'message' => "out of service area", 'data' => []]);

            $price_data = PriceCard::where([['country_area_id', '=', $area_id], ['merchant_id', '=', $merchant_id], ['service_type_id', '=', 1], ['vehicle_type_id', '=', $vehicle_type_id]])->first();
            $config = BookingConfiguration::where("merchant_id", $merchant_id)->first();
            $remain_ride_radius_slot = json_decode($config->driver_ride_radius_request, true);
            $map = getSelectedMap($user->Merchant, "MANUAL_DISPATCH");
            $key = $map == "GOOGLE" ? get_merchant_google_key($merchant_id) :  get_merchant_google_key($merchant_id, 'admin_backend', "MAP_BOX");

            $request_parameter = array(
                "area"            =>$area_id,
                "latitude"        =>$pickup_latitude,
                "longitude"       =>$pickup_longitude,
                "drop_lat"        =>$drop_latitude,
                "drop_long"       =>$drop_longitude,
                "service_type"    =>1,
                "vehicle_type"    =>(int)$vehicle_type_id,
                "merchant_id"     =>$merchant_id,
                "segment_id"      =>1,
                'distance' => !empty($remain_ride_radius_slot) ? $remain_ride_radius_slot[0] : null,

            );

            $driver_data = Driver::GetNearestDriver($request_parameter);
            if (!empty($remain_ride_radius_slot) && is_array($remain_ride_radius_slot) && (($remain_ride_radius_slot[1] != null) || ($remain_ride_radius_slot[2] != null)) && empty($driver_data)) {
                $req_parameter['distance'] = $remain_ride_radius_slot[1];
                $driver_data = Driver::GetNearestDriver($request_parameter);
                if (empty($driver_data)) {
                    $req_parameter['distance'] = $remain_ride_radius_slot[2];
                    $driver_data = Driver::GetNearestDriver($request_parameter);
                }
            }

            $driverData = $driver_data;
            $pickup_location = NULL;
            $drop_location = NULL;

            switch ($map){
                case "GOOGLE":
                    $pickup_location = GoogleController::GoogleLocation($pickup_latitude, $pickup_longitude, $key);
                    $drop_location = GoogleController::GoogleLocation($drop_latitude, $drop_longitude, $key);
                    saveApiLog($merchant_id, "geocode" , "CHAT_PLATFORM", $map);
                    break;
                case "MAP_BOX":
                    $pickup_location = MapBoxController::MapboxLocation($pickup_latitude, $pickup_longitude, $key);
                    $drop_location = MapBoxController::MapboxLocation($drop_latitude, $drop_longitude, $key);
                    saveApiLog($merchant_id, "geocode" , "CHAT_PLATFORM", $map);
                    break;
            }

            $drop_locationArray = [
                [
                    'drop_latitude'=> $drop_latitude,
                    'drop_longitude'=> $drop_longitude
                ]
            ];
            $string_file = $this->getStringFile($merchant_id);
            if($map == "GOOGLE") {
                $googleArray = GoogleController::GoogleStaticImageAndDistance($pickup_latitude, $pickup_longitude, $drop_locationArray, $key, NULL, $string_file);
            }
            else{
                $googleArray = MapBoxController::MapBoxStaticImageAndDistance($pickup_latitude, $pickup_longitude, $drop_locationArray, $key, NULL,$string_file);
            }
            saveApiLog($merchant_id, "directions" , "CHAT_PLATFORM", $map);

            $time = $googleArray['total_time_text'];
            $timeSmall = $googleArray['total_time_minutes'];
            $distance = $googleArray['total_distance_text'];
            $distanceSmall = $googleArray['total_distance'] / 1000;

            $request_data = [
                "distance" =>  $distanceSmall,
                "ride_time" =>  $timeSmall,
                "service" =>  1,
                "vehicle_type" => $vehicle_type_id,
                "area"=> $area_id,
                "distance_unit" =>  1,
                "package_id" => NULL,
                "outstation_type" => NULL,
                "segment_id"=> 1,
                "merchant_id"=> $merchant_id
            ];

            $estimate_arr = $this->getEstimatePrice((object)$request_data);

            $request = array(
                "manual_area"     => $area_id,
                "pickup_latitude" =>$pickup_latitude,
                "pickup_longitude"=>$pickup_longitude,
                "drop_latitude"   =>$drop_latitude,
                "drop_longitude"  =>$drop_longitude,
                "service"         =>1,
                "vehicle_type"    =>(int)$vehicle_type_id,
                "merchant_id"     =>$merchant_id,
                "segment_id"      =>1,
                "user_id"         => $user->id,
                "drop_location"   => $drop_location,
                "pickup_location" => $pickup_location,
                "booking_type"    => 1,
                "payment_method_id" => 1,
                "platform"     => 4,
                "estimate_distance"=> $distanceSmall,
                "estimate_time"=> $timeSmall,
                "ride_time"=> NULL,
                "estimate_fare" => $estimate_arr['amount'],
                "old_eta" => $estimate_arr['amount'],
            );

            if(count($driverData) > 0){
                $booking = $this->placeManualDispatchBooking((object) $request, NULL, $user->merchant_id, $price_data->id, $driverData, $key, NULL, 2);
                $booking->waypoints= "[]";
                $booking->save();
                $booking_id = $booking->id;
                BookingDetail::UpdateOrCreate(['booking_id'=>$booking_id],['chat_platform_id'=>$chat_id]);
                $findDriver = new FindDriverController();
                $findDriver->AssignRequest($driverData, $booking->id);
                $message = "New Booking";
                $bookingData = new BookingDataController();
                $bookingData->SendNotificationToDrivers($booking, $driverData, $message);
            }
            else{

                throw new \Exception($msg);
            }

        }
        catch(\Exception $e){
            DB::rollback();
            return $this->failedResponse($e->getMessage());
        }
        DB::commit();
        return $this->successResponse("Ride confirmed! Searching for the closest driver.", ["booking_id"=> $booking_id]);
    }

    public function sendNotificationForN8n($booking, $searching_for_another_driver = false)
    {
        try{
            $string_file = $this->getStringFile($booking->merchant_id);
            $locale = \App::getLocale();
            $tracking_link = $booking->unique_id ? "https://track-ride.com/public/share/ride/driver/".$locale.'/'.$booking->unique_id: "";
            
            switch ($booking->merchant_id) {
                case 976:
                    $url = "https://n8n.srv1160561.hstgr.cloud/webhook/Autocancelled";
                    $data = $this->getBookingResponse($booking);
                    break;
                case 1180:
                    $url = "https://n8n.srv1160561.hstgr.cloud/webhook/AutocancelledThyde";
                    $data = $this->getBookingResponse($booking);
                    break;
                case 548:
                    $url = "https://local.codestore.co/n8n/webhook/rideconfirm";
                    $driver = isset($booking->DriverVehicle) ? $booking->DriverVehicle->Driver : NULL;
                    $booking_text = CommonController::BookingStatus($booking->booking_status, $string_file);

                    $data = [
                        "status" => $booking->booking_status,
                        "status_text" => $searching_for_another_driver ? "Searching For ANother driver" : $booking_text,
                        "timestamp" => time(),
                        "data" => [
                            "booking_id" => $booking->id,
                            "ride_time" => \Carbon\Carbon::parse($booking->created_at)->format('Y-m-d H:i:s'),

                            "customer" => [
                                "name" => isset($booking->User) ? $booking->User->first_name . " " . $booking->User->last_name: "",
                                "chat_id" => isset($booking->BookingDetail) ? $booking->BookingDetail->chat_platform_id : "",
                            ],

                            "driver" => [
                                "name" => isset($driver)? $driver->first_name . " " . $driver->last_name: "",
                                "phone" => isset($driver)? $driver->PhoneNumber: "",
                                "otp" => $booking->ride_otp ?? "",
                            ],

                            "vehicle" => [
                                "type" => $booking->VehicleType->VehicleTypeName,
                                "model" => $booking->DriverVehicle && $booking->DriverVehicle->VehicleModel ? $booking->DriverVehicle->VehicleModel->VehicleModelName : "",
                                "color" => $booking->DriverVehicle ? $booking->DriverVehicle->vehicle_color : "",
                                "license_plate" => $booking->DriverVehicle ? $booking->DriverVehicle->vehicle_number : ""
                            ],

                            "price" => [
                                "currency" => $booking->CountryArea->Country->isoCode,
                                "fare" => $booking->estimate_bill,
                            ],
                            "tracking_link"=> $tracking_link
                        ],
                    ];

            }

            $ch = curl_init();

            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json'
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

            $response = curl_exec($ch);
            curl_close($ch);

            \Log::channel('n8n')->emergency([
                "response" => $response,
                "data"=>$data,
                "booking_id"=> $booking->id,
                "time" => \Carbon\Carbon::now()->setTimezone('Asia/Kolkata')->format('Y-m-d H:i:s'),
            ]);

            return true;
        }
        catch(\Exception $e){
            \Log::channel('n8n')->emergency([
                "Exception" => $e->getMessage(),
                "booking_id"=> $booking->id,
                "time" => \Carbon\Carbon::now()->setTimezone('Asia/Kolkata')->format('Y-m-d H:i:s'),
            ]);
            return false;
        }
    }

    public function getBookingResponse($booking){
        return [
            "booking_id" => $booking->id,
            "pickup_location" => $booking->pickup_location ?? "",
            "drop_location" => $booking->drop_location ?? "",
            "user_name" => $booking->User->first_name . " " . $booking->User->last_name,
            "user_email" => $booking->User->email,
            "user_phone" => $booking->User->UserPhone,
            "estimate_fare" => $booking->CountryArea->Country->isoCode." ".$booking->estimate_bill,
            "merchant_email" => $booking->Merchant->email,
            "booking_status" => $booking->booking_status,
        ];
    }

}
