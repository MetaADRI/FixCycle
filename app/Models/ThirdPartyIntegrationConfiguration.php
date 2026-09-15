<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThirdPartyIntegrationConfiguration extends Model
{
    protected $guarded =[];

    public function Merchant()
    {
        return $this->belongsTo(Merchant::class);
    }

    public function ThirdPartyIntegration(){
        return $this->belongsTo(ThirdPartyIntegration::class,'third_party_integration_id');
    }
}
