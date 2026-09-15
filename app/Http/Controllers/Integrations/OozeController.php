<?php

namespace App\Http\Controllers\Integrations;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponseTrait;
use App\Traits\MerchantTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Models\UtilityTransaction;
use App\Models\ThirdPartyIntegration;
use App\Models\ThirdPartyIntegrationConfiguration;
use Illuminate\Support\Facades\DB;


class OozeController extends Controller{
    use ApiResponseTrait, MerchantTrait;
    public function getservertime($httphost){
        $headers = [
            'Content-Type: application/json',
             'HTTP_HOST:'.$httphost,
        ];
        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://go.ooze.co.bw/pvaps/api/get_time',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'GET',
            CURLOPT_HTTPHEADER => $headers
        ));

        $resp = curl_exec($curl);

        if ($resp === false) {
            die('Curl error: ' . curl_error($curl));
        }

        curl_close($curl);

        $data = json_decode($resp, true);
        return $data['Time'] ?? null;


    }


    public function createtoken(Request $request){

        
        
        
         $user = $request->user('api');
             $string_file = $this->getStringFile($user->merchant_id);
        $integration_id  = $request->input('integration_id');
       
        $integration = ThirdPartyIntegrationConfiguration::where('third_party_integration_id', $integration_id)->where('merchant_id',$user->merchant_id)
            ->first();
        if ($integration) {
            $payload = $integration->toArray();
        }
        else{
             return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        $datetime = $this->getservertime($payload['api_key']);
        // dd($datetime);
       

        $header = [
            'HTTP_HOST:'.$payload['api_key'],
            'agent:'.$payload['api_secret'],
            'http_user:'.$payload['auth_token'],
            'http_pass:'.$payload['auth_password'],
            'User-Agent:'.$payload['operator'],
            'datetime:'.$datetime,
        ];
        $data = [
            'username' => $payload['additional_req'],
            'password' => $payload['sender'],
        ];
        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://go.ooze.co.bw/pvaps/api/create_token',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => $data,
            CURLOPT_HTTPHEADER => $header,
        ));
        $resp = curl_exec($curl);
      
        if ($resp === false) {
            die('Curl error: ' . curl_error($curl));
        }
        curl_close($curl);
     
       $decoded  = json_decode($resp, true);
       $token = $decoded['token'] ?? null;
    
        


       
       $data = [
           'token' => $token,
           'datetime' => $datetime
           ];
           
       if(!empty($token) && !empty($datetime)){
            return $this->successResponse(trans("$string_file.success"),$data);
        }else{
            return $this->failedResponse('Token Not Created');
        }
        
        return $data;
    }

    public function getproductlist($payload,$user){
         try{

        
        
        $wallet_balance = $user->wallet_balance ?? '0';
        

$payment_options = $user->Merchant->PaymentMethod
    ->filter(function ($item) {
        return $item->id != 1;
    })
    ->map(function ($item) {
        return [
            'id' => $item->id,
            'payment_method' => $item->payment_method
        ];
    })
    ->values();

 
 
        $headers = [
            'Content-Type: application/json',
            'token: '.$payload['token'],
            'datetime: '.$payload['datetime']
        ];
     

        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://go.ooze.co.bw/pvaps/api/products',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'GET',
            CURLOPT_HTTPHEADER => $headers
        ));
        $resp = curl_exec($curl);
        // \Log::channel('utility_ooze')->emergency(['token' => $payload['token'], 'datetime' => $payload['datetime'], 'response' => json_decode($resp,true)]);
        if($resp === false){
            die('Curl error: ' . curl_error($curl));
        }
        curl_close($curl);
      
        // use current merchant id to use string file 
       return  ['response' => json_decode($resp,true), 'payment_option' => $payment_options, 'wallet_balance' => $wallet_balance];
       
         } catch (\Exception $e) {
            
            throw new \Exception($e->getMessage());
        }

    }


    public function transaction(Request $request){
        try{
        DB::beginTransaction();
        $user = $request->user('api');
        $string_file = $this->getStringFile($user->merchant_id);
        $validated = $request->validate([
            'token'         => 'required|string',
            'datetime'      => 'required|string',
            'product'       => 'required|integer',
            'cell'          => 'required|string',
            'amount'        => 'required|integer',
            'payment_method_id'        => 'nullable|integer'
        ]);
      
        
        $token    = $validated['token'];
        $datetime = $validated['datetime'];
        $ext_txn_no = 'UTIL_' . uniqid();
        $headers = [
            'token: ' . $token,
            'datetime: ' . $datetime,
        ];
        
        $data = [
            'product'       => $validated['product'],
            'cell'          => $validated['cell'],
            'amount'        => $validated['amount'],
            'ext_txn_no'    => $ext_txn_no
         
        ];

        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => 'https://go.ooze.co.bw/pvaps/api/transact',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 90,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => $data,
            CURLOPT_HTTPHEADER => $headers,
        ]);
       $response = curl_exec($curl);
    //   dd($headers, $data, $response);
     

