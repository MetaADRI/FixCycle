<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CorporateSettlementLog extends Model
{
    use HasFactory;

    public function Corporate()
    {
        return $this->belongsTo(Corporate::class);
    }
}
