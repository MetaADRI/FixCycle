<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EtaSlab extends Model
{
    use HasFactory;
    protected $guarded  = [];
    protected $fillable = [];

    public function Merchant()
    {
        return $this->belongsTo(Merchant::class);
    }
}
