@extends('merchant.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
            
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <div class="panel-actions">
                        <a href="{{ route('search-places-rules.index') }}">
                            <button type="button" class="btn btn-icon btn-success float-right" style="margin:10px"><i class="wb-reply"></i>
                            </button>
                        </a>
                    </div>
                    <h3 class="panel-title"><i class="wb-user" aria-hidden="true"></i>
                        @lang("$string_file.add_search_place_rule")</h3>
                </header>
                <div class="panel-body container-fluid">
                    <form method="POST" action="{{ route('search-places-rules.store') }}">
                        @csrf

                        <div class="row">
                            <!-- Keyword -->
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Keyword <span class="text-danger">*</span></label>
                                    <input type="text"
                                           name="keyword"
                                           class="form-control"
                                           value="{{ old('keyword') }}"
                                           required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Country <span class="text-danger">*</span></label>
                                    <select name="country_id" class="form-control">
                                        <option value="">@lang("$string_file.select")</option>
                                        @foreach($countries as $country)
                                            <option value="{{$country->id}}">{{empty($country->LanguageCountrySingle) ? $country->LanguageCountryAny->name : $country->LanguageCountrySingle->name}}</option>
                                        @endforeach
                                    </select>
                                </div>
                            </div>
                        
                            <!-- Status -->
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label>Status</label>
                                    <select name="status" class="form-control">
                                        <option value="1">@lang("$string_file.active")</option>
                                        <option value="0">@lang("$string_file.inactive")</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <h5>Nearby Places</h5>
                        
                        <div id="places-wrapper">
                            @php
                                $places = old('places', [[]]);
                            @endphp
                        
                            @foreach($places as $index => $place)
                                <div class="row place-row mb-2">
                                    <div class="col-md-4">
                                        <input type="text"
                                               name="places[{{ $index }}][name]"
                                               class="form-control"
                                               placeholder="Place Name"
                                               value=""
                                               required>
                                    </div>
                        
                                    <div class="col-md-3">
                                        <input type="text"
                                               name="places[{{ $index }}][lat]"
                                               class="form-control"
                                               placeholder="Latitude"
                                               value=""
                                               required>
                                    </div>
                        
                                    <div class="col-md-3">
                                        <input type="text"
                                               name="places[{{ $index }}][lng]"
                                               class="form-control"
                                               placeholder="Longitude"
                                               value=""
                                               required>
                                    </div>
                        
                                    <div class="col-md-2">
                                        <button type="button" class="btn btn-danger remove-place">X</button>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                        
                        <button type="button" class="btn btn-secondary mt-2" id="addPlace">
                            + Add Place
                        </button>
                        
                        <hr>
                        
                        <button type="submit" class="btn btn-primary">
                            Save
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
@section('js')
<script>
    let placeIndex = {{ count($places) }};

    document.getElementById('addPlace').addEventListener('click', function () {
        const wrapper = document.getElementById('places-wrapper');

        const html = `
        <div class="row place-row mb-2">
            <div class="col-md-4">
                <input type="text" name="places[${placeIndex}][name]" class="form-control" placeholder="Place Name" required>
            </div>
            <div class="col-md-3">
                <input type="text" name="places[${placeIndex}][lat]" class="form-control" placeholder="Latitude" required>
            </div>
            <div class="col-md-3">
                <input type="text" name="places[${placeIndex}][lng]" class="form-control" placeholder="Longitude" required>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-danger remove-place">X</button>
            </div>
        </div>
        `;

        wrapper.insertAdjacentHTML('beforeend', html);
        placeIndex++;
    });
    
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-place')) {
            e.target.closest('.place-row').remove();
        }
    });
</script>
@endsection