<?php

namespace App\Models\HandymanStore;

use App\Models\Country;
use App\Models\CountryArea;
use App\Models\Merchant;
use App\Models\MerchantWebOneSignal;
use App\Models\Segment;
use App\Models\ServiceType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;

class HandymanStore extends Authenticatable
{
    use HasFactory;

    protected $table = 'handyman_stores';
    protected $guarded = [];

    protected $hidden = [
        'password', 'remember_token', 'pivot',
    ];


    public function findForPassport($user_cred = null)
    {
        if (!empty($_SERVER['HTTP_PUBLICKEY']) && !empty($_SERVER['HTTP_SECRETKEY'])) {
            $merchant = CommonController::Marchant($_SERVER['HTTP_PUBLICKEY'], $_SERVER['HTTP_SECRETKEY']);
            $merchant_id = $merchant['id'];
        }
        $user =  HandymanStore::where([['merchant_id', '=', $merchant_id], ['email', '=', $user_cred], ['status', '=', 1]])
//            ->orWhere([['merchant_id', '=', $merchant_id], ['id', '=', $user_cred], ['status', '=', 1]])
            ->first();
        return $user;
    }

    // public function validateForPassportPasswordGrant($pass = null)
    // {
    //     return true;
    // }

    public function Merchant()
    {
        return $this->belongsTo(Merchant::class);
    }

    public function Country()
    {
        return $this->belongsTo(Country::class);
    }
    public function CountryArea()
    {
        return $this->belongsTo(CountryArea::class);
    }

    public function Segment()
    {
        return $this->belongsToMany(Segment::class, 'merchant_segment', 'handyman_store_id')->withPivot('segment_icon', 'sequence', 'price_card_owner','is_coming_soon','dynamic_url');
    }

    public function ServiceType()
    {
        return $this->belongsToMany(ServiceType::class, 'merchant_service_type', 'handyman_store_id')->withPivot('segment_id', 'sequence', 'service_icon', 'is_recommended')->orderBy('segment_id');
    }

    public  function BannerManagement(){
        return $this->hasMany(App\Models\BannerManagement::class,'id');
    }

    // one signal web player id
    public  function webOneSignalPlayerId(){
        return $this->hasMany(MerchantWebOneSignal::class);
    }


    public function HandymanStoreChekouts()
    {
        $this->hasMany(HandymanStoreChekouts::class,  'handyman_store_id');
    }

    public function FavouriteHandymanStore(){
        return $this->hasMany(FavouriteHandymanStore::class);
    }


}
