<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\App;

class DeliveryProductType extends Model
{
    protected $guarded = [];
    protected $hidden = ['LanguageAny', 'LanguageSingle'];

    public function LanguageAny()
    {
        return $this->hasOne(LanguageDeliveryProductType::class);
    }

    public function LanguageSingle()
    {
        return $this->hasOne(LanguageDeliveryProductType::class)->where([['locale', '=', App::getLocale()]]);
    }

    public function getCategoryNameAttribute()
    {
        if (empty($this->LanguageSingle)) {
            return $this->LanguageAny->category_name;
        }
        return $this->LanguageSingle->category_name;
    }

    public function Merchant(){
        return $this->belongsTo(Merchant::class);
    }

    public function categories()
    {
        return $this->hasMany(DeliveryProductCategoryType::class,'delivery_product_type_id');
    }
}
