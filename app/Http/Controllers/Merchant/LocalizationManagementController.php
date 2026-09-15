<?php

namespace App\Http\Controllers\Merchant;

use App\Http\Controllers\Controller;
use App\Models\MerchantLocalizationKey;
use App\Models\MerchantLocalizationValue;
use App\Models\MerchantStringConfiguration;
use App\Services\LocalizationService;
use App\Traits\ContentTrait;
use App\Traits\MerchantTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LocalizationManagementController extends Controller
{
    use MerchantTrait, ContentTrait;

    protected LocalizationService $localizationService;

    public function __construct(LocalizationService $localizationService)
    {
        $this->localizationService = $localizationService;
    }


    // ── Private Helpers ───────────────────────────────────────────────────────

    private function resolveAppType(Request $request): string
    {
        $t = $request->get('app_type', 'user');
        return in_array($t, ['user', 'driver', 'store']) ? $t : 'user';
    }

    private function appTypeToInt(string $appType): int
    {
        switch ($appType) {
            case 'driver':
                return MerchantLocalizationKey::TYPE_DRIVER;

            case 'store':
                return MerchantLocalizationKey::TYPE_STORE;

            default:
                return MerchantLocalizationKey::TYPE_USER;
        }
    }

    // ── Index ─────────────────────────────────────────────────────────────────

    /**
     * List translations for this merchant.
     *
     * - Locale: always app()->getLocale() — no picker shown to user.
     * - App type: user / driver / store — switchable via tab buttons.
     * - Shows ALL global keys for configured screens, NULL value = Pending.
     */
    public function index(Request $request)
    {
        $checkPermission = check_permission(1, 'view_language_strings');
        if ($checkPermission['isRedirect']) return $checkPermission['redirectBack'];

        $merchant    = get_merchant_id(false);
        $merchant_id = $merchant->id;
        $string_file = $this->getStringFile(NULL, $merchant);
        $locale      = app()->getLocale();

        $app_type = $this->resolveAppType($request);
        $type_int = $this->appTypeToInt($app_type);

        $filter_module = $request->get('module');
        $search        = $request->get('search');

        // ── Configured module+screen pairs for this merchant+type ──────────────
        $configured = MerchantStringConfiguration::getActivePairs($merchant_id, $type_int);

        $pairs = $configured
            ->map(function ($config) {
                return [$config->module, $config->screen];
            })
            ->unique()
            ->values()
            ->toArray();

        // ── Module list for filter dropdown (scoped to configured pairs only) ──
        $modules = collect($pairs)
            ->pluck(0)
            ->unique()
            ->sort()
            ->values()
            ->toArray();

        // ── Base query: global keys LEFT JOIN this merchant's translated values ─
        $query = DB::table('localization_keys as k')
            ->leftJoin('merchant_localization_values as v', function ($join) use ($locale, $merchant_id) {
                $join->on('v.localization_key_id', '=', 'k.id')
                    ->where('v.merchant_id', $merchant_id)
                    ->where('v.locale', $locale);
            })
            ->where('k.type', $type_int)
            ->select('k.id', 'k.module', 'k.screen', 'k.key_name', 'v.value');

        // ── Restrict to configured screens only ────────────────────────────────
        if (!empty($pairs)) {
            $query->where(function ($q) use ($pairs) {
                foreach ($pairs as $pair) {
                    $module = $pair[0];
                    $screen = $pair[1];
                    $q->orWhere(function ($q2) use ($module, $screen) {
                        $q2->where('k.module', $module)
                            ->where('k.screen', $screen);
                    });
                }
            });
        } else {
            // Merchant has no configured screens → return empty result set
            $query->whereRaw('1 = 0');
        }

        // ── Optional module filter ─────────────────────────────────────────────
        if ($filter_module) {
            $query->where('k.module', $filter_module);
        }

        // ── Optional search ────────────────────────────────────────────────────
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('k.key_name', 'LIKE', "%{$search}%")
                    ->orWhere('v.value',   'LIKE', "%{$search}%")
                    ->orWhere('k.screen',  'LIKE', "%{$search}%");
            });
        }

        // ── Paginate ───────────────────────────────────────────────────────────
        $localizations = $query
            ->orderBy('k.module')
            ->orderBy('k.screen')
            ->orderBy('k.key_name')
            ->paginate(30)
            ->withQueryString(); // keeps ?module=&search= across pages

        // ── Progress stats for the view ────────────────────────────────────────
        $total_count = $localizations->total();

        $translated_count = $localizations->getCollection()
            ->filter(function ($r) {
                return isset($r->value) && $r->value !== '';
            })
            ->count();

        return view('merchant.localization.index', compact(
            'localizations',
            'modules',
            'locale',
            'filter_module',
            'search',
            'string_file',
            'app_type',
            'type_int',
            'total_count',
            'translated_count'
        ));
    }

    // ── Edit ──────────────────────────────────────────────────────────────────

    /**
     * Show translation edit form for a specific app type.
     * Locale = app()->getLocale() — merchant edits strings in their app locale.
     */
    public function edit(Request $request)
    {
        $checkPermission = check_permission(1, 'edit_language_strings');
        if ($checkPermission['isRedirect']) return $checkPermission['redirectBack'];

        $merchant    = get_merchant_id(false);
        $merchant_id = $merchant->id;
        $locale      = app()->getLocale();
        $string_file = $this->getStringFile(NULL, $merchant);

        $app_type      = $this->resolveAppType($request);
        $type_int      = $this->appTypeToInt($app_type);
        $filter_module = $request->get('module');
        $search        = $request->get('search');

        $configured = MerchantStringConfiguration::getActivePairs($merchant_id, $type_int);

        if ($configured->isEmpty()) {
            return redirect()->route('merchant.localization.index')
                ->with('error', 'No modules configured for ' . ucfirst($app_type) . ' app. Please contact admin.');
        }

        $configured_modules = $configured->pluck('module')->unique()->values()->toArray();

        $query = DB::table('localization_keys as k')
            ->leftJoin('merchant_localization_values as v', function ($join) use ($locale, $merchant_id) {
                $join->on('v.localization_key_id', '=', 'k.id')
                    ->where('v.merchant_id', $merchant_id)
                    ->where('v.locale', $locale);
            })
            ->where('k.type', $type_int)
            ->where(function ($q) use ($configured) {
                foreach ($configured as $config) {
                    $q->orWhere(function ($sub) use ($config) {
                        $sub->where('k.module', $config->module)
                            ->where('k.screen', $config->screen);
                    });
                }
            })
            ->select('k.id', 'k.module', 'k.screen', 'k.key_name', 'v.value as current_value', 'v.id as value_id');

        if ($filter_module) $query->where('k.module', $filter_module);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('k.key_name', 'LIKE', "%{$search}%")
                    ->orWhere('v.value',   'LIKE', "%{$search}%")
                    ->orWhere('k.module',  'LIKE', "%{$search}%")
                    ->orWhere('k.screen',  'LIKE', "%{$search}%");
            });
        }

        $rows = $query->orderBy('k.module')->orderBy('k.screen')->orderBy('k.key_name')->get();

        $localizations = $rows->map(function ($row) {
            return [
                'id'            => $row->id,
                'value_id'      => $row->value_id,
                'module'        => $row->module,
                'screen'        => $row->screen,
                'key_name'      => $row->key_name,
                'current_value' => $row->current_value ?? '',
                'default_value' => !empty($row->current_value) ? $row->current_value: str_replace('_', ' ', ucwords($row->key_name, '_')),
                'is_translated' => !empty($row->current_value),
            ];
        })->toArray();

        $total_strings    = count($localizations);
        $translated_count = collect($localizations)->where('is_translated', true)->count();
        $pending_count    = $total_strings - $translated_count;

        return view('merchant.localization.edit', compact(
            'configured_modules', 'localizations', 'filter_module', 'search',
            'locale', 'total_strings', 'translated_count', 'pending_count',
            'string_file', 'app_type', 'type_int'
        ));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(Request $request)
    {
        try {
            $merchant    = get_merchant_id(false);
            $merchant_id = $merchant->id;
            $locale      = app()->getLocale();
            $app_type    = $this->resolveAppType($request);
            $type_int    = $this->appTypeToInt($app_type);

            $validator = Validator::make($request->all(), [
                'items'            => 'required|array',
                'items.*.module'   => 'required|string',
                'items.*.screen'   => 'required|string',
                'items.*.key_name' => 'required|string',
                'items.*.value'    => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return redirect()->back()->withErrors($validator)->withInput();
            }

            DB::beginTransaction();

            $updated = $created = $skipped = 0;

            foreach ($request->items as $item) {
                if (empty($item['value'])) {
                    $skipped++;
                    continue;
                }

                $key = MerchantLocalizationKey::where('type',     $type_int)
                    ->where('module',   $item['module'])
                    ->where('screen',   $item['screen'])
                    ->where('key_name', $item['key_name'])
                    ->first();

                if (!$key) {
                    $skipped++;
                    continue;
                }

                $value = MerchantLocalizationValue::updateOrCreate(
                    [
                        'localization_key_id' => $key->id,
                        'merchant_id'         => $merchant_id,
                        'locale'              => $locale,
                    ],
                    ['value' => $item['value']]
                );

                $value->wasRecentlyCreated ? $created++ : $updated++;

                $this->localizationService->invalidateCache(
                    $merchant_id, $type_int, $locale, $item['module'], $item['screen']
                );
            }

            DB::commit();

            $msg = "Saved! Created: {$created}, Updated: {$updated}";
            if ($skipped) $msg .= ", Skipped (empty/unknown): {$skipped}";

            return redirect()->back()->withSuccess($msg);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Localization update error: ' . $e->getMessage());
            return redirect()->back()->withErrors($e->getMessage());
        }
    }

    // ── Import ────────────────────────────────────────────────────────────────

    public function import()
    {
        $checkPermission = check_permission(1, 'edit_language_strings');
        if ($checkPermission['isRedirect']) return $checkPermission['redirectBack'];

        $merchant    = get_merchant_id(false);
        $string_file = $this->getStringFile(NULL, $merchant);

        return view('merchant.localization.import', compact('string_file'));
    }

    public function processImport(Request $request)
    {
        try {
            $merchant    = get_merchant_id(false);
            $merchant_id = $merchant->id;
            $locale      = app()->getLocale();

            $validator = Validator::make($request->all(), [
                'import_data' => 'required|string',
                'app_type'    => 'required|in:user,driver,store',
            ]);

            if ($validator->fails()) {
                return redirect()->back()->withErrors($validator)->withInput();
            }

            $type_int     = $this->appTypeToInt($request->app_type);
            $translations = json_decode($request->import_data, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return redirect()->back()->withErrors('Invalid JSON format');
            }

            DB::beginTransaction();
            $count = 0;

            foreach ($translations as $flat_key => $value) {
                $parts = explode('_', $flat_key, 3);
                if (count($parts) < 3) continue;

                [$module, $screen, $key_name] = $parts;

                $key = MerchantLocalizationKey::firstOrCreate([
                    'type'     => $type_int,
                    'module'   => $module,
                    'screen'   => $screen,
                    'key_name' => $key_name,
                ]);

                MerchantLocalizationValue::updateOrCreate(
                    [
                        'localization_key_id' => $key->id,
                        'merchant_id'         => $merchant_id,
                        'locale'              => $locale,
                    ],
                    ['value' => $value]
                );

                $count++;
            }

            $this->localizationService->invalidateCache($merchant_id, $type_int, $locale);
            DB::commit();

            return redirect()->route('merchant.localization.index', ['app_type' => $request->app_type])
                ->withSuccess("Imported {$count} translations for locale [{$locale}]");

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Localization import error: ' . $e->getMessage());
            return redirect()->back()->withErrors($e->getMessage());
        }
    }

    // ── Export ────────────────────────────────────────────────────────────────

    public function export(Request $request)
    {
        try {
            $merchant    = get_merchant_id(false);
            $merchant_id = $merchant->id;
            $locale      = app()->getLocale();

            $validator = Validator::make($request->all(), [
                'format'   => 'required|in:json,android,ios',
                'app_type' => 'nullable|in:user,driver,store',
            ]);

            if ($validator->fails()) {
                return redirect()->back()->withErrors($validator);
            }

            $format   = $request->format;
            $type_int = $request->app_type ? $this->appTypeToInt($request->app_type) : null;

            $query = DB::table('localization_keys as k')
                ->join('merchant_localization_values as v', function ($join) use ($locale, $merchant_id) {
                    $join->on('v.localization_key_id', '=', 'k.id')
                        ->where('v.merchant_id', $merchant_id)
                        ->where('v.locale', $locale);
                })
                ->select('k.module', 'k.screen', 'k.key_name', 'v.value');

            if ($type_int) $query->where('k.type', $type_int);

            $rows = $query->get();

            if ($rows->isEmpty()) {
                return redirect()->back()->withErrors("No translations found for locale [{$locale}]");
            }

            $flat = [];
            foreach ($rows as $r) {
                $flat["{$r->module}_{$r->screen}_{$r->key_name}"] = $r->value;
            }

            $filename = 'translations_' . $locale . '_' . date('Y-m-d');

            return match ($format) {
                'json'    => response()->json($flat, 200, [
                    'Content-Disposition' => "attachment; filename=\"{$filename}.json\"",
                ]),
                'android' => $this->exportAndroid($flat, $locale, $filename),
                'ios'     => $this->exportIos($flat, $locale, $filename),
            };

        } catch (\Exception $e) {
            \Log::error('Localization export error: ' . $e->getMessage());
            return redirect()->back()->withErrors($e->getMessage());
        }
    }

    private function exportAndroid(array $flat, string $locale, string $filename)
    {
        $xml = '<?xml version="1.0" encoding="utf-8"?>' . "\n<resources>\n";
        foreach ($flat as $key => $val) {
            $xml .= '    <string name="' . $key . '">' . htmlspecialchars($val, ENT_XML1, 'UTF-8') . "</string>\n";
        }
        $xml .= '</resources>';
        return response($xml, 200, [
            'Content-Type'        => 'text/xml',
            'Content-Disposition' => "attachment; filename=\"{$filename}.xml\"",
        ]);
    }

    private function exportIos(array $flat, string $locale, string $filename)
    {
        $out = "/* {$locale} */\n\n";
        foreach ($flat as $key => $val) {
            $out .= '"' . $key . '" = "' . str_replace('"', '\"', $val) . "\";\n";
        }
        return response($out, 200, [
            'Content-Type'        => 'text/plain',
            'Content-Disposition' => "attachment; filename=\"{$filename}.strings\"",
        ]);
    }

    // ── AJAX ──────────────────────────────────────────────────────────────────

    public function getScreens(Request $request)
    {
        $screens = MerchantLocalizationKey::where('module', $request->module)
            ->distinct()
            ->pluck('screen');

        return response()->json(['screens' => $screens]);
    }
}