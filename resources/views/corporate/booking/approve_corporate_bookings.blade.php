@extends('corporate.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
            @include('corporate.shared.errors-and-messages')
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <div class="panel-actions">
{{--                        @if($export_permission)--}}
{{--                            <a href="{{route('excel.complete',$arr_search)}}" data-toggle="tooltip">--}}
{{--                                <button type="button" class="btn btn-icon btn-primary float-right"--}}
{{--                                        style="margin: 10px;">--}}
{{--                                    <i class="wb-download" title="@lang("$string_file.export_excel")"></i>--}}
{{--                                </button>--}}
{{--                            </a>--}}
{{--                           --}}
{{--                        @endif--}}
                    </div>
                    <h3 class="panel-title"><i class="fa-taxi" aria-hidden="true"></i>
                        @lang("$string_file.approve")  @lang("$string_file.bookings")
                    </h3>
                </header>
                <div class="panel-body container-fluid">
                    <table id="customDataTable" class="display nowrap table table-hover table-striped w-full"
                           style="width:100%">
                        <thead>
                        <tr>
                            <th>@lang("$string_file.sn")</th>
                            <th>@lang("$string_file.ride_id")</th>
                            <th>@lang("$string_file.ride_type")</th>
                            <th>@lang("$string_file.user_details")</th>
                            <th>@lang("$string_file.request_from")</th>
                            <th>@lang("$string_file.ride_details")</th>
                            <th>@lang("$string_file.pickup_drop")</th>
                            <th>@lang("$string_file.date")</th>
                            <th>@lang("$string_file.action")</th>
                        </tr>
                        </thead>
                        <tbody>
                        @php $sr = $bookings->firstItem() @endphp
                        @foreach($bookings as $booking)
                            {{-- @if(
                                (isset($booking->User->UserDetail) && $booking->User->UserDetail->is_default_corporate_user == 1)
                                ||
                                (isset($booking->User->UserDetail)
                                    && $booking->User->UserDetail->need_approval_for_corporate == 1
                                    && !empty($booking->corporate_ride_approver))
                                ||
                                (isset($booking->User->UserDetail) && empty(isset($booking->User->UserDetail->need_approval_for_corporate)))
                            ) --}}
                            <tr>
                                <td>{{ $sr }}</td>
                                <td>{{ $booking->merchant_booking_id }}</td>
                                <td>
                                    @if(isset($booking->BookingDetail) && $booking->BookingDetail->is_instant_corporate_ride == 1)
                                        @lang("$string_file.ride_now")
                                    @else
                                        @lang("$string_file.ride_later") <br>(
                                        {!! date(getDateTimeFormat($booking->Merchant->datetime_format,2),strtotime($booking->later_booking_date)) !!}
                                        {{$booking->later_booking_time }} )
                                    @endif
                                </td>

                                <td>
                                     <span class="long_text">
                                         {{ is_demo_data($booking->User->UserName, $booking->Merchant) }}<br>
                                         {{ is_demo_data($booking->User->UserPhone, $booking->Merchant) }}<br>
                                         {{ is_demo_data($booking->User->email, $booking->Merchant) }}
                                    </span>
                                </td>
                                <td>
                                    @switch($booking->platform)
                                        @case(1)
                                            @lang("$string_file.application")
                                            @break
                                        @case(2)
                                            @lang("$string_file.admin")
                                            @break
                                        @case(3)
                                            @lang("$string_file.web")
                                            @break
                                    @endswitch
                                </td>
                                @php
                                    $package_name = ($booking->service_type_id == 2) && !empty($booking->service_package_id) ? ' ('.$booking->ServicePackage->PackageName.')' : '';
                                    $service_text = ($booking->ServiceType) ? $booking->ServiceType->serviceName($booking->merchant_id).$package_name : ($booking->deliveryType ? $booking->deliveryType->name : '---' );
                                @endphp
                                <td>{!! nl2br($booking->CountryArea->CountryAreaName ."\n". $service_text."\n".$booking->VehicleType->VehicleTypeName) !!}</td>

                                <td>
                                    <a title="{{ $booking->pickup_location }}" target="_blank"
                                       href="https://www.google.com/maps/place/{{ $booking->pickup_latitude }},{{ $booking->pickup_longitude }}"
                                       class="btn btn-icon btn-success ml-20"><i class="icon wb-map"></i></a>
                                    <a title="{{ $booking->drop_location }}" target="_blank"
                                       href="https://www.google.com/maps/place/{{ $booking->drop_latitude }},{{ $booking->drop_longitude }}"
                                       class="btn btn-icon btn-danger ml-20"><i class="icon fa-tint"></i></a>
                                </td>
                                <td>
                                    {!! convertTimeToUSERzone($booking->created_at, $booking->CountryArea->timezone,null,$booking->Merchant) !!}

                                </td>
                                <td>
                                    <a href="{{route('approve.corporate.ride')}}?booking_id={{$booking->id}}&approver={{$corporate_default_user->id}}"
                                       class="btn btn-success btn-sm">
                                        Approve
                                    </a>
                                </td>
                            </tr>
                            {{-- @endif --}}
                            @php $sr++  @endphp
                        @endforeach
                        </tbody>
                    </table>
                    @include('merchant.shared.table-footer', ['table_data' => $bookings, 'data' => []])
                </div>
            </div>
        </div>
    </div>
@endsection