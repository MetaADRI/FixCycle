<?php

namespace App\Http\Controllers\Merchant;
use App;
use App\Models\Configuration;
use App\Models\LanguageQuestion;
use App\Models\Question;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Models\BookingConfiguration;
use App\Traits\MerchantTrait;
use App\Models\SearchPlaceSuggestionRule;
use App\Models\Country;

class SearchPlaceRuleController extends Controller
{
    use MerchantTrait;
    
    public function index()
    {
        $merchant_id = get_merchant_id();
        $searchPlaceData = SearchPlaceSuggestionRule::where('merchant_id',$merchant_id)->latest()->paginate(20);
        return view('merchant.search_place_rule.index', compact('searchPlaceData'));
    }

    public function create()
    {
        $merchant_id = get_merchant_id();
        $countries = Country::where('merchant_id',$merchant_id)->get();
        return view('merchant.search_place_rule.create',compact('countries'));
    }

    public function store(Request $request)
    {
        $merchant_id = get_merchant_id();
        $string_file = $this->getStringFile($merchant_id);
        $request->validate([
            'keyword' => 'required|string',
            'places' => 'required|array',
            'places.*.name' => 'required',
            'places.*.lat' => 'required',
            'places.*.lng' => 'required',
            'country_id' => 'required|exists:countries,id',
            'status'=>'required|in:1,2'
        ]);
    
        SearchPlaceSuggestionRule::create([
            'merchant_id' => $merchant_id,
            'keyword' => $request->keyword,
            'nearby_places' => array_values($request->places),
            'country_id'=> $request->country_id,
            'status' => $request->status,
        ]);
    
        return redirect()->route('search-places-rules.index')->withSuccess(trans("$string_file.saved_successfully"));
    }

    public function show($id)
    {
        //
    }

    public function edit($id)
    {
        $merchant_id = get_merchant_id();
        $string_file = $this->getStringFile($merchant_id);
        $countries = Country::where('merchant_id',$merchant_id)->get();
        $search_place = SearchPlaceSuggestionRule::find($id);
        return view('merchant.search_place_rule.edit',compact('countries','search_place'));
    }

    public function update(Request $request, $id)
    {
       $merchant_id = get_merchant_id();
        $string_file = $this->getStringFile($merchant_id);
        $request->validate([
            'keyword' => 'required|string',
            'places' => 'required|array',
            'places.*.name' => 'required',
            'places.*.lat' => 'required',
            'places.*.lng' => 'required',
            'country_id' => 'required|exists:countries,id',
            'status'=>'required|in:1,2'
        ]);
    
        SearchPlaceSuggestionRule::where('id', $id)->update([
            'merchant_id'   => $merchant_id,
            'keyword'       => $request->keyword,
            'nearby_places' => array_values($request->places),
            'country_id'    => $request->country_id,
            'status'        => $request->status,
        ]);
        return redirect()->back()->withSuccess(trans("$string_file.saved_successfully"));
    }

    public function destroy($id)
    {
        //
    }
}
