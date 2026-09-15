<?php
/**
 * Created by PhpStorm.
 * User: apporio
 * Date: 1/11/23
 * Time: 2:01 PM
 */

namespace App\Http\Resources;

use App\Http\Controllers\Helper\BookingDataController;
use App\Traits\MerchantTrait;
use Illuminate\Http\Resources\Json\JsonResource;
// use App\Models\BusPriceCard;
// use App\Models\BusRouteMapping;
// use App\Models\Bus;
use App\Models\CountryArea;
use DB;

class HandymanStoreCheckoutResource extends JsonResource
{
    use MerchantTrait;

    public function toArray($data)
    {
        $string_file = $this->getStringFile(NULL, $this->User->Merchant);
        $currency = $this->User->Country->isoCode;
        $bill_details = [];
        $checkout_details = $this->HandymanStoreCheckoutDetails;

        $amount =0;
        $services = [];
        foreach($checkout_details  as $service){
            $services[] = [
                'name' => $service->ServiceType->HandymanStoreServiceName($this->HandymanStore->id),
                'value' => $currency . ' ' . sprintf("%.2f", $service->price),
                'image' => "",
                'quantity' => $service->quantity
            ];
            $amount = $amount+$service->total_amount;
        }
        $total_amount = [
            'name' => trans("$string_file.total"),
            'value' => $currency .' ' . sprintf("%.2f", $amount),
            'bold' => false,
        ];

        array_push($bill_details, $total_amount);

        $tax = [
            'name' => trans("$string_file.tax"),
            'value' => $currency .' ' . sprintf("%.2f", $this->tax),
            'bold' => false,
        ];
        array_push($bill_details, $tax);

        if(!empty($this->discount_amount)){
            $discount = [
                'name' => trans("$string_file.discount"),
                'value' => $currency .' ' . sprintf("%.2f", $this->discount_amount),
                'bold' => false,
            ];
            array_push($bill_details, $discount);

            $this->estimate_amount = $this->estimate_amount-$this->discount_amount;
        }

        $total = [
            'name' => trans("$string_file.total_charges"),
            'value' => $currency . ' ' . sprintf("%.2f", $this->estimate_amount),
            'bold' => true,
        ];
        array_push($bill_details, $total);

        $paymentMethods = $this->HandymanStore->CountryArea->PaymentMethod;
        $bookingData = new BookingDataController();
        $payment_methods = $bookingData->PaymentOption($paymentMethods, $this->user_id, $currency, 0, $this->total_amount);

        return array(
            "booking_details" => array(
                "id" => $this->id,
                "amount" => isset( $this->total_amount) ? $currency." ".sprintf("%.2f", $this->total_amount) : "",
                "date" => date("Y-m-d", strtotime($this->created_at)),
                "time" => isset($this->ServiceTimeSlotDetail) ? $this->ServiceTimeSlotDetail->slot_time_text : "",
                'tax'=> $currency." " .isset($this->tax)? $this->tax : "",
                "total_amount_with_tax" => $currency." ". isset($this->estimate_amount) ?$currency." ".sprintf("%.2f", $this->estimate_amount) : "",
            ),
            "service_details" => $services,
            "bill_details" => $bill_details,
            "payment_methods" => $payment_methods
        );
    }
}
