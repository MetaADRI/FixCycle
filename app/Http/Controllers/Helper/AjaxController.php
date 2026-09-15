<?php

namespace App\Http\Controllers\Helper;

use App\Http\Controllers\DriverAgency\DriverController;
use App\Http\Controllers\Taxicompany\DriverController as TaxiCompanyDriver;
use App\Http\Controllers\Merchant\DriverController as MerchantCompanyDriver;
use App\Models\DesignationApprover;
use App\Models\Onesignal;
use App\Models\SearchablePlace;
use App\Models\Segment;
use App\Models\ServicePackage;
use App\Models\SmsConfiguration;
use App\Models\User;
use App\Models\UserDetail;
use Auth;
use App\Models\CountryArea;
use App\Models\PaymentOption;
use App\Models\SmsGateways;
use App\Models\OutstationPackage;
use App\Models\PriceCard;
use App\Models\ServiceType;
use App\Models\Driver;
use App\Models\State;
use App\Models\Town;
use App\Models\VehicleModel;
use App\Models\VehicleType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;
use DB;
use App\Traits\MerchantTrait;
use App\Models\BusinessSegment\BusinessSegment;
class AjaxController extends Controller
{
    use MerchantTrait;

    //    public function GetPriceCard(Request $request)
    //    {
    //        $area_id = $request->area_id;
    //        $priceCards = PriceCard::select('id', 'price_card_name')->where([['country_area_id', '=', $area_id]])->get();
    //        if (empty($priceCards->toArray())) {
    //            echo "<option value=''>" . trans("$string_file.data_not_found") . "</option>";
    //        } else {
    //            foreach ($priceCards as $value) {
    //                echo "<option value='" . $value->id . "'>" . $value->price_card_name . "</option>";
    //            }
    //        }
    //    }

    public function AreaList(Request $request)
    {
        $taxi_company = get_taxicompany();
        $hotel = get_hotel();
        if (!empty($taxi_company)) {
            $merchant_id = $taxi_company->merchant_id;
        } elseif (!empty($hotel)) {
            $merchant_id = $hotel->merchant_id;
        } else {
            $merchant_id = get_merchant_id();
        }
        $string_file = $this->getStringFile($merchant_id);
        $id = $request->id;
        $areaList = CountryArea::whereHas('Country', function ($query) use ($id) {
            $query->where([['phonecode', '=', $id]]);
        })->where([['merchant_id', '=', $merchant_id], ['status', '=', 1]])->get();
        if (empty($areaList->toArray())) {
            echo "<option value=''>" . trans("$string_file.no_service_area") . "</option>";
        } else {
            echo "<option value=''>" . trans("$string_file.area") . "</option>";
            foreach ($areaList as $value) {
                echo "<option id='" . $value->CountryAreaName . "' value='" . $value->id . "'>" . $value->CountryAreaName . "</option>";
            }
        }
    }

    public function AreaLatLng(Request $request){
        $area = CountryArea::find($request->country_area_id);
        return response()->json(["area_coordinates"=> $area->AreaCoordinates], 200);
    }

    public function VehicleServices(Request $request)
    {
        $validator = Validator::make($request->all(), [
            //            'area_id' => 'required',
            'vehicle' => 'required',
            'driver_id' => 'required',
        ]);
        if ($validator->fails()) {
            $errors = $validator->messages()->all();
            return $errors;
            exit();
        }
        $driver = Driver::Find($request->driver_id);
        //        $driver_segment = array_pluck($driver->Segment,'id');
        $vehicle_type = $request->vehicle;
        $area_id = $driver->country_area_id;
        if (!empty($driver->taxi_company_id)) {
            $driver_obj = new TaxiCompanyDriver;
            echo $vehicle_doc_segment = $driver_obj->vehicleDocSegment($area_id, $driver, $vehicle_type);
        } elseif (!empty($driver->driver_agency_id)) {
            $driver_obj = new DriverController;
            echo $vehicle_doc_segment = $driver_obj->vehicleDocSegment($area_id, $driver, $vehicle_type);
        } else {
            $driver_obj = new MerchantCompanyDriver;
            echo $vehicle_doc_segment = $driver_obj->vehicleDocSegment($area_id, $driver, $vehicle_type);
        }
    }

