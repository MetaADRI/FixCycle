<?php

namespace App\Models\HandymanStore;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\HandymanStore\HandymanStoreCheckout;
use App\Models\HandymanStore\HandymanStore;
use App\Models\SegmentPriceCardDetail;
use App\Models\ServiceType;

class HandymanStoreCheckoutDetails extends Model
{
    use HasFactory;

    public function HandymanStore()
    {
        return $this->belongsTo(HandymanStore::class, 'handyman_store_id');
    }

    public function HandymanStoreCheckout()
    {
        return $this->belongsTo(HandymanStoreCheckout::class, 'checkout_id');
    }

    public function ServiceType()
    {
        return $this->belongsTo(ServiceType::class, 'service_type_id');
    }

    public function SegmentPriceCardDetail()
    {
        return $this->belongsTo(SegmentPriceCardDetail::class, 'segment_price_card_detail_id');
    }
}
