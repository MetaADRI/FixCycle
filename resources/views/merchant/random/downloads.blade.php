@extends('merchant.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
            @include("merchant.shared.errors-and-messages")
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <div class="panel-actions">

                    </div>
                    <h3 class="panel-title"><i class="fa fa-map" aria-hidden="true"></i>
                        Api Request Logs
                    </h3>
                </header>
                <div class="panel-body container-fluid">
                    <table id="customDataTable" class="display nowrap table table-hover table-striped w-full"
                           style="width:100%">
                        <thead>
                        <tr>
                            <th>@lang("$string_file.sn")</th>
                            <th>@lang("$string_file.data")</th>
                            <th>@lang("$string_file.action")</th>
                            <th>@lang("$string_file.created_at")</th>
                        </tr>
                        </thead>
                        <tbody>
                        @php $sr = $paginated->firstItem() @endphp
                        @foreach($paginated as $usage)
                            <tr>
                                <td>{{ $sr }}</td>
                                <td>
                                    <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#exampleModal" onclick="viewData('{{$usage['usage_record']}}')">
                                        @lang("$string_file.view")
                                    </button>
                                </td>
                                <td>

                                    <a title="@lang("$string_file.delete")"
                                       href="{{ route('merchant.clear.api.request.logs', base64_encode($usage['pattern'])) }}"
                                       class="btn btn-sm btn-danger">
                                        <span class="fa fa-times" title="@lang("$string_file.service_detail")"></span>
                                    </a>
                                </td>
                                <td>
                                    {!! convertTimeToUSERzone($usage['created_at'], null, $usage['merchant_id'], [], 2) !!}
                                </td>

                            </tr>
                            @php $sr++  @endphp
                        @endforeach
                        </tbody>
                    </table>
                    @include('merchant.shared.table-footer', ['table_data' => $paginated, 'data' => $data])
                    {{--                    <div class="pagination1 float-right">{{ $promotions->appends($data)->links() }}</div>--}}
                </div>
            </div>
        </div>
    </div>


    <div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLabel">Api Request Logs </h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    ...
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>
    @include('merchant.shared.info-setting',['info_setting'=>$info_setting,'page_name'=>'view_text'])
@endsection
@section('js')
@endsection