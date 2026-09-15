<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Redis;

class Configuration extends Model
{
    protected $guarded = [];
    
    public function Merchant()
    {
        return $this->belongsTo(Merchant::class);
    }

    public static function ConfigFromRedis($merchant_id)
    {
        $data = Redis::hgetall("configuration:$merchant_id");

        if (!empty($data)) {
            return (new static)->newFromBuilder($data);
        }

        $dbConfig = static::where('merchant_id', $merchant_id)->first();

        if ($dbConfig) {
            Redis::hmset("configuration:$merchant_id", $dbConfig->toArray());
            return $dbConfig;
        }

        return null;
    }
}
