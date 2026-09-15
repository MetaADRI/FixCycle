<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MerchantLocalizationKey;
use App\Models\MerchantLocalizationValue;
use App\Models\MerchantStringConfiguration;
use App\Services\LocalizationService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LocalizationController extends Controller
{
    use ApiResponseTrait;

    public function __construct(protected LocalizationService $localizationService) {}

    // ── Private Helpers ───────────────────────────────────────────────────────

    private function getTypeFromHeader(Request $request): int
    {
        $h = $request->header('saving-for');
        if (empty($h)) throw new \Exception('saving-for header is required');
        return MerchantLocalizationKey::typeFromString($h);
    }

    private function baseRules(): array
    {
        return [
            'locale'      => ['required', 'string', 'regex:/^[a-z]{2}(-[A-Z]{2})?$/'],
            'merchant_id' => 'required|integer|exists:merchants,id',
        ];
    }

    private function baseMessages(): array
    {
        return [
            'locale.required'      => 'Locale header is required',
            'locale.regex'         => 'Invalid locale format. Use ISO codes like: en, ar, pt-BR',
            'merchant_id.required' => 'Merchant ID is required',
            'merchant_id.exists'   => 'Merchant not found',
        ];
    }

    private function excludedFields(): array
    {
        return [
            'merchant_id', 'calling_from', 'gender', 'smoker',
            'user_email_enable', 'user_phone_enable', 'user_cpf_enable',
            'login_type', 'referral_code_mandatory_user_signup',
        ];
    }

    private function parseTranslations(array $flatTranslations): array
    {
        $grouped = [];
        foreach ($flatTranslations as $fullKey => $value) {
            $parts = explode('_', $fullKey, 3);
            if (count($parts) < 3) {
                \Log::channel('app_string_v1')->info(['skipped_key' => $fullKey]);
                continue;
            }
            $grouped[$parts[0]][$parts[1]][$parts[2]] = $value;
        }
        return $grouped;
    }

    // ── Write Endpoints ───────────────────────────────────────────────────────

    /**
     * POST /appstrings/create-update
     * Create or update a single translation.
     * Global key is created if it doesn't exist yet.
     * Value is merchant-scoped.
     */
    public function store(Request $request)
    {
        try {
            $locale = $request->header('locale');
            $type   = $this->getTypeFromHeader($request);

            $validator = Validator::make(
                array_merge(['locale' => $locale], $request->all()),
                $this->baseRules(),
                $this->baseMessages()
            );

            if ($validator->fails()) {
                return $this->failedResponseWithData('Validation failed', ['errors' => $validator->errors()]);
            }

            $merchantId       = $request->merchant_id;
            $translationsData = $request->except($this->excludedFields());

            if (empty($translationsData)) {
                return $this->failedResponse('No translation data provided');
            }

            if (count($translationsData) > 1) {
                return $this->failedResponse('Only one key allowed per request. Use /bulk for multiple keys');
            }

            $flatKey = array_key_first($translationsData);
            $value   = $translationsData[$flatKey];
            $parts   = explode('_', $flatKey, 3);

            if (count($parts) < 3) {
                return $this->failedResponse('Invalid key format. Expected: module_screen_key');
            }

            [$module, $screen, $key] = $parts;

            $localizationValue = $this->localizationService->createOrUpdate([
                'merchant_id' => $merchantId,
                'type'        => $type,
                'locale'      => $locale,
                'module'      => $module,
                'screen'      => $screen,
                'key'         => $key,
                'value'       => $value,
            ]);

            $localizationKey = $localizationValue->localizationKey;
            $message         = $localizationValue->wasRecentlyCreated
                ? 'Localization created successfully'
                : 'Localization updated successfully';

            return $this->successResponse($message, [
                'id'          => $localizationValue->id,
                'key_id'      => $localizationKey->id,
                'merchant_id' => $merchantId,
                'type'        => $type,
                'type_label'  => MerchantLocalizationKey::labelFromType($type),
                'locale'      => $localizationValue->locale,
                'module'      => $localizationKey->module,
                'screen'      => $localizationKey->screen,
                'key_name'    => $localizationKey->key_name,
                'flat_key'    => $flatKey,
                'value'       => $localizationValue->value,
            ]);

        } catch (\Exception $e) {
            \Log::channel('app_string_v1')->info(['error_from' => 'store', 'error' => $e->getMessage()]);
            return $this->failedResponse(config('app.debug') ? $e->getMessage() : 'Failed to save localization');
        }
    }

    /**
     * POST /appstrings/bulk
     * Bulk create or update multiple translations.
     * Global keys are created if they don't exist yet.
     */
    public function bulkStore(Request $request)
    {
        try {
            $locale = $request->header('locale');
            $type   = $this->getTypeFromHeader($request);

            $validator = Validator::make(
                array_merge(['locale' => $locale], $request->all()),
                $this->baseRules(),
                $this->baseMessages()
            );

            if ($validator->fails()) {
                return $this->failedResponseWithData('Validation failed', ['errors' => $validator->errors()]);
            }

            $merchantId       = $request->merchant_id;
            $translationsData = $request->except($this->excludedFields());

            if (empty($translationsData)) {
                return $this->failedResponse('No translation data provided');
            }

            $grouped        = $this->parseTranslations($translationsData);
            $totalInserted  = $totalUpdated = $totalProcessed = 0;

            foreach ($grouped as $module => $screens) {
                foreach ($screens as $screen => $translations) {
                    $result = $this->localizationService->bulkCreateOrUpdate([
                        'merchant_id'  => $merchantId,
                        'type'         => $type,
                        'locale'       => $locale,
                        'module'       => $module,
                        'screen'       => $screen,
                        'translations' => $translations,
                    ]);

                    $totalInserted  += $result['inserted'];
                    $totalUpdated   += $result['updated'];
                    $totalProcessed += $result['total'];
                }
            }

            return $this->successResponse('Bulk operation completed', [
                'merchant_id'      => $merchantId,
                'type'             => $type,
                'type_label'       => MerchantLocalizationKey::labelFromType($type),
                'locale'           => $locale,
                'total_keys'       => $totalProcessed,
                'inserted'         => $totalInserted,
                'updated'          => $totalUpdated,
                'modules_affected' => count($grouped),
            ]);

        } catch (\Exception $e) {
            \Log::channel('app_string_v1')->info(['error_from' => 'bulkStore', 'error' => $e->getMessage()]);
            return $this->failedResponse(config('app.debug') ? $e->getMessage() : 'Failed to save bulk localizations');
        }
    }

    /**
     * PUT /appstrings/cache/invalidate
     */
    public function invalidateCache(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'merchant_id'  => 'required|integer',
                'type'         => 'nullable|integer|in:1,2,3',
                'calling_from' => 'nullable|string|in:USER,DRIVER,STORE',
                'locale'       => 'nullable|string|regex:/^[a-z]{2}(-[A-Z]{2})?$/',
                'module'       => 'nullable|string',
                'screen'       => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return $this->failedResponseWithData('Validation failed', ['errors' => $validator->errors()]);
            }

            $type = null;
            if ($request->type) {
                $type = (int) $request->type;
            } elseif ($request->header('saving-for')) {
                $type = $this->getTypeFromHeader($request);
            }

            $deleted = $this->localizationService->invalidateCache(
                $request->merchant_id, $type, $request->locale, $request->module, $request->screen
            );

            return $this->successResponse('Cache invalidated successfully', [
                'merchant_id'  => $request->merchant_id,
                'deleted_keys' => $deleted,
                'type'         => $type,
            ]);

        } catch (\Exception $e) {
            \Log::channel('app_string_v1')->info(['error_from' => 'invalidateCache', 'error' => $e->getMessage()]);
            return $this->failedResponse(config('app.debug') ? $e->getMessage() : 'Failed to invalidate cache');
        }
    }

    /**
     * DELETE /appstrings/{merchant_id}/{flat_key}
     * Deletes only this merchant's value row — global key and other merchants untouched.
     */
    public function destroy(Request $request, $merchantId, $flatKey)
    {
        try {
            $locale = $request->header('locale');
            $type   = $this->getTypeFromHeader($request);

            if (!$locale || !preg_match('/^[a-z]{2}(-[A-Z]{2})?$/', $locale)) {
                return $this->failedResponse('Invalid or missing locale header');
            }

            $parts = explode('_', $flatKey, 3);
            if (count($parts) < 3) {
                return $this->failedResponse('Invalid key format. Expected: module_screen_key');
            }

            $deleted = $this->localizationService->delete(
                $merchantId, $type, $locale, $parts[0], $parts[1], $parts[2]
            );

            if (!$deleted) return $this->failedResponse('Localization value not found');

            return $this->successResponse('Localization deleted successfully');

        } catch (\Exception $e) {
            \Log::channel('app_string_v1')->info(['error_from' => 'destroy', 'error' => $e->getMessage()]);
            return $this->failedResponse(config('app.debug') ? $e->getMessage() : 'Failed to delete localization');
        }
    }

    // ── Read Endpoints ────────────────────────────────────────────────────────

    /**
     * GET /appstrings/{type}
     * Get ALL translations for merchant+type+locale scoped to MerchantStringConfiguration.
     * Only returns keys that have a value for this merchant — no pending/null rows.
     */
    public function getAllTranslations(Request $request, $string_type)
    {
        try {
            $locale     = $request->header('locale');
            $merchantId = $request->merchant_id;
            $type       = MerchantLocalizationKey::typeFromString($string_type);

            if (!$locale || !preg_match('/^[a-z]{2}(-[A-Z]{2})?$/', $locale)) {
                return $this->failedResponse('Invalid or missing locale header');
            }

            $configured = MerchantStringConfiguration::getActivePairs($merchantId, $type);

            if ($configured->isEmpty()) {
                return $this->failedResponse('No string configuration found for this app type');
            }

            $flatTranslations = [];
            $cacheHits = $dbHits = 0;

            foreach ($configured as $config) {
                $result = $this->localizationService->getTranslations(
                    (int) $merchantId, $type, $locale, $config->module, $config->screen
                );

                $result['source'] === 'cache' ? $cacheHits++ : $dbHits++;

                foreach ($result['translations'] as $key => $value) {
                    $flatTranslations["{$config->module}_{$config->screen}_{$key}"] = $value;
                }
            }

            if (empty($flatTranslations)) {
                return $this->failedResponse('No translations found for this locale');
            }

            return $this->successResponse('Translations retrieved successfully', [
                'merchant_id'   => (int) $merchantId,
                'type'          => $type,
                'type_label'    => MerchantLocalizationKey::labelFromType($type),
                'locale'        => $locale,
                'total_keys'    => count($flatTranslations),
                'translations'  => $flatTranslations,
                'screens_total' => $configured->count(),
                'from_cache'    => $cacheHits,
                'from_database' => $dbHits,
            ]);

        } catch (\Exception $e) {
            \Log::channel('app_string_v1')->info(['error_from' => 'getAllTranslations', 'error' => $e->getMessage()]);
            return $this->failedResponse(config('app.debug') ? $e->getMessage() : 'Failed to fetch translations');
        }
    }

    /**
     * GET /appstrings/{merchant_id}/{module}/{screen}
     * Get translations for a specific screen (Redis → DB fallback).
     */
    public function show(Request $request, $merchantId, $module, $screen)
    {
        try {
            $locale = $request->header('locale');
            $type   = $this->getTypeFromHeader($request);

            if (!$locale || !preg_match('/^[a-z]{2}(-[A-Z]{2})?$/', $locale)) {
                return $this->failedResponse('Invalid or missing locale header');
            }

            $result = $this->localizationService->getTranslations($merchantId, $type, $locale, $module, $screen);

            if (empty($result['translations'])) {
                return $this->failedResponse('No translations found for this screen');
            }

            $flat = [];
            foreach ($result['translations'] as $key => $value) {
                $flat["{$module}_{$screen}_{$key}"] = $value;
            }

            return $this->successfullResponse('Translations retrieved successfully', [
                'merchant_id'  => (int) $merchantId,
                'type'         => $type,
                'type_label'   => MerchantLocalizationKey::labelFromType($type),
                'locale'       => $locale,
                'module'       => $module,
                'screen'       => $screen,
                'translations' => $flat,
            ], ['source' => $result['source']]);

        } catch (\Exception $e) {
            \Log::channel('app_string_v1')->info(['error_from' => 'show', 'error' => $e->getMessage()]);
            return $this->failedResponse(config('app.debug') ? $e->getMessage() : 'Failed to fetch translations');
        }
    }

    /**
     * GET /appstrings/locales/{merchant_id}
     * Available locales for a merchant (locales they have at least one value for).
     */
    public function getAvailableLocales(Request $request, $merchantId)
    {
        try {
            $type = null;
            if ($request->header('saving-for')) {
                $type = $this->getTypeFromHeader($request);
            }

            $query = DB::table('merchant_localization_values as v')
                ->join('localization_keys as k', 'k.id', '=', 'v.localization_key_id')
                ->where('v.merchant_id', $merchantId);

            if ($type) $query->where('k.type', $type);

            $locales = $query->distinct()->pluck('v.locale')->toArray();

            if (empty($locales)) {
                return $this->failedResponse('No locales found for this merchant');
            }

            return $this->successResponse('Available locales retrieved', [
                'merchant_id'   => (int) $merchantId,
                'type'          => $type,
                'type_label'    => $type ? MerchantLocalizationKey::labelFromType($type) : 'All types',
                'locales'       => $locales,
                'total_locales' => count($locales),
            ]);

        } catch (\Exception $e) {
            \Log::channel('app_string_v1')->info(['error_from' => 'getAvailableLocales', 'error' => $e->getMessage()]);
            return $this->failedResponse(config('app.debug') ? $e->getMessage() : 'Failed to fetch locales');
        }
    }
}