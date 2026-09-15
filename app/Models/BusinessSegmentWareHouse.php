<?php

namespace App\Models\BusinessSegment;

use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use DB;
use App;
use App\Models\Merchant;
use App\Models\Segment;
use App\Models\Country;
use App\Models\CountryArea;
use App\Models\StyleManagement;
use App\Models\FavouriteBusinessSegment;
use App\Models\DriverAgency\DriverAgency;
use App\Models\MerchantWebOneSignal;
use Laravel\Passport\HasApiTokens;
use App\Http\Controllers\Helper\CommonController;
use App\Models\PromoCode;

//use Illuminate\Database\Eloquent\SoftDeletes;

class BusinessSegmentWareHouse extends Authenticatable
{
    use Notifiable, HasApiTokens;
    
    protected $table = 'business_segment_warehouses';

    protected $fillable = [
        'business_segment_id',
        'business_segment_warehouse_id',
        'created_at',
        'updated_at'
    ];
    
    public function BusinessSegment()
    {
        return $this->belongsTo(BusinessSegment::class, 'business_segment_id', 'id');
    }

    public function BusinessSegmentWare(){
        return $this->belongsTo(BusinessSegment::class,'business_segment_warehouse_id');
    }
}