<?php

namespace App\Http\Controllers\Merchant;

use App\Models\DeliveryProduct;
use App\Models\InfoSetting;
use App\Models\LanguageDeliveryProduct;
use App\Models\WeightUnit;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Validator;
use DB;
use App\Traits\MerchantTrait;
use App\Traits\ImageTrait;
use App\Models\DeliveryProductType;
use App\Models\DeliveryProductCategoryType;
use App\Models\LanguageDeliveryProductType;

class DeliveryProductController extends Controller
{
    use MerchantTrait,ImageTrait;
    public function __construct()
    {
        $info_setting = InfoSetting::where('slug','DELIVERY_PRODUCT')->first();
        view()->share('info_setting', $info_setting);
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $checkPermission = check_permission(1, 'DELIVERY');
        if ($checkPermission['isRedirect']) {
            return $checkPermission['redirectBack'];
        }
        $merchant = get_merchant_id(false);
        $merchant_id = $merchant->id;
        $delivery_products = DeliveryProduct::where([['merchant_id','=',$merchant_id]])->paginate(15);
        $weight_units = WeightUnit::where([['merchant_id','=',$merchant_id],['status','=',1]])->get();
        $data = [];
        $delivery_product_pricing = isset($merchant->Configuration->delivery_product_pricing) && $merchant->Configuration->delivery_product_pricing == 1 ? true :false;
        $delivery_product_category = isset($merchant->BookingConfiguration->delivery_product_category_type_enable) && $merchant->BookingConfiguration->delivery_product_category_type_enable == 1 ? true :false;
        $delivery_categories = DeliveryProductType::where('merchant_id',$merchant->id)->get();
        return view('merchant.delivery_product.index',compact('delivery_products','data','weight_units', 'delivery_product_pricing','delivery_product_category','delivery_categories'));
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(),[
           'product_name' => 'required',
           'weight_unit' => 'required'
        ]);

        if ($validator->failed()){
            $msg = $validator->messages()->all();
            return redirect()->back()->withErrors($msg[0]);
        }