    public function PriceCard(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'area' => 'required',
            'vehicle_type' => 'required',
            'service' => 'required',
        ]);
        if ($validator->fails()) {
            $errors = $validator->messages()->all();
            return $errors;
            exit();
        }
        $pricecard = PriceCard::where(function ($query) use ($request) {
            if (isset($request->package_id) && !empty($request->package_id)) {
                $query->where(['package_id', '=', $request->package_id]);
            }
        })->where([['country_area_id', '=', $request->area], ['service_type_id', '=', $request->service], ['vehicle_type_id', '=', $request->vehicle_type]])->first();
        if (!empty($pricecard)) {
            return array('result' => 1, 'message' => "Price Card Added");
        } else {
            return array('result' => 0, 'message' => "No Price Card Found");
        }
    }

    public function ServiceType(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'area_id' => 'required',
            'segment_id' => 'required',
            'segment_group' => 'required',
            'vehicle_type_id' => 'required_if:segment_group,==,1',
        ]);
        if ($validator->fails()) {
            $errors = $validator->messages()->all();
            return $errors;
            exit();
        }
        $area_id = $request->area_id;
        $segment_id = $request->segment_id;
        $vehicle_type_id = $request->vehicle_type_id;
        $segment_group = $request->segment_group;
        $merchant_id = !empty($request->merchant_id) ? $request->merchant_id : get_merchant_id();
        $string_file = $this->getStringFile($merchant_id);
        $service_type = $this->getMerchantServicesByArea($area_id, $segment_id, $vehicle_type_id, '', $segment_group, $request->calling_from);
        echo "<option value=''>" . trans("$string_file.select") . "</option>";
        if (!empty($service_type)) {
            foreach ($service_type as $value) {
                if(($value->id == 2016 || $value->id == 9764 || $value->id == 9765 )&& $request->calling_from == 'DRIVER'){
                    continue;
                }
                echo "<option value='" . $value->id . "' additional_support='" . $value->additional_support . "'>" .
                    $value->serviceName($merchant_id) . "</option>";
            }
        }
    }

    public function VehicleTypeCashBack(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'area_id' => 'required|exists:country_areas,id',
            'service_id' => 'required|exists:service_types,id',
        ]);
        if ($validator->fails()) {
            $errors = $validator->messages()->all();
            return $errors;
            exit();
        }
        $area_id = $request->area_id;
        $areas = CountryArea::with(['ServiceTypes'])
            ->with(['VehicleType' => function ($q) {
                $q->where('admin_delete', NULL);
            }])
            ->where([['id', '=', $area_id]])->first();
        $service_ids = [$request->service_id];
        $vehiclesList = $areas->VehicleType->filter(function ($item) use ($service_ids) {
            return in_array($item->pivot->service_type_id, $service_ids);
        });
        $service_with_vehicles = $areas->ServiceTypes->where('id', $request->service_id)->map(function ($item, $key) use ($vehiclesList) {
            $item->vehicle = $vehiclesList->filter(function ($vehicle) use ($item) {
                return $vehicle->pivot->service_type_id == $item->id;
            });
            return $item;
        });

        echo "<div class='col-md-6' id='services-delete-$request->service_id'>
            <div class='form-group p-1' id='vehicletype'>
                <label for='emailAddress5'>
                    " . trans('admin.select-vehicles', $service_with_vehicles->pluck('serviceName')->toArray()) . "
                    <span class='text-danger'>*</span>
                </label><br>
                <select class='select2me'
                        name='" . $service_with_vehicles->pluck('serviceName')->toArray()['0'] . "[]'
                        id='vehicle'
                        data-placeholder=''
                        multiple >
                        <option value=''>" .
            trans('admin.select-vehicles', $service_with_vehicles->pluck('serviceName')->toArray()) .
            trans('admin.select-vehicles', $service_with_vehicles->pluck('serviceName')->toArray())
            . "</option>";
        foreach ($vehiclesList as $vehicles) :
            echo "<option id='vehicle_$vehicles->id'
                                value='$vehicles->id'>
                            $vehicles->vehicleTypeName
                        </option>";
        endforeach;
        echo "</select>
            </div>
        </div>";
    }

    public function ServiceTypeCashBack(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'area_id' => 'required|exists:country_areas,id',
        ]);
        if ($validator->fails()) {
            $errors = $validator->messages()->all();
            return $errors;
            exit();
        }
        $merchant = \Auth::user('merchant');
        $merchant_id = $merchant->parent_id != 0 ? $merchant->parent_id : $merchant->id;
        $area_id = $request->area_id;
        $areas = CountryArea::with(['ServiceTypes'])
            ->with(['VehicleType', function ($q) {
                $q->where('admin_delete', NULL);
            }])
            ->where([['id', '=', $area_id]])->first();
        $service_ids = $areas->ServiceTypes->pluck('id')->toArray();
        $vehiclesList = $areas->VehicleType->filter(function ($item) use ($service_ids) {
            return in_array($item->pivot->service_type_id, $service_ids);
        });
        $service_with_vehicles = $areas->ServiceTypes->map(function ($item, $key) use ($vehiclesList) {
            $item->vehicle = $vehiclesList->filter(function ($vehicle) use ($item) {
                return $vehicle->pivot->service_type_id == $item->id;
            });
            return $item;
        });

        $array = [];
        $i = 0;
        foreach ($areas->ServiceTypes as $all_service) :
            echo "<div class='custom-control custom-checkbox mr-1'>";
            echo "<input type='checkbox' onclick='getvehicles(this)' data-id='$all_service->id' class='custom-control-input all_services' name='services[]' id='service-$all_service->id' value='$all_service->id' required>";
            echo "<label class='custom-control-label' for='service-$all_service->id'>$all_service->serviceName</label>";
            echo "</div>";

        /*echo "<li>";
            echo "<div class='checkbox'>";
              echo "<label class='checkbox-inline'>";
                       echo"<input type='checkbox'
                                    name='services[]'
                                    class='category'
                                    value='$all_service->id'>";
                           echo"$all_service->serviceName";
               echo"</label>";
            echo"</div>";
        echo"</li>";*/
        endforeach;
    }

    //    public function get_states(Request $request)
    //    {
    //        $validator = Validator::make($request->all(), [
    //            'country_id' => 'required|exists:countries,id',
    //        ]);
    //        if ($validator->fails()) {
    //            $errors = $validator->messages()->all();
    //            return $errors;
    //            exit();
    //        }
    //        $val = $request->country_id;
    //        $merchant_id = \Auth::user('merchant')->parent_id != 0 ? \Auth::user('merchant')->parent_id : \Auth::user('merchant')->id;
    //        $state = State::where([['merchant_id', $merchant_id], ['country_id', $val], ['status', true]])->get();
    //        if ($state->isNotEmpty()):
    //            echo "<option value=>" . trans('admin.select_state') . "</option>";
    //            foreach ($state as $key => $raw):
    //                /*if(empty($raw->langstateoneview)) :
    //                    $raw['name'] = $raw->langstateanyviews['name'];
    //                else :
    //                    $raw['name'] = $raw->langstateoneview['name'];
    //                endif;*/
    //                echo "<option value=" . $raw['id'] . ">" . $raw->Name . "</option>";
    //            endforeach;
    //        else:
    //            echo "<option value=>" . trans('admin.no_state_found') . "</option>";
    //        endif;
    //    }

    //    public function get_cities(Request $request)
    //    {
    //        $validator = Validator::make($request->all(), [
    //            'state_id' => 'required|exists:states,id',
    //        ]);
    //        if ($validator->fails()) {
    //            $errors = $validator->messages()->all();
    //            return $errors;
    //            exit();
    //        }
    //        $val = $request->state_id;
    //        $merchant_id = \Auth::user('merchant')->parent_id != 0 ? \Auth::user('merchant')->parent_id : \Auth::user('merchant')->id;
    //        $city = Town::where([['merchant_id', $merchant_id], ['state_id', $val], ['status', true]])->get();
    //        if ($city->isNotEmpty()):
    //            echo "<option value=>" . trans('admin.select_town') . "</option>";
    //            foreach ($city as $key => $raw):
    //                /*if(empty($raw->langstateoneview)) :
    //                    $raw['name'] = $raw->langstateanyviews['name'];
    //                else :
    //                    $raw['name'] = $raw->langstateoneview['name'];
    //                endif;*/
    //                echo "<option value=" . $raw['id'] . ">" . $raw->Name . "</option>";
    //            endforeach;
    //        else:
    //            echo "<option value=>" . trans('admin.no_town_found') . "</option>";
    //        endif;
    //    }

    public function CheckPool(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'area_id' => 'required',
        ]);
        if ($validator->fails()) {
            $errors = $validator->messages()->all();
            return $errors;
            exit();
        }
        $area_id = $request->area_id;
        $areas = CountryArea::whereHas('ServiceTypes', function ($query) {
            $query->where([['service_type_id', '=', 5]]);
        })->with(['ServiceTypes' => function ($query) {
            $query->where([['service_type_id', '=', 5]]);
        }])->where([['id', '=', $area_id]])->first();
        echo "<option value=''>" . trans("$string_file.select") . "</option>";
        if (!empty($areas->ServiceTypes)) {
            foreach ($areas->ServiceTypes as $value) {
                echo "<option value='" . $value->id . "'>" . $value->serviceName . "</option>";
            }
        }
    }

    public function VehicleType(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'area_id' => 'required',
        ]);
        if ($validator->fails()) {
            $errors = $validator->messages()->all();
            return $errors;
            exit();
        }
        $data = CountryArea::with(['VehicleType' => function ($query) {
            $query->where('admin_delete', NULL);
        }])
            ->find($request->area_id);
        $merchant = $data->Merchant;
        $string_file = $this->getStringFile(NULL, $merchant);
        echo "<option value=''>" . trans("$string_file.select") . "</option>";
        $arr_vehicle = $data->VehicleType->unique();
        foreach ($arr_vehicle as $vehicle) {
            echo "<option value='" . $vehicle->id . "'>" . $vehicle->VehicleTypeName . "</option>";
        }
    }

    public function VehicleSegment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'area_id' => 'required',
            'vehicle_type_id' => 'required',
        ]);
        if ($validator->fails()) {
            $errors = $validator->messages()->all();
            return $errors;
            exit();
        }
        $vehicle_type_id = $request->vehicle_type_id;
        $sub_group_for_admin = $request->sub_group_for_admin;
        $data = CountryArea::with(['Segment' => function ($q) use ($vehicle_type_id, $sub_group_for_admin) {
            $q->join('country_area_vehicle_type as cavt', 'cavt.segment_id', '=', 'segments.id');
            $q->where('cavt.vehicle_type_id', $vehicle_type_id);
            if (!empty($sub_group_for_admin)) {
                $q->where('segments.sub_group_for_admin', $sub_group_for_admin);
            }
        }])
            ->find($request->area_id);

        $merchant = $data->Merchant;
        $string_file = $this->getStringFile(NULL, $merchant);
        echo "<option value=''>" . trans("$string_file.select") . "</option>";
        $arr_segment = $data->Segment->unique();
        $permission_segments = get_permission_segments(1, true);
        foreach ($arr_segment as $value) {
            if (in_array($value->slag, $permission_segments)) {
                $name = !empty($value->Name()) ? $value->Name() : $value->slag;
                echo "<option value='" . $value->id . "'>" . $name . "</option>";
            }
        }
    }


    public function VehicleModel(Request $request)
    {
        $request->validate([
            'vehicle_type_id' => 'required|exists:vehicle_types,id',
            'vehicle_make_id' => 'required|exists:vehicle_makes,id',
        ]);
        $data = VehicleModel::where([['vehicle_type_id', '=', $request->vehicle_type_id], ['vehicle_make_id', '=', $request->vehicle_make_id], ['admin_delete', '=', NULL]])->get();
        foreach ($data as $vehicle) {
            if (!empty($vehicle->LanguageVehicleModelSingle)) {
                $name = $vehicle->LanguageVehicleModelSingle->vehicleModelName;
            } else {
                $name = $vehicle->LanguageVehicleModelAny->vehicleModelName;
            }
            echo "<option value='" . $vehicle->id . "'>" . $name . "</option>";
        }
    }

    //    public function VehicleConfig(Request $request)
    //    {
    //        $validator = Validator::make($request->all(), [
    //            'manual_area' => 'required',
    //            'service' => 'required',
    //        ]);
    //        if ($validator->fails()) {
    //            $errors = $validator->messages()->all();
    //            return $errors;
    //            exit();
    //        }
    //        $manual_area = $request->manual_area;
    //        $area = CountryArea::find($manual_area);
    //        $merchant_id = $area->merchant_id;
    //        $areaName = $area->CountryAreaName;
    //        $service = $request->service;
    ////        switch ($service) {
    ////            case "1":
    ////                $data = CountryArea::with(['VehicleType' => function ($query) use ($service) {
    ////                    $query->where([['service_type_id', '=', $service]]);
    ////                }])->find($manual_area);
    ////                echo "<option value=''>" . trans("$string_file.select") . "</option>";
    ////                foreach ($data->VehicleType as $vehicle) {
    ////                    echo "<option value='" . $vehicle->id . "'>" . $vehicle->VehicleTypeName . "</option>";
    ////                }
    ////                break;
    ////            case "2":
    ////            case "3":
    ////                $data = CountryArea::with(['Package' => function ($query) use ($service) {
    ////                    $query->where([['country_area_package.service_type_id', '=', $service]]);
    ////                }])->find($manual_area);
    ////                echo "<option value=''>" . trans('admin.message538') . "</option>";
    ////                foreach ($data->Package as $package) {
    ////                    echo "<option value='" . $package->id . "'>" . $package->PackageName . "</option>";
    ////                }
    ////                break;
    ////            case "4":
    ////                $data = OutstationPackage::where([['merchant_id', '=', $area->merchant_id]])->get();
    ////                echo "<option value=''>" . trans('admin.message539') . "</option>";
    ////                foreach ($data as $package) {
    ////                    echo "<option value='" . $package->id . "'>" . $areaName . " -> " . $package->PackageName . "</option>";
    ////                }
    ////                break;
    ////            case "5":
    ////                $data = VehicleType::where([['merchant_id', '=', $merchant_id], ['pool_enable', '=', 1]])->get();
    ////                echo "<option value=''>" . trans("$string_file.select") . "</option>";
    ////                foreach ($data as $vehicle) {
    ////                    echo "<option value='" . $vehicle->id . "'>" . $vehicle->VehicleTypeName . "</option>";
    ////                }
    ////                break;
    ////            default :
    ////                $data = CountryArea::with(['VehicleType' => function ($query) use ($service) {
    ////                    $query->where([['service_type_id', '=', $service]]);
    ////                }])->find($manual_area);
    ////                echo "<option value=''>" . trans("$string_file.select") . "</option>";
    ////                foreach ($data->VehicleType as $vehicle) {
    ////                    echo "<option value='" . $vehicle->id . "'>" . $vehicle->VehicleTypeName . "</option>";
    ////                }
    ////                break;
    ////        }
    //    }

    public function ServiceConfig(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'merchant_id' => 'required',
            'service_type_id' => 'required',
            'additional_support' => 'required',
        ]);
        if ($validator->fails()) {
            $errors = $validator->messages()->all();
            return $errors;
            exit();
        }

        $merchant = \App\Models\Merchant::find($request->merchant_id);
        $additional_support = $request->additional_support;
        $service_type_id = $request->service_type_id;
        $merchant_id = $merchant->id;
        $string_file = $this->getStringFile(NULL, $merchant);
        switch ($additional_support) {
            case "1":
                $arr_package = ServicePackage::where([['service_type_id', '=', $service_type_id], ['merchant_id', '=', $merchant_id],['packageStatus', '=', 1]])->get();
                echo "<option value=''>" . trans("$string_file.select") . "</option>";
                foreach ($arr_package as $package) {
                    echo "<option value='" . $package->id . "'>" . $package->PackageName . "</option>";
                }
                break;
            case "2":
                $data = OutstationPackage::where([['service_type_id', '=', $service_type_id], ['merchant_id', '=', $merchant_id],['status', '=', 1]])->get();
                echo "<option value=''>" . trans("$string_file.select") . "</option>";
                foreach ($data as $package) {
                    echo "<option value='" . $package->id . "'>" . $package->PackageName . "</option>";
                }
                break;
        }
    }


    public function SmsGatewayParams(Request $request)
    {

        $validator = Validator::make($request->all(), [
            'smsgateway_id' => 'required',
        ]);
        if ($validator->fails()) {
            $errors = $validator->messages()->all();
            return $errors;
            exit();
        }
        $params = SmsGateways::where('id', '=', $request->smsgateway_id)->value('params');
        $jsonparams = json_decode($params, true);
        $html = '';
        foreach ($jsonparams as $i => $v) {
            $html .= '<div class="form-group"><label>' . $v . '</label><input type="text" name="' . $i . '" placeholder="Enter ' . $v . '" class="form-control" required ></div>';
        }
        echo $html;
    }


    public function PaymentGatewayParams(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'payment_option_id' => 'required',
        ]);
        if ($validator->fails()) {
            $errors = $validator->messages()->all();
            return $errors;
            exit();
        }
        $params = PaymentOption::where('id', '=', $request->payment_option_id)->value('params');
        $jsonparams = json_decode($params, true);
        $html = '';
        foreach ($jsonparams as $i => $v) {
            $html .= '<div class="form-group"><label>' . $v . '</label><input type="text" name="' . $i . '" placeholder="Enter ' . $v . '" class="form-control" required ></div>';
        }
        echo $html;
    }

    /*
     * Code merged by @Amba
     * Delivery code
     * */


    //    public function getVehicleTypesByDelivery(Request $request)
    //    {
    //        $validator = Validator::make($request->all(), [
    //            'delivery_type' => 'required',
    //        ]);
    //        if ($validator->fails()) {
    //            $errors = $validator->messages()->all();
    //            return $errors;
    //            exit();
    //        }
    //
    //        $vehicle_types = VehicleType:: get();
    //        echo "<option value=''>" . trans("$string_file.select") . "</option>";
    //        foreach ($vehicle_types as $vehicle) {
    //            $selected = ($request->vehicle_type == $vehicle->id) ? "selected" : "";
    //            echo "<option " . $selected . " value='" . $vehicle->id . "'>" . $vehicle->VehicleTypeName . "</option>";
    //        }
    //
    //
    //    }

    //    public function getDeliveryTypes(Request $request)
    //    {
    //        $validator = Validator::make($request->all(), [
    //            'area_id' => 'required',
    //        ]);
    //        if ($validator->fails()) {
    //            $errors = $validator->messages()->all();
    //            return $errors;
    //            exit();
    //        }
    //        $area_id = $request->area_id;
    //        $areas = CountryArea::with(['deliveryTypes'])->where([['id', '=', $area_id],['status', '=', 1]])->first();
    //        echo "<option value=''>" . trans('admin.delivery_type_select') . "</option>";
    //        foreach ($areas->deliveryTypes as $value) {
    //            $selected = ($request->delivery_type == $value->id) ? 'selected' : '';
    //            echo "<option " . $selected . " value='" . $value->id . "'>" . $value->name . "</option>";
    //        }
    //    }

    public function countryAreaSegment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'area_id' => 'required',
        ]);
        if ($validator->fails()) {
            $errors = $validator->messages()->all();
            return $errors;
            exit();
        }
        $permission_segments = get_permission_segments(1, true);
        $arr_segment = $this->getCountryAreaSegment($request);
        $merchant = get_merchant_id(false);
        $string_file = $this->getStringFile(NULL, $merchant);
        $option_type = isset($request->option_type) ? $request->option_type : "SELECT-BOX";
        $output = "";
        if (!empty($arr_segment)) {
            switch ($option_type) {
                case "CHECK-BOX":  // For segment checkbox and select multiple
                    foreach ($arr_segment as $value) {
                        if (in_array($value->slag, $permission_segments)) {
                            $name = !empty($value->Name()) ? $value->Name() : $value->slag;
                            $output .= "<div class='col-md-2'><div class='checkbox-custom checkbox-primary'><input type='checkbox' name='segment_id[]' id='segment_id_$value->id' value='$value->id'><label for='segment_id_$value->id'>$name</label></div></div>";
                        }
                    }
                    break;
                case "SELECT-BOX":
                default:
                    $output = "<option value=''>" . trans("$string_file.select") . "</option>";
                    foreach ($arr_segment as $value) {
                        if (in_array($value->slag, $permission_segments)) {
                            $name = !empty($value->Name()) ? $value->Name() : $value->slag;
                            $output .= "<option value='" . $value->id . "'>" . $name . "</option>";
                        }
                    }
            }
        } else {
            $output = trans("$string_file.data_not_found");
        }
        echo $output;
    }

    function getCountryAreaSegment($request, $return = '')
    {
        if (!empty($request->area_id)) {
            $segment_group_id = $request->segment_group_id;
            $merchant_id = $request->merchant_id;
            if (empty($merchant_id)) {
                $merchant_id = get_merchant_id();
            }
            $handyman_store_id = $request->handyman_store_id;
            $sub_group_for_admin = $request->sub_group_for_admin;
            $sub_group_for_app = $request->sub_group_for_app;
            $check_where_or = isset($request->check_where_or) ? $request->check_where_or : false;
            $data = CountryArea::with(['Segment' => function ($q) use ($segment_group_id, $sub_group_for_admin, $merchant_id, $sub_group_for_app, $check_where_or, $handyman_store_id) {
                if ($check_where_or) {
                    if (is_array($segment_group_id)) {
                        $q->whereIn('segment_group_id', $segment_group_id);
                    } else {
                        if (!empty($segment_group_id)) {
                            $q->where('segment_group_id', $segment_group_id);
                        }
                    }
                    if (!empty($sub_group_for_admin)) {
                        $q->orWhere('sub_group_for_admin', $sub_group_for_admin);
                    }
                    // if (!empty($sub_group_for_app)) {
                    //     $q->orWhere('sub_group_for_app', $sub_group_for_app);
                    // }
                    if (!empty($sub_group_for_app) && is_array($sub_group_for_app)) {
                        $q->orWhereIn('sub_group_for_app', $sub_group_for_app);
                    }
                    else{
                        $q->orWhere('sub_group_for_app', $sub_group_for_app);
                    }
                } else {
                    if (is_array($segment_group_id)) {
                        $q->whereIn('segment_group_id', $segment_group_id);
                    } else {
                        if (!empty($segment_group_id)) {
                            $q->where('segment_group_id', $segment_group_id);
                        }
                    }
                    // if (!empty($segment_group_id)) {
                    //     $q->where('segment_group_id', $segment_group_id);
                    // }
                    if (!empty($sub_group_for_admin)) {
                        $q->where('sub_group_for_admin', $sub_group_for_admin);
                    }
                    if (!empty($sub_group_for_app)) {
                        $q->where('sub_group_for_app', $sub_group_for_app);
                    }
                }
                $q->whereHas('Merchant', function ($q) use ($merchant_id) {
                    $q->where('merchant_id', $merchant_id);
                });
                if(!empty($handyman_store_id)){
                    $q->WhereHas('HandymanStore', function ($qq) use ($handyman_store_id) {
                        $qq->where('id', $handyman_store_id);
                    });
                }
            }])
                ->where('status', 1)
                ->find($request->area_id);
            if (!empty($data)) {
                $arr_segment = $data->Segment->unique();
                if ($return == 'dropdown') {
                    $arr_return = [];
                    foreach ($arr_segment as $value) {
                        $name = !empty($value->Name($merchant_id)) ? $value->Name($merchant_id) : $value->slag;
                        $arr_return[$value->id] = $name;
                    }
                    return $arr_return;
                }
                return $arr_segment;
            }
        }
        return [];
    }

    public function getMerchantSegmentServices(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'segment_id' => 'required'
        ]);
        if ($validator->fails()) {
            $errors = $validator->messages()->all();
            return $errors;
            exit();
        }
        $merchant_id = !empty($request->merchant_id) ? $request->merchant_id : get_merchant_id();
        $arr_services = isset($request->arr_services) ? $request->arr_services : [];
        // DB::enableQueryLog();
        // $query = Segment::select('id', 'name', 'slag', 'icon', 'segment_group_id', 'sub_group_for_app', 'sub_group_for_admin')
        //     ->whereHas('Merchant', function ($q) use ($merchant_id) {
        //         $q->select('merchants.id as merchant_id');
        //         $q->where('merchant_id', $merchant_id);
        //         $q->select('id', 'sequence');
        //         $q->orderBy('sequence', 'ASC');
        //         $q->where('is_coming_soon', 2);
        //     })
        //     ->with(['ServiceType.Merchant' => function ($qq) use ($merchant_id, $arr_services) {
        //       $qq->where('merchant_id', $merchant_id);
        //         if (!empty($arr_services)) {
        //             $qq->whereIn('service_type_id', $arr_services);
        //         }
        //     }])
        //     ->whereHas('ServiceType.Merchant', function ($qqq) use ($merchant_id) {
        //         $qqq->where('merchant_id', $merchant_id);
        //     });

        // if (!empty($country_area_id)) {
        //     $query->with(['ServiceType.CountryArea' => function ($qqq) use ($country_area_id) {
        //         $qqq->where('country_area_id', $country_area_id);
        //     }]);
        //     $query->whereHas('ServiceType.CountryArea', function ($qqq) use ($country_area_id) {
        //         $qqq->where('country_area_id', $country_area_id);
        //     });
        // }
        // $query->where('id', $request->segment_id);
        // $query->join('merchant_service_type','merchant_service_type.segment_id','=','id');
        // $query->where('merchant_service_type.merchant_id',$merchant_id);
        // $query->join('merchant_segment', 'merchant_segment.segment_id', '=', 'id');
        // $query->where('merchant_segment.merchant_id', $merchant_id);
        // $query->orderBy('merchant_segment.sequence');
        // $segment_services = $query->get();
        $country_area_id = NULL;
        $segment_services = Segment::select(
            'segments.id',
            'segments.name',
            'segments.slag',
            'segments.icon',
            'segments.segment_group_id',
            'segments.sub_group_for_app',
            'segments.sub_group_for_admin'
        )
            ->where('segments.id', $request->segment_id)
            ->whereHas('Merchant', function ($q) use ($merchant_id) {
                $q->where('merchants.id', $merchant_id)
                    ->where('merchant_segment.is_coming_soon', 2);
            })
            ->whereHas('ServiceType.Merchant', function ($q) use ($merchant_id, $arr_services) {
                $q->where('merchant_id', $merchant_id);
                if (!empty($arr_services)) {
                    $q->whereIn('service_type_id', $arr_services);
                }
            })
            ->with(['ServiceType' => function ($q) use ($merchant_id, $arr_services, $country_area_id) {
                $q->whereHas('Merchant', function ($qq) use ($merchant_id, $arr_services) {
                    $qq->where('merchant_id', $merchant_id);
                    if (!empty($arr_services)) {
                        $qq->whereIn('service_type_id', $arr_services);
                    }
                });

                if (!empty($country_area_id)) {
                    $q->whereHas('CountryArea', function ($q2) use ($country_area_id) {
                        $q2->where('country_area_id', $country_area_id);
                    });
                }
            }])
            ->join('merchant_service_type', 'merchant_service_type.segment_id', '=', 'segments.id')
            ->where('merchant_service_type.merchant_id', $merchant_id)
            ->join('merchant_segment', 'merchant_segment.segment_id', '=', 'segments.id')
            ->where('merchant_segment.merchant_id', $merchant_id)
            ->orderBy('merchant_segment.sequence')
            ->distinct() // to avoid duplication from joins
            ->get();

        if(isset($request->calling_for) && $request->calling_for == "list"){
            $arr_segment_services = [];
            if(count($segment_services) >= 1){
                $segment_services = $segment_services->first();
                $filteredServices = $segment_services->ServiceType;
                // $filteredServices = $segment_services->ServiceType->filter(function ($service) use ($merchant_id) {
                //     return $service->owner_id == $merchant_id || $service->owner == 1;
                // });
                foreach($filteredServices as $service){
                    $arr_segment_services[$service->id] = $service->serviceName($merchant_id);
                }
            }
            return $arr_segment_services;
        }else{
            $string_file = $this->getStringFile($merchant_id);
            echo "<option value=''>" . trans("$string_file.select") . "</option>";
            if(count($segment_services) >= 1){
                $segment_services = $segment_services->first();
                $filteredServices = $segment_services->ServiceType;
                // $filteredServices = $segment_services->ServiceType->filter(function ($service) use ($merchant_id) {
                //     return $service->owner_id == $merchant_id || $service->owner == 1;
                // });
                foreach($filteredServices as $service){
                    echo "<option value='" . $service->id . "'>" .
                        $service->serviceName($merchant_id) . "</option>";
                }
            }
        }
    }

    function getVehicleTypeDetails($vehicleTypeId){
        try{
            $data = VehicleType::select('engine_type')->where("id", $vehicleTypeId)->first();
        }
        catch(\Exception $e){
            $message = $e->getMessage();
            return redirect()->json($message);
        }

        return response()->json($data);
    }

    function getvehicleTypes($country_area_id,$engine_type){
        $merchant_id =  get_merchant_id();
        try{
            $vehicle_types = VehicleType::whereHas('CountryArea', function ($q) use ($country_area_id) {
                $q->where([['country_area_id', '=', $country_area_id]]);
            })
                ->where([['engine_type', "=",  $engine_type], ['merchant_id', '=', $merchant_id], ['admin_delete', '=', NULL]])->get();
            $data =[];
            foreach($vehicle_types as $vehicle){
                array_push($data, ["id"=>$vehicle->id, "name"=>$vehicle->vehicleTypeName]);
            }
        }
        catch(\Exception $e){
            $message = $e->getMessage();
            return response()->json($message);
        }
        return response()->json($data);
    }


    function dvla_details($registration_number, $merchant_id){
        $merchant = \App\Models\Merchant::find($merchant_id);
        try{
            $res = $this->getDvlaDetails($registration_number, $merchant);
        }
        catch(\Exception $e){
            $message = $e->getMessage();
            return response()->json($message);
        }
        return response()->json($res);
    }


    public function getDriverMovingStatus(Request $request){
        $driver = Driver::find($request->driver_id);
        $latitude = $driver->current_latitude;
        $longitude = $driver->current_longitude;
        if($driver->Merchant->ApplicationConfiguration->working_with_redis == 1){
            $driver_data = getDriverCurrentLatLong($driver);
            $latitude =  $driver_data['latitude'];
            $longitude = $driver_data['longitude'];
        }
        return response()->json([
            "latitude" => $latitude,
            "longitude" => $longitude,
            "moving_location_distance" => $driver->moving_location_distance,
            "key"=> $driver->Merchant->BookingConfiguration->google_key_admin,
            "working_with_redis"=> $driver->Merchant->ApplicationConfiguration->working_with_redis,
        ]);
    }



    public function getGoogleReverseLocation(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'address'   => 'required',
//            'location'  => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                "status" => "FAILED",
                "msg" => ($validator->messages()->first()),
            ]);
        }

        $results = "[]";
        if($request->request_from == "taxicompany"){
            $taxi_company = get_taxicompany();
            $merchant = $taxi_company->Merchant;
            $merchant_id = $merchant->id;
        }
        else{
            $merchant_id = get_merchant_id();
        }
        $key = get_merchant_google_key($merchant_id, 'backend');

        try{
            $results = GoogleController::GoogleReverseLocation($request->address, $key, 'Manual Dispatch', "");
            saveApiLog($merchant_id, 'geocode', "AJAX_CALLS", "GOOGLE");

        }
        catch (\Exception $e){
            return response()->json([
                "status" => "FAILED",
                "data" => $e->getMessage(),
            ]);
        }

        return response()->json([
            "status" => "SUCCESS",
            "data" => json_decode($results),
        ]);


    }


    public function searchPlaces(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'keyword'   => 'required',
            'language'  => 'required|min:2|max:2',
//            'location'  => 'required',
            'for'       => 'required|in:USER,DRIVER',
            'user_id' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json([
                "status" => "FAILED",
                "msg" => ($validator->messages()->first()),
            ]);
        }

        try {
            $user =  User::find($request->user_id);
            $country_code = $user->Country->country_code;
            $plain_keyword = $request->keyword;
            $keyword = urlencode($request->keyword);
            $language = $request->language ?? 'en';
            $radius = 500;
            $location = $request->location;
            $country_id = $user->country_id;
            $merchant_id = $user->merchant_id;

            $config = $user->Merchant->ApplicationConfiguration;
            $booking_config = $user->Merchant->BookingConfiguration;

            $cachedPlaces = SearchablePlace::where('keyword', 'LIKE', "$plain_keyword%")
                ->where("merchant_id", $merchant_id)
                ->where("country_id", $country_id)
                ->take(5)
                ->get();

            $responses = [];
            if ($cachedPlaces->isNotEmpty()) {
                $responses = $cachedPlaces->map(function ($place) {
                    $response['keyword'] = $place->keyword;
                    $decoded_data = json_decode($place->response);
                    foreach($decoded_data as $data){
                        if(!isset($data->map)){
                            $data->map = "GOOGLE";
                        }
                    }
                    $response['google_response'] = $decoded_data;
                    return $response;
                });
                return response()->json([
                    "status" => "SUCCESS",
                    "data" => $responses,
                ]);
            }

            // Maps According to priority
            $common_helper =  new \App\Http\Controllers\Helper\CommonController();

            if(!empty($booking_config->map_box_key) && $config->map_box_autocomplete_enable == 1){
                $responses = $common_helper::searchViaMapbox($keyword, $booking_config, $user, $country_code, $location);
                saveApiLog($merchant_id, 'search/searchbox', "AJAX_CALLS", "MAP_BOX");
            }


            if (empty($responses) && !empty($booking_config->here_map_key) && $config->here_map_enable == 1) {
                $responses = $common_helper::searchViaHereMaps($keyword, $booking_config);
                saveApiLog($merchant_id, 'autocomplete', "AJAX_CALLS", "HERE_MAP");
            }

            if (empty($responses) && !empty($booking_config->google_key)) {
                $responses = $common_helper::searchViaGoogle($keyword, $language, $radius, $location, $booking_config, $user, $country_code);
                saveApiLog($merchant_id, "autocomplete" , "AJAX_CALLS", "GOOGLE");
            }

            if (empty($responses)) {
                return response()->json([
                    "status" => "FAILED",
                    "msg" => "No results found from any providers.",
                ]);
            }

            if($user->Merchant->demo != 1)
                $common_helper::storeSearchablePlace($merchant_id, $plain_keyword, $country_id, $responses);

            return response()->json([
                "status" => "SUCCESS",
                "data" => [['keyword' => $keyword, 'google_response' => $responses]],
            ]);

        } catch (\Exception $e) {

            \Log::channel('places_api')->emergency([
                "exception" =>$e->getMessage(),
                "time" => time(),
                "request_body"=>  $request->all(),
            ]);
            return response()->json([
                "status" => "FAILED",
                "msg" => $e->getMessage(),
            ]);
        }
    }


    public function getGoogleDirectionData(Request $request){

        $validator = Validator::make($request->all(), [
            'from'   => 'required',
            'to'  => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                "status" => "FAILED",
                "msg" => ($validator->messages()->first()),
            ]);
        }

        if($request->request_from == "taxicompany"){
            $taxi_company = get_taxicompany();
            $merchant = $taxi_company->Merchant;
            $merchant_id = $merchant->id;
        }
        elseif($request->request_from == "corporate"){
            $corporate = get_corporate();
            $merchant = $corporate->Merchant;
            $merchant_id = $merchant->id;
        }
        else{
            $merchant = get_merchant_id(false);
            $merchant_id = $merchant->id;
        }

        $results = [];

        try{

            $selected_map = getSelectedMap($merchant, "MANUAL_DISPATCH");
            switch ($selected_map){
                case "GOOGLE":
                    $key = get_merchant_google_key($merchant_id, 'backend');
                    $results = GoogleController::GoogleDistanceAndTime($request->from, $request->to, $key, 'metric' , true , "AJAX");
                    saveApiLog($merchant_id, 'directions', "AJAX_CALLS", "GOOGLE");
                    break;
                case "MAP_BOX":
                    $key = get_merchant_google_key($merchant_id, 'backend', "MAP_BOX");
                    [$start_lat, $start_lng] = explode(',', $request->from);
                    [$end_lat, $end_lng] = explode(',', $request->to);
                    $from = trim($start_lng) . ',' . trim($start_lat);
                    $to = trim($end_lng) . ',' . trim($end_lat);
                    $results = MapBoxController::MapBoxDistanceAndTime($from, $to, $key, 'metric', true, "AJAX");
                    saveApiLog($merchant_id, 'directions', "AJAX_CALLS", "MAP_BOX");
                    break;
                default:
                    $results = [];
            }
        }
        catch(\Exception $e){
            return response()->json([
                "status" => "FAILED",
                "msg" => $e->getMessage(),
            ]);
        }

        return response()->json([
            "status" => "SUCCESS",
            "data" => $results,
        ]);
    }


    public function getGoogleDistanceMatrixData(Request $request){

        $validator = Validator::make($request->all(), [
            'coord_string'   => 'required',
            'dest'  => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                "status" => "FAILED",
                "msg" => ($validator->messages()->first()),
            ]);
        }

        if($request->request_from == "taxicompany"){
            $taxi_company = get_taxicompany();
            $merchant_id = $taxi_company->merchant_id;
        }
        elseif($request->request_from == "corporate"){
            $corporate = get_corporate();
            $merchant = $corporate->Merchant;
            $merchant_id = $merchant->id;
        }
        else{
            $merchant_id = get_merchant_id();
        }
        $key = get_merchant_google_key($merchant_id, 'backend');
        $results = [];

        try{
            $results = GoogleController::GoogleDistanceMatrix($request->coord_string, $request->dest, $key, 'metric', "AJAX");
            saveApiLog($merchant_id, 'distanceMatrix', "AJAX_CALLS", "GOOGLE");
        }
        catch(\Exception $e){
            return response()->json([
                "status" => "FAILED",
                "msg" => $e->getMessage(),
            ]);
        }

        return response()->json([
            "status" => "SUCCESS",
            "data" => $results,
        ]);
    }

    public function getMerchantBusinessSegmentList(Request $request){
        $merchant_id = get_merchant_id();
        $countryId = $request->country_id;
        $segment_id = 3;
        if($request->slug == 'GROCERY'){
            $segment_id = 4;
        }
        $exclude_bs_id = $request->exclude_id;
        
        $bs = BusinessSegment::where('merchant_id', $merchant_id)
            ->where('country_id', $countryId)
            ->where('segment_id', $segment_id)
            ->where('is_warehouse','!=',1)
            ->when($exclude_bs_id, function ($q) use ($exclude_bs_id) {
                $q->where('id', '!=', $exclude_bs_id);
            })
            ->pluck('full_name', 'id'); // returns [id => name]

        return response()->json([
            'success' => true,
            'data'    => $bs
        ]);
    }
    
    
    
    public function searchUserForCorporate(Request $request)
    {
        $corporate_id = $request->corporate_id;
        $search_text  = trim($request->search_text);
        $country_code = $request->service_area_id;
        $phone_code = $request->phone_code;

        try {
            $corporate = \App\Models\Corporate::find($corporate_id);
            $merchant_id = $corporate->merchant_id;
            $string_file = $this->getStringFile($merchant_id);
            $phone = $phone_code.$search_text;
            $query = User::where('merchant_id', $merchant_id)->whereNull('user_delete')->whereNull('corporate_id');

            if (!empty($phone)) {
                $query->where(function($q) use ($phone) {
                    $q->where('UserPhone', $phone);
                });
            }

            $user = $query->first();
            $already_existing_user = User::where('merchant_id', $merchant_id)
                ->whereNull('user_delete')
                ->where('corporate_id', $corporate_id)
                ->where('UserPhone' , $phone)
                ->count();

            if ($user) {
                return response()->json([
                    'success' => true,
                    'user'    => [
                        'id'         => $user->id,
                        'first_name' => $user->first_name,
                        'last_name'  => $user->last_name,
                        'email'      => $user->email,
                        'phone_number' => $user->UserPhone,
                    ]
                ]);
            }
            else if($already_existing_user > 0){
                return response()->json([
                    'success' => false,
                    'user'    => null,
                    'message' => trans("$string_file.user")." ".trans("$string_file.already")." ".trans("$string_file.exist")
                ]);
            }
            else {
                return response()->json([
                    'success' => false,
                    'user'    => null,
                    'message' => trans("$string_file.user")." ".trans("$string_file.not")." ".trans("$string_file.found")
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'user'    => null,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    
    public function importUserToCorporate(Request $request)
    {
        $request->validate([
            'user_id'        => 'required|exists:users,id',
            'designation_id' => 'required|exists:employee_designations,id',
            'corporate_id'   => 'required|exists:corporates,id',
        ]);
    
        try {
            $user = User::find($request->user_id);
            // Attach user to corporate with designation
            $user->corporate_id = $request->corporate_id;
            $user->designation_id = $request->designation_id;
            $user->save();

            UserDetail::updateOrCreate(
                ['user_id' => $user->id],
                ['need_approval_for_corporate' => $request->need_approver]
            );

            if($request->need_approver == 1 && isset($request->approvers) && count($request->approvers) > 0){

                foreach ($request->approvers as $approver){
                    $designation_approver = new DesignationApprover();
                    $designation_approver->user_id = $user->id;
                    $designation_approver->approver_id = $approver;
                    $designation_approver->save();
                }
            }
    
            return response()->json([
                'success' => true,
                'message' => 'User imported successfully!',
                'user'    => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }


    public function sendOtp(Request $request){
        $request->validate([
            'user_id' => 'required',
        ]);
        $user_id = $request->user_id;
        $user = User::find($user_id);
        $phone = $user->UserPhone;
        $otp = mt_rand(111111, 999999);
        $SmsConfiguration = SmsConfiguration::where([['merchant_id', '=', $user->merchant_id]])->first();

//         if($SmsConfiguration){
//             $sms = new SmsController();
//             $sms->SendSms($user->merchant_id, $phone, $otp, "CUSTOM", NULL, false, null, "corporate msg");
//         }
//         else{
            $otp = 1234;
//         }
        Cache::put("otp_user_{$user->id}", $otp, now()->addMinutes(5));
        return response()->json([
            'success' => true,
            'message' => 'Otp has been sent !',
            'user'    => $user,
            'otp' =>$otp
        ]);
    }

    public function getOtp(Request $request)
    {
        $request->validate([
            'user_id' => 'required',
            'otp' => 'required',
        ]);
        $user_id = $request->user_id;
        $user = User::find($request->user_id);
        $otp = Cache::get("otp_user_{$user_id}");
        if($otp == $request->otp){
            return response()->json([
                'success' => true,
                'message' => 'Otp has been sent !',
                'user'    => $user,
                'otp' =>$otp
            ]);
        }
        else{
            return response()->json([
                'success' => false,
                'message' => 'Invalid Otp',
            ]);
        }
    }


    public function approveCorporateRide(Request $request)
    {

        try{
            $booking_id = $request->query('booking_id');
            $user_id = $request->query('approver');

            $booking = \App\Models\Booking::find($booking_id);
            if (!$booking) {
                return redirect()->back()->with('error', 'Booking not found.');
            }

            $user = \App\Models\User::find($user_id);
            if (!$user) {
                return redirect()->back()->with('error', 'Approver user not found.');
            }

            if ($booking->corporate_id != $user->corporate_id) {
                return redirect()->back()->with('error', 'User cannot approve this booking.');
            }

            $string_file = $this->getStringFile($booking->merchant_id);
            $data['notification_type'] = "RIDE_APPROVED";
            $data['segment_type'] = $booking->Segment->slag;
            $data['segment_sub_group'] = $booking->Segment->sub_group_for_app;
            $data['segment_group_id'] = $booking->Segment->segment_group_id;
            $data['segment_data'] = $booking->Segment->data;
            $data['booking_id'] = $booking->id;

            $arr_param['user_id'] = [$booking->user_id];
            $arr_param['data'] = $data;
            $arr_param['segment_data'] = $data;
            $arr_param['message'] = trans("$string_file.ride")." ".trans("$string_file.approved");
            $arr_param['merchant_id'] = $booking->merchant_id;
            $arr_param['title'] = trans("$string_file.ride")." ".trans("$string_file.approved")." ".trans("$string_file.by")." ".$user->first_name." ".$user->last_name ; // notification title
            $arr_param['large_icon'] = null;
            Onesignal::UserPushMessage($arr_param);
            if(!isset($booking->BookingDetail)){
                $booking->corporate_ride_approver = $user->id;
                $booking->save();
                return redirect()->back()->with('success', 'Booking approved successfully!');
            }
            else if(isset($booking->BookingDetail) && $booking->BookingDetail->is_instant_corporate_ride == 1){
                $booking->corporate_ride_approver = $user->id;
                $booking->booking_status = 1001;
                $booking->save();

                $configuration = \App\Models\BookingConfiguration::where([['merchant_id', '=', $booking->merchant_id]])->first();

                $param = [
                    'area' => $booking->country_area_id,
                    'segment_id' => $booking->segment_id,
                    'latitude' => $booking->pickup_latitude,
                    'longitude' => $booking->pickup_longitude,
                    'distance' => !empty($remain_ride_radius_slot) ? $remain_ride_radius_slot[0] : null,
                    // 'distance' => $configuration->normal_ride_later_radius,
                    'limit' => $configuration->normal_ride_later_request_driver,
                    'service_type' => $booking->service_type_id,
                    'vehicle_type' => $booking->vehicle_type_id,
                    'payment_method_id' => $booking->payment_method_id,
                    'estimate_bill' => $booking->estimate_bill,
                    'user_gender' => $booking->gender,
                    'booking_id'=> $booking->id,
                    'call_google_api'=> true,
                    'calling_from_cron'=> 1
                ];
                date_default_timezone_set("UTC");
                $drivers = Driver::GetNearestDriver($param);
                if(empty($drivers)){
                    if (!empty($configuration->driver_ride_radius_request)) {
                        $remain_ride_radius_slot = json_decode($configuration->driver_ride_radius_request, true);
                        if (!empty($remain_ride_radius_slot) && is_array($remain_ride_radius_slot) && (($remain_ride_radius_slot[1] != null) || ($remain_ride_radius_slot[2] != null)) && empty($drivers)) {
                            $param['distance'] = $remain_ride_radius_slot[1];
                            $drivers = Driver::GetNearestDriver($param);
                            if (empty($drivers)) {
                                $param['distance'] = $remain_ride_radius_slot[2];
                                $drivers = Driver::GetNearestDriver($param);
                            }
                        }
                    }
                }
                if (!empty($drivers) && $drivers->count() > 0) {
                    $booking->booking_status = 1001;
                    $booking->save();
                    $findDriver = new FindDriverController();
                    $findDriver->AssignRequest($drivers, $booking->id);
                    $bookingData = new BookingDataController();
                    $bookingData->SendNotificationToDrivers($booking, $drivers);

                    $booking->upcoming_notify = 1;
                    $booking->save();
                }
            }
        }
        catch(\Exception $e){
            return redirect()->back()->with('error', $e->getMessage());
        }

        return redirect()->back()->with('success', 'Booking approved successfully!');
    }
    
    public function saveCheckedSupport(Request $request){
        $id = $request->id;
        $checked = $request->checked;
        
        $customerSupport = \App\Models\CustomerSupport::find($id);
        $customerSupport->is_checked = $checked;
        $customerSupport->save();
        
    }


}
