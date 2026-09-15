<?php

namespace App\Http\Controllers\StripeConnect;

use App\Models\Driver;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Controllers\PaymentSplit\StripeConnect;
use Stripe\Stripe;
use Stripe\Account;
use Stripe\Token;
use Stripe\Customer;
use Stripe\PaymentMethod;
use App\Models\Merchant;
use App\Models\PaymentOption;
use App\Models\PaymentOptionsConfiguration;

class StripeController extends Controller
{
    public function set_api_key($merchant_id, $return_key_only = false)
    {
        $stripe_api_key = null;
        $merchant = Merchant::findOrFail($merchant_id);
        if (isset($merchant->Configuration->stripe_connect_enable) && $merchant->Configuration->stripe_connect_enable == 1) {
            $payment_option = PaymentOption::where('slug', 'STRIPE')->first();
            $paymentoption = PaymentOptionsConfiguration::where([['merchant_id', '=', $merchant->id], ['payment_option_id', '=', $payment_option->id]])->first();
            if (!$paymentoption) {
                throw new \Exception("Configuration not found");
            }
            $stripe_api_key = $paymentoption->api_secret_key;
        }
        if ($return_key_only) {
            return $stripe_api_key;
        }
        Stripe::setApiKey($stripe_api_key);
    }
    
    public function showConnectCardForm($publishableKey, $connectAccountId, $currency,$is_update_card)
    {
        return view('stripe.add-card', [
            'publishableKey' => decrypt($publishableKey),
            'connectAccountId' => decrypt($connectAccountId),
            'currency' => decrypt($currency),
            'is_update_card'=> decrypt($is_update_card)
        ]);
    }
    public function saveCardToken(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'sc_account_id' => 'required',
            'is_update_card'=>'required'
        ]);
        
        \Log::channel('stripe_connect')->emergency(['request'=>$request->all()]);

        try {
            $driver = Driver::where('sc_account_id', $request->sc_account_id)->first();

            if (!$driver) {
                return response("❌ Driver not found.", 404);
            }
            
            if ($driver->DriverDetail != null) {
                $driver->DriverDetail->card_token = $request->token;
                $driver->DriverDetail->save();
            } else {
                $driver_detail = new \App\Models\DriverDetail();
                $driver_detail->driver_id = $driver->id;
                $driver_detail->card_token = $request->token;
                $driver_detail->save();
            }
                
            $updateCard = $request->is_update_card == "1" ? "true" : ($request->is_update_card == "true" ? "true":"false"); 
            $res = $result = StripeConnect::add_debit_card($driver,$updateCard);
            if($updateCard == "true" && isset($res['result']) && $res['result'] == true){
                $res = $result['result'];
                $card = $result['card'];
                self::set_api_key($driver->merchant_id);
                // \Stripe\Stripe::setApiKey('YOUR_STRIPE_LIVE_KEY');
                $account = Account::retrieve($request->sc_account_id);
                foreach ($account->external_accounts->data as $source) {
                    if ($source->object === 'card' && $source->id !== $card->id) {
                        $source->delete();
                    }
                }
            }
            


            if ($res === true) {
                return response("✅ Card added.", 200);
            } else {
                return response("❌ Failed to add card to Stripe account.", 500);
            }
        } catch (\Exception $e) {
            \Log::error('Stripe error: ' . $e->getMessage());
            return response("❌ Error: " . $e->getMessage(), 500);
        }
    }
}
