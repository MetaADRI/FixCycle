<?php

namespace App\Models;

use App\Models\SearchablePlace;
use Illuminate\Notifications\Notifiable;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Passport\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Model;

class MerchantPaymentMethodSegment extends Model
{
    protected $table = 'merchant_payment_method_segments';
    protected $fillable = [
        'merchant_id', 'payment_method_id', 'segment_id'
    ];
    // public $timestamps = true;
    
}