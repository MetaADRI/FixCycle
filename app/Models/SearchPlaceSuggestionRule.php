<?php

namespace App\Models;

use App\Models\Merchant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SearchPlaceSuggestionRule extends Model
{
    use HasFactory;
    protected $table = 'search_place_suggestion_rules';
    protected $guarded = [];
    
    protected $casts = [
        'nearby_places' => 'array',
    ];

    public function Merchant()
    {
        return $this->belongsTo(Merchant::class);
    }

    public function Country(){
        return $this->belongsTo(Country::class);
    }
}