        DB::beginTransaction();
        try {
            $merchant = get_merchant_id(false);
            $merchant_id = $merchant->id;
            $string_file = $this->getStringFile(NULL,$merchant);
            $delivery_product = DeliveryProduct::create([
                'segment_id' => 2,
                'merchant_id' => $merchant_id,
                'weight_unit_id' => $request->weight_unit,
                'price' => isset($request->price) ? $request->price : NULL,
                'status' => 1
            ]);
             if($request->hasFile('delivery_product_image')){
                $delivery_product->delivery_product_image = isset($request->delivery_product_image) && !empty($request->delivery_product_image) ? $this->uploadImage('delivery_product_image', 'delivery_product_image',$merchant_id) : "";
                $delivery_product->save();
            }
            // dd($request->category_id);
             if($request->category_id){
                DeliveryProductCategoryType::updateOrCreate([
                    'delivery_product_id'=> $delivery_product->id,
                    'merchant_id'=> $merchant_id
                ],['delivery_product_type_id'=>$request->category_id]);
            }
            $this->SaveLanguageDelivery($merchant_id, $delivery_product->id, $request->product_name,$request->description);
        }catch (\Exception $e){
            DB::rollback();
            return redirect()->back()->withErrors($e->getMessage());
        }
        // Commit Transaction
        DB::commit();
        return redirect()->route('delivery_product.index')->withSuccess(trans("$string_file.added_successfully"));
    }

    public function SaveLanguageDelivery($merchant_id, $delivery_product_id, $name,$description = NULL)
    {
        LanguageDeliveryProduct::updateOrCreate([
            'merchant_id' => $merchant_id, 'locale' => App::getLocale(), 'delivery_product_id' => $delivery_product_id
        ],[
            'product_name' => $name,
            'description'=> $description
        ]);
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\DeliveryProduct  $deliveryProduct
     * @return \Illuminate\Http\Response
     */
    public function show(DeliveryProduct $deliveryProduct)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\DeliveryProduct  $deliveryProduct
     * @return \Illuminate\Http\Response
     */
    public function edit(Request $request, $id = NULL)
    {
      $delivery_product = DeliveryProduct::Find($id);
      $merchant = get_merchant_id(false);
      $is_demo = $merchant->demo == 1 ? true : false;
      $merchant_id = $merchant->id;
      $weight_units = WeightUnit::where([['merchant_id','=',$merchant_id],['status','=',1]])->get();
      $delivery_product_pricing = isset($merchant->Configuration->delivery_product_pricing) && $merchant->Configuration->delivery_product_pricing == 1 ? true :false;
      $delivery_product_category = isset($merchant->BookingConfiguration->delivery_product_category_type_enable) && $merchant->BookingConfiguration->delivery_product_category_type_enable == 1 ? true :false;
      $delivery_categories = DeliveryProductType::where('merchant_id',$merchant->id)->get();
      return view('merchant.delivery_product.edit',compact('delivery_product','weight_units','is_demo','delivery_product_pricing','delivery_product_category','delivery_categories'));
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\DeliveryProduct  $deliveryProduct
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(),[
            'product_name' => 'required',
            'weight_unit' => 'required'
        ]);

        if ($validator->failed()){
            $msg = $validator->messages()->all();
            return redirect()->back()->withErrors($msg[0]);
        }

        DB::beginTransaction();
        try {
            $merchant = get_merchant_id(false);
            $merchant_id = $merchant->id;
            $string_file = $this->getStringFile(NULL,$merchant);
            $delivery_product = DeliveryProduct::Find($id);
            $delivery_product->weight_unit_id = $request->weight_unit;
            $delivery_product->price = isset($request->price) ? $request->price : NULL;
            if($request->hasFile('delivery_product_image')){
                $delivery_product->delivery_product_image = isset($request->delivery_product_image) && !empty($request->delivery_product_image) ? $this->uploadImage('delivery_product_image', 'delivery_product_image',$merchant_id) : "";
            }
            $delivery_product->save();
            if($request->category_id){
                DeliveryProductCategoryType::updateOrCreate([
                    'delivery_product_id'=> $id,
                    'merchant_id'=> $merchant_id
                ],['delivery_product_type_id'=>$request->category_id]);
            }
            $this->SaveLanguageDelivery($delivery_product->merchant_id, $delivery_product->id, $request->product_name,$request->description);
        }catch (\Exception $e){
            $message = $e->getMessage();
            // Rollback Transaction
            DB::rollback();
            return redirect()->back()->withErrors($message);
        }
        // Commit Transaction
        DB::commit();
        return redirect()->route('delivery_product.index')->withSuccess(trans("$string_file.added_successfully"));
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\DeliveryProduct  $deliveryProduct
     * @return \Illuminate\Http\Response
     */
    public function destroy(DeliveryProduct $deliveryProduct)
    {
        //
    }

    public function ChangeStatus($id,$status,$category_type = 2){
        $merchant = get_merchant_id(false);
        $string_file = $this->getStringFile(NULL,$merchant);
        $demo_special_permission = $this->demoSpecialPermission($merchant);
        if(!$demo_special_permission['edit_permission']) {
            return redirect()->back()->withErrors(trans("$string_file.demo_warning_message"));
        }
        DB::beginTransaction();
        try{
            if($category_type == 1){
                $deliveryProductType = DeliveryProductType::findOrFail($id);
                $deliveryProductType->status = $status;
                $deliveryProductType->save();
            }else{
                $deliveryProduct = DeliveryProduct::findOrFail($id);
                $deliveryProduct->status = $status;
                $deliveryProduct->save();
            }
        }catch (\Exception $e){
            DB::rollback();
            return redirect()->back()->withErrors($e->getMessage());
        }
        DB::commit();
        if($category_type == 1){
            return redirect()->route('delivery_product.type.index')->withSuccess(trans("$string_file.status_updated"));
        }
        return redirect()->route('delivery_product.index')->withSuccess(trans("$string_file.status_updated"));
    }
    
    public function DeliveryProductType(){
        $merchant = get_merchant_id(false);
        $delivery_products = DeliveryProductType::where('merchant_id',$merchant->id)->paginate(15);
        return view('merchant.delivery_product.delivery_product_type',compact('delivery_products'));
    }
    
    public function StoreDeliveryProductType(Request $request){
       $validator = Validator::make($request->all(),[
           'product_name' => 'required'
        ]);

        if ($validator->failed()){
            $msg = $validator->messages()->all();
            return redirect()->back()->withErrors($msg[0]);
        }

        DB::beginTransaction();
        try {
            $merchant = get_merchant_id(false);
            $merchant_id = $merchant->id;
            $string_file = $this->getStringFile(NULL,$merchant);
            $delivery_product_type = DeliveryProductType::create([
                'merchant_id' => $merchant_id,
                'status' => 1,
            ]);
            $this->SaveLanguageDeliveryProductType($merchant_id, $delivery_product_type->id, $request->category_name);
        }catch (\Exception $e){
            DB::rollback();
            return redirect()->back()->withErrors($e->getMessage());
        }
        // Commit Transaction
        DB::commit();
        return redirect()->route('delivery_product.type.index')->withSuccess(trans("$string_file.added_successfully"));
    }
    
    public function SaveLanguageDeliveryProductType($merchant_id, $delivery_product_type_id, $name)
    {
        LanguageDeliveryProductType::updateOrCreate([
            'merchant_id' => $merchant_id, 'locale' => App::getLocale(), 'delivery_product_type_id' => $delivery_product_type_id
        ],[
            'category_name' => $name
        ]);
    }
    
    public function updateDeliveryProductType(Request $request, $id)
    {
        $validator = Validator::make($request->all(),[
            'category_name' => 'required'
        ]);

        if ($validator->failed()){
            $msg = $validator->messages()->all();
            return redirect()->back()->withErrors($msg[0]);
        }

        DB::beginTransaction();
        try {
            $merchant = get_merchant_id(false);
            $merchant_id = $merchant->id;
            $string_file = $this->getStringFile(NULL,$merchant);
            $delivery_product_type = DeliveryProductType::Find($id);
            $this->SaveLanguageDeliveryProductType($delivery_product_type->merchant_id, $delivery_product_type->id, $request->category_name);
        }catch (\Exception $e){
            $message = $e->getMessage();
            // Rollback Transaction
            DB::rollback();
            return redirect()->back()->withErrors($message);
        }
        // Commit Transaction
        DB::commit();
        return redirect()->route('delivery_product.type.index')->withSuccess(trans("$string_file.added_successfully"));
    }
}
