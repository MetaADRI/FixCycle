<?php
//
//namespace App\Http\Controllers\Helper;
//use App\Models\Merchant;
//use Illuminate\Http\Request;
//use App\Http\Controllers\Controller;
//
//class FireBaseController extends Controller
//{
//    //@ayush
//    //Firebase v2 update
//
//    public function getFireBaseAuthorization($merchant){
//        $file_path = "firebase/".$merchant->OneSignal->firebase_project_file;
//
//        try{
//            $credentialsFilePath = storage_path($file_path);
//            $client = new \Google_Client();
//            $client->setAuthConfig($credentialsFilePath);
//            $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
//            $client->refreshTokenWithAssertion();
//            $token = $client->getAccessToken();
//            return $token['access_token'];
//        }
//        catch(\Exception $e){
//            return $e->getMessage();
//        }
//    }
//
//
//    public function sendFireBaseNotifications($merchant_id, $player_ids, $fields){
//
//        try{
//
//            $merchant= Merchant::find($merchant_id);
//            $authorization  = "Bearer ".$this->getFireBaseAuthorization($merchant);
//
////            $topic = $merchant->alias_name.time();
////            $payload = [
////                "to" => "/topics/".$topic,
////                "registration_tokens" => $player_ids
////            ];
////
////            $curl = curl_init();
////
////            curl_setopt_array($curl, array(
////                CURLOPT_URL => 'https://iid.googleapis.com/iid/v1:batchAdd',
////                CURLOPT_RETURNTRANSFER => true,
////                CURLOPT_ENCODING => '',
////                CURLOPT_MAXREDIRS => 10,
////                CURLOPT_TIMEOUT => 0,
////                CURLOPT_FOLLOWLOCATION => true,
////                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
////                CURLOPT_CUSTOMREQUEST => 'POST',
////                CURLOPT_POSTFIELDS =>json_encode($payload),
////                CURLOPT_HTTPHEADER => array(
////                    'Content-Type: application/json',
////                    'Authorization: '.$authorization,
////                    'access_token_auth: true'
////                ),
////            ));
////
////            $response = curl_exec($curl);
////            curl_close($curl);
////
////            \Log::channel('firebase_notification')->emergency([
////                "from" => "( sendFireBaseNotifications ) Topic Created",
////                "payload"=> $payload,
////                "response"=> json_decode($response),
////                "time"=> \Carbon\Carbon::now("Asia/Kolkata"),
////            ]);
//
//            return $this->initiateNotifications($merchant,$topic, $fields, $authorization);
//        }
//        catch(\Exception $e){
//
//            \Log::channel('firebase_notification')->emergency([
//                "from" => "( sendFireBaseNotifications ) Exception : ".$e->getMessage(),
//                "payload"=> $payload,
//                "response"=> json_decode($response),
//                "time"=> \Carbon\Carbon::now("Asia/Kolkata"),
//            ]);
//
//            return $e->getMessage();
//        }
//
//    }
//
//
//    public function initiateNotifications($merchant, $topic, $feilds, $authorization){
//        $project_id = $merchant->OneSignal->firebase_project_id;
//        try{
//            $data = [
//                "message" => [
//                    "topic" => $topic,
//                    "notification"=>[
//                        'title'=>$feilds['title'],
//                        'body'=>$feilds['message'],
//                    ],
//                    'data' => [
//                        'title'=>$feilds['title'], //for android
//                        'data' => json_encode($feilds['body']), //for ios
//                        'body' => json_encode($feilds['body']), //for android
//                    ],
//                    "webpush" => [
//                        "headers" => [
//                            "Urgency" => "high"
//                        ],
//                        // "notification" => [
//                        //     "body" => $feilds['body'],
//                        //     "requireInteraction" => "true",
//                        //     "badge" => "/badge-icon.png"
//                        // ]
//                    ],
//                    'android' => [
//                        'notification' => [
//                            'click_action' => 'TOP_STORY_ACTIVITY',
//                        ]
//                    ],
//                    'apns' => [
//                        'payload' => [
//                            'aps' => [
//                                'category' => 'NEW_MESSAGE_CATEGORY'
//                            ]
//                        ]
//                    ]
//                ]
//            ];
//
//            $curl = curl_init();
//
//            curl_setopt_array($curl, array(
//                CURLOPT_URL => "https://fcm.googleapis.com/v1/projects/$project_id/messages:send",
//                CURLOPT_RETURNTRANSFER => true,
//                CURLOPT_ENCODING => '',
//                CURLOPT_MAXREDIRS => 10,
//                CURLOPT_TIMEOUT => 0,
//                CURLOPT_FOLLOWLOCATION => true,
//                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
//                CURLOPT_CUSTOMREQUEST => 'POST',
//                CURLOPT_POSTFIELDS =>json_encode($data),
//                CURLOPT_HTTPHEADER => array(
//                    'Authorization: '.$authorization,
//                    'Content-Type: application/json'
//                ),
//            ));
//
//            $response = curl_exec($curl);
//
//            curl_close($curl);
//
//            \Log::channel('firebase_notification')->emergency([
//                "from" => "( initiateNotifications ) Initiated Notification",
//                "url"=>"https://fcm.googleapis.com/v1/projects/$project_id/messages:send",
//                "payload"=> $data,
//                "response"=> json_decode($response),
//                "time"=> \Carbon\Carbon::now("Asia/Kolkata"),
//            ]);
//            return $response;
//        }
//        catch(\Exception $e){
//            \Log::channel('firebase_notification')->emergency([
//                "from" => "( initiateNotifications ) Exception ".$e->getMessage(),
//                "payload"=> $data,
//                "response"=> json_decode($response),
//                "time"=> \Carbon\Carbon::now("Asia/Kolkata"),
//            ]);
//            return $e->getMessage();
//        }
//
//    }
//}


