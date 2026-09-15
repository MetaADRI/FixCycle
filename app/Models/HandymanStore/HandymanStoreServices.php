<?php

namespace App\Models\HandymanStore;

use App\Models\Merchant;
use App\Models\Segment;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HandymanStoreServices extends Model
{
    use HasFactory;
    protected $table = 'handyman_stores';
    protected $guarded = [];

    public function Merchant()
    {
        return $this->belongsTo(Merchant::class);
    }

    public function Segment()
    {
        return $this->belongsTo(Segment::class);
    }

    public function HandymanStore()
    {
        return $this->belongsTo(HandymanStore::class);
    }
}
