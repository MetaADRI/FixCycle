<?php

namespace App\Http\Controllers\PaymentMethods\IkhokhaPay;

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

class IkhokhaPayController extends Controller
{
    use ApiResponseTrait, MerchantTrait;
    
    public function getIkhokhaPayConfig($merchant_id){
        $payment_option = PaymentOption::where('slug', 'IKHOKHA_PAY')->first();
        $paymentOption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id],['payment_option_id','=',$payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }
    
    public function generatePaymentUrl($request, $payment_option_config, $calling_from)
    {
        $appId = $payment_option_config->api_public_key;
        $appSecret = $payment_option_config->api_secret_key;  

        if($calling_from == "DRIVER") {
            $user = $request->user('api-driver');
            $id = $user->id;
            $merchant_id = $user->merchant_id;
            $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
            $name = $user->first_name.' '.$user->last_name;
        }
        else{
            $user = $request->user('api');
            $id = $user->id;
            $merchant_id = $user->merchant_id;
            $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
            $name = $user->first_name.' '.$user->last_name;
        }
        
        $url = 'https://api.ikhokha.com/public-api/v1/api/payment';
        
        $externalId = 'EXTERNAL_'.time();
        $trans_id = 'TRANS_'.time();
        $amount = $request->amount;
        $currency = $request->currency; //ZAR
        
        $requestBodyArray = [
            "entityID" => $appId,
            "externalEntityID" =>$externalId,
            "amount" => (int)$amount * 100,  //multiple by 100 to show on web view becuase webview takes last two digit as cent
            "currency" => $currency,
            "requesterUrl" => route("ikhokha-requester",['merchant_id'=>$merchant_id,'externalId'=>$externalId]),
            "description" => "Test Description 1",
            "paymentReference" =>$externalId,
            "mode" => "live",
            "externalTransactionID" => $externalId,
            "urls" => [
                "callbackUrl" => route("ikhokha-callback",['merchant_id'=>$merchant_id,'externalId'=>$externalId]),
                "successPageUrl" => route("ikhokha-success",['merchant_id'=>$merchant_id,'externalId'=>$externalId]),
                "failurePageUrl" => route("ikhokha-fail",['merchant_id'=>$merchant_id,'externalId'=>$externalId]),
                "cancelUrl" => route("ikhokha-cancel",['merchant_id'=>$merchant_id,'externalId'=>$externalId]),
            ]
        ];
        // dd($requestBodyArray);
        
        $requestBody = json_encode($requestBodyArray);
        
        $payloadToSign = $this->createPayloadToSign($url, $requestBody);
        $ikSign = $this->generateSignature($payloadToSign, $appSecret);
        
        $header = [
            'Content-Type: application/json',
            'IK-APPID: ' . $appId,
            'IK-SIGN: ' . $ikSign
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER,$header);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
        $response = curl_exec($ch);

        if ($response === false) {
            $error = curl_error($ch);
            curl_close($ch);
            return $this->failedResponse($error);
        }
        curl_close($ch);
        $responseData = json_decode($response, true);
        \Log::channel('ikhokha_pay')->emergency(['payload'=>$requestBodyArray,'response_payment' => $responseData]);
        if($responseData && $responseData['responseCode'] && $responseData['responseCode'] == "00" && $responseData['paylinkUrl']){
            DB::table('transactions')->insert([
                'user_id' => $calling_from == "USER" ? $id : NULL,
                'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                'merchant_id' => $merchant_id,
                'payment_transaction_id'=> $trans_id,
                'amount' => $amount,
                'payment_option_id' => $payment_option_config->payment_option_id,
                'payment_transaction'=> $requestBody,
                'request_status'=> 1,
                'checkout_id'=>$responseData['paylinkID'],
                'reference_id'=> $externalId,
                'status_message'=> 'PENDING',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);
        }else{
            return ['result'=>0,'response'=>'Payment Url Not generated'];
        }
        
        return [
            'status' => 'NEED_TO_OPEN_WEBVIEW',
            'url' => isset($responseData['paylinkUrl']) ? $responseData['paylinkUrl'] : '',
            'transaction_id' => $externalId,
            'success_url' => route('ikhokha-success'),
            'fail_url' => route('ikhokha-fail'),
        ];
    }
    
    public function createPayloadToSign($urlPath, $body) {
        $parsedUrl = parse_url($urlPath);
        $basePath =  $parsedUrl['path'];
        if (!$basePath) {
            throw new Exception("No path present in the URL");
        }
        $payload = $basePath . $body;
        $escapedPayloadString = $this->escapeString($payload);
        return $escapedPayloadString;
    }
    
    public function escapeString($str) {
        $escaped = preg_replace(['/[\\"\'\"]/u', '/\x00/'], ['\\\\$0', '\\0'], (string)$str);
        $cleaned = str_replace('\/', '/', $escaped);
        return $cleaned;
    }
    
    public function generateSignature($payloadToSign, $secret) {
        return hash_hmac('sha256', $payloadToSign, $secret);
    }
    
    public function Callback(Request $request){
        \Log::channel('ikhokha_pay')->emergency(['callback_request' => $request->all()]);
        $data = $request->all();
        if(isset($data['externalTransactionID'])){
            $transaction_id = $data['externalTransactionID'];
            $transaction = \App\Models\Transaction::where('reference_id', $transaction_id)->first();
            // $url = route("ikhokha-callback");
            if($transaction){
                // $requestBody = json_encode($data);
                // $payloadToSign = $this->createPayloadToSign($url, $requestBody);
                // $ikSign = $this->generateSignature($payloadToSign, $appSecret);
                
                // $header = [
                //     'Content-Type: application/json',
                //     'ik-appid: ' . $appId,
                //     'ik-sign: ' . $ikSign
                // ];
                
                if(isset($data['status']) && $data['status'] == "SUCCESS"){
                    $transaction->request_status = 2;
                    $transaction->status_message = 'SUCCESS';
                    $transaction->updated_at = date('Y-m-d H:i:s');
                    $transaction->save();
                }elseif(isset($data['status']) && $data['status'] == "FAILURE"){
                    $transaction->request_status = 3;
                    $transaction->status_message = 'FAIL';
                    $transaction->updated_at = date('Y-m-d H:i:s');
                    $transaction->save();
                }
                
            }
            
        }
    }
    
    public function RequesterUrl(Request $request){
        \Log::channel('ikhokha_pay')->emergency(['requester_request' => $request->all()]);
    }
    
    public function Cancel(Request $request){
        \Log::channel('ikhokha_pay')->emergency(['cancel_request' => $request->all()]);
    }
    
    public function Success(Request $request){
        \Log::channel('ikhokha_pay')->emergency(['success_request' => $request->all()]);
        echo "<h1>Success</h1>";
    }
    
    public function Fail(Request $request){
        \Log::channel('ikhokha_pay')->emergency(['fail_request' => $request->all()]);
        echo "<h1>Fail</h1>";
    }
    
    public function paymentStatus($request, $payment_option_config, $calling_from){
        $appId = $payment_option_config->api_public_key;
        $appSecret = $payment_option_config->api_secret_key;  
        $transactionId = $request->transaction_id; 
        $transaction_table = \App\Models\Transaction::where('reference_id', $transactionId)->first();
        $paylinkId = $transaction_table->checkout_id;
        $requestBody = $transaction_table->payment_transaction;
        $url = "https://api.ikhokha.com/public-api/v1/api/getStatus/".$paylinkId;
        $parsedUrl = parse_url($url);
        $basePath =  $parsedUrl['path'];
        $payloadToSign = $this->escapeString($basePath);
        $ikSign = $this->generateSignature($payloadToSign, $appSecret);
        $payment_status = false;
        $header = [
            'Content-Type: application/json',
            'IK-APPID: ' . $appId,
            'IK-SIGN: ' . $ikSign
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPGET, true); 
        curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
        $response = curl_exec($ch);

        if ($response === false) {
            $error = curl_error($ch);
            curl_close($ch);
            return $this->failedResponse($error);
        }
        curl_close($ch);
        $responseData = json_decode($response, true);
        \Log::channel('ikhokha_pay')->emergency(['payment_status' => $responseData]);
        if(isset($responseData) && isset($responseData['status']) && $responseData['status'] == "PAID"){
            $transaction_table->request_status = 2;
            $transaction_table->status_message = 'SUCCESS';
            $transaction_table->updated_at = date('Y-m-d H:i:s');
            $transaction_table->save();
        }elseif(isset($responseData) && isset($responseData['error'])){
            $transaction_status = 3;
            $data = ['payment_status' => $payment_status, 'request_status' => $responseData['error'], 'transaction_status' => $transaction_status];
        }
        // else{
        //     $transaction_table->request_status = 3;
        //     $transaction_table->status_message = 'FAIL';
        //     $transaction_table->updated_at = date('Y-m-d H:i:s');
        //     $transaction_table->save();
        // }
        $transaction_table->refresh();
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
        
        return $data;
    }
}