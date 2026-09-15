<?php

namespace App\Models\HandymanStore;

use App\Models\Merchant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HandymanStoreWalletTransaction extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function HandymanStore(){
        return $this->belongsTo(HandymanStore::class);
    }

    public function ActionMerchant()
    {
        return $this->belongsTo(Merchant::class, "action_merchant_id");
    }
}
