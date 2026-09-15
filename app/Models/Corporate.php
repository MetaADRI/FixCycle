<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use DB;
use App;

class Corporate extends Authenticatable
{
    protected $table = 'corporates';
    protected $guarded = [];

    protected $hidden = [
        'password', 'remember_token', 'pivot',
    ];

    public function Merchant()
    {
        return $this->belongsTo(Merchant::class);
    }

    public function Country()
    {
        return $this->belongsTo(Country::class);
    }

    public function CorporateSettlementLogs()
    {
        return $this->hasMany(CorporateSettlementLog::class);
    }

    public function hasReachedBillingCreditLimit(){
        $billing_credits_used = CorporateInvoice::where([["corporate_id", $this->id], ["status", 2]])->sum('settlement_amount');
        return $billing_credits_used >= $this->billing_credit_limit;
    }

    public function Booking()
    {
        return $this->hasMany(Booking::class);
    }
    public function Department()
    {
        return $this->hasMany(Department::class);
    }
}
