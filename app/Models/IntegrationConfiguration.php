<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Redis;

class IntegrationConfiguration extends Model
{
    protected $guarded = [];

    public static function IntegrationConfigFromRedis($merchant_id)
    {
        $data = Redis::hgetall("integration_configuration:$merchant_id");

        if (!empty($data)) {
            return (new static)->newFromBuilder($data);
        }

        $dbConfig = static::where('merchant_id', $merchant_id)->first();

        if ($dbConfig) {
            Redis::hmset("integration_configuration:$merchant_id", $dbConfig->toArray());
            return $dbConfig;
        }

        return null;
    }
}
