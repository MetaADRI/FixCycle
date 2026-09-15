<?php

namespace App\Http\Controllers\PaymentMethods\SerdiPay;

use App\Driver;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Helper\WalletTransaction;
use App\Models\PaymentOption;
use App\Models\PaymentOptionsConfiguration;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use App\Traits\MerchantTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Models\DriverCashout;
use App\Models\BusinessSegment\BusinessSegmentCashout;
use App\Models\Onesignal;

class SerdiPayController extends Controller
{
    use ApiResponseTrait, MerchantTrait;
    public function getSerdiPayConfig($merchant_id){
        $payment_option = PaymentOption::where('slug', 'SERDI_PAY')->first();
        $paymentOption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id],['payment_option_id','=',$payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }
    
    public function Callback(Request $request){
        \Log::channel('serdi_pay')->emergency(['request'=>$request->all(),'callback'=>'callback_url','time'=>date('Y-m-d H:i:s')]);
        $data = $request->all();
        if($data && $data['payment'] && $data['payment']['transactionId'] && $data['payment']['sessionStatus'] == 3){
            $refId = $data['payment']['transactionId'];
            $trans = DB::table('transactions')->where('reference_id', $refId)->first();
            if($trans->request_status == 2 && $data['payment']['status'] == "success"){
                
            }else{
                if($data['payment']['status'] == "success"){
                    DB::table('transactions')->where('reference_id', $refId)->update([
                        'request_status' => 2,
                        'status_message' => 'SUCCESS',
                        'payment_transaction' => json_encode($request->all()), 'updated_at' => date('Y-m-d H:i:s'),
                    ]);
                    
                    $option_name = $trans->payment_mode;
                    if($option_name == "OM"){
                        $receipt = "Application : " . $refId;
                        $paramArray = array(
                            'booking_id' => NULL,
                            'amount' => $trans->amount,
                            'narration' => 2,
                            'platform' => 2,
                            'payment_method' => 2,
                            'receipt' => $receipt,
                            'transaction_id' => $trans->id,
                        );
    
                        if($trans->status == 1){
                            $paramArray['user_id'] = $trans->user_id;
                            WalletTransaction::UserWalletCredit($paramArray);
                        }elseif($trans->status == 2){
                            $paramArray['driver_id'] = $trans->driver_id;
                            WalletTransaction::WalletCredit($paramArray);
                        }
                        // else{
                        //     if(!empty($trans->booking_id)){
                        //         $booking = Booking::find($trans->booking_id);
                        //         $booking->payment_status = 1;
                        //         $booking->save();
                        //         $string_file = $this->getStringFile(NULL, $booking->Merchant);
                        //         $title = trans("$string_file.payment_success");
                        //         $message = trans("$string_file.payment_done");
                        //         $data['notification_type'] = 'PAYMENT_COMPLETE';
                        //         $data['segment_type'] = $booking->Segment->slag;
                        //         $data['segment_data'] = ['id'=>$booking->id,'handyman_order_id'=>NULL,'order_id'=> NULL];
                        //         $arr_param = ['data' => $data, 'message' => $message, 'merchant_id' => $booking->merchant_id, 'title' => $title, 'large_icon' => ""];
                        //         $user_param = $arr_param;
                        //         $user_param['user_id'] = $booking->user_id;
                        //         Onesignal::UserPushMessage($user_param);
                        //         $driver_param = $arr_param;
                        //         $driver_param['driver_id'] = $booking->driver_id;
                        //         Onesignal::DriverPushMessage($driver_param);
                        //     }
                        //     elseif(!empty($trans->order_id)){
                        //         $order = Order::find($trans->order_id);
                        //         $order->payment_status = 1;
                        //         $order->save();
                        //         $string_file = $this->getStringFile(NULL, $order->Merchant);
                        //         $title = trans("$string_file.payment_success");
                        //         $message = trans("$string_file.payment_done");
                        //         $data['notification_type'] = 'PAYMENT_COMPLETE';
                        //         $data['segment_type'] = $order->Segment->slag;
                        //         $data['segment_data'] = ['id'=>NULL,'handyman_order_id'=>NULL,'order_id'=> $order->id];
                        //         $arr_param = ['data' => $data, 'message' => $message, 'merchant_id' => $order->merchant_id, 'title' => $title, 'large_icon' => ""];
                        //         $user_param = $arr_param;
                        //         $user_param['user_id'] = $order->user_id;
                        //         Onesignal::UserPushMessage($user_param);
                        //         $driver_param = $arr_param;
                        //         $driver_param['driver_id'] = $order->driver_id;
                        //         Onesignal::DriverPushMessage($driver_param);
                                
                        //     }
                        //     else{
                        //         $handymanOrder = HandymanOrder::find($trans->handyman_order_id);
                        //         $handymanOrder->payment_status = 1;
                        //         $handymanOrder->save();
                        //         $string_file = $this->getStringFile(NULL, $handymanOrder->Merchant);
                        //         $title = trans("$string_file.payment_success");
                        //         $message = trans("$string_file.payment_done");
                        //         $data['notification_type'] = 'PAYMENT_COMPLETE';
                        //         $data['segment_type'] = $handymanOrder->Segment->slag;
                        //         $data['segment_data'] = ['id'=>NULL,'handyman_order_id'=>$handymanOrder->id,'order_id'=> NULL];
                        //         $arr_param = ['data' => $data, 'message' => $message, 'merchant_id' => $handymanOrder->merchant_id, 'title' => $title, 'large_icon' => ""];
                        //         $user_param = $arr_param;
                        //         $user_param['user_id'] = $handymanOrder->user_id;
                        //         Onesignal::UserPushMessage($user_param);
                        //         $driver_param = $arr_param;
                        //         $driver_param['driver_id'] = $handymanOrder->driver_id;
                        //         Onesignal::DriverPushMessage($driver_param);
                        //     }
                        // }
                    }
                    
                    
                }
                elseif($data['payment']['status'] == "failed"){
                    DB::table('transactions')->where('reference_id', $refId)->update([
                        'request_status' => 3,
                        'status_message' => 'FAIL',
                        'additional_data'=> 'TRY_AGAIN',
                        'payment_transaction' => json_encode($request->all()), 'updated_at' => date('Y-m-d H:i:s'),
                    ]);
                }else{
                    DB::table('transactions')->where('reference_id', $refId)->update([
                        'request_status' => 3,
                        'status_message' => 'FAIL',
                        'payment_transaction' => json_encode($request->all()), 'updated_at' => date('Y-m-d H:i:s'),
                    ]);
                }
            }
            
        }
        echo 'SUCCESS LOG GENERATED';
    }
    
