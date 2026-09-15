<?php

namespace App\Http\Controllers\PaymentMethods\SasaPay;

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

class SasaPayController extends Controller
{
    use ApiResponseTrait, MerchantTrait;
    public function getSasaPayConfig($merchant_id){
        $payment_option = PaymentOption::where('slug', 'SASA_PAY')->first();
        $paymentOption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id],['payment_option_id','=',$payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }
    
    public function callbackUrl(Request $request){
        $data = $request->all();
        \Log::channel('sasa_pay')->emergency(['callback_request'=>$request->all()]);
        $trans_id = $data['MerchantRequestID'];
        if(isset($data['ResultCode']) && $data['ResultCode'] == "0"){
            DB::table('transactions')
                        ->where(['payment_transaction_id' => $trans_id])
                        ->update(['request_status' => 2, 'payment_transaction' => json_encode($data), 'updated_at' => date('Y-m-d H:i:s'),'status_message'=> 'SUCCESS']);
        }else{
             DB::table('transactions')
                        ->where(['payment_transaction_id' => $trans_id])
                        ->update(['request_status' => 3, 'payment_transaction' => json_encode($data), 'updated_at' => date('Y-m-d H:i:s'),'status_message'=> 'FAIL']);
        }
        
        echo 'SUCCESS';
    }
    
    public function getAuthToken($username,$password, $grantType,$gatewayurl){
        try{
            $url = $gatewayurl.'/auth/token?grant_type='.$grantType;

            $curl = curl_init();

            curl_setopt_array($curl, array(
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'GET',
            CURLOPT_HTTPHEADER => array(
                'Authorization: Basic '. base64_encode("{$username}:{$password}")
            ),
            ));

            $response = curl_exec($curl);
            // dd($url,$username,$password,$response);

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
    
    public function generateUrl($request, $payment_option_config, $calling_from){
        try{
            $userName = $payment_option_config->api_public_key;
            $password = $payment_option_config->api_secret_key;
            $grantType = 'client_credentials';
            $currency = $request->currency;
            $amount = $request->amount;
            $phone = $request->phone;
            $merchantCode = $payment_option_config->auth_token;
            $networkCode = $payment_option_config->operator;

            if($calling_from == "DRIVER") {
                $user = $request->user('api-driver');
                $id = $user->id;
                $merchant_id = $user->merchant_id;
                $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
            }
            else{
                $user = $request->user('api');
                $id = $user->id;
                $merchant_id = $user->merchant_id;
                $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
            }

            $gatewayUrl = $payment_option_config->gateway_condition == 1 ? 'https://api.sasapay.app/api/v1' : 'https://sandbox.sasapay.app/api/v1';
            
            $token = $this->getAuthToken($userName,$password,$grantType,$gatewayUrl);
            
            if(empty($token)){
                throw new \Exception('Token not generated');
            }
            
            $payment_option = $this->getSasaPayConfig($merchant_id);
            $trans_id = 'TRANS_'.$id.'_'.time();
            $data = [
               "MerchantCode"=>$merchantCode,
                "NetworkCode"=>$networkCode,
                "Transaction Fee"=>0,
                "Currency"=> $currency,
                "Amount"=>$amount,
                "CallBackURL"=> route('sasapay-callback',['merchant_id' => $merchant_id]),
                "PhoneNumber"=>str_replace('+',"",$phone),
                "TransactionDesc"=>"Request Payment",
                "AccountReference"=>$trans_id
            ];
            
            // dd($data);
            
            $curl = curl_init();

            curl_setopt_array($curl, array(
                CURLOPT_URL => $gatewayUrl.'/payments/request-payment/',
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
                    'Content-Type: application/json',
                    'Accept: application/json',
                ),
            ));
            
            
            $response = json_decode(curl_exec($curl));
            \Log::channel('sasa_pay')->emergency(['response'=>$request->all()]);
            curl_close($curl);
            if(isset($response->status) && $response->status == true) {
                DB::table('transactions')->insert([
                'user_id' => $calling_from == "USER" ? $id : NULL,
                'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                'merchant_id' => $merchant_id,
                'payment_transaction_id'=> $trans_id,
                'amount' => $request->amount,
                'payment_option_id' => $payment_option->payment_option_id,
                'request_status'=> 1,
                'reference_id'=> "",
                'status_message'=> 'PENDING',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);
            }else{
                throw new \Exception($response->detail);
            }
        }catch(\Exception $e) {
            DB::rollBack();
            throw new \Exception($e->getMessage());
        }

        DB::commit();
        
        return [
            'transaction_id'=> $trans_id
        ];
    }
    
    public function paymentStatus($request, $payment_option_config, $calling_from){
        $transactionId = $request->transaction_id; 
        $transaction_table =  DB::table("transactions")->where('payment_transaction_id', $transactionId)->first();
        $payment_status =   $transaction_table->request_status == 2 ?  true : false;
        $data = [];
        if($transaction_table->request_status == 1)
        {
            $request_status_text = "processing";
            $transaction_status = 1;
            $data = ['payment_status' => $payment_status, 'request_status' => $request_status_text, 'transaction_status' => $transaction_status];
        }
        else if($transaction_table->request_status == 2)
        {
            $request_status_text = "success";
            $transaction_status = 2;
            $data = ['payment_status' => $payment_status, 'request_status' => $request_status_text, 'transaction_status' => $transaction_status];
        }
        else
        {
            $request_status_text = "failed";
            $transaction_status = 3;
            $data = ['payment_status' => $payment_status, 'request_status' => $request_status_text, 'transaction_status' => $transaction_status];
            
        }
        return ['payment_status' => $payment_status, 'request_status' => $request_status_text, 'transaction_status' => $transaction_status];
    }
}