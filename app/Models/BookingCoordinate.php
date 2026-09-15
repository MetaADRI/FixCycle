<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingCoordinate extends Model
{
    protected $guarded =[];
    protected $fillable = ['booking_id', 'coordinates'];
    public $timestamps = false;
}
