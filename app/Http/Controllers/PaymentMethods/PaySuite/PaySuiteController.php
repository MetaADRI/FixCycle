<?php

namespace App\Http\Controllers\PaymentMethods\PaySuite;

use App\Http\Controllers\Controller;
use App\Models\DriverCard;
use App\Models\PaymentOption;
use App\Models\PaymentOptionsConfiguration;
use App\Models\UserCard;
use App\Traits\ApiResponseTrait;
use App\Traits\MerchantTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class PaySuiteController extends Controller
{
    use ApiResponseTrait, MerchantTrait;
    
    public function getPaySuiteConfig($merchant_id){
        $payment_option = PaymentOption::where('slug', 'PAYSUITE')->first();
        $paymentOption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id],['payment_option_id','=',$payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }
    
    public function generateUrl($request, $payment_option_config, $calling_from){
        try{
            $pvtKey = $payment_option_config->auth_token;
             $purpose = $payment_option_config->description;
            if($calling_from == "DRIVER") {
                $user = $request->user('api-driver');
                $currency = $user->Country->isoCode;
                $id = $user->id;
                $merchant_id = $user->merchant_id;
                $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
            }
            else{
                $user = $request->user('api');
                $currency = $user->Country->isoCode;
                $id = $user->id;
                $merchant_id = $user->merchant_id;
                $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
            }
            
            $payment_option = $this->getPaySuiteConfig($merchant_id);
            $transaction_id = 'TRANS_'.$id.'_'.time();
            $tax_ref = 'TAXREFERENCE'.time();
            $amount = $request->amount;
            
            $data = [
                "currency"=>"MZN",
                "callback_url"=> route('paysuite-callback'),
                "tx_ref"=>$tax_ref,
                "is_test"=>0,
                "amount"=> $amount,
                "purpose"=>$purpose,
                "redirect_url"=>route('paysuite-redirect')
            ];
            
            $curl = curl_init();

            curl_setopt_array($curl, array(
                CURLOPT_URL =>'https://paysuite.co.mz/api/v1/payments',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 0,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'POST',
                CURLOPT_POSTFIELDS => json_encode($data),
                CURLOPT_HTTPHEADER => array(
                    'Authorization: Bearer '.$pvtKey,
                    'Content-Type: application/json',
                    'Accept: application/json',
                ),
            ));
            
            
            $response = json_decode(curl_exec($curl));
            // dd('https://paysuite.co.mz/api/v1/payments',$data,$response);
            curl_close($curl);
            if(isset($response->checkout_url) && isset($response->status) && $response->status == "success"){
                DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id'=> $transaction_id,
                    'reference_id'=> $tax_ref,
                    'amount' => $amount,
                    'payment_option_id' => $payment_option->payment_option_id,
                    'request_status'=> 1,
                    'reference_id'=> $tax_ref,
                    'status_message'=> 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
            }else{
                throw new \Exception($response->message);
            }
            
            
        }
        
        catch(\Exception $e) {
            DB::rollBack();
            throw new \Exception($e->getMessage());
        }
        
         return [
            'status' => 'NEED_TO_OPEN_WEBVIEW',
            'url' => $response->checkout_url ? str_replace("http://", "https://", $response->checkout_url) : '',
            'transaction_id'=> $tax_ref,
            'success_url' => route('paysuite-success'),
            'fail_url' => route('paysuite-fail')
        ];
    }
    public function callbackUrl(Request $request){
       \Log::channel('pay_suite')->emergency(['callback'=> $request->all(),'callback'=>'callback']);
       $data = $request->all();
    //   dd($data);
        $taxRef = $data['tx_ref'];
       if(isset($taxRef) && isset($data['status']) && $data['status'] == "success" ){
            DB::table('transactions')->where('reference_id', $taxRef)->update([
                'request_status' => 2,
                'status_message' => 'SUCCESS',
                'payment_transaction'=> json_encode($data)
            ]);
       }else{
           DB::table('transactions')->where('reference_id', $taxRef)->update([
                'request_status' => 3,
                'status_message' => 'FAIL',
                'payment_transaction'=> json_encode($data)
            ]);
       }
    }
    
     public function callbackUrlPaysuiteTech(Request $request){
         $data = $request->all();
         $payload = file_get_contents('php://input');
        \Log::channel('pay_suite')->emergency(['callback_res'=> $data,'callback'=>'callback','payload'=> $payload]);
        $taxRef = isset($data['data']['reference']) ? $data['data']['reference'] : "";
        if(isset($taxRef) && isset($data['event']) && $data['event'] == "payment.success" ){
                DB::table('transactions')->where('reference_id', $taxRef)->update([
                    'request_status' => 2,
                    'status_message' => 'SUCCESS',
                    'payment_transaction'=> json_encode($data)
                ]);
        }else{
            DB::table('transactions')->where('reference_id', $taxRef)->update([
                    'request_status' => 3,
                    'status_message' => 'FAIL',
                    'payment_transaction'=> json_encode($data)
                ]);
                
        }
       
       echo 'Return Url';
    }
    
     public function Redirect(Request $request){
       $data = $request->all();
       \Log::channel('pay_suite')->emergency(['redirect'=> $data]);
       return redirect()->route('paysuite-redirecturl');
    //   if(isset($data['status']) && $data['status'] == "success"){
    //       return redirect()->route('paysuite-success');
    //   }else{
    //       return redirect()->route('paysuite-fail');
    //   }
    }
    
    public function Success(Request $request){
         \Log::channel('pay_suite')->emergency(['success'=>$request->all()]);
         echo "<h1>Success</h1>";
    }
    
    public function Fail(Request $request){
         \Log::channel('pay_suite')->emergency(['fail'=>$request->all()]);
         echo "<h1>Failed</h1>";
    }
    
    public function RedirectUrl(){
        echo "<h1>Redirecting</h1>";
    }
    
    public function getPaySuiteTechConfig($merchant_id){
        $payment_option = PaymentOption::where('slug', 'PAYSUITE_TECH')->first();
        $paymentOption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id],['payment_option_id','=',$payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }

    public function generateCheckoutUrl($request, $payment_option_config, $calling_from){
        try{
            $pvtKey = $payment_option_config->auth_token;
             $purpose = $payment_option_config->description;
            if($calling_from == "DRIVER") {
                $user = $request->user('api-driver');
                $currency = $user->Country->isoCode;
                $id = $user->id;
                $merchant_id = $user->merchant_id;
                $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
            }
            else{
                $user = $request->user('api');
                $currency = $user->Country->isoCode;
                $id = $user->id;
                $merchant_id = $user->merchant_id;
                $lang = isset($user->Country->default_language) ? $user->Country->default_language : 'en';
            }
            
            $payment_option = $this->getPaySuiteTechConfig($merchant_id);
            $transaction_id = 'TRANS_'.$id.'_'.time();
            $tax_ref = 'TAXREF'.time();
            $amount = $request->amount;
            
            $data = [
                "callback_url"=> route('paysuitetech-callback',['merchant_id'=> $merchant_id]),
                "reference"=>$tax_ref,
                "amount"=> $amount,
                "description"=>$purpose,
                "return_url"=>route('paysuite-redirect')
            ];
            
            $curl = curl_init();

            curl_setopt_array($curl, array(
                CURLOPT_URL =>'https://paysuite.tech/api/v1/payments',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 0,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'POST',
                CURLOPT_POSTFIELDS => json_encode($data),
                CURLOPT_HTTPHEADER => array(
                    'Authorization: Bearer '.$pvtKey,
                    'Content-Type: application/json',
                    'Accept: application/json',
                ),
            ));
            
            
            $response = json_decode(curl_exec($curl));
             \Log::channel('pay_suite')->emergency(['payment_url_response'=>$response,'request'=>$data]);
            curl_close($curl);
            if(isset($response->data->checkout_url) && $response->status == "success"){
                DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id'=> $transaction_id,
                    'reference_id'=> $tax_ref,
                    'amount' => $amount,
                    'payment_option_id' => $payment_option->payment_option_id,
                    'request_status'=> 1,
                    'status_message'=> 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
            }else{
                throw new \Exception($response->message);
            }
            
            
        }
        
        catch(\Exception $e) {
            DB::rollBack();
            throw new \Exception($e->getMessage());
        }
        
         return [
            'status' => 'NEED_TO_OPEN_WEBVIEW',
            'url' => $response->data->checkout_url ? $response->data->checkout_url : '',
            'transaction_id'=> $tax_ref,
            'success_url' => route('paysuite-success'),
            'fail_url' => route('paysuite-fail'),
            'redirect_url'=> route('paysuite-redirecturl')
        ];
    }
    
    
     public function paymentStatus($request, $payment_option_config, $calling_from){
        $string_file = $this->getStringFile($request->merchant_id);
        $transactionId = $request->transaction_id; 
        $transaction_table =  DB::table("transactions")->where('reference_id', $transactionId)->first();
        $payment_status =   $transaction_table->request_status == 2 ?  true : false;
        if($transaction_table->request_status == 1)
        {
            $request_status_text = "processing";
            $transaction_status = 1;
        }
        else if($transaction_table->request_status == 2)
        {
            $request_status_text = "success";
            $transaction_status = 2;
        }
        else
        {
            $request_status_text = "failed";
            $transaction_status = 3;
        }
        return ['payment_status' => $payment_status, 'request_status' => $request_status_text,'transaction_status' => $transaction_status];
    }
    
}