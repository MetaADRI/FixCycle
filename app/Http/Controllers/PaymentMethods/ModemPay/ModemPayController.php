<?php

namespace App\Http\Controllers\PaymentMethods\ModemPay;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Helper\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Traits\ApiResponseTrait;
use App\Traits\MerchantTrait;
use App\Models\Booking;
use App\Models\Driver;
use App\Models\DriverCard;
use App\Models\PaymentOption;
use App\Models\PaymentOptionsConfiguration;
use App\Models\Merchant;
use App\Models\User;
use App\Models\UserCard;
use DateTime;
use Carbon\Carbon;
use App\Models\Onesignal;
use App\Models\Transaction;
use ModemPay\Laravel\Facades\ModemPay;

class ModemPayController extends Controller
{
    use ApiResponseTrait,MerchantTrait;
    
    public function getModemPayConfig($merchant_id){
        $payment_option = PaymentOption::where('slug', 'MODEMPAY')->first();
        $paymentOption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id],['payment_option_id','=',$payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }
    
    public function generatePaymentUrl($request, $payment_option_config, $calling_from){
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
            
            $payment_option = $this->getModemPayConfig($merchant_id);
            $order_id = 'TRANS_'.$id.'_'.time();
            $public_key = $payment_option_config->api_public_key;
            $secret_key = $payment_option_config->api_secret_key;
            $webhookSecret = $payment_option_config->auth_token;
            $amount = $request->amount;
            $currency = $request->currency;
            $domain = request()->getHost();
            
            config([
                'modempay.api_key' => $secret_key,
                'modempay.webhook_secret' => $webhookSecret,
            ]);
            
            $payment = ModemPay::paymentIntents()->create([
                'amount' => $amount,
                'currency' => $currency,
                'callback_url' =>route('modempay-webhook',['merchant_id'=> $merchant_id]),
                'return_url' =>route('modempay-return'),
                'skip_url_validation'=> true
            ]);
            
            DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'status' => $status,
                    'booking_id' => $request->booking_id,
                    'order_id' => $request->order_id,
                    'handyman_order_id' => $request->handyman_order_id,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id'=> $order_id,
                    'amount' => $amount,
                    'payment_option_id' => $payment_option->payment_option_id,
                    'reference_id'=> '',
                    'checkout_id'=> isset($payment->data->payment_intent_id) && $payment->data->payment_intent_id ? $payment->data->payment_intent_id : "",
                    'request_status'=> 1,
                    'status_message'=> 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
            
            $data = [
                'status' => 'NEED_TO_OPEN_WEBVIEW',
                'url' => isset($payment->data->payment_link) && isset($payment->status) && $payment->status == true ? $payment->data->payment_link : "",
                'transaction_id' => $order_id,
                'success_url' => route('modempay-success'),
                'fail_url' => route('modempay-fail'),
                'deeplink_success' => $domain . '://modempay/success',
                'deeplink_fail'    => $domain . '://modempay/fail'
            ];
            
            return $data;
    }
    
    public function returnUrl(Request $request){
        \Log::channel('modempay_api')->emergency(['return_url'=>$request->all()]);
        $data = $request->all();
        $trans = Transaction::where(['reference_id' => $data['transaction_id']])->first();
        if($trans->request_status == 2){
            return redirect()->route('modempay-success');
        }else{
            return redirect()->route('modempay-fail');
        }
        
    }
    
    public function Success(Request $request){
        \Log::channel('modempay_api')->emergency(['success_url'=>$request->all()]);
        echo '<h2>Success</h2>';
    }
    public function Fail(Request $request){
        \Log::channel('modempay_api')->emergency(['fail_url'=>$request->all()]);
        echo '<h2>Fail</h2>';
    }
    
    
    public function webhook(Request $request)
    {
        $merchant_id = $request->merchant_id;
        $payload = $request->getContent();
        $xSignatureHeader = $request->header('x-modem-signature');
        \Log::channel('modempay_api')->emergency(['webhook_url'=>$payload,'signature'=> $xSignatureHeader,'merchant_id'=>$merchant_id]);
        $payment_option = $this->getModemPayConfig($merchant_id);
        $secretKey = $payment_option->api_secret_key;
        $webhookSecret = $payment_option->auth_token;
        
        config([
            'modempay.api_key' => $secretKey,
            'modempay.webhook_secret' => $webhookSecret,
        ]);
            
        $event = ModemPay::webhooks()->composeEventDetails(
            $payload,
            $xSignatureHeader,
            $secretKey
        );
        
        try {
            if($event->event === \ModemPay\Types\EventType::CHARGE_SUCCEEDED){
                $charge_id = $event->payload['id'] ?? null;
                $reference_id = $event->payload['transaction_reference'] ?? null;
                $payment_intent_id = $event->payload['payment_intent_id'] ?? null;
                \Log::channel('modempay_api')->emergency(['webhook_res_event_inside'=>$reference_id,'intent'=>$payment_intent_id]);
                
                if($payment_intent_id && $reference_id){
                    DB::table('transactions')
                    ->where(['checkout_id' => $payment_intent_id])
                    ->update(['request_status' => 2, 'reference_id'=>$reference_id,'payment_transaction' => json_encode($event), 'updated_at' => date('Y-m-d H:i:s'),'status_message'=> 'SUCCESS']);
                }else{
                    return response()->json(['message' => 'charge not found'], 400);
                }
            }
            return response('', 200); // success
        } catch (\Exception $e) {
            \Log::channel('modempay_api')->emergency(['error' => $e->getMessage()]);
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}