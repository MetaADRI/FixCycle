<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;

class MerchantStringConfiguration extends Model
{

    protected $fillable = [
        'merchant_id',
        'type',
        'module',
        'screen',
        'is_active',
    ];

    protected $casts = [
        'merchant_id' => 'integer',
        'type'        => 'integer',
        'is_active'   => 'boolean',
    ];

    // ── Relations ─────────────────────────────────────────────────────────────

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Get all active module+screen pairs for a merchant+type.
     * Used in both merchant panel and API to scope which keys are shown.
     */
    public static function getActivePairs(int $merchantId, int $type): Collection
    {
        return static::where('merchant_id', $merchantId)
            ->where('type', $type)
            ->where('is_active', 1)
            ->select('module', 'screen')
            ->get();
    }
}