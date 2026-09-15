<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MerchantLocalizationKey extends Model
{
    protected $table = 'localization_keys'; // global — no merchant_id, no en_value

    public const TYPE_USER   = 1;
    public const TYPE_DRIVER = 2;
    public const TYPE_STORE  = 3;

    protected $fillable = [
        'type',
        'module',
        'screen',
        'key_name',
    ];

    protected $casts = [
        'type' => 'integer',
    ];

    // ── Relations ─────────────────────────────────────────────────────────────

    public function values(): HasMany
    {
        return $this->hasMany(MerchantLocalizationValue::class, 'localization_key_id');
    }

    public function valueForMerchant(int $merchantId, string $locale): ?MerchantLocalizationValue
    {
        return $this->values()
            ->where('merchant_id', $merchantId)
            ->where('locale', $locale)
            ->first();
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeForType($q, int $type)        { return $q->where('type', $type); }
    public function scopeForModule($q, string $module)  { return $q->where('module', $module); }
    public function scopeForScreen($q, string $screen)  { return $q->where('screen', $screen); }

    // ── Static Helpers ────────────────────────────────────────────────────────

    public static function typeFromString(string $s): int
    {
        return match (strtoupper(trim($s))) {
            'DRIVER' => self::TYPE_DRIVER,
            'STORE'  => self::TYPE_STORE,
            default  => self::TYPE_USER,
        };
    }

    public static function labelFromType(int $type): string
    {
        return match ($type) {
            self::TYPE_DRIVER => 'driver',
            self::TYPE_STORE  => 'store',
            default           => 'user',
        };
    }

    public function getTypeLabelAttribute(): string
    {
        return self::labelFromType($this->type);
    }
}