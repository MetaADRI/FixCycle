<?php

namespace App\Http\Controllers\PaymentMethods\SelcomPay;

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

class SelcomPayController extends Controller
{
    use ApiResponseTrait, MerchantTrait;
    
    public function getSelcomPayConfig($merchant_id){
        $payment_option = PaymentOption::where('slug', 'SELCOM_PAY')->first();
        $paymentOption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id],['payment_option_id','=',$payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }
    
    public function createOrder($request, $payment_option_config, $calling_from)
    {
        $apiKey = $payment_option_config->api_public_key;
        $secretKey = $payment_option_config->api_secret_key;
        $url = $payment_option_config->tokenization_url.'/checkout/create-order';
        $vendor = $payment_option_config->operator;
        $phone = $request->phone; //255082852526
        $email = $request->email;
        $amount = $request->amount;
        $currency = $request->currency; //TZS
        
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
        
        $paymentOption = $this->getSelcomPayConfig($merchant_id);
        
        $orderId = 'ORDER_'.time();
        $refId = 'REF_'.time();

        // Timestamp in ISO 8601 format
        $timestamp = now()->format('Y-m-d\TH:i:sP');
        
        $redirect = route('selcom-redirect',['merchant_id'=>$merchant_id,'trans_id'=>$orderId]);
        $cancel = route('selcom-cancel',['merchant_id'=>$merchant_id,'trans_id'=>$orderId]);
        $webhook = route('selcom-webhook',['merchant_id'=>$merchant_id,'trans_id'=>$orderId]);
        // Base64 encode URL fields as per doc
        $redirect_url = base64_encode($redirect);
        $cancel_url = base64_encode($cancel);
        $webhook = base64_encode($webhook);
        
        // $redirect_url = base64_encode("https://msprojects.apporioproducts.com/multi-service-v3/public/api/selcom/redirect?merchant_id=".$merchant_id."&trans_id=".$orderId);
        // $cancel_url = base64_encode("https://msprojects.apporioproducts.com/multi-service-v3/public/api/selcom/cancel?merchant_id=".$merchant_id."&trans_id=".$orderId);
        // $webhook = base64_encode("https://msprojects.apporioproducts.com/multi-service-v3/public/api/selcom/webhook?merchant_id=".$merchant_id."&trans_id=".$orderId);
        // Request payload
        $payload = [
            "vendor" => $vendor,
            "order_id" => $orderId,
            "buyer_email" => $email,
            "buyer_name" => $name,
            "buyer_userid" => "",
            "buyer_phone" =>$phone,
            "gateway_buyer_uuid" => "",
            "amount" => $amount,
            "currency" => $currency,
            "payment_methods" => "ALL",
            "redirect_url" => $redirect_url,
            "cancel_url" =>$cancel_url,
            "webhook" => $webhook,
            "billing" => [
                "firstname" => $name,
                "lastname" => "Doe",
                "address_1" => "969 Market",
                "address_2" => "",
                "city" => "San Francisco",
                "state_or_region" => "CA",
                "postcode_or_pobox" => "94103",
                "country" => "US",
                "phone" => $phone,
            ],
            "buyer_remarks" => "None",
            "merchant_remarks" => "None",
            "no_of_items" => 0,
        ];

        $header = $this->headerData($payload,$timestamp);
        
        $data = $header['data'];
        $signedFieldsHeader = $header['signedFieldsHeader'];
        
        // Create the digest using HMAC-SHA256
        $digest = base64_encode(hash_hmac('sha256', $data, $secretKey, true));

        $headers = [
            "Accept: application/json",
            "Content-Type: application/json",
            "Authorization: SELCOM " . base64_encode($apiKey),
            "Digest-Method: HS256",
            "Digest: " . $digest,
            "Timestamp: " . $timestamp,
            "Signed-Fields: " . $signedFieldsHeader
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        $response = curl_exec($ch);
        \Log::channel('selcom_pay')->emergency(['payload'=> $payload,'response' => $response]);
        if ($response === false) {
            $error = curl_error($ch);
            curl_close($ch);
            return response()->json(['error' => $error], 500);
        }
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $res = json_decode($response, true);
        $paymentUrl = "";
        if($res && isset($res['data']) && isset($res['data'][0]) && isset($res['data'][0]['payment_gateway_url'])){
            $paymentUrl = base64_decode($res['data'][0]['payment_gateway_url']);
            DB::table('transactions')->insert([
                'user_id' => $calling_from == "USER" ? $id : NULL,
                'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                'merchant_id' => $merchant_id,
                'payment_transaction_id'=> $orderId,
                'amount' => $amount,
                'payment_option_id' => $payment_option_config->payment_option_id,
                'request_status'=> 1,
                'reference_id'=> $refId,
                'status_message'=> 'PENDING',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);
        }
        
        return [
            'status' => 'NEED_TO_OPEN_WEBVIEW',
            'url' => isset($paymentUrl) ? $paymentUrl : '',
            'transaction_id' => $orderId,
            'success_url' => route('selcom-success'),
            'fail_url' => route('selcom-fail'),
        ];
    }
    
    public function headerData($payload,$timestamp){
        // Fields that will be signed
        $signedFields = [
            'vendor',
            'order_id',
            'buyer_email',
            'buyer_name',
            'buyer_user_id',
            'buyer_phone',
            'gateway_buyer_uuid',
            'amount',
            'currency',
            'payment_methods',
            'redirect_url',
            'cancel_url',
            'webhook',
            'billing.firstname',
            'billing.lastname',
            'billing.address_1',
            'billing.address_2',
            'billing.city',
            'billing.state_or_region',
            'billing.postcode_or_pobox',
            'billing.country',
            'billing.phone',
            'shipping.firstname',
            'shipping.lastname',
            'shipping.address_1',
            'shipping.address_2',
            'shipping.city',
            'shipping.state_or_region',
            'shipping.postcode_or_pobox',
            'shipping.country',
            'shipping.phone',
            'buyer_remarks',
            'merchant_remarks',
            'no_of_items'
        ];

        // Create Signed-Fields header
        $signedFieldsHeader = implode(',', $signedFields);

        // Prepare data string for signing
        $data = "timestamp={$timestamp}";
        foreach ($signedFields as $field) {
            $value = $this->getFieldValue($payload, $field);
            $data .= "&{$field}={$value}";
        }
        
        return [
            'data'=> $data,
            'signedFieldsHeader'=>$signedFieldsHeader
        ];
    }

    // Helper to retrieve nested values
    private function getFieldValue(array $payload, string $field)
    {
        $keys = explode('.', $field);
        $value = $payload;

        foreach ($keys as $key) {
            if (isset($value[$key])) {
                $value = $value[$key];
            } else {
                return '';
            }
        }

        return $value;
    }
    
   public function Redirect(Request $request){
        \Log::channel('selcom_pay')->emergency(['redirect_request' => $request->all()]);
        $data = $request->all();
        $transaction_id = $data['trans_id'];
        $transaction = \App\Models\Transaction::where('payment_transaction_id', $transaction_id)->first();
        if($transaction){
            if($transaction->request_status == 2){
                return redirect()->route('selcom-success');
            }else{
                return redirect()->route('selcom-fail');
            }
        }
        echo '<h1>Redirect</h1>';
    }
    
    public function Webhook(Request $request){
        \Log::channel('selcom_pay')->emergency(['webhook_request' => $request->all()]);
        $data = $request->all();
        if(isset($data['result']) && $data['result'] == 'SUCCESS' && $data['payment_status'] == 'COMPLETED'){
            $transaction_id = $data['trans_id'];
            DB::table('transactions')->where('payment_transaction_id', $transaction_id)->update([
                'request_status' => 2,
                'status_message' => 'SUCCESS',
                'payment_transaction'=> json_encode($data),
                'updated_at'=> date('Y-m-d H:i:s')
            ]);
        }else{
            $transaction_id = $data['trans_id'];
            DB::table('transactions')->where('payment_transaction_id', $transaction_id)->update([
                'request_status' => 3,
                'status_message' => 'FAIL',
                'payment_transaction'=> json_encode($data),
                'updated_at'=> date('Y-m-d H:i:s')
            ]);
        }
        echo '<h1>Webhook</h1>';
    }
    
    public function Cancel(Request $request){
        \Log::channel('selcom_pay')->emergency(['cancel_request' => $request->all()]);
        echo '<h1>Cancel</h1>';
    }
    
    public function Success(Request $request){
        \Log::channel('selcom_pay')->emergency(['success_request' => $request->all()]);
        echo "<h1>Success</h1>";
    }
    
    public function Fail(Request $request){
        \Log::channel('selcom_pay')->emergency(['fail_request' => $request->all()]);
        echo "<h1>Fail</h1>";
    }
    
}
