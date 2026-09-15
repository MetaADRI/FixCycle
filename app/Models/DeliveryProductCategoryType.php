<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\App;

class DeliveryProductCategoryType extends Model
{
    protected $guarded = [];
    
    public function DeliveryProductType(){
        return $this->belongsTo(DeliveryProductType::class,'delivery_product_type_id');
    }
    
    public function DeliveryProduct(){
        return $this->belongsTo(DeliveryProduct::class,'delivery_product_id');
    }
    
    public function Merchant(){
        return $this->belongsTo(Merchant::class);
    }
}
