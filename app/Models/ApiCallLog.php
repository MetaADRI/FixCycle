<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApiCallLog extends Model
{
    protected $table = 'api_call_logs';

    protected $fillable = [
        'merchant_id',
        'booking_id',
        'order_id',
        'api_slug',
        'call_count'
    ];

    protected $casts = [
        'call_count' => 'integer',
    ];
}