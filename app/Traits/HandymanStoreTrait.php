<?php

namespace App\Traits;
//use App\Models\CountryArea;
use App\Http\Controllers\Helper\Merchant as MerchantController;
use App\Models\Segment;
use App\Models\ServiceType;
use DB;
use App\Models\BannerManagement;
//use App\Models\ServiceType;
use App;
use App\Models\HandymanStore\HandymanStore;
use App\Models\AdvertisementBanner;

trait HandymanStoreTrait{


    public function getAllHandymanStoreSegment($merchant_id, $call_from = '', $segment_group_id = NULL, $arr_segment = [], $country_area_id = NULL, $arr_segment_not_in = false ,$handyman_store_id)
    {
        $query = Segment::select('id', 'name', 'slag', 'icon', 'segment_group_id', 'sub_group_for_app', 'sub_group_for_admin')
            ->with(['Merchant' => function ($q) use ($merchant_id) {
                $q->where('id', $merchant_id);
                $q->select('id', 'sequence');
                $q->orderBy('sequence', 'ASC');
            }])
            ->with(['HandymanStore' => function ($q) {
                $q->select('id', 'sequence');
                $q->orderBy('sequence', 'ASC');
            }])
            ->whereHas('Merchant', function ($q) use ($merchant_id) {
                $q->select('merchants.id as merchant_id');
                $q->where('merchant_id', $merchant_id);
                $q->select('id', 'sequence');
                $q->orderBy('sequence', 'ASC');
                $q->where('is_coming_soon', 2);
            });
        if (!empty($country_area_id)) {
            $query->with(['ServiceType.CountryArea' => function ($qqq) use ($country_area_id) {
                $qqq->where('country_area_id', $country_area_id);
            }]);
            $query->whereHas('ServiceType.CountryArea', function ($qqq) use ($country_area_id) {
                $qqq->where('country_area_id', $country_area_id);
            });
        }
        if (!empty($segment_group_id)) {
            if (is_array($segment_group_id)) {
                $query->whereIn('segment_group_id', $segment_group_id);
            } else {
                $query->where('segment_group_id', $segment_group_id);
            }
        }

        if (!empty($arr_segment)) {
            if ($arr_segment_not_in == true) {
                $query->whereNotIn('id', $arr_segment);
            } else {
                $query->whereIn('id', $arr_segment);
            }
        }



        $query->join('merchant_segment', 'merchant_segment.segment_id', '=', 'id');
        if(!empty($handyman_store_id)){
            $query->where('merchant_segment.handyman_store_id', $handyman_store_id);
        }
        $query->where('merchant_segment.merchant_id', $merchant_id);
        $query->orderBy('merchant_segment.sequence');
        $segment_services = $query->get();

        if ($call_from == 'api' || $call_from == "service_type_screen") {
            // get coming soon segment of merchant
            $is_coming_query = Segment::select('id', 'name', 'slag', 'icon', 'segment_group_id', 'sub_group_for_app', 'sub_group_for_admin')
                ->with(['Merchant' => function ($q) use ($merchant_id) {
                    $q->where('id', $merchant_id);
                    $q->select('id')->where('is_coming_soon', 1);
                }])
                ->with(['HandymanStore' => function ($q) {
                    $q->select('id')->where('is_coming_soon', 1);
                }])
                ->whereHas('HandymanStore', function ($q)  {
                    $q->orderBy('sequence', 'ASC')->where('is_coming_soon', 1);
                })
                ->get();
            $segment_services = $segment_services->merge($is_coming_query);
        }

        $arr_segment = $segment_services->map(function ($item) use ($merchant_id, $call_from, $country_area_id) {

            $name = $item->Name($merchant_id);
            return  [
                'segment_id' => $item->id,
                'slag' => $item->slag,
                'is_coming_soon' => !empty($item->HandymanStore[0]['pivot']->is_coming_soon) ? $item->HandymanStore[0]['pivot']->is_coming_soon : 2,
                'name' => !empty($name) ? $name : $item->Name(),
                'segment_icon' => isset($item->HandymanStore[0]['pivot']->segment_icon) && !empty($item->HandymanStore[0]['pivot']->segment_icon) ? get_image($item->HandymanStore[0]['pivot']->segment_icon, 'segment', $merchant_id, true) :
                    get_image($item->icon, 'segment_super_admin', NULL, false),
                'dynamic_url'=> !empty($item->HandymanStore[0]['pivot']->dynamic_url) ? $item->HandymanStore[0]['pivot']->dynamic_url : ""
            ];
        });
        if ($call_from == 'api') {
            return $arr_segment;
        } else {
            $arr_segment = $arr_segment->toArray();
            $arr_segment = array_column($arr_segment, NULL, 'segment_id');
            return $arr_segment;
        }
    }

