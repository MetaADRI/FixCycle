@extends('merchant.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <div class="panel-actions">
                        <a href="{{route('search-places-rules.create')}}">
                            <button type="button" title="@lang('$strine_file.add_search_place_rule')"
                                    class="btn btn-icon btn-success float-right"  style="margin:10px"><i class="wb-plus"></i>
                            </button>
                        </a>
                    </div>
                    <h3 class="panel-title">
                        <i class="icon fa-question-circle-o" aria-hidden="true"></i>
                        @lang("$string_file.search_place_rule")</h3>
                </header>
                <div class="panel-body">
                    <table class="display nowrap table table-hover table-striped w-full" id="customDataTable" style="width:100%" >
                        <thead>
                        <th>@lang("$string_file.sn")</th>
                        <th>@lang("$string_file.keyword")</th>
                        <th>@lang("$string_file.nearby_places")</th>
                        <th>@lang("$string_file.status")</th>
                        <th>@lang("$string_file.action")</th>
                        </thead>
                        <tbody>
                        @php $sr = 1; @endphp
                        @foreach($searchPlaceData as $places)
                            <tr>
                                <td>{{ $sr }}</td>
                                <td>{{ $places->keyword }}</td>
                                <td>
                                    @if(count($places->nearby_places) > 0)
                                        @foreach($places->nearby_places as $place)
                                            {{ $place['name'] }}<br>
                                        @endforeach
                                    @else
                                        ""
                                    @endif
                                </td>
                                <td>{{ $places->status }}</td>
                                <td>
                                    <a href="{{ route('search-places-rules.edit',$places->id) }}"
                                       data-original-title="@lang("$string_file.edit")" data-toggle="tooltip"
                                       data-placement="top"
                                       class="btn btn-sm btn-warning"> <i
                                                class="wb-edit"></i> </a>
                                </td>
                            </tr>
                            @php $sr++  @endphp
                        @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
@endsection

