<?php

namespace App\Http\Middleware;

use App\Http\Controllers\Helper\PolygenController;
use Closure;

class ValidUser
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request $request
     * @param  \Closure $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        $user = $request->user('api');
        $country_area_id = NULL;
        if ($user->UserStatus == 2 || $user->user_delete == 1) {
            return response()->json(['version' => 'NA','result' => "999", 'message' => "unauthorised request", 'data' => []]);
        }
//        if (!empty($request->user('api')->CountryArea) && in_array($request->user('api')->CountryArea->timezone, \DateTimeZone::listIdentifiers())) {
//            date_default_timezone_set($request->user('api')->CountryArea->timezone);
//        }
        $request->request->add([
            'merchant_id' => $user->merchant_id,
        ]);

        if($user->id == 135590 || $user->id == 136654 || $user->id == 74440 || $user->id == 79221 || $user->id == 79348 || $user->id == 135585 || $user->id == 135440 || $user->id == 140499 || $user->id == 132432 || $user->id == 133324 || $user->id == 130221){
            $data = [
                "endpoint" => basename($request->server('REQUEST_URI')),
                "ip" => $request->server('REMOTE_ADDR'),
                "user_agent" => $request->server('HTTP_USER_AGENT'),
                "request_time" => $request->server('REQUEST_TIME'),
            ];
            LogApiRequest($user->merchant_id, "USER", $user->id, $data);
        }
        return $next($request);
    }
}