namespace App\Http\Controllers\Helper;

use App\Models\Merchant;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class FireBaseController extends Controller
{
    // -------------------------------------------------------------
    // Generate Firebase OAuth Access Token
    // -------------------------------------------------------------
    public function getFireBaseAuthorization($merchant)
    {
        $file_path = "firebase/" . $merchant->OneSignal->firebase_project_file;

        try {
            $credentialsFilePath = storage_path($file_path);
            $client = new \Google_Client();
            $client->setAuthConfig($credentialsFilePath);
            $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
            $client->refreshTokenWithAssertion();
            $token = $client->getAccessToken();
            return $token['access_token'];
        } catch (\Exception $e) {
            return $e->getMessage();
        }
    }

    // -------------------------------------------------------------
    // FIXED: Send Notifications - FCM v1 (NO TOPIC REGISTRATION!)
    // -------------------------------------------------------------
    public function sendFireBaseNotifications($merchant_id, $player_ids, $fields)
    {
        try {
            $merchant = Merchant::find($merchant_id);
            $authorization = "Bearer " . $this->getFireBaseAuthorization($merchant);

            // call FCM v1 send
            return $this->initiateNotifications($merchant, $player_ids, $fields, $authorization);

        } catch (\Exception $e) {

            \Log::channel('firebase_notification')->emergency([
                "from" => "( sendFireBaseNotifications ) Exception",
                "error" => $e->getMessage(),
                "time" => \Carbon\Carbon::now("Asia/Kolkata")->format("y-m-d H:i:s"),
            ]);

            return $e->getMessage();
        }
    }

    // -------------------------------------------------------------
    // FIXED: Real FCM v1 message send (multicast)
    // -------------------------------------------------------------
    public function initiateNotifications($merchant, $player_ids, $fields, $authorization)
    {
        $project_id = $merchant->OneSignal->firebase_project_id;

        try {
            $responses = [];

            foreach ($player_ids as $token) {

                $data = [
                    "message" => [
                        "token" => $token,
                        "notification" => [
                            "title" => $fields['title'],
                            "body" => $fields['message'],
                        ],
                        "data" => [
                            "title" => $fields['title'],
                            "body" => json_encode($fields['body']),
                        ],
                        "android" => [
                            "notification" => [
                                "click_action" => "TOP_STORY_ACTIVITY"
                            ]
                        ],
                        "apns" => [
                            "payload" => [
                                "aps" => [
                                    "category" => "NEW_MESSAGE_CATEGORY"
                                ]
                            ]
                        ]
                    ]
                ];

                $curl = curl_init();

                curl_setopt_array($curl, [
                    CURLOPT_URL => "https://fcm.googleapis.com/v1/projects/$project_id/messages:send",
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_POST => true,
                    CURLOPT_POSTFIELDS => json_encode($data),
                    CURLOPT_HTTPHEADER => [
                        "Authorization: $authorization",
                        "Content-Type: application/json"
                    ],
                ]);

                $response = curl_exec($curl);
                curl_close($curl);

                $responses[] = json_decode($response);

                \Log::channel('firebase_notification')->info([
                    "from" => "( initiateNotifications ) Sent to: $token",
                    "payload" => $data,
                    "response" => json_decode($response),
                    "time" => \Carbon\Carbon::now("Asia/Kolkata")->format("y-m-d H:i:s"),
                ]);
            }

            return $responses;

        } catch (\Exception $e) {

            \Log::channel('firebase_notification')->emergency([
                "from" => "( initiateNotifications ) Exception",
                "error" => $e->getMessage(),
                "time" => \Carbon\Carbon::now("Asia/Kolkata")->format("y-m-d H:i:s"),
            ]);

            return $e->getMessage();
        }
    }
}
