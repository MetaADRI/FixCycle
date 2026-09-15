@extends('merchant.layouts.main')
@section('content')
    <style>
    </style>
    <div class="page">
        <div class="page-content">
            @include("merchant.shared.errors-and-messages")
            @if(!empty($segment_services))
                <div class="panel panel-bordered">
                    <header class="panel-heading">
                        <div class="panel-actions">
                            @if(!empty($info_setting) && $info_setting->view_text != "")
                                <button class="btn btn-icon btn-primary float-right" style="margin:10px"
                                        data-target="#examplePositionSidebar" data-toggle="modal" type="button">
                                    <i class="wb-info ml-1 mr-1" title="Info" style=""></i>
                                </button>
                            @endif
                        </div>
                        <h3 class="panel-title">
                            <i class="fa fa-cog fa-spin" aria-hidden="true"></i>
                            @lang("$string_file.e_hailing") @lang("$string_file.services")</h3>
                    </header>
                    <div id="exampleTransition" class="page-content container-fluid" data-plugin="animateList">
                        <ul class="blocks-sm-100 blocks-xxl-3">
                            @foreach($segment_services as $services)
                                <li>
                                    <div class="panel panel-bordered" style="border: 1px solid #e4eaec;">
                                        <div class="panel-heading">
                                            <a href="">
                                                <h3 class="panel-title segment_class">
                                                    {!! $services['slag'] !!}
                                                </h3>
                                            </a>
                                            <div class="panel-actions">
                                                <img class="img-responsive" height="50px"
                                                     src="{!! $services['segment_icon'] !!}">
                                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                <span style="font-size:20px;">{!! $services['name'] !!}</span>
                                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                {{--                                            @if(Auth::user('merchant')->can('edit_segment'))--}}
                                                <a href="{{ route('merchant.segment.edit',$services['segment_id']) }}"
                                                   class="panel-action" data-toggle="panel-close" aria-hidden="true"
                                                   title="@lang("$string_file.edit")"><i class="fa-pencil"></i> </a>
                                                {{--                                            @endif--}}
                                            </div>
                                        </div>
                                        <div class="panel-body">
                                            @if($services['segment_group_id'] == 2)
                                                <a href="{{ route('merchant.serviceType.edit',$services['segment_id']) }}"
                                                   class="panel-action float-right" data-toggle="panel-close"
                                                   aria-hidden="true" title="@lang('admin.add_service')"><i
                                                            class="fa-plus"></i> </a>
                                            @endif
                                            <div class="example table-responsive">
                                                <table class="table">
                                                    <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>@lang("$string_file.type")</th>
                                                        <th>@lang("$string_file.service_type")</th>
                                                        <th>@lang("$string_file.description")</th>
                                                        <th>@lang("$string_file.sequence")</th>
                                                        <th>@lang("$string_file.icon")</th>
                                                        @if(Auth::user('merchant')->can('edit_service_types'))
                                                            @if($appConfig->show_recommended_services == 1)
                                                                <th>@lang("$string_file.recommended")</th>
                                                            @endif
                                                            <th>@lang("$string_file.action")</th>
                                                        @endif
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    @php $i = 1; @endphp
                                                    @foreach($services['arr_services'] as $service)
                                                        <tr>
                                                            <td>{{$i}}</td>
                                                            <td>{!! $service['serviceName'] !!}</td>
                                                            <td>{!! $service['locale_service_name'] !!}</td>
                                                            <td>{!! $service['locale_service_description'] !!}</td>
                                                            <td>{!! $service['service_sequence'] !!}</td>
                                                            <td>
                                                                {{--@if($services['segment_id'] == 1 || $services['segment_id'] == 2 || $appConfig->show_recommended_services == 1)--}}
                                                                @if(!empty($services['segment_id']) || $appConfig->show_recommended_services == 1)
                                                                    <img class="img-responsive" height="50px" width="50px"
                                                                         src="{!! $service['service_icon'] !!}">
                                                                @else
                                                                    ------
                                                                @endif
                                                            </td>
                                                            @if(Auth::user('merchant')->can('edit_service_types'))
                                                                @if($appConfig->show_recommended_services == 1)
                                                                    <td>
                                                                        <div class="example">
                                                                            <div class="float-left mr-20">
                                                                                @php $status = $service['service_is_recommended'] == 1 ? 0 : 1; @endphp
                                                                                <input type="checkbox" class="changeStatus" service-type-id="{{$service['id']}}" change-status="{{$status}}" id="is_recommended_status_{{$service['id']}}" name="inputiCheckBasicCheckboxes" data-plugin="switchery" @if(isset($service['service_is_recommended']) && $service['service_is_recommended'] == 1) checked @endif />
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                @endif
                                                                <td>
                                                                    <a href="{{ route('merchant.serviceType.edit',[$service['segment_id'],$service['id']]) }}"
                                                                       class="panel-action" data-toggle="panel-close"
                                                                       aria-hidden="true" title="@lang("$string_file.edit")"><i
                                                                                class="fa-pencil"
                                                                                style="padding-left: 19%;"></i> </a>
                                                                </td>
                                                            @endif
                                                            @php $i++; @endphp
                                                        </tr>
                                                    @endforeach
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            @endforeach
                        </ul>
                    </div>
                </div>
                <hr>
            @endif
            @if(!empty($handyman_segment_services))


                <!-- Handyman Store Assign Modal -->
                <div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="exampleModalLabel">Modal title</h5>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <form action="{{ route('merchant.serviceType.assign-to-store') }}" method="post">
                                @csrf
                                <div class="modal-body">
                                    <input type="hidden" name ="segment_id_to_assign" id="segment_id_to_assign" value="">

                                    @if(isset($handyman_stores))
                                        <select class="selectpicker" multiple data-live-search="true" name="stores[]">
                                            @foreach($handyman_stores  as $store)
                                                <option value="{{$store->id}}">{{$store->full_name}}</option>
                                            @endforeach

                                        </select>
                                    @else
                                        <h3>No Store Available</h3>

                                    @endif
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                    <button type="submit" class="btn btn-primary">Save changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                <!-- Handyman Store Assign Modal End -->


                <div class="panel panel-bordered">
                    <header class="panel-heading">
                        <div class="panel-actions">
                            @if(!empty($info_setting) && $info_setting->view_text != "")
                                <button class="btn btn-icon btn-primary float-right" style="margin:10px"
                                        data-target="#examplePositionSidebar" data-toggle="modal" type="button">
                                    <i class="wb-info ml-1 mr-1" title="Info" style=""></i>
                                </button>
                            @endif
                            @if(in_array(2,$merchant_segment_group) && Auth::user('merchant')->can('edit_service_types') && $handyman_segment_creation == 1 )
                                <a href="{{route("merchant.segment.add")}}" class="btn btn-icon btn-success float-right" style="margin:10px" type="button">
                                    <i class="fa fa-plus ml-1 mr-1" title="@lang("$string_file.add") @lang("$string_file.handyman") @lang("$string_file.segment")" style=""></i>
                                </a>
                            @endif
                        </div>
                        <h3 class="panel-title">
                            <i class="fa fa-cog fa-spin" aria-hidden="true"></i>
                            @lang("$string_file.handyman") @lang("$string_file.services")</h3>
                    </header>
                    <div id="exampleTransition" class="page-content container-fluid" data-plugin="animateList">
                        <ul class="blocks-sm-100 blocks-xxl-3">
                            @foreach($handyman_segment_services as $services)
                                <li>
                                    <div class="panel panel-bordered" style="border: 1px solid #e4eaec;">
                                        <div class="panel-heading">
                                            <a href="">
                                                <h3 class="panel-title segment_class">
                                                    {!! $services['slag'] !!}
                                                </h3>
                                            </a>
                                            <div class="panel-actions">
                                                <img class="img-responsive" height="50px"
                                                     src="{!! $services['segment_icon'] !!}">
                                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                <span style="font-size:20px;">{!! $services['name'] !!}</span>
                                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                {{--                                            @if(Auth::user('merchant')->can('edit_segment'))--}}
                                                <a href="{{ route('merchant.segment.edit',$services['segment_id']) }}"
                                                   class="panel-action" data-toggle="panel-close" aria-hidden="true"
                                                   title="@lang("$string_file.edit")"><i class="fa-pencil"></i> </a>
                                                {{--                                            @endif--}}
                                                @if(isset($handyman_stores))
                                                <a href="" id="assign-btn" data-toggle="modal" data-target="#exampleModal" style="color: green; margin-top:7px;"
                                                   class="btn btn-icon btn-success float-right"   onclick="setSegmentId({{$services['segment_id']}})"
                                                   aria-hidden="true" title="@lang('admin.assign_to_store')"><i
                                                            class="fa fa-share"></i> </a>
                                               @endif
                                            </div>
                                        </div>
                                        <div class="panel-body">
                                            @if($services['segment_group_id'] == 2)
                                                <a href="{{ route('merchant.serviceType.edit',$services['segment_id']) }}"
                                                   class="panel-action float-right" data-toggle="panel-close"
                                                   aria-hidden="true" title="@lang('admin.add_service')"><i
                                                            class="fa-plus"></i> </a>
                                            @endif
                                            <div class="example table-responsive">
                                                <table class="table">
                                                    <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>@lang("$string_file.type")</th>
                                                        <th>@lang("$string_file.service_type")</th>
                                                        <th>@lang("$string_file.description")</th>
                                                        <th>@lang("$string_file.sequence")</th>
                                                        <th>@lang("$string_file.icon")</th>
                                                        @if(Auth::user('merchant')->can('edit_service_types'))
                                                            @if($appConfig->show_recommended_services == 1)
                                                                <th>@lang("$string_file.recommended")</th>
                                                            @endif
                                                            <th>@lang("$string_file.action")</th>
                                                        @endif
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    @php $i = 1; @endphp
                                                    @foreach($services['arr_services'] as $service)
                                                        <tr>
                                                            <td>{{$i}}</td>
                                                            <td>{!! $service['serviceName'] !!}</td>
                                                            <td>{!! $service['locale_service_name'] !!}</td>
                                                            <td>{!! $service['locale_service_description'] !!}</td>
                                                            <td>{!! $service['service_sequence'] !!}</td>
                                                            <td>
                                                                {{--@if($services['segment_id'] == 1 || $services['segment_id'] == 2 || $services['segment_id'] == 4 || $appConfig->show_recommended_services == 1)--}}
                                                                @if(!empty($services['segment_id']) || $appConfig->show_recommended_services == 1)
                                                                    <img class="img-responsive" height="50px" width="50px"
                                                                         src="{!! $service['service_icon'] !!}">
                                                                @else
                                                                    ------
                                                                @endif
                                                            </td>
                                                            @if(Auth::user('merchant')->can('edit_service_types'))
                                                                @if($appConfig->show_recommended_services == 1)
                                                                    <td>
                                                                        <div class="example">
                                                                            <div class="float-left mr-20">
                                                                                @php $status = $service['service_is_recommended'] == 1 ? 0 : 1; @endphp
                                                                                <input type="checkbox" class="changeStatus" service-type-id="{{$service['id']}}" change-status="{{$status}}" id="is_recommended_status_{{$service['id']}}" name="inputiCheckBasicCheckboxes" data-plugin="switchery" @if(isset($service['service_is_recommended']) && $service['service_is_recommended'] == 1) checked @endif />
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                @endif
                                                                <td>
                                                                    <a href="{{ route('merchant.serviceType.edit',[$service['segment_id'],$service['id']]) }}"
                                                                       class="panel-action" data-toggle="panel-close"
                                                                       aria-hidden="true" title="@lang("$string_file.edit")"><i
                                                                                class="fa-pencil"
                                                                                style="padding-left: 19%;"></i> </a>
                                                                </td>
                                                            @endif
                                                            @php $i++; @endphp
                                                        </tr>
                                                    @endforeach
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            @endforeach
                        </ul>
                    </div>
                </div>
            @endif
        </div>
    </div>
    @include('merchant.shared.info-setting',['info_setting'=>$info_setting,'page_name'=>'view_text'])
@endsection
@section('js')
    <script>
        $(".changeStatus").change(function(){
            var service_id = $(this).attr("service-type-id");
            var change_status = $(this).attr("change-status");
            var url = "{{route("merchant.serviceType.changestatus")}}"+"/"+service_id+"/"+change_status;
            $.ajax({
                type: "GET",
                url: url,
            }).done(function (data) {
                swal({
                    title: "Status Updated!",
                    text: data,
                    type: "success",
                });
                window.location.href = "{{ route('merchant.serviceType.index') }}";
            });
        });
    </script>

    <script !src="">
        function setSegmentId(id){
        console.log(id)
            $("#segment_id_to_assign").val(id)
        }
        $('.selectpicker').selectpicker('selectAll');
    </script>
@endsection
