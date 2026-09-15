<?php

namespace App\Http\Controllers\Merchant;

use App\Http\Controllers\Controller;
use App\Models\ExcelDownload;
use App\Models\InfoSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Traits\MerchantTrait;

class ExcelExportController extends Controller
{
    //
    use MerchantTrait;
    public function index(Request $request){
        $merchant = get_merchant_id(false);
        $merchant_id = $merchant->id;
        $request->merge(['merchant_id' => $merchant_id]);
        $string_file = $this->getStringFile($merchant_id);
        $arr_search = $request->all();
        $excelExportLogs = ExcelDownload::where("merchant_id", $merchant_id)->orderBy("id", "desc")->paginate(50);
        $request->merge(['search_route' => route('driver.index')]);
        $info_setting = InfoSetting::where('slug', 'DRIVER')->first();
        return view('merchant.excel_export.index', compact('excelExportLogs', 'arr_search', 'info_setting', 'string_file'));
    }
    
    public function download($id)
    {
        $file = ExcelDownload::findOrFail($id);
        $path = storage_path('app/' . $file->location);
    
        if (!file_exists($path)) {
            abort(404);
        }
    
        return response()->download($path, $file->filename);
    }
    
    
    public function delete($id)
    {
        $file = ExcelDownload::findOrFail($id);
    
        $path = storage_path('app/' . $file->location);
        if (file_exists($path)) {
            unlink($path);
        }
        $file->delete();
        return response()->json([
            'success' => true,
            'message' => 'File deleted successfully.'
        ]);
    }

}
