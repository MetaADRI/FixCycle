<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Model;

class UtilityTransaction extends Model
{
    
    protected $fillable = [
    'payment_method_id',
    'payment_status',
    'product',
    'cell',
    'trans_id',
    'transaction_status',
    'ext_txn_no',
    'details',
    'merchant_id',
    'user_id',
    'amount',
    'trans_date_time',
    'trans_resp',
    'trans_cur_status',
    'msg',

];

protected $casts = [
    'details' => 'array'
];
}