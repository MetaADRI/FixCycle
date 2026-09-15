<?php

namespace App\Http\Controllers\Integrations;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Helper\SmsController;
use App\Models\ThirdPartyIntegration;
use App\Models\ThirdPartyIntegrationConfiguration;
use Illuminate\Http\Request;
use App\Traits\MerchantTrait;
use App\Traits\ApiResponseTrait;
use App\Http\Controllers\Integrations\WaslIntegrationController;
use App\Http\Controllers\Integrations\SapoApiController;

class IntegrationController extends Controller
{
    use MerchantTrait,ApiResponseTrait;

    public function proceedThirdPartyIntegrations($integration_slug, $context = [] ) {
        $merchant_id = $context['booking']->merchant_id ?? $context['driver']->merchant_id ?? $context['user']->merchant_id ?? $context['request']['merchant_id'] ?? null;

        $integration = ThirdPartyIntegration::where('name', $integration_slug)
            ->where('status', 1)
            ->firstOrFail();
  
        $config = $integration->ThirdPartyIntegrationConfiguration($merchant_id)->first();

        if (!$config) {
            throw new \Exception('Integration not found or inactive');
        }

        $payload = array_merge([
            'request'  => $context['request'] ?? null,
            'calling_for' => $context['calling_for'] ?? null,
            'driver'   => $context['driver'] ?? null,
            'user'     => $context['user'] ?? null,
            'booking'  => $context['booking'] ?? null,
            'config'   => $config,
            'vehicle' => $context['vehicle'] ?? null,
        ], $context);

        return $this->resolveIntegration($integration_slug, $payload);
    }


    protected function resolveIntegration(string $slug, array $payload,$user = NULL)
    {
        $data = [];
        switch ($slug) {
            case 'WASL':
                $wasl = new WaslIntegrationController($payload);
                break;
            case 'WHATSAPP_OTP_INFOBIP':
                $infobipOtp = new SmsController();
                $infobipOtp->SendWhatsAppSms($payload);
                break;
            case 'UTILITY_OOZE':  
                $utilityooze = new OozeController();
                $data = $utilityooze->getproductlist($payload,$user);      
                break;
            case 'SAPO_API':  
                $sapoApi = new SapoApiController($payload);  
                break;
            default:
                throw new \Exception("Integration {$slug} not supported");
        }     
        if(!empty($data)){
            return $data;
        }
    }
    //utility product list function
    public function  getProductsUtility(Request $request){
        $user = $request->user('api');
        $string_file = $this->getStringFile($user->merchant_id);
        $integration_id  = $request->input('integration_id');
        // $calling_from = $request->input('calling_from');

        $integration = ThirdPartyIntegrationConfiguration::where('third_party_integration_id', $integration_id)->where('merchant_id',$user->merchant_id)
            ->first();
        if ($integration) {
            $integration = $integration->toArray();
        }
        else{
             return $this->failedResponse(trans("$string_file.configuration_not_found"));
        }
       
        $data = $this->resolveIntegration($integration['provider_slug'],$request->all(),$user);
        if(is_array($data['response']) && count($data['response']) > 0){
            return $this->successResponse(trans("$string_file.success"),$data);
        }else{
            return $this->failedResponse($data['response']);
        }
        
    }
}
