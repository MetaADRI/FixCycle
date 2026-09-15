<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThirdPartyIntegration extends Model
{
   protected $guarded = [];

    public function ThirdPartyIntegrationConfiguration($merchant_id){
        return $this->hasOne(ThirdPartyIntegrationConfiguration::class)->where('merchant_id', $merchant_id);
    }
}
