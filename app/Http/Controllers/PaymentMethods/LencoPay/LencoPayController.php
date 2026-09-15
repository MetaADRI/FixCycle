<?php

namespace App\Http\Controllers\PaymentMethods\LencoPay;

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

class LencoPayController extends Controller
{
    use ApiResponseTrait,MerchantTrait;
    
    
    public function getLencoPayConfig($merchant_id){
        $payment_option = PaymentOption::where('slug', 'LENCOPAY')->first();
        $paymentOption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id],['payment_option_id','=',$payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }
    
    public function paymentInitiate($request, $payment_option_config, $calling_from){
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
            
            $payment_option = $this->getLencoPayConfig($merchant_id);
            $reference = 'REF_MERCHANT_'.time();
            $public_key = $payment_option_config->api_public_key;
            $secret_key = $payment_option_config->api_secret_key;
            $amount = $request->amount;
            $currency = $request->currency;
            $js_url = $payment_option_config->gateway_condition == 1 ? 'https://pay.lenco.co/js/v1/inline.js' : 'https://pay.sandbox.lenco.co/js/v1/inline.js';
            $data = [
                'public_key' => $public_key,
                'js_url'  => $js_url,
                'currency'    => $currency,
                'amount'      => $amount,
                'email'       => $email ?? 'test@gmail.com',
                'reference' => $reference,
                'first_name'=> $first_name,
                'last_name'=> $last_name,
                'phone'=> $phone ?? '012345779',
                'success_url'=> route('lencopay-success'),
                'fail_url'=> route('lencopay-fail'),
            ];
            
            DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'status' => $status,
                    'booking_id' => $request->booking_id,
                    'order_id' => $request->order_id,
                    'handyman_order_id' => $request->handyman_order_id,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id'=> $reference,
                    'amount' => $amount,
                    'payment_option_id' => $payment_option->payment_option_id,
                    'reference_id'=> $reference,
                    'request_status'=> 1,
                    'status_message'=> 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
            
            $data = [
                'status' => 'NEED_TO_OPEN_WEBVIEW',
                'url' => route('lencopay-webview',['data' => $data,'url'=> $js_url]),
                'transaction_id' => $reference,
                'success_url' => route('lencopay-success'),
                'fail_url' => route('lencopay-fail'),
            ];
            
            return $data;
    }
    
    public function webView(Request $request){
        $data = $request->data;
        $url = $request->url;
        return view('payment.lencopay.lencopay',['url' => $url,'data' => $data]);
    }
    
    public function Success(Request $request){
        \Log::channel('lenco_pay')->emergency(['success_url'=>$request->all()]);
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
        \Log::channel('lenco_pay')->emergency(['success_url'=>$request->all()]);
        $data = $request->all();
        if(isset($data['reference'])){
            $transaction_id = $data['reference'];
            DB::table('transactions')
                ->where(['payment_transaction_id' => $transaction_id])
                ->update(['request_status' => 3, 'payment_transaction' => json_encode($data), 'updated_at' => date('Y-m-d H:i:s'),'status_message'=> 'FAIL']);
        }
        echo '<h3>Fail</h3>';
    }
}