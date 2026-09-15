<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusPolicy extends Model
{
    use HasFactory;

    protected $table = 'bus_policy';

    protected $fillable = [
        'bus_id',
    ];

    protected $casts = [
        'bus_id' => 'integer',
    ];

    public $timestamps = true;

    public function LanguageAny()
    {
        return $this->hasOne(LanguageBusPolicy::class);
    }

    public function LanguageSingle()
    {
        return $this->hasOne(LanguageBusPolicy::class)
            ->where('locale', \App::getLocale());
    }

    public function getNameAttribute()
    {
        // use nullsafe operator + fallback
        return $this->LanguageSingle?->name
            ?? $this->LanguageAny?->name
            ?? '';
    }

    public function getDescriptionAttribute()
    {
        return $this->LanguageSingle?->description
            ?? $this->LanguageAny?->description
            ?? '';
    }
}
