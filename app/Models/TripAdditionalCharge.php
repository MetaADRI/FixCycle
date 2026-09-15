<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TripAdditionalCharge extends Model
{
    use HasFactory;
    protected $guarded = [];
    protected $fillable = [];

    public function Booking()
    {
        return $this->belongsTo(Booking::class);
    }

}