    public function getSerdiPaymentOption(Request $request){
        $data = [['key'=>'AM','value'=>'Airtel Money'],['key'=>'OM','value'=>'Orange Money'],['key'=>'MP','value'=>'Vodacom-Mpesa'],['key'=>'AF','value'=>'Afrimoney']];
        return $this->successResponse('Fetched Successfully',$data);
    }
    
    public function getAuthToken($username,$password){
        try{
            $data = [
                'email'=> $username,
                'password'=> $password,
            ];

            $curl = curl_init();
            

            curl_setopt_array($curl, array(
              CURLOPT_URL => 'https://serdipay.com/api/public-api/v1/merchant/get-token',
              CURLOPT_RETURNTRANSFER => true,
              CURLOPT_ENCODING => '',
              CURLOPT_MAXREDIRS => 10,
              CURLOPT_TIMEOUT => 0,
              CURLOPT_FOLLOWLOCATION => true,
              CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
              CURLOPT_CUSTOMREQUEST => 'POST',
              CURLOPT_POSTFIELDS =>json_encode($data),
              CURLOPT_HTTPHEADER => array(
                'Accept: application/json',
                'Content-Type: application/json'
              ),
            ));
            

            $response = curl_exec($curl);
            curl_close($curl);
            $res = json_decode($response,true);
            if(isset($res['access_token'])){
                return $res['access_token'];
            }
            else{
                return '';
            }
        }catch(\Exception $e) {
            DB::rollBack();
            throw new \Exception($e->getMessage());
        }
    }
    
