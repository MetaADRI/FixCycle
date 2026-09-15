<?php

namespace App\Http\Controllers\PaymentMethods\PalmPay;

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
use App\Models\Onesignal;
use App\Models\DriverCashout;
use App\Models\BusinessSegment\BusinessSegmentCashout;

class PalmPayController extends Controller
{
    use ApiResponseTrait, MerchantTrait;
    public function getPalmPayConfig($merchant_id){
        $payment_option = PaymentOption::where('slug', 'PALM_PAY')->first();
        $paymentOption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id],['payment_option_id','=',$payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }
    
    function generateSignature(array $data, string $private_key): string
    {
        $encry_data = strtoupper(md5($this->params_sort($data)));
        $signature = $this->sha1_with_rsa($encry_data, $private_key);
        return $signature;   
        // ksort($data);
        // $strA = http_build_query($data, '', '&', PHP_QUERY_RFC3986);
        // $md5Str = strtoupper(md5($strA));
        // openssl_sign($md5Str, $signature, $privateKey, OPENSSL_ALGO_SHA1);
        // return base64_encode($signature);
    }
    
    public function params_sort(array $data): string {
        $filtered_data = array_filter($data, function($value) {
            return $value !== "";
        });
        ksort($filtered_data);
        unset($filtered_data['sign']);
        return urldecode(http_build_query($filtered_data)); 
    }
    
    public function sha1_with_rsa(string $encry_data, string $private_key): string {
        $privateKey = $this->validate_rsa_key($private_key, 'private');
        openssl_sign($encry_data, $signature, $privateKey, OPENSSL_ALGO_SHA1);
        return base64_encode($signature);;
    }
    
    public function validate_rsa_key($value, $key_type) {
        $formatted_key = str_replace(' ', "", $value);
        $formatted_key = trim($formatted_key);
        $formatted_key = chunk_split($formatted_key, 64, "\n");
        if ($key_type === 'private') {
            $pem_formatted_key = "-----BEGIN RSA PRIVATE KEY-----\n$formatted_key-----END RSA PRIVATE KEY-----\n";
            $key_resource = openssl_pkey_get_private($pem_formatted_key);
        } else {
            $pem_formatted_key = "-----BEGIN PUBLIC KEY-----\n$formatted_key-----END PUBLIC KEY-----\n";
            $key_resource = openssl_pkey_get_public($pem_formatted_key);
        }
        
        return $key_resource;
    }
    
    public function createOrder($request, $paymentConfig, $calling_from){
        try {
            $status = 3;
            if ($calling_from == "DRIVER") {
                $driver = $request->user('api-driver');
                $id = $driver->id;
                $merchant_id = $driver->merchant_id;
                $alias_name = $driver->Merchant->alias_name;
                $status = 2;
            } elseif($calling_from == "USER") {
                $user = $request->user('api');
                $id = $user->id;
                $merchant_id = $user->merchant_id;
                $alias_name = $user->Merchant->alias_name;
                $status = 1;
            }

            $appId = $paymentConfig->api_public_key;
            $order_no = uniqid().time();
            $nonce_str = 'nonce'.uniqid().time();
            $amount = $request->amount;
            $transaction_id = 'TRANS_'.time();
            $version = "V1.1";
            $requestTime = round(microtime(true) * 1000);
            $phone = $request->phone;
            
            $params = [
                "requestTime"=>$requestTime,
                "version"=>$version,
                "nonceStr"=>$nonce_str,
                "amount"=>$amount * 100,
                "notifyUrl"=>route('palmpay-notify',['trans_id'=>$transaction_id]),
                "orderId"=>$order_no,
                "title"=>"pay",
                "description"=>"pay some thing",
                "userId"=>"110",
                "userMobileNo"=>"0".$phone,
                "currency"=>"NGN",
                "callBackUrl"=>route('palmpay-return',['trans_id'=>$transaction_id]),
                "goodsDetails"=>"[{\"goodsId\": \"1\"}]",
                "productType"=>"pay_wallet"
            ];
            
            $disk = Storage::disk('merchant_keys');
            $privateKey  = "{$alias_name}_private.pem";
            $domain = request()->getHost();
            $private_key = file_get_contents($disk->path($privateKey));
            
            $signature = $this->generateSignature($params, $private_key);
            $url = $paymentConfig->gateway_condition == 1 ? 'https://open-gw-prod.palmpay-inc.com/api/v2/payment/merchant/createorder' : 'https://open-gw-daily.palmpay-inc.com/api/v2/payment/merchant/createorder';
            
            $curl = curl_init();

            curl_setopt_array($curl, array(
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 0,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'POST',
                CURLOPT_POSTFIELDS =>json_encode($params),
                CURLOPT_HTTPHEADER => array(
                    'Accept:application/json',
                    'CountryCode:NG',
                    'Authorization:Bearer '.$appId,
                    'Signature:'.$signature,
                    'Content-Type:application/json'
                ),
            ));

            $response = json_decode(curl_exec($curl),true);
            \Log::channel('palm_pay')->emergency(["response"=>$response,'request'=>$params]);
            if($response && $response['respCode'] == "00000000" && $response['respMsg'] == "success"){
                DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'status' => $status,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id' => $transaction_id,
                    'reference_id'=>$order_no,
                    'amount' => $request->amount,
                    'payment_option_id' => $paymentConfig->payment_option_id,
                    'request_status' => 1,
                    'status_message' => 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
                
            }
            
            return [
                    'status' => 'NEED_TO_OPEN_WEBVIEW',
                    'url' => $response['data']['checkoutUrl'] ?? '',
                    'transaction_id' => $transaction_id ?? '',
                    'success_url' => route('palmpay-success'),
                    'fail_url' => route('palmpay-fail'),
                    'redirect_pending_url'=> route('palmpay-redirect'),
                    'deeplink_success' => $domain . '://palmpay/success',
                    'deeplink_fail'    => $domain . '://palmpay/fail',
                    'deeplink_redirect_pending_url'    => $domain . '://palmpay/redirect'
                ];
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw new \Exception($e->getMessage());
        }
        
    }
    
