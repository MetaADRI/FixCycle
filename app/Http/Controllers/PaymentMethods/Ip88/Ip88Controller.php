<?php

namespace App\Http\Controllers\PaymentMethods\Ip88;

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

class Ip88Controller extends Controller
{
    use ApiResponseTrait,MerchantTrait;
    
    public function getIp88Config($merchant_id){
        $payment_option = PaymentOption::where('slug', 'IP88_PAY')->first();
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
            
            $payment_option = $this->getIp88Config($merchant_id);
            $order_id = 'ORDER_'.$id.'_'.time();
            $reference = 'REF_MERCHANT_'.time();
            $merchantKey = $payment_option_config->api_public_key; //merchant key
            $merchantCode = $payment_option_config->api_secret_key; // merchant code
            $amount = (int)$request->amount;
            $currency = $request->currency;
            $url = $payment_option_config->gateway_condition == 1 ? 'https://payment.ipay88.com.ph/epayment/entry.asp' :'https://sandbox.ipay88.com.ph/epayment/entry.asp';
            $hashString =  $merchantKey . $merchantCode . $reference . $amount . $currency ;
            $hash = Hash('sha256',$hashString);
            $data = [
                'MerchantCode' => $merchantCode,
                'PaymentId'=>'',
                'BackendURL'  => route('ip88-backend',['merchant_id'=> $merchant_id,'transaction_id'=>$reference]),
                'ResponseURL'  => route('ip88-response',['merchant_id'=> $merchant_id,'transaction_id'=>$reference]),
                'RefNo'    => $reference,
                'Currency'    => $currency,
                'Amount'      => $amount,
                'UserName'  => $first_name.' '.$last_name,
                'UserEmail'       => $email,
                'UserContact'       => $phone ?? '012345678',
                'ProdDesc'     => 'Product Description',
                'SignatureType'=> 'SHA256',
                'Signature'=> $hash,
                'Remark'=>'',
                'Lang'=>''
            ];
            $all = ['data' => $data, 'url' => $url];
            $param = urlencode(base64_encode(json_encode($all)));
            $domain = request()->getHost();
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
                    'reference_id'=> $order_id,
                    'request_status'=> 1,
                    'status_message'=> 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
            
            $data = [
                'status' => 'NEED_TO_OPEN_WEBVIEW',
                'url' => route('ip88-webview',['param' => $param]),
                'transaction_id' => $reference,
                'success_url' => route('ip88-success'),
                'fail_url' => route('ip88-fail'),
                'deeplink_success' => $domain . '://Ip88/success',
                'deeplink_fail'    => $domain . '://Ip88/fail',
            ];
            
            return $data;
    }
    
    public function webView(Request $request){
        $alldata = json_decode(base64_decode(urldecode($request->param)),true);
        $baseUrl = $alldata['url'];
        $data = $alldata['data'];
        return view('payment.Ip88.ip88',['baseUrl' => $baseUrl,'data' => $data]);
    }
    
    public function responseUrl(Request $request){
        \Log::channel('ip88_api')->emergency(['reponse_url'=>$request->all()]);
        $data = $request->all();
        $payment_option = $this->getIp88Config($data['merchant_id']);
        $signature = $data['Signature'];
        $paymentId = $data['PaymentId'];
        $amount = $data['Amount'];
        $paymentId = $data['PaymentId'];
        $merchantKey = $payment_option->api_public_key;
        $merchantCode = $data['MerchantCode'];
        $reference = $data['RefNo'];
        $currency = $data['Currency'];
        $status = $data['Status'];
        $hashString =  $merchantKey . $merchantCode . $paymentId . $reference . $amount . $currency . $status;
        $hash = Hash('sha256',$hashString);
        \Log::channel('ip88_api')->emergency(['check_reponse'=> $hash === $signature,$hash,$signature]);
        $trans = DB::table('transactions')->where(['payment_transaction_id' => $reference])->first();
        if($trans->request_status == "2"){
            return redirect()->route('ip88-success');
        }else{
            if($status == "1"){
                DB::table('transactions')
                ->where(['payment_transaction_id' => $reference])
                ->update(['request_status' => 2, 'payment_transaction' => json_encode($data), 'updated_at' => date('Y-m-d H:i:s'),'status_message'=> 'SUCCESS']);
                
                return redirect()->route('ip88-success');
            }elseif($status == "0"){
                DB::table('transactions')
                ->where(['payment_transaction_id' => $reference])
                ->update(['request_status' => 3, 'payment_transaction' => json_encode($data), 'updated_at' => date('Y-m-d H:i:s'),'status_message'=> 'FAIL']);
            }
            return redirect()->route('ip88-fail');
        }
        echo 'Response Page';
        
    }
    
    public function backendUrl(Request $request){
        \Log::channel('ip88_api')->emergency(['backend_url'=>$request->all()]);
        $data = $request->all();
        $status = $data['Status'];
        $reference = $data['RefNo'];
       if($status == "1"){
            DB::table('transactions')
            ->where(['payment_transaction_id' => $reference])
            ->update(['request_status' => 2, 'payment_transaction' => json_encode($data), 'updated_at' => date('Y-m-d H:i:s'),'status_message'=> 'SUCCESS']);
        }elseif($status == "0"){
            DB::table('transactions')
            ->where(['payment_transaction_id' => $reference])
            ->update(['request_status' => 3, 'payment_transaction' => json_encode($data), 'updated_at' => date('Y-m-d H:i:s'),'status_message'=> 'FAIL']);
        }
        echo 'Backend Page';
    }
    
    public function Success(Request $request){
        \Log::channel('ip88_api')->emergency(['success_url'=>$request->all()]);
        echo '<h3>Success</h3>';
    }
    public function Fail(Request $request){
        \Log::channel('ip88_api')->emergency(['fail_url'=>$request->all()]);
        echo '<h3>Fail</h3>';
    }
    
}