    public function getHandymanStoreSegmentServices($merchant_id, $handyman_store_id, $call_from = '', $segment_group_id = NULL, $arr_segment = [], $country_area_id = NULL, $arr_segment_not_in = false, $arr_services = [], $sub_group_for_admin = NULL, $service_type = "ALL", $show_category = false)
    {
        $query = Segment::select('id', 'name', 'slag', 'icon', 'segment_group_id', 'sub_group_for_app', 'sub_group_for_admin')
            ->with(['Merchant' => function ($q) use ($merchant_id) {
                $q->where('id', $merchant_id);
                $q->select('id', 'sequence');
                $q->orderBy('sequence', 'ASC');
            }])
            ->with(['HandymanStore' => function ($q) use ($handyman_store_id) {
                $q->where('id', $handyman_store_id);
                $q->select('id', 'sequence');
                $q->orderBy('sequence', 'ASC');
            }])
            ->whereHas('HandymanStore', function ($q) use ($handyman_store_id) {
                $q->select('handyman_stores.id as handyman_store_id');
                $q->where('handyman_store_id', $handyman_store_id);
                $q->select('id', 'sequence');
                $q->orderBy('sequence', 'ASC');
                $q->where('is_coming_soon', 2);
            })
            ->orwhereHas('Merchant', function ($q) use ($merchant_id) {
                $q->select('merchants.id as merchant_id');
                $q->where('merchant_id', $merchant_id);
                $q->select('id', 'sequence');
                $q->orderBy('sequence', 'ASC');
                $q->where('is_coming_soon', 2);
            })
            ->with(['ServiceType.HandymanStore' => function ($qq) use ($merchant_id,$handyman_store_id, $arr_services) {
                $qq->where('handyman_stores.merchant_id', $merchant_id);
                $qq->where('handyman_store_id', $handyman_store_id);
                if (!empty($arr_services)) {
                    $qq->whereIn('service_type_id', $arr_services);
                }
            }])
            ->whereHas('ServiceType.HandymanStore', function ($qqq) use ($handyman_store_id) {
                $qqq->where('handyman_store_id', $handyman_store_id);
            })
            ->orwhereHas('ServiceType.Merchant', function ($qqq) use ($merchant_id) {
                $qqq->where('merchant_id', $merchant_id);
            });
        if (!empty($country_area_id)) {
            $query->with(['ServiceType.CountryArea' => function ($qqq) use ($country_area_id) {
                $qqq->where('country_area_id', $country_area_id);
            }]);
            $query->whereHas('ServiceType.CountryArea', function ($qqq) use ($country_area_id) {
                $qqq->where('country_area_id', $country_area_id);
            });
        }
        if (!empty($segment_group_id)) {
            if (is_array($segment_group_id)) {
                $query->whereIn('segment_group_id', $segment_group_id);
            } else {
                $query->where('segment_group_id', $segment_group_id);
            }
        }
        if (!empty($sub_group_for_admin)) {
            $query->where('sub_group_for_admin', $sub_group_for_admin);
        }
        if (!empty($arr_segment)) {
            if ($arr_segment_not_in == true) {
                $query->whereNotIn('id', $arr_segment);
            } else {
                $query->whereIn('id', $arr_segment);
            }
        }
        $query->join('merchant_segment', 'merchant_segment.segment_id', '=', 'id');
        $query->where('merchant_segment.merchant_id', $merchant_id);
        $query->where('merchant_segment.handyman_store_id', $handyman_store_id);
        $query->orderBy('merchant_segment.sequence');
        $segment_services = $query->get();

        if ($call_from == 'api' || $call_from == "service_type_screen") {
            // get coming soon segment of merchant
            $is_coming_query = Segment::select('id', 'name', 'slag', 'icon', 'segment_group_id', 'sub_group_for_app', 'sub_group_for_admin')
                ->with(['Merchant' => function ($q) use ($merchant_id) {
                    $q->where('id', $merchant_id);
                    $q->select('id')->where('is_coming_soon', 1);
                }])
                ->with(['HandymanStore' => function ($q) use ($handyman_store_id) {
                    $q->where('id', $handyman_store_id);
                    $q->select('id')->where('is_coming_soon', 1);
                }])
                ->whereHas('HandymanStore', function ($q) use ($handyman_store_id) {
                    $q->where('handyman_store_id', $handyman_store_id);
                    $q->orderBy('sequence', 'ASC')->where('is_coming_soon', 1);
                })
                ->orwhereHas('Merchant', function ($q) use ($merchant_id) {
                    $q->where('merchant_id', $merchant_id);
                    $q->orderBy('sequence', 'ASC')->where('is_coming_soon', 1);
                })
                ->with(['ServiceType.Merchant' => function ($qq) use ($merchant_id,$handyman_store_id, $arr_services) {
                    $qq->where('merchant_id', $merchant_id);
                    $qq->where('handyman_store_id', $handyman_store_id);
                    //     $qqq->orderBy('sequence','ASC');
                    // });
                    if (!empty($arr_services)) {
                        $qq->whereIn('id', $arr_services);
                    }
                }])
                ->whereHas('ServiceType.Merchant', function ($qqq) use ($merchant_id) {
                    $qqq->where('merchant_id', $merchant_id);
                    $qqq->orderBy('sequence', 'ASC');
                })
                ->where("sub_owner_id" , $handyman_store_id)
                ->get();
            $segment_services = $segment_services->merge($is_coming_query);
        }

        $arr_segment = $segment_services->map(function ($item) use ($merchant_id,$handyman_store_id, $call_from, $country_area_id, $service_type, $show_category) {

            $name = $item->Name($merchant_id);
            return  [
                'segment_id' => $item->id,
                'slag' => $item->slag,
                'is_coming_soon' => !empty($item->HandymanStore[0]['pivot']->is_coming_soon) ? $item->HandymanStore[0]['pivot']->is_coming_soon : 2,
                'sub_group_for_app' => $item->sub_group_for_app,
                'segment_group_id' => $item->segment_group_id,
                'price_card_owner' => $item->HandymanStore[0]['pivot']->price_card_owner, // 1 admin, 2  driver
                'name' => !empty($name) ? $name : $item->slag,
                'segment_icon' => isset($item->HandymanStore[0]['pivot']->segment_icon) && !empty($item->HandymanStore[0]['pivot']->segment_icon) ? get_image($item->HandymanStore[0]['pivot']->segment_icon, 'segment', $merchant_id, true) :
                    get_image($item->icon, 'segment_super_admin', NULL, false),
                'arr_services' => $this->handymanStoreServiceTypes($item->ServiceType, $call_from, $merchant_id, $country_area_id, $service_type, $handyman_store_id),
                'arr_categories' => $item->slag == "TAXI" && $show_category ? $this->getTaxiCategory($merchant_id, $item->id, $country_area_id) : [],
                'dynamic_url'=> !empty($item->HandymanStore[0]['pivot']->dynamic_url) ? $item->HandymanStore[0]['pivot']->dynamic_url : ""
            ];
        });
        if ($call_from == 'api') {
            return $arr_segment;
        } else {
            $arr_segment = $arr_segment->toArray();
            $arr_segment = array_column($arr_segment, NULL, 'segment_id');
            return $arr_segment;
        }
    }