    public function return(Request $request){
        \Log::channel('palm_pay')->emergency(["return_url_callback"=>$request->all()]);
        if($request->trans_id){
            $transaction = DB::table('transactions')->where('payment_transaction_id',$request->trans_id)->first();
            if($transaction->request_status == 2 && $transaction->status_message == 'SUCCESS'){
                return redirect(route('palmpay-success'));
            }
            elseif($transaction->request_status == 1){
                return redirect(route('palmpay-redirect'));
            }
            else{
                return redirect(route('palmpay-fail'));
            }
        }
    }
    
    public function notify(Request $request){
        \Log::channel('palm_pay')->emergency(["notify_url_callback"=>$request->all()]);
        $status = $request['status'];
        $orderStatus = $request['orderStatus'];
        $transaction_id = $request['trans_id'];
        DB::table('transactions')->where('payment_transaction_id', $transaction_id)->update([
            'request_status' => $orderStatus == 2 ? 2 : ($orderStatus == 1 ? 1 : 3),
            'status_message' => $orderStatus == 2 ? 'SUCCESS' : ($orderStatus == 1 ? "PENDING" : "FAIL")
        ]);
    }
    
    public function Success(){
        echo 'success';
    }
    
    public function Fail(){
        echo 'fail';
    }
    
    public function Redirect(){
        echo 'Redirecting......';
    }
    
    public function paymentStatus($request, $payment_option_config, $calling_from){
        $transactionId = $request->transaction_id; 
        $transaction_table =  DB::table("transactions")->where('payment_transaction_id', $transactionId)->first();
        $payment_status =   $transaction_table->request_status == 2 ?  true : false;
        if($transaction_table->request_status == 1)
        {
            $request_status_text = "processing";
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
            $transaction_status = 3;
        }
        return ['payment_status' => $payment_status, 'request_status' => $request_status_text,'transaction_status' => $transaction_status];
    }
    
    public function getBankCode(Request $request){
        $validator = Validator::make($request->all(),[
            'calling_from' => 'required',
        ]);
        
        if ($validator->fails()){
            $errors = $validator->messages()->all();
            return $this->failedResponse($errors[0]);
        }
            
        $calling_from = $request->calling_from;
        if ($calling_from == "DRIVER") {
            $driver = $request->user('api-driver');
            $merchant_id = $driver->merchant_id;
            $alias_name = $driver->Merchant->alias_name;
        } elseif($calling_from == "USER") {
            $user = $request->user('api');
            $merchant_id = $user->merchant_id;
            $alias_name = $user->Merchant->alias_name;
        }elseif($calling_from == "BUSINESS_SEGMENT") {
            if($request->from_admin == 1){
                $bs = get_business_segment(false);
            }else{
                $bs = $request->user('business-segment-api');
            }
            $merchant_id = $bs->merchant_id;
            $alias_name = $bs->Merchant->alias_name;
        }
        
        $paymentConfig = $this->getPalmPayConfig($merchant_id);
        $appId = $paymentConfig->api_public_key;
        $nonce_str = 'nonce'.uniqid().time();
        $version = "V1.1";
        $requestTime = round(microtime(true) * 1000);
        $params = [
            "requestTime"=>$requestTime,
            "version"=>$version,
            "nonceStr"=>$nonce_str,
            "businessType"=>0
        ];
        $disk = Storage::disk('merchant_keys');
        $privateKey  = "{$alias_name}_private.pem";
        $domain = request()->getHost();
        $private_key = file_get_contents($disk->path($privateKey));
            
        $signature = $this->generateSignature($params, $private_key);
        $url = $paymentConfig->gateway_condition == 1 ? 'https://open-gw-prod.palmpay-inc.com/api/v2/general/merchant/queryBankList' : 'https://open-gw-daily.palmpay-inc.com/api/v2/general/merchant/queryBankList';
        
        $curl = curl_init();

        curl_setopt_array($curl, array(
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS =>json_encode($params),
            CURLOPT_HTTPHEADER => array(
                'Accept:application/json',
                'CountryCode:NG',
                'Authorization:Bearer '.$appId,
                'Signature:'.$signature,
                'Content-Type:application/json'
            ),
        ));

        $response = json_decode(curl_exec($curl),true);
        \Log::channel('palm_pay')->emergency(["response_payout_bank_list"=>$response,'request'=>$params]);
        if(isset($response['data'])){
            if($request->from_admin == 1){
                return $response['data'];
            }
            return $this->successResponse('Bank List Fetched Successfully',$response['data']);
        }else{
            return $this->failedResponse($response['respMsg']);
        }
    }


