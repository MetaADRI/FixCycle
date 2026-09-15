<?php

namespace App\Http\Controllers\PaymentMethods\AddPay;

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

class AddPayController extends Controller
{
    use ApiResponseTrait, MerchantTrait;
    
    public function getAddPayConfig($merchant_id){
        $payment_option = PaymentOption::where('slug', 'ADD_PAY')->first();
        $paymentOption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id],['payment_option_id','=',$payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }

    public function getBaseUrl($env){
        return $env == 1 ? 'https://secure.addpay.co.za/' : 'https://secure-test.addpay.co.za/';
    }

    public function generatePaymentUrl($request, $payment_option_config, $calling_from)
    {
        try{
            $clientId = $payment_option_config->api_public_key;
            $clientSecret = $payment_option_config->api_secret_key;  

            if($calling_from == "DRIVER") {
                $user = $request->user('api-driver');
                $id = $user->id;
                $merchant_id = $user->merchant_id;
                $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
                $firstName = $user->first_name;
                $lastName = $user->last_name;
                $email = $user->email;
                $phone = $user->phoneNumber;
            }
            else{
                $user = $request->user('api');
                $id = $user->id;
                $merchant_id = $user->merchant_id;
                $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
                $firstName = $user->first_name;
                $lastName = $user->last_name;
                $email = $user->email;
                $phone = $user->UserPhone;
            }
            $baseUrl = $this->getBaseUrl($payment_option_config->gateway_condition);
            $trans_id = 'TRANS_'.time();
            $ref_id = 'REF_'.time();
            $amount = $request->amount;
            $currency = $request->currency;
            $bearerToken = base64_encode("$clientId:$clientSecret");
            
            $data = [
                "reference" => $trans_id,
                "description" =>$payment_option_config->Merchant->BusinessName .' Payment',
                "customer"=> [
                    "firstname"=> $firstName,
                    "lastname"=> $lastName,
                    "email"=> $email ?? 'test@gmail.com',
                    "mobile"=> str_replace('+','',$phone)
                ],
                "amount"=> [
                    "value"=> (float)$amount,
                    "currency_code" => $currency
                ],
                "return_url"=> route("addpay-redirect",['merchant_id'=>$merchant_id,'trans_id'=>$trans_id]),
                "notify_url"=> route("addpay-notify",['merchant_id'=>$merchant_id])
            ];

            $curl = curl_init();

            curl_setopt_array($curl, array(
                CURLOPT_URL => $baseUrl .'v2/transactions',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 0,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'POST',
                CURLOPT_POSTFIELDS => json_encode($data),
                CURLOPT_HTTPHEADER => array(
                    'Authorization: Bearer '.$bearerToken,
                    'Content-Type: application/json',
                    'Accept: application/json',
                ),
            ));
                
                
            $response = json_decode(curl_exec($curl),true);
            \Log::channel('addpay')->emergency(['response'=>$response,'request'=> $data]);
            curl_close($curl);
            if($response['meta'] && $response['meta']['status'] && $response['meta']['status'] == "success" && $response['data']){
                DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id'=> $trans_id,
                    'amount' => $amount,
                    'payment_option_id' => $payment_option_config->payment_option_id,
                    'request_status'=> 1,
                    'reference_id'=> $ref_id,
                    'status_message'=> 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
            }else{
                throw new \Exception($response['meta']['message']);
            }

        }catch(\Exception $e) {
            // DB::rollBack();
            throw new \Exception($e->getMessage());
        }

        // DB::commit();

        return [
            'status' => 'NEED_TO_OPEN_WEBVIEW',
            'url' => $response['data']['direct'] ?? '',
            'transaction_id' => $trans_id ?? '',
            'success_url' => route('addpay-success'),
            'fail_url' => route('addpay-fail'),
        ];
    }

    public function Redirect(Request $request)
    {
        \Log::channel('addpay')->emergency(['redirect'=>$request->all()]);
        if($request->trans_id){
            $transaction = DB::table('transactions')->where('payment_transaction_id',$request->trans_id)->first();
            if($transaction->request_status == 2 && $transaction->status_message == 'SUCCESS'){
                return redirect(route('addpay-success'));
            }
            else{
                return redirect(route('addpay-fail'));
            }
        }else{
            throw new \Exception('Reference not found');
        }
        
    }

    public function Success(Request $request)
    {
        \Log::channel('addpay')->emergency(['success'=>$request->all()]);
        echo "<h1>Success</h1>";
    }

    public function Fail(Request $request)
    {
        \Log::channel('addpay')->emergency(['fail'=>$request->all()]);
        echo "<h1>Failed</h1>";
    }

    public function Notify(Request $request)
    {
        \Log::channel('addpay')->emergency(['notify_url'=>$request->all()]);
        $data = $request->all();
        $status = $data['content']['status'];
        $transaction_id = $data['content']['reference'];
        if($status == "COMPLETE"){
            DB::table('transactions')->where('payment_transaction_id', $transaction_id)->update([
                'request_status' => $status == 'COMPLETE' ? 2 : ($status == 'FAILED' ? 3 : 4),
                'status_message' => $status == 'COMPLETE' ? 'SUCCESS' : "FAIL"
            ]);
        }
    }
}