    protected function handymanStoreServiceTypes($arr_data, $call_from, $merchant_id, $country_area_id = NULL, $service_type = "", $handyman_store_id = NULL)
    {
        $arr_service = [];
        $data_list =  [];
        foreach ($arr_data as $data) {
            if (isset($data->HandymanStore[0]) && ($country_area_id  == NULL || (!empty($country_area_id) && $data->CountryArea->count() > 0))) {
                if ($service_type == "ALL" || ($service_type == "SELF_PICKUP" && $data->type == 6) || ($service_type == "DELIVERY" && $data->type != 6)) {
                    $serviceName = $data->serviceName;
                    $locale_service_name = $data->HandymanStoreServiceName($handyman_store_id);
                    $locale_service_description = !empty($data->HandymanStoreServiceDescription(NULL, $handyman_store_id)) ? $data->HandymanStoreServiceDescription(NULL, $handyman_store_id) : "";
                    $data_list = array(
                        'id' => $data->id,
                        'segment_id' => $data->segment_id,
                        'serviceName' => $serviceName,
                        'service_sequence' => isset($data->HandymanStore[0]['pivot']) ? $data->HandymanStore[0]['pivot']->sequence : 0,
                        'service_is_recommended' => isset($data->HandymanStore[0]['pivot']) && $data->HandymanStore[0]['pivot']->is_recommended == 1 ? true : false,
                        'service_icon' => isset($data->HandymanStore[0]['pivot']) && !empty($data->HandymanStore[0]['pivot']->service_icon) ? get_image($data->HandymanStore[0]['pivot']->service_icon, 'service', $merchant_id) : "",
                        'locale_service_name' => !empty($locale_service_name) ? $locale_service_name : $serviceName, //!empty($data->ServiceName($merchant_id)) ? $data->ServiceName($merchant_id) : $data->serviceName,
                        'locale_service_description' => (!empty($locale_service_description)) ? $locale_service_description : "",
                        'type' => $data->type,
                    );
                    if ($call_from == 'api') {
                        $arr_service[] = $data_list;
                    } else {
                        $arr_service[$data->id] = $data_list;
                    }
                }
            }
        }
        // sort the sequences of services
        array_multisort(array_column($arr_service, 'service_sequence'), SORT_ASC, $arr_service);
        return $arr_service;
    }

