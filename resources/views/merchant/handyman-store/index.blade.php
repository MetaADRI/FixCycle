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
                        @if(Auth::user('merchant')->can('add_handyman_stores') )
                            <a href="{{route('merchant.handyman-store/add')}}">
                                <button type="button" title="@lang("$string_file.add") {{$title}}"
                                        class="btn btn-icon btn-success float-right"  style="margin:10px"><i class="wb-plus"></i>
                                </button>
                            </a>
                        @endif
                    </div>
                    <h3 class="panel-title">
                        <i class="fa fa-building" aria-hidden="true"></i>
                        {{$title}}
                    </h3>
                </header>
                <div class="panel-body">
{{--                    {!! $search_view !!}--}}
                    <table class="display nowrap table table-hover table-striped w-full" id="customDataTable" style="width:100%"
                           cellspacing="0">
                        <thead>
                        <tr>
                            <th>@lang("$string_file.sn")</th>
                            <th>@lang("$string_file.contact_details")</th>
                            <th>@lang("$string_file.address")</th>
                            <th>@lang("$string_file.login_url")</th>
                            <th>@lang("$string_file.rating")</th>
                            <th>@lang("$string_file.action")</th>
{{--                            @if(Auth::user('merchant')->can('order_statistics_'.$slug))--}}
{{--                                <th>@lang("$string_file.order_statistics")</th>--}}
{{--                            @endif--}}
                        </tr>
                        </thead>
                        <tbody>
                        @php $sr = $data->firstItem(); @endphp
                        @foreach($data as $handyman_store)
                            <tr>
                                <td>{{ $sr }}</td>
                                <td>
                                    @lang("$string_file.name"): {{ $handyman_store->full_name }} <br>
                                    @lang("$string_file.phone"): {!! is_demo_data($handyman_store->phone_number, $handyman_store->Merchant) !!}
                                </td>
                                <td>
                                    @if(!empty($handyman_store->address))
                                        <a title="{{$handyman_store->address}}"
                                           target="_blank"
                                           href="https://www.google.com/maps/place/{{ $handyman_store->address}}">
                                            @if($handyman_store->business_logo)
                                                <img src="{{get_image($handyman_store->business_logo,'handyman_store_logo',$handyman_store->merchant_id)}}" height="40" width="60">
                                            @else
                                                <span class="btn btn-icon btn-success"><i class="icon wb-map"></i></span>
                                            @endif
                                        </a>
                                    @else
                                        ----
                                    @endif
                                </td>
                                <td>
                                    @php
                                        $merchant_alias = $handyman_store->merchant->alias_name;
                                            $url = "handyman-store/admin/$merchant_alias/$handyman_store->alias_name/login";
                                    @endphp
                                    <a href="{!! URL::to('/'.$url) !!}"
                                       target="_blank" rel="noopener noreferrer"class="btn btn-icon btn-info btn_eye action_btn">
                                        @lang("$string_file.login_url")
                                    </a>
                                    <br>
                                    @lang("$string_file.email"): {{ $handyman_store->email }}
                                </td>
                                <td>{{ $handyman_store->rating }}</td>
                                <td>

                                    @if($handyman_store->status == 1)
                                        <span class="badge badge-success font-size-14">@lang("$string_file.active")</span>
                                    @else
                                        <span class="badge badge-danger">@lang("$string_file.inactive")</span>
                                    @endif
                                    @if(Auth::user('merchant')->can('add_handyman_stores'))
                                        <a href="{{route('merchant.handyman-store/add',['id'=>$handyman_store->id])}}"
                                           data-original-title="@lang("$string_file.edit")" data-toggle="tooltip"
                                           class="btn btn-sm btn-warning">
                                            <i class="wb-edit"></i>
                                        </a>
                                    @endif
                                </td>
{{--                                @if(Auth::user('merchant')->can('order_statistics_'.$slug))--}}
{{--                                    <td class="text-center">--}}
{{--                                        <a href="{{route('merchant.business-segment.statistics',['slug'=>$handyman_store->Segment->slag,'b_id'=>$handyman_store->id])}}"--}}
{{--                                           data-original-title="@lang("$string_file.view_statistics")" data-toggle="tooltip"--}}
{{--                                           class="btn btn-sm btn-success">--}}
{{--                                            <i class="fa fa-eye"></i>--}}
{{--                                        </a>--}}
{{--                                    </td>--}}
{{--                                @endif--}}
                            </tr>
                            @php $sr++  @endphp
                        @endforeach
                        </tbody>
                    </table>
                    @include('merchant.shared.table-footer', ['table_data' => $data, 'data' => $arr_search])
                </div>
            </div>
        </div>
    </div>
    @include('merchant.shared.info-setting',['info_setting'=>$info_setting,'page_name'=>'view_text'])
@endsection


