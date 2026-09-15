<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\BusinessSegment\Order;

class Outstanding extends Model
{
  protected $guarded = [];
  protected $table = 'outstanding';

    public function User()
    {
        return $this->belongsTo(User::class);
    }

    public function Booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function Driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function Order(){
        return $this->belongsTo(Order::class);
    }
}
