@extends('merchant.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
            @include('merchant.shared.errors-and-messages')
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <div class="mr--10 ml--10">
                        <div class="row " style="margin-right: 0rem;margin-left: 0rem">
                            <div class="col-md-2 col-sm-5">
                                <h3 class="panel-title"><i class="fa-users" aria-hidden="true"></i>
                                    @lang("$string_file.excel") @lang("$string_file.export")</h3>
                            </div>
                            <div class="col-md-10 col-sm-7">
                                @if(!empty($info_setting) && $info_setting->view_text != "")
                                    <button class="btn btn-icon btn-primary float-right" style="margin:10px"
                                            data-target="#examplePositionSidebar" data-toggle="modal" type="button">
                                        <i class="wb-info ml-1 mr-1" title="Info" style=""></i>
                                    </button>
                                @endif
                                

                            </div>
                        </div>
                        <div class="row " style="margin-right: 0rem;margin-left: 0rem">
                            
                        </div>
                    </div>
                </header>
                <div class="panel-body container-fluid">
                    <table id="customDataTable" class="display nowrap table table-hover table-striped w-full"
                           style="">
                        <thead>
                        <tr>
                            <th> @lang("$string_file.id")</th>
                            <th>@lang("$string_file.filename") </th>
                            <th>@lang("$string_file.status")</th>
                            <th>@lang("$string_file.action")</th>
                            <th>@lang("$string_file.delete")</th>
                            <th>@lang("$string_file.created_at") </th>
                        </tr>
                        </thead>
                        <tbody>
                        @php $sr = 1; @endphp
                        @foreach($excelExportLogs as $log)
                        <tr>
                        <td>{{$log->id}}</td>
                        <td>{{$log->filename}}</td>
                        <td>
                            @if($log->status == 1)
                                <button class="btn btn-icon btn-success"  type="button">@lang("$string_file.completed")</button>
                            @else
                                <button class="btn btn-icon btn-warning"  type="button">@lang("$string_file.processing")</button>
                            @endif
                        </td>
                        <td>
                            @if($log->status == 1 && !empty($log->location))
                                <a href="{{route('merchant.driver.export.download', ['id'=> $log->id])}}" 
                                   class="btn btn-icon btn-primary">
                                    <i class="fa fa-download"></i> 
                                </a>
                                
                                
                            @else
                                <button class="btn btn-icon btn-secondary" type="button" disabled>
                                    <i class="fa fa-download"></i>
                                </button>
                            @endif
                        </td>
                        <td>
                            
                             <button onclick="DeleteEvent({{$log->id}})"
                                        type="submit"
                                        data-original-title="@lang("$string_file.delete")"
                                        data-toggle="tooltip"
                                        data-placement="top"
                                        class="btn btn-sm btn-danger menu-icon btn_delete action_btn">
                                    <i
                                            class="fa fa-trash"></i></button>

                        </td>
                        <td>{{$log->created_at}}</td>
                        </tr>
                        
                        @endforeach
                        </tbody>
                    </table>
                    {{-- @include('merchant.shared.table-footer', ['table_data' => $drivers, 'data' => $arr_search]) --}}
                    {{--                    <div class="pagination1 float-right">{{ $drivers->appends($arr_search)->links() }}</div>--}}
                </div>
            </div>
        </div>
    </div>
    
    @include('merchant.shared.info-setting',['info_setting'=>$info_setting,'page_name'=>'view_text'])
@endsection
@section('js')
<script>
    function DeleteEvent(id) {
        swal({
            title: "@lang('$string_file.are_you_sure')",
            text: "@lang('$string_file.delete_warning')",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((isConfirm) => {
            if (isConfirm) {
                $.ajax({
                    type: "GET",
                    url: "{{ route('merchant.driver.export.delete', ':id') }}".replace(':id', id),
                    beforeSend: function () {
                        // optional: show loader or disable button
                    },
                    success: function (response) {
                        swal({
                            title: "@lang('$string_file.deleted')",
                            text: response.message || "@lang('$string_file.file_deleted_successfully')",
                            icon: "success",
                        }).then(() => {
                            // either reload the page
                            location.reload();
    
                            // OR just remove the deleted row:
                            // $('button[onclick="DeleteEvent(' + id + ')"]').closest('tr').fadeOut();
                        });
                    },
                    error: function (xhr) {
                        swal({
                            title: "Error",
                            text: xhr.responseJSON?.message || "Something went wrong!",
                            icon: "error",
                        });
                    }
                });
            } else {
                swal("@lang('$string_file.data_is_safe')");
            }
        });
    }

</script>
@endsection