    public function initiatePayment($request, $payment_option_config, $calling_from = 'USER'){
        try{
            $status = 3;
            if($calling_from == "DRIVER") {
                $status = 2;
                $user = $request->user('api-driver');
                $countryCode = $user->country->country_code;
                $id = $user->id;
                $merchant_id = $user->merchant_id;
                $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
            }
            else{
                $status = 1;
                $user = $request->user('api');
                $countryCode = $user->country->country_code;
                $id = $user->id;
                $merchant_id = $user->merchant_id;
                $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
            }
            
            // $paymentConfig = $this->getSerdiPayConfig($merchant_id);
            $username = $payment_option_config->api_public_key;
            $password = $payment_option_config->api_secret_key;
            $api_password = $payment_option_config->auth_token; //it can be same or different as above password 
            $api_id = $payment_option_config->operator;
            $merchantCode = $payment_option_config->additional_data;
            $merchantPin = $payment_option_config->tokenization_url;
            // $username = 'contact@kimyacar.com';
            // $password = 'Ottawa@2025';
            // $api_id = 'APICUDCRP1';
            // $merchantCode = '334663';
            // $merchantPin = '1234';
            $phone = $request->phone;
            $amount = $request->amount;
            $currency = $request->currency;
            $option_name = $request->option_name;
            
            $token = $this->getAuthToken($username,$password);
            if(empty($token)){
                throw new \Exception('Token not generated');
            }
            
            $trans_id = 'TRANS_'.time();
            $data = [
                "api_id"=>$api_id,
                "api_password"=>$api_password,
                "merchantCode"=>$merchantCode,
                "merchant_pin"=>$merchantPin,
                "clientPhone"=>$phone,
                "amount"=>$amount,
                "currency"=>$currency,
                "telecom"=>$option_name
            ];
            
            $curl = curl_init();

            curl_setopt_array($curl, array(
              CURLOPT_URL => 'https://serdipay.com/api/public-api/v1/merchant/payment-merchant',
              CURLOPT_RETURNTRANSFER => true,
              CURLOPT_ENCODING => '',
              CURLOPT_MAXREDIRS => 10,
              CURLOPT_TIMEOUT => 0,
              CURLOPT_FOLLOWLOCATION => true,
              CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
              CURLOPT_CUSTOMREQUEST => 'POST',
              CURLOPT_POSTFIELDS =>json_encode($data),
              CURLOPT_HTTPHEADER => array(
                'Authorization: Bearer '.$token,
                'Content-Type: application/json',
              ),
            ));

            $response = json_decode(curl_exec($curl),true);
            curl_close($curl);
            \Log::channel('serdi_pay')->emergency(['url'=>'https://serdipay.com/api/public-api/v1/merchant/payment-merchant','request'=>$data,'response'=>$response,'time'=>date('Y-m-d H:i:s'),'trans_id'=> $trans_id]);
            if(!empty($response) && !empty($response['payment']) && $response['payment']['transactionId'] && $response['payment']['sessionStatus'] == 2){
                $refId = $response['payment']['transactionId'];
                $sessionId = $response['payment']['sessionId'];
                DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'merchant_id' => $merchant_id,
                    'booking_id'=> $request->booking_id,
                    'order_id'=> $request->order_id,
                    'handyman_order_id'=> $request->handyman_order_id,
                    'payment_transaction_id'=> $trans_id,
                    'amount' => $amount,
                    'payment_option_id' => $payment_option_config->payment_option_id,
                    'request_status'=> 1,
                    'status'=> $status,
                    'payment_mode' => $option_name,
                    'reference_id'=> $refId,
                    'status_message'=> 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
                
                return [
                    'transaction_id' => $trans_id,
                    'reference'=> $refId
                ];
            }else{
                return ["result"=>0,"response"=>$response['message']];
            }
            
            
            
        }catch(\Exception $e) {
            DB::rollBack();
            throw new \Exception($e->getMessage());
        }
    }
    
