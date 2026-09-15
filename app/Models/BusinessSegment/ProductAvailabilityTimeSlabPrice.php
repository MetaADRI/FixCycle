<?php

namespace App\Models\BusinessSegment;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductAvailabilityTimeSlabPrice extends Model
{
    use HasFactory;
    protected $fillable = [];
    protected $guarded = [];

    public function ProductAvailabilityTimeSlab()
    {
        return $this->belongsTo( ProductAvailabilityTimeSlab::class, 'product_availability_time_slab_id');
    }
}
