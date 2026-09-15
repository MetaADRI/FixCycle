<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use App;
use App\Models\BusinessSegment\BusinessSegment; 
use App\Models\BusinessSegment\Order; 
use App\Models\BusinessSegment\BusinessSegmentOrderSubscriptionRecord; 

class MerchantMembershipPlan extends Model
{
    protected $guarded = [];
    public function Merchant()
    {
        return $this->belongsTo(Merchant::class);
    }
    public function LanguageMerchantMembershipPlanAny()
    {
        return $this->hasOne(LanguageMerchantMembershipPlan::class,'merchant_membership_plan_id');
    }
    public function LanguageMerchantMembershipPlanSingle()
    {
        return $this->hasOne(LanguageMerchantMembershipPlan::class,'merchant_membership_plan_id')->where([['locale', '=', App::getLocale()]]);
    }
    public function getPlanTitleAttribute()
    {
        if (empty($this->LanguageMerchantMembershipPlanSingle)) {
            return !empty($this->LanguageMerchantMembershipPlanAny) ? $this->LanguageMerchantMembershipPlanAny->plan_title : "";
        }
        return $this->LanguageMerchantMembershipPlanSingle->plan_title;
    }
    public function getPlanNameAttribute()
    {
        if (empty($this->LanguageMerchantMembershipPlanSingle)) {
            return !empty($this->LanguageMerchantMembershipPlanAny) ? $this->LanguageMerchantMembershipPlanAny->plan_name : "";
        }
        return $this->LanguageMerchantMembershipPlanSingle->plan_name;
    }
    public function getDescriptionAttribute()
    {
        if (empty($this->LanguageMerchantMembershipPlanSingle)) {
            return !empty($this->LanguageMerchantMembershipPlanAny) ? $this->LanguageMerchantMembershipPlanAny->description : "";
        }
        return $this->LanguageMerchantMembershipPlanSingle->description;
    }

    public function SubscriptionMembershipPlanExpiryCheck($order,$string_file = NULL){
            $user = $order->User;
            $business_segment_id = $order->business_segment_id;
            $bs = BusinessSegment::find($business_segment_id);
            $membershipPlanId = "";
            if($bs->order_based_on == 2){
                $membershipPlanId = $bs->membership_plan_id;
                $storePlan = MerchantMembershipPlan::find($membershipPlanId);
                if(isset($bs->subscription_expired) && $bs->subscription_expired == 1){
                    $subscriptionDate = $bs->subscription_date_timestamp;
                    if($storePlan->plan_type == 1){
                        // return $this->failedResponse(trans("$string_file.subscription_time_expired"));
                        // return false;
                    }elseif($storePlan->plan_type == 2){
                        $all_orders = Order::select('id','business_segment_id','merchant_id','service_time_slot_detail_id','order_timestamp','country_area_id','driver_id','order_status','segment_id','user_id','order_date')
                            ->whereIn('order_status', [1])->where('merchant_id',$user->merchant_id)->where('order_timestamp','>',$subscriptionDate)->get();
                        if($storePlan->number_of_order && count($all_orders) > $storePlan->number_of_order){
                            // return $this->failedResponse(trans("$string_file.subscription_order_expired"));
                            // return false;
                        }else{
                            // return $this->failedResponse(trans("$string_file.subscription_time_expired"));
                            // return false;
                        }
                    }
                }else{
                    $period = $storePlan->period;
                    $subscriptionDate = $bs->subscription_date_timestamp;
                    $date = \Carbon\Carbon::createFromTimestamp($subscriptionDate);
                    $expiryDateForSubscription = date('Y-m-d H:i:s', $date->addDays($period)->timestamp);
                    if(!empty($subscriptionDate)){
                        $all_orders = Order::select('id','business_segment_id','merchant_id','service_time_slot_detail_id','order_timestamp','country_area_id','driver_id','order_status','segment_id','user_id','order_date')
                            ->whereIn('order_status', [11])->where('merchant_id',$user->merchant_id)->where('business_segment_id',$bs->id)->where('order_timestamp','>',$subscriptionDate)->get();
                        if($storePlan->plan_type == 2 && $storePlan->number_of_order !=0 && count($all_orders) >= $storePlan->number_of_order){
                            $bs->subscription_expired = 1;
                            $bs->save();
                            // return false;
                            // return $this->failedResponse(trans("$string_file.subscription_order_expired"));
                        }elseif($expiryDateForSubscription < \Carbon\Carbon::now()->toDateTimeString()){
                            $bs->subscription_expired = 1;
                            $bs->save();
                            // return false;
                            // return $this->failedResponse(trans("$string_file.subscription_order_expired"));
                        }
                    }else{
                        // return false;
                        // return $this->failedResponse(trans("$string_file.purchase_subscription"));
                    }
                    
                        $bsOrderMembershipRecords = new BusinessSegmentOrderSubscriptionRecord();
                        $bsOrderMembershipRecords->business_segment_id = $business_segment_id;
                        $bsOrderMembershipRecords->membership_plan_id = $membershipPlanId;
                        $bsOrderMembershipRecords->segment_id = $order->segment_id;
                        $bsOrderMembershipRecords->payment_method_id = $order->payment_method_id;
                        $bsOrderMembershipRecords->subscription_fee = $storePlan->price;
                        $bsOrderMembershipRecords->order_id = $order->id;
                        $bsOrderMembershipRecords->order_count = count($all_orders);
                        $bsOrderMembershipRecords->is_purchased = 2;
                        $bsOrderMembershipRecords->store_earning = $order->final_amount_paid;
                        $bsOrderMembershipRecords->start_date_timestamp = $subscriptionDate;
                        $bsOrderMembershipRecords->end_date_timestamp = $bs->subscription_expired == 1 ? time() : "";
                        $bsOrderMembershipRecords->expired = $bs->subscription_expired == 1 ? 1 : 2;
                        $bsOrderMembershipRecords->save();
                }
            }
    }
}