    public function paymentStatus($request, $payment_option_config, $calling_from){
        $string_file = $this->getStringFile($request->merchant_id);
        $transactionId = $request->transaction_id; 
        $transaction_table =  DB::table("transactions")->where('payment_transaction_id', $transactionId)->first();
        $payment_status =   $transaction_table->request_status == 2 ?  true : false;
        if($transaction_table->request_status == 1)
        {
            $request_status_text = "processing";
            if(!empty($transaction_table->payment_mode) && $transaction_table->payment_mode == "OM"){
                $request_status_text = trans("$string_file.payment_take_some_time");
            }
            $transaction_status = 1;
        }
        else if($transaction_table->request_status == 2)
        {
            $request_status_text = "success";
            $transaction_status = 2;
        }
        else
        {
            $request_status_text = "failed";
            if(!empty($transaction_table->additional_data)){
                $request_status_text = trans("$string_file.please_try_again_for_payment");
            }
            $transaction_status = 3;
        }
        return ['payment_status' => $payment_status, 'request_status' => $request_status_text,'transaction_status' => $transaction_status];
    }
    
    
    public function SerdiPayCashout(Request $request){
        try{
            $validator = Validator::make($request->all(),[
                'calling_from' => 'required',
                'payment_method_id' => 'required',
                'amount' => 'required',
                'currency'=>'required',
                'phone'=> 'required',
                'payment_option_id'=>'required',
                'option_name'=>'required'
            ]);
    
            if ($validator->fails()){
                $errors = $validator->messages()->all();
                return $this->failedResponse($errors[0]);
            }
            
            $calling_from = $request->calling_from;
            
            if($calling_from == "DRIVER") {
                $driver = $request->user('api-driver');
                $countryCode = $driver->country->country_code;
                $id = $driver->id;
                $merchant_id = $driver->merchant_id;
                $lang = isset($driver->Country->default_language) ? $driver->Country->default_language : 'en';
            }
           elseif($calling_from == "BUSINESS_SEGMENT") {
                if($request->from_admin == 1){
                    $bs = get_business_segment(false);
                }else{
                    $bs = $request->user('business-segment-api');
                }
                $id = $bs->id;
                $merchant_id = $bs->merchant_id;
                $alias_name = $bs->Merchant->alias_name;
                $status = 4;
            }
            $payment_option_config = $this->getSerdiPayConfig($merchant_id);
            $username = $payment_option_config->api_public_key;
            $password = $payment_option_config->api_secret_key;
            $api_password = $payment_option_config->auth_token; //it can be same or different as above password 
            $api_id = $payment_option_config->operator;
            $merchantCode = $payment_option_config->additional_data;
            $merchantPin = $payment_option_config->tokenization_url;
            $phone = $request->phone;
            $amount = $request->amount;
            $currency = $request->currency;
            $option_name = $request->option_name;
            $string_file = $this->getStringFile($merchant_id);
            $token = $this->getAuthToken($username,$password);
            if(empty($token)){
                throw new \Exception('Token not generated');
            }
            
            $trans_id = 'TRANS_CASHOUT_'.time();
            $data = [
                "api_id"=>$api_id,
                "api_password"=>$api_password,
                "merchantCode"=>$merchantCode,
                "merchant_pin"=>$merchantPin,
                "clientPhone"=>$phone,
                "amount"=>$amount,
                "currency"=>$currency,
                "telecom"=>$option_name
            ];
            
            $curl = curl_init();

            curl_setopt_array($curl, array(
              CURLOPT_URL => 'https://serdipay.com/api/public-api/v1/merchant/payment-client',
              CURLOPT_RETURNTRANSFER => true,
              CURLOPT_ENCODING => '',
              CURLOPT_MAXREDIRS => 10,
              CURLOPT_TIMEOUT => 0,
              CURLOPT_FOLLOWLOCATION => true,
              CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
              CURLOPT_CUSTOMREQUEST => 'POST',
              CURLOPT_POSTFIELDS =>json_encode($data),
              CURLOPT_HTTPHEADER => array(
                'Authorization: Bearer '.$token,
                'Content-Type: application/json',
              ),
            ));

            $response = json_decode(curl_exec($curl),true);
            curl_close($curl);
            \Log::channel('serdi_pay')->emergency(['cashout_request'=>$request->all(),'response'=> $response,'time'=>date('Y-m-d H:i:s')]);
            if($response && !empty($response['payment']) && $response['payment']['transactionId'] && $response['payment']['sessionStatus'] == 2){
                $refId = $response['payment']['transactionId'];
                $sessionId = $response['payment']['sessionId'];
                DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id'=> $trans_id,
                    'amount' => $amount,
                    'payment_option_id' => $payment_option_config->payment_option_id,
                    'request_status'=> 1,
                    'reference_id'=> $refId,
                    'payment_mode'=> $option_name,
                    'status_message'=> 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
                
                $res = [
                    'transaction_id' => $trans_id,
                    'reference'=> $refId
                ];

                if($calling_from == "DRIVER"){

                    DriverCashout::insertGetId([
                        'driver_id' => $driver->id,
                        'merchant_id' => $driver->merchant_id,
                        'amount' => $request->amount,
                        'cashout_status' => 1,
                        'action_by' => 'Online Payment',
                        'transaction_id' => $trans_id,
                        'comment' => trans("$string_file.cashout_request")
                    ]);
    
                    $paramArray = array(
                        'driver_id' => $driver->id,
                        'booking_id' => NULL,
                        'amount' => $request->amount,
                        'narration' => 28,
                    );
                    WalletTransaction::WalletDeduct($paramArray);
                    $title = trans("$string_file.cashout_request");
                    $message = trans("$string_file.cashout_request_sent");
    
                    $notification_data['notification_type'] = "WALLET_HISTORY";
                    $notification_data['segment_type'] = "WALLET_HISTORY";
                    $notification_data['segment_data'] = [];
                    $notification_data['segment_sub_group'] = null;
                    $arr_param = ['driver_id'=>$driver->id,'data'=>$notification_data,'message'=>$message,'merchant_id'=>$driver->merchant_id,'title'=>$title,'large_icon'=>""];
                    Onesignal::DriverPushMessage($arr_param);

                }else{
                     BusinessSegmentCashout::create([
                        'business_segment_id' => $bs->id,
                        'merchant_id' => $bs->merchant_id,
                        'amount' => $request->amount,
                        'cashout_status' => 1,
                        'action_by' => 'Business Segment Online Payment',
                        'transaction_id' => $trans_id,
                        'comment' => trans("$string_file.cashout_request")
                    ]);
                    $paramArray = array(
                        'business_segment_id' => $bs->id,
                        'booking_id' => null,
                        'amount' => $request->amount,
                        'narration' => 4,
                    );
                    WalletTransaction::BusinessSegmntWalletDebit($paramArray);
                }
                
                if($request->from_admin == 1){
                    return ['message'=>trans("$string_file.cashout_request_registered_successfully"),'result'=>1];
                }else{
                    return $this->successResponse(trans("$string_file.cashout_request_registered_successfully"),$res);
                }
            }else{
                return $this->failedResponse($response['error']);
            }
            
            
            
        }catch(\Exception $e) {
            DB::rollBack();
            throw new \Exception($e->getMessage());
        }
    }
    
    
}