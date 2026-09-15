<?php

namespace App\Models\BusinessSegment;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductAvailabilityTimeSlab extends Model
{
    use HasFactory;

    public function ProductAvailabilityTimeSlabPrice()
    {
        return $this->hasMany( ProductAvailabilityTimeSlabPrice::class, 'product_availability_time_slab_id' );
    }


    public function LanguageAny()
    {
        return $this->hasOne(LanguageProductAvailabilityTimeSlab::class);
    }

    public function LanguageSingle()
    {
        return $this->hasOne(LanguageProductAvailabilityTimeSlab::class)->where([['locale', '=', \App::getLocale()]]);
    }

    public function getNameAttribute()
    {
        if (empty($this->LanguageSingle)) {
            return $this->LanguageAny->name;
        }
        return $this->LanguageSingle->name;
    }

}
