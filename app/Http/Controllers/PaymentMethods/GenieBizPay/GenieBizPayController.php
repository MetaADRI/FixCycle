<?php

namespace App\Http\Controllers\PaymentMethods\GenieBizPay;

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

class GenieBizPayController extends Controller
{
    use ApiResponseTrait, MerchantTrait;
    public function getGenieBusinessConfig($merchant_id){
        $payment_option = PaymentOption::where('slug', 'GENIE_BUSINESS_PAY')->first();
        $paymentOption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id],['payment_option_id','=',$payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }

    public function initiateTransaction($request, $payment_option_config, $calling_from,$action=NULL){
        try{
            $appKey = $payment_option_config->api_public_key;
            if($calling_from == "DRIVER") {
                $user = $request->user('api-driver');
                // $currency = $user->Country->isoCode;
                $id = $user->id;
                $merchant_id = $user->merchant_id;
                $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
            }
            else{
                $user = $request->user('api');
                // $currency = $user->Country->isoCode;
                $id = $user->id;
                $merchant_id = $user->merchant_id;
                $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
            }

            $gatewayUrl = $payment_option_config->gateway_condition == 1 ? 'https://api.geniebiz.lk/' : 'https://api.uat.geniebiz.lk/';

            $payment_option = $this->getGenieBusinessConfig($merchant_id);
            $reference = 'REFERENCE_MERCHANT_'.time();
            $amount = $request->amount; // last two digit taken as cents by payment gateway so multiply by 100 told by pg
            $is_selected = $request->is_selected; //for selected card it should be true
            $currency = $request->currency;
            $data = [
                'currency'=>$currency,
                'amount'=>$amount * 100,
                'redirectUrl'=> route('geniebiz-redirect',['ref_id'=>$reference]),
                "tokenizationDetails"=>[
                    "tokenize"=>$is_selected == "false" ? true : false,
                    "paymentType"=>"UNSCHEDULED", 
                    "recurringFrequency"=>"UNSCHEDULED"
                ],
                "customerId"=>$request->customer_id,
                "webhook"=>route('geniebiz-webhook',['ref_id'=>$reference,'merchant_id'=>$merchant_id])
            ];
            $curl = curl_init();

            curl_setopt_array($curl, array(
                CURLOPT_URL => $gatewayUrl . 'public/v2/transactions',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 0,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'POST',
                CURLOPT_POSTFIELDS => json_encode($data),
                CURLOPT_HTTPHEADER => array(
                    'Authorization: '.$appKey,
                    'Content-Type: application/json',
                    'Accept: application/json',
                ),
            ));
            
            
            $response = json_decode(curl_exec($curl));
            curl_close($curl);
            \Log::channel('genie_biz')->emergency(['response' => $response]);
            if(!empty($response->state) && $response->state = 'INITIATED'){
                $trans_id = $response->id;
                DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id'=> $trans_id,
                    'amount' => $amount,
                    'payment_option_id' => $payment_option->payment_option_id,
                    'request_status'=> 1,
                    'reference_id'=> $reference,
                    'status_message'=> 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);

            }else{
                throw new \Exception($response->message);
            }
            
            if($action == 'CHARGE_API'){
                return ['transaction_id' => $response->id ?? ''];
            }
            return [
                'status' => 'NEED_TO_OPEN_WEBVIEW',
                'url' => $response->url ?? '',
                'transaction_id' => $response->id ?? '',
                'success_url' => route('geniebiz-success'),
                'fail_url' => route('geniebiz-fail'),
            ];
        }catch(\Exception $e) {
            DB::rollBack();
            throw new \Exception($e->getMessage());
        }
    }
    
    public function Webhook(Request $request){
        \Log::channel('genie_biz')->emergency(['webhook_request'=>$request->all()]);
        $data = $request->all();
        $transactionId = $data['transactionId'];
        $customerId = $data['customerId'];
        $cardNumber = $data['paddedCardNumber'];
        $merchant_id = $data['merchant_id'];
        $payment_option = $this->getGenieBusinessConfig($merchant_id);
        $appKey = $payment_option->api_public_key;
        $gatewayUrl = $payment_option->gateway_condition == 1 ? 'https://api.geniebiz.lk/' : 'https://api.uat.geniebiz.lk/';
        $trans = DB::table('transactions')->where('payment_transaction_id', $transactionId)->first();
        \Log::channel('genie_biz')->emergency(['webhook_request_trans'=>$trans]);
        if($data['state'] == 'CONFIRMED'){
            \Log::channel('genie_biz')->emergency(['webhook_request_trans_after'=>!empty($trans->user_id),'user_id'=> $trans->user_id,'card_number'=>$cardNumber]);
            if(!empty($trans->user_id)){
                $user = \App\Models\User::find($trans->user_id);
                \App\Models\UserCard::updateOrCreate([
                        'user_id' => $user->id,
                        'card_number'       => $cardNumber
                    ],
                    [
                        'payment_option_id' => $trans->payment_option_id,
                        'card_id'=> $customerId,
                        'card_type'         => null,
                        'exp_month'         => null,
                        'exp_year'          => null,
                    ]);
            }elseif(!empty($trans->driver_id)){
                $driver = \App\Models\Driver::find($trans->driver_id);
                \App\Models\DriverCard::updateOrCreate([
                        'driver_id' => $driver->id,
                        'card_number' => $cardNumber
                    ],
                    [
                        'payment_option_id' => $trans->payment_option_id,
                        'card_id'=> $customerId,
                        'card_type' => NULL,
                        'exp_month' => NULL,
                        'exp_year' => NULL
                    ]);
            }
            
            $token = $this->getToken($merchant_id,"","WEBHOOK",$customerId,$cardNumber,$trans->user_id,$trans->driver_id);
                
        }
    }


    public function Success(Request $request)
    {
        \Log::channel('genie_biz')->emergency($request->all());
        echo "<h1>Success</h1>";
    }

    public function Fail(Request $request)
    {
        \Log::channel('genie_biz')->emergency($request->all());
        echo "<h1>Failed</h1>";
    }

    public function Redirect(Request $request)
    {
        \Log::channel('genie_biz')->emergency(['redirect_response'=>$request->all()]);
        $transaction_id = $request['transactionId'];
        if(isset($request) && isset($request['state']) && $request['state'] == 'CONFIRMED'){
            DB::table('transactions')->where('payment_transaction_id', $transaction_id)->update([
                'request_status' => 2,
                'status_message' => 'SUCCESS',
                'payment_transaction' => json_encode($request->all()), 'updated_at' => date('Y-m-d H:i:s'),
            ]);
            return redirect()->route('geniebiz-success');
        }else{
            DB::table('transactions')->where('payment_transaction_id', $transaction_id)->update([
                'request_status' => 3,
                'status_message' => 'FAIL',
                'payment_transaction' => json_encode($request->all()), 'updated_at' => date('Y-m-d H:i:s'),
            ]);
            return redirect()->route('geniebiz-fail');
        }
    }
    
    public function getToken($merchant_id,$cards,$action = NULL,$customerId = NULL,$cardNumber=NULL,$user_id,$driver_id)
    {
        if($action != "WEBHOOK"){
            $customerId = $cards->card_id;
            $cardNumber = $cards->card_number;
        }
        $payment_option = $this->getGenieBusinessConfig($merchant_id);
        $appKey = $payment_option->api_public_key;
        $gatewayUrl = $payment_option->gateway_condition == 1 ? 'https://api.geniebiz.lk/' : 'https://api.uat.geniebiz.lk/';
        $curl = curl_init();

            curl_setopt_array($curl, array(
                CURLOPT_URL => $gatewayUrl . 'public-customers/'.$customerId.'/tokens',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 0,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'GET',
                CURLOPT_HTTPHEADER => array(
                    'Authorization: '.$appKey,
                    'Content-Type: application/json',
                    'Accept: application/json',
                ),
            ));
            $response = json_decode(curl_exec($curl),true);
            curl_close($curl);
            $card = [];
            if(!empty($response['items'])){
                $card = collect($response['items'])->firstWhere('paddedCardNumber', $cardNumber);
                $tokenId = "";
                if ($card) {
                    $tokenId = $card['id'];
                }
                \Log::channel('genie_biz')->emergency(['webhook_request_token'=>$response,'cardNumber'=>$cardNumber,'token_id'=>$tokenId,'card'=>$card,'customer_response'=>$response['items']]);
                if(!empty($user_id) && $tokenId){
                  $userCard = \App\Models\UserCard::where('user_id',$user_id)->where('card_number',$cardNumber)->first();
                  $userCard->token = $tokenId;
                  $userCard->save();
                }elseif(!empty($driver_id) && $tokenId){
                    $driverCard = \App\Models\DriverCard::where('driver_id',$driver_id)->where('card_number',$cardNumber)->first();
                  $driverCard->token = $tokenId;
                  $driverCard->save();
                }
            }
            
            
            return $card;
    }
    
    public function createCharge(Request $request){
        $validator = Validator::make($request->all(), [
            'payment_option_id' => 'required',
            'calling_from'=>'required',
            'customer_id' => 'required',
            'token_id'=>'required',
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
        $payment_option_config = $this->getGenieBusinessConfig($merchant_id);
        $appKey = $payment_option_config->api_public_key;
        $response = $this->initiateTransaction($request,$payment_option_config,$calling_from,'CHARGE_API');
        $transId = "";
        if($response['transaction_id']){
            $transId = $response['transaction_id'];
        }else{
            return $this->failedResponse('Transaction Not Genrated');
        }
        
            $gatewayUrl = $payment_option_config->gateway_condition == 1 ? 'https://api.geniebiz.lk/' : 'https://api.uat.geniebiz.lk/';
            $data = [
                "customerId"=>$request->customer_id,
                "transactionId"=>$transId,
                "tokenId"=>$request->token_id
            ];
            $curl = curl_init();

            curl_setopt_array($curl, array(
                CURLOPT_URL => $gatewayUrl . 'public-customers/charge',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 0,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'POST',
                CURLOPT_POSTFIELDS => json_encode($data),
                CURLOPT_HTTPHEADER => array(
                    'Authorization: '.$appKey,
                    'Content-Type: application/json',
                    'Accept: application/json',
                ),
            ));
            
            
            $response = json_decode(curl_exec($curl));
            curl_close($curl);
            \Log::channel('genie_biz')->emergency(['charge_response' => $response]);
            if($response && $response->vendorUrl){
                return $this->successResponse("Payment Done",[
                    'status' => 'NEED_TO_OPEN_WEBVIEW',
                    'url' => $response->vendorUrl ?? '',
                    'transaction_id' => $transId ?? '',
                    'success_url' => route('geniebiz-success'),
                    'fail_url' => route('geniebiz-fail'),
                ]);
            }else{
                return $this->failedResponse('Payment Url Not Genrated');
            }
        
    }
}