<?php

namespace App\Http\Controllers\PaymentMethods\ClickPesa;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use DB;
use App\Models\Transaction;


class ClickPesaPaymentController extends Controller
{

    public function getAuthTokenForClickPesa($client_id, $api_key){
        $curl = curl_init();
        curl_setopt_array($curl, [
        CURLOPT_URL => "https://api.clickpesa.com/third-parties/generate-token",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => "",
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => "POST",
        CURLOPT_HTTPHEADER => [
            "api-key: $api_key",
            "client-id: $client_id"
        ],
        ]);

        $response = curl_exec($curl);
        $err = curl_error($curl);
        $responseData = json_decode($response, true);

        curl_close($curl);

        if ($err) {
        return "cURL Error #:" . $err;
        } else {
        return $responseData['token'];
        }
    }

    public function makePaymentUsingClickPesa($request, $paymentConfig, $calling_from)
    {
        DB::beginTransaction();
        try {

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

            $apiKey = $paymentConfig->api_secret_key;
            $clientId = $paymentConfig->api_public_key;
            $trans_id = "trans" . $id . '' . time();
            $token = $this->getAuthTokenForClickPesa($clientId, $apiKey);
         
            if (empty($token)) {
               
                throw new \Exception('Token not generated');
            }
            $url = "https://api.clickpesa.com/third-parties/checkout-link/generate-checkout-url";


            $data = [
              
                'totalPrice' => $request->amount,
                'orderReference' => $trans_id,
                // 'orderCurrency' => $user->Country->isoCode,
                'orderCurrency' => $request->currency,
                // 'customerName' => $user->first_name.' '.$user->last_name,
                // 'customerEmail' => $user->email,
                // 'customerPhone' => $user->UserPhone,
      
            ];
        

           $curl = curl_init();

            curl_setopt_array($curl, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "POST",
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                "Authorization: $token",
                "Content-Type: application/json"
            ],
            ]);

            // $response = curl_exec($curl);
            // $err = curl_error($curl);

            // curl_close($curl);

            // if ($err) {
            // echo "cURL Error #:" . $err;
            // } else {
            // echo $response;
            // }

            $response = json_decode(curl_exec($curl), true);
            curl_close($curl);

            if (isset($response['checkoutLink'])) {

                $order_id = $request->orderReference;
                DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                   
                    'status' => $status,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id' => $trans_id,
                    'amount' => $request->amount,
                    'payment_option_id' => $paymentConfig->payment_option_id,
                    'request_status' => 1,
                    'status_message' => 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);


                return [
                    'status' => 'NEED_TO_OPEN_WEBVIEW',
                    'url' => $response['checkoutLink'] ?? '',
                    'transaction_id' => $trans_id ?? '',
                    'success_url' => route('clickpesa-success'),
                    'fail_url' => route('clickpesa-fail'),
                    'redirect_url' => route('clickpesa-redirect')
                ];
                 DB::commit();
            } else {
                throw new \Exception(json_encode($response));
            }
        } catch (\Exception $e) {
            DB::rollBack();
            throw new \Exception($e->getMessage());
        }
    }
    
    
    
    
    public function redirect(){
          echo "<h1>Redirecting......</h1>";
    }
    
    
    public function clickpesaPaysuccess(Request $request)
    {
        $data = $request->all();
        \Log::channel('clickpesa_pay')->emergency($data);
        echo "<h1>Success</h1>";
    }

    public function clickpesaPayFail(Request $request)
    {
        $data = $request->all();
        \Log::channel('clickpesa_pay')->emergency($data);
        echo "<h1>Failed</h1>";
    }

    public function clickpesaPayCallback(Request $request)
    {
        \Log::channel('clickpesa_pay')->emergency($request->all());
        $data = $request->all();
       
        $order_reference = $data['data']['orderReference'] ;
        $payment_reference = $data['data']['paymentReference'];
        if (!empty($data)) {
            $trans = DB::table('transactions')->where(['request_status' => 1, 'payment_transaction_id' => $order_reference])->first();
            
            if (!empty($trans)) {
               
                $payment_status = $data['data']['status'] == "SUCCESS" ? 2 : 3;
                if ($payment_status == 2) {
                    
                    DB::table('transactions')
                        ->where(['payment_transaction_id' => $order_reference])
                        ->update([
                            'request_status' => 2,
                            
                            'payment_transaction' => json_encode($request->all()),
                            'reference_id' => $payment_reference,
                            'updated_at' => date('Y-m-d H:i:s'),
                            'status_message' => 'SUCCESS'
                        ]);
                } else {
                    
                    DB::table('transactions')
                        ->where(['payment_transaction_id' => $order_reference])
                        ->update([
                            'request_status' => 3,
                            'card_is_active' => 2,
                            'payment_transaction' => json_encode($request->all()),
                            'reference_id' => $payment_reference,
                            'updated_at' => date('Y-m-d H:i:s'),
                            'status_message' => 'FAIL'
                        ]);
                }
            }
        }
        return "success";
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