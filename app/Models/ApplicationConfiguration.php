<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Redis;

class ApplicationConfiguration extends Model
{
    protected $guarded = [];

    public static function AppConfigFromRedis($merchant_id)
    {
        $data = Redis::hgetall("application_configuration:$merchant_id");

        if (!empty($data)) {
            return (new static)->newFromBuilder($data);
        }

        $dbConfig = static::where('merchant_id', $merchant_id)->first();

        if ($dbConfig) {
            Redis::hmset("application_configuration:$merchant_id", $dbConfig->toArray());
            return $dbConfig;
        }

        return null;
    }
}
