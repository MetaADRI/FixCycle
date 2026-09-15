<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App;

class Page extends Model
{
    protected $guarded = [];
    
    public function LanguageAny($merchant_id)
    {
        return $this->hasOne(LanguagePage::class)->where([['merchant_id', '=',$merchant_id]]);
    }

    public function LanguageSingle($merchant_id)
    {
        return $this->hasOne(LanguagePage::class)->where([['locale', '=', App::getLocale()],['merchant_id', '=',$merchant_id]]);
    }

    public function LanguagePages()
    {
        return $this->hasMany(LanguagePage::class, 'page_id'); 
    }

    public function Name($merchant_id = null)
    {
        return $this->LanguageSingle($merchant_id)->value('name')
            ?? $this->LanguageAny($merchant_id)->value('name')
            ?? '';
    }
}
