<?php

namespace App\Http\Controllers\Merchant;

use App\Http\Controllers\Helper\WalletTransaction;
use App\Models\CorporateWalletTransaction;
use App\Models\Country;
use App\Models\Merchant;
use App\Models\User;
use App\Models\UserDetail;
use Auth;
use App\Models\Corporate;
use App\Models\CorporateInvoice;
use App\Models\CorporateSettlementLog;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use App\Traits\ImageTrait;
use App\Traits\MerchantTrait;
use DB;

class CorporateController extends Controller
{
    use ImageTrait,MerchantTrait;

    public function index()
    {
//        $checkPermission =  check_permission(1,'corporate');
        $checkPermission = check_permission(1, ['corporate','corporate_DELIVERY'],true);
        if ($checkPermission['isRedirect']){
            return  $checkPermission['redirectBack'];
        }
        $merchant = get_merchant_id(false);
        $merchant_id = $merchant->id;
        $segments = $merchant->Segment->whereIn('slag',['TAXI','DELIVERY']);
        $corporates = Corporate::where([['merchant_id', '=', $merchant_id]])->paginate(25);
        return view('merchant.corporate.index', compact('corporates','merchant'));
    }

    public function add(Request $request, $id = NULL)
    {
//        $checkPermission =  check_permission(1,'corporate');
        $checkPermission = check_permission(1, ['corporate','corporate_DELIVERY'],true);
        if ($checkPermission['isRedirect']){
            return  $checkPermission['redirectBack'];
        }
        $merchant = get_merchant_id(false);
        $merchant_id = $merchant->id;
        $segments = $merchant->Segment->whereIn('slag',['TAXI','DELIVERY']);
        $countries = Country::where([['merchant_id', '=', $merchant_id]])->get();
        $corporate = NULL;
        if(!empty($id))
        {
            $corporate = Corporate::findOrFail($id);
        }
        return view('merchant.corporate.create', compact('countries','corporate','segments','merchant'));
    }


//    public function save(Request $request, $id = NULL)
//    {
//        $merchant_id = get_merchant_id();
//        $validator = Validator::make($request->all(), [
//            'country' => 'required|integer',
//            'corporate_name' => 'required',
//            'email' => [
//                    'required',
//                    'email',
//                    Rule::unique('corporates', 'email')
//                        ->ignore($id)
//                        ->where(function ($query) use ($merchant_id) {
//                            return $query->where('merchant_id', $merchant_id);
//                        }),
//                ],
//            // 'phone' => [
//            //     'required',
//            //     'regex:/^[0-9]+$/',
//            //     Rule::unique('corporates', 'corporate_phone')
//            //         ->ignore($id)
//            //         ->where(function ($query) use ($merchant_id) {
//            //             return $query->where('merchant_id', $merchant_id);
//            //         }),
//            // ],
//            'address' => 'required',
//            'password' => 'required_without:id|confirmed',
////            'corporate_logo' =>'required_without:id',
//            'settlement_type' => 'required|integer',
//            'billing_credit_limit' => 'required',
//            'corporate_fee_method' => 'required|integer',
//            'corporate_fee' => 'required|integer',
//        ]);
//
//        if ($validator->fails()) {
//            $errors = $validator->messages()->all();
////            p($errors);
//            return redirect()->back()->withInput()->withErrors($errors);
//        }
//
//        DB::beginTransaction();
//        try{
//            $data = $request->except('_token', '_method');
//            $alias_name = str_slug($request->input('corporate_name'));
////            $password = Hash::make($request->password);
////            $country = Country::find($request->country);
////            $merchant_id = Auth::user('merchant')->parent_id != 0 ? Auth::user('merchant')->parent_id : Auth::user('merchant')->id;
////            Corporate::create([
////                'merchant_id' => $merchant_id,
////                'country_id' => $request->country,
////                'corporate_name' => $request->corporate_name,
////                'alias_name' => $data['alias_name'],
////                'email' => $request->email,
////                'corporate_phone' => $country->phonecode . $request->phone,
////                'corporate_address' => $request->address,
////                'corporate_logo' => $this->uploadImage('corporate_logo','corporate_logo'),
////                'password' => $password
////            ]);
//
//            if(!empty($id))
//            {
//                $corporate = Corporate::findOrFail($id);
//            }
//            else
//            {
//                $corporate = new Corporate;
//                $corporate->alias_name = $alias_name;
//            }
//
//            $country = Country::find($request->country);
//            $corporate->merchant_id = $merchant_id;
//            $corporate->corporate_name = $request->corporate_name;
//            $corporate->country_id = $request->country;
//            $corporate_phone = $country->phonecode . $request->phone;
//
//            $exists = Corporate::where('merchant_id', $merchant_id)
//                ->where('corporate_phone', $corporate_phone)
//                ->where('id', '!=', $id)
//                ->exists();
//
//            if ($exists) {
//                return back()->withErrors(['phone' => 'This phone number is already registered for this merchant.'])->withInput();
//            }
//            $corporate->corporate_phone = $country->phonecode . $request->phone;
//
//            $corporate->email = $request->email;
//            $corporate->corporate_address = $request->address;
//            $corporate->segment_id = $request->segment_id;
////            $corporate->price_type = $request->price_type;
////            $corporate->price_card_amount = $request->price_card_amount;
//            if($request->hasFile('corporate_logo')){
//                $corporate->corporate_logo = $this->uploadImage('corporate_logo','corporate_logo');
//            }
//            if($request->password){
//                $password = Hash::make($request->password);
//                $corporate->password = $password;
//            }
//            $corporate->settlement_type = $request->settlement_type;
//            $corporate->billing_credit_limit = $request->billing_credit_limit;
//            if($request->settlement_type == 4){
//                $corporate->settlement_custom_days  = $request->custom_days;
//            }
//            $corporate->corporate_fee_method = $request->corporate_fee_method;
//            $corporate->corporate_fee = $request->corporate_fee;
//            if(!empty($request->corporate_insurance_charge)){
//                $corporate->corporate_insurance_charge = $request->corporate_insurance_charge;
//            }
//            $corporate->save();
//
//            if(empty($id)){
//                $existingUser = User::where('UserPhone', $corporate_phone)->first();
//                if(!empty($existingUser)) {
//                    $existingUser->corporate_id = $corporate->id;
//                    $existingUser->save();
//                    $userDetail = UserDetail::UpdateOrCreate(
//                        ['user_id' => $existingUser->id],
//                        ['is_default_corporate_user' => 1]
//                    );
//                }
//                else{
//                    $user = User::create([
//                        'merchant_id'       => $merchant_id,
//                        'country_id'        => $request->country,
//                        'first_name'        => $request->corporate_name,
//                        'last_name'         => '',
//                        'UserPhone'         => $country->phonecode . $request->phone,
//                        'email'             => $request->email,
//                        'password'          => Hash::make($request->password),
//                        'UserSignupType'    => 1,
//                        'UserSignupFrom'    => 2,
//                        'UserProfileImage'  => $this->uploadImage('corporate_logo', 'corporate_user', $merchant_id),
//                        'user_type'         => 1,
//                        'user_gender'       => 1,
//                        'corporate_id'      => $corporate->id,
//                    ]);
//
//                    UserDetail::updateOrCreate(
//                        ['user_id' => $user->id],
//                        ['is_default_corporate_user' => 1]
//                    );
//                }
//            }
//            elseif(!empty($id)){
//                $old_default_user = User::with('UserDetail')->whereHas("UserDetail", function($q){
//                    $q->where('is_default_corporate_user', 1);
//                })->where('corporate_id', $corporate->id)->first();
//
//                if(!empty($old_default_user) && $old_default_user->UserPhone != $corporate_phone){
//                    $old_default_user->is_default_corporate_user = NULL;
//                    $old_default_user->save();
//
//                    $new_default_user =  User::where("UserPhone", $corporate_phone)->where("merchant_id", $corporate->merchant_id)->first();
//                    UserDetail::UpdateOrCreate(
//                        ['user_id' => $new_default_user->id],
//                        ['is_default_corporate_user' => 1]
//                    );
//                }
//            }
//
//
//
//
//        }catch (\Exception $e) {
//            $message = $e->getMessage();
//            p($message);
//            // Rollback Transaction
//            DB::rollback();
//
//        }
//        // Commit Transaction
//        DB::commit();
//        $string_file = $this->getStringFile($merchant_id);
//        return redirect()->route('corporate.index')->withSuccess(trans($string_file.".added_successfully"));
//    }


