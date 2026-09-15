<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Redis;

class BookingConfiguration extends Model
{
    protected $guarded = [];

    public static function BookingConfigFromRedis($merchant_id)
    {
        $data = Redis::hgetall("booking_configuration:$merchant_id");

        if (!empty($data)) {
            return (new static)->newFromBuilder($data);
        }

        $dbConfig = static::where('merchant_id', $merchant_id)->first();

        if ($dbConfig) {
            Redis::hmset("booking_configuration:$merchant_id", $dbConfig->toArray());
            return $dbConfig;
        }

        return null;
    }
}