// if ($response === false) {
//     die('Curl error: ' . curl_error($curl));
// }

$resp = json_decode($response, true);

        \Log::channel('utility_ooze')->emergency(['token' => $token, 'datetime' => $datetime, 'response' => $resp]);

        curl_close($curl);
   
        $data =  ['token' => $token, 'datetime' => $datetime, 'response' => $resp];
        
          $store = [
            'product' => $validated['product'],
            'cell' => $validated['cell'],
            'amount' => $validated['amount'],
            'payment_method_id' => $validated['payment_method_id'],
            'ext_txn_no' => $ext_txn_no,
            'merchant_id' => $user->merchant_id,
            'user_id' => $user->id,
            'trans_id' => $resp['trans_id'] ?? null,
            'transaction_status' => $resp['transaction_status'] ?? null,
            'details' => $resp['transaction_details'] ?? null,
             'msg' => $resp['msg'] ?? null,
        ];
          
            UtilityTransaction::create($store);
        
        
      if(isset($resp['success']) && $resp['success'] == true){


            DB::commit();

            return $this->successResponse(trans("$string_file.success"), $data);

        }else{

            DB::rollBack();
            return $this->failedResponse($resp);
        }

            
         } catch (\Exception $e) {
            throw new \Exception($e->getMessage());
        }
    }
    
    public function statement(Request $request){
        try{
        $user = $request->user('api');
        $string_file = $this->getStringFile($user->merchant_id);
        $validated = $request->validate([
            'token'     => 'required|string',
            'datetime'  => 'required|string',
            'fromdate'  => 'required|date',
            'todate'    => 'required|date|after_or_equal:fromdate',
            'cellno'    => 'required|integer',
            'product'   => 'required|integer'
        ]);
        $token =  $validated['token'];
        $datetime =  $validated['datetime'];
        $headers = [
            'Content-Type: application/json',
            'token: ' . $token,
            'datetime: ' . $datetime,
        ];
         $data = [
            'fromdate' => $validated['fromdate'] ?? '',
            'todate'   => $validated['todate'] ?? '',
            'cellno'   => $validated['cellno'] ?? '',
            'product'  => $validated['product'] ?? '',
        ];
        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://go.ooze.co.bw/pvaps/api/statement',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => $data,
            CURLOPT_HTTPHEADER => $headers
        ));
        $resp = curl_exec($curl);
         \Log::channel('utility_ooze')->emergency(['token' => $token, 'datetime' => $datetime, 'response' => json_decode($resp,true)]);
        if ($resp === false) {
            die('Curl error: ' . curl_error($curl));
        }
        curl_close($curl);
        $data =  ['token' => $token, 'datetime' => $datetime, 'response' => json_decode($resp,true)];
        return $this->successResponse(trans("$string_file.success"),$data);
            
         } catch (\Exception $e) {
            
            throw new \Exception($e->getMessage());
        }
    }

    public function electricity_lookup(Request $request){
        try{
           
        $user = $request->user('api');
        $string_file = $this->getStringFile($user->merchant_id);
        $validated = $request->validate([
            'token'    => 'required|string',
            'datetime' => 'required|string',
            'meterno'  => 'required|integer',
        ]);
        $token =  $validated['token'];
        $datetime =  $validated['datetime'];
        
        $headers = [
            'token:'.$token,
            'datetime:'.$datetime,
        ];
        $data = [
            'meterno' => $validated['meterno'],
        ];
       
        
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => 'https://go.ooze.co.bw/pvaps/api/electricity_lookup',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => $data,
            CURLOPT_HTTPHEADER => $headers,
        ]);
        
        $resp = curl_exec($curl);
        
   
         \Log::channel('utility_ooze')->emergency(['token' => $token, 'datetime' => $datetime, 'response' => json_decode($resp,true)]);
        if ($resp === false) {
            die('Curl error: ' . curl_error($curl));
        }
        curl_close($curl);
        
        $data =  ['token' => $token, 'datetime' => $datetime, 'response' => json_decode($resp,true)];
        return $this->successResponse(trans("$string_file.success"),$data);

             
         } catch (\Exception $e) {
            
            throw new \Exception($e->getMessage());
        }
    }


    public function electricity_reprint(Request $request){
        try{
        $user = $request->user('api');
        $string_file = $this->getStringFile($user->merchant_id);
        $validated = $request->validate([
            'token'    => 'required|string',
            'datetime' => 'required|string',
            'transid'  => 'required|string'
        ]);
        $token =  $validated['token'];
        $datetime =  $validated['datetime'];
        
        $headers = [
         
            'token: ' . $token,
            'datetime: ' . $datetime,
        ];
        
        $data = [
            'transid' => $validated['transid']
        ]; 

        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://go.ooze.co.bw/pvaps/api/electricity_reprint',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => $data,
            CURLOPT_HTTPHEADER => $headers
        ));
        $resp = curl_exec($curl);
         \Log::channel('utility_ooze')->emergency(['token' => $token, 'datetime' => $datetime, 'response' => json_decode($resp,true)]);
        if ($resp === false) {
            die('Curl error: ' . curl_error($curl));
        }
        curl_close($curl);
        $data =  ['token' => $token, 'datetime' => $datetime, 'response' => json_decode($resp,true)];
        return $this->successResponse(trans("$string_file.success"),$data);

             
         } catch (\Exception $e) {
            
            throw new \Exception($e->getMessage());
        }
    }


    public function check_transaction(Request $request){
        try{
        $user = $request->user('api');
        $string_file = $this->getStringFile($user->merchant_id);
        $validated = $request->validate([
            'token'         => 'required|string',
            'datetime'      => 'required|string',
            'transactionid' => 'required|string'
        ]);
        // dd($request->all());
        $token =  $validated['token'];
        $datetime =  $validated['datetime'];
        $trans_id = $validated['transactionid'];
        
        $headers = [
            'token: ' . $token,
            'datetime: ' . $datetime,
        ];
        
        $data = [
            'transactionid' => $trans_id,
        ];
        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://go.ooze.co.bw/pvaps/api/check_transaction',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => $data,
            CURLOPT_HTTPHEADER => $headers
        ));
        $resp = json_decode(curl_exec($curl), true);
      
        // dd($headers, $data, $resp);
         \Log::channel('utility_ooze')->emergency(['token' => $token, 'datetime' => $datetime, 'response' => $resp]);
        // if ($resp === false) {
        //     die('Curl error: ' . curl_error($curl));
        // }
        curl_close($curl);
        
        $transaction = UtilityTransaction::where('trans_id', $trans_id)
                        ->select('payment_method_id', 'amount', 'payment_status')
                        ->first();

        $payment_method_id = $transaction->payment_method_id ?? null;
        $amount = $transaction->amount ?? null;
        $payment_status = $transaction->payment_status ?? null;
        $trans_status = $resp['trans_status'] ?? null;
        $trans_date_time = $resp['trans_date_time'] ?? null;
        $trans_resp = $resp['trans_resp'] ?? null;
        $trans_cur_status = $resp['trans_cur_status'] ?? null;
        if($payment_method_id == '3' && $trans_status == '2' && $payment_status == 0){
           
        UtilityTransaction::where('trans_id', $trans_id)
            ->where('payment_status', 0)
            ->update([
                'payment_status' => 1,
                'transaction_status' => $trans_status,
                'trans_date_time' => $trans_date_time,
                'trans_resp' => $trans_resp,
                'trans_cur_status' => $trans_cur_status
            ]);
        $user->decrement('wallet_balance', $amount);
      
        }
        $data =  ['token' => $token, 'datetime' => $datetime, 'response' => $resp];
        return $this->successResponse(trans("$string_file.success"),$data);

             
         } catch (\Exception $e) {
            
            throw new \Exception($e->getMessage());
        }
    }
    
    
    
    public function transaction_store(Request $request)
    {
        $user = $request->user('api');
        $string_file = $this->getStringFile($user->merchant_id);
    
        $validated = $request->validate([
            'ext_txn_no'         => 'required|string',
            'trans_id'           => 'required|integer',
            'transaction_status' => 'required|integer',
            'details'            => 'nullable|string',
        ]);
    
        $transaction = UtilityTransaction::where('ext_txn_no', $validated['ext_txn_no'])
            ->first();
    
        if (!$transaction) {
            return $this->failedResponse('Transaction Not Found');
        }
    
        $transaction->update([
            'trans_id'           => $validated['trans_id'],
            'transaction_status' => $validated['transaction_status'],
            'details'            => $validated['details'] ?? null,
        ]);
    
        return $this->successResponse(
            trans("$string_file.success"),
            $transaction
        );
    }
        
    public function transaction_list(Request $request)
    {
        $user = $request->user('api');
        $string_file = $this->getStringFile($user->merchant_id);
        // $validated = $request->validate([
        //     'user_id' => 'required|integer',
        // ]);
    
        $transactions = UtilityTransaction::where('user_id', $user->id)
            ->orderBy('id', 'desc')
            ->get();
      
        if ($transactions->count() == 0) {
            return $this->failedResponse('Transactions Not Found');
        }
        return $this->successResponse(trans("$string_file.success"),$transactions);

    }
}