    public function getMerchantHandymanStore($request)
    {
        $merchant_id = $request->merchant_id;
        $segment_id =  $request->segment_id;
        $is_popular = $request->is_popular;
        $distance_unit = 1;
        $radius = $distance_unit == 2 ? 3958.756 : 6367;
        $distance = $request->distance;
        $latitude = $request->latitude;
        $longitude = $request->longitude;
        // 1 means demo login
        $user = $request->user('api');
        $user_type = $user->login_type == 1 ?  $user->login_type : NULL;
        $locale = \App::getLocale();

        $user_id =  $request->user_id;
        $is_fav = $request->is_favourite;

        $arr_categories_id = [];
        $haversineSQL = '( ' . $radius . ' * acos( cos( radians(' . $latitude . ') ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(' . $longitude . ') ) + sin( radians(' . $latitude . ') ) * sin( radians( latitude ) ) ) )';
        // p($haversineSQL);
        $query = HandymanStore::select('id', 'country_area_id', 'full_name', 'country_id',  'minimum_amount', 'business_logo', 'latitude', 'longitude', 'rating')
            ->addSelect(DB::raw($haversineSQL . ' AS distance'))
            ->join("merchant_segment", "merchant_segment.handyman_store_id", "=", "handyman_stores.id")
            ->where([['handyman_stores.merchant_id', '=', $merchant_id], ['status', '=', 1]])
//            ->where(function ($q) use ($is_search, $search_text, $locale, $arr_categories_id) {
//            })
            ->where(function ($q) use ($is_popular) {
                if (!empty($is_popular) && $is_popular == "YES") {
                    $q->where('is_popular', 1);
                }
            })

            ->where('country_area_id', $request->area);
//            if(empty($is_fav)){
//                $query->where([["merchant_segment.segment_id", $segment_id]]);
//            }
//            $query->orderBy('distance');
//            if (!empty($is_fav) && $is_fav == "YES") {
//                $query->whereHas('FavouriteHandymanStore', function ($qq) use ($user_id) {
//                    $qq->where([['user_id', '=', $user_id]]);
//                });
//            }
            if (!empty($is_fav) && $is_fav == "YES") {
                $query->distinct()->whereHas('FavouriteHandymanStore', function ($qq) use ($user_id) {
                    $qq->where([['user_id', '=', $user_id]]);
                });
            } else {
                $query->where([["merchant_segment.segment_id", $segment_id]]);
            }
        if ($user_type != 1) {
            $query->whereRaw($haversineSQL . '<= ?', [$distance]);
        }
        $arr_stores =  $query->paginate(10);
        return $arr_stores;
    }


