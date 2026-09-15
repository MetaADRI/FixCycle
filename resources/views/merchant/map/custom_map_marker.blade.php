@extends('merchant.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
            @include('merchant.shared.errors-and-messages')
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <div class="panel-actions">
                        @if(!empty($info_setting) && $info_setting->view_text != "")
                            <button class="btn btn-icon btn-primary float-right" style="margin:10px"
                                    data-target="#examplePositionSidebar" data-toggle="modal" type="button">
                                <i class="wb-info ml-1 mr-1" title="Info" style=""></i>
                            </button>
                        @endif
                        <a href="{{route("custom.mapmarker.add")}}">
                            <button type="button" class="btn btn-icon btn-success float-right" style="margin:10px">
                            <i class="wb-plus"
                                       title="@lang("$string_file.add_map_marker")"></i>
                            </button>
                        </a>
                    </div>
                    <h3 class="panel-title"><i class="wb-flag" aria-hidden="true"></i>
                        @lang("$string_file.custom_map_marker")
                    </h3>
                </header>
                <div class="panel-body container-fluid">
                    <table class="display nowrap table table-hover table-stripedw-full" id="customDataTable"
                           style="width:100%">
                        <thead>
                        <tr>
                            <th>@lang("$string_file.sn")</th>
                            <th>@lang("$string_file.name")</th>
                            <th>@lang("$string_file.map_marker_image")</th>
                            <th>@lang("$string_file.status")</th>
                        </tr>
                        </thead>
                        <tbody>
                        @php $sr = $map_markers->firstItem() @endphp
                        @foreach($map_markers as $mapMarker)
                            <tr>
                                <td>{{ $sr }}</td>
                                <td>{{$mapMarker->name}}</td>
                                <td>
                                    <img src="{{ get_image($mapMarker->marker_image,'map_marker_image') }}" width="50px" height="50px">
                                </td>
                                <td>
                                    @if($mapMarker->status  == 1)
                                        <span class="badge badge-success">@lang("$string_file.active")</span>
                                    @else
                                        <span class="badge badge-danger">@lang("$string_file.inactive")</span>
                                    @endif
                                </td>
                                
                            </tr>
                            @php $sr++  @endphp
                        @endforeach
                        </tbody>
                    </table>
                    @include('merchant.shared.table-footer', ['table_data' => $map_markers, 'data' => []])
                </div>
            </div>
        </div>
    </div>
@endsection