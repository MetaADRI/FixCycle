<?php

namespace App\Models\BusinessSegment;

use App\Models\MerchantMembershipPlan;
use Illuminate\Database\Eloquent\Model;
use App\Models\Segment;
use App\Models\PaymentMethod;

class BusinessSegmentOrderSubscriptionRecord extends Model
{
    protected $guarded = [];

    public function BusinessSegment(){
        return $this->belongsTo(BusinessSegment::class,'business_segment_id');
    }
    public function Segment(){
        return $this->belongsTo(Segment::class,'segment_id');
    }
    public function MembershipPlan(){
        return $this->belongsTo(MerchantMembershipPlan::class,'membership_plan_id');
    }
    public function PaymentMethod(){
        return $this->belongsTo(PaymentMethod::class,'payment_method_id');
    }
    public function Order(){
        return $this->belongsTo(Order::class,'order_id');
    }
}