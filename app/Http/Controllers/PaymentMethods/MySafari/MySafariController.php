<?php

namespace App\Http\Controllers\PaymentMethods\MySafari;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use DB;
use App\Models\Transaction;
use App\Models\PaymentOption;
use App\Models\PaymentOptionsConfiguration;
use App\Traits\ApiResponseTrait;
use App\Traits\MerchantTrait;

class MySafariController extends Controller
{
    use ApiResponseTrait, MerchantTrait;
    public function getBaseUrl($env){
        return $env == 1 ? 'https://mysafari.co.tz/' : 'https://sandbox.mysafari.co.tz/';
    }
    
    public function getMySafariConfig($merchant_id){
        $payment_option = PaymentOption::where('slug', 'MYSAFARI')->first();
        $paymentOption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id],['payment_option_id','=',$payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }
    
    
    public function MySafariChannels(Request $request)
    {

        if($request->calling_from == 'DRIVER'){
            $user = $request->user('api-driver');
        }
        else{
        $user = $request->user('api');
        }
        $merchant_id = $user->merchant_id;
        $string_file = $this->getStringFile($user->merchant_id);
        $paymentConfig = $this->getMySafariConfig($merchant_id);
       
        $baseUrl = $this->getBaseUrl($paymentConfig->gateway_condition);
        
        $curl = curl_init();

        curl_setopt_array($curl, [
            CURLOPT_URL => "https://mysafari.co.tz/api/partner/get-payment-partners",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CUSTOMREQUEST => "GET",
        ]);

        $response = curl_exec($curl);
        $err = curl_error($curl);

        curl_close($curl);

        if ($err) {
            return response()->json([
                'status' => false,
                'message' => $err
            ]);
        }

        $responseData = json_decode($response, true);
        if($responseData){
        return $this->successResponse(trans("$string_file.success"), $responseData);
        }
        else{
              return $this->failedResponse('List not Found');
        }

        // return response()->json([
        //     'status' => true,
        //     'data' => $responseData
        // ]);
    }


  public function makePaymentUsingMySafari($request, $paymentConfig, $calling_from)
{
    
            $request->validate([
                'payment_channel' => 'required',
                'phone_number' => 'required'
            ]);
            $status = 3;
            if ($calling_from == "DRIVER") {
                $driver = $request->user('api-driver');
                $id = $driver->id;
                $merchant_id = $driver->merchant_id;
                $status = 2;
            } elseif($calling_from == "USER") {
                $user = $request->user('api');
                $id = $user->id;
                $merchant_id = $user->merchant_id;
                $status = 1;
            }
             $transactionId = "trans" . $id . '' . time();
    $data = [
        "payment_channel" => $request->payment_channel,
        "phone_number" => $request->phone_number,
        "payment_reference" => $transactionId, //backend
        "amount" => $request->amount,
        "callback_url" => $paymentConfig->callback_url,
    ];
 
  
    
    


    $curl = curl_init();

    curl_setopt_array($curl, [
        CURLOPT_URL => 'https://mysafari.co.tz/api/paymentGw/pushPayment',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json'
        ],
    ]);

    $response = json_decode(curl_exec($curl),true);
   

    curl_close($curl);
            if(isset($response['statusCode']) && $response['statusCode'] == 200) {
              
                $calling_for = $request->calling_for == 'BOOKING' ? 3 : ($request->type == "USER" ? 1 : 2);
                DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'status' => $calling_for,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id'=> $transactionId,
                    'amount' => $request->amount,
                    'payment_option_id' => $paymentConfig->payment_option_id,
                    'request_status'=> 1,
                    'status_message'=> 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
                return [
        
                    'transaction_id' => $transactionId ?? '',
                    'success_url' => route('mysafari-success'),
                    'fail_url' => route('mysafari-fail'),
                ];
                
               
}
    
                return [
        
                    'result' => 0,
                    'response' => 'transaction not done'
                 
                ];

}


    public function MySafariCallBack(Request $request){
        \Log::channel('mysafari_pay')->emergency(['callback_url'=>$request->all()]);
        $data = $request->all();
        // dd($data);
        // if(isset($data['status']) && $data['status'] == "success" && isset($data['data']) && isset($data['data']['state']) && $data['data']['state'] == "successful"){
        //     $transId = $data['data']['trxRef'];
        //     DB::table('transactions')
        //         ->where(['payment_transaction_id' => $transId])
        //         ->update(['request_status' => 2, 'payment_transaction' => json_encode($data), 'updated_at' => date('Y-m-d H:i:s'),'status_message'=> 'SUCCESS']);

        // }elseif(isset($data['status']) && $data['status'] == "fail"){
        //     $transId = $data['data']['trxRef'];
        //     DB::table('transactions')
        //         ->where(['payment_transaction_id' => $transId])
        //         ->update(['request_status' => 3, 'payment_transaction' => json_encode($data), 'updated_at' => date('Y-m-d H:i:s'),'status_message'=> 'FAIL']);
        // }
    }

    public function mysafariPaysuccess(Request $request){
        \Log::channel('mysafari_pay')->emergency(['success_url'=>$request->all()]);
        echo '<h3>Success</h3>';
    }

    public function mysafariPayFail(Request $request){
        \Log::channel('mysafari_pay')->emergency(['fail_url'=>$request->all()]);
        echo '<h3>Failed</h3>';
    }
    
    public function PaymentStatus(Request $request){
        $transactionId = $request->transaction_id; 
        $transaction_table =  DB::table("transactions")->where('payment_transaction_id', $transactionId)->first();
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