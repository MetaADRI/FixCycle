<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use Illuminate\Http\Request;
use App\Models\HandymanStore\HandymanStore;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Validation\ValidationException;
use Illuminate\Foundation\Auth\AuthenticatesUsers;
use Lang;
use URL;


class HandymanStoreLoginController extends Controller
{
    // @ayush

    use AuthenticatesUsers;   //sendFailedLoginResponse method

    public function __construct()
    {
        $this->middleware('guest:handyman_store')->except('logout');;
    }


    public function logout()
    {
        // clear locale sessions
        Session::flush();
        $alias_name = Auth::user('handyman_store')->alias_name;
        $merchant_alias_name = Auth::user('handyman_store')->merchant->alias_name;
        Auth::guard('handyman_store')->logout();
        return redirect()->route('handyman_store.login', [$merchant_alias_name, $alias_name]);
    }

    public function showLoginForm($merchant_alias = null, $handyman_alias = null)
    {
        $valid_corporate = HandymanStore::where([['alias_name', '=', $handyman_alias], ['status', TRUE]])->first();
        $valid_merchant = Merchant::where([['alias_name', '=', $merchant_alias], ['merchantStatus', TRUE]])->first();
        if ($valid_corporate && !empty($valid_merchant)) {
            setS3Config($valid_merchant);
            return view('handyman-store.login', ['merchant' => $valid_merchant, 'handyman_store' => $valid_corporate]);
        } else {
            abort(404);
        }
    }


    public function login(Request $request)
    {
        $url_pattern = array_slice(explode('/', URL::previous()), -3, 1);
        $merchant_info = Merchant::where([['alias_name', '=', $url_pattern[0]]])->first();
        //Validate the form data
        $this->validate($request, [
            'email' => 'required|email',
            'password' => 'required|min:5'
        ]);

        // if below guards are opened in same tab then first logout them
        if (Auth::guard('merchant')->check()) {
            throw ValidationException::withMessages([
                $this->username() => [trans("auth.merchant_guard_conflict")],
            ]);
        } elseif (Auth::guard('taxicompany')->check()) {
            throw ValidationException::withMessages([
                $this->username() => [trans("auth.company_guard_conflict")],
            ]);
        } elseif (Auth::guard('hotel')->check()) {
            throw ValidationException::withMessages([
                $this->username() => [trans("auth.hotel_guard_conflict")],
            ]);
        } elseif (Auth::guard('business-segment')->check()) {
            throw ValidationException::withMessages([
                $this->username() => [trans("auth.bs_guard_conflict")],
            ]);
        }
        elseif (Auth::guard('corporate')->check()) {
            throw ValidationException::withMessages([
                $this->username() => [trans("auth.bs_guard_conflict")],
            ]);
        }
//        dd(['email' => $request->email, 'password' => $request->password, 'merchant_id' => $merchant_info->id, 'status' => 1], $request->remember);
        //Attempt the user log in
        if (Auth::guard('handyman_store')->attempt(['email' => $request->email, 'password' => $request->password, 'merchant_id' => $merchant_info->id, 'status' => 1], $request->remember)) {
            return redirect()->intended(route('handyman-store.dashboard'));
            //$this->sendLoginResponse($request);
        }
        //return redirect()->back()->withInput($request->only('email','remember'));
        $this->sendFailedLoginResponse($request);
    }


}
