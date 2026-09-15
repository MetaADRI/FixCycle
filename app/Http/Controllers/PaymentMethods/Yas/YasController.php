<?php

namespace App\Http\Controllers\PaymentMethods\Yas;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use DB;
use App\Models\Transaction;
use App\Models\PaymentOption;
use App\Models\PaymentOptionsConfiguration;
use App\Traits\ApiResponseTrait;
use App\Traits\MerchantTrait;

class YasController extends Controller
{
    use ApiResponseTrait, MerchantTrait;
    public function getYasPayConfig($merchant_id)
    {
        $payment_option = PaymentOption::where('slug', 'YASPAY')->first();
        $paymentOption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant_id], ['payment_option_id', '=', $payment_option->id]])->first();
        $string_file = $this->getStringFile($merchant_id);
        if (empty($paymentOption)) {
            return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
        return $paymentOption;
    }

    public function makePaymentUsingyas($request, $paymentConfig, $calling_from)
    {
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
            
      
            $url = "https://tgpp-mbanking-stp-gw-gen.togocom.tg/tpdebit/debit";
            
            $data = [
                "numeroClient" => "22890990990",
                "montant" => 40000,
                "refCommande" => "REF-7DRU873CSN",
                "idRequete" => "631328001ps61b",
                "dateHeureRequete" => "2021-04-14 09:08:46",
                "description" => "Payment for service XXX"
            ];
            
            $ch = curl_init($url);
            
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Bearer <TOKEN>",
                "Content-Type: application/json"
            ]);
            
            $response = curl_exec($ch);
            
            if (curl_errno($ch)) {
                echo 'Error:' . curl_error($ch);
            } else {
                echo $response;
            }
            
            curl_close($ch);
        echo "make payment function";

    }

    public function YasCallBack()
    {
        echo "robin";
    }

    public function createtoken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'calling_from' => 'required',
            'payment_method_id' => 'required'
        ]);

        if ($validator->fails()) {
            $errors = $validator->messages()->all();
            return $this->failedResponse($errors[0]);
        }

        $calling_from = $request->calling_from;

        if ($calling_from == "DRIVER") {
            $driver = $request->user('api-driver');
            $merchant_id = $driver->merchant_id;
        } else {
            $user = $request->user('api');
            $merchant_id = $user->merchant_id;
        }
        $string_file = $this->getStringFile($merchant_id);
        $payment_option_config = $this->getYasPayConfig($merchant_id);

        if (!$payment_option_config) {
            return $this->failedResponse('Configuration not found');
        }
        $username = $payment_option_config->api_public_key;
        $password = $payment_option_config->api_secret_key;
        $data = [
            "nomUtilisateur" => $username,
            "motDePasse" => $password,
        ];
        $curl = curl_init();

        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://tgpp-mbanking-stp-gw-gen.togocom.tg/login',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => array(
                'Content-Type: application/json'
            ),
        ));

        $response = curl_exec($curl);
        curl_close($curl);
        $res = json_decode($response, true);

        if (isset($res['statut']) && $res['statut']['code'] == '2000' && isset($res['data']) && isset($res['data']['token'])) {
            return $this->successResponse(trans("$string_file.success"), $res);
        } else {
            return $this->failedResponse('Token Not Created');
        }
    }




}