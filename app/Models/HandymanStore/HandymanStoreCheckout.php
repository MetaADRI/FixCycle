<?php

namespace App\Models\HandymanStore;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\HandymanStore\HandymanStoreCheckoutDetails;
use App\Models\HandymanStore\HandymanStore;
use App\Models\User;

class HandymanStoreCheckout extends Model
{
    use HasFactory;

    public function HandymanStore()
    {
        return $this->belongsTo(HandymanStore::class, 'handyman_store_id');
    }

    public function User()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function HandymanStoreCheckoutDetails()
    {
        return $this->hasMany(HandymanStoreCheckoutDetails::class, 'checkout_id');
    }

}
