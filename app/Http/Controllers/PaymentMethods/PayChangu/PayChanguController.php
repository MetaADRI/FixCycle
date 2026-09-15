<?php

namespace App\Http\Controllers\PaymentMethods\PayChangu;

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

class PayChanguController extends Controller
{
    use ApiResponseTrait, MerchantTrait;
    public function getPayChanguConfig($merchant_id){
        $payment_option = PaymentOption::where('slug', 'PAYCHANGU')->first();
        $paymentOption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id],['payment_option_id','=',$payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }

    public function generateUrl($request, $payment_option_config, $calling_from)
    {
        try{
            $secretKey = $payment_option_config->api_secret_key;

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

            $gatewayUrl = 'https://api.paychangu.com/payment';

            $payment_option = $this->getPayChanguConfig($merchant_id);
            $reference = 'REFERENCE_MERCHANT_'.time();
            $amount = $request->amount;
            $currency = $request->currency;
            $data = [
                'currency'=>$currency,
                'amount'=>$amount,
                'callback_url'=> route('paychangu-redirect'),
                'return_url'=> route('paychangu-return'),
                'tx_ref'=> $reference,
                "customization"=> [
                    "title"=>$user->Merchant->BusinessName . " Payment",
                    "description"=> $user->Merchant->BusinessName . " Payment"
                ]
            ];

            $curl = curl_init();

            curl_setopt_array($curl, array(
                CURLOPT_URL => $gatewayUrl,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 0,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'POST',
                CURLOPT_POSTFIELDS => json_encode($data),
                CURLOPT_HTTPHEADER => array(
                    'Authorization: Bearer '.$secretKey,
                    'Content-Type: application/json',
                    'Accept: application/json',
                ),
            ));
            
            
            $response = json_decode(curl_exec($curl));
            curl_close($curl);
            \Log::channel('paychangu')->emergency(['response' => $response]);
            if(!empty($response->status) && $response->status == 'success'){
                DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id'=> $reference,
                    'amount' => $amount,
                    'payment_option_id' => $payment_option->payment_option_id,
                    'request_status'=> 1,
                    'reference_id'=> 'REF_'.time(),
                    'status_message'=> 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);

            }else{
                throw new \Exception($response->message);
            }

            return [
                'status' => 'NEED_TO_OPEN_WEBVIEW',
                'url' => $response->data->checkout_url ?? '',
                'transaction_id' => $reference ?? '',
                'success_url' => route('paychangu-success'),
                'fail_url' => route('paychangu-fail'),
            ];
        }catch(\Exception $e) {
            DB::rollBack();
            throw new \Exception($e->getMessage());
        }
    }

    public function Success(Request $request)
    {
        \Log::channel('paychangu')->emergency($request->all());
        echo "<h1>Success</h1>";
    }

    public function Fail(Request $request)
    {
        \Log::channel('paychangu')->emergency($request->all());
        echo "<h1>Failed</h1>";
    }

    public function Redirect(Request $request)
    {
        \Log::channel('paychangu')->emergency(['success_response'=>$request->all()]);
        $transaction_id = $request['tx_ref'];
        
            DB::table('transactions')->where('payment_transaction_id', $transaction_id)->update([
                'request_status' => 2,
                'status_message' => 'SUCCESS',
                'payment_transaction' => json_encode($request->all()), 'updated_at' => date('Y-m-d H:i:s'),
            ]);
            return redirect()->route('paychangu-success');
    }
    public function Return(Request $request)
    {
        \Log::channel('paychangu')->emergency(['fail_response'=>$request->all()]);
        $transaction_id = $request['tx_ref'];
        if(isset($request) && isset($request['status']) && $request['status'] == 'failed'){
            DB::table('transactions')->where('payment_transaction_id', $transaction_id)->update([
                'request_status' => 3,
                'status_message' => 'FAIL',
                'payment_transaction' => json_encode($request->all()), 'updated_at' => date('Y-m-d H:i:s'),
            ]);
            return redirect()->route('paychangu-fail');
        }
    }
}