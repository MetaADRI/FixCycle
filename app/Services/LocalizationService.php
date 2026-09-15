<?php

namespace App\Services;

use App\Models\MerchantLocalizationKey;
use App\Models\MerchantLocalizationValue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class LocalizationService
{
    private const CACHE_TTL = 86400; // 24 hours

    // ── Cache Key ─────────────────────────────────────────────────────────────

    private function getCacheKey(int $merchantId, int $type, string $locale, string $module, string $screen): string
    {
        return "merchant:{$merchantId}:type:{$type}:locale:{$locale}:{$module}:{$screen}";
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    /**
     * Create or update a single translation value.
     * Key must already exist in localization_keys (created by admin).
     * If it doesn't exist yet, it is created (API flow).
     */
    public function createOrUpdate(array $data): MerchantLocalizationValue
    {
        // Ensure global key exists (no merchant_id)
        $key = MerchantLocalizationKey::firstOrCreate([
            'type'     => $data['type'],
            'module'   => $data['module'],
            'screen'   => $data['screen'],
            'key_name' => $data['key'],
        ]);

        // Upsert merchant-scoped value
        $value = MerchantLocalizationValue::updateOrCreate(
            [
                'localization_key_id' => $key->id,
                'merchant_id'         => $data['merchant_id'],
                'locale'              => $data['locale'],
            ],
            ['value' => $data['value']]
        );

        $this->updateCache(
            $data['merchant_id'], $data['type'], $data['locale'],
            $data['module'], $data['screen'], $data['key'], $data['value']
        );

        return $value;
    }

    /**
     * Bulk create or update translations for a single module+screen.
     */
    public function bulkCreateOrUpdate(array $data): array
    {
        $merchantId   = $data['merchant_id'];
        $type         = $data['type'];
        $locale       = $data['locale'];
        $module       = $data['module'];
        $screen       = $data['screen'];
        $translations = $data['translations']; // ['key_name' => 'value']

        $inserted = $updated = 0;

        DB::beginTransaction();
        try {
            foreach ($translations as $keyName => $value) {
                $key = MerchantLocalizationKey::firstOrCreate([
                    'type'     => $type,
                    'module'   => $module,
                    'screen'   => $screen,
                    'key_name' => $keyName,
                ]);

                $row = MerchantLocalizationValue::updateOrCreate(
                    [
                        'localization_key_id' => $key->id,
                        'merchant_id'         => $merchantId,
                        'locale'              => $locale,
                    ],
                    ['value' => $value]
                );

                $row->wasRecentlyCreated ? $inserted++ : $updated++;
            }

            DB::commit();
            $this->bulkUpdateCache($merchantId, $type, $locale, $module, $screen, $translations);

            return ['total' => count($translations), 'inserted' => $inserted, 'updated' => $updated];

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete a single merchant translation value.
     * Global key row is NOT deleted — other merchants keep their values.
     */
    public function delete(int $merchantId, int $type, string $locale, string $module, string $screen, string $keyName): bool
    {
        $key = MerchantLocalizationKey::where('type', $type)
            ->where('module',   $module)
            ->where('screen',   $screen)
            ->where('key_name', $keyName)
            ->first();

        if (!$key) return false;

        $deleted = MerchantLocalizationValue::where('localization_key_id', $key->id)
            ->where('merchant_id', $merchantId)
            ->where('locale', $locale)
            ->delete();

        if ($deleted) {
            Redis::hdel($this->getCacheKey($merchantId, $type, $locale, $module, $screen), $keyName);
        }

        return $deleted > 0;
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    /**
     * Get all translations for a merchant+screen.
     * Redis first → DB JOIN fallback → warms cache on DB hit.
     */
    public function getTranslations(int $merchantId, int $type, string $locale, string $module, string $screen): array
    {
        $cacheKey = $this->getCacheKey($merchantId, $type, $locale, $module, $screen);

        $cached = Redis::hgetall($cacheKey);
        if (!empty($cached)) {
            return ['source' => 'cache', 'translations' => $cached];
        }

        // JOIN global keys + merchant-scoped values
        $rows = DB::table('localization_keys as k')
            ->join('merchant_localization_values as v', function ($j) use ($merchantId, $locale) {
                $j->on('v.localization_key_id', '=', 'k.id')
                    ->where('v.merchant_id', $merchantId)
                    ->where('v.locale', $locale);
            })
            ->where('k.type',   $type)
            ->where('k.module', $module)
            ->where('k.screen', $screen)
            ->select('k.key_name', 'v.value')
            ->get();

        if ($rows->isEmpty()) {
            return ['source' => 'database', 'translations' => []];
        }

        $translations = $rows->pluck('value', 'key_name')->toArray();
        $this->bulkUpdateCache($merchantId, $type, $locale, $module, $screen, $translations);

        return ['source' => 'database', 'translations' => $translations];
    }

    /**
     * Get all translations for a module, grouped by screen.
     */
    public function getModuleTranslations(int $merchantId, int $type, string $locale, string $module): array
    {
        $rows = DB::table('localization_keys as k')
            ->join('merchant_localization_values as v', function ($j) use ($merchantId, $locale) {
                $j->on('v.localization_key_id', '=', 'k.id')
                    ->where('v.merchant_id', $merchantId)
                    ->where('v.locale', $locale);
            })
            ->where('k.type',   $type)
            ->where('k.module', $module)
            ->orderBy('k.screen')
            ->orderBy('k.key_name')
            ->select('k.screen', 'k.key_name', 'v.value')
            ->get();

        $screens = [];
        foreach ($rows as $row) {
            $screens[$row->screen][$row->key_name] = $row->value;
        }

        return $screens;
    }

    // ── Cache ─────────────────────────────────────────────────────────────────

    private function updateCache(int $merchantId, int $type, string $locale, string $module, string $screen, string $key, string $value): void
    {
        $cacheKey = $this->getCacheKey($merchantId, $type, $locale, $module, $screen);
        Redis::hset($cacheKey, $key, $value);
        Redis::expire($cacheKey, self::CACHE_TTL);
    }

    private function bulkUpdateCache(int $merchantId, int $type, string $locale, string $module, string $screen, array $translations): void
    {
        if (empty($translations)) return;
        $cacheKey = $this->getCacheKey($merchantId, $type, $locale, $module, $screen);
        Redis::hmset($cacheKey, $translations);
        Redis::expire($cacheKey, self::CACHE_TTL);
    }

    /**
     * Invalidate Redis cache at any level of granularity.
     *
     * all 4 params  → specific screen key deleted
     * 3 params      → all screens in module
     * 2 params      → all modules for type+locale
     * type only     → all locales for type
     * none          → entire merchant
     */
    public function invalidateCache(
        int     $merchantId,
        ?int    $type   = null,
        ?string $locale = null,
        ?string $module = null,
        ?string $screen = null
    ): int {
        if ($type && $locale && $module && $screen) {
            return Redis::del($this->getCacheKey($merchantId, $type, $locale, $module, $screen));
        } elseif ($type && $locale && $module) {
            return $this->deleteByPattern("merchant:{$merchantId}:type:{$type}:locale:{$locale}:{$module}:*");
        } elseif ($type && $locale) {
            return $this->deleteByPattern("merchant:{$merchantId}:type:{$type}:locale:{$locale}:*");
        } elseif ($type) {
            return $this->deleteByPattern("merchant:{$merchantId}:type:{$type}:*");
        }
        return $this->deleteByPattern("merchant:{$merchantId}:*");
    }

    private function deleteByPattern(string $pattern): int
    {
        $keys = Redis::keys($pattern);
        return !empty($keys) ? Redis::del(...$keys) : 0;
    }
}