<?php

namespace App\Http\Controllers\Merchant;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\BusinessSegment\BusinessSegmentOrderSubscriptionRecord;

class OrderController extends Controller
{
    public function stepOne(){
        $merchant = get_merchant_id(false);
        return view('merchant.order.place-order.step-one',compact('merchant'));
    }
    
    public function MembershipOrderSubscriptionReport(){
        $merchant = get_merchant_id(false);
        $subscriptions = BusinessSegmentOrderSubscriptionRecord::with(['BusinessSegment', 'MembershipPlan','Order'])
    ->whereHas('BusinessSegment', function($q) use ($merchant) {
        $q->where('merchant_id', $merchant->id)
          ->where('order_based_on', 2);
    })
    ->where(function($query) {
        $query->where('is_purchased', 1)
              ->orWhere(function($q) {
                  $q->where('is_purchased', 2)
                    ->whereNotNull('order_id');
              });
    })
    ->get()
    ->groupBy('start_date_timestamp');
        // dd($subscriptions);
            
        return view('merchant.report.order-subscription-earning',compact('subscriptions'));
        
    }
}