    public function save(Request $request, $id = NULL)
    {
        $merchant_id = get_merchant_id();
        $country = Country::find($request->country);

        if (!$country) {
            return back()->withErrors(['country' => 'Invalid country selected.'])->withInput();
        }

        $corporate_phone = $country->phonecode . $request->phone;

        $validator = Validator::make($request->all(), [
            'country' => 'required|integer',
            'corporate_name' => 'required',
            'email' => [
                'required',
                'email',
                Rule::unique('corporates', 'email')
                    ->ignore($id)
                    ->where(function ($query) use ($merchant_id) {
                        return $query->where('merchant_id', $merchant_id);
                    }),
            ],
            'phone' => [
                'required',
                'regex:/^[0-9]+$/',
                Rule::unique('corporates', 'corporate_phone')
                    ->ignore($id)
                    ->where(function ($query) use ($merchant_id, $corporate_phone) {
                        return $query->where('merchant_id', $merchant_id)
                            ->where('corporate_phone', $corporate_phone);
                    }),
            ],
            'address' => 'required',
            'password' => 'required_without:id|confirmed',
            'settlement_type' => 'required|integer',
            'billing_credit_limit' => 'required',
            'corporate_fee_method' => 'required|integer',
            'corporate_fee' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withInput()->withErrors($validator->errors());
        }

        DB::beginTransaction();
        try {
            $alias_name = str_slug($request->input('corporate_name'));

            // Find or create corporate
            if (!empty($id)) {
                $corporate = Corporate::findOrFail($id);
                $isNewCorporate = false;
            } else {
                $corporate = new Corporate;
                $corporate->alias_name = $alias_name;
                $isNewCorporate = true;
            }

            // Update corporate data
            $corporate->merchant_id = $merchant_id;
            $corporate->corporate_name = $request->corporate_name;
            $corporate->country_id = $request->country;
            $corporate->corporate_phone = $corporate_phone;
            $corporate->email = $request->email;
            $corporate->corporate_address = $request->address;
            $corporate->segment_id = $request->segment_id;
            $corporate->settlement_type = $request->settlement_type;
            $corporate->billing_credit_limit = $request->billing_credit_limit;
            $corporate->corporate_fee_method = $request->corporate_fee_method;
            $corporate->corporate_fee = $request->corporate_fee;
            $corporate->driver_amount_credit_to_wallet = !empty($request->driver_amount_credit_to_wallet) ? $request->driver_amount_credit_to_wallet : 1;

            if ($request->settlement_type == 4) {
                $corporate->settlement_custom_days = $request->custom_days;
            }

            if (!empty($request->corporate_insurance_charge)) {
                $corporate->corporate_insurance_charge = $request->corporate_insurance_charge;
            }

            if ($request->hasFile('corporate_logo')) {
                $corporate->corporate_logo = $this->uploadImage('corporate_logo', 'corporate_logo');
            }
            if ($request->hasFile('corporate_cover_image')) {
                $corporate->corporate_cover_image = $this->uploadImage('corporate_cover_image', 'corporate_cover_image');
            }

            if ($request->password) {
                $corporate->password = Hash::make($request->password);
            }

            $corporate->save();

            // Handle user creation/update
            if ($isNewCorporate) {
                $return_data = $this->handleNewCorporateUser($corporate, $request, $merchant_id, $country, $corporate_phone);
            } else {
                $return_data = $this->handleExistingCorporateUser($corporate, $corporate_phone, $merchant_id);
            }
            if($return_data['type']){
                DB::commit();
            }
            else{
                DB::rollback();
                return redirect()->route('corporate.index')->withErrors($return_data['message']);
            }

            $string_file = $this->getStringFile($merchant_id);
            return redirect()->route('corporate.index')->withSuccess(trans($string_file . ".added_successfully"));

        } catch (\Exception $e) {
            DB::rollback();
            \Log::error('Corporate save error: ' . $e->getMessage());
            return back()->withErrors(['error' => 'An error occurred while saving the corporate.'])->withInput();
        }
    }

    /**
     * Handle user creation for new corporate
     */
    private function handleNewCorporateUser($corporate, $request, $merchant_id, $country, $corporate_phone)
    {
        // Check if user with this phone already exists
        $existingUser = User::where('UserPhone', $corporate_phone)
            ->where('merchant_id', $merchant_id)
            ->first();

        if(!empty($existingUser->corporate_id))
            return ["type"=> false, "message" => "User Already already exists"];

        if (!empty($existingUser)) {
            // Link existing user to corporate
            $existingUser->corporate_id = $corporate->id;
            $existingUser->save();

            // Set as default corporate user
            UserDetail::updateOrCreate(
                ['user_id' => $existingUser->id],
                ['is_default_corporate_user' => 1]
            );
        } else {
            // Create new user
            $user = User::create([
                'merchant_id'       => $merchant_id,
                'country_id'        => $request->country,
                'first_name'        => $request->corporate_name,
                'last_name'         => '',
                'UserPhone'         => $corporate_phone,
                'email'             => $request->email,
                'password'          => Hash::make($request->password),
                'UserSignupType'    => 1,
                'UserSignupFrom'    => 2,
                'UserProfileImage'  => $request->hasFile('corporate_logo')
                    ? $this->uploadImage('corporate_logo', 'corporate_user', $merchant_id)
                    : null,
                'user_type'         => 1,
                'user_gender'       => 1,
                'corporate_id'      => $corporate->id,
            ]);

            // Create user detail with default corporate user flag
            UserDetail::create([
                'user_id' => $user->id,
                'is_default_corporate_user' => 1
            ]);
        }
        return ["type"=> true, "message" => "Success"];

    }

    /**
     * Handle user update when corporate phone changes
     */
    private function handleExistingCorporateUser($corporate, $corporate_phone, $merchant_id)
    {
        // Find current default user for this corporate
        $oldDefaultUser = User::whereHas('UserDetail', function ($q) {
            $q->where('is_default_corporate_user', 1);
        })->where('corporate_id', $corporate->id)->first();

        // If phone number has changed
        if ($oldDefaultUser && $oldDefaultUser->UserPhone != $corporate_phone) {

            // Remove default flag from old user
            UserDetail::where('user_id', $oldDefaultUser->id)
                ->update(['is_default_corporate_user' => NULL]);

            // Check if new phone belongs to existing user
            $newDefaultUser = User::where('UserPhone', $corporate_phone)
                ->where('merchant_id', $merchant_id)
                ->first();

            if(!empty($existingUser->corporate_id))
                return ["type"=> false, "message" => "User Already already exists"];

            if (!empty($newDefaultUser)) {
                // Link existing user to corporate and set as default
                $newDefaultUser->corporate_id = $corporate->id;
                $newDefaultUser->save();

                UserDetail::updateOrCreate(
                    ['user_id' => $newDefaultUser->id],
                    ['is_default_corporate_user' => 1]
                );
            } else {
                // Create new user with new phone number
                $user = User::create([
                    'merchant_id'       => $merchant_id,
                    'country_id'        => $corporate->country_id,
                    'first_name'        => $corporate->corporate_name,
                    'last_name'         => '',
                    'UserPhone'         => $corporate_phone,
                    'email'             => $corporate->email,
                    'password'          => $corporate->password,
                    'UserSignupType'    => 1,
                    'UserSignupFrom'    => 2,
                    'UserProfileImage'  => $corporate->corporate_logo,
                    'user_type'         => 1,
                    'user_gender'       => 1,
                    'corporate_id'      => $corporate->id,
                ]);

                UserDetail::create([
                    'user_id' => $user->id,
                    'is_default_corporate_user' => 1
                ]);
            }
        }
        return ["type"=> true, "message" => "Success"];
    }
    /**
     * Display the specified resource.
     *
     * @param  int $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int $id
     * @return \Illuminate\Http\Response
     */
//    public function edit($id)
//    {
//        $merchant_id = Auth::user('merchant')->parent_id != 0 ? Auth::user('merchant')->parent_id : Auth::user('merchant')->id;
//        $corporate = Corporate::findOrFail($id);
//        $corporate->corporate_phone = substr($corporate->corporate_phone, strlen($corporate->Country->phonecode));
//        $countries = Country::where([['merchant_id', '=', $merchant_id]])->get();
//        return view('merchant.corporate.edit', compact('countries','corporate'));
//    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request $request
     * @param  int $id
     * @return \Illuminate\Http\Response
     */
//    public function update(Request $request, $id)
//    {
//        $merchant_id = Auth::user('merchant')->parent_id != 0 ? Auth::user('merchant')->parent_id : Auth::user('merchant')->id;
//        $this->validate($request, [
//            'country' => 'required|integer',
//            'corporate_name' => 'required',
//            'email' => ['required','email',
//                Rule::unique('corporates', 'email')->where(function ($query) use ($merchant_id) {
//                    return $query->where([['merchant_id', '=', $merchant_id]]);
//                })->ignore($id)],
//            'phone' => ['required','regex:/^[0-9]+$/',
//                Rule::unique('corporates', 'corporate_phone')->where(function ($query) use ($merchant_id) {
//                    return $query->where([['merchant_id', '=', $merchant_id]]);
//                })->ignore($id)],
//            'address' => 'required',
//        ]);
//
//        DB::beginTransaction();
//        try{
//            $country = Country::find($request->country);
//            $corporate = Corporate::findOrFail($id);
//            $corporate->corporate_name = $request->corporate_name;
//            $corporate->country_id = $request->country;
//            $corporate->corporate_phone = $country->phonecode . $request->phone;
//            $corporate->email = $request->email;
//            $corporate->corporate_address = $request->address;
//            if($request->hasFile('corporate_logo')){
//                $corporate->corporate_logo = $this->uploadImage('corporate_logo','corporate_logo');
//            }
//            $corporate->save();
//        }catch (\Exception $e) {
//            $message = $e->getMessage();
//            p($message);
//            // Rollback Transaction
//            DB::rollback();
//        }
//        // Commit Transaction
//        DB::commit();
//        return redirect()->route('corporate.index')->with('success', trans('admin.corporate_update'));
//    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }

    public function ChangeStatus($id, $status)
    {
        $validator = Validator::make(
            [
                'id' => $id,
                'status' => $status,
            ],
            [
                'id' => ['required'],
                'status' => ['required', 'integer', 'between:1,2'],
            ]);
        if ($validator->fails()) {
            return redirect()->back();
        }
//        $merchant_id = Auth::user('merchant')->parent_id != 0 ? Auth::user('merchant')->parent_id : Auth::user('merchant')->id;
        $corporate = Corporate::findOrFail($id);
        $string_file = $this->getStringFile($corporate->merchant_id);
        $corporate->status = $status;
        $corporate->save();
        return redirect()->back()->withSuccess(trans("$string_file.status_updated"));
    }

    public function AddMoney(Request $request)
    {
        $merchant_id = Auth::user('merchant')->parent_id != 0 ? Auth::user('merchant')->parent_id : Auth::user('merchant')->id;
        $request->validate([
            'payment_method' => 'required|integer|between:1,2',
            'receipt_number' => 'required|string',
            'amount' => 'required|numeric',
            'add_money_driver_id' => 'required|exists:corporates,id'
        ]);
//        $newAmount = new \App\Http\Controllers\Helper\Merchant();
//        CorporateWalletTransaction::create([
//            'merchant_id' => $merchant_id,
//            'corporate_id' => $request->add_money_driver_id,
//            'transaction_type' => 1,
//            'payment_method' => $request->payment_method,
//            'receipt_number' => $request->receipt_number,
//            'amount' => sprintf("%0.2f", $request->amount),
//            'platform' => 1,
//            'description' => $request->description,
//            'narration' => 1,
//        ]);
//        $corporate = Corporate::find($request->add_money_driver_id);
//        $wallet_money = $corporate->wallet_balance + $request->amount;
//        $corporate->wallet_balance = $newAmount->TripCalculation($wallet_money, $merchant_id);
//        $corporate->save();
        $string_file = $this->getStringFile($merchant_id);
        WalletTransaction::CorporateWaletCredit($request->add_money_driver_id,$request->amount,$request->payment_method,$request->receipt_number,$request->description);
        return redirect()->back()->withSuccess(trans("$string_file.money_added_successfully"));
    }

    public function Wallet($id)
    {
        $merchant_id = Auth::user('merchant')->parent_id != 0 ? Auth::user('merchant')->parent_id : Auth::user('merchant')->id;
        $corporate = Corporate::select('corporate_name','wallet_balance','id')->where([['merchant_id', '=', $merchant_id]])->findOrFail($id);
        $wallet_transactions = CorporateWalletTransaction::where([['merchant_id','=',$merchant_id],['corporate_id', '=', $id]])->paginate(25);
        return view('merchant.corporate.wallet', compact('wallet_transactions', 'corporate'));
    }

    public function corporateInvoices(Request $request, $corporate_id){
        $invoices = CorporateInvoice::with(['Corporate', 'details'])->where("corporate_id", $corporate_id)->latest()->get();
        return view('merchant.corporate.invoice', compact('invoices'));
    }

    public function corporateInvoicesDetails(Request $request){
        $invoice = CorporateInvoice::find($request->invoice_id);
        $details = $invoice->details;
        $arr_details = [];
        foreach($details as $detail){
            $booking= $detail->Booking;
            $arr_details[] = [
                'booking_id' => $booking->id,
                'merchant_booking_id' => $booking->merchant_booking_id,
                'user_first_name' => $booking->User->first_name." ".$booking->User->last_name,
                'designation' => $booking->User->employeeDesignation->designation_name ?? '-',
                'ride_amount' => number_format($booking->final_amount_paid, 2),
                'corporate_charges' => number_format($booking->BookingTransaction->corporate_earning, 2),
            ];
        }
        return response()->json($arr_details);
    }

    public function settleInvoice(Request $request){
        $merchant_id = Auth::user('merchant')->parent_id != 0 ? Auth::user('merchant')->parent_id : Auth::user('merchant')->id;
        $string_file = $this->getStringFile($merchant_id);
        $request->validate([
            'corporate_invoice_id'=> 'required',
            'admin_remarks' => 'required',
            'settlement_status' => 'required'
        ]);

        DB::beginTransaction();
        try{
            $invoice = CorporateInvoice::find($request->corporate_invoice_id);

            $admin_remarks = $invoice->admin_remarks ? json_decode($invoice->admin_remarks) : [];
            if (!is_array($admin_remarks)) $admin_remarks = [];

            $remark = $request->admin_remarks;
            $admin_remarks[] = $remark;

            $invoice->admin_remarks = json_encode($admin_remarks);
            $invoice->status = $request->settlement_status;
            $invoice->save();
        }
        catch(\Exception $e){
            DB::rollback();
            return redirect()->back()->withErrors($e->getMessage());
        }
        DB::commit();
        return redirect()->back()->withSuccess(trans("$string_file.success"));
    }

}
