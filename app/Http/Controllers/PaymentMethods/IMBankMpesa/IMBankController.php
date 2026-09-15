<?php

namespace App\Http\Controllers\PaymentMethods\IMBankMpesa;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Helper\WalletTransaction;
use App\Models\Booking;
use App\Models\Order;
use App\Models\HandymanOrder;
use App\Models\Onesignal;
use App\Models\PaymentOption;
use App\Models\PaymentOptionsConfiguration;
use App\Traits\ApiResponseTrait;
use App\Traits\MerchantTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class IMBankController extends Controller
{
    use ApiResponseTrait, MerchantTrait;
    public function getImBankConfig($merchant_id){
        $payment_option = PaymentOption::where('slug', 'IMBANK_MPESA')->first();
        $paymentOption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id],['payment_option_id','=',$payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }
    
    public function generateForm($request,$payment_option_config, $calling_from){
            $status = 3;
            if($calling_from == "DRIVER") {
                $user = $request->user('api-driver');
                $countryCode = $user->country->country_code;
                $currency = $user->country->isoCode;
                $id = $user->id;
                $status = 2;
                $merchant_id = $user->merchant_id;
                $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
            }
            else{
                $user = $request->user('api');
                $countryCode = $user->country->country_code;
                $currency = $user->country->isoCode;
                $id = $user->id;
                $status = 1;
                $merchant_id = $user->merchant_id;
                $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
            }
            
            $customer_token = "";
            $card_number="";
            
            $payment_option = $this->getImBankConfig($merchant_id);
            $transaction_id = 'TRANS'.$id.'_'.time();
            $reference = 'REF_MERCHANT_'.time();
            $applicationId = $payment_option_config->api_public_key;
            $currency = $request->currency;
            $amount = $request->amount;
            $expiry = $request->expiry; //102029
            if($request->is_selected == "true"){
                $customer_token = base64_encode($request->customer_token);
                $card_number = base64_encode($request->card_number);
            } 
            
            $string_file = $this->getStringFile($merchant_id);
            
            DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'status' => $status,
                    'booking_id' => $request->booking_id,
                    'order_id' => $request->order_id,
                    'handyman_order_id' => $request->handyman_order_id,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id'=> $transaction_id,
                    'amount' => $request->amount,
                    'payment_option_id' => $payment_option->payment_option_id,
                    'reference_id'=> $reference,
                    'request_status'=> 1,
                    'status_message'=> 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
            
            $data = [
                'status' => 'NEED_TO_OPEN_WEBVIEW',
                'url' => route('imbank-webview',['reference'=>$reference,'application_id'=>$applicationId,'currency'=>$currency,'amount'=>$amount,'merchant_id'=> $merchant_id,'customer_token'=> $customer_token,'card_number'=>$card_number]),
                'transaction_id' => $reference,
                'success_url' => route('imbank-success'),
                'fail_url' => route('imbank-fail'),
            ];
            
            return $data;
    }
    
    public function IMBankReturn(Request $request,$id){
        $data = $request->all();
        \Log::channel('imbank_pay')->emergency(['return_response'=>$request->all()]);
        
        $payment_option = $this->getImBankConfig($id);
        $mer_ref = $data['MERCHANTREFERENCE'];
        $trans = DB::table('transactions')->where(['reference_id' => $mer_ref])->first();
        
        if($data && isset($data['LITE_PAYMENT_CARD_STATUS']) && $data['LITE_PAYMENT_CARD_STATUS'] == 0){
        DB::table('transactions')
            ->where(['reference_id' => $mer_ref])
            ->update(['request_status' => 2, 'payment_transaction' => json_encode($data), 'updated_at' => date('Y-m-d H:i:s'),'status_message'=> 'SUCCESS']);
            
            if(!empty($trans->user_id) && $data['LITE_TRANSACTIONINDEX'] && $data['ECOM_PAYMENT_CARD_NUMBER']){
                $user = \App\Models\User::find($trans->user_id);
                \App\Models\UserCard::updateOrCreate([
                        'user_id' => $user->id,
                        'card_number' => $data['ECOM_PAYMENT_CARD_NUMBER']
                    ],
                    [
                        'payment_option_id' => $trans->payment_option_id,
                        'token'=> $data['LITE_TRANSACTIONINDEX'],
                        'card_type'         => null,
                        'exp_month'         => null,
                        'exp_year'          => null,
                    ]);
            }
            return redirect(route('imbank-success'));
                
        }else{
            DB::table('transactions')
                    ->where(['reference_id' => $mer_ref])
                    ->update(['request_status' => 3, 'payment_transaction' =>json_encode($data), 'updated_at' => date('Y-m-d H:i:s'),'status_message'=> 'FAIL']);
                    
            return redirect(route('imbank-fail'));
        }
    }
    
    public function webview(Request $request,$reference,$applicationId,$currency,$amount,$merchantId){
        $customerToken = $request->customer_token;
        $card_number = $request->card_number;
        
        return view('payment.imbank.imbank',['reference'=>$reference,'application_id'=>$applicationId,'currency'=>$currency,'amount'=>$amount,'merchantId'=>$merchantId,'customer_token'=> $customerToken,'card_number'=>$card_number]);
    }
    
    public function PaymentStatus($request,$payment_option_config){
        $transactionId = $request->transaction_id; 
        $transaction_table =  DB::table("transactions")->where('reference_id', $transactionId)->first();
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
    
    public function Success(Request $request)
    {
        \Log::channel('imbank_pay')->emergency($request->all());
        echo "<h1>Success</h1>";
    }

    public function Fail(Request $request)
    {
        \Log::channel('imbank_pay')->emergency($request->all());
        echo "<h1>Failed</h1>";
    }
    
    public function createCharge(Request $request){
        $validator = Validator::make($request->all(), [
            'payment_option_id' => 'required',
            'calling_from'=>'required',
            'customer_token' => 'required',
            'card_number'=>'required',
            'is_selected'=>'required', //true when old card is selected,
            'currency'=> 'required',
            'amount'=>'required'
        ]);
        if ($validator->fails()) {
            $errors = $validator->messages()->all();
            return $this->failedResponse($errors[0]);
        }
        $calling_from = $request->calling_from;
        $merchant_id = $request->merchant_id;
        $payment_option_config = $this->getImBankConfig($merchant_id);
        $response = $this->generateForm($request,$payment_option_config,$calling_from,'CHARGE_API');
        $transId = "";
        if($response['transaction_id'] && $response['url']){
            return $this->successResponse($response);
        }else{
            return $this->failedResponse('Transaction Not Genrated');
        }
        
    }
}