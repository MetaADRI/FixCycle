<?php

namespace App\Models\HandymanStore;

use App\Models\HandymanStore\HandymanStore;
use App\Models\Merchant;
use Illuminate\Database\Eloquent\Model;

class HandymanStoreCashout extends Model
{
    protected $guarded = [];

    public function HandymanStore(){
        return $this->belongsTo(HandymanStore::class);
    }

    public function Merchant(){
        return $this->belongsTo(Merchant::class);
    }
}