    public function getMerchantAllHandymanStores($request)
    {
        $merchant_id = $request->merchant_id;
        $query = HandymanStore::select('id', 'country_area_id', 'full_name', 'country_id', 'business_logo', 'latitude', 'longitude')
            ->where([['handyman_stores.merchant_id', '=', $merchant_id]]);
        $arr_stores =  $query->paginate(10);
        return $arr_stores;
    }

    public function getHandymanStoreBanners($request, $filtered = true)
    {
        $query = AdvertisementBanner::with('HandymanStore')->select('name as banner_name','id','image as banner_images','handyman_store_id','redirect_url')
            ->where([
                ['handyman_store_id','=',$request->handyman_store_id],
                ['merchant_id','=',$request->merchant_id],
                ['status','=',1]
            ])
            ->orderBy('sequence')
            ->where('banner_for', 5)
            ->orderBy('updated_at')
            ->where('is_deleted', NULL)
            ->where(function ($q) use ($request) {
                if($request->home_screen == 1)
                {
                    $q->where('home_screen',1);
                }else{
                    $q->where('home_screen',"!=",1);
                }
                if(!empty($request->segment_id)){
                    $q->where('segment_id',$request->segment_id);
                }
            })
            ->where(function ($q) use ($request) {
                $q->where([['activate_date','=',NULL]]);
                $q->orWhere('activate_date','<=',date('Y-m-d'));
            })
            ->where(function ($q) use ($request) {
                $q->where([['expire_date','>=',date('Y-m-d')],['validity','=',2]]);
                $q->orWhere([['expire_date','=',NULL],['validity','=',1]]);

            });

            if($request->home_screen != 1){
                $query->orWhereNotNull('handyman_store_id');
            }
        $arr_banner = $query->get();
        $return_banners = [];
        if($filtered){
            $string_file = $this->getStringFile($request->merchant_id);
            $return_banners = $arr_banner->map(function ($item, $key) use ($request, $string_file) {
                $return = array(
                    'id' => $item->id,
                    'handyman_store_id' => $item->handyman_store_id,
                    'title' => $item->banner_name,
                    'image' => get_image($item->banner_images, 'handyman_store_banners', $request->merchant_id, true, false),
                    'redirect_url' => $item->redirect_url,
                );
                return $return;
            });
        }else{
            $return_banners = $arr_banner;
        }
        return $return_banners;
    }

    public function getHandymanStoreSegmentsArray($store_id)
    {
        return Segment::select('id', 'name', 'slag', 'icon', 'segment_group_id', 'sub_group_for_app', 'sub_group_for_admin')
            // ->whereIn("sub_group_for_app", [1, 2])
            ->whereHas('HandymanStore', function ($q) use ($store_id) {
                $q->select('handyman_stores.id as handyman_store_id');
                $q->where('handyman_store_id', $store_id);
                $q->select('id', 'sequence');
                $q->orderBy('sequence', 'ASC');
                // $q->where('is_coming_soon', 2);
            })->get()->pluck("slag")->toArray();


    }

    public function getHandymanStoreCategories($handyman_store_id, $segment_id)
    {
        $arr = [];
        $arr_categories = App\Models\HandymanCategory::whereHas('ServiceTypes')->where([['handyman_store_id', '=', $handyman_store_id], ['segment_id', '=', $segment_id], ['status', '=', 1]])->get();
        if(!empty($arr_categories)){
            $arr =   $arr_categories->map(function ($category) use ($handyman_store_id) {
                return [
                    'category_id' => $category->id,
                    'name' => $category->Category,
                    'category_image' => get_image($category->icon,'category',$category->merchant_id),
                    'description' => $category->Description,
                    'services_count' => count($category->ServiceTypes)
                ];
            });
        }
        return $arr;
    }