    public function InitiatePayout(Request $request){
        try{
            $validator = Validator::make($request->all(),[
                'calling_from' => 'required',
                'payment_method_id' => 'required',
                'amount' => 'required',
                'currency'=>'required',
                'payee_account_number'=> 'required',
                'payee_bank_code'=> 'required_if:currency,NGN',
                'payment_option_id'=>'required'
            ]);
    
            if ($validator->fails()){
                $errors = $validator->messages()->all();
                return $this->failedResponse($errors[0]);
            }
            
            $calling_from = $request->calling_from;
            $status = 3;
            if ($calling_from == "DRIVER") {
                $driver = $request->user('api-driver');
                $id = $driver->id;
                $merchant_id = $driver->merchant_id;
                $alias_name = $driver->Merchant->alias_name;
                $status = 2;
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

            $paymentConfig = $this->getPalmPayConfig($merchant_id);
            $appId = $paymentConfig->api_public_key;
            $order_no = uniqid().time();
            $nonce_str = 'nonce'.uniqid().time();
            $amount = $request->amount;
            $transaction_id = 'TRANS_PAYOUT_'.time();
            $version = "V1.1";
            $requestTime = round(microtime(true) * 1000);
            $string_file = $this->getStringFile($merchant_id);
            $params = [
                "requestTime"=>$requestTime,
                "version"=>$version,
                "nonceStr"=>$nonce_str,
                "amount"=>$amount * 100,
                "notifyUrl"=>route('palmpay-notify',['trans_id'=>$transaction_id]),
                "orderId"=>$order_no,
                "payeeBankAccNo"=>$request->payee_account_number,
                "payeeBankCode"=>$request->payee_bank_code,  //for NGN compulsary
                "currency"=>"NGN",
                "country"=>"NG",
            ];

            $disk = Storage::disk('merchant_keys');
            $privateKey  = "{$alias_name}_private.pem";
            $domain = request()->getHost();
            $private_key = file_get_contents($disk->path($privateKey));
            
            $signature = $this->generateSignature($params, $private_key);
            $url = $paymentConfig->gateway_condition == 1 ? 'https://open-gw-prod.palmpay-inc.com/api/v2/merchant/payment/payout' : 'https://open-gw-daily.palmpay-inc.com/api/v2/merchant/payment/payout';

            $curl = curl_init();

            curl_setopt_array($curl, array(
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 0,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'POST',
                CURLOPT_POSTFIELDS =>json_encode($params),
                CURLOPT_HTTPHEADER => array(
                    'Accept:application/json',
                    'CountryCode:NG',
                    'Authorization:Bearer '.$appId,
                    'Signature:'.$signature,
                    'Content-Type:application/json'
                ),
            ));

            $response = json_decode(curl_exec($curl),true);
            \Log::channel('palm_pay')->emergency(["response_payout"=>$response,'request'=>$params]);
            if($response && $response['respCode'] == "00000000" && $response['respMsg'] == "success" && isset($response['data']['orderStatus']) && $response['data']['orderStatus'] == 2){
                DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'status' => $status,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id' => $transaction_id,
                    'reference_id'=>$order_no,
                    'amount' => $request->amount,
                    'payment_option_id' => $paymentConfig->payment_option_id,
                    'request_status' => 1,
                    'status_message' => 'SUCCESS',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);

                $res = [
                    'transaction_id' => $transaction_id ?? '',
                    'response'=> $response['data']
                ];
                
                if($calling_from == "DRIVER"){

                    DriverCashout::insertGetId([
                        'driver_id' => $driver->id,
                        'merchant_id' => $driver->merchant_id,
                        'amount' => $request->amount,
                        'cashout_status' => 1,
                        'action_by' => 'Online Payment',
                        'transaction_id' => $transaction_id,
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
                        'transaction_id' => $transaction_id,
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
                if($request->from_admin == 1){
                    return ['message'=>$response['respMsg'],'result'=>0];
                }else{
                    return $this->failedResponse($response['respMsg']);
                }
                    
                
            }
        }
        catch(\Exception $e) {
            DB::rollBack();
            throw new \Exception($e->getMessage());
    
        }   
    }
    

}