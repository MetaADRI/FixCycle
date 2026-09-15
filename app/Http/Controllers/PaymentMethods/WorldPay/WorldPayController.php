<?php

namespace App\Http\Controllers\PaymentMethods\WorldPay;

use Exception;
use App\Models\Transaction;
use Illuminate\Http\Request;
use App\Models\PaymentOption;
use App\Traits\MerchantTrait;
use App\Traits\ApiResponseTrait;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use App\Models\PaymentOptionsConfiguration;

class WorldPayController extends Controller
{
    use ApiResponseTrait, MerchantTrait;

    public function getConfig($merchant_id)
    {
        $payment_option = PaymentOption::where('slug', 'WORLD_PAY')->first();
        $paymentOption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id], ['payment_option_id', '=', $payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }

    public function getBaseUrl($env)
    {
        return $env == 1 ? 'https://access.worldpay.com/' : 'https://try.access.worldpay.com/';
    }

    public function MakePayment($request, $payment_option_config, $calling_from)
    {
        $type = $calling_from;
        if ($type == "DRIVER") {
            $user = $request->user('api-driver');
            $id = $user->id;
            $merchant_id = $user->merchant_id;
        } else {
            $user = $request->user('api');
            $id = $user->id;
            $merchant_id = $user->merchant_id;
        }
        $currency =  $user->Country->isoCode;
        try {
            $config = $this->getConfig( $merchant_id);
            $baseUrl = $this->getBaseUrl($config->gateway_condition);
            $tscId = 'TXN-' . uniqid();
            $response = Http::withHeaders([
                'WP-CorrelationId' => '51ZDI8N',
                'User-Agent' => 'magna consectetur L',
                'Content-Type' => 'application/vnd.worldpay.payment_pages-v1.hal+json',
                'Accept' => 'application/vnd.worldpay.payment_pages-v1.hal+json',
                'Authorization' => 'Basic ' . base64_encode($config->api_public_key . ':' . $config->api_secret_key),
            ])->post($baseUrl . 'payment_pages', [
                "transactionReference" => $tscId,
                "merchant" => [
                    "entity" => $config->auth_token,
                ],
                "narrative" => [
                    "line1" => "Mind Palace Ltd"
                ],
                "value" => [
                    "currency" =>   $currency,
                    "amount" => $request->amount * 100
                ],
                "description" => "Optional text displayed on HPP to your customer",
                "resultURLs" => [
                    "successURL" => route('world-pay.redirect', ['id' => $tscId, 'status' => 2]),
                    "pendingURL" => route('world-pay.redirect', ['id' => $tscId, 'status' => 1]),
                    "failureURL" => route('world-pay.redirect', ['id' => $tscId, 'status' => 3]),
                    "errorURL" => route('world-pay.redirect', ['id' => $tscId, 'status' => 3]),
                    "cancelURL" => route('world-pay.redirect', ['id' => $tscId, 'status' => 3]),
                    "expiryURL" => route('world-pay.redirect', ['id' => $tscId, 'status' => 3])
                ],
                "expiry" => "900"
            ]);


            $calling_for = $request->calling_for == 'BOOKING' ? 3 : ($type == "USER" ? 1 : 2);
            $calling_for = $request->calling_for == 'BOOKING' ? 3 : ($type == "USER" ? 1 : 2);
            Transaction::create([
                'user_id' => $type == "USER" ? $id : NULL,
                'driver_id' => $type == "DRIVER" ? $id : NULL,
                'status' => $calling_for,
                'merchant_id' => $merchant_id,
                'payment_transaction_id' => $tscId,
                'payment_transaction' => json_encode($response->json()),
                'amount' => $request->amount,
                'payment_option_id' => $config->payment_option_id,
                'request_status' => 1,
                'status_message' => 'PENDING',

            ]);
            if ($response->successful()) {
                $data = $response->json();
            } else {
                throw new Exception('Something worng.');
            }

            return ['status' => 'NEED_TO_OPEN_WEBVIEW', 'transaction_id' => $tscId, 'url' => $data['url'], 'success_url' => route('world-pay.redirect', ['id' => $tscId, 'status' => 2]), 'fail_url' => route('world-pay.redirect', ['id' => $tscId, 'status' => 3])];
        } catch (Exception $e) {
            throw new Exception($e->getMessage());
        }
    }


    public function Redirect(Request $request,$id, $status)
    {
        \Log::channel('world_pay')->emergency(['status'=>$status,'request'=>$request->all(),'callback'=>'callback_url']);
        $transaction = Transaction::where('payment_transaction_id', $id)->first();
        if ($status == 2) {
            $transaction->update([
                'request_status' => 2,
                'status_message' => 'SUCCESS',
            ]);
            return '<h1>Payment Success.</h1>';
        } else if ($status == 3) {
            $transaction->update([
                'request_status' => 3,
                'status_message' => 'FAILED',
            ]);
            return '<h1>Payment Faild.</h1>';
        } else {
            $transaction->update([
                'request_status' => 1,
                'status_message' => 'PENDING',
            ]);
            return '<h1>Payment PENDIND.</h1>';
        }
    }
}