    public function getStoreSegmentServices($request)
    {
        $segment_id = $request->segment_id;
        $handyman_store_id= $request->handyman_store_id;
        $merchant_id = $request->merchant_id;
        $segment_price_card_id = $request->segment_price_card_id;
        $country_area_id = $request->area;
        $merchant_helper = new MerchantController();

        $query = ServiceType::select('service_types.id', 'service_types.serviceName')
            ->with(['HandymanStore' => function ($q) use ($segment_id, $handyman_store_id) {
                $q->where('handyman_store_id', $handyman_store_id);
                $q->orderBy('sequence');
            }])
            ->whereHas('HandymanStore', function ($q) use ($segment_id, $handyman_store_id) {
                $q->where('handyman_store_id', $handyman_store_id);
                $q->orderBy('sequence');
            })
            ->whereHas('CountryArea', function ($q) use ($segment_id, $merchant_id, $country_area_id) {
                $q->where('country_area_id', $country_area_id);
            })
            ->where('service_types.segment_id', $segment_id)
            ->where('service_types.type', '!=', 6);

        $query->with(['SegmentPriceCardDetail' => function ($q) use ($segment_price_card_id, $merchant_id,$handyman_store_id, $country_area_id) {

            $q->addSelect('id', 'service_type_id', 'amount');
            if (!empty($segment_price_card_id)) {
                $q->where('segment_price_card_id', $segment_price_card_id);
            }
            $q->whereHas('SegmentPriceCard', function ($qq) use ($segment_price_card_id, $handyman_store_id, $country_area_id) {
                $qq->where('handyman_store_id', $handyman_store_id);
                if (!empty($segment_price_card_id)) {
                    $qq->where('id', $segment_price_card_id);
                }
                if (!empty($country_area_id)) {
                    $qq->where('country_area_id', $country_area_id);
                }
            });
        }]);
        if(isset($request->handyman_category_id) && !empty($request->handyman_category_id)){
            $query->whereHas("HandymanCategory", function($q) use($request){
                $q->where("id", $request->handyman_category_id);
            });
        }
        // if($price_card_owner == 1 ) {
        //     $query->whereHas('SegmentPriceCardDetail', function ($q) use ($segment_price_card_id) {
        //         $q->addSelect('id','service_type_id','amount');
        //         $q->where('segment_price_card_id', $segment_price_card_id);
        //     });
        // }

        $arr_services = $query->get();

//        p($arr_services);
        if (count($arr_services) > 0) {
            $arr_services = $arr_services->map(function ($item, $key) use ($merchant_id,$handyman_store_id, $merchant_helper) {
                // p($item->SegmentPriceCardDetail);
                // if($item->id == 11)
                // {
                //   //p($item->Merchant[0]);
                // }
                return array(
                    'id' => $item->id,
                    'name' => !empty($item->HandymanStoreServiceName($handyman_store_id)) ? $item->HandymanStoreServiceName($handyman_store_id) : $item->serviceName,
                    'amount' => isset($item->SegmentPriceCardDetail->amount) ? $item->SegmentPriceCardDetail->amount : 0,
                    'amount_string' => isset($item->SegmentPriceCardDetail->amount) ? (string)$merchant_helper->PriceFormat($item->SegmentPriceCardDetail->amount, $merchant_id): "0",
                    'segment_price_card_detail_id' => isset($item->SegmentPriceCardDetail->id)   ? $item->SegmentPriceCardDetail->id : null,
                    'selected' => isset($item->Driver[0]->id)  && !empty($item->Driver[0]->id) ? true : false,
                    'description' => !empty($item->HandymanStoreServiceDescription($handyman_store_id)) ? $item->HandymanStoreServiceDescription($handyman_store_id) : "",
                    'service_icon' => isset($item->HandymanStore[0]['pivot']) && !empty($item->HandymanStore[0]['pivot']->service_icon) ? get_image($item->HandymanStore[0]['pivot']->service_icon, 'service', $merchant_id) : "",
                    'service_sequence' => isset($item->HandymanStore[0]['pivot']) ? $item->HandymanStore[0]['pivot']->sequence : 0,
                );
            });
            // sort the sequences of $arr_services
            $arr_services = $arr_services->toArray(); // it must be array
            array_multisort(array_column($arr_services, 'service_sequence'), SORT_ASC, $arr_services);
        }
        return $arr_services;
    }
}
