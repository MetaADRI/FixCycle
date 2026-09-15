<?php

namespace App\Http\Controllers\PaymentMethods\Monnify;

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

class MonnifyPaymentController extends Controller
{
    // public function getAuthTokenForBog($client_id, $client_secret, $environment)
    // {
    //     try {
    //         $creds = "Basic " . base64_encode($client_id . ":" . $client_secret);

    //         $curl = curl_init();
    //         $url = $environment == 2 ?  'https://sandbox.monnify.com/api/v1/auth/login' : "";

    //         curl_setopt_array($curl, array(
    //             CURLOPT_URL => $url,
    //             CURLOPT_RETURNTRANSFER => true,
    //             CURLOPT_ENCODING => '',
    //             CURLOPT_MAXREDIRS => 10,
    //             CURLOPT_TIMEOUT => 0,
    //             CURLOPT_FOLLOWLOCATION => true,
    //             CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    //             CURLOPT_CUSTOMREQUEST => 'POST',
    //             CURLOPT_HTTPHEADER => array(
    //                 'Authorization: '.$creds,
    //             ),
    //         ));

    //         $response = curl_exec($curl);

    //         curl_close($curl);
    //         $res = json_decode($response, true);
    //         if (isset($res['requestSuccessful']) && $res['requestSuccessful']) {
    //             return $res['responseBody']['accessToken'];
    //         } else {
    //             return '';
    //         }
    //     } catch (\Exception $e) {
    //         throw new \Exception($e->getMessage());
    //     }
    // }



    public function initiatePayment($request, $paymentConfig, $calling_from){
        try{
        $status = 3;
            if($calling_from == "DRIVER") {
                $user = $request->user('api-driver');
                $countryCode = $user->country->country_code;
                $id = $user->id;
                $status = 2;
                $merchant_id = $user->merchant_id;
                $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
                $email = $user->email;
                $first_name = $user->first_name;
                $last_name = $user->last_name;
                $phone = $user->UserPhone;
            }
            else{
                $user = $request->user('api');
                $countryCode = $user->country->country_code;
                $id = $user->id;
                $status = 1;
                $merchant_id = $user->merchant_id;
                $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
                $email = $user->email;
                $first_name = $user->first_name;
                $last_name = $user->last_name;
                $phone = $user->phoneNumber;
            }

            $reference = 'REF_MERCHANT_'.time();
            $amount = $request->amount;
            $currency = $request->currency;
            $js_url = $paymentConfig->gateway_condition == 1 ? 'https://sdk.monnify.com/plugin/monnify.js' : 'https://sdk.monnify.com/plugin/monnify.js';
            // $clientSecret = $paymentConfig->auth_token;
            $contractCode = $paymentConfig->api_secret_key;
            $apiKey = $paymentConfig->api_public_key;
            $environment =$paymentConfig->gateway_condition;
            $currency  = $request->currency;
            $trans_id = "TRANS_" . $id . '_' . time();

            // $token = $this->getAuthTokenForBog($clientId, $clientSecret, $environment);
            // if (empty($token)) {
            //     throw new \Exception('Token not generated');
            // }

            // $url = $environment == 2 ? "https://sandbox.monnify.com/api/v1/merchant/transactions/init-transaction" :  "";

            // $data = [
            //     "amount" => 20,
            //     "customerEmail" => $user->email,
            //     "paymentReference" => $trans_id,
            //     "paymentDescription" => "Trial transaction",
            //     "currencyCode" => $currency,
            //     "contractCode" => $contractCode,
            //     "redirectUrl" => route('monnify-redirect',['merchant_id'=>$merchant_id,'trans_id',$trans_id]),
            //     "paymentMethods" => [
            //         "CARD",
            //         "ACCOUNT_TRANSFER",
            //     ],
            //     "metadata" => [
            //         "name" => $user->first_name." ".$user->last_name,
            //     ],
            // ];

            // $curl = curl_init();

            // curl_setopt_array($curl, array(
            //     CURLOPT_URL => $url,
            //     CURLOPT_RETURNTRANSFER => true,
            //     CURLOPT_ENCODING => '',
            //     CURLOPT_MAXREDIRS => 10,
            //     CURLOPT_TIMEOUT => 0,
            //     CURLOPT_FOLLOWLOCATION => true,
            //     CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            //     CURLOPT_CUSTOMREQUEST => 'POST',
            //     CURLOPT_POSTFIELDS => json_encode($data),
            //     CURLOPT_HTTPHEADER => array(
            //         'Authorization: Bearer <token>',
            //         'Content-Type: application/json'
            //     ),
            // ));

            // $response = curl_exec($curl);

            // curl_close($curl);
            // echo $response;

            $data = [
                "amount" => 20,
                "email" => $user->email ?? 'test@gmail.com',
                "paymentReference" => $trans_id,
                "paymentDescription" => "Trial transaction",
                "currency" => $currency,
                "contractCode" => $contractCode,
                'full_name'=>$first_name." ".$last_name,
                'apiKey'=> $apiKey,
                'success_url' => route('monnify-success'),
                'fail_url' => route('monnify-fail'),
            ];

             DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'status' => $status,
                    'booking_id' => $request->booking_id,
                    'order_id' => $request->order_id,
                    'handyman_order_id' => $request->handyman_order_id,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id'=> $trans_id,
                    'amount' => $amount,
                    'payment_option_id' => $paymentConfig->payment_option_id,
                    'reference_id'=> $trans_id,
                    'request_status'=> 1,
                    'status_message'=> 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
            
            $data = [
                'status' => 'NEED_TO_OPEN_WEBVIEW',
                'url' => route('monnify-webview',['data' => encrypt(json_encode($data)),'url'=> $js_url]),
                'transaction_id' => $trans_id,
                'success_url' => route('monnify-success'),
                'fail_url' => route('monnify-fail'),
            ];
            
            return $data;

        }catch (\Exception $e){
            throw new \Exception($e->getMessage());
        }
    }

    public function webView(Request $request){
        $data = json_decode(decrypt($request->data),true);
        $url = $request->url;
        return view('payment.monnify.monnify',['url' => $url,'data' => $data]);
    }

    public function webhook(Request $request){
        \Log::channel('monnify_pay')->emergency(['webhook_url'=>$request->all()]);
    }

    public function Success(Request $request){
        \Log::channel('monnify_pay')->emergency(['success_url'=>$request->all()]);
        $data = $request->all();
        if(isset($data['reference'])){
            $transaction_id = $data['reference'];
            DB::table('transactions')
                ->where(['payment_transaction_id' => $transaction_id])
                ->update(['request_status' => 2, 'payment_transaction' => json_encode($data), 'updated_at' => date('Y-m-d H:i:s'),'status_message'=> 'SUCCESS']);
        }
        echo '<h3>Success</h3>';
    }

    public function Fail(Request $request){
        \Log::channel('monnify_pay')->emergency(['fail_url'=>$request->all()]);
        $data = $request->all();
        if(isset($data['reference'])){
            $transaction_id = $data['reference'];
            DB::table('transactions')
                ->where(['payment_transaction_id' => $transaction_id])
                ->update(['request_status' => 3, 'payment_transaction' => json_encode($data), 'updated_at' => date('Y-m-d H:i:s'),'status_message'=> 'FAIL']);
        }
        echo '<h3>Failed</h3>';
    }
}