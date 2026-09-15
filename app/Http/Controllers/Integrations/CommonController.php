<?php

namespace App\Http\Controllers\Integrations;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Helper\SmsController;
use App\Models\ThirdPartyIntegration;
use Illuminate\Http\Request;
use App\Traits\MerchantTrait;
use App\Traits\ApiResponseTrait;

class CommonController extends Controller
{
    use MerchantTrait,ApiResponseTrait;

    public function getWaslProvince(Request $request){
        try{
            $merchant_id = $request->merchant_id;
            $string_file = $this->getStringFile($merchant_id);
    
            $integration = ThirdPartyIntegration::where('name', 'WASL')
                    ->where('status', 1)
                    ->firstOrFail();
    
            $config = $integration->ThirdPartyIntegrationConfiguration($merchant_id)->first();

            if (!$config) {
                throw new \Exception('Integration not found or inactive');
            }
    
            $headers = [
                'Content-Type: application/json',
                'client-id: '.$config->api_key,
                'app-id: '.$config->auth_token,
                'app-key: '.$config->api_secret
            ];

            $curl = curl_init();

            curl_setopt_array($curl, array(
                CURLOPT_URL => 'https://wasl.api.elm.sa/api/dispatching/v2/trips/province-inquiry',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 0,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'GET',
                CURLOPT_HTTPHEADER => $headers,
            ));

            $response = json_decode(curl_exec($curl),true);
            curl_close($curl);
            
            if(isset($response['success']) && isset($response['resultCode'])  && $response['success']  == false){
                return $this->failedResponse($response['resultCode']);
            }elseif(empty($response)){
                return $this->failedResponse('No Response');
            }

            return $this->successResponse(trans("$string_file.success"),$response);
        } catch (\Exception $e) {
            \DB::rollBack();
            throw new \Exception($e->getMessage());
        }
    }
}