<?php

namespace App\Http\Controllers\PaymentMethods\Geidea;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Traits\ApiResponseTrait;
use DB;
use App\Traits\MerchantTrait;
use App\Models\Transaction;


class GeIdeaPaymentController extends Controller
{
    use ApiResponseTrait,MerchantTrait;

    public function getGeideaConfig($merchant_id){
        $payment_option = \App\Models\PaymentOption::where('slug', 'GEIDEA')->first();
        $paymentOption = \App\Models\PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id],['payment_option_id','=',$payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }

    function generateSignature($merchantPublicKey, $orderAmount, $orderCurrency, $orderMerchantReferenceId, $apiPassword, $timestamp)
    {
        $amountStr = number_format($orderAmount, 2, '.', '');
        $data = "{$merchantPublicKey}{$amountStr}{$orderCurrency}{$orderMerchantReferenceId}{$timestamp}";
        $hash = hash_hmac('sha256', $data, $apiPassword, true);
        return base64_encode($hash);
    }

    public function makePayment($request, $paymentConfig, $calling_from)
    {
        DB::beginTransaction();
        $data =[];
        try {
            $status = 3;
            if ($calling_from == "DRIVER") {
                $driver = $request->user('api-driver');
                $id = $driver->id;
                $merchant_id = $driver->merchant_id;
                $email = $driver->email;
                $phone = $driver->PhoneNumber;
                $phone_code = $driver->Country->Phonecode;
                $status = 2;
            } elseif($calling_from == "USER") {
                $user = $request->user('api');
                $id = $user->id;
                $merchant_id = $user->merchant_id;
                $email = $user->email;
                $phone = $user->UserPhone;
                $phone_code = $user->Country->Phonecode;
                $status = 1;
            }

            $merchant_public_key = $paymentConfig->api_public_key;
            $payment_option = $this->getGeideaConfig($merchant_id);
            $api_secret_key = $paymentConfig->api_secret_key;
            $merchant_ref_id = uniqid()."-".$merchant_id;
            $amount = $request->amount;
            $currency = $request->currency;
            $timestamp = now()->format('Y/m/d H:i:s A');
            $authorization = "Basic " . base64_encode($merchant_public_key . ":" . $api_secret_key);
            $signature = $this->generateSignature($merchant_public_key, $amount, $currency, $merchant_ref_id, $api_secret_key, $timestamp);

            $req_data = [
                'amount' => $amount,
                'currency' => $currency,
                'timestamp' => $timestamp,
                'merchantReferenceId' => $merchant_ref_id,
                'signature' => $signature,
                'paymentOperation' => 'Pay',
                'appearance' => [
                    'uiMode' => 'modal'
                ],
                'language' => 'en',
                'callbackUrl' => route('geidea-callback'),
                'returnUrl' => route('geidea-success'),
                'customer' => [
                    'email' => $email,
                    'phoneNumber' => $phone,
                    'phoneCountryCode' => $phone_code
                ],
                'initiatedBy' => 'Internet'
            ];


            $curl = curl_init();

            curl_setopt_array($curl, [
                CURLOPT_URL => "https://api.merchant.geidea.net/payment-intent/api/v2/direct/session",
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => "",
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => "POST",
                CURLOPT_POSTFIELDS => json_encode($req_data),
                CURLOPT_HTTPHEADER => [
                    "accept: application/json",
                    "authorization: ".$authorization,
                    "content-type: application/json"
                ],
            ]);

            $response = curl_exec($curl);
            $err = curl_error($curl);

            curl_close($curl);

            if ($err) {
                $data = [
                    'status' => 'NEED_TO_OPEN_WEBVIEW',
                    'url' => route('geidea-fail'),
                    'transaction_id' => $merchant_ref_id,
                    'success_url' => route('geidea-success'),
                    'fail_url' => route('geidea-fail'),
                    'err'=> $err
                ];
            }
            else
            {
                $response = json_decode($response, true);
                DB::table('transactions')->insert([
                    'user_id' => $calling_from == "USER" ? $id : NULL,
                    'driver_id' => $calling_from == "DRIVER" ? $id : NULL,
                    'status' => $status,
                    'booking_id' => $request->booking_id,
                    'order_id' => $request->order_id,
                    'handyman_order_id' => $request->handyman_order_id,
                    'merchant_id' => $merchant_id,
                    'payment_transaction_id'=> $merchant_ref_id,
                    'amount' => $amount,
                    'payment_option_id' => $payment_option->payment_option_id,
                    'request_status'=> 1,
                    'status_message'=> 'PENDING',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);

                $data = [
                    'status' => 'NEED_TO_OPEN_WEBVIEW',
                    'url' => route('geidea-webview',['session_id' => $response['session']['id']]),
                    'transaction_id' => $merchant_ref_id,
                    'success_url' => route('geidea-success'),
                    'fail_url' => route('geidea-fail'),
                ];

            }

        } catch (\Exception $e) {
            DB::rollBack();
            throw new \Exception($e->getMessage());
        }
        DB::commit();
        return $data;
    }



    public function Success(Request $request){
        echo '<h3>Success</h3>';
    }

    public function Fail(Request $request){
        echo '<h3>Fail</h3>';
    }

    public function callback(Request $request)
    {
        \Log::channel('geidea')->emergency($request->all());
        $data = $request->all();
        if (!empty($data) && isset($data['order'])) {

            $order = $data['order'];
            $merchantReferenceId = $order['merchantReferenceId'] ?? null; // your internal reference
            $orderId = $order['orderId'] ?? null;
            $status = strtolower($order['status'] ?? '');
            $detailedStatus = strtolower($order['detailedStatus'] ?? '');

            if (!empty($merchantReferenceId)) {

                $trans = DB::table('transactions')
                    ->where(['request_status' => 1, 'payment_transaction_id' => $merchantReferenceId])
                    ->first();

                if (!empty($trans)) {

                    $paymentStatus = ($status === 'success' && $detailedStatus === 'paid') ? 2 : 3;
                    $updateData = [
                        'payment_transaction' => json_encode($data),
                        'reference_id'        => $orderId,
                        'updated_at'          => now(),
                        'status_message'      => ($paymentStatus == 2) ? 'SUCCESS' : 'FAIL',
                        'request_status'      => $paymentStatus,
                    ];

                    DB::table('transactions')
                        ->where(['payment_transaction_id' => $merchantReferenceId])
                        ->update($updateData);
                } else {
                    \Log::channel('geidea')->warning("No transaction found for merchantReferenceId: " . $merchantReferenceId);
                }
            } else {
                \Log::channel('geidea')->warning("Missing merchantReferenceId in Geidea callback.");
            }
        } else {
            \Log::channel('geidea')->warning("Invalid Geidea callback payload: " . json_encode($data));
        }

        return response()->json(['message' => 'success from callback']);
    }




    public function webView(Request $request){
        $session_id = $request->session_id;
        return view('merchant.random.geidea',['session_id' => $session_id]);
    }
}
