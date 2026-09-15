<?php

namespace App\Http\Controllers\Merchant;

use App\Models\UtilityTransaction;

use App\Traits\MerchantTrait;
use App\Traits\ImageTrait;
use App\Http\Controllers\Controller;

class UtilityTransactionController extends Controller
{
    use MerchantTrait,ImageTrait; 
    public function UtilityTransactionList (){
        $merchant_id = get_merchant_id();
        $transactions = UtilityTransaction::where('merchant_id', $merchant_id)->get();
        return view('merchant.utility-transaction.utility-transaction-list', compact('transactions'));
    }



}