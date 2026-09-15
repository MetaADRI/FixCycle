<?php
namespace App\Http\Controllers\Integrations;
use App\Http\Controllers\Controller;
use App\Traits\DriverTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SapoApiController extends Controller
{
    use DriverTrait;

    protected $payload;
    protected $config;
    protected $headers;

    public function __construct($data)
    {
        $this->payload = $data;
        $this->config  = $this->payload['config'];

        $this->headers = [
            'Content-Type: application/json',
            'Authorization: ' . ($this->config['authorization'] ?? '5a9f970c-c5a4-4642-bd88-4d65216adb1b'),
        ];

        $calling_for = $this->payload['calling_for'];
        switch ($calling_for) {
            case 'TRACKING_NO_WITH_LODGE':
                $this->trackingWithLodgeData($this->payload, $this->headers);
                break;
            case 'FINAL_TRACKING':
                $this->deliveredBooking($this->payload, $this->headers);
                break;
        }
    }

    //genrate token with lodge api 
    public function trackingWithLodgeData($payload, $headers)
    {
        $request  = $payload['request'];   
        $booking  = $payload['booking'];
        $first_name = $booking->User->first_name;
        $bookingDeliveryDetail = $booking->BookingDeliveryDetails;
        $receiver_name = $bookingDeliveryDetail->receiver_name;
        
        $jsonData = $bookingDeliveryDetail->product_data;
        $decodedData = json_decode($jsonData, true);
        $totalQuantity = number_format(array_sum(array_column($decodedData, 'quantity')),2);
        
        $genUrl      = 'http://apitst.postoffice.co.za:443/api/trn-manager/gen';
        $genToken    = $this->config['api_key'];

        $genHeaders = [
            'Content-Type: application/json',
            'Authorization: ' . $genToken,
        ];

        $genPayload = [
            'cust_ref' => 'ORDER_'.time()
        ];

        $genResponse = $this->makeCurlRequest($genUrl, $genPayload, $genHeaders);

        if (!$genResponse['success']) {
            \Log::channel('integration_logger')->emergency([
                "Integration_type" => "SAPO_API_ERROR_TOKEN",
                "merchant_id" => $booking->merchant_id,
                'url'      => $genUrl,
                'payload'  => $genPayload,
                'response' => $genResponse
            ]);
            
            throw new \Exception('SAPO tracking number generation failed: ' . $genResponse['error']);
        }

        $genData     = $genResponse['data'];
        $sapoRefNum  = $genData['sapo_ref_num'] ?? null;
        $custRefNum  = $genData['cust_ref_num '] ?? null; // note: API returns trailing space in key

        if (empty($sapoRefNum)) {
            throw new \Exception('SAPO tracking number (sapo_ref_num) not found in response.');
        }

        \Log::channel('integration_logger')->emergency([
                "Integration_type" => "SAPO_API_TOKEN",
                "merchant_id" => $booking->merchant_id,
                'cust_ref_num' => $custRefNum,
                'sapo_ref_num' => $sapoRefNum,
        ]);

        $lodgeUrl   = 'http://apitst.postoffice.co.za:8084/IPSAPIService/ImportService.svc/rest/Mailitem';
        $lodgeToken = $this->config['auth_token'];

        $lodgeHeaders = [
            'Content-Type: application/json',
        ];

        $lodgePayload = [
            'ItemId'          => $sapoRefNum,
            'ItemWeight'      => $totalQuantity,
            'ClassCd'         => 'C',
            'Content'         => 'M',
            'OperatorCd'      => 'ZAA',
            'OrigCountryCd'   => 'ZA',
            'DestCountryCd'   => 'ZA',
            'PostalStatusFcd' => 'MINL',
            'Addressee'       => [
                'Name'     => $first_name,
                'Address'  => $booking['drop_location'] ?? null,
                'City'     => "",
                'Postcode' => "",
                'Country'  => 'ZA',
            ],
            'Sender' => [
                'Name'     =>  $receiver_name,
                'Address'  => $booking['pickup_location'] ?? null,
                'City'     => "",
                'Postcode' => "",
                'Country'  => 'ZA',
            ],
            'ItemEvents' => [
                [
                    'TNCd'        => '78',
                    'Date'        => Carbon::now()->format('Y-m-d\TH:i:s'),
                    'OfficeCd'    => 'ZA60004',
                    'UserFID'     => '09690510',
                    'ConditionCd' => '30',
                ],
            ],
        ];

        $fullLodgeUrl = $lodgeUrl . '?token=' . $lodgeToken;
        $lodgeResponse = $this->makeCurlRequest($fullLodgeUrl, $lodgePayload, $lodgeHeaders);
        if (!$lodgeResponse['success']) {
            \Log::channel('integration_logger')->emergency([
                    "Integration_type" => "SAPO_API_ERROR_LODGE",
                    "merchant_id" => $booking->merchant_id,
                    'url'      => $fullLodgeUrl,
                    'payload'  => $lodgePayload,
                    'response' => $lodgeResponse,
            ]);
            throw new \Exception('SAPO mail item lodge failed: ' . $lodgeResponse['error']);
        }
        
        \Log::channel('integration_logger')->emergency([
            "Integration_type" => "SAPO_API_LODGE",
            "merchant_id" => $booking->merchant_id,
             'sapo_ref_num' => $sapoRefNum,
            'response'     => $lodgeResponse['data'],
        ]);
        $data = [
            'tracking_number' => $sapoRefNum,
            'cust_ref_num'    => $custRefNum,
            'gen_response'    => $genData,
            'lodge_response'  => $lodgeResponse['data'],
        ];
        
        $bookingDeliveryDetail->sapo_info = json_encode($data);
        $bookingDeliveryDetail->save();
    }

    public function deliveredBooking($payload, $headers)
    {
        $request     = $payload['request'];
        $booking     = $payload['booking'];
        $bookingDeliveryDetail = $booking->BookingDeliveryDetails;
        $sapo_info = isset($bookingDeliveryDetail['sapo_info']) ? json_decode($bookingDeliveryDetail['sapo_info']) : NULL;
        $trackingNumber = $sapo_info ?? $sapo_info['tracking_number'] ?? null;
    
        if (empty($trackingNumber)) {
            throw new \Exception('SAPO tracking number not found for delivery tracking.');
        }
    
        $trackUrl   = 'http://apitst.postoffice.co.za:8084/IPSAPIService/TrackAndTraceService.svc/rest/Mailitems';
        $trackToken = $this->config['auth_token'];
    
        $fullTrackUrl = $trackUrl . '?' . http_build_query([
            'ids'   => $trackingNumber,
            'lang'  => 'EN',
            'token' => $trackToken,
        ]);
    
        $trackHeaders = [
            'Content-Type: application/json',
        ];
    
        $trackResponse = $this->makeCurlGetRequest($fullTrackUrl, $trackHeaders);
    
        if (!$trackResponse['success']) {
            \Log::channel('integration_logger')->emergency([
                "Integration_type" => "SAPO_API_TRACK_ERROR",
                "merchant_id" => $booking->merchant_id,
                'url'      => $fullTrackUrl,
                'response' => $trackResponse,
            ]);
            throw new \Exception('SAPO tracking failed: ' . $trackResponse['error']);
        }
        \Log::channel('integration_logger')->emergency([
            "Integration_type" => "SAPO_API_TRACK",
            "merchant_id" => $booking->merchant_id,
            'tracking_number' => $trackingNumber,
            'response'        => $trackResponse['data'],
        ]);
    
        return [
            'tracking_number'  => $trackingNumber,
            'track_response'   => $trackResponse['data'],
        ];
    }

    private function makeCurlGetRequest(string $url, array $headers): array
    {
        $ch = curl_init();
    
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPGET        => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
    
        $response  = curl_exec($ch);
        $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
    
        if ($curlError) {
            return [
                'success' => false,
                'error'   => $curlError,
                'data'    => null,
            ];
        }
    
        $decoded = json_decode($response, true);
        if ($httpCode < 200 || $httpCode >= 300) {
            return [
                'success'   => false,
                'error'     => 'HTTP ' . $httpCode . ': ' . $response,
                'http_code' => $httpCode,
                'data'      => $decoded,
            ];
        }
    
        return [
            'success'   => true,
            'error'     => null,
            'http_code' => $httpCode,
            'data'      => $decoded,
        ];
    }

    
    private function makeCurlRequest(string $url, array $payload, array $headers): array
    {
        
        $ch = curl_init();

        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => false, // set true in production with proper cert
        ]);

        $response   = curl_exec($ch);
        $httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError  = curl_error($ch);
        curl_close($ch);
        if ($curlError) {
            return [
                'success' => false,
                'error'   => $curlError,
                'data'    => null,
            ];
        }

        $decoded = json_decode($response, true);
        if ($httpCode < 200 || $httpCode >= 300) {
            return [
                'success'   => false,
                'error'     => 'HTTP ' . $httpCode . ': ' . $response,
                'http_code' => $httpCode,
                'data'      => $decoded,
            ];
        }

        return [
            'success'   => true,
            'error'     => null,
            'http_code' => $httpCode,
            'data'      => $decoded,
        ];
    }
}