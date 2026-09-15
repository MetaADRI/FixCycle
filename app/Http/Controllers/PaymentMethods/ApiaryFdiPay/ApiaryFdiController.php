<?php

namespace App\Http\Controllers\PaymentMethods\ApiaryFdiPay;

use App\Driver;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Helper\WalletTransaction;
use App\Models\PaymentOption;
use App\Models\PaymentOptionsConfiguration;
use App\Models\Transaction;
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

class ApiaryFdiController extends Controller
{
    use ApiResponseTrait, MerchantTrait;
    public function getApiaryFdiConfig($merchant_id){
        $payment_option = PaymentOption::where('slug', 'APIARY_FDI_PAYMENT')->first();
        $paymentOption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id],['payment_option_id','=',$payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }

    public function getAuthToken($appId,$appSecret){
        try{
            $data = [
                'appId'=> $appId,
                'secret'=> $appSecret,
            ];

            $curl = curl_init();
            

            curl_setopt_array($curl, array(
              CURLOPT_URL => 'https://payments-api.efashe.com/rw/v2/auth',
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
            if(isset($res['status']) && $res['status'] == 'success' && isset($res['data']) && isset($res['data']['token'])){
                return $res['data']['token'];
            }
            else{
                return '';
            }
        }catch(\Exception $e) {
            DB::rollBack();
            throw new \Exception($e->getMessage());
        }
    }

    public function getOptionChannel(Request $request){
        try{
            $validator = Validator::make($request->all(),[
                'calling_from' => 'required',
                'payment_method_id' => 'required'
            ]);
    
            if ($validator->fails()){
                $errors = $validator->messages()->all();
                return $this->failedResponse($errors[0]);
            }
            
            $calling_from = $request->calling_from;
            
            if($calling_from == "DRIVER") {
                $driver = $request->user('api-driver');
                $merchant_id = $driver->merchant_id;
            }
           else{
                $user = $request->user('api');
                $merchant_id = $user->merchant_id;
            }

            $payment_option_config = $this->getApiaryFdiConfig($merchant_id);
            $appId = $payment_option_config->api_public_key;
            $secret = $payment_option_config->api_secret_key;

            $token = $this->getAuthToken($appId,$secret);
            if(empty($token)){
                throw new \Exception('Token not generated');
            }

            $curl = curl_init();

            curl_setopt_array($curl, array(
              CURLOPT_URL => 'https://payments-api.efashe.com/rw/v2/channels',
              CURLOPT_RETURNTRANSFER => true,
              CURLOPT_ENCODING => '',
              CURLOPT_MAXREDIRS => 10,
              CURLOPT_TIMEOUT => 0,
              CURLOPT_FOLLOWLOCATION => true,
              CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
              CURLOPT_CUSTOMREQUEST => 'GET',
              CURLOPT_HTTPHEADER => array(
                'Authorization: Bearer '.$token,
                'Content-Type: application/json',
              ),
            ));

            $response = json_decode(curl_exec($curl),true);
            curl_close($curl);
            $data = [];
            if(!empty($response) && !empty($response['status']) && $response['status'] == 'success' && $response['data']){
                $data['channels'] = $response['data']['channels'];
                $data['token'] = $token;
                return $this->successResponse('Fetched Successfully',$data);
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

            $appId = $payment_option_config->api_public_key;
            $secret = $payment_option_config->api_secret_key;
            $account_id = $payment_option_config->auth_token;
            $channel_id = $request->channel_id;
            $phone = $request->phone;
            $amount = $request->amount;
            $transId = 'TRANS_'.time();
            $string_file = $this->getStringFile($merchant_id);

            $token = $request->token;
            $data = [
                'trxRef'=> $transId,
                'channelId'=> $channel_id,
                'accountId'=> $account_id,
                'msisdn'=> $phone,
                'amount'=> $amount,
                'callback'=> route('apiaryfdi-callback',['merchant_id'=>$merchant_id])
            ];

            $curl = curl_init();
            

            curl_setopt_array($curl, array(
              CURLOPT_URL => 'https://payments-api.efashe.com/rw/v2/momo/pull',
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
                'Content-Type: application/json',
                'Authorization: Bearer '.$token,
              ),
            ));
            

            $response = curl_exec($curl);
            curl_close($curl);
            $res = json_decode($response,true);
            \Log::channel('apiaryfdi_pay')->emergency(['api_response'=>$res,'token'=>$token,'request_param'=>$data]);
            if(isset($res['status']) && $res['status'] == "success" && isset($res['data']) && isset($res['data']['state']) && $res['data']['state'] == "processing"){
                $transId = $res['data']['trxRef'];
                $refId = $res['data']['gwRef'];
                DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'status' => $status,
                    'booking_id' => $request->booking_id,
                    'order_id' => $request->order_id,
                    'handyman_order_id' => $request->handyman_order_id,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id'=> $transId,
                    'amount' => $amount,
                    'payment_option_id' => $payment_option_config->payment_option_id,
                    'reference_id'=> $refId,
                    'request_status'=> 1,
                    'checkout_id'=> $channel_id,
                    'additional_data'=> $phone,
                    'status_message'=> 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);

                $data = [
                    'message'=>trans("$string_file.booking_confirm_transaction"),
                    'transaction_id'=>$transId,
                    'success_url' => route('apiaryfdi-success'),
                    'fail_url' => route('apiaryfdi-fail'),
                ];

                return $data;

            }elseif(isset($res['data']['message']) && isset($res['status']) && $res['status'] == "yy"){
                throw new \Exception($res['data']['message']);
            }
        }catch(\Exception $e) {
            DB::rollBack();
            throw new \Exception($e->getMessage());
        }
    }

    public function Callback(Request $request){
        \Log::channel('apiaryfdi_pay')->emergency(['callback_url'=>$request->all()]);
        $data = $request->all();
        if(isset($data['status']) && $data['status'] == "success" && isset($data['data']) && isset($data['data']['state']) && $data['data']['state'] == "successful"){
            $transId = $data['data']['trxRef'];
            DB::table('transactions')
                ->where(['payment_transaction_id' => $transId])
                ->update(['request_status' => 2, 'payment_transaction' => json_encode($data), 'updated_at' => date('Y-m-d H:i:s'),'status_message'=> 'SUCCESS']);

        }elseif(isset($data['status']) && $data['status'] == "fail"){
            $transId = $data['data']['trxRef'];
            DB::table('transactions')
                ->where(['payment_transaction_id' => $transId])
                ->update(['request_status' => 3, 'payment_transaction' => json_encode($data), 'updated_at' => date('Y-m-d H:i:s'),'status_message'=> 'FAIL']);
        }
    }

    public function Success(Request $request){
        \Log::channel('apiaryfdi_pay')->emergency(['success_url'=>$request->all()]);
        echo '<h3>Success</h3>';
    }

    public function Fail(Request $request){
        \Log::channel('apiaryfdi_pay')->emergency(['fail_url'=>$request->all()]);
        echo '<h3>Failed</h3>';
    }

    public function paymentStatus($request, $payment_option_config, $calling_from){
        $transactionId = $request->transaction_id; 
        $transaction_table =  Transaction::where('payment_transaction_id', $transactionId)->first();
        $payment_status =   $transaction_table->request_status == 2 ?  true : false;
        if($transaction_table->request_status == 1)
        {
            $request_status_text = "processing";
            $transaction_status = 1;
            $token = $request->token;
            if(!empty($token)){
                $curl = curl_init();

                curl_setopt_array($curl, array(
                CURLOPT_URL => 'https://payments-api.efashe.com/rw/v2/momo/trx/'.$transactionId.'/info',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 0,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'GET',
                CURLOPT_HTTPHEADER => array(
                    'Authorization: Bearer '.$token,
                    'Content-Type: application/json',
                ),
                ));

                $response = json_decode(curl_exec($curl),true);
                curl_close($curl);
                \Log::channel('apiaryfdi_pay')->emergency(['get_status_api_response'=>$response,'token'=>$token,'request_data'=>$request->all()]);
                if(isset($response['status']) && $response['status'] == "success" && isset($response['data']['trxStatus']) && $response['data']['trxStatus'] == "successful"){
                    $transaction_table->request_status = 2;
                    $transaction_table->payment_transaction = json_encode($response);
                    $transaction_table->updated_at = date('Y-m-d H:i:s');
                    $transaction_table->status_message  =  "SUCCESS";
                    $transaction_table->save();

                    $request_status_text = "success";
                    $transaction_status = 2;
                    $payment_status = true;
                }
            }
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

    public function paymentMomoPull($order){
        $transactionId = $order->OrderTransaction->transaction_id;
        $merchant_id = $order->merchant_id;
        $paymentOptionConfig = $this->getApiaryFdiConfig($merchant_id);
        $appId = $paymentOptionConfig->api_public_key;
        $secret = $paymentOptionConfig->api_secret_key;
        $account_id = $paymentOptionConfig->auth_token;
        
        $transaction_table =  Transaction::where('payment_transaction_id', $transactionId)->first();
        $calling_from = !empty($transaction_table->user_id) ? 'USER' : 'DRIVER';
        $id = !empty($transaction_table->user_id) ? $transaction_table->user_id : $transaction_table->driver_id;
        $channel_id = $transaction_table->checkout_id;
        $phone = $transaction_table->additional_data;
        $amount = $transaction_table->amount;
        $transId = 'TRANS_REFUND_'.time();
        $string_file = $this->getStringFile($order->merchant_id);
        $data = [
            'trxRef'=> $transId,
            'channelId'=> $channel_id,
            'accountId'=> $account_id,
            'msisdn'=> $phone,
            'amount'=> $amount,
            'callback'=> route('apiaryfdi-callback',['merchant_id'=>$merchant_id])
        ];

        $token = $this->getAuthToken($appId,$secret);
        if(empty($token)){
            throw new \Exception('Token not generated');
        }
        
        $curl = curl_init();

        curl_setopt_array($curl, array(
          CURLOPT_URL => 'https://payments-api.efashe.com/rw/v2/momo/push',
          CURLOPT_RETURNTRANSFER => true,
          CURLOPT_ENCODING => '',
          CURLOPT_MAXREDIRS => 10,
          CURLOPT_TIMEOUT => 0,
          CURLOPT_FOLLOWLOCATION => true,
          CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
          CURLOPT_CUSTOMREQUEST => 'POST',
          CURLOPT_POSTFIELDS => json_encode($data),
          CURLOPT_HTTPHEADER => array(
            'Authorization: Bearer '.$token,
            'Content-Type: application/json'
          ),
        ));
        
        $response = curl_exec($curl);
        $res = json_decode($response,true);
        \Log::channel('apiaryfdi_pay')->emergency(['momo_push_api_response'=>$response,'token'=>$token,'request_param'=>$data]);
        if(isset($res['status']) && $res['status'] == "success" && isset($res['data']) && isset($res['data']['state']) && $res['data']['state'] == "processing"){
                $trans_id = $res['data']['trxRef'];
                $refId = $res['data']['gwRef'];
                DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'status' => 1,
                    'booking_id' => $request->booking_id ?? NULL,
                    'order_id' => $request->order_id ?? NULL,
                    'handyman_order_id' => $request->handyman_order_id ?? NULL,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id'=> $transId,
                    'amount' => $amount,
                    'payment_option_id' => $paymentOptionConfig->payment_option_id,
                    'reference_id'=> $refId,
                    'request_status'=> 1,
                    'checkout_id'=> $channel_id,
                    'additional_data'=> $phone,
                    'status_message'=> 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
                
                return [
                    'status'=> "Success",
                    "message"=> trans("$string_file.transaction_complete_within_24_hrs")
                ];
        }else{
            $trans_id = $res['data']['trxRef'];
                $refId = $res['data']['gwRef'];
                DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'status' => 1,
                    'booking_id' => $request->booking_id ?? NULL,
                    'order_id' => $request->order_id ?? NULL,
                    'handyman_order_id' => $request->handyman_order_id ?? NULL,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id'=> $transId,
                    'amount' => $amount,
                    'payment_option_id' => $paymentOptionConfig->payment_option_id,
                    'reference_id'=> $refId,
                    'request_status'=> 3,
                    'checkout_id'=> $channel_id,
                    'additional_data'=> $phone,
                    'status_message'=> 'FAIL',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
            return [
                    'status'=> "Fail",
                    "message"=> trans("$string_file.transaction_fail")
                ];
        }
    }


}