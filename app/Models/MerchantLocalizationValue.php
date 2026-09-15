<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MerchantLocalizationValue extends Model
{
    protected $table = 'merchant_localization_values';

    protected $fillable = [
        'localization_key_id',
        'merchant_id',
        'locale',
        'value',
    ];

    protected $casts = [
        'localization_key_id' => 'integer',
        'merchant_id'         => 'integer',
    ];

    // ── Relations ─────────────────────────────────────────────────────────────

    public function localizationKey(): BelongsTo
    {
        return $this->belongsTo(MerchantLocalizationKey::class, 'localization_key_id');
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeForLocale($q, string $locale)    { return $q->where('locale', $locale); }
    public function scopeForMerchant($q, int $merchantId) { return $q->where('merchant_id', $merchantId); }
}