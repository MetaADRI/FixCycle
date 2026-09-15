<?php

namespace App\Http\Controllers\PaymentMethods\UalabisPay;

use App\Driver;
use App\Http\Controllers\Controller;
use App\Models\PaymentOption;
use App\Models\PaymentOptionsConfiguration;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use App\Traits\MerchantTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class UalabisPayController extends Controller
{
    use ApiResponseTrait, MerchantTrait;
    
    public function getUalabisPayConfig($merchant_id){
        $payment_option = PaymentOption::where('slug', 'UALABIS_PAY')->first();
        $paymentOption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id],['payment_option_id','=',$payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }
    
    public function getAuthToken($username,$secretId,$clientId,$authUrl){
        try{
            $data = [
                "username"=>$username,
                "client_id"=>$clientId,
                "client_secret_id"=> $secretId,
                "grant_type"=>"client_credentials"
            ];

            $curl = curl_init();
            
            curl_setopt_array($curl, array(
              CURLOPT_URL => $authUrl.'v2/api/auth/token',
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
    public function CreateOrder($request,$payment_option_config, $calling_from){
        try{
            
            $username = $payment_option_config->api_public_key;
            $client_secret_id = $payment_option_config->api_secret_key;
            $client_id = $payment_option_config->auth_token;
            $checkoutUrl = $payment_option_config->gateway_condition == 1 ? 'https://checkout.developers.ar.ua.la/' : 'https://checkout.stage.developers.ar.ua.la/';
            $authUrl = $payment_option_config->gateway_condition == 1 ? 'https://auth.developers.ar.ua.la/' : 'https://auth.stage.developers.ar.ua.la/';
            if($calling_from == "DRIVER") {
                $user = $request->user('api-driver');
                $currency = $user->Country->isoCode;
                $id = $user->id;
                $merchant_id = $user->merchant_id;
                $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
                $email = $user->email;
            }
            else{
                $user = $request->user('api');
                $currency = $user->Country->isoCode;
                $id = $user->id;
                $merchant_id = $user->merchant_id;
                $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
                $email = $user->email;
            }

            $paymentOption = $this->getUalabisPayConfig($merchant_id);
        
            $externalID = 'TRANS_EXTERNAL_'.time();
            $reference = 'ORDER_'.time();

            $token = $this->getAuthToken($username,$client_secret_id,$client_id,$authUrl);
            if(empty($token)){
                throw new \Exception('Token not generated');
            }
            $params = [
                'external_reference' => $externalID,
                'amount' => $request->amount,
                "description"=> $paymentOption->Merchant->BusinessName .'Order',
                "notification_url"=> route("ualabis-notify",['merchant_id'=>$merchant_id,'trans_id'=> $reference]),
                "callback_fail"=> route("ualabis-fail",['merchant_id'=>$merchant_id,'trans_id'=> $reference]),
                "callback_success"=> route("ualabis-success",['merchant_id'=>$merchant_id,'trans_id'=> $reference]),
            ];
            $curl = curl_init();

            curl_setopt_array($curl, array(
              CURLOPT_URL => $checkoutUrl.'v2/api/checkout',
              CURLOPT_RETURNTRANSFER => true,
              CURLOPT_ENCODING => '',
              CURLOPT_MAXREDIRS => 10,
              CURLOPT_TIMEOUT => 0,
              CURLOPT_FOLLOWLOCATION => true,
              CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
              CURLOPT_CUSTOMREQUEST => 'POST',
              CURLOPT_POSTFIELDS =>json_encode($params),
              CURLOPT_HTTPHEADER => array(
                'Authorization: Bearer '.$token,
                'Content-Type: application/json'
              ),
            ));

            $response = json_decode(curl_exec($curl),true);
            curl_close($curl);
            \Log::channel('ualabis_pay')->emergency(['payload'=>$params,'response' => $response,'transId'=>$reference]);
            if(isset($response['status']) && $response['status'] == "PENDING" && isset($response['links']) && !empty($response['links']['checkout_link'])){
                 DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id'=> $reference,
                    'amount' => $request->amount,
                    'payment_option_id' => $payment_option_config->payment_option_id,
                    'request_status'=> 1,
                    'reference_id'=> $externalID,
                    'status_message'=> 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
            }
            if (isset($response['error_code'])) {
                throw new \Exception($response['message']);
            }
            
           
            
        }catch(\Exception $e) {
            DB::rollBack();
            throw new \Exception($e->getMessage());
        }

        DB::commit();
        
        return [
            'status' => 'NEED_TO_OPEN_WEBVIEW',
            'url' => isset($response['links']) && !empty($response['links']['checkout_link']) ? $response['links']['checkout_link'] : '',
            'transaction_id' => $reference ?? '',
            'success_url' => route('ualabis-success'),
            'fail_url' => route('ualabis-fail'),
        ];
        
    }
    public function Callback(Request $request){
        \Log::channel('ualabis_pay')->emergency(['callback_request' => $request->all()]);
        $data = $request->all();
        if(isset($data['status']) && $data['status'] == 'APPROVED'){
            $transaction_id = $data['trans_id'];
            DB::table('transactions')->where('payment_transaction_id', $transaction_id)->update([
                'request_status' => 2,
                'status_message' => 'SUCCESS',
                'payment_transaction'=> json_encode($data),
                'updated_at'=> date('Y-m-d H:i:s')
            ]);
        }elseif(isset($data['status']) && $data['status'] == 'REJECTED'){
            $transaction_id = $data['trans_id'];
            DB::table('transactions')->where('payment_transaction_id', $transaction_id)->update([
                'request_status' => 3,
                'status_message' => 'FAIL',
                'payment_transaction'=> json_encode($data),
                'updated_at'=> date('Y-m-d H:i:s')
            ]);
        }
    }
    
    public function Success(Request $request){
        \Log::channel('ualabis_pay')->emergency(['success_request' => $request->all()]);
        echo "<h1>Success</h1>";
    }
    
    public function Fail(Request $request){
        \Log::channel('ualabis_pay')->emergency(['fail_request' => $request->all()]);
        echo "<h1>Fail</h1>";
    }
}