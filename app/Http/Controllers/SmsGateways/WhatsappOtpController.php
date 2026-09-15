<?php

namespace App\Http\Controllers\SmsGateways;

use Illuminate\Support\Facades\Http;

class WhatsappOtpController
{
    public function InfobipTemplate($phone, $message, $appKey,$url,$templateName,$domain,$sender){
        $data = [
            "messages" => [
                [
                    "from" => $sender,
                    "to" => $phone,
                    "messageId" => "WHATSAPP_" . time(),
                    "content" => [
                        "templateName" => $templateName,
                        "templateData" => [
                            "body" => [
                                "placeholders" => [$message] // MUST be array
                            ],
                            "buttons" => [
                                [
                                    "type" => "URL",
                                    "parameter" => $message
                                ]
                            ]
                        ],
                        "language" => "en_GB"
                    ],
                    "callbackData" => "Callback data",
                    "notifyUrl" => $url
                ]
            ]
        ];

        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_URL => "https://{$domain}/whatsapp/1/message/template",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => array(
                'Authorization: App ' . $appKey,
                'Content-Type:application/json',
                'Accept:application/json'
            ),
        ));
        $response = curl_exec($curl);
        curl_close($curl);
        
        return $response;
    }
}