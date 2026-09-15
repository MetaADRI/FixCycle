<?php

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ThirdPartyIntegerationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $whatsapp_sms_gateway = array(
            array('name' => 'WASL','params' => '{"api_key":"WASL API-KEY (Client-ID)","api_secret":"Application ID","auth_token":"app key"}','description' => 'twillio','WASL' => '1','environment' => NULL),
            array('name' => 'WHATSAPP OTP INFOBIP','params' => '{"api_secret":"Access Key","api_key":"Template Name","auth_token":"Notify Callback Url"}','description' => 'WHATSAPP_OTP_INFOBIP','status' => '1','environment' => NULL)
        );

        foreach($whatsapp_sms_gateway as $gateway){
            \App\Models\ThirdPartyIntegration::create(array_merge($gateway, array("created_at" => Carbon::now(), "updated_at" => Carbon::now())));
        }
    }
}