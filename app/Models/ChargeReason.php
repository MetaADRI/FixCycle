<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App;

class ChargeReason extends Model
{
    use HasFactory;

    protected $hidden = array('LanguageSingle', 'LanguageAny');

    protected $guarded = [];

    public function LanguageAny()
    {
        return $this->hasOne(LanguageChargeReason::class);
    }

    public function LanguageSingle()
    {
        return $this->hasOne(LanguageChargeReason::class)->where([['locale', '=', App::getLocale()]]);
    }

    public function getReasonAttribute()
    {
        if (empty($this->LanguageSingle)) {
            return $this->LanguageAny->description;
        }
        return $this->LanguageSingle->description;
    }
}
